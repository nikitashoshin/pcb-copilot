using PcbCopilot.Backend.Models;

namespace PcbCopilot.Backend.Services;

/// <summary>
/// Формирует структурированный предварительный инженерный анализ проекта.
/// Сервис выявляет недостающие параметры, объясняет выбор блоков и приоритизирует риски,
/// но не заменяет расчёты, выбор компонентов и ручную проверку инженером.
/// </summary>
public sealed class EngineeringReviewGenerator
{
    /// <summary>
    /// Строит EngineeringReview на основе исходных требований и уже сформированной архитектуры.
    /// </summary>
    public EngineeringReview Generate(ProjectSpec spec, ArchitectureResult architecture)
    {
        // Это не финальный расчёт. Если исходных данных недостаточно, сервис должен
        // зафиксировать пробел или решение, а не выдумывать безопасное значение.
        return new EngineeringReview
        {
            MissingParameters = BuildMissingParameters(spec),
            BlockRationale = BuildBlockRationale(spec, architecture.FunctionalBlocks),
            RiskSummary = BuildRiskSummary(spec),
            PowerBudget = BuildPowerBudget(spec),
            GpioBudget = BuildGpioBudget(spec),
            EngineeringDecisions = BuildEngineeringDecisions(spec),
            NextSteps = BuildNextSteps()
        };
    }

    private static List<MissingEngineeringParameter> BuildMissingParameters(ProjectSpec spec)
    {
        var result = new List<MissingEngineeringParameter>();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();
        var digitalInputs = spec.DigitalInputs ?? new DigitalInputsSpec();
        var power = spec.Power ?? new PowerSpec();

        // ProjectSpec первого сценария пока не содержит этих полей. Раздел нужен,
        // чтобы инженер видел, какие данные необходимо уточнить до детализации схемы.
        if (relayOutputs.Count > 0)
        {
            result.Add(Missing(
                "relay_coil_current",
                "Ток катушки реле",
                "Нужен для расчёта нагрузки линии 5 В и выбора ключа управления реле.",
                "Не указан",
                "Уточнить ток катушки выбранного реле и заложить запас по питанию."));

            result.Add(Missing(
                "relay_contact_load",
                "Ток и напряжение нагрузки релейных контактов",
                "Влияет на выбор реле, ширину дорожек, зазоры и защиту контактов.",
                "Не указан",
                "Указать тип нагрузки, максимальный ток, напряжение и характер нагрузки."));
        }

        if (ContainsValue(spec.Interfaces, "RS-485"))
        {
            result.Add(Missing(
                "rs485_isolation",
                "Требование к гальванической развязке RS-485",
                "Для промышленной среды развязка может быть обязательной из-за разности потенциалов земли и помех.",
                "Требует решения",
                "Определить условия эксплуатации и решить, нужен ли изолированный RS-485."));
        }

        if (digitalInputs.Count > 0)
        {
            result.Add(Missing(
                "digital_input_type",
                "Тип дискретных входов",
                "Схема входа зависит от того, используется сухой контакт, активный 24 В сигнал, PNP/NPN-логика или другой тип подключения.",
                "Не указан",
                "Уточнить тип внешнего сигнала и требования к изоляции."));
        }

        if (!string.IsNullOrWhiteSpace(power.Input) || power.Outputs.Count > 0)
        {
            result.Add(Missing(
                "power_budget_currents",
                "Токи потребления линий 5 В и 3,3 В",
                "Без токов нагрузки нельзя корректно выбрать DC/DC и LDO.",
                "Не указаны",
                "Рассчитать потребление реле, MCU, интерфейсов, индикации и заложить запас."));
        }

        result.Add(Missing(
            "temperature_range",
            "Температурный диапазон эксплуатации",
            "Влияет на выбор компонентов, запас по мощности и надёжность.",
            "Не указан",
            "Указать минимальную и максимальную рабочую температуру."));

        result.Add(Missing(
            "enclosure_constraints",
            "Корпус и механические ограничения",
            "Влияет на расположение разъёмов, индикации, SWD и габариты платы.",
            "Не указаны",
            "Уточнить корпус, крепёжные отверстия и требования к доступности разъёмов."));

        return result;
    }

