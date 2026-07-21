using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Service.Base;
using Personal_Finance_Management.Service.Validations;

namespace Personal_Finance_Management.Service.Subscription;

public class Service : IService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly PayOSOptions _options;
    private readonly ILogger<Service> _logger;

    public Service(
        AppDbContext dbContext,
        IHttpContextAccessor httpContextAccessor,
        IHttpClientFactory httpClientFactory,
        IOptions<PayOSOptions> options,
        ILogger<Service> logger)
    {
        _dbContext = dbContext;
        _httpContextAccessor = httpContextAccessor;
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<Response.CreatePaymentResponse> CreatePaymentAsync(Request.CreatePaymentRequest request)
    {
        EnsureConfigured();

        var accountId = ServiceClaimHelper.GetRequiredUserId(_httpContextAccessor);
        var account = await _dbContext.Accounts.FirstOrDefaultAsync(a => a.Id == accountId)
            ?? throw AppValidationException.NotFound("Account not found.", "account", "ACCOUNT_NOT_FOUND");

        var amount = request.Amount is > 0 ? request.Amount.Value : _options.PremiumAmount;
        var durationDays = request.DurationDays is > 0
            ? request.DurationDays.Value
            : _options.PremiumDurationDays;
        var description = string.IsNullOrWhiteSpace(_options.PremiumDescription)
            ? "FinjarPre"
            : _options.PremiumDescription.Trim();
        if (description.Length > 9)
        {
            description = description[..9];
        }

        var orderCode = GenerateOrderCode();
        var signature = PayOSSignatureHelper.CreatePaymentRequestSignature(
            orderCode,
            amount,
            description,
            _options.CancelUrl,
            _options.ReturnUrl,
            _options.ChecksumKey);

        var body = new
        {
            orderCode,
            amount,
            description,
            buyerName = $"{account.FirstName} {account.LastName}".Trim(),
            buyerEmail = account.Email,
            buyerPhone = account.Phone,
            cancelUrl = _options.CancelUrl,
            returnUrl = _options.ReturnUrl,
            items = new[]
            {
                new
                {
                    name = "FinJar Premium",
                    quantity = 1,
                    price = amount
                }
            },
            signature
        };

        var client = _httpClientFactory.CreateClient("PayOS");
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/v2/payment-requests")
        {
            Content = new StringContent(JsonSerializer.Serialize(body, JsonOptions), Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.TryAddWithoutValidation("x-client-id", _options.ClientId);
        httpRequest.Headers.TryAddWithoutValidation("x-api-key", _options.ApiKey);

        using var httpResponse = await client.SendAsync(httpRequest);
        var raw = await httpResponse.Content.ReadAsStringAsync();

        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(raw) ? "{}" : raw);
        var root = doc.RootElement;
        var code = root.TryGetProperty("code", out var codeEl) ? codeEl.GetString() : null;
        if (!httpResponse.IsSuccessStatusCode || code != "00")
        {
            var desc = root.TryGetProperty("desc", out var descEl) ? descEl.GetString() : raw;
            _logger.LogWarning("PayOS create payment failed: {Status} {Body}", httpResponse.StatusCode, raw);
            throw AppValidationException.BadRequest(
                $"PayOS create payment failed: {desc}",
                "payos",
                "PAYOS_CREATE_FAILED");
        }

        if (!root.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Object)
        {
            throw AppValidationException.BadRequest(
                "PayOS response missing data.",
                "payos",
                "PAYOS_INVALID_RESPONSE");
        }

        var checkoutUrl = data.GetProperty("checkoutUrl").GetString()
            ?? throw AppValidationException.BadRequest(
                "PayOS response missing checkoutUrl.",
                "payos",
                "PAYOS_INVALID_RESPONSE");
        var paymentLinkId = data.TryGetProperty("paymentLinkId", out var linkEl)
            ? linkEl.GetString()
            : null;
        var qrCode = data.TryGetProperty("qrCode", out var qrEl) ? qrEl.GetString() : null;

        var payment = new SubscriptionPayment
        {
            Id = Guid.NewGuid(),
            AccountId = accountId,
            OrderCode = orderCode,
            Amount = amount,
            DurationDays = durationDays,
            Status = "Pending",
            PaymentLinkId = paymentLinkId,
            CheckoutUrl = checkoutUrl,
            Description = description,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.SubscriptionPayments.Add(payment);
        await _dbContext.SaveChangesAsync();

        return new Response.CreatePaymentResponse
        {
            PaymentId = payment.Id,
            OrderCode = orderCode,
            Amount = amount,
            DurationDays = durationDays,
            CheckoutUrl = checkoutUrl,
            QrCode = qrCode,
            Status = payment.Status
        };
    }

    public async Task<Response.SubscriptionStatusResponse> GetStatusAsync()
    {
        var accountId = ServiceClaimHelper.GetRequiredUserId(_httpContextAccessor);
        var account = await _dbContext.Accounts.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == accountId)
            ?? throw AppValidationException.NotFound("Account not found.", "account", "ACCOUNT_NOT_FOUND");

        return new Response.SubscriptionStatusResponse
        {
            IsPremium = account.IsPremium,
            PremiumExpiresAt = account.PremiumExpiresAt,
            PremiumAmount = _options.PremiumAmount,
            PremiumDurationDays = _options.PremiumDurationDays,
            Currency = "VND"
        };
    }

    public async Task<Response.WebhookAckResponse> ProcessWebhookAsync(JsonElement payload)
    {
        EnsureConfigured();

        if (!payload.TryGetProperty("signature", out var signatureEl)
            || !payload.TryGetProperty("data", out var dataEl)
            || dataEl.ValueKind != JsonValueKind.Object)
        {
            // PayOS webhook URL validation may send incomplete payloads — acknowledge gently.
            _logger.LogWarning("PayOS webhook missing signature/data.");
            return new Response.WebhookAckResponse { Success = true, Message = "ignored" };
        }

        var signature = signatureEl.GetString() ?? string.Empty;
        if (!PayOSSignatureHelper.VerifyWebhookSignature(dataEl, signature, _options.ChecksumKey))
        {
            throw AppValidationException.BadRequest(
                "Invalid PayOS webhook signature.",
                "signature",
                "PAYOS_WEBHOOK_INVALID_SIGNATURE");
        }

        var code = payload.TryGetProperty("code", out var codeEl) ? codeEl.GetString() : null;
        var success = payload.TryGetProperty("success", out var successEl)
            && successEl.ValueKind == JsonValueKind.True;

        if (!success && code != "00")
        {
            return new Response.WebhookAckResponse { Success = true, Message = "ignored_non_success" };
        }

        if (!dataEl.TryGetProperty("orderCode", out var orderCodeEl))
        {
            return new Response.WebhookAckResponse { Success = true, Message = "ignored_no_order" };
        }

        var orderCode = orderCodeEl.ValueKind == JsonValueKind.Number
            ? orderCodeEl.GetInt64()
            : long.Parse(orderCodeEl.GetString() ?? "0");

        // PayOS sends a sample order during webhook URL validation.
        var payment = await _dbContext.SubscriptionPayments
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.OrderCode == orderCode);

        if (payment is null)
        {
            _logger.LogInformation("PayOS webhook for unknown orderCode {OrderCode} (validation sample?).", orderCode);
            return new Response.WebhookAckResponse { Success = true, Message = "order_not_found" };
        }

        if (string.Equals(payment.Status, "Paid", StringComparison.OrdinalIgnoreCase))
        {
            return new Response.WebhookAckResponse { Success = true, Message = "already_paid" };
        }

        var dataCode = dataEl.TryGetProperty("code", out var dataCodeEl) ? dataCodeEl.GetString() : null;
        if (dataCode is not null && dataCode != "00")
        {
            payment.Status = "Failed";
            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
            return new Response.WebhookAckResponse { Success = true, Message = "marked_failed" };
        }

        payment.Status = "Paid";
        payment.PaidAt = DateTimeOffset.UtcNow;
        payment.UpdatedAt = DateTimeOffset.UtcNow;
        payment.PayOSReference = dataEl.TryGetProperty("reference", out var refEl) ? refEl.GetString() : null;
        payment.TransactionDateTime = dataEl.TryGetProperty("transactionDateTime", out var dtEl)
            ? dtEl.GetString()
            : null;
        if (dataEl.TryGetProperty("paymentLinkId", out var linkEl))
        {
            payment.PaymentLinkId ??= linkEl.GetString();
        }

        var account = payment.Account;
        var now = DateTimeOffset.UtcNow;
        var baseDate = account.PremiumExpiresAt.HasValue && account.PremiumExpiresAt.Value > now
            ? account.PremiumExpiresAt.Value
            : now;
        account.PremiumExpiresAt = baseDate.AddDays(payment.DurationDays);
        account.UpdatedAt = now;

        await _dbContext.SaveChangesAsync();
        _logger.LogInformation(
            "Premium activated for account {AccountId} until {ExpiresAt} (order {OrderCode}).",
            account.Id,
            account.PremiumExpiresAt,
            orderCode);

        return new Response.WebhookAckResponse { Success = true, Message = "premium_activated" };
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId)
            || string.IsNullOrWhiteSpace(_options.ApiKey)
            || string.IsNullOrWhiteSpace(_options.ChecksumKey))
        {
            throw AppValidationException.BadRequest(
                "PayOS is not configured. Set PayOSOptions__ClientId, ApiKey, ChecksumKey.",
                "payos",
                "PAYOS_NOT_CONFIGURED");
        }
    }

    private static long GenerateOrderCode()
    {
        // PayOS requires a unique positive integer order code.
        var seconds = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var suffix = Random.Shared.Next(100, 999);
        return seconds * 1000 + suffix;
    }
}
