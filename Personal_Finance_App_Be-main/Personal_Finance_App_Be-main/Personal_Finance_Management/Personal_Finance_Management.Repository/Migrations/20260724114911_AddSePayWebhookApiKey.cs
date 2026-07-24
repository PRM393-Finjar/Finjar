using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Personal_Finance_Management.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddSePayWebhookApiKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "se_pay_webhook_api_key",
                table: "accounts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "se_pay_webhook_api_key",
                table: "accounts");
        }
    }
}
