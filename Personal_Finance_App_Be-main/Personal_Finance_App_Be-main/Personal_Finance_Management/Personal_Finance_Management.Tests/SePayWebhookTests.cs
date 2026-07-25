using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Service.Validations;
using TransactionRequest = Personal_Finance_Management.Service.Transaction.Request;
using TransactionService = Personal_Finance_Management.Service.Transaction.Service;
using Xunit;

namespace Personal_Finance_Management.Tests;

public class SePayWebhookTests
{
    private const string WebhookApiKey = "test-sepay-key";
    private const string AccountNumber = "0123456789";

    [Fact]
    public async Task IncomeWebhook_CreatesIncomeTransaction_AndIncrementsBalance()
    {
        await using var db = CreateDbContext();
        var account = SeedSePayAccount(db, 10_000_000m);
        var service = CreateService(db);

        var response = await service.ProcessSePayWebhook(
            CreateWebhookRequest(id: 1001, transferType: "in", amount: 500_000m, accumulated: 10_500_000m),
            $"Apikey {WebhookApiKey}");

        var transaction = await db.Transactions.SingleAsync();
        var updatedAccount = await db.FinancialAccounts.SingleAsync(x => x.Id == account.Id);

        Assert.True(response.success);
        Assert.Equal(1, response.createdCount);
        Assert.Equal("Income", transaction.Type);
        Assert.Equal("Imported", transaction.SourceType);
        Assert.Equal("sepay:1001", transaction.ExternalTransactionId);
        Assert.Contains("\"transferAmount\":500000", transaction.RawPayloadJson);
        Assert.Equal(10_500_000m, updatedAccount.CurrentBalance);
        Assert.Equal("Synced", updatedAccount.SyncStatus);
    }

    [Fact]
    public async Task IncomeWebhook_IgnoresAccumulated_AndIncrementsByTransferAmount()
    {
        await using var db = CreateDbContext();
        var account = SeedSePayAccount(db, 100_000m);
        var service = CreateService(db);

        await service.ProcessSePayWebhook(
            CreateWebhookRequest(id: 1005, transferType: "in", amount: 50_000m, accumulated: 0m),
            $"Apikey {WebhookApiKey}");

        var updatedAccount = await db.FinancialAccounts.SingleAsync(x => x.Id == account.Id);
        Assert.Equal(150_000m, updatedAccount.CurrentBalance);
    }

    [Fact]
    public async Task IncomeWebhook_IgnoresStaleAccumulated_AndDoesNotResetBalance()
    {
        await using var db = CreateDbContext();
        var account = SeedSePayAccount(db, 100_000m);
        var service = CreateService(db);

        // Even if SePay sends a non-zero but wrong accumulated, Finjar keeps delta accounting.
        await service.ProcessSePayWebhook(
            CreateWebhookRequest(id: 1006, transferType: "in", amount: 50_000m, accumulated: 50_000m),
            $"Apikey {WebhookApiKey}");

        var updatedAccount = await db.FinancialAccounts.SingleAsync(x => x.Id == account.Id);
        Assert.Equal(150_000m, updatedAccount.CurrentBalance);
    }

    [Fact]
    public async Task ExpenseWebhook_CreatesExpenseTransaction_AndDecreasesBalanceWhenAccumulatedMissing()
    {
        await using var db = CreateDbContext();
        var account = SeedSePayAccount(db, 10_000_000m);
        var service = CreateService(db);

        await service.ProcessSePayWebhook(
            CreateWebhookRequest(id: 1002, transferType: "out", amount: 200_000m),
            $"Apikey {WebhookApiKey}");

        var transaction = await db.Transactions.SingleAsync();
        var updatedAccount = await db.FinancialAccounts.SingleAsync(x => x.Id == account.Id);

        Assert.Equal("Expense", transaction.Type);
        Assert.Equal("Imported", transaction.SourceType);
        Assert.Equal(200_000m, transaction.TransactionsAmount);
        Assert.Equal(9_800_000m, updatedAccount.CurrentBalance);
    }

    [Fact]
    public async Task DuplicateWebhook_SkipsSecondDelivery()
    {
        await using var db = CreateDbContext();
        var account = SeedSePayAccount(db, 10_000_000m);
        var service = CreateService(db);
        var request = CreateWebhookRequest(id: 1003, transferType: "in", amount: 500_000m, accumulated: 10_500_000m);

        await service.ProcessSePayWebhook(request, $"Apikey {WebhookApiKey}");
        var duplicateResponse = await service.ProcessSePayWebhook(request, $"Apikey {WebhookApiKey}");

        var updatedAccount = await db.FinancialAccounts.SingleAsync(x => x.Id == account.Id);
        Assert.Equal(1, await db.Transactions.CountAsync());
        Assert.Equal(0, duplicateResponse.createdCount);
        Assert.Equal(1, duplicateResponse.skippedCount);
        Assert.Equal(10_500_000m, updatedAccount.CurrentBalance);
    }

    [Fact]
    public async Task UnknownAccount_IsRejected()
    {
        await using var db = CreateDbContext();
        SeedSePayAccount(db, 10_000_000m);
        var service = CreateService(db);

        var error = await Assert.ThrowsAsync<AppValidationException>(() =>
            service.ProcessSePayWebhook(
                CreateWebhookRequest(id: 1004, accountNumber: "999999", transferType: "in", amount: 500_000m),
                $"Apikey {WebhookApiKey}"));

        Assert.Equal(404, error.StatusCode);
        Assert.Empty(db.Transactions);
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new AppDbContext(options);
    }

    private static TransactionService CreateService(AppDbContext db)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["SePay:WebhookApiKey"] = WebhookApiKey
            })
            .Build();

        return new TransactionService(db, new HttpContextAccessor(), configuration);
    }

    private static FinancialAccount SeedSePayAccount(AppDbContext db, decimal balance)
    {
        var user = new Account
        {
            Id = Guid.NewGuid(),
            Username = "user",
            Email = "user@finjar.test",
            PasswordHash = "hash",
            FirstName = "Test",
            LastName = "User",
            RoleId = Guid.NewGuid(),
            Status = "Active",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var account = new FinancialAccount
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Name = "Vietcombank",
            AccountType = "Bank",
            ConnectionMode = "LinkedApi",
            ProviderCode = "SEPAY",
            ProviderName = "SePay",
            ExternalAccountId = AccountNumber,
            ExternalAccountRef = AccountNumber,
            MaskedAccountNumber = "******6789",
            AccountHolderName = "NGUYEN VAN A",
            Currency = "VND",
            CurrentBalance = balance,
            SyncStatus = "Active",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Accounts.Add(user);
        db.FinancialAccounts.Add(account);
        db.SaveChanges();
        return account;
    }

    private static TransactionRequest.SePayWebhookRequest CreateWebhookRequest(
        long id,
        string transferType,
        decimal amount,
        decimal? accumulated = null,
        string accountNumber = AccountNumber)
    {
        return new TransactionRequest.SePayWebhookRequest
        {
            id = id,
            gateway = "Vietcombank",
            transactionDate = "2026-07-22 10:00:00",
            accountNumber = accountNumber,
            content = "SEPAY test transaction",
            transferType = transferType,
            description = "SePay test transaction",
            transferAmount = amount,
            accumulated = accumulated,
            referenceCode = $"FT{id}"
        };
    }
}
