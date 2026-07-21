namespace Personal_Finance_Management.Service.Subscription;

public interface IService
{
    Task<Response.CreatePaymentResponse> CreatePaymentAsync(Request.CreatePaymentRequest request);
    Task<Response.SubscriptionStatusResponse> GetStatusAsync();
    Task<Response.WebhookAckResponse> ProcessWebhookAsync(System.Text.Json.JsonElement payload);
}
