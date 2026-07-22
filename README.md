# Finjar — Quản lý tài chính cá nhân

Monorepo nhóm PRM393 (Web + API + Docs):

## SePay Bank Sync MVP

Backend environment:

```text
SePay__WebhookApiKey=replace-with-the-api-key-configured-in-sepay
```

For an existing local PostgreSQL database, run this once after pulling SePay
changes so `financial_accounts.sync_status` accepts `Active`:

```powershell
Get-Content .\database\fix_sepay_constraint.sql | docker exec -i finjar-postgres psql -U postgres -d PersonalFinanceManagementDb
```

Clean databases that run the EF migration
`20260722070000_AddActiveFinancialAccountSyncStatus` already get the same
constraint automatically. The SQL file is for local databases that were created
before the fix or were patched manually during testing.

SePay webhook URL:

```text
https://<api-domain>/api/v1/transactions/SePay
```

Use SePay API Key authentication. SePay sends `Authorization: Apikey <key>`.

Finjar MVP only receives SePay webhooks, creates imported `Income`/`Expense` transactions, updates `FinancialAccount.CurrentBalance`, and lets the dashboard read the latest database state. It does not implement direct bank API, Open Banking, or OAuth.

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
