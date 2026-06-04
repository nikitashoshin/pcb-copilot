namespace PcbCopilot.Backend.Models;

/// <summary>
/// Описывает предварительную потребность функции в GPIO и периферии микроконтроллера.
/// </summary>
public sealed record GpioBudgetItem
{
    public string Function { get; init; } = string.Empty;
    public List<string> RequiredResources { get; init; } = new();
    public string EstimatedPins { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
}
