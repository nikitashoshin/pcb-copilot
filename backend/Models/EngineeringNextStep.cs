namespace PcbCopilot.Backend.Models;

/// <summary>
/// Описывает рекомендуемый шаг дальнейшей инженерной работы.
/// </summary>
public sealed record EngineeringNextStep
{
    public int Order { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
}
