-- Fix existing local PostgreSQL databases where the EF migration history says
-- the SePay sync-status migration already ran, but the check constraint still
-- does not allow sync_status = 'Active'.
--
-- Safe to run more than once.

BEGIN;

ALTER TABLE financial_accounts
    DROP CONSTRAINT IF EXISTS chk_financial_accounts_sync_status;

ALTER TABLE financial_accounts
    ADD CONSTRAINT chk_financial_accounts_sync_status
    CHECK (sync_status IN (
        'NeverSynced',
        'Synced',
        'Syncing',
        'Error',
        'Disconnected',
        'Active'
    ));

COMMIT;