    private static List<BlockRationaleItem> BuildBlockRationale(
        ProjectSpec spec,
        IEnumerable<FunctionalBlockResult> functionalBlocks)
    {
        var digitalInputs = spec.DigitalInputs ?? new DigitalInputsSpec();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();

        return functionalBlocks
            .Select(block =>
            {
                var rationale = block.Code switch
                {
                    "input_power_24v" => (
                        "Добавлен, потому что входное питание указано как 24 В DC.",
                        "power.input = 24V DC"),
                    "reverse_polarity_protection" => (
                        "Добавлен, потому что для входного промышленного питания требуется защита от переполюсовки.",
                        "power.protection = true"),
                    "dc_dc_24_to_5" => (
                        "Добавлен, потому что в проекте требуется внутренняя линия 5 В.",
                        "power.outputs содержит 5V"),
                    "ldo_5_to_3v3" => (
                        "Добавлен, потому что STM32 и логика требуют питание 3,3 В.",
                        "power.outputs содержит 3.3V"),
                    "stm32_core" => (
                        "Добавлен, потому что пользователь указал семейство микроконтроллера STM32.",
                        "mcu.family = STM32"),
                    "swd_connector" => (
                        "Добавлен, потому что для STM32 выбран интерфейс программирования SWD.",
                        "mcu.programming = SWD"),
                    "rs485_interface" => (
                        "Добавлен, потому что пользователь указал интерфейс RS-485.",
                        "interfaces содержит RS-485"),
                    "digital_input_24v" => (
                        $"Добавлен, потому что указаны дискретные входы 24 В. Количество экземпляров соответствует числу входов: {digitalInputs.Count}.",
                        "digitalInputs.count / digitalInputs.voltage"),
                    "relay_output" => (
                        $"Добавлен, потому что указаны релейные выходы. Количество экземпляров соответствует числу выходов: {relayOutputs.Count}.",
                        "relayOutputs.count"),
                    "led_indication" => (
                        "Добавлен, потому что в проекте требуется индикация питания, статуса и связи.",
                        "indication"),
                    "connectors" => (
                        "Добавлен как обязательный блок подключения питания, интерфейсов и внешних сигналов.",
                        "внешние подключения проекта"),
                    _ => (
                        "Добавлен текущими правилами выбора функциональных блоков.",
                        "правила MVP-генерации")
                };

                return new BlockRationaleItem
                {
                    BlockCode = block.Code,
                    BlockName = block.Name,
                    Reason = rationale.Item1,
                    RelatedRequirement = rationale.Item2
                };
            })
            .ToList();
    }

