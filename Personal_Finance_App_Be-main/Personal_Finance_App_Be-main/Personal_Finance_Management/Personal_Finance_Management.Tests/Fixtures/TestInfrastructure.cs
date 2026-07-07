using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Personal_Finance_Management.Repository;

namespace Personal_Finance_Management.Tests.Fixtures;

/// <summary>
/// Lightweight HTTP-context fake used to feed <c>IHttpContextAccessor</c> with a chosen <c>User.Id</c> claim.
/// The Transaction service uses <c>ServiceClaimHelper.GetRequiredUserId(...)</c>, which reads the "id" claim.
/// </summary>
public sealed class FakeHttpContextAccessor : IHttpContextAccessor
{
    private readonly HttpContext _context;

    public FakeHttpContextAccessor(Guid? userId = null)
    {
        var claims = new List<System.Security.Claims.Claim>();
        if (userId.HasValue)
        {
            claims.Add(new System.Security.Claims.Claim("id", userId.Value.ToString()));
        }

        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        _context = new DefaultHttpContext
        {
            User = new System.Security.Claims.ClaimsPrincipal(identity),
        };
    }

    public HttpContext HttpContext
    {
        get => _context;
        set => throw new NotSupportedException("Use constructor to set claims.");
    }

    public IHeaderDictionary RequestHeaders => HttpContext.Request.Headers;
    public IHeaderDictionary ResponseHeaders => HttpContext.Response.Headers;

    public void SetUserId(Guid userId)
    {
        var claims = new List<System.Security.Claims.Claim>
        {
            new("id", userId.ToString()),
        };
        var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
        HttpContext.User = new System.Security.Claims.ClaimsPrincipal(identity);
    }

    public void ClearUser()
    {
        HttpContext.User = new System.Security.Claims.ClaimsPrincipal();
    }
}

/// <summary>
/// Builds an <see cref="AppDbContext"/> backed by EF Core InMemory. Each <c>CreateContext</c>
/// returns an isolated context so tests cannot leak state.
/// </summary>
public sealed class TestDbContextFactory
{
    private int _counter = 0;

    public AppDbContext CreateContext(string? name = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name ?? $"finjar-test-{Guid.NewGuid()}-{Interlocked.Increment(ref _counter)}")
            .ConfigureWarnings(b => b.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .EnableSensitiveDataLogging()
            .Options;
        return new AppDbContext(options);
    }

    public AppDbContext CreateSeeded(Action<AppDbContext> seed, Guid? userId = null)
    {
        var ctx = CreateContext();
        ctx.Database.EnsureCreated();
        seed(ctx);
        ctx.SaveChanges();
        return ctx;
    }

    /// <summary>
    /// Builds a service provider that wires up <see cref="AppDbContext"/>, an HTTP accessor
    /// with the supplied userId, and a logger. Configure more services via the action.
    /// </summary>
    public IServiceProvider BuildServiceProvider(Guid? userId, Action<IServiceCollection>? configure = null, AppDbContext? dbContext = null)
    {
        var httpAccessor = new FakeHttpContextAccessor(userId);
        var services = new ServiceCollection();
        services.AddSingleton<IHttpContextAccessor>(httpAccessor);
        services.AddSingleton(httpAccessor);
        services.AddLogging();
        services.AddSingleton(dbContext ?? CreateContext());
        configure?.Invoke(services);
        return services.BuildServiceProvider();
    }
}
