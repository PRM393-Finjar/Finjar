"""
Minimal Vision OCR HTTP service for FinJar.

Contract expected by Personal_Finance_Management.Service.ocr.Service:
  POST /ocr?layout=invoice|document|none
  multipart form field: file
  JSON: { "text": "...", "boxes": [ { "text": "...", "bbox": [x1,y1,x2,y2], "score": 0.9 } ] }
"""

from __future__ import annotations

import base64
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from rapidocr_onnxruntime import RapidOCR

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

app = FastAPI(title="FinJar OCR Service", version="1.1.0")

ALLOWED_LAYOUTS = {"none", "invoice", "document"}
MIME_BY_EXT = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".gif": "image/gif",
}

_engine: RapidOCR | None = None


def get_engine() -> RapidOCR:
    global _engine
    if _engine is None:
        _engine = RapidOCR()
    return _engine


def _api_key() -> str:
    return (os.getenv("GOOGLE_AI_API_KEY") or os.getenv("GoogleAI__ApiKey") or "").strip()


def _model() -> str:
    return (os.getenv("GOOGLE_AI_MODEL") or "gemini-2.5-flash").strip()


def _provider() -> str:
    configured = (os.getenv("OCR_PROVIDER") or "auto").strip().lower()
    if configured in {"rapid", "gemini", "auto"}:
        return configured
    return "auto"


def _mime_type(filename: str | None, content_type: str | None) -> str:
    if content_type and content_type != "application/octet-stream":
        return content_type
    if filename:
        ext = os.path.splitext(filename)[1].lower()
        if ext in MIME_BY_EXT:
            return MIME_BY_EXT[ext]
    return "image/jpeg"


def _bbox_from_points(points: list[Any]) -> list[float] | None:
    xs: list[float] = []
    ys: list[float] = []
    for point in points:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            continue
        try:
            xs.append(float(point[0]))
            ys.append(float(point[1]))
        except (TypeError, ValueError):
            continue
    if not xs or not ys:
        return None
    return [min(xs), min(ys), max(xs), max(ys)]


def _rapid_ocr(image_bytes: bytes, suffix: str) -> dict[str, Any]:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        result, _elapse = get_engine()(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    boxes: list[dict[str, Any]] = []
    lines: list[str] = []
    if result:
        for item in result:
            if not item or len(item) < 2:
                continue
            points, text = item[0], item[1]
            score = float(item[2]) if len(item) > 2 else 0.9
            if not isinstance(text, str) or not text.strip():
                continue
            bbox = _bbox_from_points(points) if isinstance(points, list) else None
            if bbox is None:
                continue
            cleaned = text.strip()
            lines.append(cleaned)
            boxes.append({"text": cleaned, "bbox": bbox, "score": score})

    if not boxes:
        raise HTTPException(status_code=422, detail="OCR returned no text.")

    return {
        "text": "\n".join(lines),
        "boxes": boxes,
        "provider": "rapidocr",
    }


def _extract_json_object(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        raise ValueError("Model response did not contain JSON.")
    data = json.loads(match.group(0))
    if not isinstance(data, dict):
        raise ValueError("Model JSON root must be an object.")
    return data


def _lines_from_payload(payload: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    raw_lines = payload.get("lines")
    if isinstance(raw_lines, list):
        for item in raw_lines:
            if isinstance(item, str) and item.strip():
                lines.append(item.strip())
            elif isinstance(item, dict):
                value = item.get("text")
                if isinstance(value, str) and value.strip():
                    lines.append(value.strip())

    if lines:
        return lines

    text = payload.get("text")
    if isinstance(text, str) and text.strip():
        return [part.strip() for part in re.split(r"\r?\n+", text) if part.strip()]
    return []


def _boxes_from_lines(lines: list[str]) -> list[dict[str, Any]]:
    boxes: list[dict[str, Any]] = []
    y = 20.0
    line_height = 28.0
    for line in lines:
        money_match = re.search(r"([\d][\d.,]*)\s*(?:vnd|đ|dong)?\s*$", line, flags=re.IGNORECASE)
        if money_match and money_match.start() > 0:
            left = line[: money_match.start()].strip(" :-")
            right = money_match.group(1).strip()
            if left:
                boxes.append(
                    {
                        "text": left,
                        "bbox": [20.0, y, 420.0, y + line_height],
                        "score": 0.92,
                    }
                )
            boxes.append(
                {
                    "text": right,
                    "bbox": [440.0, y, 780.0, y + line_height],
                    "score": 0.92,
                }
            )
        else:
            boxes.append(
                {
                    "text": line,
                    "bbox": [20.0, y, 780.0, y + line_height],
                    "score": 0.9,
                }
            )
        y += line_height + 8.0
    return boxes


async def _gemini_ocr(image_bytes: bytes, mime_type: str, layout: str) -> dict[str, Any]:
    key = _api_key()
    if not key:
        raise HTTPException(status_code=500, detail="GOOGLE_AI_API_KEY is not configured.")

    prompt = (
        "You are an OCR engine for Vietnamese/English receipts and invoices. "
        f"Layout hint: {layout}. "
        "Read ALL visible text from the image in reading order (top to bottom, left to right). "
        "Return ONLY valid JSON with this schema:\n"
        "{\n"
        '  "text": "full plain text with newlines",\n'
        '  "lines": ["line 1", "line 2"]\n'
        "}\n"
        "Rules:\n"
        "- Preserve numbers, dates, currency symbols, and merchant names exactly.\n"
        "- Prefer one logical receipt line per array item.\n"
        "- Do not invent text that is not visible.\n"
        "- No markdown, no explanation."
    )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{_model()}:generateContent"
        f"?key={key}"
    )
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64.b64encode(image_bytes).decode("ascii"),
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
        },
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(url, json=body)

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini OCR failed ({response.status_code}): {response.text[:500]}",
        )

    data = response.json()
    try:
        parts = data["candidates"][0]["content"]["parts"]
        raw_text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
    except (KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail=f"Unexpected Gemini response: {exc}") from exc

    try:
        payload = _extract_json_object(raw_text)
    except (ValueError, json.JSONDecodeError):
        lines = [part.strip() for part in re.split(r"\r?\n+", raw_text) if part.strip()]
        payload = {"text": "\n".join(lines), "lines": lines}

    lines = _lines_from_payload(payload)
    if not lines:
        raise HTTPException(status_code=422, detail="OCR returned no text.")

    text = payload.get("text") if isinstance(payload.get("text"), str) else "\n".join(lines)
    return {
        "text": text.strip() if isinstance(text, str) else "\n".join(lines),
        "boxes": _boxes_from_lines(lines),
        "provider": "gemini",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "provider": _provider()}


@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    layout: str = Query("none"),
) -> dict[str, Any]:
    selected = (layout or "none").strip().lower()
    if selected not in ALLOWED_LAYOUTS:
        selected = "none"

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    mime_type = _mime_type(file.filename, file.content_type)
    suffix = Path(file.filename or "upload.png").suffix.lower() or ".png"
    provider = _provider()

    if provider == "gemini":
        result = await _gemini_ocr(image_bytes, mime_type, selected)
    elif provider == "rapid":
        result = _rapid_ocr(image_bytes, suffix)
    else:
        # Prefer local RapidOCR; fall back to Gemini only when a key is present.
        try:
            result = _rapid_ocr(image_bytes, suffix)
        except HTTPException:
            if not _api_key():
                raise
            result = await _gemini_ocr(image_bytes, mime_type, selected)

    result["layout"] = selected
    return result


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("OCR_HOST", "0.0.0.0")
    port = int(os.getenv("OCR_PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
