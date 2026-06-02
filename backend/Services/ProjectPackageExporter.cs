using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

/// <summary>
/// Собирает ZIP-пакет инженерного черновика проекта.
/// Пакет объединяет исходные требования, BoM, Markdown-отчёт и draft-заготовки KiCad,
/// но не создаёт production-ready схему или разведённую плату.
/// </summary>
public sealed class ProjectPackageExporter
{
    private const string ProjectFileName = "industrial-stm32-controller";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true
    };

    private readonly BomCsvExporter bomCsvExporter;
    private readonly MarkdownReportGenerator markdownReportGenerator;

    public ProjectPackageExporter(BomCsvExporter bomCsvExporter, MarkdownReportGenerator markdownReportGenerator)
    {
        this.bomCsvExporter = bomCsvExporter;
        this.markdownReportGenerator = markdownReportGenerator;
    }

    /// <summary>
    /// Возвращает ZIP как массив байтов, чтобы endpoint мог отдать его как application/zip.
    /// </summary>
    public byte[] Export(ArchitectureResult architecture)
    {
        using var stream = new MemoryStream();

        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            // ZIP-пакет собирает все артефакты черновика вместе:
            // исходные требования, BoM, инженерный отчёт и стартовые KiCad-заготовки.
            var projectSpec = architecture.ProjectSpec ?? new ProjectSpec
            {
                ProjectName = architecture.ProjectName
            };

            WriteTextEntry(
                archive,
                "project-spec.json",
                JsonSerializer.Serialize(projectSpec, JsonOptions),
                emitBom: false);

            WriteTextEntry(
                archive,
                "bom.csv",
                bomCsvExporter.Export(architecture),
                emitBom: true);

            WriteTextEntry(
                archive,
                "engineering-report.md",
                markdownReportGenerator.Generate(architecture),
                emitBom: false);

            // KiCad-файлы пока являются draft-заготовками: они задают структуру проекта
            // и контекст для ручной работы, но не являются готовой схемой или платой.
            WriteTextEntry(
                archive,
                "kicad/README-KiCad.md",
                BuildKiCadReadme(),
                emitBom: false);

            WriteTextEntry(
                archive,
                $"kicad/{ProjectFileName}.kicad_pro",
                BuildKiCadProject(architecture),
                emitBom: false);

            WriteTextEntry(
                archive,
                $"kicad/{ProjectFileName}.kicad_sch",
                BuildKiCadSchematic(architecture),
                emitBom: false);

            WriteTextEntry(
                archive,
                $"kicad/{ProjectFileName}.kicad_pcb",
                BuildKiCadPcb(architecture),
                emitBom: false);
        }

        return stream.ToArray();
    }

    private static void WriteTextEntry(ZipArchive archive, string entryName, string content, bool emitBom)
    {
        var entry = archive.CreateEntry(entryName, CompressionLevel.Fastest);
        var encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: emitBom);

        using var writer = new StreamWriter(entry.Open(), encoding);
        writer.Write(content);
    }

    private static string BuildKiCadReadme()
    {
        return """
            # KiCad-заготовки PCB Copilot

            Эти файлы являются инженерными черновыми заготовками для MVP PCB Copilot.

            ZIP-пакет не содержит готовую принципиальную схему, готовую печатную плату, трассировку или проверенный производственный проект. Файлы KiCad нужны только как стартовая структура проекта и место для дальнейшей ручной работы инженера.

            Перед использованием в реальном устройстве инженер должен вручную проверить:

            - выбранные компоненты и их допустимые режимы работы;
            - footprint для каждого компонента;
            - питание 24 В, преобразование в 5 В и 3.3 В;
            - защиту от переполюсовки, импульсных помех, ESD и EFT;
            - RS-485 терминатор, biasing, защиту линии и необходимость развязки;
            - релейные выходы, ток нагрузки, защиту катушек и зазоры;
            - габариты платы, монтажные ограничения, clearance/creepage;
            - EMC-требования для промышленной среды;
            - ручную расстановку компонентов и трассировку.

            Заготовки не предназначены для производства без полной инженерной доработки и проверки.
            """;
    }

    private static string BuildKiCadProject(ArchitectureResult architecture)
    {
        var projectName = string.IsNullOrWhiteSpace(architecture.ProjectName)
            ? "Industrial STM32 Controller"
            : architecture.ProjectName;

        return $$"""
            {
              "meta": {
                "filename": "{{ProjectFileName}}.kicad_pro",
                "version": 1
              },
              "project": {
                "name": "{{EscapeJson(projectName)}}",
                "description": "PCB Copilot MVP engineering draft. Manual engineering review required before production.",
                "comment": "Placeholder KiCad project: no production schematic, placement, routing or verified board is generated."
              }
            }
            """;
    }

    private static string BuildKiCadSchematic(ArchitectureResult architecture)
    {
        var title = string.IsNullOrWhiteSpace(architecture.ProjectName)
            ? "Industrial STM32 Controller"
            : architecture.ProjectName;

        var blockLines = architecture.FunctionalBlocks.Count == 0
            ? "Functional blocks are not selected."
            : string.Join(
                "\n",
                architecture.FunctionalBlocks.Select(block =>
                    $"{block.Code} x{block.Quantity} - {block.Name}"));

        var draftNote = "PCB Copilot draft schematic placeholder. Manual engineering work is required before production.";
        var blocksNote = $"Functional blocks:\n{blockLines}";

        return $$"""
            (kicad_sch (version 20230121) (generator "PCB Copilot MVP")
              (uuid "{{Guid.NewGuid()}}")
              (paper "A4")
              (title_block
                (title "{{EscapeKiCadText(title)}}")
                (company "PCB Copilot MVP")
                (comment 1 "Engineering draft. Not production-ready.")
              )
              (text "{{EscapeKiCadText(draftNote)}}" (at 20 20 0)
                (effects (font (size 1.27 1.27)) (justify left))
              )
              (text "{{EscapeKiCadText(blocksNote)}}" (at 20 35 0)
                (effects (font (size 1.27 1.27)) (justify left))
              )
            )
            """;
    }

    private static string BuildKiCadPcb(ArchitectureResult architecture)
    {
        var width = PositiveOrDefault(architecture.ProjectSpec?.Board?.WidthMm, 80m);
        var height = PositiveOrDefault(architecture.ProjectSpec?.Board?.HeightMm, 60m);
        var layers = architecture.ProjectSpec?.Board?.Layers >= 4 ? 4 : 2;
        var copperLayers = layers == 4
            ? """
                (0 "F.Cu" signal)
                (1 "In1.Cu" signal)
                (2 "In2.Cu" signal)
                (31 "B.Cu" signal)
              """
            : """
                (0 "F.Cu" signal)
                (31 "B.Cu" signal)
              """;

        return $$"""
            (kicad_pcb (version 20221018) (generator "PCB Copilot MVP")
              (general (thickness 1.6))
              (paper "A4")
              (layers
            {{copperLayers}}
                (32 "B.Adhes" user)
                (33 "F.Adhes" user)
                (34 "B.Paste" user)
                (35 "F.Paste" user)
                (36 "B.SilkS" user)
                (37 "F.SilkS" user)
                (38 "B.Mask" user)
                (39 "F.Mask" user)
                (44 "Edge.Cuts" user)
                (45 "Margin" user)
                (46 "B.CrtYd" user)
                (47 "F.CrtYd" user)
                (48 "B.Fab" user)
                (49 "F.Fab" user)
                (50 "User.1" user)
                (51 "User.2" user)
                (52 "User.3" user)
                (53 "User.4" user)
                (54 "User.5" user)
                (55 "User.6" user)
                (56 "User.7" user)
                (57 "User.8" user)
                (58 "User.9" user)
              )
              (gr_rect
                (start 0 0)
                (end {{FormatNumber(width)}} {{FormatNumber(height)}})
                (stroke (width 0.10) (type solid))
                (fill none)
                (layer "Edge.Cuts")
                (uuid "{{Guid.NewGuid()}}")
              )
              (gr_text "PCB Copilot draft board outline only. Manual placement and routing required."
                (at 5 5 0)
                (layer "Cmts.User")
                (uuid "{{Guid.NewGuid()}}")
                (effects (font (size 1.2 1.2) (thickness 0.15)) (justify left))
              )
              (gr_text "Not production-ready. Verify footprints, clearances, EMC, ESD, EFT and power protection."
                (at 5 10 0)
                (layer "Cmts.User")
                (uuid "{{Guid.NewGuid()}}")
                (effects (font (size 1.2 1.2) (thickness 0.15)) (justify left))
              )
            )
            """;
    }

    private static decimal PositiveOrDefault(decimal? value, decimal defaultValue)
    {
        return value is > 0 ? value.Value : defaultValue;
    }

    private static string FormatNumber(decimal value)
    {
        return value.ToString("0.###", CultureInfo.InvariantCulture);
    }

    private static string EscapeKiCadText(string value)
    {
        return value
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\r\n", "\\n")
            .Replace("\n", "\\n")
            .Replace("\r", "\\n");
    }

    private static string EscapeJson(string value)
    {
        return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }
}