    private static List<EngineeringRiskItem> BuildRiskSummary(ProjectSpec spec)
    {
        var result = new List<EngineeringRiskItem>();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();
        var digitalInputs = spec.DigitalInputs ?? new DigitalInputsSpec();
        var mcu = spec.Mcu ?? new McuSpec();
        var hasRelays = relayOutputs.Count > 0;
        var hasDigitalInputs = digitalInputs.Count > 0;
        var hasRs485 = ContainsValue(spec.Interfaces, "RS-485");

        if (hasRelays)
        {
            result.Add(Risk(
                "RELAY_CONTACT_LOAD_UNKNOWN",
                "Не определена нагрузка релейных контактов",
                "Critical",
                "Не указан ток, напряжение и характер нагрузки релейных контактов.",
                "Уточнить нагрузку до выбора реле, защиты контактов и ширины токовых цепей.",
                "relay_output"));

            result.Add(Risk(
                "RELAY_CLEARANCE_UNKNOWN",
                "Не определены зазоры релейных контактов",
                "Critical",
                "Требования к clearance и creepage зависят от напряжения, категории перенапряжения и условий эксплуатации.",
                "Определить требования к зазорам и путям утечки до размещения релейной части.",
                "relay_output"));

            result.Add(Risk(
                "POWER_5V_CURRENT_NOT_CALCULATED",
                "Не рассчитан ток линии 5 В",
                "Critical",
                "Линия 5 В может питать реле, интерфейсы и LDO 3,3 В, но ток нагрузки пока неизвестен.",
                "Рассчитать потребление и выбрать DC/DC с необходимым запасом.",
                "dc_dc_24_to_5"));
        }

        if (hasRs485)
        {
            result.Add(Risk(
                "RS485_ISOLATION_DECISION_REQUIRED",
                "Требуется решение по развязке RS-485",
                "RequiresDecision",
                "Для промышленной линии RS-485 может потребоваться гальваническая развязка.",
                "Оценить длину линии, разность потенциалов земли, помехи и требования объекта.",
                "rs485_interface"));
        }

        if (hasDigitalInputs)
        {
            result.Add(Risk(
                "DIGITAL_INPUT_ISOLATION_DECISION_REQUIRED",
                "Требуется решение по развязке дискретных входов",
                "RequiresDecision",
                "Не определено, нужна ли гальваническая развязка входных сигналов 24 В.",
                "Уточнить тип внешних сигналов и требования по безопасности и помехоустойчивости.",
                "digital_input_24v"));

            result.Add(Risk(
                "DIGITAL_INPUT_TYPE_REQUIRED",
                "Не определён тип дискретных входов",
                "RequiresDecision",
                "Схема согласования зависит от PNP/NPN-логики, сухого контакта или активного сигнала.",
                "Уточнить тип входа до выбора схемы согласования и защиты.",
                "digital_input_24v"));
        }

        if (IsSame(mcu.Family, "STM32"))
        {
            result.Add(Risk(
                "STM32_MODEL_REQUIRED",
                "Требуется выбрать конкретную модель STM32",
                "RequiresDecision",
                "Семейство STM32 не определяет количество GPIO, UART, корпус, память и допустимые режимы.",
                "Выбрать конкретную модель после проверки GPIO и peripheral budget.",
                "stm32_core"));
        }

        if (IsSame(mcu.Programming, "SWD"))
        {
            result.Add(Risk(
                "SWD_ACCESS_RECOMMENDED",
                "Проверить доступность SWD-разъёма",
                "Recommendation",
                "SWD должен оставаться доступным для прошивки и отладки после сборки устройства.",
                "Проверить размещение разъёма, доступ в корпусе и наличие NRST при необходимости.",
                "swd_connector"));
        }

        if (spec.Indication.Count > 0)
        {
            result.Add(Risk(
                "LED_VISIBILITY_RECOMMENDED",
                "Проверить видимость LED-индикации",
                "Recommendation",
                "Индикация должна быть видна в выбранном корпусе и не конфликтовать с механикой.",
                "Согласовать расположение светодиодов с конструкцией корпуса.",
                "led_indication"));
        }

        if (IsSame(spec.Environment, "industrial"))
        {
            result.Add(Risk(
                "INDUSTRIAL_EMC_RECOMMENDED",
                "Проверить требования EMC, ESD и EFT",
                "Recommendation",
                "Промышленная среда требует отдельной проверки помехоустойчивости и защиты интерфейсов.",
                "Определить применимые требования и учесть их в схеме и топологии платы."));
        }

        return result;
    }

    private static List<PowerBudgetItem> BuildPowerBudget(ProjectSpec spec)
    {
        var result = new List<PowerBudgetItem>();
        var power = spec.Power ?? new PowerSpec();
        var hasRelays = (spec.RelayOutputs?.Count ?? 0) > 0;
        var hasRs485 = ContainsValue(spec.Interfaces, "RS-485");
        var hasStm32 = IsSame(spec.Mcu?.Family, "STM32");

        if (IsSame(power.Input, "24V DC"))
        {
            result.Add(new PowerBudgetItem
            {
                Rail = "24 В",
                Loads = new List<string> { "вход питания", "внешняя промышленная среда", "питание DC/DC" },
                Status = "Требуется проверка защиты входа",
                Recommendation = "Проверить предохранитель, TVS, защиту от переполюсовки и импульсных помех."
            });
        }

        if (ContainsValue(power.Outputs, "5V"))
        {
            var loads = new List<string>();
            if (hasRelays)
            {
                loads.Add("реле");
            }

            if (hasRs485)
            {
                loads.Add("возможно RS-485");
            }

            if (ContainsValue(power.Outputs, "3.3V"))
            {
                loads.Add("питание LDO 3,3 В");
            }

            result.Add(new PowerBudgetItem
            {
                Rail = "5 В",
                Loads = loads,
                Status = "Требуется расчёт тока",
                Recommendation = "Уточнить ток катушек реле, ток интерфейсов и запас DC/DC."
            });
        }

        if (ContainsValue(power.Outputs, "3.3V"))
        {
            var loads = new List<string>();
            if (hasStm32)
            {
                loads.Add("STM32");
            }

            loads.Add("логика");
            if (spec.Indication.Count > 0)
            {
                loads.Add("LED-индикация");
            }

            loads.Add("управляющие сигналы");

            result.Add(new PowerBudgetItem
            {
                Rail = "3,3 В",
                Loads = loads,
                Status = "Требуется выбор конкретного STM32 и расчёт потребления",
                Recommendation = "Проверить ток LDO, тепловой режим и развязочные конденсаторы."
            });
        }

        return result;
    }

