namespace PcbCopilot.Backend.Models;

public sealed record CheckResult
{
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Severity { get; init; } = "Info";
    public string Status { get; init; } = "NotApplicable";
    public string Message { get; init; } = string.Empty;
    public string? Recommendation { get; init; }
    public string? RelatedBlockCode { get; init; }
}
