using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Constants;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Service.Email;
using Personal_Finance_Management.Service.Validations;

namespace Personal_Finance_Management.Service.EmailVerification;

public interface IService
{
    Task StartPendingRegistrationAsync(
        string username,
        string email,
        string password,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default);

    Task VerifyOtpAsync(string email, string otp, CancellationToken cancellationToken = default);
    Task ResendAsync(string email, CancellationToken cancellationToken = default);
}

public class Service : IService
{
    private static readonly Guid DefaultRoleId = AppRoles.Ids.User;
    private static readonly string DefaultRoleCode = AppRoles.Codes.User;

    private readonly AppDbContext _dbContext;
    private readonly IEmailSender _emailSender;
    private readonly IMemoryCache _cache;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly EmailOptions _options;
    private readonly ILogger<Service> _logger;

    public Service(
        AppDbContext dbContext,
        IEmailSender emailSender,
        IMemoryCache cache,
        IHttpContextAccessor httpContextAccessor,
        IOptions<EmailOptions> options,
        ILogger<Service> logger)
    {
        _dbContext = dbContext;
        _emailSender = emailSender;
        _cache = cache;
        _httpContextAccessor = httpContextAccessor;
        _options = options.Value;
        _logger = logger;
    }

    public async Task StartPendingRegistrationAsync(
        string username,
        string email,
        string password,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedUsername = username.Trim();
        var now = DateTimeOffset.UtcNow;
        var otp = GenerateOtpCode();
        var otpHash = HashValue(otp);
        var otpExpiresAt = now.AddMinutes(Math.Max(1, _options.OtpExpiryMinutes));
        var trimmedFirstName = firstName.Trim();
        var trimmedLastName = lastName.Trim();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, 12);

        EnsureOtpRateLimit(normalizedEmail);

        // Invariant: Generate → Send → rồi mới Attach/mutate entity → SaveChanges.
        // Không gán OtpHash lên tracked entity trước Send (tránh EF auto-save / interceptor).
        await SendOtpEmailOrThrowAsync(normalizedEmail, trimmedFirstName, otp, cancellationToken);
        RecordOtpSend(normalizedEmail);

        var pending = await _dbContext.PendingRegistrations
            .FirstOrDefaultAsync(p => p.Email == normalizedEmail, cancellationToken);

        if (pending is null)
        {
            pending = new PendingRegistration
            {
                Id = Guid.NewGuid(),
                Email = normalizedEmail,
                CreatedAt = now,
            };
            _dbContext.PendingRegistrations.Add(pending);
        }

