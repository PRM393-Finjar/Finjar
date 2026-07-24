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
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "premium_expires_at",
                table: "accounts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "se_pay_webhook_api_key",
                table: "accounts",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "group_jars",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    target_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    current_balance = table.Column<decimal>(type: "numeric", nullable: false),
                    currency = table.Column<string>(type: "text", nullable: false),
                    color = table.Column<string>(type: "text", nullable: true),
                    icon = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_group_jars", x => x.id);
                    table.ForeignKey(
                        name: "fk_group_jars_accounts_owner_id",
                        column: x => x.owner_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "pending_registrations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    otp_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    otp_expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pending_registrations", x => x.id);
                });

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

            migrationBuilder.CreateTable(
                name: "group_jar_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_jar_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    joined_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_group_jar_members", x => x.id);
                    table.ForeignKey(
                        name: "fk_group_jar_members_accounts_user_id",
                        column: x => x.user_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_group_jar_members_group_jars_group_jar_id",
                        column: x => x.group_jar_id,
                        principalTable: "group_jars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group_jar_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    group_jar_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_id = table.Column<Guid>(type: "uuid", nullable: false),
                    message_type = table.Column<string>(type: "text", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    deposit_amount = table.Column<decimal>(type: "numeric", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_group_jar_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_group_jar_messages_accounts_sender_id",
                        column: x => x.sender_id,
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_group_jar_messages_group_jars_group_jar_id",
                        column: x => x.group_jar_id,
                        principalTable: "group_jars",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_accounts_premium_expires_at",
                table: "accounts",
                column: "premium_expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_group_jar_members_group_jar_id",
                table: "group_jar_members",
                column: "group_jar_id");

            migrationBuilder.CreateIndex(
                name: "ix_group_jar_members_user_id",
                table: "group_jar_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_group_jar_messages_group_jar_id",
                table: "group_jar_messages",
                column: "group_jar_id");

            migrationBuilder.CreateIndex(
                name: "ix_group_jar_messages_sender_id",
                table: "group_jar_messages",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "ix_group_jars_owner_id",
                table: "group_jars",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "ix_pending_registrations_email",
                table: "pending_registrations",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_pending_registrations_username",
                table: "pending_registrations",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_subscription_payments_account_id",
                table: "subscription_payments",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "ix_subscription_payments_order_code",
                table: "subscription_payments",
                column: "order_code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "group_jar_members");

            migrationBuilder.DropTable(
                name: "group_jar_messages");

            migrationBuilder.DropTable(
                name: "pending_registrations");

            migrationBuilder.DropTable(
                name: "subscription_payments");

            migrationBuilder.DropTable(
                name: "group_jars");

            migrationBuilder.DropIndex(
                name: "ix_accounts_premium_expires_at",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "premium_expires_at",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "se_pay_webhook_api_key",
                table: "accounts");
        }
    }
}
