using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Personal_Finance_Management.Service.Email;

public class LoggingEmailSender : IEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(IOptions<EmailOptions> options, ILogger<LoggingEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (!_options.AllowLoggingSender)
        {
            _logger.LogError(
                "Email is not configured (no Brevo/Resend API key, UseSmtp=false) and AllowLoggingSender=false. Refusing to fake-send to {Email}.",
                toEmail);
            throw new InvalidOperationException(
                "Email is not configured. On Render Free set Email__BrevoApiKey (HTTPS). " +
                "Locally you can use MailOptions SMTP, or Email:AllowLoggingSender=true for offline demos.");
        }

        _logger.LogWarning(
            "DEV EMAIL (AllowLoggingSender=true, not sent) -> To: {Email}, Subject: {Subject}, Body preview: {Preview}",
            toEmail,
            subject,
            htmlBody.Length > 500 ? htmlBody[..500] + "..." : htmlBody);
        return Task.CompletedTask;
    }
}

/// <summary>Brevo transactional API over HTTPS — works on Render Free (SMTP blocked).</summary>
public class BrevoEmailSender : IEmailSender
{
    private readonly HttpClient _http;
    private readonly EmailOptions _options;
    private readonly ILogger<BrevoEmailSender> _logger;

    public BrevoEmailSender(HttpClient http, IOptions<EmailOptions> options, ILogger<BrevoEmailSender> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.BrevoApiKey))
        {
            throw new InvalidOperationException("Email:BrevoApiKey is required for BrevoEmailSender.");
        }

        if (string.IsNullOrWhiteSpace(_options.FromAddress))
        {
            throw new InvalidOperationException("Email:FromAddress is required (must be a Brevo-verified sender).");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
        request.Headers.TryAddWithoutValidation("api-key", _options.BrevoApiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = JsonContent.Create(new BrevoSendRequest
        {
            Sender = new BrevoSender { Name = _options.FromName, Email = _options.FromAddress },
            To = [new BrevoTo { Email = toEmail }],
            Subject = subject,
            HtmlContent = htmlBody
        });

        _logger.LogInformation("Brevo send starting -> To: {Email}, From: {From}", toEmail, _options.FromAddress);
        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Brevo send failed -> To: {Email}, Status: {Status}, Body: {Body}",
                toEmail,
                (int)response.StatusCode,
                body);
            throw new InvalidOperationException($"Brevo email send failed ({(int)response.StatusCode}): {body}");
        }

        _logger.LogInformation("Brevo send success -> To: {Email}, Response: {Body}", toEmail, body);
    }

    private sealed class BrevoSendRequest
    {
        [JsonPropertyName("sender")]
        public BrevoSender Sender { get; set; } = new();

        [JsonPropertyName("to")]
        public List<BrevoTo> To { get; set; } = [];

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        [JsonPropertyName("htmlContent")]
        public string HtmlContent { get; set; } = string.Empty;
    }

    private sealed class BrevoSender
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }

    private sealed class BrevoTo
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }
}

/// <summary>Resend API over HTTPS — works on Render Free. Prefer a verified domain for production.</summary>
public class ResendEmailSender : IEmailSender
{
    private readonly HttpClient _http;
    private readonly EmailOptions _options;
    private readonly ILogger<ResendEmailSender> _logger;

    public ResendEmailSender(HttpClient http, IOptions<EmailOptions> options, ILogger<ResendEmailSender> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ResendApiKey))
        {
            throw new InvalidOperationException("Email:ResendApiKey is required for ResendEmailSender.");
        }

        var from = string.IsNullOrWhiteSpace(_options.FromName)
            ? _options.FromAddress
            : $"{_options.FromName} <{_options.FromAddress}>";

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ResendApiKey);
        request.Content = JsonContent.Create(new
        {
            from,
            to = new[] { toEmail },
            subject,
            html = htmlBody
        });

        _logger.LogInformation("Resend send starting -> To: {Email}, From: {From}", toEmail, from);
        using var response = await _http.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Resend send failed -> To: {Email}, Status: {Status}, Body: {Body}",
                toEmail,
                (int)response.StatusCode,
                body);
            throw new InvalidOperationException($"Resend email send failed ({(int)response.StatusCode}): {body}");
        }

        _logger.LogInformation("Resend send success -> To: {Email}, Response: {Body}", toEmail, body);
    }
}

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.SmtpHost))
        {
            throw new InvalidOperationException("Email:SmtpHost is required when UseSmtp is true.");
        }

        if (string.IsNullOrWhiteSpace(_options.FromAddress))
        {
            throw new InvalidOperationException("Email:FromAddress is required when UseSmtp is true.");
        }

        if (!string.IsNullOrWhiteSpace(_options.SmtpUsername)
            && string.IsNullOrWhiteSpace(_options.SmtpPassword))
        {
            throw new InvalidOperationException("Email:SmtpPassword or MailOptions__Password is required when SMTP username is set.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Clamp(_options.SmtpTimeoutSeconds, 5, 60)));

        try
        {
            _logger.LogInformation("SMTP send starting -> To: {Email}, Host: {Host}:{Port}", toEmail, _options.SmtpHost, _options.SmtpPort);
            await client.ConnectAsync(
                _options.SmtpHost,
                _options.SmtpPort,
                GetSecureSocketOptions(),
                timeoutCts.Token);

            if (!string.IsNullOrWhiteSpace(_options.SmtpUsername))
            {
                await client.AuthenticateAsync(_options.SmtpUsername, _options.SmtpPassword, timeoutCts.Token);
            }

            await client.SendAsync(message, timeoutCts.Token);
            await client.DisconnectAsync(true, timeoutCts.Token);
            _logger.LogInformation("SMTP send success -> To: {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMTP send failed -> To: {Email}, Host: {Host}:{Port}", toEmail, _options.SmtpHost, _options.SmtpPort);
            throw;
        }
    }

    private SecureSocketOptions GetSecureSocketOptions()
    {
        if (!_options.SmtpUseSsl)
        {
            return SecureSocketOptions.Auto;
        }

        return _options.SmtpPort == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;
    }
}
