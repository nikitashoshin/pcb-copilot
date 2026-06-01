namespace PcbCopilot.Backend.Models;

public sealed record BoardSpec
{
    public decimal WidthMm { get; init; }
    public decimal HeightMm { get; init; }
    public int Layers { get; init; }
}
