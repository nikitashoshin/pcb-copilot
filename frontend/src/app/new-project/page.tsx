"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateArchitecture, validateProjectSpec } from "@/lib/api";
import { saveArchitectureResult } from "@/lib/result-storage";
import type { ProjectSpec, ValidationIssue } from "@/types/project";

type ProjectFormState = {
  projectName: string;
  inputVoltage: string;
  mcuFamily: string;
  interfaces: string;
  digitalInputsCount: number;
  relayOutputsCount: number;
  boardWidthMm: number;
  boardHeightMm: number;
  layers: number;
};

type FixedParameter = {
  label: string;
  value: string;
};

type ConfigSectionProps = {
  title: string;
  children: ReactNode;
};

type TextFieldProps = {
  label: string;
  value: string | number;
  type?: "text" | "number";
  min?: number;
  onChange: (value: string) => void;
};

const initialFormState: ProjectFormState = {
  projectName: "Промышленный контроллер STM32",
  inputVoltage: "24V DC",
  mcuFamily: "STM32",
  interfaces: "RS-485",
  digitalInputsCount: 4,
  relayOutputsCount: 2,
  boardWidthMm: 80,
  boardHeightMm: 60,
  layers: 2,
};

const notClarifiedItems = [
  "ток катушки выбранного реле",
  "напряжение, ток и характер нагрузки релейных контактов",
  "нужна ли гальваническая развязка RS-485",
  "тип дискретных входов: сухой контакт, активный 24 В, PNP/NPN",
  "токи потребления линий 5 В и 3,3 В",
  "температурный диапазон",
  "требования к корпусу, креплению и механике",
  "требования EMC, ESD и EFT",
];

const baseFixedParameters: FixedParameter[] = [
  { label: "Тип устройства", value: "Промышленный контроллер" },
  { label: "Линии питания", value: "5 В, 3,3 В" },
  { label: "Защита питания", value: "Включена" },
  { label: "Программирование", value: "SWD" },
  { label: "Уровень входов", value: "24 В" },
  { label: "Среда", value: "Промышленная" },
];

function ConfigSection({ title, children }: ConfigSectionProps) {
  return (
    <section className="configPanel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function TextField({ label, value, type = "text", min, onChange }: TextFieldProps) {
  return (
    <label className="configField">
      <span>{label}</span>
      <input
        min={min}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FixedParameterRows({ items }: { items: FixedParameter[] }) {
  return (
    <div className="fixedParameterRows">
      {items.map((item) => (
        <div className="fixedParameterRow" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <em>фиксировано</em>
        </div>
      ))}
    </div>
  );
}

function inputCountLabel(count: number) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return "вход";
  }

  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return "входа";
  }

  return "входов";
}

/**
 * Страница первого MVP-сценария: собирает исходные требования,
 * запускает backend-валидацию и сохраняет результат генерации для /result.
 */
