namespace PcbCopilot.Backend.Models;

public sealed record DigitalInputsSpec
{
    public int Count { get; init; }
    public string? Voltage { get; init; }
}
