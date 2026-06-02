using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

/// <summary>
/// Формирует архитектурный черновик платы из исходных требований проекта.
/// Отвечает за выбор функциональных блоков из справочника, построение BoM,
/// инженерные предупреждения и первичные результаты проверок.
/// </summary>
public sealed class ArchitectureGenerator
{
    private readonly FunctionalBlockCatalog _catalog;

    public ArchitectureGenerator(FunctionalBlockCatalog catalog)
    {
        _catalog = catalog;
    }

    /// <summary>
    /// Возвращает детерминированный результат MVP-генерации без обращения к БД,
    /// AI API или внешним источникам.
    /// </summary>
    public ArchitectureResult Generate(ProjectSpec spec)
    {
        var selections = SelectFunctionalBlocks(spec);
        var warnings = new List<EngineeringWarning>();
        var functionalBlocks = BuildFunctionalBlockResults(selections, warnings);
        var bom = BuildBom(selections, warnings);

        AddScenarioWarnings(spec, warnings);

        return new ArchitectureResult
        {
            ProjectName = string.IsNullOrWhiteSpace(spec.ProjectName) ? "Untitled PCB Copilot Project" : spec.ProjectName,
            ProjectSpec = spec,
            FunctionalBlocks = functionalBlocks,
            Bom = bom,
            Warnings = DedupeWarnings(warnings),
            CheckResults = BuildCheckResults(spec, bom)
        };
    }

    private static List<BlockSelection> SelectFunctionalBlocks(ProjectSpec spec)
    {
        var selections = new List<BlockSelection>();
        var power = spec.Power ?? new PowerSpec();
        var mcu = spec.Mcu ?? new McuSpec();
        var digitalInputs = spec.DigitalInputs ?? new DigitalInputsSpec();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();

        void Add(string code, int quantity = 1)
        {
            // Добавляем только коды из MVP-библиотеки functional-blocks.json.
            // Если для сценария нужен новый узел, его сначала нужно описать в справочнике.
            if (quantity <= 0)
            {
                return;
            }

            var index = selections.FindIndex(selection => IsSame(selection.Code, code));
            if (index >= 0)
            {
                selections[index] = selections[index] with { Quantity = selections[index].Quantity + quantity };
                return;
            }

            selections.Add(new BlockSelection(code, quantity));
        }

        if (IsSame(power.Input, "24V DC"))
        {
            Add("input_power_24v");
        }

        if (power.Protection)
        {
            Add("reverse_polarity_protection");
        }

        if (ContainsValue(power.Outputs, "5V"))
        {
            Add("dc_dc_24_to_5");
        }

        if (ContainsValue(power.Outputs, "3.3V"))
        {
            Add("ldo_5_to_3v3");
        }

        if (IsSame(mcu.Family, "STM32"))
        {
            Add("stm32_core");
        }

        if (IsSame(mcu.Programming, "SWD"))
        {
            Add("swd_connector");
        }

        if (ContainsValue(spec.Interfaces, "RS-485"))
        {
            Add("rs485_interface");
        }

        if (digitalInputs.Count > 0 && IsSame(digitalInputs.Voltage, "24V"))
        {
            Add("digital_input_24v", digitalInputs.Count);
        }

        if (relayOutputs.Count > 0)
        {
            Add("relay_output", relayOutputs.Count);
        }

        if (spec.Indication.Count > 0)
        {
            Add("led_indication");
        }

        Add("connectors");

        return selections;
    }

    private List<FunctionalBlockResult> BuildFunctionalBlockResults(
        IEnumerable<BlockSelection> selections,
        List<EngineeringWarning> warnings)
    {
        var results = new List<FunctionalBlockResult>();

        foreach (var selection in selections)
        {
            var block = _catalog.Find(selection.Code);
            if (block is null)
            {
                // Отсутствующий блок не заменяется "похожим" автоматически:
                // инженер должен явно расширить библиотеку блоков и проверить состав узла.
                warnings.Add(new EngineeringWarning
                {
                    Code = "FUNCTIONAL_BLOCK_NOT_FOUND",
                    Severity = "Warning",
                    Message = $"Функциональный блок '{selection.Code}' отсутствует в functional-blocks.json.",
                    RelatedBlockCode = selection.Code
                });
                continue;
            }

            results.Add(new FunctionalBlockResult
            {
                Code = block.Code,
                Name = block.Name,
                Category = block.Category,
                Description = block.Description,
                Quantity = selection.Quantity
            });

            warnings.AddRange(block.DefaultWarnings);
        }

        return results;
    }

