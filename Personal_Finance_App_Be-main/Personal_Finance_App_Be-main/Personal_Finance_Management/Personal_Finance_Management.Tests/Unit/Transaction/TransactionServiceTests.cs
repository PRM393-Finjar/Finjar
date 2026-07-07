using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Service.Transaction;
using Personal_Finance_Management.Service.Validations;
using Personal_Finance_Management.Tests.Fixtures;
using Xunit;
using Microsoft.Extensions.Configuration;

namespace Personal_Finance_Management.Tests.Unit.Transaction;

public class TransactionServiceTests
{
    private readonly TestDbContextFactory _dbFactory = new();

    private (AppDbContext Db, FakeHttpContextAccessor HttpAccessor, Guid UserId) Setup()
    {
        var userId = Guid.NewGuid();
        var db = _dbFactory.CreateContext();
        
        // Seed user
        db.Accounts.Add(new Account { Id = userId, Username = "test", Email = "test@test.com", PasswordHash = "hash", FirstName = "Test", LastName = "User" });
        db.SaveChanges();

        var httpAccessor = new FakeHttpContextAccessor(userId);
        return (db, httpAccessor, userId);
    }

    [Fact]
    public async Task CreateTransaction_Income_IncreasesFinancialAccountBalance()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var accountId = Guid.NewGuid();
        db.FinancialAccounts.Add(new FinancialAccount
        {
            Id = accountId,
            UserId = userId,
            Name = "Bank",
            CurrentBalance = 1000,
            IsActive = true,
            AccountType = "Cash",
            ConnectionMode = "Manual"
        });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());
        
        var request = new Request.CreateTransactionRequest
        {
            type = "Income",
            transactionsAmount = 500,
            financialAccountId = accountId,
            date = DateTimeOffset.UtcNow
        };

        // Act
        var result = await service.CreateTransaction(request);

        // Assert
        result.Should().NotBeNull();
        
        var account = await db.FinancialAccounts.FindAsync(accountId);
        account!.CurrentBalance.Should().Be(1500); // 1000 + 500
    }

    [Fact]
    public async Task CreateTransaction_Expense_DecreasesJarBalance()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var jarId = Guid.NewGuid();
        db.Jars.Add(new Jar
        {
            Id = jarId,
            UserId = userId,
            Name = "Food",
            Balance = 1000
        });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());
        
        var request = new Request.CreateTransactionRequest
        {
            type = "Expense",
            transactionsAmount = 200,
            fromJarId = jarId,
            date = DateTimeOffset.UtcNow
        };

        // Act
        var result = await service.CreateTransaction(request);

        // Assert
        result.Should().NotBeNull();
        
        var jar = await db.Jars.FindAsync(jarId);
        jar!.Balance.Should().Be(800); // 1000 - 200
    }

    [Fact]
    public async Task CreateTransaction_Expense_InsufficientFunds_Throws()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var jarId = Guid.NewGuid();
        db.Jars.Add(new Jar
        {
            Id = jarId,
            UserId = userId,
            Name = "Food",
            Balance = 100
        });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());
        
        var request = new Request.CreateTransactionRequest
        {
            type = "Expense",
            transactionsAmount = 200, // exceeds 100
            fromJarId = jarId,
            date = DateTimeOffset.UtcNow
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.CreateTransaction(request));
        ex.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task CreateTransaction_Transfer_JarToJar_UpdatesBalances()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var fromJarId = Guid.NewGuid();
        var toJarId = Guid.NewGuid();
        db.Jars.Add(new Jar { Id = fromJarId, UserId = userId, Balance = 500, Name = "Jar 1" });
        db.Jars.Add(new Jar { Id = toJarId, UserId = userId, Balance = 100, Name = "Jar 2" });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());
        
        var request = new Request.CreateTransactionRequest
        {
            type = "Transfer",
            transactionsAmount = 200,
            fromJarId = fromJarId,
            toJarId = toJarId,
            date = DateTimeOffset.UtcNow
        };

        // Act
        var result = await service.CreateTransaction(request);

        // Assert
        var fromJar = await db.Jars.FindAsync(fromJarId);
        var toJar = await db.Jars.FindAsync(toJarId);
        
        fromJar!.Balance.Should().Be(300); // 500 - 200
        toJar!.Balance.Should().Be(300); // 100 + 200
    }

    [Fact]
    public async Task DeleteTransaction_Expense_ReversesBalance()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var jarId = Guid.NewGuid();
        db.Jars.Add(new Jar { Id = jarId, UserId = userId, Balance = 500, Name = "Jar 1" });
        
        var txId = Guid.NewGuid();
        db.Transactions.Add(new Personal_Finance_Management.Repository.Entity.Transaction
        {
            Id = txId,
            UserId = userId,
            FromJarId = jarId,
            Type = "Expense",
            TransactionsAmount = 100,
            SourceType = "Manual",
            IsDeleted = false
        });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());

        // Act
        var result = await service.DeleteTransaction(txId);

        // Assert
        var jar = await db.Jars.FindAsync(jarId);
        jar!.Balance.Should().Be(600); // Reversed: 500 + 100
        
        var tx = await db.Transactions.FindAsync(txId);
        tx!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateTransaction_UpdatesAmountAndReversesOldAmount()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var jarId = Guid.NewGuid();
        db.Jars.Add(new Jar { Id = jarId, UserId = userId, Balance = 500, Name = "Jar 1" }); // Current balance 500
        
        var txId = Guid.NewGuid();
        db.Transactions.Add(new Personal_Finance_Management.Repository.Entity.Transaction
        {
            Id = txId,
            UserId = userId,
            FromJarId = jarId,
            Type = "Expense",
            TransactionsAmount = 100, // Old expense amount was 100
            SourceType = "Manual"
        });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());

        var request = new Request.UpdateTransactionRequest
        {
            transactionsAmount = 250 // New expense amount 250
        };

        // Act
        var result = await service.UpdateTransaction(txId, request);

        // Assert
        var jar = await db.Jars.FindAsync(jarId);
        // It reverses old (500 + 100 = 600) and applies new (600 - 250 = 350)
        jar!.Balance.Should().Be(350);
        
        var tx = await db.Transactions.FindAsync(txId);
        tx!.TransactionsAmount.Should().Be(250);
    }

    [Fact]
    public async Task RestoreTransaction_Expense_ReappliesBalance()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var jarId = Guid.NewGuid();
        db.Jars.Add(new Jar { Id = jarId, UserId = userId, Balance = 600, Name = "Jar 1" });
        
        var txId = Guid.NewGuid();
        db.Transactions.Add(new Personal_Finance_Management.Repository.Entity.Transaction
        {
            Id = txId,
            UserId = userId,
            FromJarId = jarId,
            Type = "Expense",
            TransactionsAmount = 100,
            SourceType = "Manual",
            IsDeleted = true,
            DeletedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());

        // Act
        var result = await service.RestoreTransaction(txId);

        // Assert
        var jar = await db.Jars.FindAsync(jarId);
        jar!.Balance.Should().Be(500); // Re-applied: 600 - 100
        
        var tx = await db.Transactions.FindAsync(txId);
        tx!.IsDeleted.Should().BeFalse();
        tx.DeletedAt.Should().BeNull();
    }

    [Fact]
    public async Task CreateTransaction_Expense_TriggersLimitNotification()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var jarId = Guid.NewGuid();
        db.Jars.Add(new Jar { Id = jarId, UserId = userId, Balance = 1000, Name = "Jar 1" });
        
        // Add a spending limit of 100 with alert at 80% (80)
        db.SpendingLimits.Add(new SpendingLimit
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            JarId = jarId,
            LimitAmount = 100,
            AlertAtPercentage = 80,
            IsActive = true,
            Period = "Monthly"
        });
        await db.SaveChangesAsync();

        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());
        
        var request = new Request.CreateTransactionRequest
        {
            type = "Expense",
            transactionsAmount = 90, // exceeds 80 alert threshold
            fromJarId = jarId,
            date = DateTimeOffset.UtcNow
        };

        // Act
        await service.CreateTransaction(request);

        // Assert
        var notification = await db.Notifications.FirstOrDefaultAsync(n => n.UserId == userId);
        notification.Should().NotBeNull();
        notification!.Type.Should().Be("SpendingAlert");
    }

    [Fact]
    public async Task ProcessCassoWebhook_NullRequest_Throws()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, new ConfigurationBuilder().Build());

        // Act & Assert
        var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.ProcessCassoWebhook(null!, null, null));
        ex.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task ProcessCassoWebhook_InvalidToken_Throws()
    {
        // Arrange
        var (db, http, userId) = Setup();
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string> { { "Casso:SecureToken", "secret" } })
            .Build();
        var service = new Personal_Finance_Management.Service.Transaction.Service(db, http, config);

        var request = new Request.CassoWebhookRequest();

        // Act & Assert
        var ex = await Assert.ThrowsAsync<AppValidationException>(() => service.ProcessCassoWebhook(request, "wrong", null));
        ex.StatusCode.Should().Be(400);
    }
}
