using Personal_Finance_Management.Repository.Abtraction;

namespace Personal_Finance_Management.Repository.Entity;

public class GroupJar : BaseEntity, IAudictableEntity
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal TargetAmount { get; set; } = 0;
    public decimal CurrentBalance { get; set; } = 0;
    public string Currency { get; set; } = "VND";
    public string? Color { get; set; }
    public string? Icon { get; set; }
    public string Status { get; set; } = "Active";

    public Guid OwnerId { get; set; }
    public Account Owner { get; set; } = null!;

    public ICollection<GroupJarMember> Members { get; set; } = new List<GroupJarMember>();
    public ICollection<GroupJarMessage> Messages { get; set; } = new List<GroupJarMessage>();

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