    private List<BomItem> BuildBom(IEnumerable<BlockSelection> selections, List<EngineeringWarning> warnings)
    {
        var bomByKey = new Dictionary<string, BomItem>(StringComparer.OrdinalIgnoreCase);

        foreach (var selection in selections)
        {
            var block = _catalog.Find(selection.Code);
            if (block is null)
            {
                continue;
            }

            foreach (var component in block.Components)
            {
                var quantity = component.Quantity * selection.Quantity;
                var key = string.Join("|", block.Code, component.Name, component.Type, component.Value, component.Package, component.Footprint, component.Comment);

                if (bomByKey.TryGetValue(key, out var existing))
                {
                    bomByKey[key] = existing with { Quantity = existing.Quantity + quantity };
                    continue;
                }

                bomByKey[key] = new BomItem
                {
                    Reference = $"BOM{bomByKey.Count + 1:D3}",
                    Name = component.Name,
                    Type = component.Type,
                    Value = component.Value,
                    Package = component.Package,
                    Footprint = component.Footprint,
                    Quantity = quantity,
                    Comment = component.Comment,
                    BlockCode = block.Code
                };
            }
        }

        foreach (var bomItem in bomByKey.Values.Where(item => string.IsNullOrWhiteSpace(item.Footprint)))
        {
            warnings.Add(new EngineeringWarning
            {
                Code = "COMPONENT_FOOTPRINT_MISSING",
                Severity = "Warning",
                Message = $"У компонента '{bomItem.Name}' из блока '{bomItem.BlockCode}' не задан footprint.",
                RelatedBlockCode = bomItem.BlockCode
            });
        }

        return bomByKey.Values.ToList();
    }

    private static void AddScenarioWarnings(ProjectSpec spec, List<EngineeringWarning> warnings)
    {
        if (IsSame(spec.Environment, "industrial"))
        {
            warnings.Add(new EngineeringWarning
            {
                Code = "CHECK_INDUSTRIAL_EMC",
                Severity = "Warning",
                Message = "Для промышленной среды проверьте требования EMC перед производством."
            });
        }

        // Результат MVP является архитектурным черновиком: он помогает начать работу,
        // но не снимает инженерную проверку схемы, BoM, footprint и защит.
        warnings.Add(new EngineeringWarning
        {
            Code = "ENGINEERING_REVIEW_REQUIRED",
            Severity = "Warning",
            Message = "Проект является черновой архитектурой и требует ручной проверки инженером-электронщиком."
        });
    }

