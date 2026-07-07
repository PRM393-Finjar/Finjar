using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Service.Base;
using Personal_Finance_Management.Service.Validations;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Personal_Finance_Management.Service.Transaction;

public class Service : IService
{
    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContext;
    private readonly IConfiguration _configuration;

    public Service(AppDbContext dbContext, IHttpContextAccessor httpContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _httpContext = httpContext;
        _configuration = configuration;
    }
    
    public async Task<Response.GetTransactionsResult> GetTransactions(Request.GetTransactionsRequest request)
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null)
            throw new Exception("User not found");
        
        var isDeleted = request.isDeleted ?? false;
        var query = _dbContext.Transactions
            .Where(x => x.UserId == userIdGuid && x.IsDeleted == isDeleted);

        // Filter by financialAccountId
        if (request.financialAccountId.HasValue)
            query = query.Where(x => x.FinancialAccountId == request.financialAccountId);

        // Filter by type
        if (!string.IsNullOrEmpty(request.type))
            query = query.Where(x => x.Type == request.type);

        // Filter by jarId (matches FromJarId or ToJarId)
        if (request.jarId.HasValue)
            query = query.Where(x => x.FromJarId == request.jarId || x.ToJarId == request.jarId);

        // Filter by categoryId
        if (request.categoryId.HasValue)
            query = query.Where(x => x.CategoryId == request.categoryId.Value);

        // Filter by fromDate
        if (request.fromDate.HasValue)
        {
            var from = new DateTimeOffset(request.fromDate.Value.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
            query = query.Where(x => x.TransactionDate >= from);
        }

        // Filter by toDate
        if (request.toDate.HasValue)
        {
            var to = new DateTimeOffset(request.toDate.Value.ToDateTime(TimeOnly.MaxValue), TimeSpan.Zero);
            query = query.Where(x => x.TransactionDate <= to);
        }
        
        // Filter by keyword (search in Note and RawDescription)
        if (!string.IsNullOrEmpty(request.keyword))
        {
            var kw = request.keyword.ToLower();
            query = query.Where(x =>
                (x.Note != null && x.Note.ToLower().Contains(kw))
                || (x.RawDescription != null && x.RawDescription.ToLower().Contains(kw)));
        }
        // Sorting
        if (!string.IsNullOrEmpty(request.sortBy))
        {
            var sortDir = request.sortDir?.ToLower() == "asc" ? "asc" : "desc";

            switch (request.sortBy.ToLower())
            {
                case "date":
                    query = sortDir == "asc"
                        ? query.OrderBy(x => x.TransactionDate)
                        : query.OrderByDescending(x => x.TransactionDate);
                    break;

                case "amount":
                    query = sortDir == "asc"
                        ? query.OrderBy(x => x.TransactionsAmount)
                        : query.OrderByDescending(x => x.TransactionsAmount);
                    break;

                case "createdat":
                    query = sortDir == "asc"
                        ? query.OrderBy(x => x.CreatedAt)
                        : query.OrderByDescending(x => x.CreatedAt);
                    break;

                case "type":
                    query = sortDir == "asc"
                        ? query.OrderBy(x => x.Type)
                        : query.OrderByDescending(x => x.Type);
                    break;

                default:
                    query = query.OrderByDescending(x => x.CreatedAt);
                    break;
            }
        }
        else
        {
            // Default sort
            query = query.OrderByDescending(x => x.CreatedAt);
        }
        
        // H7: CountAsync MUST execute before Skip/Take so totalCount reflects ALL matching records
        // (the previous order applied Skip/Take first, then Count() on the trimmed window — wrong).
        var totalCount = await query.CountAsync();
        var pagedQuery = query
            .Skip((request.pageIndex - 1) * request.pageSize)
            .Take(request.pageSize);

        var selectedQuery = pagedQuery.Select(x => new Response.GetTransactionResponse
        {
            id = x.Id,
            type = x.Type,
            transactionsAmount = x.TransactionsAmount,
            note = x.Note,
            date = x.CreatedAt,
            financialAccount = new Response.TransactionFinancialAccountResponse
            {
                id = x.FinancialAccountId,
                name = x.FinancialAccount.Name,
            },
            jar = new Response.TransactionJarResponse
            {
                id = x.FromJar.Id,
                name = x.FromJar.Name,
            },
            category = new Response.TransactionCategoryResponse
            {
                id = x.Category.Id,
                name = x.Category.Name,
            }
        });
        var selectedPagination = new Response.PaginationResponse
        {
            page = request.pageIndex,
            pageSize = request.pageSize,
            totalCount = totalCount,
            totalPages = (totalCount + request.pageSize - 1) / request.pageSize,
        };

        var result = new Response.GetTransactionsResult
        {
            data = await selectedQuery.ToListAsync(),
            pagination = selectedPagination,
        };

        return result;
    }

    public async Task<Response.GetTransactionResponse> GetTransaction(Guid id)
    {
        var userIdGuid = GetCurrentUserId();

        var transaction = await _dbContext.Transactions
            .Include(x => x.FinancialAccount)
            .Include(x => x.Category)
            .Include(x => x.FromJar)
            .Include(x => x.ToJar)
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userIdGuid);

        if (transaction == null)
        {
            throw AppValidationException.NotFound("Transaction not found.", "id", "TRANSACTION_NOT_FOUND");
        }

        var res = new Response.GetTransactionResponse
        {
            id = transaction.Id,
            type = transaction.Type,
            transactionsAmount = transaction.TransactionsAmount,
            note = transaction.Note,
            date = transaction.TransactionDate,
            financialAccount = new Response.TransactionFinancialAccountResponse
            {
                id = transaction.FinancialAccountId,
                name = transaction.FinancialAccount?.Name
            },
            jar = new Response.TransactionJarResponse
            {
                id = transaction.FromJarId,
                name = transaction.FromJar?.Name
            },
            category = transaction.CategoryId.HasValue ? new Response.TransactionCategoryResponse
            {
                id = transaction.CategoryId,
                name = transaction.Category?.Name
            } : null,
            financialAccountId = transaction.FinancialAccountId,
            fromJarId = transaction.FromJarId,
            toJarId = transaction.ToJarId,
            categoryId = transaction.CategoryId,
            toJar = transaction.ToJarId.HasValue ? new Response.TransactionJarResponse
            {
                id = transaction.ToJarId,
                name = transaction.ToJar?.Name
            } : null,
            isDeleted = transaction.IsDeleted
        };

        // Note: The original GetTransactionResponse doesn't have fromJar and toJar explicitly mapped,
        // it uses `jar`. For Transfers, fromJar is mapped to `jar`, but frontend mapDetail needs more fields:
        // financialAccountId, fromJarId, toJarId, categoryId, toJar
        // Wait, I will just extend GetTransactionResponse to support these if necessary, but actually the frontend
        // mapDetail assumes it receives the raw API response and maps it. I'll return the extra fields directly.
        
        return res;
    }

    public async Task<Response.CreateTransactionResponse> CreateTransaction(Request.CreateTransactionRequest request)
    {
        var userIdGuid = GetCurrentUserId();

        // Validation: date cannot be in the future
        if (request.date > DateTimeOffset.UtcNow)
        {
            throw AppValidationException.BadRequest(
                "Transaction date cannot be in the future.",
                "date",
                "INVALID_DATE");
        }

        // Validation: amount must be positive
        if (request.transactionsAmount <= 0)
        {
            throw AppValidationException.BadRequest(
                "transactionsAmount must be greater than zero.",
                "transactionsAmount",
                "INVALID_AMOUNT");
        }

        // Structural validation based on transaction type
        if (request.type == "Income")
        {
            if (!request.financialAccountId.HasValue || request.fromJarId.HasValue || request.toJarId.HasValue)
                throw AppValidationException.BadRequest("Income must target a financial account and not involve jars.", "type", "INVALID_INCOME_PAYLOAD");
        }
        else if (request.type == "Expense")
        {
            if (!request.fromJarId.HasValue || request.financialAccountId.HasValue || request.toJarId.HasValue)
                throw AppValidationException.BadRequest("Expense must draw from a jar and not target an account or another jar.", "type", "INVALID_EXPENSE_PAYLOAD");
        }
        else if (request.type == "Transfer")
        {
            bool jarToJar = request.fromJarId.HasValue && request.toJarId.HasValue && !request.financialAccountId.HasValue;
            bool accountToJar = !request.fromJarId.HasValue && request.toJarId.HasValue && request.financialAccountId.HasValue;
            bool jarToAccount = request.fromJarId.HasValue && !request.toJarId.HasValue && request.financialAccountId.HasValue;
            if (!jarToJar && !accountToJar && !jarToAccount)
                throw AppValidationException.BadRequest("Invalid transfer payload. Must provide correct from/to jars or account.", "type", "INVALID_TRANSFER_PAYLOAD");
        }
        else
        {
            throw AppValidationException.BadRequest("Invalid transaction type.", "type", "INVALID_TRANSACTION_TYPE");
        }

        // Phase 5/6 validation: source and destination jars must be different
        if (request.fromJarId.HasValue && request.toJarId.HasValue
            && request.fromJarId.Value == request.toJarId.Value)
        {
            throw AppValidationException.BadRequest(
                "fromJarId and toJarId must be different.",
                "toJarId",
                "SAME_SOURCE_AND_DESTINATION");
        }

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null)
            throw new Exception("User not found");

        // Fully qualified entity type to avoid collision with the Personal_Finance_Management.Service.FinancialAccount namespace.
        Repository.Entity.FinancialAccount? financialAccount = null;
        if (request.financialAccountId.HasValue)
        {
            financialAccount = await _dbContext.FinancialAccounts
                .FirstOrDefaultAsync(x => x.Id == request.financialAccountId.Value && x.UserId == userIdGuid && x.IsActive);
            if (financialAccount == null)
            {
                throw AppValidationException.NotFound("Financial account not found.", "financialAccountId", "FINANCIAL_ACCOUNT_NOT_FOUND");
            }

            if (financialAccount.ConnectionMode == "LinkedApi")
            {
                throw AppValidationException.BadRequest(
                    "Manual transaction cannot be created for linked bank account.",
                    "financialAccountId",
                    "LINKED_ACCOUNT_MANUAL_TRANSACTION_NOT_ALLOWED");
            }
        }

        // Phase 6: verify ownership of referenced jar and category
        if (request.fromJarId.HasValue
            && !await _dbContext.Jars.AnyAsync(j => j.Id == request.fromJarId.Value && j.UserId == userIdGuid))
        {
            throw AppValidationException.NotFound("Jar not found.", "fromJarId", "JAR_NOT_FOUND");
        }
        if (request.toJarId.HasValue
            && !await _dbContext.Jars.AnyAsync(j => j.Id == request.toJarId.Value && j.UserId == userIdGuid))
        {
            throw AppValidationException.NotFound("Jar not found.", "toJarId", "JAR_NOT_FOUND");
        }
        if (request.categoryId.HasValue
            && !await _dbContext.Categories.AnyAsync(c => c.Id == request.categoryId.Value
                && (c.OwnerUserId == null || c.OwnerUserId == userIdGuid)))
        {
            throw AppValidationException.NotFound("Category not found.", "categoryId", "CATEGORY_NOT_FOUND");
        }

        var transaction = new Repository.Entity.Transaction()
        {
            // Identity
            UserId = userIdGuid,
            FinancialAccountId = request.financialAccountId,
            CategoryId = request.categoryId,
            FromJarId = request.fromJarId,
            ToJarId = request.toJarId,

            // Core fields
            Type = request.type,
            TransactionsAmount = request.transactionsAmount,
            Note = request.note,
            TransactionDate = request.date,

            // Source metadata
            SourceType = "Manual",
            RawDescription = null,
            ExternalTransactionId = null,
            RawPayloadJson = null,
            JarBalanceAfterAllocation = null,

            // Posting
            PostedAt = null,
            ImportJobId = null,

            // Soft delete
            IsDeleted = false,
            DeletedAt = null,

            // Audit
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        // H3 + H8: wrap ALL financial mutations inside a DB transaction so partial writes are impossible.
        await using var databaseTransaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            _dbContext.Transactions.Add(transaction);

            // Phase 2: apply balance mutation forward (validate sufficient balance for Expense/Transfer)
            await ApplyBalanceMutationAsync(transaction, reverse: false);

            await _dbContext.SaveChangesAsync();
            await databaseTransaction.CommitAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await databaseTransaction.RollbackAsync();
            throw AppValidationException.BadRequest("Another process modified the balance concurrently. Please try again.", "transactionsAmount", "CONCURRENCY_ERROR");
        }
        catch
        {
            await databaseTransaction.RollbackAsync();
            throw;
        }

        // Evaluate goals for affected jars
        if (transaction.ToJarId != null)
        {
            await CheckAndCompleteGoals(transaction.ToJarId.Value);
        }
        if (transaction.FromJarId != null)
        {
            await CheckLimit(transaction.FromJarId.Value);
        }

        var result = new Response.CreateTransactionResponse
        {
            id = transaction.Id,
            type = transaction.Type,
            financialAccountId = request.financialAccountId,
            transactionsAmount = request.transactionsAmount,
            date = request.date,
        };
        return result;
    }

    public async Task<Response.UpdateTransactionResponse> UpdateTransaction(Guid id, Request.UpdateTransactionRequest request)
    {
        var userIdGuid = GetCurrentUserId();

        // Validation: amount must be positive when provided
        if (request.transactionsAmount.HasValue && request.transactionsAmount.Value <= 0)
        {
            throw AppValidationException.BadRequest(
                "transactionsAmount must be greater than zero.",
                "transactionsAmount",
                "INVALID_AMOUNT");
        }

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null)
            throw new Exception("User not found");

        // H3 + H8: wrap the whole update in a DB transaction so reverse+apply+update are atomic.
        await using var databaseTransaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var transaction = await _dbContext.Transactions
                .FirstOrDefaultAsync(x => x.Id == id);
            if (transaction == null)
            {
                throw new Exception("Transaction not found");
            }
            if (transaction.UserId != userIdGuid)
            {
                throw AppValidationException.NotFound("Transaction not found.", "id", "TRANSACTION_NOT_FOUND");
            }

            if (transaction.SourceType != "Manual")
            {
                throw AppValidationException.BadRequest(
                    "Linked bank transaction cannot be updated manually.",
                    "id",
                    "LINKED_TRANSACTION_UPDATE_NOT_ALLOWED");
            }

            // Phase 6: validate ownership of referenced category (if changed)
            if (request.categoryId.HasValue
                && !await _dbContext.Categories.AnyAsync(c => c.Id == request.categoryId.Value
                    && (c.OwnerUserId == null || c.OwnerUserId == userIdGuid)))
            {
                throw AppValidationException.NotFound("Category not found.", "categoryId", "CATEGORY_NOT_FOUND");
            }

            // Phase 2 (Update): always REVERSE the old balance mutation first, then APPLY the new amount.
            // For amount-only updates this is the only safe pattern that keeps balances correct
            // even when type/source/destination don't change.
            if (request.transactionsAmount.HasValue
                && request.transactionsAmount.Value != transaction.TransactionsAmount)
            {
                // 1) Reverse the old effect
                await ApplyBalanceMutationAsync(transaction, reverse: true);
                // 2) Update amount
                transaction.TransactionsAmount = request.transactionsAmount.Value;
                transaction.UpdatedAt = DateTimeOffset.UtcNow;
                // 3) Apply the new effect
                await ApplyBalanceMutationAsync(transaction, reverse: false);
            }

            transaction.CategoryId = request.categoryId ?? transaction.CategoryId;
            transaction.Note = request.note ?? transaction.Note;
            transaction.UpdatedAt = DateTimeOffset.UtcNow;

            await _dbContext.SaveChangesAsync();
            await databaseTransaction.CommitAsync();

            // Evaluate goals for affected jars
            if (transaction.ToJarId != null)
            {
                await CheckAndCompleteGoals(transaction.ToJarId.Value);
            }
            if (transaction.FromJarId != null)
            {
                await CheckAndCompleteGoals(transaction.FromJarId.Value);
            }

            var result = new Response.UpdateTransactionResponse
            {
                id = id,
                type = transaction.Type,
                transactionsAmount = transaction.TransactionsAmount,
                date = transaction.TransactionDate,
            };
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            await databaseTransaction.RollbackAsync();
            throw AppValidationException.BadRequest("Another process modified the balance concurrently. Please try again.", "transactionsAmount", "CONCURRENCY_ERROR");
        }
        catch
        {
            await databaseTransaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Response.DeleteTransactionResponse> DeleteTransaction(Guid id)
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null)
            throw new Exception("User not found");

        // H3 + H8: wrap reverse+soft-delete in a DB transaction.
        await using var databaseTransaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var transaction = await _dbContext.Transactions
                .FirstOrDefaultAsync(x => x.Id == id);
            if (transaction == null)
            {
                throw new Exception("Transaction not found");
            }
            if (transaction.UserId != userIdGuid)
            {
                throw AppValidationException.NotFound("Transaction not found.", "id", "TRANSACTION_NOT_FOUND");
            }

            if (transaction.SourceType != "Manual")
            {
                throw AppValidationException.BadRequest(
                    "Linked bank transaction cannot be deleted manually.",
                    "id",
                    "LINKED_TRANSACTION_DELETE_NOT_ALLOWED");
            }

            // Phase 2 (Delete) + H2: fully REVERSE all balance mutations for Income, Expense, and Transfer.
            // This must run for every type, including Transfer (account↔jar and jar↔jar), and must NOT
            // depend on transaction.SourceType == "Manual" check above for already imported rows.
            await ApplyBalanceMutationAsync(transaction, reverse: true);

            transaction.IsDeleted = true;
            transaction.DeletedAt = DateTimeOffset.UtcNow;
            transaction.UpdatedAt = DateTimeOffset.UtcNow;

            await _dbContext.SaveChangesAsync();
            await databaseTransaction.CommitAsync();

            // Evaluate goals for affected jars (deletion might refund money if it was an expense)
            if (transaction.ToJarId != null)
            {
                await CheckAndCompleteGoals(transaction.ToJarId.Value);
            }
            if (transaction.FromJarId != null)
            {
                await CheckAndCompleteGoals(transaction.FromJarId.Value);
            }

            var result = new Response.DeleteTransactionResponse
            {
                message = "Transaction deleted"
            };
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            await databaseTransaction.RollbackAsync();
            throw AppValidationException.BadRequest("Another process modified the balance concurrently. Please try again.", "transactionsAmount", "CONCURRENCY_ERROR");
        }
        catch
        {
            await databaseTransaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Response.RestoreTransactionResponse> RestoreTransaction(Guid id)
    {
        var userIdGuid = GetCurrentUserId();

        var user = await _dbContext.Accounts
            .FirstOrDefaultAsync(x => x.Id == userIdGuid);
        if (user == null)
            throw new Exception("User not found");

        await using var databaseTransaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var transaction = await _dbContext.Transactions
                .FirstOrDefaultAsync(x => x.Id == id);
            if (transaction == null)
            {
                throw new Exception("Transaction not found");
            }
            if (transaction.UserId != userIdGuid)
            {
                throw AppValidationException.NotFound("Transaction not found.", "id", "TRANSACTION_NOT_FOUND");
            }

            if (!transaction.IsDeleted)
            {
                throw AppValidationException.BadRequest(
                    "Transaction is not deleted.",
                    "id",
                    "TRANSACTION_NOT_DELETED");
            }

            // Re-apply the balance mutation for Income, Expense, and Transfer
            await ApplyBalanceMutationAsync(transaction, reverse: false);

            transaction.IsDeleted = false;
            transaction.DeletedAt = null;
            transaction.UpdatedAt = DateTimeOffset.UtcNow;

            await _dbContext.SaveChangesAsync();
            await databaseTransaction.CommitAsync();

            // Evaluate goals for affected jars
            if (transaction.ToJarId != null)
            {
                await CheckAndCompleteGoals(transaction.ToJarId.Value);
            }
            if (transaction.FromJarId != null)
            {
                await CheckAndCompleteGoals(transaction.FromJarId.Value);
            }

            var result = new Response.RestoreTransactionResponse
            {
                message = "Transaction restored"
            };
            return result;
        }
        catch (DbUpdateConcurrencyException)
        {
            await databaseTransaction.RollbackAsync();
            throw AppValidationException.BadRequest("Another process modified the balance concurrently. Please try again.", "transactionsAmount", "CONCURRENCY_ERROR");
        }
        catch
        {
            await databaseTransaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Apply (or reverse) the balance effect of a single transaction on the linked
    /// FinancialAccount and/or Jars. Handles Income, Expense, and all three Transfer variants
    /// (jar→jar, account→jar, jar→account).
    /// 
    /// Set reverse=true to undo the transaction's effect (used by Update/Delete).
    /// Throws AppValidationException on insufficient balance when reverse=false.
    /// 
    /// H2: guarantees DeleteTransaction fully reverses balances for every transaction type.
    /// H8: assumes the caller has wrapped this in a DB transaction.
    /// </summary>
    private async Task ApplyBalanceMutationAsync(Repository.Entity.Transaction transaction, bool reverse)
    {
        // For reverse=true we flip the sign: income subtract instead of add, expense add instead of subtract,
        // and for transfers we swap the direction (return money to source, take from destination).
        var sign = reverse ? -1m : 1m;
        var amount = transaction.TransactionsAmount;

        if (transaction.Type == "Income")
        {
            // Income targets a FinancialAccount (no jar involvement per current contract).
            if (transaction.ToJarId == null && transaction.FromJarId == null && transaction.FinancialAccountId.HasValue)
            {
                var financialAccount = await _dbContext.FinancialAccounts
                    .FirstOrDefaultAsync(x => x.Id == transaction.FinancialAccountId.Value);
                if (financialAccount == null) return; // nothing to mutate; FK would have prevented insert anyway
                var projected = financialAccount.CurrentBalance + sign * amount;
                if (reverse && projected < 0)
                {
                    throw AppValidationException.BadRequest("Cannot reverse transaction because the funds have already been spent.", "transactionsAmount", "INSUFFICIENT_FUNDS_FOR_REVERSAL");
                }
                financialAccount.CurrentBalance = projected;
            }
        }
        else if (transaction.Type == "Expense")
        {
            // Expense draws from FromJar (current contract).
            if (transaction.FromJarId.HasValue && transaction.ToJarId == null && transaction.FinancialAccountId == null)
            {
                var fromJar = await _dbContext.Jars
                    .FirstOrDefaultAsync(x => x.Id == transaction.FromJarId.Value);
                if (fromJar == null) return;
                var projected = fromJar.Balance - sign * amount;
                if (!reverse && projected < 0)
                {
                    throw AppValidationException.BadRequest("Insufficient funds.", "transactionsAmount", "INSUFFICIENT_FUNDS");
                }
                fromJar.Balance = projected;
            }
        }
        else if (transaction.Type == "Transfer")
        {
            // jar -> jar
            if (transaction.FromJarId.HasValue && transaction.ToJarId.HasValue && transaction.FinancialAccountId == null)
            {
                var fromJar = await _dbContext.Jars.FirstOrDefaultAsync(x => x.Id == transaction.FromJarId.Value);
                var toJar = await _dbContext.Jars.FirstOrDefaultAsync(x => x.Id == transaction.ToJarId.Value);
                if (fromJar == null || toJar == null) return;
                var projectedFrom = fromJar.Balance - sign * amount;
                if (!reverse && projectedFrom < 0)
                {
                    throw AppValidationException.BadRequest("Insufficient funds.", "transactionsAmount", "INSUFFICIENT_FUNDS");
                }
                var projectedTo = toJar.Balance + sign * amount;
                if (reverse && projectedTo < 0)
                {
                    throw AppValidationException.BadRequest("Cannot reverse transaction because the funds have already been spent.", "transactionsAmount", "INSUFFICIENT_FUNDS_FOR_REVERSAL");
                }
                fromJar.Balance = projectedFrom;
                toJar.Balance = projectedTo;
            }
            // account -> jar
            else if (transaction.FromJarId == null && transaction.ToJarId.HasValue && transaction.FinancialAccountId.HasValue)
            {
                var financialAccount = await _dbContext.FinancialAccounts
                    .FirstOrDefaultAsync(x => x.Id == transaction.FinancialAccountId.Value);
                var toJar = await _dbContext.Jars.FirstOrDefaultAsync(x => x.Id == transaction.ToJarId.Value);
                if (financialAccount == null || toJar == null) return;
                var projectedAcc = financialAccount.CurrentBalance - sign * amount;
                if (!reverse && projectedAcc < 0)
                {
                    throw AppValidationException.BadRequest("Insufficient funds.", "transactionsAmount", "INSUFFICIENT_FUNDS");
                }
                var projectedTo = toJar.Balance + sign * amount;
                if (reverse && projectedTo < 0)
                {
                    throw AppValidationException.BadRequest("Cannot reverse transaction because the funds have already been spent.", "transactionsAmount", "INSUFFICIENT_FUNDS_FOR_REVERSAL");
                }
                financialAccount.CurrentBalance = projectedAcc;
                toJar.Balance = projectedTo;
            }
            // jar -> account
            else if (transaction.FromJarId.HasValue && transaction.ToJarId == null && transaction.FinancialAccountId.HasValue)
            {
                var fromJar = await _dbContext.Jars.FirstOrDefaultAsync(x => x.Id == transaction.FromJarId.Value);
                var financialAccount = await _dbContext.FinancialAccounts
                    .FirstOrDefaultAsync(x => x.Id == transaction.FinancialAccountId.Value);
                if (fromJar == null || financialAccount == null) return;
                var projectedJar = fromJar.Balance - sign * amount;
                if (!reverse && projectedJar < 0)
                {
                    throw AppValidationException.BadRequest("Insufficient funds.", "transactionsAmount", "INSUFFICIENT_FUNDS");
                }
                var projectedAcc = financialAccount.CurrentBalance + sign * amount;
                if (reverse && projectedAcc < 0)
                {
                    throw AppValidationException.BadRequest("Cannot reverse transaction because the funds have already been spent.", "transactionsAmount", "INSUFFICIENT_FUNDS_FOR_REVERSAL");
                }
                fromJar.Balance = projectedJar;
                financialAccount.CurrentBalance = projectedAcc;
            }
        }
    }

    private async Task CheckAndCompleteGoals(Guid jarId)
    {
        var jar = await _dbContext.Jars.FirstOrDefaultAsync(j => j.Id == jarId);
        if (jar == null) return;

        // Tìm các Goal đang Active gắn với Jar này
        var activeGoals = await _dbContext.Goals
            .Where(g => g.LinkedJarId == jarId && g.Status == "Active")
            .ToListAsync();

        foreach (var goal in activeGoals)
        {
            // Kiểm tra điều kiện hoàn thành: Số dư hũ >= Target Amount
            // Theo Option B: Chấp nhận hoàn thành cả khi đã quá hạn (DueDate)
            if (jar.Balance >= goal.TargetAmount)
            {
                goal.Status = "Completed";
                goal.UpdatedAt = DateTimeOffset.UtcNow;

                // Tạo thông báo cho người dùng
                var notification = new Notification
                {
                    UserId = goal.UserId,
                    Type = "GoalUpdate",
                    Title = "Chúc mừng! Bạn đã hoàn thành mục tiêu",
                    Body = $"Mục tiêu '{goal.Title}' đã đạt được mức {goal.TargetAmount:N0}đ trong hũ {jar.Name}.",
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow,
                    MetadataJson = $"{{\"goalId\": \"{goal.Id}\", \"jarId\": \"{jar.Id}\"}}"
                };

                _dbContext.Notifications.Add(notification);
            }
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task CheckLimit(Guid jarId)
    {
        var jar = await _dbContext.Jars.FirstOrDefaultAsync(j => j.Id == jarId);
        if (jar == null) return;

        var activeLimit = await _dbContext.SpendingLimits
            .Where(x => x.JarId == jarId && x.IsActive == true)
            .ToListAsync();

        if (!activeLimit.Any()) return;

        // Optimization: Fetch currentSpent outside the loop to avoid N+1 queries.
        var userIds = activeLimit.Select(l => l.UserId).Distinct().ToList();
        var spentByUser = new Dictionary<Guid, decimal>();
        foreach (var uid in userIds)
        {
            spentByUser[uid] = await GetCurrentSpentByJar(jarId, uid);
        }

        foreach (var item in activeLimit)
        {
            var currentSpent = spentByUser[item.UserId];
            // H1: alert threshold = LimitAmount * AlertAtPercentage / 100
            // (previous formula was inverted and produced nonsense like 800 when LimitAmount=1 and percentage=8)
            var alertThreshold = item.LimitAmount * item.AlertAtPercentage / 100m;

            // Business rule:
            // - Alert threshold only creates warning notification and keeps limit active.
            // - Exceeded limit creates exceeded notification and deactivates the limit.
            // Exceeded has priority, so a transaction crossing directly to limit amount only creates exceeded notification.
            if (currentSpent >= item.LimitAmount)
            {
               
                var notification = new Repository.Entity.Notification()
                {
                    UserId = item.UserId,
                    Type = "SpendingAlert",
                    Title = "Thông báo vượt ngưỡng!",
                    Body = $"Xin thông báo! bạn đã chạm ngưỡng {item.LimitAmount}đ giới hạn chi tiêu ở hũ {item.Jar.Name}",
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow,
                    MetadataJson = $"{{\"limitId\": \"{item.Id}\", \"jarId\": \"{jar.Id}\"}}"

                };
                if (await HasLimitNotification(item.UserId, item.Id, jar.Id, notification.Body)) return;
                item.UpdatedAt = DateTimeOffset.UtcNow;
                _dbContext.Notifications.Add(notification);
            }
            else if (currentSpent >= alertThreshold)
            {
                var notification = new Repository.Entity.Notification()
                {
                    UserId = item.UserId,
                    Type = "SpendingAlert",
                    Title = "Thông báo vượt ngưỡng!",
                    Body = $"Xin thông báo! bạn đã chạm ngưỡng thông báo {item.AlertAtPercentage}% giới hạn chi tiêu ở hũ {item.Jar.Name}",
                    IsRead = false,
                    CreatedAt = DateTimeOffset.UtcNow,
                    MetadataJson = $"{{\"limitId\": \"{item.Id}\", \"jarId\": \"{jar.Id}\"}}"
                };
                if (await HasLimitNotification(item.UserId, item.Id, jar.Id, notification.Body)) return;
                _dbContext.Notifications.Add(notification);
            }
        }

        await _dbContext.SaveChangesAsync();
    }

    private async Task<decimal> GetCurrentSpentByJar(Guid jarId, Guid userId)
    {
        return (await _dbContext.Transactions
            .Where(t => t.UserId == userId
                        && !t.IsDeleted
                        && t.Type == "Expense"
                        && t.FromJarId == jarId
                        && t.ToJarId == null
                        && t.FinancialAccountId == null)
            .SumAsync(t => (decimal?)t.TransactionsAmount)) ?? 0m;
    }

    private async Task AddLimitNotificationIfNotExists(
        SpendingLimit limit,
        Repository.Entity.Jar jar,
        string title,
        string body)
    {
        if (await HasLimitNotification(limit.UserId, limit.Id, jar.Id, body))
            return;

        var notification = new Notification
        {
            UserId = limit.UserId,
            Type = "SpendingAlert",
            Title = title,
            Body = body,
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow,
            MetadataJson = $"{{\"limitId\": \"{limit.Id}\", \"jarId\": \"{jar.Id}\"}}"
        };

        _dbContext.Notifications.Add(notification);
        await _dbContext.SaveChangesAsync();
    }

    private async Task<bool> HasLimitNotification(Guid userId, Guid limitId, Guid jarId, string body)
    {
        var limitIdMarker = $"\"limitId\": \"{limitId}\"";
        var jarIdMarker = $"\"jarId\": \"{jarId}\"";

        var pendingExists = _dbContext.ChangeTracker
            .Entries<Notification>()
            .Any(entry => entry.State == EntityState.Added
                          && entry.Entity.UserId == userId
                          && entry.Entity.Type == "SpendingAlert"
                          && entry.Entity.Body == body
                          && entry.Entity.MetadataJson != null
                          && entry.Entity.MetadataJson.Contains(limitIdMarker)
                          && entry.Entity.MetadataJson.Contains(jarIdMarker));

        if (pendingExists)
            return true;

        var metadataList = await _dbContext.Notifications
            .Where(n => n.UserId == userId
                        && n.Type == "SpendingAlert"
                        && n.Body == body)
            .Select(n => n.MetadataJson)
            .ToListAsync();

        return metadataList.Any(metadata =>
            metadata != null
            && metadata.Contains(limitIdMarker)
            && metadata.Contains(jarIdMarker));
    }
    
    public async Task<Response.CassoTransactionsResponse> ProcessCassoWebhook(
        Request.CassoWebhookRequest request,
        string? secureToken,
        string? cassoSignature)
    {
        if (request is null)
        {
            throw AppValidationException.BadRequest("Request body is required.", "body", "REQUIRED");
        }

        var configuredSecureToken = _configuration["CasooOptions:SecureToken"]
                                    ?? _configuration["CasooOptions:WebhookSecureToken"]
                                    ?? _configuration["Casso:SecureToken"]
                                    ?? _configuration["Casso:WebhookSecureToken"];
        if (!string.IsNullOrWhiteSpace(configuredSecureToken)
            && secureToken?.Trim() != configuredSecureToken.Trim())
        {
            throw AppValidationException.BadRequest("Invalid Casso secure token.", "secure-token", "CASSO_WEBHOOK_UNAUTHORIZED");
        }

        if (string.IsNullOrWhiteSpace(configuredSecureToken) && string.IsNullOrWhiteSpace(cassoSignature))
        {
            throw AppValidationException.BadRequest("Casso webhook verification header is required.", "secure-token", "CASSO_WEBHOOK_UNAUTHORIZED");
        }

        if (request.error != 0)
        {
            return new Response.CassoTransactionsResponse
            {
                receivedCount = 0,
                createdCount = 0,
                skippedCount = 0,
                message = "Casso webhook ignored because error is not zero."
            };
        }

        var cassoTransactions = new List<JsonElement>();
        if (request.data.ValueKind == JsonValueKind.Object)
        {
            cassoTransactions.Add(request.data);
        }
        else if (request.data.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in request.data.EnumerateArray())
            {
                cassoTransactions.Add(item);
            }
        }
        else
        {
            throw AppValidationException.BadRequest("Casso webhook data is invalid.", "data", "CASSO_WEBHOOK_INVALID");
        }

        var createdCount = 0;
        var skippedCount = 0;
        await using var databaseTransaction = await _dbContext.Database.BeginTransactionAsync();

        foreach (var item in cassoTransactions)
        {
            decimal amount;
            if (item.TryGetProperty("amount", out var amountElement) && amountElement.ValueKind == JsonValueKind.Number)
            {
                amount = amountElement.GetDecimal();
            }
            else
            {
                skippedCount++;
                continue;
            }

            if (amount == 0)
            {
                skippedCount++;
                continue;
            }

            string? externalTransactionId = null;
            if (item.TryGetProperty("reference", out var referenceElement))
            {
                externalTransactionId = referenceElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(externalTransactionId) && item.TryGetProperty("tid", out var tidElement))
            {
                externalTransactionId = tidElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(externalTransactionId) && item.TryGetProperty("id", out var idElement))
            {
                externalTransactionId = idElement.ValueKind == JsonValueKind.String
                    ? idElement.GetString()
                    : idElement.GetRawText();
            }

            if (string.IsNullOrWhiteSpace(externalTransactionId))
            {
                skippedCount++;
                continue;
            }

            string? accountRef = null;
            if (item.TryGetProperty("accountNumber", out var accountNumberElement))
            {
                accountRef = accountNumberElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(accountRef) && item.TryGetProperty("subAccId", out var subAccIdElement))
            {
                accountRef = subAccIdElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(accountRef) && item.TryGetProperty("bank_sub_acc_id", out var bankSubAccIdElement))
            {
                accountRef = bankSubAccIdElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(accountRef) && item.TryGetProperty("bankSubAccId", out var bankSubAccIdCamelElement))
            {
                accountRef = bankSubAccIdCamelElement.GetString();
            }

            if (string.IsNullOrWhiteSpace(accountRef))
            {
                skippedCount++;
                continue;
            }

            var matchedAccounts = await _dbContext.FinancialAccounts
                .Where(x => x.ConnectionMode == "LinkedApi"
                            && x.IsActive
                            && (x.ExternalAccountRef == accountRef
                                || x.MaskedAccountNumber == accountRef
                                || x.ExternalAccountId == accountRef))
                .ToListAsync();

            if (matchedAccounts.Count > 1)
            {
                throw AppValidationException.Conflict("Multiple linked financial accounts match Casso account.", "accountNumber", "CASSO_ACCOUNT_CONFLICT");
            }

            if (matchedAccounts.Count == 0)
            {
                skippedCount++;
                continue;
            }

            var financialAccount = matchedAccounts[0];
            var existedTransaction = await _dbContext.Transactions.AnyAsync(x =>
                x.FinancialAccountId == financialAccount.Id
                && x.ExternalTransactionId == externalTransactionId
                && !x.IsDeleted);
            if (existedTransaction)
            {
                skippedCount++;
                continue;
            }

            var transactionDate = DateTimeOffset.UtcNow;
            if (item.TryGetProperty("transactionDateTime", out var transactionDateTimeElement)
                && DateTimeOffset.TryParse(transactionDateTimeElement.GetString(), out var parsedTransactionDateTime))
            {
                transactionDate = parsedTransactionDateTime;
            }
            else if (item.TryGetProperty("when", out var whenElement)
                     && DateTimeOffset.TryParse(whenElement.GetString(), out var parsedWhen))
            {
                transactionDate = parsedWhen;
            }

            string? description = null;
            if (item.TryGetProperty("description", out var descriptionElement))
            {
                description = descriptionElement.GetString();
            }

            decimal? runningBalance = null;
            if (item.TryGetProperty("runningBalance", out var runningBalanceElement)
                && runningBalanceElement.ValueKind == JsonValueKind.Number)
            {
                runningBalance = runningBalanceElement.GetDecimal();
            }
            else if (item.TryGetProperty("cusum_balance", out var cusumBalanceElement)
                     && cusumBalanceElement.ValueKind == JsonValueKind.Number)
            {
                runningBalance = cusumBalanceElement.GetDecimal();
            }

            _dbContext.Transactions.Add(new Repository.Entity.Transaction
            {
                Id = Guid.NewGuid(),
                UserId = financialAccount.UserId,
                FinancialAccountId = financialAccount.Id,
                CategoryId = null,
                FromJarId = null,
                ToJarId = null,
                Type = amount > 0 ? "Income" : "Expense",
                TransactionsAmount = Math.Abs(amount),
                Note = description,
                RawDescription = description,
                TransactionDate = transactionDate,
                SourceType = "Imported",
                ExternalTransactionId = externalTransactionId,
                RawPayloadJson = item.GetRawText(),
                PostedAt = DateTimeOffset.UtcNow,
                ImportJobId = null,
                IsDeleted = false,
                DeletedAt = null,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });

            if (runningBalance.HasValue)
            {
                financialAccount.CurrentBalance = runningBalance.Value;
            }
            else if (amount > 0)
            {
                financialAccount.CurrentBalance += Math.Abs(amount);
            }
            else
            {
                financialAccount.CurrentBalance -= Math.Abs(amount);
            }

            financialAccount.SyncStatus = "Synced";
            financialAccount.LastSyncedAt = DateTimeOffset.UtcNow;
            financialAccount.LastSyncError = null;
            financialAccount.LastSyncCursor = externalTransactionId;
            financialAccount.UpdatedAt = DateTimeOffset.UtcNow;
            createdCount++;
        }

        await _dbContext.SaveChangesAsync();
        await databaseTransaction.CommitAsync();

        return new Response.CassoTransactionsResponse
        {
            receivedCount = cassoTransactions.Count,
            createdCount = createdCount,
            skippedCount = skippedCount,
            message = "Casso webhook processed."
        };
    }

    public async Task<Response.CassoTransactionsResponse> SyncCassoTransactions(Request.CassoSyncTransactionsRequest request)
    {
        if (request is null)
        {
            throw AppValidationException.BadRequest("Request body is required.", "body", "REQUIRED");
        }

        var userIdGuid = GetCurrentUserId();
        if (request.financialAccountId == Guid.Empty)
        {
            throw AppValidationException.BadRequest("Financial account is required.", "financialAccountId", "REQUIRED");
        }

        if (request.page <= 0)
        {
            throw AppValidationException.BadRequest("Page must be greater than zero.", "page", "CASSO_SYNC_INVALID");
        }

        if (request.pageSize <= 0 || request.pageSize > 100)
        {
            throw AppValidationException.BadRequest("Page size must be between 1 and 100.", "pageSize", "CASSO_SYNC_INVALID");
        }

        var financialAccount = await _dbContext.FinancialAccounts
            .FirstOrDefaultAsync(x => x.Id == request.financialAccountId && x.UserId == userIdGuid && x.IsActive);
        if (financialAccount == null)
        {
            throw AppValidationException.NotFound("Financial account not found.", "financialAccountId", "FINANCIAL_ACCOUNT_NOT_FOUND");
        }

        if (financialAccount.ConnectionMode != "LinkedApi")
        {
            throw AppValidationException.BadRequest("Only linked bank account can sync Casso transactions.", "financialAccountId", "CASSO_SYNC_LINKED_ACCOUNT_REQUIRED");
        }

        var apiKey = _configuration["CasooOptions:ApiKey"] ?? _configuration["Casso:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw AppValidationException.BadRequest("Casso API key is not configured.", "CasooOptions:ApiKey", "CASSO_CONFIG_MISSING");
        }

        var baseUrlTransactions = _configuration["CasooOptions:BaseUrlTransactions"] ?? _configuration["Casso:BaseUrlTransactions"];
        if (string.IsNullOrWhiteSpace(baseUrlTransactions))
        {
            throw AppValidationException.BadRequest("Casso transactions URL is not configured.", "CasooOptions:BaseUrlTransactions", "CASSO_CONFIG_MISSING");
        }

        var queryParams = new List<string>
        {
            $"page={request.page}",
            $"pageSize={request.pageSize}",
            $"sort={Uri.EscapeDataString(string.IsNullOrWhiteSpace(request.sort) ? "ASC" : request.sort.Trim().ToUpperInvariant())}"
        };
        if (request.fromDate.HasValue)
        {
            queryParams.Add($"fromDate={request.fromDate.Value:yyyy-MM-dd}");
        }
        if (request.toDate.HasValue)
        {
            queryParams.Add($"toDate={request.toDate.Value:yyyy-MM-dd}");
        }

        var requestUri = baseUrlTransactions
                         + (baseUrlTransactions.Contains('?') ? "&" : "?")
                         + string.Join("&", queryParams);

        using var httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(_configuration.GetValue("CasooOptions:TimeoutSeconds", 30))
        };
        var authorizationValue = apiKey.Trim();
        if (!authorizationValue.StartsWith("Apikey ", StringComparison.OrdinalIgnoreCase)
            && !authorizationValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            authorizationValue = $"Apikey {authorizationValue}";
        }
        httpClient.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(authorizationValue);

        using var cassoResponse = await httpClient.GetAsync(requestUri);
        if (!cassoResponse.IsSuccessStatusCode)
        {
            financialAccount.SyncStatus = "Error";
            financialAccount.LastSyncError = $"Casso request failed with status {(int)cassoResponse.StatusCode}.";
            financialAccount.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
            throw AppValidationException.BadRequest("Casso transaction sync failed.", "casso", "CASSO_SYNC_FAILED");
        }

        await using var responseStream = await cassoResponse.Content.ReadAsStreamAsync();
        using var json = await JsonDocument.ParseAsync(responseStream);
        if (!json.RootElement.TryGetProperty("error", out var errorElement)
            || errorElement.GetInt32() != 0)
        {
            financialAccount.SyncStatus = "Error";
            financialAccount.LastSyncError = "Casso response error is not zero.";
            financialAccount.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
            throw AppValidationException.BadRequest("Casso response is invalid.", "casso", "CASSO_RESPONSE_INVALID");
        }

        var records = new List<JsonElement>();
        if (json.RootElement.TryGetProperty("data", out var dataElement)
            && dataElement.ValueKind == JsonValueKind.Object
            && dataElement.TryGetProperty("records", out var recordsElement)
            && recordsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var record in recordsElement.EnumerateArray())
            {
                records.Add(record);
            }
        }
        else if (json.RootElement.TryGetProperty("data", out var dataArrayElement)
                 && dataArrayElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var record in dataArrayElement.EnumerateArray())
            {
                records.Add(record);
            }
        }

        var createdCount = 0;
        var skippedCount = 0;
        await using var databaseTransaction = await _dbContext.Database.BeginTransactionAsync();

        foreach (var record in records)
        {
            decimal amount;
            if (record.TryGetProperty("amount", out var amountElement) && amountElement.ValueKind == JsonValueKind.Number)
            {
                amount = amountElement.GetDecimal();
            }
            else
            {
                skippedCount++;
                continue;
            }

            if (amount == 0)
            {
                skippedCount++;
                continue;
            }

            string? recordAccountRef = null;
            if (record.TryGetProperty("bankSubAccId", out var bankSubAccIdElement))
            {
                recordAccountRef = bankSubAccIdElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(recordAccountRef) && record.TryGetProperty("bank_sub_acc_id", out var bankSubAccIdSnakeElement))
            {
                recordAccountRef = bankSubAccIdSnakeElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(recordAccountRef) && record.TryGetProperty("accountNumber", out var accountNumberElement))
            {
                recordAccountRef = accountNumberElement.GetString();
            }

            if (!string.IsNullOrWhiteSpace(recordAccountRef)
                && !string.IsNullOrWhiteSpace(financialAccount.ExternalAccountRef)
                && recordAccountRef != financialAccount.ExternalAccountRef)
            {
                skippedCount++;
                continue;
            }

            string? externalTransactionId = null;
            if (record.TryGetProperty("reference", out var referenceElement))
            {
                externalTransactionId = referenceElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(externalTransactionId) && record.TryGetProperty("tid", out var tidElement))
            {
                externalTransactionId = tidElement.GetString();
            }
            if (string.IsNullOrWhiteSpace(externalTransactionId) && record.TryGetProperty("id", out var idElement))
            {
                externalTransactionId = idElement.ValueKind == JsonValueKind.String
                    ? idElement.GetString()
                    : idElement.GetRawText();
            }
            if (string.IsNullOrWhiteSpace(externalTransactionId) && record.TryGetProperty("privateId", out var privateIdElement))
            {
                externalTransactionId = privateIdElement.ValueKind == JsonValueKind.String
                    ? privateIdElement.GetString()
                    : privateIdElement.GetRawText();
            }

            if (string.IsNullOrWhiteSpace(externalTransactionId))
            {
                skippedCount++;
                continue;
            }

            var existedTransaction = await _dbContext.Transactions.AnyAsync(x =>
                x.FinancialAccountId == financialAccount.Id
                && x.ExternalTransactionId == externalTransactionId
                && !x.IsDeleted);
            if (existedTransaction)
            {
                skippedCount++;
                continue;
            }

            var transactionDate = DateTimeOffset.UtcNow;
            if (record.TryGetProperty("transactionDateTime", out var transactionDateTimeElement)
                && DateTimeOffset.TryParse(transactionDateTimeElement.GetString(), out var parsedTransactionDateTime))
            {
                transactionDate = parsedTransactionDateTime;
            }
            else if (record.TryGetProperty("when", out var whenElement)
                     && DateTimeOffset.TryParse(whenElement.GetString(), out var parsedWhen))
            {
                transactionDate = parsedWhen;
            }
            else if (record.TryGetProperty("transactionDate", out var transactionDateElement)
                     && DateTimeOffset.TryParse(transactionDateElement.GetString(), out var parsedTransactionDate))
            {
                transactionDate = parsedTransactionDate;
            }

            string? description = null;
            if (record.TryGetProperty("description", out var descriptionElement))
            {
                description = descriptionElement.GetString();
            }

            decimal? runningBalance = null;
            if (record.TryGetProperty("runningBalance", out var runningBalanceElement)
                && runningBalanceElement.ValueKind == JsonValueKind.Number)
            {
                runningBalance = runningBalanceElement.GetDecimal();
            }
            else if (record.TryGetProperty("cusum_balance", out var cusumBalanceElement)
                     && cusumBalanceElement.ValueKind == JsonValueKind.Number)
            {
                runningBalance = cusumBalanceElement.GetDecimal();
            }

            _dbContext.Transactions.Add(new Repository.Entity.Transaction
            {
                Id = Guid.NewGuid(),
                UserId = userIdGuid,
                FinancialAccountId = financialAccount.Id,
                CategoryId = null,
                FromJarId = null,
                ToJarId = null,
                Type = amount > 0 ? "Income" : "Expense",
                TransactionsAmount = Math.Abs(amount),
                Note = description,
                RawDescription = description,
                TransactionDate = transactionDate,
                SourceType = "Imported",
                ExternalTransactionId = externalTransactionId,
                RawPayloadJson = record.GetRawText(),
                PostedAt = DateTimeOffset.UtcNow,
                ImportJobId = null,
                IsDeleted = false,
                DeletedAt = null,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });

            if (runningBalance.HasValue)
            {
                financialAccount.CurrentBalance = runningBalance.Value;
            }
            else if (amount > 0)
            {
                financialAccount.CurrentBalance += Math.Abs(amount);
            }
            else
            {
                financialAccount.CurrentBalance -= Math.Abs(amount);
            }

            financialAccount.SyncStatus = "Synced";
            financialAccount.LastSyncedAt = DateTimeOffset.UtcNow;
            financialAccount.LastSyncError = null;
            financialAccount.LastSyncCursor = externalTransactionId;
            financialAccount.UpdatedAt = DateTimeOffset.UtcNow;
            createdCount++;
        }

        await _dbContext.SaveChangesAsync();
        await databaseTransaction.CommitAsync();

        return new Response.CassoTransactionsResponse
        {
            receivedCount = records.Count,
            createdCount = createdCount,
            skippedCount = skippedCount,
            message = "Casso transactions synced."
        };
    }

    private Guid GetCurrentUserId()
    {
        return ServiceClaimHelper.GetRequiredUserId(_httpContext);
    }
}