        pending.Username = normalizedUsername;
        pending.PasswordHash = passwordHash;
        pending.FirstName = trimmedFirstName;
        pending.LastName = trimmedLastName;
        pending.OtpHash = otpHash;
        pending.OtpExpiresAt = otpExpiresAt;
        pending.UpdatedAt = now;

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "OTP email was sent to {Email} but saving pending registration failed. User must resend.",
                normalizedEmail);
            throw AppValidationException.BadRequest(
                "Email OTP đã gửi nhưng không lưu được phiên đăng ký. Vui lòng thử lại hoặc dùng gửi lại mã.",
                "email",
                "OTP_PERSIST_FAILED");
        }

        _logger.LogInformation("Pending registration created after successful OTP email to {Email}", normalizedEmail);
    }

    public async Task VerifyOtpAsync(string email, string otp, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedOtp = otp.Trim();
        ValidateOtpInput(normalizedEmail, normalizedOtp);

        var pending = await _dbContext.PendingRegistrations
            .FirstOrDefaultAsync(p => p.Email == normalizedEmail, cancellationToken);

        if (pending is not null)
        {
            await VerifyPendingRegistrationAsync(pending, normalizedOtp, cancellationToken);
            return;
        }

        await VerifyLegacyAccountAsync(normalizedEmail, normalizedOtp, cancellationToken);
    }

    public async Task ResendAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            throw AppValidationException.BadRequest("Email không hợp lệ.", "email", "INVALID_EMAIL");
        }

        var pending = await _dbContext.PendingRegistrations
            .FirstOrDefaultAsync(p => p.Email == normalizedEmail, cancellationToken);

        if (pending is not null)
        {
            await ResendPendingOtpAsync(pending, cancellationToken);
            return;
        }

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Email == normalizedEmail, cancellationToken);

        if (account is null)
        {
            throw AppValidationException.NotFound(
                "Không tìm thấy đăng ký đang chờ xác thực cho email này.",
                "email",
                "EMAIL_NOT_PENDING");
        }

        if (account.IsEmailVerified)
        {
            throw AppValidationException.Conflict(
                "Email này đã được xác thực. Vui lòng đăng nhập.",
                "email",
                "EMAIL_ALREADY_VERIFIED");
        }

        await IssueLegacyOtpAsync(account, cancellationToken);
    }

    private async Task ResendPendingOtpAsync(PendingRegistration pending, CancellationToken cancellationToken)
    {
        EnsureResendCooldownoldown(pending.UpdatedAt);
        EnsureOtpRateLimit(pending.Email);

        var now = DateTimeOffset.UtcNow;
        var otp = GenerateOtpCode();
        var otpHash = HashValue(otp);
        var otpExpiresAt = now.AddMinutes(Math.Max(1, _options.OtpExpiryMinutes));

        // Mutate tracked entity ONLY after Send succeeds (OTP cũ vẫn còn nếu SMTP fail).
        await SendOtpEmailOrThrowAsync(pending.Email, pending.FirstName, otp, cancellationToken);
        RecordOtpSend(pending.Email);

        pending.OtpHash = otpHash;
        pending.OtpExpiresAt = otpExpiresAt;
        pending.UpdatedAt = now;
        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Resent pending registration OTP after successful email to {Email}", pending.Email);
    }

    private async Task VerifyPendingRegistrationAsync(
        PendingRegistration pending,
        string normalizedOtp,
        CancellationToken cancellationToken)
    {
        if (pending.OtpExpiresAt < DateTimeOffset.UtcNow)
        {
            throw AppValidationException.BadRequest("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.", "otp", "OTP_EXPIRED");
        }

        var otpHash = HashValue(normalizedOtp);
        if (!string.Equals(pending.OtpHash, otpHash, StringComparison.Ordinal))
        {
            throw AppValidationException.BadRequest("Mã OTP không đúng hoặc đã hết hạn.", "otp", "INVALID_OTP");
        }

        if (await _dbContext.Accounts.AnyAsync(
                a => a.Email.ToLower() == pending.Email.ToLower(),
                cancellationToken))
        {
            _dbContext.PendingRegistrations.Remove(pending);
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw AppValidationException.Conflict(
                "Email này đã được đăng ký. Vui lòng đăng nhập.",
                "email",
                "EMAIL_ALREADY_REGISTERED");
        }

        var now = DateTimeOffset.UtcNow;
        var role = await EnsureUserRole(now, cancellationToken);
        var account = new Account
        {
            Id = Guid.NewGuid(),
            Username = pending.Username,
            Email = pending.Email,
            PasswordHash = pending.PasswordHash,
            FirstName = pending.FirstName,
            LastName = pending.LastName,
            RoleId = role.Id,
            IsEmailVerified = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.Accounts.Add(account);
        _dbContext.PendingRegistrations.Remove(pending);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task VerifyLegacyAccountAsync(
        string normalizedEmail,
        string normalizedOtp,
        CancellationToken cancellationToken)
    {
        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Email == normalizedEmail, cancellationToken);

        if (account is null)
        {
            throw AppValidationException.BadRequest("Mã OTP không đúng hoặc đã hết hạn.", "otp", "INVALID_OTP");
        }

        if (account.IsEmailVerified)
        {
            return;
        }

        var otpHash = HashValue(normalizedOtp);
        var token = await _dbContext.EmailVerificationTokens
            .Include(t => t.Account)
            .Where(t => t.AccountId == account.Id)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(t => t.TokenHash == otpHash, cancellationToken);

        if (token is null)
        {
            throw AppValidationException.BadRequest("Mã OTP không đúng hoặc đã hết hạn.", "otp", "INVALID_OTP");
        }

        if (token.UsedAt is not null)
        {
            if (token.Account.IsEmailVerified)
            {
                return;
            }

            throw AppValidationException.BadRequest("Mã OTP không đúng hoặc đã hết hạn.", "otp", "INVALID_OTP");
        }

        if (token.ExpiresAt < DateTimeOffset.UtcNow)
        {
            throw AppValidationException.BadRequest("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.", "otp", "OTP_EXPIRED");
        }

        token.UsedAt = DateTimeOffset.UtcNow;
        token.Account.IsEmailVerified = true;
        token.Account.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task IssueLegacyOtpAsync(Account account, CancellationToken cancellationToken)
    {
        var latest = await _dbContext.EmailVerificationTokens
            .Where(t => t.AccountId == account.Id)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (latest is not null)
        {
            EnsureResendCooldownoldown(latest.CreatedAt);
        }

        EnsureOtpRateLimit(account.Email);

        var otp = GenerateOtpCode();
        var otpHash = HashValue(otp);
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(Math.Max(1, _options.OtpExpiryMinutes));

        await SendOtpEmailOrThrowAsync(account.Email, account.FirstName, otp, cancellationToken);
        RecordOtpSend(account.Email);

        var existingTokens = await _dbContext.EmailVerificationTokens
            .Where(t => t.AccountId == account.Id && t.UsedAt == null)
            .ToListAsync(cancellationToken);

        _dbContext.EmailVerificationTokens.RemoveRange(existingTokens);
        _dbContext.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            AccountId = account.Id,
            TokenHash = otpHash,
            ExpiresAt = expiresAt,
            CreatedAt = now
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Issued legacy email OTP after successful send for account {AccountId}", account.Id);
    }

    private void EnsureResendCooldownoldown(DateTimeOffset lastSentAt)
    {
        var cooldown = Math.Max(0, _options.OtpResendCooldownoldownSeconds);
        if (cooldown <= 0)
        {
            return;
        }

        var elapsed = DateTimeOffset.UtcNow - lastSentAt;
        var remaining = TimeSpan.FromSeconds(cooldown) - elapsed;
        if (remaining > TimeSpan.Zero)
        {
            var waitSeconds = (int)Math.Ceiling(remaining.TotalSeconds);
            throw AppValidationException.BadRequest(
                $"Vui lòng đợi {waitSeconds} giây trước khi gửi lại mã OTP.",
                "email",
                "OTP_RESEND_TOO_SOON");
        }
    }

    private void EnsureOtpRateLimit(string normalizedEmail)
    {
        var maxSends = Math.Max(1, _options.OtpMaxSendsPerWindow);
        var windowMinutes = Math.Max(1, _options.OtpSendWindowMinutes);

        if (GetSendTimestamps(OtpEmailCacheKey(normalizedEmail)).Count >= maxSends)
        {
            throw AppValidationException.BadRequest(
                $"Bạn đã gửi quá nhiều mã OTP. Thử lại sau {windowMinutes} phút.",
                "email",
                "OTP_RATE_LIMITED");
        }

        var clientIp = GetClientIp();
        if (!string.IsNullOrWhiteSpace(clientIp)
            && GetSendTimestamps(OtpIpCacheKey(clientIp)).Count >= maxSends)
        {
            throw AppValidationException.BadRequest(
                $"Bạn đã gửi quá nhiều mã OTP từ thiết bị này. Thử lại sau {windowMinutes} phút.",
                "email",
                "OTP_RATE_LIMITED");
        }
    }

    private void RecordOtpSend(string normalizedEmail)
    {
        var window = TimeSpan.FromMinutes(Math.Max(1, _options.OtpSendWindowMinutes));
        var now = DateTimeOffset.UtcNow;

        var emailKey = OtpEmailCacheKey(normalizedEmail);
        var emailSends = GetSendTimestamps(emailKey);
        emailSends.Add(now);
        _cache.Set(emailKey, emailSends, window);

        var clientIp = GetClientIp();
        if (string.IsNullOrWhiteSpace(clientIp))
        {
            return;
        }

        var ipKey = OtpIpCacheKey(clientIp);
        var ipSends = GetSendTimestamps(ipKey);
        ipSends.Add(now);
        _cache.Set(ipKey, ipSends, window);
    }

    private List<DateTimeOffset> GetSendTimestamps(string cacheKey)
    {
        var window = TimeSpan.FromMinutes(Math.Max(1, _options.OtpSendWindowMinutes));
        if (!_cache.TryGetValue(cacheKey, out List<DateTimeOffset>? sends) || sends is null)
        {
            return new List<DateTimeOffset>();
        }

        var cutoff = DateTimeOffset.UtcNow - window;
        return sends.Where(t => t >= cutoff).ToList();
    }

    private string? GetClientIp()
    {
        var context = _httpContextAccessor.HttpContext;
        if (context is null)
        {
            return null;
        }

        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            return forwarded.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault();
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }

    private static string OtpEmailCacheKey(string normalizedEmail) => $"otp-sends:email:{normalizedEmail}";

    private static string OtpIpCacheKey(string clientIp) => $"otp-sends:ip:{clientIp}";

    private async Task SendOtpEmailOrThrowAsync(
        string email,
        string firstName,
        string otp,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("OTP email send starting for {Email}", email);
        try
        {
            await SendOtpEmailAsync(email, firstName, otp, cancellationToken);
            _logger.LogInformation("OTP email send success for {Email}", email);
        }
        catch (AppValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OTP email send failed for {Email}", email);
            throw AppValidationException.BadRequest(
                "Không gửi được email OTP. Kiểm tra cấu hình Gmail SMTP (App Password) hoặc thử lại sau.",
                "email",
                "EMAIL_SEND_FAILED");
        }
    }

    private async Task SendOtpEmailAsync(
        string email,
        string firstName,
        string otp,
        CancellationToken cancellationToken)
    {
        var html = $"""
            <p>Xin chào {firstName},</p>
            <p>Cảm ơn bạn đã đăng ký Finjar. Mã xác thực email của bạn:</p>
            <p style="font-size:28px;font-weight:bold;letter-spacing:6px;">{otp}</p>
            <p>Mã có hiệu lực {_options.OtpExpiryMinutes} phút. Không chia sẻ mã này với ai khác.</p>
            <p>Nếu bạn không đăng ký, hãy bỏ qua email này.</p>
            """;

        await _emailSender.SendAsync(email, "Mã OTP xác thực Finjar", html, cancellationToken);
    }

    private void ValidateOtpInput(string normalizedEmail, string normalizedOtp)
    {
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            throw AppValidationException.BadRequest("Email không hợp lệ.", "email", "INVALID_EMAIL");
        }

        if (string.IsNullOrWhiteSpace(normalizedOtp) || normalizedOtp.Length != _options.OtpLength || !normalizedOtp.All(char.IsDigit))
        {
            throw AppValidationException.BadRequest($"Mã OTP phải gồm {_options.OtpLength} chữ số.", "otp", "INVALID_OTP");
        }
    }

    private async Task<Role> EnsureUserRole(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Code == DefaultRoleCode, cancellationToken);
        if (role is not null)
        {
            return role;
        }

        role = new Role
        {
            Id = DefaultRoleId,
            Code = DefaultRoleCode,
            Name = DefaultRoleCode,
            Description = "Default application user",
            CreatedAt = now
        };

        _dbContext.Roles.Add(role);
        return role;
    }

    private string GenerateOtpCode()
    {
        var max = (int)Math.Pow(10, _options.OtpLength);
        var value = RandomNumberGenerator.GetInt32(0, max);
        return value.ToString($"D{_options.OtpLength}");
    }

    private static string HashValue(string raw)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash);
    }
}