    private static List<GpioBudgetItem> BuildGpioBudget(ProjectSpec spec)
    {
        var result = new List<GpioBudgetItem>();
        var digitalInputs = spec.DigitalInputs ?? new DigitalInputsSpec();
        var relayOutputs = spec.RelayOutputs ?? new RelayOutputsSpec();
        var mcu = spec.Mcu ?? new McuSpec();

        if (ContainsValue(spec.Interfaces, "RS-485"))
        {
            result.Add(Gpio(
                "RS-485",
                new[] { "UART TX", "UART RX", "DE/RE control" },
                "3",
                "Может потребоваться отдельное управление направлением передачи."));
        }

        if (IsSame(mcu.Programming, "SWD"))
        {
            result.Add(Gpio(
                "SWD",
                new[] { "SWDIO", "SWCLK", "GND", "target voltage", "optional NRST" },
                "2 сигнальных GPIO",
                "SWD-пины должны быть доступны для прошивки и отладки."));
        }

        if (digitalInputs.Count > 0)
        {
            result.Add(Gpio(
                $"{digitalInputs.Count} дискретных входа",
                new[] { $"{digitalInputs.Count} GPIO input" },
                digitalInputs.Count.ToString(),
                "Требуется согласование уровня 24 В и защита входов."));
        }

        if (relayOutputs.Count > 0)
        {
            result.Add(Gpio(
                $"{relayOutputs.Count} релейных выхода",
                new[] { $"{relayOutputs.Count} GPIO output" },
                relayOutputs.Count.ToString(),
                "Требуются ключи управления реле и защита катушек."));
        }

        if (spec.Indication.Count > 0)
        {
            result.Add(Gpio(
                "LED-индикация",
                new[] { "power LED", "status LED", "communication LED" },
                "2–3",
                "Power LED может быть подключён без GPIO, status/communication обычно требуют GPIO."));
        }

        if (IsSame(mcu.Family, "STM32"))
        {
            result.Add(Gpio(
                "Итого",
                new[] { "GPIO", "UART", "SWD" },
                "примерно 11–13",
                "Перед выбором STM32 проверить количество GPIO, UART, корпус, питание и доступность SWD."));
        }

        return result;
    }

    private static List<EngineeringDecisionItem> BuildEngineeringDecisions(ProjectSpec spec)
    {
        var result = new List<EngineeringDecisionItem>();
        var hasRelays = (spec.RelayOutputs?.Count ?? 0) > 0;
        var hasDigitalInputs = (spec.DigitalInputs?.Count ?? 0) > 0;
        var hasRs485 = ContainsValue(spec.Interfaces, "RS-485");

        if (IsSame(spec.Mcu?.Family, "STM32"))
        {
            result.Add(Decision(
                "select_stm32_model",
                "Выбрать конкретную модель STM32",
                "От модели зависят GPIO, UART, память, корпус и электрические ограничения.",
                "Сопоставить peripheral budget с доступными моделями STM32."));
        }

        if (hasRelays)
        {
            result.Add(Decision(
                "confirm_relay_coil_current",
                "Уточнить ток катушек реле",
                "Ток катушек определяет нагрузку линии 5 В и выбор ключей управления.",
                "Выбрать реле и проверить суммарное потребление с запасом."));

            result.Add(Decision(
                "confirm_relay_contact_load",
                "Уточнить ток и напряжение нагрузки релейных контактов",
                "Параметры нагрузки влияют на реле, защиту, дорожки и зазоры.",
                "Зафиксировать максимальные параметры и характер нагрузки."));
        }

        if (hasRs485)
        {
            result.Add(Decision(
                "decide_rs485_isolation",
                "Решить, нужна ли гальваническая развязка RS-485",
                "Развязка зависит от условий линии и требований промышленного объекта.",
                "Оценить разность потенциалов земли, помехи и требования безопасности."));
        }

        if (hasDigitalInputs)
        {
            result.Add(Decision(
                "decide_digital_input_isolation",
                "Решить, нужна ли гальваническая развязка дискретных входов",
                "Развязка влияет на безопасность, помехоустойчивость и стоимость входного канала.",
                "Определить требования объекта и тип внешних сигналов."));

            result.Add(Decision(
                "confirm_digital_input_type",
                "Уточнить тип дискретных входов",
                "Схема согласования зависит от PNP/NPN-логики, сухого контакта или активного сигнала.",
                "Зафиксировать тип подключения до разработки схемы входа."));
        }

        if (IsSame(spec.Environment, "industrial"))
        {
            result.Add(Decision(
                "define_emc_requirements",
                "Определить требования EMC/ESD/EFT",
                "Требования влияют на защиту, фильтрацию, заземление и топологию платы.",
                "Определить применимые испытания и уровни воздействия."));
        }

        result.Add(Decision(
            "select_connectors",
            "Выбрать тип разъёмов и клеммников",
            "Разъёмы влияют на ток, шаг, механику корпуса и удобство монтажа.",
            "Согласовать разъёмы с проводами, корпусом и условиями эксплуатации."));

        result.Add(Decision(
            "confirm_temperature_range",
            "Уточнить температурный диапазон эксплуатации",
            "Температура влияет на компоненты, тепловой запас и надёжность.",
            "Зафиксировать минимальную и максимальную рабочую температуру."));

        result.Add(Decision(
            "confirm_enclosure_constraints",
            "Проверить механические ограничения корпуса",
            "Корпус определяет доступность разъёмов, SWD, индикации и крепления платы.",
            "Согласовать габариты, отверстия и зоны доступа до размещения компонентов."));

        return result;
    }

