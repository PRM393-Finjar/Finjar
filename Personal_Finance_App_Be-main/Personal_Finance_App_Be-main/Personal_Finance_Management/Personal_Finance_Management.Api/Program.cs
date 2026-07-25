using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Personal_Finance_Management.Api.Extensions;
using Personal_Finance_Management.Api.Jobs;
using Personal_Finance_Management.Api.Middlewares;
using Personal_Finance_Management.Repository;
using AdminService = Personal_Finance_Management.Service.Admin;
using authService = Personal_Finance_Management.Service.Auth;
using BroadcastService = Personal_Finance_Management.Service.broadcast;
using CategoryService = Personal_Finance_Management.Service.category;
using ImportService = Personal_Finance_Management.Service.import;
using jwtService = Personal_Finance_Management.Service.JwtService;
using OcrService = Personal_Finance_Management.Service.ocr;
using OnboardingService = Personal_Finance_Management.Service.Onboarding;
using UserService = Personal_Finance_Management.Service.User;
using validationService = Personal_Finance_Management.Service.Validations;
using ReminderService = Personal_Finance_Management.Service.Reminder;
using GoalService = Personal_Finance_Management.Service.goal;
using LimitService = Personal_Finance_Management.Service.limit;
using NotificationService = Personal_Finance_Management.Service.notification;
using AIService = Personal_Finance_Management.Service.AI;
using SubscriptionService = Personal_Finance_Management.Service.Subscription;

using Personal_Finance_Management.Service.Seeding;
using Personal_Finance_Management.Service.Email;
using EmailVerificationService = Personal_Finance_Management.Service.EmailVerification;

using financialAccountService = Personal_Finance_Management.Service.FinancialAccount;
using jarsService = Personal_Finance_Management.Service.Jar;
using GroupJarService = Personal_Finance_Management.Service.GroupJar;
using transactionService = Personal_Finance_Management.Service.Transaction;
using dashboardService = Personal_Finance_Management.Service.Dashboard;

// Local `dotnet run` does not load Docker Compose `.env` automatically.
LoadLocalDotEnvFile();

var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "FrontendCorsPolicy";

builder.Services.AddMemoryCache();

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .SetIsOriginAllowed(origin =>
                {
                    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return false;
                    }

                    return uri.Host is "localhost" or "127.0.0.1";
                })
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddSwaggerServices();

// hien: khuc nay dung de chon connection string dung cho local hoac hosting truoc khi dang ky DbContext
var databaseConnectionString = builder.GetAppDatabaseConnectionString();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(databaseConnectionString)
        // hien: cai dat de toan bo database dung snake case, neu khong se bi loi khi truy van bang do EF mac dinh se dung PascalCase
        .UseSnakeCaseNamingConvention()
);
builder.Services.AddJwtServices(builder.Configuration);
builder.Services.AddAuthorizationPolicies();
builder.Services.Configure<SeedAccountsOptions>(
    builder.Configuration.GetSection(SeedAccountsOptions.SectionName));
builder.Services.AddOptions<EmailOptions>()
    .Bind(builder.Configuration.GetSection(EmailOptions.SectionName))
    .PostConfigure<IConfiguration>((options, config) =>
    {
        NormalizeEmailOptions(options);

        var mail = config.GetSection(LegacyMailOptions.SectionName).Get<LegacyMailOptions>();
        if (mail is not null
            && !string.IsNullOrWhiteSpace(mail.Host)
            && !string.IsNullOrWhiteSpace(mail.Password)
            && !string.IsNullOrWhiteSpace(mail.Mail))
        {
            options.UseSmtp = true;
            options.FromAddress = mail.Mail.Trim();
            options.FromName = string.IsNullOrWhiteSpace(mail.DisplayName) ? options.FromName : mail.DisplayName.Trim();
            options.SmtpHost = mail.Host.Trim();
            options.SmtpPort = mail.Port > 0 ? mail.Port : 587;
            options.SmtpUsername = mail.Mail.Trim();
            options.SmtpPassword = NormalizeSmtpPassword(mail.Password, mail.Host);
            options.SmtpUseSsl = true;
        }

        if (!options.UseSmtp
            && !string.IsNullOrWhiteSpace(options.SmtpHost)
            && !string.IsNullOrWhiteSpace(options.SmtpPassword)
            && (!string.IsNullOrWhiteSpace(options.SmtpUsername)
                || !string.IsNullOrWhiteSpace(options.FromAddress)))
        {
            options.UseSmtp = true;
        }

        NormalizeEmailOptions(options);
    });

