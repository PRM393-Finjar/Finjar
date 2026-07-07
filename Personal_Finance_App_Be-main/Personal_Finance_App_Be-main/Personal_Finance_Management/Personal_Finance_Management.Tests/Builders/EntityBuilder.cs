using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Constants;
using Personal_Finance_Management.Repository.Entity;

namespace Personal_Finance_Management.Tests.Builders;

/// <summary>
/// Fluent builders for entity creation. All <c>WithX</c> methods default to safe, deterministic values
/// so individual tests only need to set what's relevant.
/// </summary>
public static class EntityBuilder
{
    public static AccountBuilder Account() => new();

    public static FinancialAccountBuilder FinancialAccount() => new();

    public static JarBuilder Jar() => new();

    public static CategoryBuilder Category() => new();

    public static GoalBuilder Goal() => new();

    public static SpendingLimitBuilder SpendingLimit() => new();

    public static TransactionBuilder Transaction() => new();

    public static RoleBuilder Role() => new();

    public static ImportJobBuilder ImportJob() => new();

    public static ImportTransactionDraftBuilder ImportDraft() => new();
}

public class AccountBuilder
{
    private readonly Account _account = new()
    {
        Id = Guid.NewGuid(),
        Username = "tester",
        Email = "tester@finjar.local",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssword1"),
        FirstName = "Test",
        LastName = "User",
        RoleId = AppRoles.Ids.User,
        Status = "Active",
        PreferredCurrency = "VND",
        IsEmailVerified = true,
        IsOnboardingCompleted = true,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public AccountBuilder WithId(Guid id) { _account.Id = id; return this; }
    public AccountBuilder WithUsername(string v) { _account.Username = v; return this; }
    public AccountBuilder WithEmail(string v) { _account.Email = v; return this; }
    public AccountBuilder WithRoleId(Guid roleId) { _account.RoleId = roleId; return this; }
    public AccountBuilder WithRole(Role role) { _account.RoleId = role.Id; _account.Role = role; return this; }
    public AccountBuilder WithAdminRole() { _account.RoleId = AppRoles.Ids.Admin; return this; }
    public AccountBuilder WithUserRole() { _account.RoleId = AppRoles.Ids.User; return this; }
    public AccountBuilder WithVerified(bool v = true) { _account.IsEmailVerified = v; return this; }
    public AccountBuilder WithOnboarding(bool v = true) { _account.IsOnboardingCompleted = v; return this; }

    public Account Build() => _account;
}

public class RoleBuilder
{
    private readonly Role _role = new()
    {
        Id = AppRoles.Ids.User,
        Code = "User",
        Name = "User",
        Description = "Default",
        CreatedAt = DateTimeOffset.UtcNow,
    };

    public RoleBuilder WithId(Guid id) { _role.Id = id; return this; }
    public RoleBuilder WithCode(string v) { _role.Code = v; return this; }
    public RoleBuilder WithAdmin() { _role.Id = AppRoles.Ids.Admin; _role.Code = "Admin"; _role.Name = "Admin"; return this; }

