namespace PcbCopilot.Backend.Models;

public sealed record ProjectSpec
{
    public string? ProjectName { get; init; }
    public string? DeviceType { get; init; }
    public PowerSpec? Power { get; init; } = new();
    public McuSpec? Mcu { get; init; } = new();
    public List<string> Interfaces { get; init; } = new();
    public DigitalInputsSpec? DigitalInputs { get; init; } = new();
    public RelayOutputsSpec? RelayOutputs { get; init; } = new();
    public List<string> Indication { get; init; } = new();
    public BoardSpec? Board { get; init; } = new();
    public string? Environment { get; init; }
}
