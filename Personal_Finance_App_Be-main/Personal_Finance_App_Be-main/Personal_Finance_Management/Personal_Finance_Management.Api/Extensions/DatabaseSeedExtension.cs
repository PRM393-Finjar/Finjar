using Personal_Finance_Management.Service.Seeding;

namespace Personal_Finance_Management.Api.Extensions;

public static class DatabaseSeedExtension
{
    public static async Task SeedConfiguredAccountsAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger("DatabaseSeed");

        try
        {
            var seedService = scope.ServiceProvider.GetRequiredService<DatabaseSeedService>();
            await seedService.SeedAsync();
            logger.LogInformation("Seed accounts completed.");
        }
        catch (Exception ex)
        {
            // Không crash toàn bộ service nếu seed lỗi — vẫn cho API chạy để health/debug.
            logger.LogError(ex, "Seed accounts failed. API will continue starting.");
        }
    }
}
