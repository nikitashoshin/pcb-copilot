namespace PcbCopilot.Backend.Models;

public sealed record McuSpec
{
    public string? Family { get; init; }
    public string? Programming { get; init; }
}
