# Finjar — Quản lý tài chính cá nhân

Monorepo nhóm PRM393 (Web + API + Docs):

| Thư mục | Mô tả |
|---------|--------|
| `FE_QLTC/` | Web app React + Vite + TypeScript |
| `Personal_Finance_App_Be-main/` | API .NET 8 |
| `docs/` | Tài liệu (Flutter mobile, hướng dẫn team) |

**Tổ chức:** [PRM393-Finjar](https://github.com/PRM393-Finjar)

## Chạy nhanh

**Backend:** mở solution trong `Personal_Finance_App_Be-main/Personal_Finance_App_Be-main/`, cấu hình `appsettings` local (không commit), chạy API (mặc định `http://localhost:5284`).

**Frontend:**

```bash
cd FE_QLTC
npm install
# tạo .env.local: VITE_API_LOCAL_URL=http://localhost:5284/api/v1
npm run dev
```

Chi tiết mobile Flutter: `docs/MOBILE_FLUTTER_HUONG_DAN.md`.
