using Personal_Finance_Management.Repository.Abtraction;

namespace Personal_Finance_Management.Repository.Entity;

public class SubscriptionPayment : BaseEntity, IAudictableEntity
{
    public Guid AccountId { get; set; }
    public Account Account { get; set; } = null!;

    /// <summary>PayOS order code (unique integer).</summary>
    public long OrderCode { get; set; }

    public int Amount { get; set; }
    public int DurationDays { get; set; } = 30;

    /// <summary>Pending | Paid | Cancelled | Failed</summary>
    public string Status { get; set; } = "Pending";

    public string? PaymentLinkId { get; set; }
    public string? CheckoutUrl { get; set; }
    public string? Description { get; set; }
    public string? PayOSReference { get; set; }
    public string? TransactionDateTime { get; set; }

    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
