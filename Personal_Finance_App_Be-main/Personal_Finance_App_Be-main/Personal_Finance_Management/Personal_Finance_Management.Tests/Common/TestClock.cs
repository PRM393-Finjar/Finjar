using System.Diagnostics;

namespace Personal_Finance_Management.Tests.Common;

/// <summary>
/// Helpers to load the test-only <c>appsettings.Test.json</c> file from the project directory
/// so configuration is consistent across unit and integration tests.
/// </summary>
public static class TestPaths
{
    public static string TestProjectDirectory
    {
        get
        {
            var dir = AppContext.BaseDirectory;
            // BaseDirectory = bin/Debug/net8.0, climb back up to project root.
            for (var i = 0; i < 6; i++)
            {
                if (File.Exists(Path.Combine(dir, "Personal_Finance_Management.Tests.csproj")))
                {
                    return dir;
                }

                dir = Path.GetDirectoryName(dir) ?? dir;
            }

            throw new InvalidOperationException(
                "Test project directory not found relative to " + AppContext.BaseDirectory);
        }
    }
}

/// <summary>
/// A deterministic clock that you can advance from tests. Use this instead of
/// touching the system clock so generated timestamps are reproducible.
/// </summary>
public sealed class TestClock
{
    public DateTimeOffset UtcNow { get; private set; } = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    public void SetNow(DateTimeOffset now) => UtcNow = now;
    public void Advance(TimeSpan span) => UtcNow = UtcNow.Add(span);

    public DateTimeOffset UtcNowAdd(TimeSpan span) => UtcNow.Add(span);
}

/// <summary>
/// Convenience assertion helpers shared across tests.
/// </summary>
public static class TestDebug
{
    public static void Dump(object? value)
    {
        Trace.WriteLine(value?.ToString() ?? "<null>");
    }
}