builder.Services.AddScoped<SmtpEmailSender>();
builder.Services.AddScoped<LoggingEmailSender>();
builder.Services.AddScoped<IEmailSender>(sp =>
{
    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<EmailOptions>>().Value;
    return options.UseSmtp
        ? sp.GetRequiredService<SmtpEmailSender>()
        : sp.GetRequiredService<LoggingEmailSender>();
});

builder.Services.AddScoped<EmailVerificationService.IService, EmailVerificationService.Service>();
builder.Services.AddScoped<authService.IService, authService.Service>();
builder.Services.AddScoped<jwtService.IService, jwtService.Service>();
builder.Services.AddScoped<validationService.IServices, validationService.ValidationServices>();
builder.Services.AddScoped<OnboardingService.IService, OnboardingService.Service>();
builder.Services.AddScoped<UserService.IService, UserService.Service>();
builder.Services.AddScoped<financialAccountService.IService, financialAccountService.Service>();
builder.Services.AddScoped<jarsService.IService, jarsService.Service>();
builder.Services.AddScoped<GroupJarService.IService, GroupJarService.Service>();
builder.Services.AddScoped<transactionService.IService, transactionService.Service>();
builder.Services.AddScoped<dashboardService.IService, dashboardService.Service>();
builder.Services.AddScoped<CategoryService.IService, CategoryService.Service>();
builder.Services.AddScoped<ReminderService.IService, ReminderService.Service>();
builder.Services.AddScoped<GoalService.IService, GoalService.Service>();
builder.Services.AddScoped<LimitService.IService, LimitService.Service>();
builder.Services.AddScoped<NotificationService.IService, NotificationService.Service>();
builder.Services.AddScoped<BroadcastService.IService, BroadcastService.Service>();
builder.Services.AddScoped<AdminService.IService, AdminService.Service>();
builder.Services.AddScoped<AIService.IService, AIService.Service>();
builder.Services.Configure<SubscriptionService.PayOSOptions>(
    builder.Configuration.GetSection(SubscriptionService.PayOSOptions.SectionName));
builder.Services.PostConfigure<SubscriptionService.PayOSOptions>(options =>
{
    options.ClientId = options.ClientId?.Trim() ?? string.Empty;
    options.ApiKey = options.ApiKey?.Trim() ?? string.Empty;
    options.ChecksumKey = options.ChecksumKey?.Trim() ?? string.Empty;
    options.BaseUrl = string.IsNullOrWhiteSpace(options.BaseUrl)
        ? "https://api-merchant.payos.vn"
        : options.BaseUrl.Trim().TrimEnd('/');
    options.ReturnUrl = options.ReturnUrl?.Trim() ?? string.Empty;
    options.CancelUrl = options.CancelUrl?.Trim() ?? string.Empty;
});
builder.Services.AddHttpClient("PayOS", (sp, client) =>
{
    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<SubscriptionService.PayOSOptions>>().Value;
    var baseUrl = string.IsNullOrWhiteSpace(options.BaseUrl)
        ? "https://api-merchant.payos.vn"
        : options.BaseUrl.TrimEnd('/');
    client.BaseAddress = new Uri(baseUrl + "/");
    client.Timeout = TimeSpan.FromSeconds(20);
    client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "application/json");
}).ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
{
    ConnectTimeout = TimeSpan.FromSeconds(10),
    PooledConnectionLifetime = TimeSpan.FromMinutes(5)
});
builder.Services.AddScoped<SubscriptionService.IService, SubscriptionService.Service>();
builder.Services.AddScoped<DatabaseSeedService>();
builder.Services.AddHostedService<BroadcastDispatchBackgroundService>();
builder.Services.AddHttpClient<OcrService.IService, OcrService.Service>(client =>
{
    var timeoutSeconds = builder.Configuration.GetValue<int?>("Ocr:TimeoutSeconds") ?? 120;
    client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
});
builder.Services.AddScoped<OcrService.IReceiptParserService, OcrService.ReceiptParserService>();
builder.Services.AddScoped<ImportService.IServices, ImportService.Service>();

var app = builder.Build();

