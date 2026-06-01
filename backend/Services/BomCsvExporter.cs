using System.Text;
using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

public sealed class BomCsvExporter
{
    private static readonly string[] Header =
    {
        "Reference",
        "Name",
        "Type",
        "Value",
        "Package",
        "Footprint",
        "Quantity",
        "BlockCode",
        "Comment"
    };

    public string Export(ArchitectureResult architecture)
    {
        var builder = new StringBuilder();
        AppendRow(builder, Header);

        foreach (var item in architecture.Bom)
        {
            AppendRow(builder, new[]
            {
                item.Reference,
                item.Name,
                item.Type,
                item.Value ?? string.Empty,
                item.Package ?? string.Empty,
                item.Footprint,
                item.Quantity.ToString(),
                item.BlockCode,
                item.Comment ?? string.Empty
            });
        }

        return builder.ToString();
    }

    private static void AppendRow(StringBuilder builder, IEnumerable<string> values)
    {
        builder.AppendLine(string.Join(",", values.Select(Escape)));
    }

    private static string Escape(string value)
    {
        if (value.Contains('"') || value.Contains(',') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }
}
