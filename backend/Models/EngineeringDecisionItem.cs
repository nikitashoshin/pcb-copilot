namespace PcbCopilot.Backend.Models;

/// <summary>
/// Фиксирует решение, которое должен принять инженер до детализации схемы и платы.
/// </summary>
public sealed record EngineeringDecisionItem
{
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string WhyItMatters { get; init; } = string.Empty;
    public string Recommendation { get; init; } = string.Empty;
}
