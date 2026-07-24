using Personal_Finance_Management.Repository.Abtraction;

namespace Personal_Finance_Management.Repository.Entity;

public class Account : BaseEntity, IAudictableEntity
{
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public string Status { get; set; } = "Active";
    public string? StatusReason { get; set; }
    public string PreferredCurrency { get; set; } = "VND";
    public string? TimeZoneId { get; set; }
    public string? SePayWebhookApiKey { get; set; }
    public string? QuotaTimeZoneId { get; set; }
    public DateTimeOffset? QuotaTimeZoneChangeEffectiveAt { get; set; }
    public bool IsOnboardingCompleted { get; set; } = false;
    public bool IsEmailVerified { get; set; } = false;
    public DateTimeOffset? PremiumExpiresAt { get; set; }

    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public OnboardingProfile? OnboardingProfile { get; set; }
    public JarSetup? JarSetup { get; set; }
    public ICollection<FinancialAccount> FinancialAccounts { get; set; } = new List<FinancialAccount>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<SubscriptionPayment> SubscriptionPayments { get; set; } = new List<SubscriptionPayment>();

    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public bool IsPremium => PremiumExpiresAt.HasValue && PremiumExpiresAt.Value > DateTimeOffset.UtcNow;
}
