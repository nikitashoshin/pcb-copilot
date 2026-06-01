"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { generateArchitecture } from "@/lib/api";
import { saveArchitectureResult } from "@/lib/result-storage";
import type { ProjectSpec } from "@/lib/types";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateArchitecture(toProjectSpec());
      saveArchitectureResult(result);
      router.push("/result");
    } catch {
      setError("Backend недоступен. Проверьте, что .NET API запущен на http://localhost:5065.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="pageShell">
      <div className="sectionHeader">
        <p className="eyebrow">ProjectSpec</p>
        <h1>Создание проекта</h1>
        <p>
          Форма заполнена первым демонстрационным сценарием MVP: промышленный контроллер
          на STM32 с питанием 24V DC, RS-485, 4 входами 24V и 2 релейными выходами.
        </p>
      </div>

      <form className="formPanel" onSubmit={handleSubmit}>
        <div className="formGrid">
          <label>
            <span>projectName</span>
            <input
              value={form.projectName}
              onChange={(event) => updateField("projectName", event.target.value)}
            />
          </label>

          <label>
            <span>inputVoltage</span>
            <input
              value={form.inputVoltage}
              onChange={(event) => updateField("inputVoltage", event.target.value)}
            />
          </label>

          <label>
            <span>mcuFamily</span>
            <input
              value={form.mcuFamily}
              onChange={(event) => updateField("mcuFamily", event.target.value)}
            />
          </label>

          <label>
            <span>interfaces</span>
            <input
              value={form.interfaces}
              onChange={(event) => updateField("interfaces", event.target.value)}
            />
          </label>

          <label>
            <span>digitalInputsCount</span>
            <input
              min={0}
              type="number"
              value={form.digitalInputsCount}
              onChange={(event) => updateField("digitalInputsCount", Number(event.target.value))}
            />
          </label>

          <label>
            <span>relayOutputsCount</span>
            <input
              min={0}
              type="number"
              value={form.relayOutputsCount}
              onChange={(event) => updateField("relayOutputsCount", Number(event.target.value))}
            />
          </label>

          <label>
            <span>boardWidthMm</span>
            <input
              min={1}
              type="number"
              value={form.boardWidthMm}
              onChange={(event) => updateField("boardWidthMm", Number(event.target.value))}
            />
          </label>

          <label>
            <span>boardHeightMm</span>
            <input
              min={1}
              type="number"
              value={form.boardHeightMm}
              onChange={(event) => updateField("boardHeightMm", Number(event.target.value))}
            />
          </label>

          <label>
            <span>layers</span>
            <input
              min={1}
              type="number"
              value={form.layers}
              onChange={(event) => updateField("layers", Number(event.target.value))}
            />
          </label>
        </div>

        {error && <div className="errorBox">{error}</div>}

        <div className="formActions">
          <button className="primaryButton" disabled={isLoading} type="submit">
            {isLoading ? "Формирование..." : "Сформировать архитектуру"}
          </button>
        </div>
      </form>
    </section>
  );
}
