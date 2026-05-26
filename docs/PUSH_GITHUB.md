# Push lên GitHub — PRM393-Finjar

Repo local đã sẵn sàng (chỉ 3 thư mục: `docs/`, `FE_QLTC/`, `Personal_Finance_App_Be-main/`).

## Bước 1 — Tạo repo trên org (làm một lần)

1. Đăng nhập GitHub, vào [PRM393-Finjar](https://github.com/PRM393-Finjar).
2. **New repository**
   - **Repository name:** `Finjar` (hoặc tên nhóm thống nhất)
   - **Private** (khuyến nghị)
   - **Không** tick "Add a README" / .gitignore (repo trống)
3. **Create repository**

## Bước 2 — Push từ máy local

Mở terminal tại `d:\User\Downloads\Finance`:

```powershell
cd d:\User\Downloads\Finance

# Nếu tên repo khác Finjar, sửa URL:
git remote set-url origin https://github.com/PRM393-Finjar/Finjar.git

git push -u origin main
```

Đăng nhập GitHub khi được hỏi (hoặc dùng [Personal Access Token](https://github.com/settings/tokens) thay mật khẩu).

### SSH (tùy chọn)

```powershell
git remote set-url origin git@github.com:PRM393-Finjar/Finjar.git
git push -u origin main
```

## Đã làm sẵn trên máy bạn

| Việc | Trạng thái |
|------|------------|
| `git init` tại thư mục Finance | ✅ |
| Commit `main` (3 thư mục con) | ✅ |
| Remote `origin` → `PRM393-Finjar/Finjar` | ✅ |
| Push lên GitHub | ⏳ Cần tạo repo trên org trước |

## Lưu ý bảo mật

- `.env`, `appsettings.json` **không** được commit (đã có trong `.gitignore`).
- Clone sau này: mỗi dev tự tạo `.env.local` / `appsettings.Development.json` local.
