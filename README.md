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
Get-Content .\database\fix_sepay_constraint.sql | docker exec -i personal-finance-postgres psql -U postgres -d PersonalFinanceManagementDb
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

**Lấy nhánh `nhutruong`:**

```bash
git fetch origin
git checkout nhutruong
git pull
```

**Backend + PostgreSQL bằng Docker Compose:**

```powershell
cd Personal_Finance_App_Be-main\Personal_Finance_App_Be-main
docker compose up --build
# API: http://localhost:5284
# Swagger: http://localhost:5284/swagger
```

Backend đã có `appsettings.json` local-safe trong repo. Nếu chạy bằng Docker Compose thì PostgreSQL cũng được tạo tự động.

**Backend bằng `dotnet run` nếu không dùng full Compose (chỉ cần Postgres):**

```powershell
cd Personal_Finance_App_Be-main\Personal_Finance_App_Be-main
docker compose up -d db
# DB: personal-finance-postgres @ localhost:5432 / PersonalFinanceManagementDb / postgres / postgres123
cd Personal_Finance_Management\Personal_Finance_Management.Api
dotnet run --launch-profile http
# API: http://localhost:5284
```

**Frontend:**

```bash
cd FE_QLTC
npm install
npm run dev
```

**Chạy cả 3 (BE + FE + Mobile):**

```powershell
# 1. Backend + PostgreSQL — terminal 1
cd Personal_Finance_App_Be-main\Personal_Finance_App_Be-main
docker compose up --build

# 2. Web FE — terminal 2
cd FE_QLTC
npm install
npm run dev

# 3. Mobile — terminal 3
cd mobile
flutter run -d chrome --web-port=5174 --dart-define=API_BASE_URL=http://localhost:5284/api/v1
```

Nếu muốn chạy backend không qua Docker Compose:

```powershell
docker run -d --name personal-finance-postgres -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=PersonalFinanceManagementDb -p 5432:5432 postgres:16
cd Personal_Finance_App_Be-main\Personal_Finance_App_Be-main\Personal_Finance_Management\Personal_Finance_Management.Api
dotnet run --launch-profile http
```

Chi tiết mobile Flutter: `docs/MOBILE_FLUTTER_HUONG_DAN.md`.

**Tài khoản test:** xem `docs/TEST_DATA.md` (user: `anhvietanh1123@gmail.com` / `User@123456`).
