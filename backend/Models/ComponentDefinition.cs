namespace PcbCopilot.Backend.Models;

public sealed record ComponentDefinition
{
    public string Name { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string? Value { get; init; }
    public string? Package { get; init; }
    public string Footprint { get; init; } = string.Empty;
    public int Quantity { get; init; } = 1;
    public string? Comment { get; init; }
}
