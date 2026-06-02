using System.Text;
using PcbCopilot.Backend.Models;
using PcbCopilot.Backend.Services;

namespace PcbCopilot.Backend.Endpoints;

/// <summary>
/// Описывает HTTP-контракт MVP для работы с проектами.
/// Endpoint-слой оставляет бизнес-логику сервисам и только связывает request/response с HTTP.
/// </summary>
public static class ProjectEndpoints
{
    /// <summary>
    /// Регистрирует существующие project endpoints без изменения их URL и форматов ответов.
    /// </summary>
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", () => Results.Redirect("/swagger"));

        var projects = app.MapGroup("/api/projects")
            .WithTags("Projects");

        projects.MapGet("/sample", () => Results.Ok(ProjectSamples.IndustrialStm32Controller()))
            .WithName("GetSampleProjectSpec")
            .Produces<ProjectSpec>();

        projects.MapPost("/generate-architecture", (ProjectSpec spec, ArchitectureGenerator generator) =>
            {
                var result = generator.Generate(spec);
                return Results.Ok(result);
            })
            .WithName("GenerateArchitecture")
            .Accepts<ProjectSpec>("application/json")
            .Produces<ArchitectureResult>();

        projects.MapPost("/validate", (ProjectSpec spec, ProjectValidator validator) =>
            {
                var result = validator.Validate(spec);
                return Results.Ok(result);
            })
            .WithName("ValidateProjectSpec")
            .Accepts<ProjectSpec>("application/json")
            .Produces<ValidationResult>();

        projects.MapPost("/export-bom-csv", (ArchitectureResult architecture, BomCsvExporter exporter) =>
            {
                var csv = exporter.Export(architecture);
                var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
                return Results.File(bytes, "text/csv; charset=utf-8", "pcb-copilot-bom.csv");
            })
            .WithName("ExportBomCsv")
            .Accepts<ArchitectureResult>("application/json")
            .Produces(200, contentType: "text/csv");

        projects.MapPost("/generate-report", (ArchitectureResult architecture, MarkdownReportGenerator generator) =>
            {
                var markdown = generator.Generate(architecture);
                return Results.Text(markdown, "text/markdown; charset=utf-8");
            })
            .WithName("GenerateReport")
            .Accepts<ArchitectureResult>("application/json")
            .Produces(200, contentType: "text/markdown");

        projects.MapPost("/export-package", (ArchitectureResult architecture, ProjectPackageExporter exporter) =>
            {
                var package = exporter.Export(architecture);
                return Results.File(package, "application/zip", "pcb-copilot-industrial-stm32-controller.zip");
            })
            .WithName("ExportProjectPackage")
            .Accepts<ArchitectureResult>("application/json")
            .Produces(200, contentType: "application/zip");

        return app;
    }
}
