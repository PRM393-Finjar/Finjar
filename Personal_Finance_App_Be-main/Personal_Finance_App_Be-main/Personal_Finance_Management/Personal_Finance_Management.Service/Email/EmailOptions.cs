namespace Personal_Finance_Management.Service.Email;

public class EmailOptions
{
    public const string SectionName = "Email";

    public string FromAddress { get; set; } = "noreply@finjar.local";
    public string FromName { get; set; } = "Finjar";
    public int OtpLength { get; set; } = 6;
    public int OtpExpiryMinutes { get; set; } = 10;
    public bool UseSmtp { get; set; } = false;
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public bool SmtpUseSsl { get; set; } = true;
}
