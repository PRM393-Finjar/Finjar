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

**Chạy cả 3 (BE + FE + Mobile):**

```powershell
# 1. PostgreSQL (Docker, một lần)
docker run -d --name personal-finance-postgres -e POSTGRES_PASSWORD=MyStrongPassword123@ -e POSTGRES_DB=PersonalFinanceManagementDb -p 5432:5432 postgres:16

# 2. Backend — terminal 1
cd Personal_Finance_App_Be-main\Personal_Finance_App_Be-main\Personal_Finance_Management\Personal_Finance_Management.Api
dotnet run --launch-profile http

# 3. Web FE — terminal 2
cd FE_QLTC
npm run dev
# → http://localhost:5173 (hoặc 5174 nếu 5173 đã dùng)

# 4. Mobile — terminal 3
cd mobile
flutter run -d chrome --web-port=5173 --dart-define=API_BASE_URL=http://localhost:5284/api/v1
# → http://localhost:5173
```

Chi tiết mobile Flutter: `docs/MOBILE_FLUTTER_HUONG_DAN.md`.

**Tài khoản test:** xem `docs/TEST_DATA.md` (user: `anhvietanh1123@gmail.com` / `User@123456`).
