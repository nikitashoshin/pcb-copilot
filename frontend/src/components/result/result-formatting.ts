import type { CheckResult } from "@/types/project";

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
    Warning: "Предупреждение",
    Error: "Ошибка",
  };

  return labels[severity] ?? severity;
}

export function statusText(status: string) {
  const labels: Record<string, string> = {
    Passed: "Пройдено",
    ReviewRequired: "Требует проверки",
    Failed: "Не пройдено",
    NotApplicable: "Не применимо",
  };

  return labels[status] ?? status;
}
