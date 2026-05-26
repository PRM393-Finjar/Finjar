const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function readImageFileAsDataUrl(
  file: File,
  maxBytes = MAX_AVATAR_BYTES,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Chỉ chấp nhận file ảnh."));
  }
  if (file.size > maxBytes) {
    return Promise.reject(new Error("Ảnh tối đa 2MB."));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Không đọc được ảnh."));
    };
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(file);
  });
}