    private static List<EngineeringNextStep> BuildNextSteps()
    {
        return new List<EngineeringNextStep>
        {
            Step(1, "Уточнить недостающие параметры", "Зафиксировать данные, без которых нельзя безопасно выбрать компоненты и топологию."),
            Step(2, "Выбрать конкретные компоненты", "Определить STM32, реле, преобразователи, интерфейсные микросхемы и защиты."),
            Step(3, "Рассчитать линии питания 5 В и 3,3 В", "Проверить токи, запас, тепловой режим и развязочные конденсаторы."),
            Step(4, "Проверить GPIO-бюджет и выбрать STM32", "Сопоставить GPIO, UART, SWD, корпус и доступную периферию."),
            Step(5, "Принять решение по изоляции RS-485 и входов", "Зафиксировать требования по безопасности и помехоустойчивости."),
            Step(6, "Подготовить принципиальную схему в KiCad", "Перенести выбранную архитектуру в проверяемую схему."),
            Step(7, "Назначить symbols и footprints", "Проверить соответствие корпусов, выводов и посадочных мест."),
            Step(8, "Проверить ERC", "Устранить электрические ошибки и спорные соединения схемы."),
            Step(9, "Перейти к размещению компонентов на плате", "Учесть механику, токовые цепи, интерфейсы и зоны защиты."),
            Step(10, "Проверить DRC, зазоры, тепловой режим и EMC", "Выполнить финальные проверки до подготовки производственных файлов.")
        };
    }

    private static MissingEngineeringParameter Missing(
        string code,
        string title,
        string whyItMatters,
        string status,
        string recommendation)
    {
        return new MissingEngineeringParameter
        {
            Code = code,
            Title = title,
            WhyItMatters = whyItMatters,
            Status = status,
            Recommendation = recommendation
        };
    }

    private static EngineeringRiskItem Risk(
        string code,
        string title,
        string priority,
        string message,
        string recommendation,
        string? relatedBlockCode = null)
    {
        return new EngineeringRiskItem
        {
            Code = code,
            Title = title,
            Priority = priority,
            Message = message,
            Recommendation = recommendation,
            RelatedBlockCode = relatedBlockCode
        };
    }

    private static GpioBudgetItem Gpio(
        string function,
        IEnumerable<string> requiredResources,
        string estimatedPins,
        string notes)
    {
        return new GpioBudgetItem
        {
            Function = function,
            RequiredResources = requiredResources.ToList(),
            EstimatedPins = estimatedPins,
            Notes = notes
        };
    }

    private static EngineeringDecisionItem Decision(
        string code,
        string title,
        string whyItMatters,
        string recommendation)
    {
        return new EngineeringDecisionItem
        {
            Code = code,
            Title = title,
            WhyItMatters = whyItMatters,
            Recommendation = recommendation
        };
    }

    private static EngineeringNextStep Step(int order, string title, string description)
    {
        return new EngineeringNextStep
        {
            Order = order,
            Title = title,
            Description = description
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
