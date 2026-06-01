"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { generateArchitecture, validateProjectSpec } from "@/lib/api";
import { saveArchitectureResult } from "@/lib/result-storage";
import type { ProjectSpec, ValidationIssue } from "@/lib/types";

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

const initialFormState: ProjectFormState = {
  projectName: "Industrial STM32 Controller",
  inputVoltage: "24V DC",
  mcuFamily: "STM32",
  interfaces: "RS-485",
  digitalInputsCount: 4,
  relayOutputsCount: 2,
  boardWidthMm: 80,
  boardHeightMm: 60,
  layers: 2,
};

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

  return (
    <section className="pageShell">
      <div className="sectionHeader">
        <p className="eyebrow">Исходные требования</p>
        <h1>Создание проекта</h1>
        <p>
          Форма заполнена первым демонстрационным сценарием MVP: промышленный контроллер
          на STM32 с питанием 24V DC, RS-485, 4 входами 24V и 2 релейными выходами.
        </p>
      </div>

      <form className="formPanel" onSubmit={handleSubmit}>
        <div className="formGrid">
          <label>
            <span>Название проекта</span>
            <input
              value={form.projectName}
              onChange={(event) => updateField("projectName", event.target.value)}
            />
          </label>

          <label>
            <span>Входное питание</span>
            <input
              value={form.inputVoltage}
              onChange={(event) => updateField("inputVoltage", event.target.value)}
            />
          </label>

          <label>
            <span>Семейство MCU</span>
            <input
              value={form.mcuFamily}
              onChange={(event) => updateField("mcuFamily", event.target.value)}
            />
          </label>

          <label>
            <span>Интерфейсы</span>
            <input
              value={form.interfaces}
              onChange={(event) => updateField("interfaces", event.target.value)}
            />
          </label>

          <label>
            <span>Количество дискретных входов</span>
            <input
              min={0}
              type="number"
              value={form.digitalInputsCount}
              onChange={(event) => updateField("digitalInputsCount", Number(event.target.value))}
            />
          </label>

          <label>
            <span>Количество релейных выходов</span>
            <input
              min={0}
              type="number"
              value={form.relayOutputsCount}
              onChange={(event) => updateField("relayOutputsCount", Number(event.target.value))}
            />
          </label>

          <label>
            <span>Ширина платы, мм</span>
            <input
              min={1}
              type="number"
              value={form.boardWidthMm}
              onChange={(event) => updateField("boardWidthMm", Number(event.target.value))}
            />
          </label>

          <label>
            <span>Высота платы, мм</span>
            <input
              min={1}
              type="number"
              value={form.boardHeightMm}
              onChange={(event) => updateField("boardHeightMm", Number(event.target.value))}
            />
          </label>

          <label>
            <span>Количество слоёв</span>
            <input
              min={1}
              type="number"
              value={form.layers}
              onChange={(event) => updateField("layers", Number(event.target.value))}
            />
          </label>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {validationIssues.length > 0 && (
          <div className="validationPanel">
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

        <div className="formActions">
          <button className="primaryButton" disabled={isLoading} type="submit">
            {isLoading ? "Проверка и формирование..." : "Сформировать архитектуру"}
          </button>
        </div>
      </form>
    </section>
  );
}
