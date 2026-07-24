using Personal_Finance_Management.Repository.Entity;

namespace Personal_Finance_Management.Service.User;

public class Response
{
    public class GetUserInforResponse
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string PreferredCurrency { get; set; } = "VND";
        public string TimeZoneId { get; set; } = "Asia/Ho_Chi_Minh";
        public bool IsOnboardingCompleted { get; set; }
        public bool IsPremium { get; set; }
        public DateTimeOffset? PremiumExpiresAt { get; set; }
        /// <summary>Free plan: max transactions per local day. Null/ignored when premium.</summary>
        public int DailyTransactionLimit { get; set; } = 10;
        /// <summary>Transactions created today (user timezone). Premium still reports usage.</summary>
        public int DailyTransactionUsed { get; set; }
        public int DailyTransactionRemaining { get; set; }
    }

    public class UpdateUserResponse
    {
        public Guid Id { get; set; }
        public string fullName { get; set; }
        public string phone { get; set; }
        public string avatarUrl { get; set; }
        public string timeZoneId { get; set; } = "Asia/Ho_Chi_Minh";
    }

    public class ViewSetupResponse
    {
        public bool isOnboardingCompleted { get; set; }
        public decimal? monthlyIncome { get; set; }
        public string budgetMethod { get; set; } = "Undecided";
        public Guid? defaultFinancialAccountId { get; set; }
        public int jarCount { get; set; }
        public int financialAccountCount { get; set; }
        public int limitCount { get; set; }
        public int activeGoalCount { get; set; }
    }

    public class AdminUserResponse
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string PreferredCurrency { get; set; } = "VND";
        public string TimeZoneId { get; set; } = "Asia/Ho_Chi_Minh";
        public bool IsOnboardingCompleted { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? StatusReason { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset? LastLoginAt { get; set; }
    }
}