// ===== MAIL CONFIG DIAGNOSTIC (temporary) =====
{
    var mailSection = app.Configuration.GetSection(LegacyMailOptions.SectionName);
    var emailOpts = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<EmailOptions>>().Value;
    using var mailScope = app.Services.CreateScope();
    var resolvedSender = mailScope.ServiceProvider.GetRequiredService<IEmailSender>();
    var envPassword = Environment.GetEnvironmentVariable("MailOptions__Password");

    Console.WriteLine("===== MAIL CONFIG =====");
    Console.WriteLine($"IEmailSender resolved as: {resolvedSender.GetType().Name}");
    Console.WriteLine($"Email.UseSmtp: {emailOpts.UseSmtp}");
    Console.WriteLine($"Email.SmtpHost: {emailOpts.SmtpHost}");
    Console.WriteLine($"Email.SmtpPort: {emailOpts.SmtpPort}");
    Console.WriteLine($"Email.FromAddress: {emailOpts.FromAddress}");
    Console.WriteLine($"MailOptions.Mail: {mailSection["Mail"]}");
    Console.WriteLine($"MailOptions.Host: {mailSection["Host"]}");
    Console.WriteLine($"MailOptions.Port: {mailSection["Port"]}");
    Console.WriteLine(string.IsNullOrWhiteSpace(mailSection["Password"])
        ? "MailOptions.Password: EMPTY"
        : "MailOptions.Password: OK");
    Console.WriteLine(string.IsNullOrWhiteSpace(emailOpts.SmtpPassword)
        ? "Email.SmtpPassword: EMPTY"
        : "Email.SmtpPassword: OK");
    Console.WriteLine(envPassword is null
        ? "Env MailOptions__Password: null (not set in process)"
        : string.IsNullOrWhiteSpace(envPassword)
            ? "Env MailOptions__Password: EMPTY"
            : "Env MailOptions__Password: SET");
    Console.WriteLine("=======================");
}
// ===== END MAIL CONFIG DIAGNOSTIC =====

// hien: khuc nay dung de tu dong apply database migration khi bien ApplyMigrations duoc bat
app.ApplyDatabaseMigrations();
await app.SeedConfiguredAccountsAsync();

app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

var enableSwagger = app.Environment.IsDevelopment()
                    || app.Configuration.GetValue<bool>("EnableSwagger");


if (enableSwagger)
{
    app.UseSwaggerAPI();
}

app.UseCors(FrontendCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void LoadLocalDotEnvFile()
{
    var candidates = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".env")),
        Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env")),
    };

    Console.WriteLine("===== .ENV LOAD =====");
    Console.WriteLine($"CWD: {Directory.GetCurrentDirectory()}");
    Console.WriteLine($"BaseDirectory: {AppContext.BaseDirectory}");

    foreach (var path in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
    {
        var exists = File.Exists(path);
        Console.WriteLine($"Candidate: {path} => {(exists ? "FOUND" : "missing")}");
        if (!exists)
        {
            continue;
        }

        var loadedKeys = 0;
        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#') || !line.Contains('='))
            {
                continue;
            }

            var separator = line.IndexOf('=');
            var key = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim().Trim('"').Trim('\'');
            if (key.Length == 0)
            {
                continue;
            }

            // Do not override values already set in the process / shell.
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
                loadedKeys++;
            }
        }

        Console.WriteLine($"Loaded .env from: {path} (set {loadedKeys} new env vars)");
        Console.WriteLine("====================");
        return;
    }

    Console.WriteLine("No .env file found in candidates.");
    Console.WriteLine("====================");
}

static void NormalizeEmailOptions(EmailOptions options)
{
    options.FromAddress = options.FromAddress.Trim();
    options.FromName = options.FromName.Trim();
    options.SmtpHost = options.SmtpHost?.Trim();
    options.SmtpUsername = string.IsNullOrWhiteSpace(options.SmtpUsername)
        ? options.FromAddress
        : options.SmtpUsername.Trim();
    options.SmtpPassword = NormalizeSmtpPassword(options.SmtpPassword, options.SmtpHost);
}

static string? NormalizeSmtpPassword(string? password, string? host)
{
    if (string.IsNullOrWhiteSpace(password))
    {
        return password;
    }

    var normalized = password.Trim();
    if (!string.IsNullOrWhiteSpace(host)
        && host.Contains("gmail.com", StringComparison.OrdinalIgnoreCase))
    {
        normalized = string.Concat(normalized.Where(c => !char.IsWhiteSpace(c)));
    }

    return normalized;
}
