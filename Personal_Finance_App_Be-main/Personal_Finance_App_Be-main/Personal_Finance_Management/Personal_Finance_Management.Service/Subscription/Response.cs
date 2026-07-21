namespace Personal_Finance_Management.Service.Subscription;

public class Response
{
    public class CreatePaymentResponse
    {
        public Guid PaymentId { get; set; }
        public long OrderCode { get; set; }
        public int Amount { get; set; }
        public int DurationDays { get; set; }
        public string CheckoutUrl { get; set; } = string.Empty;
        public string? QrCode { get; set; }
        public string Status { get; set; } = "Pending";
    }

    public class SubscriptionStatusResponse
    {
        public bool IsPremium { get; set; }
        public DateTimeOffset? PremiumExpiresAt { get; set; }
        public int PremiumAmount { get; set; }
        public int PremiumDurationDays { get; set; }
        public string Currency { get; set; } = "VND";
    }

    public class WebhookAckResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = "ok";
    }
}
