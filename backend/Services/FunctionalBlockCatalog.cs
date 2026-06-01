using System.Text.Json;
using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

public sealed class FunctionalBlockCatalog
{
    private readonly Dictionary<string, FunctionalBlockDefinition> _blocks;

    public FunctionalBlockCatalog(IHostEnvironment environment)
    {
        var filePath = Path.Combine(environment.ContentRootPath, "Data", "functional-blocks.json");

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("Functional blocks catalog was not found.", filePath);
        }

        var json = File.ReadAllText(filePath);
        var blocks = JsonSerializer.Deserialize<List<FunctionalBlockDefinition>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? new List<FunctionalBlockDefinition>();

        _blocks = blocks.ToDictionary(block => block.Code, StringComparer.OrdinalIgnoreCase);
    }

    public FunctionalBlockDefinition? Find(string code)
    {
        return _blocks.TryGetValue(code, out var block) ? block : null;
    }
}
