# Persional_finance_App_Be

## SePay Bank Sync MVP

Environment:

```text
SePay__WebhookApiKey=replace-with-the-api-key-configured-in-sepay
```

Existing local PostgreSQL databases may still have the old
`chk_financial_accounts_sync_status` constraint. Run this once from the repo
root before testing SePay connect/webhooks:

```powershell
Get-Content .\database\fix_sepay_constraint.sql | docker exec -i finjar-postgres psql -U postgres -d PersonalFinanceManagementDb
```

New databases that apply EF migration
`20260722070000_AddActiveFinancialAccountSyncStatus` do not need the manual SQL.

Connect account:

```http
POST /api/v1/financial-accounts/sepay/connect
```

Connection status:

```http
GET /api/v1/financial-accounts/sepay/status
```

Receive webhook:

```http
POST /api/v1/transactions/SePay
Authorization: Apikey <SePay__WebhookApiKey>
```

The webhook creates `Imported` transactions and updates `FinancialAccount.CurrentBalance`. This MVP does not implement direct bank API, Open Banking, or OAuth.
