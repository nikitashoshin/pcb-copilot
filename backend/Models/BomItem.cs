namespace PcbCopilot.Backend.Models;

public sealed record BomItem
{
    public string Reference { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty;
    public string? Value { get; init; }
    public string? Package { get; init; }
    public string Footprint { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public string? Comment { get; init; }
    public string BlockCode { get; init; } = string.Empty;
}
