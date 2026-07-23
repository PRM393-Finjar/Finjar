using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Constants;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Repository.Enum;
using Personal_Finance_Management.Service.Base;
using Personal_Finance_Management.Service.Validations;
using BaseResponse = Personal_Finance_Management.Service.Base.Response;

namespace Personal_Finance_Management.Service.User;

public class Service : IService
{
    private const string DefaultTimeZoneId = "Asia/Ho_Chi_Minh";
    private const string WindowsDefaultTimeZoneId = "SE Asia Standard Time";

    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContext;
    private readonly IServices _validationServices;

    public Service(
        AppDbContext dbContext,
        IHttpContextAccessor httpContext,
        IServices validationServices)
    {
        _dbContext = dbContext;
        _httpContext = httpContext;
        _validationServices = validationServices;
    }
    public async Task<Response.GetUserInforResponse> GetUserInfor()
    {
        var userIdGuid = GetCurrentUserId();

        var query = _dbContext.Accounts.Where(x => x.Id == userIdGuid);
        var selectedQuery = query.Select(x => new Response.GetUserInforResponse()
        {
            Id = x.Id,
            UserName = x.Username,
            FirstName = x.FirstName,
            LastName = x.LastName,
            Email = x.Email,
            Phone = x.Phone,
            AvatarUrl = x.AvatarUrl,
            PreferredCurrency = x.PreferredCurrency,
            TimeZoneId = string.IsNullOrWhiteSpace(x.TimeZoneId) ? DefaultTimeZoneId : x.TimeZoneId,
            IsOnboardingCompleted = x.IsOnboardingCompleted,
            IsPremium = x.PremiumExpiresAt != null && x.PremiumExpiresAt > DateTimeOffset.UtcNow,
            PremiumExpiresAt = x.PremiumExpiresAt
        });
        var result = await selectedQuery.FirstOrDefaultAsync();
        return result ?? throw new Exception("User not found");
    }

    public async Task<BaseResponse.PagedResponse<Response.AdminUserResponse>> GetAdminUsers(Request.GetAdminUsersRequest request)
    {
        await _validationServices.ValidateAdminUsersRequest(request);

        var query = _dbContext.Accounts
            .AsNoTracking()
            .Where(x => x.Role.Code == AppRoles.Codes.User);

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = ServiceTextHelper.NormalizeEnum<AccountStatus>(request.Status);
            query = query.Where(x => x.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim().ToLower();
            query = query.Where(x =>
                x.Username.ToLower().Contains(keyword)
                || x.Email.ToLower().Contains(keyword)
                || x.FirstName.ToLower().Contains(keyword)
                || x.LastName.ToLower().Contains(keyword));
        }

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new Response.AdminUserResponse
            {
                Id = x.Id,
                UserName = x.Username,
                FirstName = x.FirstName,
                LastName = x.LastName,
                Email = x.Email,
                Phone = x.Phone,
                AvatarUrl = x.AvatarUrl,
                PreferredCurrency = x.PreferredCurrency,
                TimeZoneId = string.IsNullOrWhiteSpace(x.TimeZoneId) ? DefaultTimeZoneId : x.TimeZoneId,
                IsOnboardingCompleted = x.IsOnboardingCompleted,
                Status = x.Status,
                StatusReason = x.StatusReason,
                CreatedAt = x.CreatedAt,
                LastLoginAt = x.LastLoginAt
            })
            .ToListAsync();

