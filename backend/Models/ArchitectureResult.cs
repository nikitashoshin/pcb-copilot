namespace PcbCopilot.Backend.Models;

public sealed record ArchitectureResult
{
    public string ProjectName { get; init; } = string.Empty;
    public List<FunctionalBlockResult> FunctionalBlocks { get; init; } = new();
    public List<BomItem> Bom { get; init; } = new();
    public List<EngineeringWarning> Warnings { get; init; } = new();
    public List<CheckResult> CheckResults { get; init; } = new();
}
