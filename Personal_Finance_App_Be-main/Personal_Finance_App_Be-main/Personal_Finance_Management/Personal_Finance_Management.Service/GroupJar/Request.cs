using System.ComponentModel.DataAnnotations;

namespace Personal_Finance_Management.Service.GroupJar;

public class Request
{
    public class CreateGroupJarRequest
    {
        [Required]
        public string name { get; set; } = string.Empty;
        public string? description { get; set; }
        public decimal targetAmount { get; set; } = 0;
        public string? color { get; set; }
        public string? icon { get; set; }
    }

    public class InviteMemberRequest
    {
        [Required]
        public string email { get; set; } = string.Empty;
    }

    public class DepositRequest
    {
        [Required]
        public decimal amount { get; set; }
        public Guid? financialAccountId { get; set; }
        public string? note { get; set; }
    }

    public class SendMessageRequest
    {
        [Required]
        public string content { get; set; } = string.Empty;
    }
}
