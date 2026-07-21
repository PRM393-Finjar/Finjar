namespace Personal_Finance_Management.Service.Subscription;

public class PayOSOptions
{
    public const string SectionName = "PayOSOptions";

    public string ClientId { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ChecksumKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api-merchant.payos.vn";
    public string ReturnUrl { get; set; } = "https://finjar-i2il.onrender.com/api/v1/subscription/return";
    public string CancelUrl { get; set; } = "https://finjar-i2il.onrender.com/api/v1/subscription/cancel";
    public int PremiumAmount { get; set; } = 29000;
    public int PremiumDurationDays { get; set; } = 30;
    public string PremiumDescription { get; set; } = "FinjarPre";
}
