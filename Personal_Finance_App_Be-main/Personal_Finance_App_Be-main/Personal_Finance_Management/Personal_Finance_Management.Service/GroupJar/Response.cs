namespace Personal_Finance_Management.Service.GroupJar;

public class Response
{
    public class GetGroupJarsResult
    {
        public List<GroupJarItemResponse> data { get; set; } = new();
    }

    public class GroupJarItemResponse
    {
        public Guid id { get; set; }
        public string name { get; set; } = string.Empty;
        public string? description { get; set; }
        public decimal targetAmount { get; set; }
        public decimal currentBalance { get; set; }
        public string currency { get; set; } = "VND";
        public string? color { get; set; }
        public string? icon { get; set; }
        public string role { get; set; } = "Member";
        public int memberCount { get; set; }
    }

    public class GroupJarDetailResponse
    {
        public Guid id { get; set; }
        public string name { get; set; } = string.Empty;
        public string? description { get; set; }
        public decimal targetAmount { get; set; }
        public decimal currentBalance { get; set; }
        public string currency { get; set; } = "VND";
        public string? color { get; set; }
        public string? icon { get; set; }
        public string role { get; set; } = "Member";
        public List<GroupJarMemberResponse> members { get; set; } = new();
    }

    public class GroupJarMemberResponse
    {
        public Guid userId { get; set; }
        public string username { get; set; } = string.Empty;
        public string fullName { get; set; } = string.Empty;
        public string email { get; set; } = string.Empty;
        public string? avatarUrl { get; set; }
        public string role { get; set; } = "Member";
        public DateTimeOffset joinedAt { get; set; }
    }

    public class GroupJarMessageResponse
    {
        public Guid id { get; set; }
        public Guid groupJarId { get; set; }
        public Guid senderId { get; set; }
        public string senderName { get; set; } = string.Empty;
        public string messageType { get; set; } = "Text"; // "Text" or "DepositInvoice"
        public string content { get; set; } = string.Empty;
        public decimal? depositAmount { get; set; }
        public DateTimeOffset createdAt { get; set; }
    }
}
