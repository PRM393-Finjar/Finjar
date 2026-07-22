using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Personal_Finance_Management.Repository.Migrations
{
    public partial class AddActiveFinancialAccountSyncStatus : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_financial_accounts_sync_status",
                table: "financial_accounts");

            migrationBuilder.AddCheckConstraint(
                name: "chk_financial_accounts_sync_status",
                table: "financial_accounts",
                sql: "\"sync_status\" IN ('NeverSynced','Synced','Syncing','Error','Disconnected','Active')");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_financial_accounts_sync_status",
                table: "financial_accounts");

            migrationBuilder.AddCheckConstraint(
                name: "chk_financial_accounts_sync_status",
                table: "financial_accounts",
                sql: "\"sync_status\" IN ('NeverSynced','Synced','Syncing','Error','Disconnected')");
        }
    }
}
