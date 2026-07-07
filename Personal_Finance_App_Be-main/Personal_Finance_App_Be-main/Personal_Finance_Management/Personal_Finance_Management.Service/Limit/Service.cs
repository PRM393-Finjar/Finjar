using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Repository.Enum;
using Personal_Finance_Management.Service.Base;
using Personal_Finance_Management.Service.Validations;


namespace Personal_Finance_Management.Service.limit;

public class Service : IService
{
    private readonly AppDbContext _appDbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public Service(AppDbContext appDbContext, IHttpContextAccessor httpContextAccessor)
    {
        _appDbContext = appDbContext;
        _httpContextAccessor = httpContextAccessor;
    }
    
    private Guid GetCurrentUserId()
    {
        return ServiceClaimHelper.GetRequiredUserId(_httpContextAccessor);
    }


    
    public async Task<Response.GetLimitsResponse> GetLimits()
    {
        var userId = GetCurrentUserId();
        
        var limits = await _appDbContext.SpendingLimits
            .Include(l => l.Category)
            .Include(l => l.Jar)
            .Where(l => l.UserId == userId && l.IsActive)
            .ToListAsync();

        var jarIds = limits
            .Where(l => l.JarId.HasValue)
            .Select(l => l.JarId!.Value)
            .Distinct()
            .ToList();

        var spentByJarId = jarIds.Count == 0
            ? new Dictionary<Guid, decimal>()
            : await _appDbContext.SpendingLimits
                .Where(l => l.UserId == userId
                            && l.IsActive
                            && l.JarId.HasValue
                            && jarIds.Contains(l.JarId.Value))
                .Select(l => new
                {
                    JarId = l.JarId!.Value,
                    CurrentSpent = _appDbContext.Transactions
                        .Where(t => t.UserId == userId
                                    && !t.IsDeleted
                                    && t.Type == "Expense"
                                    && t.FromJarId == l.JarId
                                    && t.ToJarId == null
                                    && t.FinancialAccountId == null
                                    && t.CreatedAt >= l.ResetAt)
                        .Sum(t => (decimal?)t.TransactionsAmount) ?? 0m
                })
                .ToDictionaryAsync(x => x.JarId, x => x.CurrentSpent);

        var items = new List<Response.GetLimitItem>();

        foreach (var limit in limits)
        {
            string targetName = "Unknow";
            Guid targetId = Guid.Empty;
            string targetType = "Jar";

            decimal currentSpent = 0m;
            
            if (limit.Jar != null && limit.JarId.HasValue)
            {
                targetId = limit.JarId.Value;
                targetName = limit.Jar.Name;
                targetType = "Jar";

                currentSpent = spentByJarId.TryGetValue(limit.JarId.Value, out var spent)
                    ? spent
                    : 0m;
            }
            if (limit.Category != null && limit.CategoryId.HasValue)
            {
                targetType = "Category";
                targetId = limit.Category.Id;
                targetName = limit.Category.Name;
            }
            var item = new Response.GetLimitItem
            {
                Id = limit.Id,
                TargetId = targetId,
                TargetName = targetName,
                LimitAmount = limit.LimitAmount,
                Period = limit.Period,
                AlertAtPercentage = limit.AlertAtPercentage,
                CurrentSpent = currentSpent,
                // H6: guard against DivideByZero when LimitAmount is 0 (shouldn't happen after the
                // CreateLimit/UpdateLimit validators, but defensive against legacy rows).
                CurrentPercentage = limit.LimitAmount > 0
                    ? (double)((currentSpent * 100) / limit.LimitAmount)
                    : 0d,
                Status = "Active",
                TargetType = targetType
            };

            items.Add(item);
        }
        return new Response.GetLimitsResponse { Data = items };
    }

    public async Task<Response.CreateLimitResponse> CreateLimit(Request.CreateLimitRequest request)
    {
        var userId = GetCurrentUserId();

        // H6: reject LimitAmount <= 0. Without this guard, every later computation that divides by
        // LimitAmount (CurrentPercentage in GetLimits, alertThreshold in Transaction.Service.CheckLimit)
        // can throw DivideByZeroException.
        if (request.LimitAmount <= 0)
        {
            throw AppValidationException.BadRequest(
                "LimitAmount must be greater than zero.",
                "LimitAmount",
                "INVALID_LIMIT_AMOUNT");
        }

        var now = DateTimeOffset.UtcNow;
        var limit = new SpendingLimit()
        {
            LimitAmount = request.LimitAmount,
            Period = ServiceTextHelper.NormalizeEnum<LimitPeriod>(request.Period),
            AlertAtPercentage = request.AlertAtPercentage,
            IsActive = true,
            UserId = userId,
            CategoryId = null,
            JarId = null,
            CreatedAt = now,
            UpdatedAt = now,
            ResetAt = now,
        };
        if (string.Equals(request.TargetType, "Category", StringComparison.OrdinalIgnoreCase))
        {
            limit.CategoryId = request.TargetId;
        }

        if (string.Equals(request.TargetType, "Jar", StringComparison.OrdinalIgnoreCase))
        {
            limit.JarId = request.TargetId;
        }
        
        _appDbContext.SpendingLimits.Add(limit);
        await _appDbContext.SaveChangesAsync();
        
        return new Response.CreateLimitResponse
        {
            Id = limit.Id,
            LimitAmount = limit.LimitAmount,
            Period = limit.Period,
            AlertAtPercentage = limit.AlertAtPercentage,
            TargetType = request.TargetType,
            TargetId = request.TargetId,
        };
    }

    public async Task<Response.UpdateLimitResponse> UpdateLimit(Guid id, Request.UpdateLimitRequest request)
    {
        var userId = GetCurrentUserId();
        
        var limit = await _appDbContext.SpendingLimits
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (limit == null)
            throw new ("Limit not found");

        if (request.LimitAmount.HasValue)
        {
            // H6: reject LimitAmount <= 0 to keep downstream percentage math safe.
            if (request.LimitAmount.Value <= 0)
            {
                throw AppValidationException.BadRequest(
                    "LimitAmount must be greater than zero.",
                    "LimitAmount",
                    "INVALID_LIMIT_AMOUNT");
            }
            limit.LimitAmount = request.LimitAmount.Value;
        }

        if (request.AlertAtPercentage.HasValue)
            limit.AlertAtPercentage = request.AlertAtPercentage.Value;
        
        await _appDbContext.SaveChangesAsync();
        
        return new Response.UpdateLimitResponse
        {
            Id = limit.Id,
            LimitAmount = limit.LimitAmount,
            AlertAtPercentage = limit.AlertAtPercentage
        };
    }
    
    public async Task DeleteLimit(Guid id)
    {
        var userId = GetCurrentUserId();
        
        var limit = await _appDbContext.SpendingLimits
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

        if (limit == null)
            throw new KeyNotFoundException("Limit not found");
        
        limit.IsActive = false;
        await _appDbContext.SaveChangesAsync();
    }
}
