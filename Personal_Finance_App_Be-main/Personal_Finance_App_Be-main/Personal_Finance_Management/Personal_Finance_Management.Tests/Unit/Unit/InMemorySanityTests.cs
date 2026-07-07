using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Personal_Finance_Management.Repository.Constants;
using Personal_Finance_Management.Tests.Builders;
using Personal_Finance_Management.Tests.Fixtures;
using Xunit;

namespace Personal_Finance_Management.Tests.Unit.Unit;

public class InMemorySanityTests
{
    [Fact]
    public void InMemoryProvider_ShouldAcceptAccountAndRoleWithoutNpgsqlSpecifics()
    {
        // Confirms the EF Core InMemory provider can model the schema used by Service tests.
        // If this test fails to build a context, fall back to Testcontainers-only tests.
        var factory = new TestDbContextFactory();
        using var ctx = factory.CreateContext();
        ctx.Database.EnsureCreated();

        var role = EntityBuilder.Role().Build();
        ctx.Roles.Add(role);

        var account = EntityBuilder.Account().WithUserRole().WithRole(role).Build();
        ctx.Accounts.Add(account);
        ctx.SaveChanges();

        var loaded = ctx.Accounts.Single();
        loaded.Id.Should().Be(account.Id);
        loaded.RoleId.Should().Be(AppRoles.Ids.User);
    }
}
