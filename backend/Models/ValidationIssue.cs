namespace PcbCopilot.Backend.Models;

public sealed record ValidationIssue
{
    public string Code { get; init; } = string.Empty;
    public string Severity { get; init; } = "Info";
    public string Message { get; init; } = string.Empty;
    public string Recommendation { get; init; } = string.Empty;
}
