"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BomTable } from "@/components/result/BomTable";
import { CheckResultsList } from "@/components/result/CheckResultsList";
import {
  MissingParametersTab,
  ResourcesTab,
  RiskSummaryTab,
} from "@/components/result/EngineeringReviewSection";
import { ExportButtons } from "@/components/result/ExportButtons";
import { FunctionalBlocksList } from "@/components/result/FunctionalBlocksList";
import { MarkdownReportPreview } from "@/components/result/MarkdownReportPreview";
import { ProjectSpecSummary } from "@/components/result/ProjectSpecSummary";
import { ResultDashboardSummary } from "@/components/result/ResultDashboardSummary";
import { ResultPageNavigation, type ResultTabId } from "@/components/result/ResultPageNavigation";
import { WarningsList } from "@/components/result/WarningsList";
import { exportBomCsv, exportProjectPackage, generateMarkdownReport } from "@/lib/api";
import { downloadBlob, safeFileName } from "@/lib/downloads";
import { loadArchitectureResult } from "@/lib/result-storage";
import type { ArchitectureResult } from "@/types/project";

/**
 * Контейнер страницы результата: хранит локальное UI-состояние экспорта
 * и организует данные ArchitectureResult в инженерный dashboard.
 */
export default function ResultPage() {
  const [result, setResult] = useState<ArchitectureResult | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [markdownReport, setMarkdownReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTabId>("overview");

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
      setExportError(
        "Не удалось скачать перечень элементов. Проверьте, что серверная часть доступна на 127.0.0.1:5065.",
      );
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
      setExportError(
        "Не удалось сформировать инженерный отчёт. Проверьте, что серверная часть доступна на 127.0.0.1:5065.",
      );
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
      setExportError(
        "Не удалось скачать инженерный отчёт. Проверьте, что серверная часть доступна на 127.0.0.1:5065.",
      );
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
      setExportError(
        "Не удалось скачать архив проекта. Проверьте, что серверная часть доступна на 127.0.0.1:5065.",
      );
    } finally {
      setZipLoading(false);
    }
  }

  const exportActions = (
    <ExportButtons
      csvLoading={csvLoading}
      hasMarkdownReport={Boolean(markdownReport)}
      onDownloadCsv={handleDownloadCsv}
      onDownloadMarkdown={handleDownloadMarkdown}
      onDownloadZipPackage={handleDownloadZipPackage}
      onGenerateReport={handleGenerateReport}
      reportLoading={reportLoading}
      zipLoading={zipLoading}
    />
  );

  function renderActiveTab(result: ArchitectureResult) {
    switch (activeTab) {
      case "risks":
        return <RiskSummaryTab review={result.engineeringReview} />;

      case "clarification":
        return <MissingParametersTab review={result.engineeringReview} />;

      case "resources":
        return <ResourcesTab review={result.engineeringReview} />;

      case "blocks":
        return (
          <FunctionalBlocksList
            blocks={result.functionalBlocks}
            rationale={result.engineeringReview?.blockRationale}
          />
        );

      case "bom":
        return <BomTable bom={result.bom} />;

      case "checks":
        return (
          <section className="dashboardSection">
            <div className="dashboardSectionHeading">
              <div>
                <p className="sectionKicker">Техническая детализация</p>
                <h2>Подробные предупреждения и проверки</h2>
              </div>
            </div>
            <div className="technicalDetailsGrid">
              <WarningsList warnings={result.warnings} />
              <CheckResultsList checkResults={result.checkResults} />
            </div>
          </section>
        );

      case "export":
        return (
          <section className="dashboardSection">
            <div className="dashboardSectionHeading">
              <div>
                <p className="sectionKicker">Файлы проекта</p>
                <h2>Отчёт и экспорт</h2>
              </div>
            </div>

            <div className="exportLayout">
              {exportActions}
              <MarkdownReportPreview markdownReport={markdownReport} />
            </div>

            {exportError && <div className="errorBox">{exportError}</div>}
          </section>
        );

      case "overview":
      default:
        return (
          <section className="dashboardSection resultOverview">
            <ResultDashboardSummary result={result} />

            <div className="overviewSecondaryGrid">
              <ProjectSpecSummary spec={result.projectSpec} />
              <div className="quickExportPanel">
                <div className="subsectionHeading">
                  <h3>Быстрые действия</h3>
                  <span>Экспорт</span>
                </div>
                {exportActions}
                {exportError && <div className="errorBox compactErrorBox">{exportError}</div>}
              </div>
            </div>
          </section>
        );
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
    <section className="pageShell resultDashboard">
      <div className="resultHeader">
        <div className="resultHero">
          <div>
            <p className="eyebrow">Обзор результата</p>
            <h1>{result.projectName}</h1>
          </div>
          <span className="reviewStatusBadge">Требует инженерной проверки</span>
        </div>

        <p className="disclaimer">
          Сгенерированный проект является инженерным черновиком и требует обязательной
          проверки инженером-электронщиком перед производством.
        </p>
      </div>

      <ResultPageNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div
        aria-labelledby={`result-tab-button-${activeTab}`}
        className="resultTabPanel"
        id={`result-tab-${activeTab}`}
        role="tabpanel"
      >
        {renderActiveTab(result)}
      </div>
    </section>
  );
}
