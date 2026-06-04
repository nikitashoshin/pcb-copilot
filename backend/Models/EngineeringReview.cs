namespace PcbCopilot.Backend.Models;

/// <summary>
/// Содержит структурированный предварительный инженерный анализ архитектурного черновика.
/// Анализ помогает выявить пробелы и риски, но не является финальным инженерным заключением.
/// </summary>
public sealed record EngineeringReview
{
    public List<MissingEngineeringParameter> MissingParameters { get; init; } = new();
    public List<BlockRationaleItem> BlockRationale { get; init; } = new();
    public List<EngineeringRiskItem> RiskSummary { get; init; } = new();
    public List<PowerBudgetItem> PowerBudget { get; init; } = new();
    public List<GpioBudgetItem> GpioBudget { get; init; } = new();
    public List<EngineeringDecisionItem> EngineeringDecisions { get; init; } = new();
    public List<EngineeringNextStep> NextSteps { get; init; } = new();
}
