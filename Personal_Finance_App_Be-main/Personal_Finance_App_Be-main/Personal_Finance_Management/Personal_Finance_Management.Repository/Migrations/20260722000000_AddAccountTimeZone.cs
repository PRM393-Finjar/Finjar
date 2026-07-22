using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Personal_Finance_Management.Repository;

#nullable disable

namespace Personal_Finance_Management.Repository.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260722000000_AddAccountTimeZone")]
    public partial class AddAccountTimeZone : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "time_zone_id",
                table: "accounts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "quota_time_zone_id",
                table: "accounts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "quota_time_zone_change_effective_at",
                table: "accounts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_transactions_user_created_at",
                table: "transactions",
                columns: new[] { "user_id", "created_at" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_transactions_user_created_at",
                table: "transactions");

            migrationBuilder.DropColumn(
                name: "time_zone_id",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "quota_time_zone_id",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "quota_time_zone_change_effective_at",
                table: "accounts");
        }
    }
}
