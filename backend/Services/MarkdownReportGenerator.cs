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

        AppendFunctionalBlocks(builder, architecture);
        AppendBom(builder, architecture);
        AppendWarnings(builder, architecture);
        AppendCheckResults(builder, architecture);
        AppendConclusion(builder, architecture);

        return builder.ToString();
    }

    private static void AppendFunctionalBlocks(StringBuilder builder, ArchitectureResult architecture)
    {
        builder.AppendLine("## Functional Blocks");
        builder.AppendLine();

        if (architecture.FunctionalBlocks.Count == 0)
        {
            builder.AppendLine("Functional blocks are not selected.");
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
        builder.AppendLine("| Reference | Name | Type | Value | Package | Footprint | Quantity | BlockCode | Comment |");
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
        builder.AppendLine("## Engineering Warnings");
        builder.AppendLine();

        if (architecture.Warnings.Count == 0)
        {
            builder.AppendLine("No engineering warnings were generated.");
            builder.AppendLine();
            return;
        }

        foreach (var warning in architecture.Warnings)
        {
            builder.AppendLine($"- **{EscapeInline(warning.Severity)}** `{warning.Code}`: {EscapeInline(warning.Message)}");
        }

        builder.AppendLine();
    }

    private static void AppendCheckResults(StringBuilder builder, ArchitectureResult architecture)
    {
        builder.AppendLine("## Check Results");
        builder.AppendLine();
        builder.AppendLine("| Code | Title | Severity | Status | Message | Recommendation |");
        builder.AppendLine("| --- | --- | --- | --- | --- | --- |");

        foreach (var check in architecture.CheckResults)
        {
            builder.AppendLine(
                $"| {Cell(check.Code)} | {Cell(check.Title)} | {Cell(check.Severity)} | {Cell(check.Status)} | {Cell(check.Message)} | {Cell(check.Recommendation)} |");
        }

        builder.AppendLine();
    }

    private static void AppendConclusion(StringBuilder builder, ArchitectureResult architecture)
    {
        var reviewRequired = architecture.Warnings.Count > 0 ||
            architecture.CheckResults.Any(check =>
                string.Equals(check.Severity, "Warning", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(check.Severity, "Error", StringComparison.OrdinalIgnoreCase));

        builder.AppendLine("## Conclusion");
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

    private static string EscapeInline(string? value)
    {
        return (value ?? string.Empty)
            .Replace("|", "\\|")
            .Replace("\r", " ")
            .Replace("\n", " ")
            .Trim();
    }
}
