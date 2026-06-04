import type { CheckResult, MissingEngineeringParameter } from "@/types/project";

type MissingParameterDisplay = {
  title: string;
  whyItMatters: string;
  status: string;
  recommendation: string;
};

const missingParameterCopy: Record<string, Partial<MissingParameterDisplay>> = {
  relay_contact_load: {
    title: "Не задана нагрузка релейных контактов",
    whyItMatters:
      "В базовой форме MVP этот параметр не запрашивается. Перед выбором реле нужно уточнить напряжение, ток и характер нагрузки.",
    status: "Потребуется уточнить",
    recommendation: "Уточнить параметры нагрузки перед выбором реле, защиты контактов, дорожек и зазоров.",
  },
  relay_coil_current: {
    title: "Не задан ток катушки выбранного реле",
    whyItMatters:
      "Параметр появится после выбора конкретной модели реле. Нужен для расчёта линии 5 В и ключа управления.",
    status: "Потребуется уточнить",
    recommendation: "Выбрать модель реле и проверить ток катушки с запасом по питанию.",
  },
  rs485_isolation: {
    title: "Не принято решение по гальванической развязке RS-485",
    whyItMatters:
      "В базовой форме MVP это решение не запрашивается. Его нужно принять с учётом длины линии, земли объекта и требований помехоустойчивости.",
    status: "Требует решения",
    recommendation: "Оценить условия линии RS-485 и определить, нужна ли изолированная реализация интерфейса.",
  },
  temperature_range: {
    title: "Температурный диапазон не задан в базовом сценарии",
    whyItMatters:
      "Перед выбором компонентов нужно определить минимальную и максимальную рабочую температуру.",
    status: "Потребуется уточнить",
    recommendation: "Зафиксировать температурный диапазон и проверить компоненты по нему.",
  },
  digital_input_type: {
    title: "Тип дискретных входов не задан в базовом описании",
    whyItMatters:
      "В текущем сценарии MVP форма фиксирует только количество входов 24 В. Перед схемой входа нужно уточнить PNP/NPN, сухой контакт или активный сигнал.",
    status: "Потребуется уточнить",
    recommendation: "Уточнить тип внешнего сигнала и требования к изоляции входов.",
  },
  power_budget_currents: {
    title: "Токи потребления не заданы в базовом описании",
    whyItMatters:
      "В текущем сценарии MVP задаются линии питания, но не токи нагрузок. Эти значения потребуются для выбора DC/DC, LDO и тепловой проверки.",
    status: "Потребуется рассчитать",
    recommendation: "Рассчитать потребление реле, MCU, интерфейсов и индикации с инженерным запасом.",
  },
  enclosure_constraints: {
    title: "Корпус и механические ограничения не заданы в базовом сценарии",
    whyItMatters:
      "Текущая форма задаёт только размер платы. Перед размещением компонентов нужно уточнить корпус, крепёж и доступность разъёмов.",
    status: "Потребуется уточнить",
    recommendation: "Согласовать корпус, крепёжные отверстия и зоны доступа к SWD, индикации и клеммникам.",
  },
};

/**
 * Централизует отображение технических severity/status из API в русские UI-подписи
 * и CSS-классы. API-значения остаются английскими для стабильности контракта.
 */
export function severityClass(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "error") {
    return "severityError";
  }

  if (normalized === "warning") {
    return "severityWarning";
  }

  return "severityInfo";
}

export function statusLabel(check: CheckResult) {
  return `${severityLabel(check.severity)} / ${statusText(check.status)}`;
}

export function severityLabel(severity: string) {
  const labels: Record<string, string> = {
    Info: "Информация",
    Information: "Информация",
    Warning: "Предупреждение",
    Error: "Ошибка",
  };

  return labels[severity] ?? severity;
}

export function statusText(status: string) {
  const labels: Record<string, string> = {
    Passed: "Пройдено",
    ReviewRequired: "Требует проверки",
    RequiresReview: "Требует проверки",
    RequiresDecision: "Требует решения",
    Failed: "Не пройдено",
    NotApplicable: "Не применимо",
  };

  return labels[status] ?? status;
}

/**
 * Адаптирует backend-формулировки missingParameters под UX текущего MVP.
 * Некоторые параметры ещё нельзя ввести в форме, поэтому UI показывает их как данные
 * для следующего этапа детализации, а не как ошибку пользователя.
 */
export function missingParameterDisplay(
  parameter: MissingEngineeringParameter,
): MissingParameterDisplay {
  const override = missingParameterCopy[parameter.code] ?? {};

  return {
    title: override.title ?? parameter.title,
    whyItMatters: override.whyItMatters ?? parameter.whyItMatters,
    status: override.status ?? statusText(parameter.status),
    recommendation: override.recommendation ?? parameter.recommendation,
  };
}