    public Role Build() => _role;
}

public class FinancialAccountBuilder
{
    private readonly FinancialAccount _account = new()
    {
        Id = Guid.NewGuid(),
        Name = "Cash",
        AccountType = "Cash",
        ConnectionMode = "Manual",
        Currency = "VND",
        CurrentBalance = 0m,
        SyncStatus = "NeverSynced",
        UserId = Guid.NewGuid(),
        IsActive = true,
        IsDefault = false,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public FinancialAccountBuilder WithId(Guid id) { _account.Id = id; return this; }
    public FinancialAccountBuilder WithUserId(Guid userId) { _account.UserId = userId; return this; }
    public FinancialAccountBuilder WithName(string v) { _account.Name = v; return this; }
    public FinancialAccountBuilder WithAccountType(string v) { _account.AccountType = v; return this; }
    public FinancialAccountBuilder WithConnectionMode(string v) { _account.ConnectionMode = v; return this; }
    public FinancialAccountBuilder WithLinkedApi() { _account.ConnectionMode = "LinkedApi"; _account.ProviderCode = "casso"; _account.ProviderName = "Casso"; return this; }
    public FinancialAccountBuilder WithCurrentBalance(decimal v) { _account.CurrentBalance = v; return this; }
    public FinancialAccountBuilder WithExternalRef(string v) { _account.ExternalAccountRef = v; return this; }
    public FinancialAccountBuilder WithExternalId(string v) { _account.ExternalAccountId = v; return this; }
    public FinancialAccountBuilder WithMaskedNumber(string v) { _account.MaskedAccountNumber = v; return this; }
    public FinancialAccountBuilder WithIsActive(bool v) { _account.IsActive = v; return this; }
    public FinancialAccountBuilder WithIsDefault(bool v) { _account.IsDefault = v; return this; }
    public FinancialAccountBuilder WithSyncStatus(string v) { _account.SyncStatus = v; return this; }

    public FinancialAccount Build() => _account;
}

public class JarBuilder
{
    private readonly Jar _jar = new()
    {
        Id = Guid.NewGuid(),
        Name = "Necessities",
        Balance = 0m,
        Currency = "VND",
        IsDefault = false,
        Status = "Active",
        UserId = Guid.NewGuid(),
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public JarBuilder WithId(Guid id) { _jar.Id = id; return this; }
    public JarBuilder WithUserId(Guid userId) { _jar.UserId = userId; return this; }
    public JarBuilder WithName(string v) { _jar.Name = v; return this; }
    public JarBuilder WithBalance(decimal v) { _jar.Balance = v; return this; }
    public JarBuilder WithStatus(string v) { _jar.Status = v; return this; }
    public JarBuilder AddBalance(decimal delta) { _jar.Balance += delta; return this; }

    public Jar Build() => _jar;
}

public class CategoryBuilder
{
    private readonly Category _category = new()
    {
        Id = Guid.NewGuid(),
        Name = "Food",
        OwnerUserId = null,
        IsDefault = true,
        IsActive = true,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public CategoryBuilder WithId(Guid id) { _category.Id = id; return this; }
    public CategoryBuilder WithOwner(Guid? userId) { _category.OwnerUserId = userId; return this; }
    public CategoryBuilder WithDefault(bool v = true) { _category.IsDefault = v; return this; }
    public CategoryBuilder WithName(string v) { _category.Name = v; return this; }
    public CategoryBuilder WithActive(bool v = true) { _category.IsActive = v; return this; }
    public CategoryBuilder WithDeleted(DateTimeOffset? when)
    {
        _category.DeletedAt = when;
        return this;
    }

    public Category Build() => _category;
}

public class GoalBuilder
{
    private readonly Goal _goal = new()
    {
        Id = Guid.NewGuid(),
        Title = "Save 1M VND",
        TargetAmount = 1_000_000m,
        SavedAmount = 0m,
        Status = "Active",
        UserId = Guid.NewGuid(),
        DueDate = DateTime.UtcNow.AddMonths(6),
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public GoalBuilder WithId(Guid id) { _goal.Id = id; return this; }
    public GoalBuilder WithUserId(Guid userId) { _goal.UserId = userId; return this; }
    public GoalBuilder WithTitle(string v) { _goal.Title = v; return this; }
    public GoalBuilder WithTarget(decimal v) { _goal.TargetAmount = v; return this; }
    public GoalBuilder WithSaved(decimal v) { _goal.SavedAmount = v; return this; }
    public GoalBuilder WithLinkedJarId(Guid? id) { _goal.LinkedJarId = id; return this; }
    public GoalBuilder WithStatus(string v) { _goal.Status = v; return this; }

    public Goal Build() => _goal;
}

public class SpendingLimitBuilder
{
    private readonly SpendingLimit _limit = new()
    {
        Id = Guid.NewGuid(),
        LimitAmount = 2_000_000m,
        Period = "Monthly",
        AlertAtPercentage = 80m,
        IsActive = true,
        UserId = Guid.NewGuid(),
        ResetAt = DateTimeOffset.UtcNow,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public SpendingLimitBuilder WithId(Guid id) { _limit.Id = id; return this; }
    public SpendingLimitBuilder WithUserId(Guid v) { _limit.UserId = v; return this; }
    public SpendingLimitBuilder WithAmount(decimal v) { _limit.LimitAmount = v; return this; }
    public SpendingLimitBuilder WithPercentage(decimal v) { _limit.AlertAtPercentage = v; return this; }
    public SpendingLimitBuilder WithJarId(Guid? id) { _limit.JarId = id; return this; }
    public SpendingLimitBuilder WithCategoryId(Guid? id) { _limit.CategoryId = id; return this; }
    public SpendingLimitBuilder WithActive(bool v = true) { _limit.IsActive = v; return this; }
    public SpendingLimitBuilder WithPeriod(string v) { _limit.Period = v; return this; }
    public SpendingLimitBuilder WithResetAt(DateTimeOffset v) { _limit.ResetAt = v; return this; }

    public SpendingLimit Build() => _limit;
}

public class TransactionBuilder
{
    private readonly Transaction _tx = new()
    {
        Id = Guid.NewGuid(),
        Type = "Expense",
        TransactionsAmount = 0m,
        TransactionDate = DateTimeOffset.UtcNow,
        SourceType = "Manual",
        UserId = Guid.NewGuid(),
        IsDeleted = false,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public TransactionBuilder WithId(Guid id) { _tx.Id = id; return this; }
    public TransactionBuilder WithUserId(Guid v) { _tx.UserId = v; return this; }
    public TransactionBuilder WithType(string v) { _tx.Type = v; return this; }
    public TransactionBuilder WithAmount(decimal v) { _tx.TransactionsAmount = v; return this; }
    public TransactionBuilder WithNote(string? v) { _tx.Note = v; return this; }
    public TransactionBuilder WithCategoryId(Guid? id) { _tx.CategoryId = id; return this; }
    public TransactionBuilder WithFinancialAccountId(Guid? id) { _tx.FinancialAccountId = id; return this; }
    public TransactionBuilder WithFromJarId(Guid? id) { _tx.FromJarId = id; return this; }
    public TransactionBuilder WithToJarId(Guid? id) { _tx.ToJarId = id; return this; }
    public TransactionBuilder WithSourceType(string v) { _tx.SourceType = v; return this; }
    public TransactionBuilder WithExternalId(string? v) { _tx.ExternalTransactionId = v; return this; }
    public TransactionBuilder WithImportJobId(Guid? id) { _tx.ImportJobId = id; return this; }
    public TransactionBuilder WithIsDeleted(bool v = true)
    {
        _tx.IsDeleted = v;
        if (v) _tx.DeletedAt = DateTimeOffset.UtcNow;
        return this;
    }
    public TransactionBuilder WithTransactionDate(DateTimeOffset v) { _tx.TransactionDate = v; return this; }
    public TransactionBuilder WithDeletedAt(DateTimeOffset? v) { _tx.DeletedAt = v; return this; }

    public Transaction Build() => _tx;
}

public class ImportJobBuilder
{
    private readonly ImportJob _job = new()
    {
        Id = Guid.NewGuid(),
        FileName = "test.jpg",
        StoredFilePath = "C:\\test.jpg",
        Status = "Pending",
        Progress = 0,
        ParsedCount = 0,
        FailedCount = 0,
        UserId = Guid.NewGuid(),
        FinancialAccountId = Guid.NewGuid(),
        UploadedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public ImportJobBuilder WithId(Guid id) { _job.Id = id; return this; }
    public ImportJobBuilder WithUserId(Guid v) { _job.UserId = v; return this; }
    public ImportJobBuilder WithFinancialAccountId(Guid v) { _job.FinancialAccountId = v; return this; }
    public ImportJobBuilder WithStatus(string v) { _job.Status = v; return this; }
    public ImportJobBuilder WithProgress(int v) { _job.Progress = v; return this; }

    public ImportJob Build() => _job;
}

public class ImportTransactionDraftBuilder
{
    private readonly ImportTransactionDraft _draft = new()
    {
        Id = Guid.NewGuid(),
        RowIndex = 0,
        Amount = 100_000m,
        Type = "Expense",
        TransactionDate = DateTimeOffset.UtcNow,
        IsValid = true,
        CreatedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };

    public ImportTransactionDraftBuilder WithId(Guid id) { _draft.Id = id; return this; }
    public ImportTransactionDraftBuilder WithImportJobId(Guid? v) { _draft.ImportJobId = v; return this; }
    public ImportTransactionDraftBuilder WithRowIndex(int v) { _draft.RowIndex = v; return this; }
    public ImportTransactionDraftBuilder WithAmount(decimal v) { _draft.Amount = v; return this; }
    public ImportTransactionDraftBuilder WithType(string v) { _draft.Type = v; return this; }
    public ImportTransactionDraftBuilder WithTransactionDate(DateTimeOffset v) { _draft.TransactionDate = v; return this; }
    public ImportTransactionDraftBuilder WithIsValid(bool v) { _draft.IsValid = v; return this; }
    public ImportTransactionDraftBuilder WithEditedCategoryId(Guid? id) { _draft.EditedCategoryId = id; return this; }
    public ImportTransactionDraftBuilder WithEditedJarId(Guid? id) { _draft.EditedJarId = id; return this; }

    public ImportTransactionDraft Build() => _draft;
}
