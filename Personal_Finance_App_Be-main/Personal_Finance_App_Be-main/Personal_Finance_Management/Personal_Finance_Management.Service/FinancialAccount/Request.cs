namespace Personal_Finance_Management.Service.FinancialAccount;

public class Request
{
    public class CreateManualFinancialAccountRequest
    {
        public string name { get; set; }
        public string accountType  { get; set; }
        public decimal currentBalance { get; set; }
        public string? currency  { get; set; }
        public bool isDefault { get; set; }
    }

    public class CreateLinkApiFinancialAccountRequest
    {
        public string bankName { get; set; }
        public string? bankCode { get; set; }
        public string accountNumber { get; set; }
        public string? accountHolderName { get; set; }
        public bool isDefault { get; set; }
    }

    public class ConnectSePayFinancialAccountRequest
    {
        public string providerCode { get; set; }
        public string bankCode { get; set; }
        public string accountNumber { get; set; }
        public string accountName { get; set; }
        public string sepayApiKey { get; set; }
        /// <summary>Optional starting balance before the first SePay webhook.</summary>
        public decimal? currentBalance { get; set; }
    }

    public class UpdateFinancialAccountRequest
    {
        public string? name { get; set; }
        public decimal? currentBalance { get; set; }
        public bool? isDefault { get; set; }
    }
}
