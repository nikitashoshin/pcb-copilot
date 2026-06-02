"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { exportBomCsv, exportProjectPackage, generateMarkdownReport } from "@/lib/api";
import { loadArchitectureResult } from "@/lib/result-storage";
import type { ArchitectureResult, CheckResult, ProjectSpec } from "@/lib/types";

function severityClass(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "error") {
    return "severityError";
  }

  if (normalized === "warning") {
    return "severityWarning";
  }

  return "severityInfo";
}

function statusLabel(check: CheckResult) {
  return `${severityLabel(check.severity)} / ${statusText(check.status)}`;
}

function severityLabel(severity: string) {
  const labels: Record<string, string> = {
    Info: "Информация",
    Warning: "Предупреждение",
    Error: "Ошибка",
  };

  return labels[severity] ?? severity;
}

function statusText(status: string) {
  const labels: Record<string, string> = {
    Passed: "Пройдено",
    ReviewRequired: "Требует проверки",
    Failed: "Не пройдено",
    NotApplicable: "Не применимо",
  };

  return labels[status] ?? status;
}

function safeFileName(projectName: string, extension: string) {
  const baseName = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "pcb-copilot-project"}${extension}`;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatList(values: string[] | undefined) {
  return values && values.length > 0 ? values.join(", ") : "-";
}

function RequirementsSummary({ spec }: { spec?: ProjectSpec | null }) {
  if (!spec) {
    return (
      <dl className="requirementsGrid">
        <div>
          <dt>Исходные требования</dt>
          <dd>Исходные требования не сохранены в текущем результате.</dd>
        </div>
      </dl>
    );
  }

  return (
    <dl className="requirementsGrid">
      <div>
        <dt>Название проекта</dt>
        <dd>{spec.projectName || "-"}</dd>
      </div>
      <div>
        <dt>Тип устройства</dt>
        <dd>{spec.deviceType || "-"}</dd>
      </div>
      <div>
        <dt>Входное питание</dt>
        <dd>{spec.power?.input || "-"}</dd>
      </div>
      <div>
        <dt>Внутренние линии питания</dt>
        <dd>{formatList(spec.power?.outputs)}</dd>
      </div>
      <div>
        <dt>Защита питания</dt>
        <dd>{spec.power?.protection ? "включена" : "выключена"}</dd>
      </div>
      <div>
        <dt>Микроконтроллер</dt>
        <dd>{spec.mcu?.family || "-"}</dd>
      </div>
      <div>
        <dt>Интерфейс программирования</dt>
        <dd>{spec.mcu?.programming || "-"}</dd>
      </div>
      <div>
        <dt>Интерфейсы</dt>
        <dd>{formatList(spec.interfaces)}</dd>
      </div>
      <div>
        <dt>Дискретные входы</dt>
        <dd>
          {spec.digitalInputs?.count ?? 0} x {spec.digitalInputs?.voltage || "-"}
        </dd>
      </div>
      <div>
        <dt>Релейные выходы</dt>
        <dd>{spec.relayOutputs?.count ?? 0}</dd>
      </div>
      <div>
        <dt>Плата</dt>
        <dd>
          {spec.board?.widthMm ?? "-"} x {spec.board?.heightMm ?? "-"} mm,{" "}
          {spec.board?.layers ?? "-"} слоя
        </dd>
      </div>
      <div>
        <dt>Среда применения</dt>
        <dd>{spec.environment || "-"}</dd>
      </div>
    </dl>
  );
}

export default function ResultPage() {
  const [result, setResult] = useState<ArchitectureResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [markdownReport, setMarkdownReport] = useState<string | null>(null);

  useEffect(() => {
    setResult(loadArchitectureResult());
    setIsLoaded(true);
  }, []);

  async function handleDownloadCsv() {
    if (!result) {
      return;
    }

    setCsvLoading(true);
    setExportError(null);

    try {
      const csv = await exportBomCsv(result);
      downloadBlob(csv, safeFileName(result.projectName, "-bom.csv"));
    } catch {
      setExportError("Не удалось скачать CSV. Проверьте, что серверная часть доступна на 127.0.0.1:5065.");
    } finally {
      setCsvLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (!result) {
      return;
    }

    setReportLoading(true);
    setExportError(null);

    try {
      setMarkdownReport(await generateMarkdownReport(result));
    } catch {
      setExportError("Не удалось сформировать отчёт. Проверьте, что серверная часть доступна на 127.0.0.1:5065.");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleDownloadMarkdown() {
    if (!result || !markdownReport) {
      return;
    }

    setExportError(null);

    try {
      downloadBlob(
        new Blob([markdownReport], { type: "text/markdown;charset=utf-8" }),
        safeFileName(result.projectName, "-report.md"),
      );
    } catch {
      setExportError("Не удалось скачать Markdown. Проверьте, что серверная часть доступна на 127.0.0.1:5065.");
    }
  }

  async function handleDownloadZipPackage() {
    if (!result) {
      return;
    }

    setZipLoading(true);
    setExportError(null);

    try {
      const zipPackage = await exportProjectPackage(result);
      downloadBlob(zipPackage, "pcb-copilot-industrial-stm32-controller.zip");
    } catch {
      setExportError("Не удалось скачать ZIP-пакет проекта. Проверьте, что серверная часть доступна на 127.0.0.1:5065.");
    } finally {
      setZipLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <section className="pageShell">
        <div className="emptyState">Загрузка результата...</div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="pageShell">
        <div className="emptyState">
          <h1>Результата ещё нет</h1>
          <p>Сформируйте архитектуру на странице создания проекта.</p>
          <Link className="primaryButton" href="/new-project">
            Создать проект
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pageShell resultStack">
      <div className="sectionHeader">
        <p className="eyebrow">Результат архитектуры</p>
        <h1>{result.projectName}</h1>
        <p className="disclaimer">
          Сгенерированный проект является инженерным черновиком и требует обязательной
          проверки инженером-электронщиком перед производством.
        </p>
        <div className="exportActions">
          <button className="secondaryButton" disabled={csvLoading} onClick={handleDownloadCsv} type="button">
            {csvLoading ? "Подготовка CSV..." : "Скачать BoM CSV"}
          </button>
          <button
            className="secondaryButton"
            disabled={reportLoading}
            onClick={handleGenerateReport}
            type="button"
          >
            {reportLoading ? "Формирование..." : "Сформировать отчёт"}
          </button>
          <button
            className="primaryButton"
            disabled={reportLoading || !markdownReport}
            onClick={handleDownloadMarkdown}
            type="button"
          >
            Скачать Markdown
          </button>
          <button
            className="secondaryButton"
            disabled={zipLoading}
            onClick={handleDownloadZipPackage}
            type="button"
          >
            {zipLoading ? "Подготовка ZIP..." : "Скачать ZIP-пакет проекта"}
          </button>
        </div>
        <p className="exportHint">
          ZIP содержит project-spec.json, BoM, Markdown-отчёт и черновые заготовки KiCad-файлов.
          Это не готовая плата.
        </p>
        {exportError && <div className="errorBox">{exportError}</div>}
      </div>

      <section>
        <div className="sectionTitle">
          <h2>Исходные требования проекта</h2>
          <span>ТЗ</span>
        </div>
        <RequirementsSummary spec={result.projectSpec} />
      </section>

      <section>
        <div className="sectionTitle">
          <h2>Функциональные блоки</h2>
          <span>{result.functionalBlocks.length}</span>
        </div>
        <div className="blockGrid">
          {result.functionalBlocks.map((block) => (
            <article className="blockCard" key={block.code}>
              <div className="cardMeta">
                <span>{block.category}</span>
                <strong>x{block.quantity}</strong>
              </div>
              <h3>{block.name}</h3>
              <p>{block.description}</p>
              <code>{block.code}</code>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="sectionTitle">
          <h2>BoM / перечень элементов</h2>
          <span>{result.bom.length}</span>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Поз.</th>
                <th>Наименование</th>
                <th>Тип</th>
                <th>Номинал</th>
                <th>Корпус</th>
                <th>Посадочное место</th>
                <th>Кол-во</th>
                <th>Блок</th>
              </tr>
            </thead>
            <tbody>
              {result.bom.map((item) => (
                <tr key={`${item.reference}-${item.blockCode}`}>
                  <td>{item.reference}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.value || "-"}</td>
                  <td>{item.package || "-"}</td>
                  <td>{item.footprint || "-"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.blockCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="sectionTitle">
          <h2>Инженерные предупреждения</h2>
          <span>{result.warnings.length}</span>
        </div>
        <ul className="warningList">
          {result.warnings.map((warning) => (
            <li className={severityClass(warning.severity)} key={warning.code}>
              <strong>{warning.code}</strong>
              <span>{warning.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="sectionTitle">
          <h2>Результаты проверок</h2>
          <span>{result.checkResults.length}</span>
        </div>
        <div className="checksList">
          {result.checkResults.map((check) => (
            <article className={`checkItem ${severityClass(check.severity)}`} key={check.code}>
              <div>
                <h3>{check.title}</h3>
                <p>{check.message}</p>
                {check.recommendation && <small>{check.recommendation}</small>}
              </div>
              <span>{statusLabel(check)}</span>
            </article>
          ))}
        </div>
      </section>

      {markdownReport && (
        <section>
          <div className="sectionTitle">
            <h2>Markdown-отчёт</h2>
            <span>.md</span>
          </div>
          <pre className="markdownPreview">{markdownReport}</pre>
        </section>
      )}
    </section>
  );
}
