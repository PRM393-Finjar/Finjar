namespace Personal_Finance_Management.Service.Subscription;

public class Request
{
    public class CreatePaymentRequest
    {
        /// <summary>Optional override; defaults to configured PremiumAmount.</summary>
        public int? Amount { get; set; }

        /// <summary>Optional override; defaults to configured PremiumDurationDays.</summary>
        public int? DurationDays { get; set; }
    }
}
