using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Personal_Finance_Management.Repository.Migrations
{
    public partial class AddTransactionExternalIdUniqueIndex : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_transactions_account_external_id",
                table: "transactions",
                columns: new[] { "financial_account_id", "external_transaction_id" },
                unique: true,
                filter: "\"external_transaction_id\" IS NOT NULL AND \"is_deleted\" = FALSE");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_transactions_account_external_id",
                table: "transactions");
        }
    }
}
