"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { exportBomCsv, generateMarkdownReport } from "@/lib/api";
import { loadArchitectureResult } from "@/lib/result-storage";
import type { ArchitectureResult, CheckResult } from "@/lib/types";

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
  return `${check.severity} / ${check.status}`;
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

export default function ResultPage() {
  const [result, setResult] = useState<ArchitectureResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
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
      setExportError("Не удалось скачать CSV. Проверьте, что backend доступен на 127.0.0.1:5065.");
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
      setExportError("Не удалось сформировать отчёт. Проверьте, что backend доступен на 127.0.0.1:5065.");
    } finally {
      setReportLoading(false);
    }
  }

  async function handleDownloadMarkdown() {
    if (!result) {
      return;
    }

    setReportLoading(true);
    setExportError(null);

    try {
      const report = markdownReport ?? (await generateMarkdownReport(result));
      setMarkdownReport(report);
      downloadBlob(
        new Blob([report], { type: "text/markdown;charset=utf-8" }),
        safeFileName(result.projectName, "-report.md"),
      );
    } catch {
      setExportError("Не удалось скачать Markdown. Проверьте, что backend доступен на 127.0.0.1:5065.");
    } finally {
      setReportLoading(false);
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
        <p className="eyebrow">ArchitectureResult</p>
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
            disabled={reportLoading}
            onClick={handleDownloadMarkdown}
            type="button"
          >
            {reportLoading ? "Подготовка Markdown..." : "Скачать Markdown"}
          </button>
        </div>
        {exportError && <div className="errorBox">{exportError}</div>}
      </div>

      <section>
        <div className="sectionTitle">
          <h2>Functional Blocks</h2>
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
          <h2>BoM</h2>
          <span>{result.bom.length}</span>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Name</th>
                <th>Type</th>
                <th>Value</th>
                <th>Package</th>
                <th>Footprint</th>
                <th>Qty</th>
                <th>Block</th>
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
          <h2>Warnings</h2>
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
          <h2>Check Results</h2>
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
            <h2>Markdown Report</h2>
            <span>.md</span>
          </div>
          <pre className="markdownPreview">{markdownReport}</pre>
        </section>
      )}
    </section>
  );
}
