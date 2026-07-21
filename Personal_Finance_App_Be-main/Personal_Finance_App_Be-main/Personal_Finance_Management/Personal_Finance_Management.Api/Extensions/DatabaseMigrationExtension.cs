using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Repository;

namespace Personal_Finance_Management.Api.Extensions;

public static class DatabaseMigrationExtension
{
    public static string GetAppDatabaseConnectionString(this WebApplicationBuilder builder)
    {
        // hien: khuc nay dung de xac dinh app dang chay local hay hosting dua tren environment
        var connectionName = builder.Environment.IsDevelopment()
            ? "DefaultConnection"
            : "RenderConnection";

        // hien: khuc nay dung de lay connection string dung voi moi truong hien tai
        var connectionString = builder.Configuration.GetConnectionString(connectionName);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Missing database connection string '{connectionName}' for environment '{builder.Environment.EnvironmentName}'."
            );
        }
        return NormalizeConnectionString(connectionString);
    }

    // hien: khuc nay dung de chuyen chuoi ket noi dang URL (postgres://) ma Render cap sang dinh dang Npgsql
    private static string NormalizeConnectionString(string connectionString)
    {
        if (!connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return connectionString;
        }

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);

        var npgsqlBuilder = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            SslMode = Npgsql.SslMode.Prefer,
            TrustServerCertificate = true
        };

        return npgsqlBuilder.ConnectionString;
    }

    public static void ApplyDatabaseMigrations(this WebApplication app)
    {
        // Production / seed luôn cần schema. Local chỉ migrate khi bật ApplyMigrations.
        var applyMigrations = app.Configuration.GetValue<bool>("ApplyMigrations")
            || !app.Environment.IsDevelopment()
            || app.Configuration.GetValue<bool>("SeedAccounts:Enabled");

        if (!applyMigrations)
        {
            return;
        }

        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("DatabaseMigration");

        logger.LogInformation("Applying EF Core migrations...");
        dbContext.Database.Migrate();
        logger.LogInformation("EF Core migrations applied.");
    }
}