export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);

  function updateField<Key extends keyof ProjectFormState>(
    key: Key,
    value: ProjectFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toProjectSpec(): ProjectSpec {
    const interfaces = form.interfaces
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    return {
      projectName: form.projectName,
      deviceType: "industrial_controller",
      power: {
        input: form.inputVoltage,
        outputs: ["5V", "3.3V"],
        protection: true,
      },
      mcu: {
        family: form.mcuFamily,
        programming: "SWD",
      },
      interfaces,
      digitalInputs: {
        count: form.digitalInputsCount,
        voltage: "24V",
      },
      relayOutputs: {
        count: form.relayOutputsCount,
      },
      indication: ["power", "status", "communication"],
      board: {
        widthMm: form.boardWidthMm,
        heightMm: form.boardHeightMm,
        layers: form.layers,
      },
      environment: "industrial",
    };
  }

  function severityLabel(severity: string) {
    const labels: Record<string, string> = {
      Info: "Информация",
      Warning: "Предупреждение",
      Error: "Ошибка",
    };

    return labels[severity] ?? severity;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setValidationIssues([]);

    try {
      const spec = toProjectSpec();
      // Основной пользовательский сценарий: сначала валидируем требования,
      // затем генерируем архитектурный черновик и переходим к просмотру результата.
      const validation = await validateProjectSpec(spec);
      setValidationIssues(validation.issues);

      if (!validation.isValid) {
        setError("Исправьте ошибки в исходных требованиях перед формированием архитектуры.");
        return;
      }

      const result = await generateArchitecture(spec);
      saveArchitectureResult(result);
      router.push("/result");
    } catch {
      setError("Серверная часть недоступна. Проверьте, что .NET API запущен на http://127.0.0.1:5065.");
    } finally {
      setIsLoading(false);
    }
  }

  const boardSize = `${form.boardWidthMm} x ${form.boardHeightMm} мм`;
  const ioSummary = `${form.digitalInputsCount} ${inputCountLabel(
    form.digitalInputsCount,
  )} / ${form.relayOutputsCount} реле`;
  const submitLabel = isLoading ? "Проверка и формирование..." : "Сформировать архитектуру";

  return (
    <section className="pageShell newProjectShell">
      <form className="projectConfigurator" id="new-project-form" onSubmit={handleSubmit}>
        <header className="configuratorHeader">
          <div>
            <p className="eyebrow">Первый сценарий MVP</p>
            <h1>Создание проекта</h1>
          </div>
          <span>Промышленный контроллер</span>
        </header>

        <div className="configuratorLayout">
          <div className="configuratorMain">
            <ConfigSection title="Основное">
              <div className="configFieldGrid">
                <TextField
                  label="Название проекта"
                  value={form.projectName}
                  onChange={(value) => updateField("projectName", value)}
                />
                <FixedParameterRows items={[baseFixedParameters[0]]} />
              </div>
            </ConfigSection>

            <ConfigSection title="Питание">
              <div className="configFieldGrid">
                <TextField
                  label="Входное питание"
                  value={form.inputVoltage}
                  onChange={(value) => updateField("inputVoltage", value)}
                />
                <FixedParameterRows items={baseFixedParameters.slice(1, 3)} />
              </div>
            </ConfigSection>

            <ConfigSection title="Микроконтроллер и связь">
              <div className="configFieldGrid">
                <TextField
                  label="Семейство микроконтроллера"
                  value={form.mcuFamily}
                  onChange={(value) => updateField("mcuFamily", value)}
                />
                <TextField
                  label="Интерфейсы"
                  value={form.interfaces}
                  onChange={(value) => updateField("interfaces", value)}
                />
              </div>
              <FixedParameterRows items={[baseFixedParameters[3]]} />
            </ConfigSection>

            <ConfigSection title="Вводы и выходы">
              <div className="configFieldGrid">
                <TextField
                  label="Дискретные входы"
                  min={0}
                  type="number"
                  value={form.digitalInputsCount}
                  onChange={(value) => updateField("digitalInputsCount", Number(value))}
                />
                <TextField
                  label="Релейные выходы"
                  min={0}
                  type="number"
                  value={form.relayOutputsCount}
                  onChange={(value) => updateField("relayOutputsCount", Number(value))}
                />
              </div>
              <FixedParameterRows items={[baseFixedParameters[4]]} />
            </ConfigSection>

            <ConfigSection title="Плата">
              <div className="configFieldGrid threeColumns">
                <TextField
                  label="Ширина, мм"
                  min={1}
                  type="number"
                  value={form.boardWidthMm}
                  onChange={(value) => updateField("boardWidthMm", Number(value))}
                />
                <TextField
                  label="Высота, мм"
                  min={1}
                  type="number"
                  value={form.boardHeightMm}
                  onChange={(value) => updateField("boardHeightMm", Number(value))}
                />
                <TextField
                  label="Слои"
                  min={1}
                  type="number"
                  value={form.layers}
                  onChange={(value) => updateField("layers", Number(value))}
                />
              </div>
              <FixedParameterRows items={[baseFixedParameters[5]]} />
            </ConfigSection>

            <details className="laterClarifications">
              <summary>
                <span>Что уточняется позже</span>
                <b>{notClarifiedItems.length}</b>
              </summary>
              <ul>
                {notClarifiedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>

            {error && <div className="errorBox">{error}</div>}

            {validationIssues.length > 0 && (
              <div className="validationPanel compactValidationPanel">
                <h2>Результат проверки требований</h2>
                <ul className="validationList">
                  {validationIssues.map((issue) => (
                    <li className={`validationItem severity${issue.severity}`} key={issue.code}>
                      <strong>
                        {severityLabel(issue.severity)}: {issue.code}
                      </strong>
                      <span>{issue.message}</span>
                      <small>{issue.recommendation}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="projectSummaryPanel" aria-label="Сводка проекта">
            <div className="summaryHeader">
              <p>Сводка проекта</p>
              <h2>{form.projectName || "Без названия"}</h2>
            </div>

            <button className="primaryButton summarySubmitButton" disabled={isLoading} type="submit">
              {submitLabel}
            </button>

            <dl className="summarySpecGrid">
              <div>
                <dt>Питание</dt>
                <dd>{form.inputVoltage || "-"}</dd>
              </div>
              <div>
                <dt>Микроконтроллер</dt>
                <dd>{form.mcuFamily || "-"}</dd>
              </div>
              <div>
                <dt>Интерфейс</dt>
                <dd>{form.interfaces || "-"}</dd>
              </div>
              <div>
                <dt>Ввод/вывод</dt>
                <dd>{ioSummary}</dd>
              </div>
              <div>
                <dt>Плата</dt>
                <dd>{boardSize}</dd>
              </div>
              <div>
                <dt>Слои</dt>
                <dd>{form.layers}</dd>
              </div>
            </dl>

            <div className="summaryBlock">
              <h3>Фиксировано в MVP</h3>
              <FixedParameterRows items={baseFixedParameters} />
            </div>

            <details className="summaryClarifications">
              <summary>
                <span>Уточняется позже</span>
                <b>{notClarifiedItems.length}</b>
              </summary>
              <ul>
                {notClarifiedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          </aside>
        </div>
      </form>
    </section>
  );
}
