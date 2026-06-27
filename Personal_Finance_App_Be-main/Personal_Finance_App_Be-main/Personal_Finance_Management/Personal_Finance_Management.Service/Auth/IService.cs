namespace Personal_Finance_Management.Service.Auth;

public interface IService
{
    Task<Response.RegisterResponse> Register(Request.RegisterRequest request);
    Task<Response.LoginResponse> Login(Request.LoginRequest request);
    Task<string> Logout();
    Task VerifyEmailOtpAsync(Request.VerifyEmailOtpRequest request);
    Task ResendVerificationEmailAsync(Request.ResendVerificationRequest request);
}
