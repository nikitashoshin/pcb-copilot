import type { ArchitectureResult } from "@/types/project";

const RESULT_STORAGE_KEY = "pcb-copilot.architecture-result";

export function saveArchitectureResult(result: ArchitectureResult) {
  // В MVP результат временно хранится в sessionStorage между /new-project и /result.
  // Это не заменяет будущую БД и не предназначено для долговременного хранения проектов.
  window.sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function loadArchitectureResult(): ArchitectureResult | null {
  const rawValue = window.sessionStorage.getItem(RESULT_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as ArchitectureResult;
  } catch {
    window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
    return null;
  }
}
