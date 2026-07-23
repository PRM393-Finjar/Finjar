using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Personal_Finance_Management.Service.GroupJar;

namespace Personal_Finance_Management.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/group-jars")]
public class GroupJarController : ControllerBase
{
    private readonly IService _service;

    public GroupJarController(IService service)
    {
        _service = service;
    }

    [HttpGet("")]
    public async Task<IActionResult> GetGroupJars()
    {
        var result = await _service.GetGroupJars();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetGroupJarById(Guid id)
    {
        var result = await _service.GetGroupJarById(id);
        return Ok(result);
    }

    [HttpPost("")]
    public async Task<IActionResult> CreateGroupJar([FromBody] Request.CreateGroupJarRequest request)
    {
        var result = await _service.CreateGroupJar(request);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("{id}/invite")]
    public async Task<IActionResult> InviteMemberByEmail(Guid id, [FromBody] Request.InviteMemberRequest request)
    {
        var result = await _service.InviteMemberByEmail(id, request);
        return Ok(result);
    }

    [HttpPost("{id}/deposit")]
    public async Task<IActionResult> DepositFunds(Guid id, [FromBody] Request.DepositRequest request)
    {
        var result = await _service.DepositFunds(id, request);
        return Ok(result);
    }

    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(Guid id)
    {
        var result = await _service.GetMessages(id);
        return Ok(result);
    }

    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] Request.SendMessageRequest request)
    {
        var result = await _service.SendMessage(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var result = await _service.RemoveMember(id, userId);
        return Ok(result);
    }
}