        return new BaseResponse.PagedResponse<Response.AdminUserResponse>
        {
            Data = users,
            Pagination = new BaseResponse.PaginationResponse
            {
                Page = request.PageIndex,
                PageSize = request.PageSize,
                TotalCount = totalCount
            }
        };
    }

    public async Task<Response.AdminUserResponse> GetUserInforById(Request.UserIdRequest request)
    {
        var user = await _dbContext.Accounts
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.UserId && x.Role.Code == AppRoles.Codes.User);

        return user is null
            ? throw AppValidationException.NotFound("User not found.", "id", "USER_NOT_FOUND")
            : ToAdminUserResponse(user);
    }




    public async Task<Response.UpdateUserResponse> UpdateUserProfile(Request.UpdateUserRequest request)
    {
        var userIdGuid = GetCurrentUserId();

        if (request.TimeZoneId != null)
        {
            await using var timezoneTransaction = await _dbContext.Database.BeginTransactionAsync();
            await LockDailyTransactionQuotaAsync(userIdGuid);

            var userWithTimeZone = await _dbContext.Accounts
                .FirstOrDefaultAsync(x => x.Id == userIdGuid);

            if (userWithTimeZone == null)
                throw new Exception("User not found");

            ApplyPendingQuotaTimeZoneIfDue(userWithTimeZone, DateTimeOffset.UtcNow);
            ApplyProfileFields(userWithTimeZone, request);
            ApplyRequestedTimeZone(userWithTimeZone, request.TimeZoneId, DateTimeOffset.UtcNow);

            await _dbContext.SaveChangesAsync();
            await timezoneTransaction.CommitAsync();

            return ToUpdateUserResponse(userWithTimeZone);
        }

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);

        if (user == null)
            throw new Exception("User not found");

        ApplyProfileFields(user, request);
        await _dbContext.SaveChangesAsync();

        return ToUpdateUserResponse(user);
    }

    public async Task ChangePassword(Request.ChangePasswordRequest request)
    {
        var userIdGuid = GetCurrentUserId();
        var user = await _dbContext.Accounts.FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null) throw new Exception("User not found");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            throw AppValidationException.BadRequest("Mật khẩu hiện tại không đúng.", "currentPassword", "INVALID_CURRENT_PASSWORD");

        if (request.NewPassword.Length < 6)
            throw AppValidationException.BadRequest("Mật khẩu mới phải có ít nhất 6 ký tự.", "newPassword", "PASSWORD_TOO_SHORT");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, 12);
        user.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();
    }

    public async Task<Response.AdminUserResponse> UpdateUserStatus(Request.UserStatusRequest request)
    {
        await _validationServices.ValidateAdminUserStatusRequest(request);

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == request.UserId && x.Role.Code == AppRoles.Codes.User);

        if (user == null)
            throw AppValidationException.NotFound("User not found.", "id", "USER_NOT_FOUND");

        user.Status = ServiceTextHelper.NormalizeEnum<AccountStatus>(request.Status!);
        user.StatusReason = request.StatusReason;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();
        return ToAdminUserResponse(user);
    }

    public async Task<Response.ViewSetupResponse> ViewSetup()
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);

        if (user == null)
            throw new Exception("User not found");
        var selectedQuery = _dbContext.Accounts
            .Where(x => x.Id == userIdGuid)
            .Select(x => new Response.ViewSetupResponse()
        {
            isOnboardingCompleted = x.IsOnboardingCompleted,
            monthlyIncome = x.OnboardingProfile == null ? null : x.OnboardingProfile.MonthlyIncome,
            budgetMethod = x.OnboardingProfile == null ? "Undecided" : x.OnboardingProfile.BudgetMethodPreference,
            defaultFinancialAccountId = x.FinancialAccounts
                .Where(account => account.IsActive)
                .OrderByDescending(account => account.IsDefault)
                .Select(account => (Guid?)account.Id)
                .FirstOrDefault(),
            jarCount = _dbContext.Jars.Where(x => x.UserId == userIdGuid).Count(),
            financialAccountCount = _dbContext.FinancialAccounts.Where(x => x.UserId == userIdGuid).Count(),
            limitCount = _dbContext.SpendingLimits.Where(x => x.UserId == userIdGuid).Count(),
            activeGoalCount = _dbContext.Goals.Where(x => x.UserId == userIdGuid).Count(),
        });
        var result = await selectedQuery.FirstOrDefaultAsync();
        return result ?? throw new Exception("User not found");
    }

    private static Response.AdminUserResponse ToAdminUserResponse(Account user)
    {
        return new Response.AdminUserResponse
        {
            Id = user.Id,
            UserName = user.Username,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            Phone = user.Phone,
            AvatarUrl = user.AvatarUrl,
            PreferredCurrency = user.PreferredCurrency,
            TimeZoneId = string.IsNullOrWhiteSpace(user.TimeZoneId) ? DefaultTimeZoneId : user.TimeZoneId,
            IsOnboardingCompleted = user.IsOnboardingCompleted,
            Status = user.Status,
            StatusReason = user.StatusReason,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };
    }

    private Guid GetCurrentUserId()
    {
        return ServiceClaimHelper.GetRequiredUserId(_httpContext);
    }

    private static void ApplyProfileFields(Account user, Request.UpdateUserRequest request)
    {
        user.FirstName = request.FirstName ?? user.FirstName;
        user.LastName = request.LastName ?? user.LastName;
        user.Phone = request.Phone ?? user.Phone;
        user.AvatarUrl = request.AvatarUrl ?? user.AvatarUrl;
        if (!string.IsNullOrWhiteSpace(request.PreferredCurrency))
            user.PreferredCurrency = request.PreferredCurrency.Trim().ToUpperInvariant();
    }

    private static Response.UpdateUserResponse ToUpdateUserResponse(Account user)
    {
        return new Response.UpdateUserResponse
        {
            Id = user.Id,
            fullName = user.FirstName + " " + user.LastName,
            phone = user.Phone,
            avatarUrl = user.AvatarUrl,
            timeZoneId = string.IsNullOrWhiteSpace(user.TimeZoneId) ? DefaultTimeZoneId : user.TimeZoneId,
        };
    }

    private async Task LockDailyTransactionQuotaAsync(Guid userId)
    {
        var lockKey = $"daily-transaction-quota:{userId:N}";
        await _dbContext.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtext({lockKey}))");
    }

    private static void ApplyRequestedTimeZone(Account user, string requestedTimeZoneId, DateTimeOffset now)
    {
        var activeQuotaTimeZoneId = GetActiveQuotaTimeZoneId(user);
        user.QuotaTimeZoneId = activeQuotaTimeZoneId;

        var timeZoneId = requestedTimeZoneId.Trim();
        if (timeZoneId.Length == 0)
        {
            user.TimeZoneId = null;
        }
        else
        {
            EnsureSupportedTimeZone(timeZoneId);
            user.TimeZoneId = timeZoneId;
        }

        var desiredTimeZoneId = GetDesiredTimeZoneId(user);
        if (string.Equals(activeQuotaTimeZoneId, desiredTimeZoneId, StringComparison.OrdinalIgnoreCase))
        {
            user.QuotaTimeZoneChangeEffectiveAt = null;
            return;
        }

        var currentQuotaWindow = GetDailyQuotaWindow(activeQuotaTimeZoneId, now);
        user.QuotaTimeZoneChangeEffectiveAt = currentQuotaWindow.EndUtc;
    }

    private static void ApplyPendingQuotaTimeZoneIfDue(Account user, DateTimeOffset now)
    {
        user.QuotaTimeZoneId = GetActiveQuotaTimeZoneId(user);

        if (user.QuotaTimeZoneChangeEffectiveAt.HasValue
            && now >= user.QuotaTimeZoneChangeEffectiveAt.Value)
        {
            user.QuotaTimeZoneId = GetDesiredTimeZoneId(user);
            user.QuotaTimeZoneChangeEffectiveAt = null;
        }
    }

    private static DailyQuotaWindow GetDailyQuotaWindow(string timeZoneId, DateTimeOffset now)
    {
        var timeZone = ResolveTimeZone(timeZoneId);
        var userNow = TimeZoneInfo.ConvertTime(now, timeZone);
        var todayStartLocal = DateTime.SpecifyKind(userNow.Date, DateTimeKind.Unspecified);
        var tomorrowStartLocal = todayStartLocal.AddDays(1);

        return new DailyQuotaWindow(
            new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(todayStartLocal, timeZone), TimeSpan.Zero),
            new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(tomorrowStartLocal, timeZone), TimeSpan.Zero));
    }

    private static string GetActiveQuotaTimeZoneId(Account user)
    {
        return string.IsNullOrWhiteSpace(user.QuotaTimeZoneId)
            ? GetDesiredTimeZoneId(user)
            : user.QuotaTimeZoneId.Trim();
    }

    private static string GetDesiredTimeZoneId(Account user)
    {
        return string.IsNullOrWhiteSpace(user.TimeZoneId) ? DefaultTimeZoneId : user.TimeZoneId.Trim();
    }

    private static void EnsureSupportedTimeZone(string timeZoneId)
    {
        if (FindTimeZone(timeZoneId) == null)
        {
            throw AppValidationException.BadRequest("Timezone is invalid.", "timeZoneId", "INVALID_TIMEZONE");
        }
    }

    private static TimeZoneInfo ResolveTimeZone(string timeZoneId)
    {
        return FindTimeZone(timeZoneId)
               ?? FindTimeZone(DefaultTimeZoneId)
               ?? FindTimeZone(WindowsDefaultTimeZoneId)
               ?? throw new InvalidOperationException($"Default timezone '{DefaultTimeZoneId}' is not available.");
    }

    private static TimeZoneInfo? FindTimeZone(string? timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            return null;
        }

        var normalizedTimeZoneId = timeZoneId.Trim();
        if (string.Equals(normalizedTimeZoneId, DefaultTimeZoneId, StringComparison.OrdinalIgnoreCase))
        {
            return TryFindSystemTimeZone(DefaultTimeZoneId)
                   ?? TryFindSystemTimeZone(WindowsDefaultTimeZoneId);
        }

        return TryFindSystemTimeZone(normalizedTimeZoneId);
    }

    private static TimeZoneInfo? TryFindSystemTimeZone(string timeZoneId)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            return null;
        }
        catch (InvalidTimeZoneException)
        {
            return null;
        }
    }

    private sealed record DailyQuotaWindow(DateTimeOffset StartUtc, DateTimeOffset EndUtc);
}
