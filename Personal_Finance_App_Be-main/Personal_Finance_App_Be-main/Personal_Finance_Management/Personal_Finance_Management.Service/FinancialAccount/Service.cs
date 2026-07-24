using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Service.Base;
using Personal_Finance_Management.Service.Validations;

namespace Personal_Finance_Management.Service.FinancialAccount;

public class Service : IService
{
    private const string SePayProviderCode = "SEPAY";
    private const string SePayProviderName = "SePay";
    private const string ActiveSyncStatus = "Synced";

    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContext;

    public Service(AppDbContext dbContext, IHttpContextAccessor httpContext)
    {
        _dbContext = dbContext;
        _httpContext = httpContext;
    }
    
    public async Task<Response.GetFinancialAccountResult> GetUserFinancialAccount()
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);

        if (user == null)
            throw AppValidationException.Unauthorized("User not found", "user", "USER_NOT_FOUND");
        var query = _dbContext.FinancialAccounts.Where(x => x.UserId == userIdGuid && x.IsActive);
        var selectedQuery = query.Select(x => new Response.GetFinancialAccountResponse
        {
            id = x.Id,
            name = x.Name,
            accountType = x.AccountType,
            connectionMode = x.ConnectionMode,
            providerName = x.ProviderName,
            maskedAccountNumber = x.MaskedAccountNumber,
            currency = x.Currency,
            currentBalance = x.CurrentBalance,
            syncStatus = x.SyncStatus,
            lastSync = x.LastSyncedAt,
            isDefault = x.IsDefault,
            isActive = x.IsActive
        });
        var accountList = await selectedQuery.ToListAsync();
        var result = new Response.GetFinancialAccountResult
        {
            data = accountList,
        };
        return result;
    }

    public async Task<Response.CreateManualFinancialAccountResponse> CreateManualFinancialAccount(Request.CreateManualFinancialAccountRequest request)
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);

        if (user == null)
            throw new Exception("User not found");

        var accountName = request.name?.Trim();
        var accountType = request.accountType?.Trim();
        var currency = string.IsNullOrWhiteSpace(request.currency) ? "VND" : request.currency.Trim();

        if (string.IsNullOrWhiteSpace(accountName))
        {
            throw AppValidationException.BadRequest("Financial account name is required", "name", "FINANCIAL_ACCOUNT_NAME_REQUIRED");
        }

        if (accountName.Length > 100)
        {
            throw AppValidationException.BadRequest("Financial account name is too long", "name", "FINANCIAL_ACCOUNT_NAME_TOO_LONG");
        }

        if (string.IsNullOrWhiteSpace(accountType)
            || !new[] { "Cash", "Bank", "EWallet", "Other" }.Contains(accountType))
        {
            throw AppValidationException.BadRequest("Invalid financial account type", "accountType", "INVALID_FINANCIAL_ACCOUNT_TYPE");
        }

        if (currency.Length != 3 || currency.Any(x => !char.IsLetter(x)))
        {
            throw AppValidationException.BadRequest("Currency must be a 3-letter code, for example VND", "currency", "INVALID_CURRENCY");
        }

        currency = currency.ToUpperInvariant();

        var existedAccount = _dbContext.FinancialAccounts
            .FirstOrDefault(x => x.UserId == userIdGuid && x.Name == accountName && x.IsActive);
        if (existedAccount != null)
        {
            throw AppValidationException.Conflict("Financial account already exists", "name", "FINANCIAL_ACCOUNT_ALREADY_EXISTS");
        }

        var financialAccount = new Repository.Entity.FinancialAccount()
        {
            Id = Guid.NewGuid(),
            Name = accountName,
            AccountType = accountType,
            ConnectionMode = "Manual",
            CurrentBalance = request.currentBalance,
            Currency = currency,
            SyncStatus = "NeverSynced",
            UserId = user.Id,
            IsDefault = request.isDefault,
            IsActive = true
        };

        _dbContext.FinancialAccounts.Add(financialAccount);
        await _dbContext.SaveChangesAsync();

        var result = new Response.CreateManualFinancialAccountResponse
        {
            id = financialAccount.Id,
            name = financialAccount.Name,
            accountType = financialAccount.AccountType,
            connectionMode = financialAccount.ConnectionMode,
            currentBalance = financialAccount.CurrentBalance,
            currency = financialAccount.Currency,
            isDefault = financialAccount.IsDefault,
            isActive = financialAccount.IsActive
        };

        return result;
    }

    public async Task<Response.CreateLinkApiFinancialAccountResponse> CreateLinkApiFinancialAccount(Request.CreateLinkApiFinancialAccountRequest request)
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);

        if (user == null)
            throw new Exception("User not found");

        var bankName = request.bankName?.Trim();
        var accountNumber = request.accountNumber?.Trim();
        var accountHolderName = request.accountHolderName?.Trim();
        var bankCode = request.bankCode?.Trim();

        if (string.IsNullOrWhiteSpace(bankName))
        {
            throw AppValidationException.BadRequest("Bank name is required", "bankName", "BANK_NAME_REQUIRED");
        }

        if (bankName.Length > 100)
        {
            throw AppValidationException.BadRequest("Bank name is too long", "bankName", "BANK_NAME_TOO_LONG");
        }

        if (bankCode?.Length > 50)
        {
            throw AppValidationException.BadRequest("Bank code is too long", "bankCode", "BANK_CODE_TOO_LONG");
        }

        if (string.IsNullOrWhiteSpace(accountNumber))
        {
            throw AppValidationException.BadRequest("Bank account number is required", "accountNumber", "BANK_ACCOUNT_NUMBER_REQUIRED");
        }

        if (accountNumber.Length > 50)
        {
            throw AppValidationException.BadRequest("Bank account number is too long", "accountNumber", "BANK_ACCOUNT_NUMBER_TOO_LONG");
        }

        if (accountHolderName?.Length > 150)
        {
            throw AppValidationException.BadRequest("Account holder name is too long", "accountHolderName", "ACCOUNT_HOLDER_NAME_TOO_LONG");
        }

        var existedLinkedAccount = _dbContext.FinancialAccounts.FirstOrDefault(x =>
            x.UserId == userIdGuid
            && x.ConnectionMode == "LinkedApi"
            && (x.ExternalAccountRef == accountNumber
                || x.ExternalAccountId == accountNumber
                || x.MaskedAccountNumber == accountNumber));

        if (existedLinkedAccount != null)
        {
            throw AppValidationException.Conflict("Linked bank account already exists", "accountNumber", "LINKED_ACCOUNT_ALREADY_EXISTS");
        }

        var maskedAccountNumber = ServiceTextHelper.MaskTrailing(accountNumber);

        var financialAccount = new Repository.Entity.FinancialAccount()
        {
            Id = Guid.NewGuid(),
            Name = bankName,
            AccountType = "Bank",
            ConnectionMode = "LinkedApi",
            ProviderCode = SePayProviderCode,
            ProviderName = SePayProviderName,
            ExternalAccountId = accountNumber,
            ExternalAccountRef = accountNumber,
            MaskedAccountNumber = maskedAccountNumber,
            AccountHolderName = accountHolderName,
            CurrentBalance = 0,
            Currency = "VND",
            SyncStatus = ActiveSyncStatus,
            UserId = user.Id,
            IsDefault = request.isDefault,
            IsActive = true
        };

        _dbContext.FinancialAccounts.Add(financialAccount);
        await _dbContext.SaveChangesAsync();

        var result = new Response.CreateLinkApiFinancialAccountResponse
        {
            id = financialAccount.Id,
            name = financialAccount.Name,
            accountType = financialAccount.AccountType,
            connectionMode = financialAccount.ConnectionMode,
            providerName = financialAccount.ProviderName,
            maskedAccountNumber = financialAccount.MaskedAccountNumber,
            currentBalance = financialAccount.CurrentBalance,
            currency = financialAccount.Currency,
            syncStatus = financialAccount.SyncStatus,
            isDefault = financialAccount.IsDefault,
            isActive = financialAccount.IsActive
        };

        return result;
    }

    public async Task<Response.ConnectSePayFinancialAccountResponse> ConnectSePayFinancialAccount(
        Request.ConnectSePayFinancialAccountRequest request)
    {
        if (request is null)
        {
            throw AppValidationException.BadRequest("Request body is required", "body", "REQUIRED");
        }

        var userIdGuid = GetCurrentUserId();
        var user = await _dbContext.Accounts.FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null)
        {
            throw AppValidationException.Unauthorized("User not found", "user", "USER_NOT_FOUND");
        }

        var providerCode = request.providerCode?.Trim().ToUpperInvariant();
        if (providerCode != SePayProviderCode)
        {
            throw AppValidationException.BadRequest("Provider code must be SEPAY", "providerCode", "SEPAY_PROVIDER_REQUIRED");
        }

        var bankCode = request.bankCode?.Trim().ToUpperInvariant();
        var bankName = ResolveBankName(bankCode);
        if (bankName is null)
        {
            throw AppValidationException.BadRequest("Unsupported bank code", "bankCode", "SEPAY_BANK_UNSUPPORTED");
        }

        var accountNumber = request.accountNumber?.Trim();
        if (string.IsNullOrWhiteSpace(accountNumber))
        {
            throw AppValidationException.BadRequest("Bank account number is required", "accountNumber", "BANK_ACCOUNT_NUMBER_REQUIRED");
        }

        if (accountNumber.Length > 50)
        {
            throw AppValidationException.BadRequest("Bank account number is too long", "accountNumber", "BANK_ACCOUNT_NUMBER_TOO_LONG");
        }

        var accountName = request.accountName?.Trim();
        if (string.IsNullOrWhiteSpace(accountName))
        {
            throw AppValidationException.BadRequest("Account name is required", "accountName", "ACCOUNT_NAME_REQUIRED");
        }

        if (accountName.Length > 150)
        {
            throw AppValidationException.BadRequest("Account name is too long", "accountName", "ACCOUNT_NAME_TOO_LONG");
        }

        var startingBalance = request.currentBalance ?? 0m;
        if (startingBalance < 0)
        {
            throw AppValidationException.BadRequest("Starting balance cannot be negative", "currentBalance", "INVALID_BALANCE");
        }

        var existedLinkedAccount = await _dbContext.FinancialAccounts.AnyAsync(x =>
            x.UserId == userIdGuid
            && x.IsActive
            && x.ConnectionMode == "LinkedApi"
            && x.ProviderCode == SePayProviderCode
            && (x.ExternalAccountRef == accountNumber
                || x.ExternalAccountId == accountNumber));

        if (existedLinkedAccount)
        {
            throw AppValidationException.Conflict("SePay bank account already connected", "accountNumber", "SEPAY_ACCOUNT_ALREADY_CONNECTED");
        }

        var shouldSetDefault = !await _dbContext.FinancialAccounts
            .AnyAsync(x => x.UserId == userIdGuid && x.IsActive);

        var financialAccount = new Repository.Entity.FinancialAccount
        {
            Id = Guid.NewGuid(),
            Name = bankName,
            AccountType = "Bank",
            ConnectionMode = "LinkedApi",
            ProviderCode = SePayProviderCode,
            ProviderName = SePayProviderName,
            ExternalAccountId = accountNumber,
            ExternalAccountRef = accountNumber,
            MaskedAccountNumber = ServiceTextHelper.MaskTrailing(accountNumber),
            AccountHolderName = accountName,
            CurrentBalance = startingBalance,
            Currency = "VND",
            SyncStatus = ActiveSyncStatus,
            UserId = user.Id,
            IsDefault = shouldSetDefault,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.FinancialAccounts.Add(financialAccount);
        await _dbContext.SaveChangesAsync();

        return new Response.ConnectSePayFinancialAccountResponse
        {
            id = financialAccount.Id,
            providerCode = financialAccount.ProviderCode,
            providerName = financialAccount.ProviderName,
            bankCode = bankCode!,
            bank = financialAccount.Name,
            maskedAccountNumber = financialAccount.MaskedAccountNumber!,
            accountName = financialAccount.AccountHolderName,
            currentBalance = financialAccount.CurrentBalance,
            currency = financialAccount.Currency,
            syncStatus = financialAccount.SyncStatus,
            lastSync = financialAccount.LastSyncedAt
        };
    }

    public async Task<Response.SePayConnectionStatusResponse> GetSePayConnectionStatus()
    {
        var userIdGuid = GetCurrentUserId();
        var account = await _dbContext.FinancialAccounts
            .Where(x => x.UserId == userIdGuid
                        && x.IsActive
                        && x.ConnectionMode == "LinkedApi"
                        && x.ProviderCode == SePayProviderCode)
            .OrderByDescending(x => x.LastSyncedAt ?? x.CreatedAt)
            .FirstOrDefaultAsync();

        if (account == null)
        {
            return new Response.SePayConnectionStatusResponse
            {
                connected = false,
                bank = null,
                lastSync = null,
                syncStatus = "Disconnected"
            };
        }

        return new Response.SePayConnectionStatusResponse
        {
            connected = true,
            bank = account.Name,
            lastSync = account.LastSyncedAt,
            syncStatus = account.SyncStatus
        };
    }

    public async Task<Response.UpdateFinancialAccountResponse> UpdateFinancialAccount(Guid id, Request.UpdateFinancialAccountRequest request)
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);

        if (user == null)
            throw new Exception("User not found");
        // var existedAccount = _dbContext.FinancialAccounts.FirstOrDefault(x => x.Id == id && x.Name == request.name);
        // if (existedAccount != null)
        // {
        //     throw new Exception("FinancialAccount already exists");
        // }
        var query = _dbContext.FinancialAccounts.FirstOrDefault(x => x.Id == id && x.UserId == userIdGuid);
        if (query == null)
        {
            throw AppValidationException.NotFound("Financial account not found", "financialAccountId", "FINANCIAL_ACCOUNT_NOT_FOUND");
        }

        if (string.Equals(query.ConnectionMode, "LinkedApi", StringComparison.OrdinalIgnoreCase)
            && request.currentBalance.HasValue
            && request.currentBalance.Value < 0)
        {
            throw AppValidationException.BadRequest("Linked bank account balance cannot be negative.", "currentBalance", "INVALID_BALANCE");
        }

        query.Name = request.name ?? query.Name;
        query.CurrentBalance = request.currentBalance ?? query.CurrentBalance;
        query.IsDefault = request.isDefault ?? query.IsDefault;
        query.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        var result = new Response.UpdateFinancialAccountResponse
        {
            id = query.Id,
            name = query.Name,
            currentBalance = query.CurrentBalance,
            isDefault = query.IsDefault,
            updatedAt = query.UpdatedAt,
        };
        return result;
    }

    public async Task<Response.DeleteFinancialAccountResponse> DeleteFinancialAccount(Guid id)
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);

        if (user == null)
            throw new Exception("User not found");
        var financialAccount = _dbContext.FinancialAccounts.FirstOrDefault(x => x.Id == id && x.UserId == userIdGuid);
        if (financialAccount == null)
        {
            throw AppValidationException.NotFound("Financial account not found", "financialAccountId", "FINANCIAL_ACCOUNT_NOT_FOUND");
        }

        financialAccount.IsActive = false;
        await _dbContext.SaveChangesAsync();
        var result = new Response.DeleteFinancialAccountResponse()
        {
            message = "Financial account deactivated"
        };
        return result;
    }

    private Guid GetCurrentUserId()
    {
        return ServiceClaimHelper.GetRequiredUserId(_httpContext);
    }

    private static string ResolveBankName(string? bankCode)
    {
        return bankCode?.ToUpperInvariant() switch
        {
            "VCB" or "VIETCOMBANK" => "Vietcombank",
            "MB" or "MBB" or "MBBANK" => "MB Bank",
            "TCB" or "TECHCOMBANK" => "Techcombank",
            "BIDV" => "BIDV",
            "CTG" or "VIETINBANK" => "VietinBank",
            "ACB" => "ACB",
            "VPB" or "VPBANK" => "VPBank",
            "TPB" or "TPBANK" => "TPBank",
            _ => string.IsNullOrWhiteSpace(bankCode) ? "Ngân hàng" : bankCode.Trim()
        };
    }
}
