using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

/// <summary>
/// Проверяет исходные требования проекта до генерации архитектуры.
/// Ошибки блокируют сценарий, предупреждения оставляют генерацию доступной,
/// но явно подсвечивают инженерные риски.
/// </summary>
public sealed class ProjectValidator
{
    /// <summary>
    /// Выполняет базовые MVP-проверки ProjectSpec и возвращает список проблем
    /// в формате, который напрямую отображается frontend.
    /// </summary>
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
                "Название проекта не должно быть пустым.",
                "Введите понятное название проекта перед формированием архитектуры."));
        }

        if (string.IsNullOrWhiteSpace(power.Input))
        {
            issues.Add(Error(
                "POWER_INPUT_REQUIRED",
                "Входное питание не должно быть пустым.",
                "Укажите входное питание, например 24V DC для MVP-сценария."));
        }

        if (IsSame(power.Input, "24V DC") && !power.Protection)
        {
            issues.Add(Warning(
                "24V_POWER_PROTECTION_RECOMMENDED",
                "Для входа 24V DC рекомендуется защита питания.",
                "Включите защиту или отдельно проверьте переполюсовку, импульсные помехи, EFT и ESD."));
        }

        if (IsSame(mcu.Family, "STM32") && !ContainsValue(power.Outputs, "3.3V"))
        {
            issues.Add(Error(
                "STM32_REQUIRES_3V3",
                "Для STM32 требуется линия питания 3.3V.",
                "Добавьте 3.3V во внутренние линии питания перед формированием архитектуры."));
        }

        if (IsSame(mcu.Family, "STM32") && !IsSame(mcu.Programming, "SWD"))
        {
            issues.Add(Warning(
                "STM32_SWD_RECOMMENDED",
                "Для STM32 желательно вывести SWD для прошивки и отладки.",
                "Используйте SWD, если для проекта не описан другой способ программирования."));
        }

        if (board.WidthMm <= 0)
        {
            issues.Add(Error(
                "BOARD_WIDTH_REQUIRED",
                "Ширина платы должна быть больше нуля.",
                "Укажите положительное значение ширины платы."));
        }

        if (board.HeightMm <= 0)
        {
            issues.Add(Error(
                "BOARD_HEIGHT_REQUIRED",
                "Высота платы должна быть больше нуля.",
                "Укажите положительное значение высоты платы."));
        }

        if (board.Layers is not (2 or 4))
        {
            issues.Add(Error(
                "BOARD_LAYERS_UNSUPPORTED",
                "Для MVP количество слоёв должно быть 2 или 4.",
                "Используйте 2 слоя для первого демонстрационного сценария или 4 слоя при необходимости."));
        }

        if (ContainsValue(spec.Interfaces, "RS-485"))
        {
            issues.Add(Warning(
                "RS485_LINE_REVIEW_REQUIRED",
                "RS-485 требует проверки терминатора, biasing и защиты линии.",
                "Проверьте терминатор 120 Ом, bias-резисторы, ESD/TVS-защиту и необходимость развязки."));
        }

        if (digitalInputs.Count > 0 && IsSame(digitalInputs.Voltage, "24V"))
        {
            issues.Add(Warning(
                "DIGITAL_INPUT_24V_REVIEW_REQUIRED",
                "Дискретные входы 24V требуют согласования уровня и защиты.",
                "Проверьте входной ток, фильтрацию, ограничение напряжения, необходимость развязки и совместимость с логикой STM32."));
        }

        if (relayOutputs.Count > 0)
        {
            issues.Add(Warning(
                "RELAY_OUTPUT_REVIEW_REQUIRED",
                "Релейные выходы требуют проверки тока нагрузки, защиты катушки и зазоров.",
                "Проверьте номинал контактов, тип нагрузки, flyback-защиту, пути утечки и зазоры перед производством."));
        }

        if (IsSame(spec.Environment, "industrial"))
        {
            issues.Add(Warning(
                "INDUSTRIAL_ENVIRONMENT_REVIEW_REQUIRED",
                "Промышленная среда требует проверки EMC, ESD и EFT.",
                "Проверьте входную защиту, защиту интерфейсов, фильтрацию, заземление и топологию платы перед производством."));
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
