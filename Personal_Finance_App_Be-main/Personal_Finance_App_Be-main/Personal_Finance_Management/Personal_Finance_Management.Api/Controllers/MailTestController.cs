using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Personal_Finance_Management.Service.Email;

namespace Personal_Finance_Management.Api.Controllers;

/// <summary>
/// Temporary SMTP probe — Development only. Does not go through OTP flow.
/// </summary>
[ApiController]
[Route("api/test/mail")]
public class MailTestController : ControllerBase
{
    private readonly IEmailSender _emailSender;
    private readonly IOptions<EmailOptions> _emailOptions;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<MailTestController> _logger;

    public MailTestController(
        IEmailSender emailSender,
        IOptions<EmailOptions> emailOptions,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<MailTestController> logger)
    {
        _emailSender = emailSender;
        _emailOptions = emailOptions;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> SendTestMail(
        [FromQuery] string? to,
        CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var options = _emailOptions.Value;
        var senderType = _emailSender.GetType().Name;
        var toEmail = string.IsNullOrWhiteSpace(to)
            ? options.FromAddress
            : to.Trim();

        if (string.IsNullOrWhiteSpace(toEmail))
        {
            return BadRequest(new
            {
                ok = false,
                error = "No recipient. Pass ?to=you@gmail.com or set MailOptions__Mail / Email:FromAddress."
            });
        }

        _logger.LogWarning(
            "MAIL TEST start. Sender={SenderType}, UseSmtp={UseSmtp}, To={To}, Host={Host}, Port={Port}",
            senderType,
            options.UseSmtp,
            toEmail,
            options.SmtpHost,
            options.SmtpPort);

        try
        {
            await _emailSender.SendAsync(
                toEmail,
                "SMTP TEST",
                "<p>Hello from Finjar /api/test/mail</p>",
                cancellationToken);

            return Ok(new
            {
                ok = true,
                senderType,
                useSmtp = options.UseSmtp,
                to = toEmail,
                host = options.SmtpHost,
                port = options.SmtpPort,
                message = senderType == nameof(LoggingEmailSender)
                    ? "Call completed but LoggingEmailSender was used — email was NOT sent via SMTP."
                    : "SMTP SendAsync completed without exception."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MAIL TEST failed. Sender={SenderType}", senderType);

            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                ok = false,
                senderType,
                useSmtp = options.UseSmtp,
                to = toEmail,
                host = options.SmtpHost,
                port = options.SmtpPort,
                exceptionType = ex.GetType().FullName,
                message = ex.Message,
                stackTrace = ex.ToString(),
                mailOptionsPasswordEnv = string.IsNullOrWhiteSpace(
                        Environment.GetEnvironmentVariable("MailOptions__Password"))
                    ? "EMPTY_OR_NULL"
                    : "SET",
                configMailPassword = string.IsNullOrWhiteSpace(
                        _configuration["MailOptions:Password"])
                    ? "EMPTY"
                    : "OK",
                emailSmtpPassword = string.IsNullOrWhiteSpace(options.SmtpPassword)
                    ? "EMPTY"
                    : "OK"
            });
        }
    }
}
