namespace Personal_Finance_Management.Service.GroupJar;

public interface IService
{
    Task<Response.GetGroupJarsResult> GetGroupJars();
    Task<Response.GroupJarDetailResponse> GetGroupJarById(Guid id);
    Task<Response.GroupJarDetailResponse> CreateGroupJar(Request.CreateGroupJarRequest request);
    Task<Response.GroupJarMemberResponse> InviteMemberByEmail(Guid id, Request.InviteMemberRequest request);
    Task<Response.GroupJarDetailResponse> DepositFunds(Guid id, Request.DepositRequest request);
    Task<List<Response.GroupJarMessageResponse>> GetMessages(Guid id);
    Task<Response.GroupJarMessageResponse> SendMessage(Guid id, Request.SendMessageRequest request);
    Task<Response.GroupJarDetailResponse> RemoveMember(Guid id, Guid targetUserId);
}
