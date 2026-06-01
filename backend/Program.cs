using System.Text.Json;
using System.Text;
using PcbCopilot.Backend.Models;
using PcbCopilot.Backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.WriteIndented = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<FunctionalBlockCatalog>();
builder.Services.AddSingleton<ArchitectureGenerator>();
builder.Services.AddSingleton<BomCsvExporter>();
builder.Services.AddSingleton<MarkdownReportGenerator>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://127.0.0.1:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Frontend");

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

app.Run();
