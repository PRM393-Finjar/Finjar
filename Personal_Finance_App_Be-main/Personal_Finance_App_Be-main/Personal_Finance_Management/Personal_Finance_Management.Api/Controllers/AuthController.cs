using Microsoft.AspNetCore.Mvc;
using AuthRequest = Personal_Finance_Management.Service.Auth.Request;
using AuthService = Personal_Finance_Management.Service.Auth;

namespace Personal_Finance_Management.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService.IService _authService;

    public AuthController(AuthService.IService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthRequest.RegisterRequest request)
    {
        var result = await _authService.Register(request);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest.LoginRequest request)
    {
        var result = await _authService.Login(request);
        return Ok(result);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
       var result = await _authService.Logout();
        return Ok(new { Message = result });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmailOtp([FromBody] AuthRequest.VerifyEmailOtpRequest request)
    {
        await _authService.VerifyEmailOtpAsync(request);
        return Ok(new { message = "Email đã được xác thực. Bạn có thể đăng nhập." });
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] AuthRequest.ResendVerificationRequest request)
    {
        await _authService.ResendVerificationEmailAsync(request);
        return Ok(new { message = "Mã OTP mới đã được gửi tới email của bạn." });
    }
}
