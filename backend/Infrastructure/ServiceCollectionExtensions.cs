using PcbCopilot.Backend.Services;

namespace PcbCopilot.Backend.Infrastructure;

/// <summary>
/// Содержит регистрацию инфраструктурных зависимостей приложения.
/// Program.cs остаётся точкой сборки, а детали DI и CORS живут в одном месте.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Регистрирует сервисы бизнес-логики PCB Copilot MVP.
    /// </summary>
    public static IServiceCollection AddPcbCopilotServices(this IServiceCollection services)
    {
        services.AddSingleton<FunctionalBlockCatalog>();
        services.AddSingleton<ArchitectureGenerator>();
        services.AddSingleton<ProjectValidator>();
        services.AddSingleton<BomCsvExporter>();
        services.AddSingleton<MarkdownReportGenerator>();
        services.AddSingleton<ProjectPackageExporter>();

        return services;
    }

    /// <summary>
    /// Разрешает frontend обращаться к backend только с локального адреса разработки.
    /// </summary>
    public static IServiceCollection AddFrontendCors(this IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                policy
                    .WithOrigins("http://127.0.0.1:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        return services;
    }
}
