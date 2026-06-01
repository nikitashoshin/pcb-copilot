namespace PcbCopilot.Backend.Models;

public sealed record ValidationResult
{
    public bool IsValid { get; init; }
    public List<ValidationIssue> Issues { get; init; } = new();
}
