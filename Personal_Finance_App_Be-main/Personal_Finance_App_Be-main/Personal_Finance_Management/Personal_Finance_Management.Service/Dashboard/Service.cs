using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Service.Base;

namespace Personal_Finance_Management.Service.Dashboard;

public class Service : IService
{
    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContext;

    public Service(AppDbContext dbContext, IHttpContextAccessor httpContext)
    {
        _dbContext = dbContext;
        _httpContext = httpContext;
    }
    
    public async Task<Response.GetDashboardResult> GetDashboard()
    {
        var userIdGuid = ServiceClaimHelper.GetRequiredUserId(_httpContext);

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null)
            throw new Exception("User not found");

        // ===============================BalanceSummaryResponse===============================
        // Use (decimal?) to safely handle empty sets (Sum returns null, not 0, on empty)
        var totalJar = _dbContext.Jars
            .Where(x => x.UserId == userIdGuid)
            .Sum(x => (decimal?)x.Balance) ?? 0;
        var totalAccount = _dbContext.FinancialAccounts
            .Where(x => x.UserId == userIdGuid && x.IsActive)
            .Sum(x => (decimal?)x.CurrentBalance) ?? 0;
        var totalIncome = _dbContext.Transactions
            .Where(x => x.UserId == userIdGuid && !x.IsDeleted && x.Type == "Income")
            .Sum(x => (decimal?)x.TransactionsAmount) ?? 0;
        var totalExpense = _dbContext.Transactions
            .Where(x => x.UserId == userIdGuid && !x.IsDeleted && x.Type == "Expense")
            .Sum(x => (decimal?)x.TransactionsAmount) ?? 0;

        var balanceSummary = new Response.BalanceSummaryResponse
        {
            totalBalance = totalAccount,
            allocatedBalance = totalJar,
            unallocatedBalance = totalAccount - totalJar,
            totalIncome = totalIncome,
            totalExpense = totalExpense,
            netChange = totalIncome - totalExpense
        };

        // ===============================financialAccounts===============================
        var financialAccounts = _dbContext.FinancialAccounts
            .Where(x => x.UserId == userIdGuid && x.IsActive)
            .Select(x => new Response.FinancialAccountResponse
            {
                id = x.Id,
                name = x.Name,
                currentBalance = x.CurrentBalance,
                isDefault = x.IsDefault
            })
            .ToList();

        // ===============================jarSummary===============================
        // Step 1: Materialize raw jar data + spent from DB (no division in SQL)
        var rawJars = _dbContext.Jars
            .Where(x => x.UserId == userIdGuid)
            .Select(j => new
            {
                j.Id,
                j.Name,
                j.Balance,
                // Sum spent per jar safely
                Spent = _dbContext.Transactions
                    .Where(t => !t.IsDeleted && t.Type == "Expense" && t.FromJarId == j.Id)
                    .Sum(s => (decimal?)s.TransactionsAmount) ?? 0
            })
            .ToList();

        // Step 2: Calculate percentage in C# to avoid PostgreSQL numeric overflow
        var jarSummary = rawJars.Select(x => new Response.JarSummaryResponse
        {
            jarId = x.Id,
            jarName = x.Name,
            balance = x.Balance,
            spent = x.Spent,
            spentPercentage = (x.Balance + x.Spent) == 0
                ? 0
                : Math.Round((x.Spent * 100m) / (x.Balance + x.Spent), 4)
        }).ToList();

        // ===============================categoryBreakdown===============================
        // Step 1: Materialize raw category + totalSpent from DB
        var rawCategories = _dbContext.Categories
            .Where(x => x.OwnerUserId == userIdGuid)
            .Select(c => new
            {
                c.Id,
                c.Name,
                TotalSpent = _dbContext.Transactions
                    .Where(t => !t.IsDeleted && t.CategoryId == c.Id && t.Type == "Expense")
                    .Sum(s => (decimal?)s.TransactionsAmount) ?? 0
            })
            .ToList();

        // Step 2: Calculate percentage in C# to avoid PostgreSQL numeric overflow
        var categoryBreakdown = rawCategories.Select(x => new Response.CategoryBreakdownResponse
        {
            categoryId = x.Id,
            categoryName = x.Name,
            totalAmount = x.TotalSpent,
            percentage = totalExpense == 0
                ? 0
                : Math.Round((x.TotalSpent * 100m) / totalExpense, 4)
        }).ToList();

        // ===============================recentTransactions===============================
        // Materialize with only needed columns + Math.Round amount to safe precision
        var recentTransactions = _dbContext.Transactions
            .Where(x => x.UserId == userIdGuid && !x.IsDeleted)
            .OrderByDescending(x => x.TransactionDate)
            .Take(50)
            .Select(x => new
            {
                x.Id,
                x.Type,
                x.TransactionsAmount,
                x.Note,
                x.TransactionDate
            })
            .ToList()
            // Round in C# after materialization to avoid decimal overflow from DB
            .Select(x => new Response.RecentTransactionResponse
            {
                id = x.Id,
                type = x.Type,
                transactionsAmount = Math.Round(x.TransactionsAmount, 2),
                note = x.Note,
                date = x.TransactionDate,
            })
            .ToList();

        // ===============================goalProgress===============================
        // Step 1: Materialize raw goal data (no division in SQL)
        var rawGoals = _dbContext.Goals
            .Where(x => x.UserId == userIdGuid)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.TargetAmount,
                x.SavedAmount,
                x.DueDate
            })
            .ToList();

        // Step 2: Calculate percentage in C# to avoid PostgreSQL numeric overflow
        var goalProgress = rawGoals.Select(x => new Response.GoalProgressResponse
        {
            goalId = x.Id,
            title = x.Title,
            progressPercentage = x.TargetAmount == 0
                ? 0
                : Math.Round((x.SavedAmount * 100m) / x.TargetAmount, 4),
            daysRemaining = (decimal)(x.DueDate - DateTimeOffset.UtcNow).TotalDays
        }).ToList();

        var result = new Response.GetDashboardResult
        {
            balanceSummary = balanceSummary,
            financialAccounts = financialAccounts,
            jarSummary = jarSummary,
            categoryBreakdown = categoryBreakdown,
            recentTransactions = recentTransactions,
            goalProgress = goalProgress,
        };
        return result;
    }
}
