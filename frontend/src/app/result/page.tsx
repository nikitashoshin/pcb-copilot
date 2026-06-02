"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BomTable } from "@/components/result/BomTable";
import { CheckResultsList } from "@/components/result/CheckResultsList";
import { ExportButtons } from "@/components/result/ExportButtons";
import { FunctionalBlocksList } from "@/components/result/FunctionalBlocksList";
import { MarkdownReportPreview } from "@/components/result/MarkdownReportPreview";
import { ProjectSpecSummary } from "@/components/result/ProjectSpecSummary";
import { WarningsList } from "@/components/result/WarningsList";
import { exportBomCsv, exportProjectPackage, generateMarkdownReport } from "@/lib/api";
import { downloadBlob, safeFileName } from "@/lib/downloads";
import { loadArchitectureResult } from "@/lib/result-storage";
import type { ArchitectureResult } from "@/types/project";

/**
 * Контейнер страницы результата: хранит локальное UI-состояние экспорта
 * и передаёт данные в презентационные компоненты результата.
 */
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
        <ExportButtons
          csvLoading={csvLoading}
          reportLoading={reportLoading}
          zipLoading={zipLoading}
          hasMarkdownReport={Boolean(markdownReport)}
          onDownloadCsv={handleDownloadCsv}
          onGenerateReport={handleGenerateReport}
          onDownloadMarkdown={handleDownloadMarkdown}
          onDownloadZipPackage={handleDownloadZipPackage}
        />
        {exportError && <div className="errorBox">{exportError}</div>}
      </div>

      <ProjectSpecSummary spec={result.projectSpec} />
      <FunctionalBlocksList blocks={result.functionalBlocks} />
      <BomTable bom={result.bom} />
      <WarningsList warnings={result.warnings} />
      <CheckResultsList checkResults={result.checkResults} />
      <MarkdownReportPreview markdownReport={markdownReport} />
    </section>
  );
}