    private static List<CheckResult> BuildCheckResults(ProjectSpec spec, IReadOnlyCollection<BomItem> bom)
    {
        var power = spec.Power ?? new PowerSpec();
        var mcu = spec.Mcu ?? new McuSpec();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();
        var usesStm32 = IsSame(mcu.Family, "STM32");
        var usesRs485 = ContainsValue(spec.Interfaces, "RS-485");
        var usesRelays = relayOutputs.Count > 0;
        var isIndustrial = IsSame(spec.Environment, "industrial");
        var allFootprintsPresent = bom.Count > 0 && bom.All(item => !string.IsNullOrWhiteSpace(item.Footprint));

        return new List<CheckResult>
        {
            new()
            {
                Code = "STM32_REQUIRES_3V3",
                Title = "STM32 требует питание 3.3V",
                Severity = usesStm32 && !ContainsValue(power.Outputs, "3.3V") ? "Error" : "Info",
                Status = !usesStm32 ? "NotApplicable" : ContainsValue(power.Outputs, "3.3V") ? "Passed" : "Failed",
                Message = !usesStm32
                    ? "STM32 не выбран."
                    : ContainsValue(power.Outputs, "3.3V")
                        ? "Линия питания 3.3V присутствует."
                        : "Для STM32 отсутствует линия питания 3.3V.",
                Recommendation = "Проверьте ток стабилизатора, развязывающие конденсаторы и выводы питания STM32.",
                RelatedBlockCode = "stm32_core"
            },
            new()
            {
                Code = "STM32_REQUIRES_SWD",
                Title = "STM32 требует SWD-разъём",
                Severity = usesStm32 && !IsSame(mcu.Programming, "SWD") ? "Error" : "Info",
                Status = !usesStm32 ? "NotApplicable" : IsSame(mcu.Programming, "SWD") ? "Passed" : "Failed",
                Message = !usesStm32
                    ? "STM32 не выбран."
                    : IsSame(mcu.Programming, "SWD")
                        ? "SWD-разъём для прошивки запрошен."
                        : "SWD-разъём для прошивки не запрошен.",
                Recommendation = "Оставьте доступными SWDIO, SWCLK, GND, опорное питание и при необходимости NRST.",
                RelatedBlockCode = "swd_connector"
            },
            new()
            {
                Code = "RS485_TERMINATION_REVIEW",
                Title = "RS-485 требует проверки терминатора",
                Severity = usesRs485 ? "Warning" : "Info",
                Status = usesRs485 ? "ReviewRequired" : "NotApplicable",
                Message = usesRs485
                    ? "Выбран RS-485; терминатор 120 Ом нужно проверить с учётом топологии шины."
                    : "RS-485 не выбран.",
                Recommendation = "Определите, должен ли терминатор быть установлен постоянно, опционально или через перемычку.",
                RelatedBlockCode = "rs485_interface"
            },
            new()
            {
                Code = "RELAY_LOAD_CURRENT_REVIEW",
                Title = "Релейные выходы требуют проверки нагрузки",
                Severity = usesRelays ? "Warning" : "Info",
                Status = usesRelays ? "ReviewRequired" : "NotApplicable",
                Message = usesRelays
                    ? "Выбраны релейные выходы; ток и напряжение нагрузки нужно проверить."
                    : "Релейные выходы не выбраны.",
                Recommendation = "Проверьте номинал контактов реле, тип нагрузки, защиту и требования к зазорам.",
                RelatedBlockCode = "relay_output"
            },
            new()
            {
                Code = "INDUSTRIAL_EMC_REVIEW",
                Title = "Промышленное применение требует проверки EMC",
                Severity = isIndustrial ? "Warning" : "Info",
                Status = isIndustrial ? "ReviewRequired" : "NotApplicable",
                Message = isIndustrial
                    ? "Выбрана промышленная среда; требования EMC, ESD и импульсной защиты нужно проверить."
                    : "Промышленная среда не выбрана.",
                Recommendation = "Проверьте входную защиту, защиту интерфейсов, фильтрацию, топологию и заземление."
            },
            new()
            {
                Code = "COMPONENTS_REQUIRE_FOOTPRINTS",
                Title = "Для компонентов должны быть footprint",
                Severity = allFootprintsPresent ? "Info" : "Error",
                Status = allFootprintsPresent ? "Passed" : "Failed",
                Message = allFootprintsPresent
                    ? "Во всех строках BoM заполнено поле footprint."
                    : "Минимум в одной строке BoM отсутствует footprint.",
                Recommendation = "Назначьте и проверьте KiCad footprint перед генерацией KiCad-проекта."
            }
        };
    }

    private static List<EngineeringWarning> DedupeWarnings(IEnumerable<EngineeringWarning> warnings)
    {
        return warnings
            .GroupBy(warning => warning.Code, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToList();
    }

    private static bool ContainsValue(IEnumerable<string>? values, string expected)
    {
        return values?.Any(value => IsSame(value, expected)) == true;
    }

    private static bool IsSame(string? actual, string expected)
    {
        return string.Equals(actual?.Trim(), expected, StringComparison.OrdinalIgnoreCase);
    }

    private sealed record BlockSelection(string Code, int Quantity);
}
