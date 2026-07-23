using Personal_Finance_Management.Repository.Abtraction;

namespace Personal_Finance_Management.Repository.Entity;

public class GroupJarMember : BaseEntity, IAudictableEntity
{
    public Guid GroupJarId { get; set; }
    public GroupJar GroupJar { get; set; } = null!;

    public Guid UserId { get; set; }
    public Account User { get; set; } = null!;

    public string Role { get; set; } = "Member"; // "Owner" or "Member"
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
