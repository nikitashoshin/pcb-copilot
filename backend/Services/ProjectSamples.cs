using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

public static class ProjectSamples
{
    public static ProjectSpec IndustrialStm32Controller() => new()
    {
        ProjectName = "Industrial STM32 Controller",
        DeviceType = "industrial_controller",
        Power = new PowerSpec
        {
            Input = "24V DC",
            Outputs = new List<string> { "5V", "3.3V" },
            Protection = true
        },
        Mcu = new McuSpec
        {
            Family = "STM32",
            Programming = "SWD"
        },
        Interfaces = new List<string> { "RS-485" },
        DigitalInputs = new DigitalInputsSpec
        {
            Count = 4,
            Voltage = "24V"
        },
        RelayOutputs = new RelayOutputsSpec
        {
            Count = 2
        },
        Indication = new List<string> { "power", "status", "communication" },
        Board = new BoardSpec
        {
            WidthMm = 80,
            HeightMm = 60,
            Layers = 2
        },
        Environment = "industrial"
    };
}
