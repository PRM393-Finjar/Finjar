namespace Personal_Finance_Management.Service.Email;

/// <summary>Existing mail config from appsettings.json / render env (MailOptions__*).</summary>
public class LegacyMailOptions
{
    public const string SectionName = "MailOptions";

    public string? Mail { get; set; }
    public string? DisplayName { get; set; }
    public string? Password { get; set; }
    public string? Host { get; set; }
    public int Port { get; set; } = 587;
}
