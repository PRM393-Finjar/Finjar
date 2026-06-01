namespace Personal_Finance_Management.Service.User;

public class Request
{
    public class UpdateUserRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? PreferredCurrency { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
    public class UserIdRequest
    {
        public Guid UserId { get; set; }
    }

    public class GetAdminUsersRequest
    {
        public int PageIndex { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? Status { get; set; }
        public string? Keyword { get; set; }
    }

    public class UserStatusRequest
    {
        public Guid UserId { get; set; }
        public string? Status { get; set; }
        public string? StatusReason { get; set; }
    }
}
