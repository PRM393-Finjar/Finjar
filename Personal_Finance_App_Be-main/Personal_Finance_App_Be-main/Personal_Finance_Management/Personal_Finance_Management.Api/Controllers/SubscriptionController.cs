using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionService = Personal_Finance_Management.Service.Subscription;

namespace Personal_Finance_Management.Api.Controllers;

[ApiController]
[Route("api/v1/subscription")]
public class SubscriptionController : ControllerBase
{
    private readonly SubscriptionService.IService _subscriptionService;

    public SubscriptionController(SubscriptionService.IService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet("status")]
    [Authorize]
    public async Task<IActionResult> GetStatus()
    {
        var result = await _subscriptionService.GetStatusAsync();
        return Ok(result);
    }

    [HttpPost("create-payment")]
    [Authorize]
    public async Task<IActionResult> CreatePayment([FromBody] SubscriptionService.Request.CreatePaymentRequest? request)
    {
        var result = await _subscriptionService.CreatePaymentAsync(
            request ?? new SubscriptionService.Request.CreatePaymentRequest());
        return Ok(result);
    }

    /// <summary>
    /// PayOS webhook. Register in PayOS dashboard:
    /// https://finjar-i2il.onrender.com/api/v1/subscription/webhook
    /// </summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook()
    {
        using var document = await System.Text.Json.JsonDocument.ParseAsync(Request.Body);
        var result = await _subscriptionService.ProcessWebhookAsync(document.RootElement);
        return Ok(result);
    }

    [HttpGet("return")]
    [AllowAnonymous]
    public ContentResult Return()
    {
        return Content(
            "<!doctype html><html><body style='font-family:sans-serif;padding:2rem'>"
            + "<h2>Thanh toán thành công</h2>"
            + "<p>Bạn có thể quay lại app FinJar. Premium sẽ được kích hoạt trong giây lát.</p>"
            + "</body></html>",
            "text/html");
    }

    [HttpGet("cancel")]
    [AllowAnonymous]
    public ContentResult Cancel()
    {
        return Content(
            "<!doctype html><html><body style='font-family:sans-serif;padding:2rem'>"
            + "<h2>Đã huỷ thanh toán</h2>"
            + "<p>Bạn có thể đóng trang này và thử lại trong app FinJar.</p>"
            + "</body></html>",
            "text/html");
    }
}
