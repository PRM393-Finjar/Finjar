using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Personal_Finance_Management.Repository;

#nullable disable

namespace Personal_Finance_Management.Repository.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260721030000_AddPremiumSubscription")]
    public partial class AddPremiumSubscription : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "premium_expires_at",
                table: "accounts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "subscription_payments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    account_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_code = table.Column<long>(type: "bigint", nullable: false),
                    amount = table.Column<int>(type: "integer", nullable: false),
                    duration_days = table.Column<int>(type: "integer", nullable: false, defaultValue: 30),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    payment_link_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    checkout_url = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: true),
                    pay_os_reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    transaction_date_time = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_subscription_payments", x => x.id);
                    table.ForeignKey(
                        name: "fk_subscription_payments_accounts_account_id",
                        column: x => x.account_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_subscription_payments_order_code",
                table: "subscription_payments",
                column: "order_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_subscription_payments_account_id",
                table: "subscription_payments",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_accounts_premium_expires_at",
                table: "accounts",
                column: "premium_expires_at");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "subscription_payments");
            migrationBuilder.DropIndex(name: "ix_accounts_premium_expires_at", table: "accounts");
            migrationBuilder.DropColumn(name: "premium_expires_at", table: "accounts");
        }
    }
}
