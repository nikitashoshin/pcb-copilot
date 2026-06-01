namespace PcbCopilot.Backend.Models;

public sealed record EngineeringWarning
{
    public string Code { get; init; } = string.Empty;
    public string Severity { get; init; } = "Warning";
    public string Message { get; init; } = string.Empty;
    public string? RelatedBlockCode { get; init; }
}
