namespace PcbCopilot.Backend.Models;

public sealed record FunctionalBlockDefinition
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public List<ComponentDefinition> Components { get; init; } = new();
    public List<EngineeringWarning> DefaultWarnings { get; init; } = new();
}
