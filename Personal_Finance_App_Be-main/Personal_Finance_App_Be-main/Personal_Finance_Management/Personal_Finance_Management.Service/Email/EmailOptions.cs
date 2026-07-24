namespace Personal_Finance_Management.Service.Email;

public class EmailOptions
{
    public const string SectionName = "Email";

    public string FromAddress { get; set; } = "noreply@finjar.local";
    public string FromName { get; set; } = "Finjar";
    public int OtpLength { get; set; } = 6;
    public int OtpExpiryMinutes { get; set; } = 10;

    /// <summary>Minimum seconds between OTP emails for the same address.</summary>
    public int OtpResendCooldownoldownSeconds { get; set; } = 60;

    /// <summary>Max OTP emails per address inside <see cref="OtpSendWindowMinutes"/>.</summary>
    public int OtpMaxSendsPerWindow { get; set; } = 5;

    /// <summary>Sliding window (minutes) for <see cref="OtpMaxSendsPerWindow"/>.</summary>
    public int OtpSendWindowMinutes { get; set; } = 60;

    /// <summary>
    /// When false (default), LoggingEmailSender throws so OTP APIs cannot pretend mail was sent.
    /// Set true only for local offline demos without SMTP.
    /// </summary>
    public bool AllowLoggingSender { get; set; } = false;

    public bool UseSmtp { get; set; } = false;
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public bool SmtpUseSsl { get; set; } = true;
}
