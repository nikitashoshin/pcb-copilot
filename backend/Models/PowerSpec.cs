namespace PcbCopilot.Backend.Models;

public sealed record PowerSpec
{
    public string? Input { get; init; }
    public List<string> Outputs { get; init; } = new();
    public bool Protection { get; init; }
}
