using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Repository;
using Personal_Finance_Management.Repository.Entity;
using Personal_Finance_Management.Service.Base;
using Personal_Finance_Management.Service.Validations;

namespace Personal_Finance_Management.Service.GroupJar;

public class Service : IService
{
    private static bool _tablesEnsured = false;
    private static readonly object _lock = new object();

    private readonly AppDbContext _dbContext;
    private readonly IHttpContextAccessor _httpContext;

    public Service(AppDbContext dbContext, IHttpContextAccessor httpContext)
    {
        _dbContext = dbContext;
        _httpContext = httpContext;
    }

    private async Task EnsureTablesExistAsync()
    {
        if (_tablesEnsured) return;

        var sql = @"
CREATE TABLE IF NOT EXISTS group_jars (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    color VARCHAR(50),
    icon VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_jar_members (
    id UUID PRIMARY KEY,
    group_jar_id UUID NOT NULL REFERENCES group_jars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_jar_messages (
    id UUID PRIMARY KEY,
    group_jar_id UUID NOT NULL REFERENCES group_jars(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL DEFAULT 'Text',
    content TEXT NOT NULL DEFAULT '',
    deposit_amount NUMERIC(18,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
";
        try
        {
            await _dbContext.Database.ExecuteSqlRawAsync(sql);
            _tablesEnsured = true;
        }
        catch { }
    }

    public async Task<Response.GetGroupJarsResult> GetGroupJars()
    {
        await EnsureTablesExistAsync();
        var userId = GetCurrentUserId();

        var memberGroupJarIds = await _dbContext.GroupJarMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.GroupJarId)
            .ToListAsync();

        var groupJars = await _dbContext.GroupJars
            .Where(g => g.Status == "Active" && (g.OwnerId == userId || memberGroupJarIds.Contains(g.Id)))
            .Include(g => g.Members)
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        var items = groupJars.Select(g =>
        {
            var userMember = g.Members.FirstOrDefault(m => m.UserId == userId);
            var role = g.OwnerId == userId ? "Owner" : (userMember?.Role ?? "Member");
            return new Response.GroupJarItemResponse
            {
                id = g.Id,
                name = g.Name,
                description = g.Description,
                targetAmount = g.TargetAmount,
                currentBalance = g.CurrentBalance,
                currency = g.Currency,
                color = g.Color,
                icon = g.Icon,
                role = role,
                memberCount = g.Members.Count > 0 ? g.Members.Count : 1
            };
        }).ToList();

        return new Response.GetGroupJarsResult { data = items };
    }

    public async Task<Response.GroupJarDetailResponse> GetGroupJarById(Guid id)
    {
        var userId = GetCurrentUserId();
        var groupJar = await _dbContext.GroupJars
            .Include(g => g.Members)
            .ThenInclude(m => m.User)
            .Include(g => g.Owner)
            .FirstOrDefaultAsync(g => g.Id == id && g.Status == "Active");

        if (groupJar == null)
        {
            throw AppValidationException.NotFound("Group jar not found", "id", "GROUP_JAR_NOT_FOUND");
        }

        var isMember = groupJar.OwnerId == userId || groupJar.Members.Any(m => m.UserId == userId);
        if (!isMember)
        {
            throw AppValidationException.Unauthorized("You are not a member of this group jar.", "auth", "FORBIDDEN");
        }

        var userMember = groupJar.Members.FirstOrDefault(m => m.UserId == userId);
        var role = groupJar.OwnerId == userId ? "Owner" : (userMember?.Role ?? "Member");

        var memberResponses = groupJar.Members.Select(m => new Response.GroupJarMemberResponse
        {
            userId = m.UserId,
            username = m.User.Username,
            fullName = $"{m.User.FirstName} {m.User.LastName}".Trim(),
            email = m.User.Email,
            avatarUrl = m.User.AvatarUrl,
            role = m.Role,
            joinedAt = m.JoinedAt
        }).ToList();

        return new Response.GroupJarDetailResponse
        {
            id = groupJar.Id,
            name = groupJar.Name,
            description = groupJar.Description,
            targetAmount = groupJar.TargetAmount,
            currentBalance = groupJar.CurrentBalance,
            currency = groupJar.Currency,
            color = groupJar.Color,
            icon = groupJar.Icon,
            role = role,
            members = memberResponses
        };
    }

    public async Task<Response.GroupJarDetailResponse> CreateGroupJar(Request.CreateGroupJarRequest request)
    {
        await EnsureTablesExistAsync();
        var userId = GetCurrentUserId();
        var user = await _dbContext.Accounts.FirstOrDefaultAsync(a => a.Id == userId);
        if (user == null)
        {
            throw AppValidationException.Unauthorized("User not found", "user", "USER_NOT_FOUND");
        }

        if (string.IsNullOrWhiteSpace(request.name))
        {
            throw AppValidationException.BadRequest("Group jar name is required", "name", "REQUIRED");
        }

        var now = DateTimeOffset.UtcNow;
        var groupJar = new Repository.Entity.GroupJar
        {
            Id = Guid.NewGuid(),
            Name = request.name.Trim(),
            Description = request.description?.Trim(),
            TargetAmount = request.targetAmount,
            CurrentBalance = 0,
            Currency = "VND",
            Color = request.color ?? "#A5A6F6",
            Icon = request.icon ?? "group",
            Status = "Active",
            OwnerId = userId,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.GroupJars.Add(groupJar);

        var ownerMember = new Repository.Entity.GroupJarMember
        {
            Id = Guid.NewGuid(),
            GroupJarId = groupJar.Id,
            UserId = userId,
            Role = "Owner",
            JoinedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.GroupJarMembers.Add(ownerMember);

        // System message: Jar created
        var systemMsg = new Repository.Entity.GroupJarMessage
        {
            Id = Guid.NewGuid(),
            GroupJarId = groupJar.Id,
            SenderId = userId,
            Content = $"🎉 Hũ tiết kiệm nhóm '{groupJar.Name}' đã được tạo!",
            MessageType = "Text",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.GroupJarMessages.Add(systemMsg);

        await _dbContext.SaveChangesAsync();

        return await GetGroupJarById(groupJar.Id);
    }

    public async Task<Response.GroupJarMemberResponse> InviteMemberByEmail(Guid id, Request.InviteMemberRequest request)
    {
        var userId = GetCurrentUserId();
        var groupJar = await _dbContext.GroupJars
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id && g.Status == "Active");

        if (groupJar == null)
        {
            throw AppValidationException.NotFound("Group jar not found", "id", "GROUP_JAR_NOT_FOUND");
        }

        var isMember = groupJar.OwnerId == userId || groupJar.Members.Any(m => m.UserId == userId);
        if (!isMember)
        {
            throw AppValidationException.Unauthorized("You are not authorized to invite members to this jar.", "auth", "FORBIDDEN");
        }

        var inviteEmail = request.email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(inviteEmail))
        {
            throw AppValidationException.BadRequest("Email is required", "email", "REQUIRED");
        }

        var targetUser = await _dbContext.Accounts.FirstOrDefaultAsync(a => a.Email.ToLower() == inviteEmail);
        if (targetUser == null)
        {
            throw AppValidationException.NotFound($"Không tìm thấy người dùng với email: {inviteEmail}", "email", "USER_NOT_FOUND");
        }

        if (groupJar.Members.Any(m => m.UserId == targetUser.Id))
        {
            throw AppValidationException.Conflict("Người dùng đã ở trong hũ tiết kiệm này.", "email", "ALREADY_MEMBER");
        }

        var now = DateTimeOffset.UtcNow;
        var newMember = new Repository.Entity.GroupJarMember
        {
            Id = Guid.NewGuid(),
            GroupJarId = groupJar.Id,
            UserId = targetUser.Id,
            Role = "Member",
            JoinedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.GroupJarMembers.Add(newMember);

        // System notification message in group chat
        var systemMsg = new Repository.Entity.GroupJarMessage
        {
            Id = Guid.NewGuid(),
            GroupJarId = groupJar.Id,
            SenderId = userId,
            Content = $"👋 {targetUser.FirstName} {targetUser.LastName} ({targetUser.Email}) đã được thêm vào hũ tiết kiệm nhóm!",
            MessageType = "Text",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.GroupJarMessages.Add(systemMsg);

        await _dbContext.SaveChangesAsync();

        return new Response.GroupJarMemberResponse
        {
            userId = targetUser.Id,
            username = targetUser.Username,
            fullName = $"{targetUser.FirstName} {targetUser.LastName}".Trim(),
            email = targetUser.Email,
            avatarUrl = targetUser.AvatarUrl,
            role = newMember.Role,
            joinedAt = newMember.JoinedAt
        };
    }

    public async Task<Response.GroupJarDetailResponse> DepositFunds(Guid id, Request.DepositRequest request)
    {
        var userId = GetCurrentUserId();
        var user = await _dbContext.Accounts.FirstOrDefaultAsync(a => a.Id == userId);
        if (user == null)
        {
            throw AppValidationException.Unauthorized("User not found", "user", "USER_NOT_FOUND");
        }

        var groupJar = await _dbContext.GroupJars
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id && g.Status == "Active");

        if (groupJar == null)
        {
            throw AppValidationException.NotFound("Group jar not found", "id", "GROUP_JAR_NOT_FOUND");
        }

        var isMember = groupJar.OwnerId == userId || groupJar.Members.Any(m => m.UserId == userId);
        if (!isMember)
        {
            throw AppValidationException.Unauthorized("You are not a member of this group jar.", "auth", "FORBIDDEN");
        }

        if (request.amount <= 0)
        {
            throw AppValidationException.BadRequest("Deposit amount must be greater than zero", "amount", "INVALID_AMOUNT");
        }

        var now = DateTimeOffset.UtcNow;
        string sourceAccountInfo = "";

        // If financial account is selected, verify and deduct balance
        if (request.financialAccountId.HasValue && request.financialAccountId.Value != Guid.Empty)
        {
            var finAccount = await _dbContext.FinancialAccounts
                .FirstOrDefaultAsync(fa => fa.Id == request.financialAccountId.Value && fa.UserId == userId && fa.IsActive);

            if (finAccount == null)
            {
                throw AppValidationException.NotFound("Không tìm thấy tài khoản ngân hàng được chọn.", "financialAccountId", "ACCOUNT_NOT_FOUND");
            }

            if (finAccount.CurrentBalance < request.amount)
            {
                throw AppValidationException.BadRequest($"Số dư tài khoản '{finAccount.Name}' không đủ ({finAccount.CurrentBalance:N0}đ) để thực hiện nạp {request.amount:N0}đ.", "amount", "INSUFFICIENT_BALANCE");
            }

            // Deduct balance from selected bank/financial account
            finAccount.CurrentBalance -= request.amount;
            finAccount.UpdatedAt = now;
            sourceAccountInfo = $" (từ {finAccount.Name})";

            // Create Expense Transaction record in database
            var transaction = new Repository.Entity.Transaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FinancialAccountId = finAccount.Id,
                TransactionsAmount = request.amount,
                Type = "Expense",
                TransactionDate = now,
                SourceType = "Manual",
                Note = $"Nạp tiền vào hũ nhóm '{groupJar.Name}'",
                CreatedAt = now,
                UpdatedAt = now
            };
            _dbContext.Transactions.Add(transaction);
        }

        groupJar.CurrentBalance += request.amount;
        groupJar.UpdatedAt = now;

        // Post automatic DepositInvoice system message to group chat
        var depositorName = $"{user.FirstName} {user.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(depositorName)) depositorName = user.Username;

        var noteText = string.IsNullOrWhiteSpace(request.note)
            ? $"Nạp tiền vào hũ tiết kiệm nhóm{sourceAccountInfo}"
            : $"{request.note.Trim()}{sourceAccountInfo}";

        var invoiceMessage = new Repository.Entity.GroupJarMessage
        {
            Id = Guid.NewGuid(),
            GroupJarId = groupJar.Id,
            SenderId = userId,
            MessageType = "DepositInvoice",
            Content = noteText,
            DepositAmount = request.amount,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.GroupJarMessages.Add(invoiceMessage);

        await _dbContext.SaveChangesAsync();

        return await GetGroupJarById(id);
    }

    public async Task<List<Response.GroupJarMessageResponse>> GetMessages(Guid id)
    {
        var userId = GetCurrentUserId();
        var groupJar = await _dbContext.GroupJars
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id && g.Status == "Active");

        if (groupJar == null)
        {
            throw AppValidationException.NotFound("Group jar not found", "id", "GROUP_JAR_NOT_FOUND");
        }

        var isMember = groupJar.OwnerId == userId || groupJar.Members.Any(m => m.UserId == userId);
        if (!isMember)
        {
            throw AppValidationException.Unauthorized("You are not a member of this group jar.", "auth", "FORBIDDEN");
        }

        var messages = await _dbContext.GroupJarMessages
            .Where(m => m.GroupJarId == id)
            .Include(m => m.Sender)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return messages.Select(m => new Response.GroupJarMessageResponse
        {
            id = m.Id,
            groupJarId = m.GroupJarId,
            senderId = m.SenderId,
            senderName = m.Sender != null ? $"{m.Sender.FirstName} {m.Sender.LastName}".Trim() : "Thành viên",
            messageType = m.MessageType,
            content = m.Content,
            depositAmount = m.DepositAmount,
            createdAt = m.CreatedAt
        }).ToList();
    }

    public async Task<Response.GroupJarMessageResponse> SendMessage(Guid id, Request.SendMessageRequest request)
    {
        var userId = GetCurrentUserId();
        var user = await _dbContext.Accounts.FirstOrDefaultAsync(a => a.Id == userId);
        if (user == null)
        {
            throw AppValidationException.Unauthorized("User not found", "user", "USER_NOT_FOUND");
        }

        var groupJar = await _dbContext.GroupJars
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.Id == id && g.Status == "Active");

        if (groupJar == null)
        {
            throw AppValidationException.NotFound("Group jar not found", "id", "GROUP_JAR_NOT_FOUND");
        }

        var isMember = groupJar.OwnerId == userId || groupJar.Members.Any(m => m.UserId == userId);
        if (!isMember)
        {
            throw AppValidationException.Unauthorized("You are not a member of this group jar.", "auth", "FORBIDDEN");
        }

        if (string.IsNullOrWhiteSpace(request.content))
        {
            throw AppValidationException.BadRequest("Message content is required", "content", "REQUIRED");
        }

        var now = DateTimeOffset.UtcNow;
        var message = new Repository.Entity.GroupJarMessage
        {
            Id = Guid.NewGuid(),
            GroupJarId = id,
            SenderId = userId,
            MessageType = "Text",
            Content = request.content.Trim(),
            DepositAmount = null,
            CreatedAt = now,
            UpdatedAt = now
        };

        _dbContext.GroupJarMessages.Add(message);
        await _dbContext.SaveChangesAsync();

        return new Response.GroupJarMessageResponse
        {
            id = message.Id,
            groupJarId = message.GroupJarId,
            senderId = message.SenderId,
            senderName = $"{user.FirstName} {user.LastName}".Trim(),
            messageType = message.MessageType,
            content = message.Content,
            depositAmount = null,
            createdAt = message.CreatedAt
        };
    }

    public async Task<Response.GroupJarDetailResponse> RemoveMember(Guid id, Guid targetUserId)
    {
        var userId = GetCurrentUserId();
        var groupJar = await _dbContext.GroupJars
            .Include(g => g.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Id == id && g.Status == "Active");

        if (groupJar == null)
        {
            throw AppValidationException.NotFound("Group jar not found", "id", "GROUP_JAR_NOT_FOUND");
        }

        if (groupJar.OwnerId != userId)
        {
            throw AppValidationException.Unauthorized("Only the group jar owner can remove members.", "auth", "FORBIDDEN");
        }

        if (targetUserId == userId)
        {
            throw AppValidationException.BadRequest("Chủ hũ không thể tự xóa chính mình khỏi hũ.", "targetUserId", "CANNOT_REMOVE_OWNER");
        }

        var memberToRemove = groupJar.Members.FirstOrDefault(m => m.UserId == targetUserId);
        if (memberToRemove == null)
        {
            throw AppValidationException.NotFound("Thành viên không ở trong hũ nhóm này.", "targetUserId", "MEMBER_NOT_FOUND");
        }

        var removedUserName = memberToRemove.User != null
            ? $"{memberToRemove.User.FirstName} {memberToRemove.User.LastName}".Trim()
            : "Thành viên";

        _dbContext.GroupJarMembers.Remove(memberToRemove);

        // System notification in group chat
        var now = DateTimeOffset.UtcNow;
        var systemMsg = new Repository.Entity.GroupJarMessage
        {
            Id = Guid.NewGuid(),
            GroupJarId = groupJar.Id,
            SenderId = userId,
            Content = $"🚪 {removedUserName} đã bị mời khỏi hũ tiết kiệm nhóm.",
            MessageType = "Text",
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.GroupJarMessages.Add(systemMsg);

        await _dbContext.SaveChangesAsync();

        return await GetGroupJarById(id);
    }

    private Guid GetCurrentUserId()
    {
        return ServiceClaimHelper.GetRequiredUserId(_httpContext);
    }
}
