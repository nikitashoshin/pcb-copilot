namespace PcbCopilot.Backend.Models;

/// <summary>
/// Представляет инженерный риск с приоритетом и рекомендацией по дальнейшей проверке.
/// </summary>
public sealed record EngineeringRiskItem
{
    public string Code { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public string Recommendation { get; init; } = string.Empty;
    public string? RelatedBlockCode { get; init; }
}
