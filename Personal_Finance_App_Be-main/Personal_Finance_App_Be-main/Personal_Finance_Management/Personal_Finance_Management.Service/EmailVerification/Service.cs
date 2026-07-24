using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
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
    private readonly EmailOptions _options;
    private readonly ILogger<Service> _logger;

    public Service(
        AppDbContext dbContext,
        IEmailSender emailSender,
        IOptions<EmailOptions> options,
        ILogger<Service> logger)
    {
        _dbContext = dbContext;
        _emailSender = emailSender;
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
        pending.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password, 12);
        pending.FirstName = firstName.Trim();
        pending.LastName = lastName.Trim();
        pending.OtpHash = otpHash;
        pending.OtpExpiresAt = otpExpiresAt;
        pending.UpdatedAt = now;

        await _dbContext.SaveChangesAsync(cancellationToken);
        try
        {
            await SendOtpEmailAsync(normalizedEmail, pending.FirstName, otp, cancellationToken);
            _logger.LogInformation("OTP email sent via SMTP to {Email}", normalizedEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email to {Email}. Dev OTP: {Otp}", normalizedEmail, otp);
            throw AppValidationException.BadRequest(
                "Không gửi được email OTP. Kiểm tra cấu hình Gmail SMTP (App Password).",
                "email",
                "EMAIL_SEND_FAILED");
        }
        _logger.LogInformation("Pending registration OTP for {Email} (dev log OTP: {Otp})", normalizedEmail, otp);
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
        var pending = await _dbContext.PendingRegistrations
            .FirstOrDefaultAsync(p => p.Email == normalizedEmail, cancellationToken);

        if (pending is not null)
        {
            var otp = GenerateOtpCode();
            pending.OtpHash = HashValue(otp);
            pending.OtpExpiresAt = DateTimeOffset.UtcNow.AddMinutes(Math.Max(1, _options.OtpExpiryMinutes));
            pending.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            await SendOtpEmailAsync(normalizedEmail, pending.FirstName, otp, cancellationToken);
            _logger.LogInformation("Resent pending registration OTP for {Email} (dev log OTP: {Otp})", normalizedEmail, otp);
            return;
        }

        var account = await _dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Email == normalizedEmail, cancellationToken);

        if (account is null || account.IsEmailVerified)
        {
            return;
        }

        await IssueLegacyOtpAsync(account, cancellationToken);
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

        if (await _dbContext.Accounts.AnyAsync(a => a.Email == pending.Email, cancellationToken))
        {
            _dbContext.PendingRegistrations.Remove(pending);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return;
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
        var otp = GenerateOtpCode();
        var otpHash = HashValue(otp);
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(Math.Max(1, _options.OtpExpiryMinutes));

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
        await SendOtpEmailAsync(account.Email, account.FirstName, otp, cancellationToken);
        _logger.LogInformation("Issued legacy email OTP for account {AccountId} (dev log OTP: {Otp})", account.Id, otp);
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
