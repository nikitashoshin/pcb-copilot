using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

public sealed class ProjectSpecValidator
{
    public ValidationResult Validate(ProjectSpec spec)
    {
        var issues = new List<ValidationIssue>();
        var power = spec.Power ?? new PowerSpec();
        var mcu = spec.Mcu ?? new McuSpec();
        var board = spec.Board ?? new BoardSpec();
        var digitalInputs = spec.DigitalInputs ?? new DigitalInputsSpec();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();

        if (string.IsNullOrWhiteSpace(spec.ProjectName))
        {
            issues.Add(Error(
                "PROJECT_NAME_REQUIRED",
                "Project name must not be empty.",
                "Enter a clear project name before generating the architecture."));
        }

        if (string.IsNullOrWhiteSpace(power.Input))
        {
            issues.Add(Error(
                "POWER_INPUT_REQUIRED",
                "Power input must not be empty.",
                "Specify the input supply, for example 24V DC for the MVP scenario."));
        }

        if (IsSame(power.Input, "24V DC") && !power.Protection)
        {
            issues.Add(Warning(
                "24V_POWER_PROTECTION_RECOMMENDED",
                "24V DC input should include reverse polarity or input protection.",
                "Enable protection or explicitly review reverse polarity, surge, EFT and ESD protection."));
        }

        if (IsSame(mcu.Family, "STM32") && !ContainsValue(power.Outputs, "3.3V"))
        {
            issues.Add(Error(
                "STM32_REQUIRES_3V3",
                "STM32 requires a 3.3V power rail.",
                "Add 3.3V to power.outputs before generating the architecture."));
        }

        if (IsSame(mcu.Family, "STM32") && !IsSame(mcu.Programming, "SWD"))
        {
            issues.Add(Warning(
                "STM32_SWD_RECOMMENDED",
                "STM32 projects should normally expose SWD for programming and debugging.",
                "Use SWD unless the project has a documented alternative programming path."));
        }

        if (board.WidthMm <= 0)
        {
            issues.Add(Error(
                "BOARD_WIDTH_REQUIRED",
                "Board width must be greater than zero.",
                "Set board.widthMm to a positive value."));
        }

        if (board.HeightMm <= 0)
        {
            issues.Add(Error(
                "BOARD_HEIGHT_REQUIRED",
                "Board height must be greater than zero.",
                "Set board.heightMm to a positive value."));
        }

        if (board.Layers is not (2 or 4))
        {
            issues.Add(Error(
                "BOARD_LAYERS_UNSUPPORTED",
                "Board layer count must be 2 or 4 for the MVP.",
                "Use 2 layers for the first demonstration scenario, or 4 layers if the design requires it."));
        }

        if (ContainsValue(spec.Interfaces, "RS-485"))
        {
            issues.Add(Warning(
                "RS485_LINE_REVIEW_REQUIRED",
                "RS-485 requires review of termination, biasing and line protection.",
                "Check 120 Ohm termination, bias resistors, ESD/TVS protection and whether isolation is required."));
        }

        if (digitalInputs.Count > 0 && IsSame(digitalInputs.Voltage, "24V"))
        {
            issues.Add(Warning(
                "DIGITAL_INPUT_24V_REVIEW_REQUIRED",
                "24V digital inputs require level adaptation and protection.",
                "Check input current, filtering, voltage clamping, isolation need and STM32 logic-level compatibility."));
        }

        if (relayOutputs.Count > 0)
        {
            issues.Add(Warning(
                "RELAY_OUTPUT_REVIEW_REQUIRED",
                "Relay outputs require load current, coil protection and clearance review.",
                "Check contact rating, load type, flyback protection, creepage and clearance before production."));
        }

        if (IsSame(spec.Environment, "industrial"))
        {
            issues.Add(Warning(
                "INDUSTRIAL_ENVIRONMENT_REVIEW_REQUIRED",
                "Industrial environment requires EMC, ESD and EFT review.",
                "Review input protection, interface protection, filtering, grounding and layout before production."));
        }

        return new ValidationResult
        {
            IsValid = issues.All(issue => !IsSame(issue.Severity, "Error")),
            Issues = issues
        };
    }

    private static ValidationIssue Error(string code, string message, string recommendation)
    {
        return Issue(code, "Error", message, recommendation);
    }

    private static ValidationIssue Warning(string code, string message, string recommendation)
    {
        return Issue(code, "Warning", message, recommendation);
    }

    private static ValidationIssue Issue(string code, string severity, string message, string recommendation)
    {
        return new ValidationIssue
        {
            Code = code,
            Severity = severity,
            Message = message,
            Recommendation = recommendation
        };
    }

    private static bool ContainsValue(IEnumerable<string>? values, string expected)
    {
        return values?.Any(value => IsSame(value, expected)) == true;
    }

    private static bool IsSame(string? actual, string expected)
    {
        return string.Equals(actual?.Trim(), expected, StringComparison.OrdinalIgnoreCase);
    }
}
