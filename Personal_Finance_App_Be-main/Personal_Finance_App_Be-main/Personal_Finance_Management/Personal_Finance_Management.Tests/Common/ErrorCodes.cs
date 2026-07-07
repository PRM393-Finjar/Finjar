namespace Personal_Finance_Management.Tests.Common;

/// <summary>
/// Strongly-typed error code dictionary used by helpers/asserts and to assert
/// that the right <c>AppValidationException.Details.code</c> is propagated.
/// </summary>
public static class ErrorCodes
{
    public const string InvalidAmount = "INVALID_AMOUNT";
    public const string SameSourceAndDestination = "SAME_SOURCE_AND_DESTINATION";
    public const string FinancialAccountNotFound = "FINANCIAL_ACCOUNT_NOT_FOUND";
    public const string LinkedAccountManualNotAllowed = "LINKED_ACCOUNT_MANUAL_TRANSACTION_NOT_ALLOWED";
    public const string JarNotFound = "JAR_NOT_FOUND";
    public const string CategoryNotFound = "CATEGORY_NOT_FOUND";
    public const string TransactionNotFound = "TRANSACTION_NOT_FOUND";
    public const string LinkedUpdateNotAllowed = "LINKED_TRANSACTION_UPDATE_NOT_ALLOWED";
    public const string LinkedDeleteNotAllowed = "LINKED_TRANSACTION_DELETE_NOT_ALLOWED";
    public const string InsufficientFunds = "INSUFFICIENT_FUNDS";
    public const string InvalidLimitAmount = "INVALID_LIMIT_AMOUNT";
    public const string CassoWebhookUnauthorized = "CASSO_WEBHOOK_UNAUTHORIZED";
    public const string CassoWebhookInvalid = "CASSO_WEBHOOK_INVALID";
    public const string CassoAccountConflict = "CASSO_ACCOUNT_CONFLICT";
    public const string CassoSyncLinkedRequired = "CASSO_SYNC_LINKED_ACCOUNT_REQUIRED";
    public const string CassoSyncInvalid = "CASSO_SYNC_INVALID";
    public const string CassoResponseInvalid = "CASSO_RESPONSE_INVALID";
    public const string CassoSyncFailed = "CASSO_SYNC_FAILED";
    public const string CassoConfigMissing = "CASSO_CONFIG_MISSING";
    public const string ImportAlreadyConfirmed = "IMPORT_ALREADY_CONFIRMED";
    public const string ImportDraftRequired = "IMPORT_DRAFT_REQUIRED";
    public const string InvalidImportDraft = "INVALID_IMPORT_DRAFT";
    public const string DraftAmountRequired = "DRAFT_AMOUNT_REQUIRED";
    public const string DraftTransactionDateRequired = "DRAFT_TRANSACTION_DATE_REQUIRED";
    public const string InvalidTransactionType = "INVALID_TRANSACTION_TYPE";
    public const string InsufficientJarBalance = "INSUFFICIENT_JAR_BALANCE";
    public const string InsufficientAccountBalance = "INSUFFICIENT_ACCOUNT_BALANCE";
    public const string ImportConfirmSourceConflict = "IMPORT_CONFIRM_SOURCE_CONFLICT";
    public const string ImportNotFound = "IMPORT_NOT_FOUND";
    public const string ImportDraftNotFound = "IMPORT_DRAFT_NOT_FOUND";
    public const string UploadNotFound = "UPLOAD_NOT_FOUND";
    public const string InvalidFileName = "INVALID_FILE_NAME";
    public const string FinancialAccountAlreadyExists = "FINANCIAL_ACCOUNT_ALREADY_EXISTS";
    public const string FinancialAccountNameRequired = "FINANCIAL_ACCOUNT_NAME_REQUIRED";
    public const string FinancialAccountNameTooLong = "FINANCIAL_ACCOUNT_NAME_TOO_LONG";
    public const string InvalidFinancialAccountType = "INVALID_FINANCIAL_ACCOUNT_TYPE";
    public const string InvalidCurrency = "INVALID_CURRENCY";
    public const string BankNameRequired = "BANK_NAME_REQUIRED";
    public const string BankAccountNumberRequired = "BANK_ACCOUNT_NUMBER_REQUIRED";
    public const string BankCodeTooLong = "BANK_CODE_TOO_LONG";
    public const string BankAccountNumberTooLong = "BANK_ACCOUNT_NUMBER_TOO_LONG";
    public const string BankNameTooLong = "BANK_NAME_TOO_LONG";
    public const string AccountHolderNameTooLong = "ACCOUNT_HOLDER_NAME_TOO_LONG";
    public const string LinkedAccountAlreadyExists = "LINKED_ACCOUNT_ALREADY_EXISTS";
    public const string LinkedBalanceReadOnly = "LINKED_ACCOUNT_BALANCE_READ_ONLY";
    public const string OtpInvalid = "INVALID_OTP";
    public const string OtpExpired = "OTP_EXPIRED";
    public const string InvalidEmail = "INVALID_EMAIL";
    public const string LimitNotFound = "LIMIT_NOT_FOUND";
    public const string Required = "REQUIRED";
}
