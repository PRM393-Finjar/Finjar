namespace Personal_Finance_Management.Service.Auth;

public class Response
{
    public class RegisterResponse
    {
        public Guid Id { get; set; }
        public required string Username { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public bool IsOnboardingCompleted { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool RequiresEmailVerification { get; set; }
        public string? AccessToken { get; set; }
        public string? Message { get; set; }
    }
    public class LoginResponse
    {
        public Guid Id { get; set; }
        public required string Username { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public bool IsOnboardingCompleted { get; set; }
        public bool IsEmailVerified { get; set; }
        public required string AccessToken { get; set; }

    }
}
