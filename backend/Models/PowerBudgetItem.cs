namespace PcbCopilot.Backend.Models;

/// <summary>
/// Описывает предварительную оценку нагрузки для одной линии питания.
/// </summary>
public sealed record PowerBudgetItem
{
    public string Rail { get; init; } = string.Empty;
    public List<string> Loads { get; init; } = new();
    public string Status { get; init; } = string.Empty;
    public string Recommendation { get; init; } = string.Empty;
}
