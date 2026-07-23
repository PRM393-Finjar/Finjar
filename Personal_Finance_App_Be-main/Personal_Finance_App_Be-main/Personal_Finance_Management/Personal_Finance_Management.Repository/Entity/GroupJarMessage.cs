using Personal_Finance_Management.Repository.Abtraction;

namespace Personal_Finance_Management.Repository.Entity;

public class GroupJarMessage : BaseEntity, IAudictableEntity
{
    public Guid GroupJarId { get; set; }
    public GroupJar GroupJar { get; set; } = null!;

    public Guid SenderId { get; set; }
    public Account Sender { get; set; } = null!;

    public string MessageType { get; set; } = "Text"; // "Text" or "DepositInvoice"
    public string Content { get; set; } = string.Empty;
    public decimal? DepositAmount { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
