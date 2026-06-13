# Dữ liệu test mẫu — Finjar

## Tài khoản seed (backend local)

Khi chạy API với `SeedAccounts.Enabled: true` trong `appsettings.json`, hệ thống tự tạo 2 user:

| Vai trò | Email | Mật khẩu | Username |
|---------|-------|----------|----------|
| **User** | `anhvietanh1123@gmail.com` | `User@123456` | `hiendepzai` |
| **Admin** | `admin@gmail.com` | `Admin@123456` | `admindz` |

**Đăng nhập mobile/web:** dùng **Email** + **Mật khẩu** (không dùng username).

## Đăng ký tài khoản mới (ví dụ)

| Trường | Giá trị mẫu |
|--------|------------|
| Họ và tên | `Nguyễn Văn A` |
| Email | `vana.test@finjar.local` |
| Mật khẩu | `User@123456` |

> Đổi email nếu báo "đã tồn tại". Username tự lấy từ phần trước `@` nếu không nhập.

## Chạy trước khi test

```powershell
# 1. PostgreSQL chạy tại localhost:5432
# 2. Backend
cd Personal_Finance_App_Be-main\Personal_Finance_App_Be-main\Personal_Finance_Management\Personal_Finance_Management.Api
dotnet run --launch-profile http

# 3. Mobile
cd mobile
flutter run -d chrome --web-port=5173 --dart-define=API_BASE_URL=http://localhost:5284/api/v1
```

API: `http://localhost:5284/api/v1`

## Đăng nhập thất bại?

1. **Kiểm tra backend:** mở `http://localhost:5284/swagger` — nếu không vào được thì API chưa chạy.
2. **Kiểm tra PostgreSQL:** port `5432` phải mở (Docker Desktop hoặc Postgres cài local).
3. **Flutter web:** backend phải cho CORS `localhost` (đã cấu hình trong `Program.cs` cho Development).
4. App sẽ báo rõ *"Không kết nối được backend..."* nếu API/DB chưa bật — không phải do sai mật khẩu.
