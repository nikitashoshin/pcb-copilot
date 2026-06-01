using System.Text.Json;
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

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

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

app.Run();
