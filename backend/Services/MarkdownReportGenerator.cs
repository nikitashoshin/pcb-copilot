using System.Text;
using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

public sealed class MarkdownReportGenerator
{
    private const string Disclaimer =
        "Сгенерированный проект является инженерным черновиком и требует обязательной проверки инженером-электронщиком перед производством.";

    public string Generate(ArchitectureResult architecture)
    {
        var builder = new StringBuilder();

        builder.AppendLine($"# {EscapeInline(architecture.ProjectName)}");
        builder.AppendLine();
        builder.AppendLine($"> {Disclaimer}");
        builder.AppendLine();

        AppendRequirements(builder, architecture.ProjectSpec);
        AppendFunctionalBlocks(builder, architecture);
        AppendBom(builder, architecture);
        AppendWarnings(builder, architecture);
        AppendCheckResults(builder, architecture);
        AppendConclusion(builder, architecture);

        return builder.ToString();
    }

    private static void AppendRequirements(StringBuilder builder, ProjectSpec? spec)
    {
        builder.AppendLine("## Исходные требования");
        builder.AppendLine();

        if (spec is null)
        {
            builder.AppendLine("Исходные требования не сохранены в результате.");
            builder.AppendLine();
            return;
        }

        var power = spec.Power ?? new PowerSpec();
        var mcu = spec.Mcu ?? new McuSpec();
        var digitalInputs = spec.DigitalInputs ?? new DigitalInputsSpec();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();
        var board = spec.Board ?? new BoardSpec();

        builder.AppendLine($"- Название проекта: {Cell(spec.ProjectName)}");
        builder.AppendLine($"- Тип устройства: {Cell(spec.DeviceType)}");
        builder.AppendLine($"- Входное питание: {Cell(power.Input)}");
        builder.AppendLine($"- Внутренние линии питания: {Cell(string.Join(", ", power.Outputs))}");
        builder.AppendLine($"- Защита питания: {(power.Protection ? "включена" : "выключена")}");
        builder.AppendLine($"- Микроконтроллер: {Cell(mcu.Family)}");
        builder.AppendLine($"- Интерфейс программирования: {Cell(mcu.Programming)}");
        builder.AppendLine($"- Интерфейсы: {Cell(string.Join(", ", spec.Interfaces))}");
        builder.AppendLine($"- Дискретные входы: {digitalInputs.Count} x {Cell(digitalInputs.Voltage)}");
        builder.AppendLine($"- Релейные выходы: {relayOutputs.Count}");
        builder.AppendLine($"- Индикация: {Cell(string.Join(", ", spec.Indication))}");
        builder.AppendLine($"- Плата: {board.WidthMm} x {board.HeightMm} мм, слоёв: {board.Layers}");
        builder.AppendLine($"- Среда применения: {Cell(spec.Environment)}");
        builder.AppendLine();
    }

    private static void AppendFunctionalBlocks(StringBuilder builder, ArchitectureResult architecture)
    {
        builder.AppendLine("## Функциональные блоки");
        builder.AppendLine();

        if (architecture.FunctionalBlocks.Count == 0)
        {
            builder.AppendLine("Функциональные блоки не выбраны.");
            builder.AppendLine();
            return;
        }

        foreach (var block in architecture.FunctionalBlocks)
        {
            builder.AppendLine($"- `{block.Code}` x{block.Quantity} - {EscapeInline(block.Name)} ({EscapeInline(block.Category)})");
        }

        builder.AppendLine();
    }

    private static void AppendBom(StringBuilder builder, ArchitectureResult architecture)
    {
        builder.AppendLine("## BoM");
        builder.AppendLine();
        builder.AppendLine("| Поз. | Наименование | Тип | Номинал | Корпус | Footprint | Кол-во | BlockCode | Комментарий |");
        builder.AppendLine("| --- | --- | --- | --- | --- | --- | ---: | --- | --- |");

        foreach (var item in architecture.Bom)
        {
            builder.AppendLine(
                $"| {Cell(item.Reference)} | {Cell(item.Name)} | {Cell(item.Type)} | {Cell(item.Value)} | {Cell(item.Package)} | {Cell(item.Footprint)} | {item.Quantity} | {Cell(item.BlockCode)} | {Cell(item.Comment)} |");
        }

        builder.AppendLine();
    }

    private static void AppendWarnings(StringBuilder builder, ArchitectureResult architecture)
    {
        builder.AppendLine("## Инженерные предупреждения");
        builder.AppendLine();

        if (architecture.Warnings.Count == 0)
        {
            builder.AppendLine("Инженерные предупреждения не сформированы.");
            builder.AppendLine();
            return;
        }

        foreach (var warning in architecture.Warnings)
        {
            builder.AppendLine($"- **{SeverityCell(warning.Severity)}** `{warning.Code}`: {EscapeInline(warning.Message)}");
        }

        builder.AppendLine();
    }

    private static void AppendCheckResults(StringBuilder builder, ArchitectureResult architecture)
    {
        builder.AppendLine("## Результаты проверок");
        builder.AppendLine();
        builder.AppendLine("| Код | Проверка | Уровень | Статус | Сообщение | Рекомендация |");
        builder.AppendLine("| --- | --- | --- | --- | --- | --- |");

        foreach (var check in architecture.CheckResults)
        {
            builder.AppendLine(
                $"| {Cell(check.Code)} | {Cell(check.Title)} | {SeverityCell(check.Severity)} | {StatusCell(check.Status)} | {Cell(check.Message)} | {Cell(check.Recommendation)} |");
        }

        builder.AppendLine();
    }

    private static void AppendConclusion(StringBuilder builder, ArchitectureResult architecture)
    {
        var reviewRequired = architecture.Warnings.Count > 0 ||
            architecture.CheckResults.Any(check =>
                string.Equals(check.Severity, "Warning", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(check.Severity, "Error", StringComparison.OrdinalIgnoreCase));

        builder.AppendLine("## Заключение");
        builder.AppendLine();
        builder.AppendLine(
            reviewRequired
                ? "Проект сформирован как предварительный инженерный черновик. Перед производством необходимо проверить предупреждения, результаты проверок, выбранные компоненты, footprint и применимость блоков к реальному устройству."
                : "Проект сформирован как предварительный инженерный черновик. Даже при отсутствии критических замечаний требуется ручная инженерная проверка перед производством.");
    }

    private static string Cell(string? value)
    {
        return EscapeInline(string.IsNullOrWhiteSpace(value) ? "-" : value);
    }

    private static string SeverityCell(string? severity)
    {
        return severity switch
        {
            "Info" => "Информация",
            "Warning" => "Предупреждение",
            "Error" => "Ошибка",
            _ => Cell(severity)
        };
    }

    private static string StatusCell(string? status)
    {
        return status switch
        {
            "Passed" => "Пройдено",
            "ReviewRequired" => "Требует проверки",
            "Failed" => "Не пройдено",
            "NotApplicable" => "Не применимо",
            _ => Cell(status)
        };
    }

    private static string EscapeInline(string? value)
    {
        return (value ?? string.Empty)
            .Replace("|", "\\|")
            .Replace("\r", " ")
            .Replace("\n", " ")
            .Trim();
    }
}
