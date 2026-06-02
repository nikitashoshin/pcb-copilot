using System.Text.Json;
using PcbCopilot.Backend.Endpoints;
using PcbCopilot.Backend.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.WriteIndented = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddPcbCopilotServices();
builder.Services.AddFrontendCors();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Frontend");

app.MapProjectEndpoints();

app.Run();
