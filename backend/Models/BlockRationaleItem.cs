namespace PcbCopilot.Backend.Models;

/// <summary>
/// Объясняет, какое исходное требование привело к выбору функционального блока.
/// </summary>
public sealed record BlockRationaleItem
{
    public string BlockCode { get; init; } = string.Empty;
    public string BlockName { get; init; } = string.Empty;
    public string Reason { get; init; } = string.Empty;
    public string RelatedRequirement { get; init; } = string.Empty;
}
