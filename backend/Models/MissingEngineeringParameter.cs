namespace PcbCopilot.Backend.Models;

/// <summary>
/// Описывает важный инженерный параметр, которого пока нет в исходных требованиях.
/// </summary>
public sealed record MissingEngineeringParameter
{
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string WhyItMatters { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Recommendation { get; init; } = string.Empty;
}
