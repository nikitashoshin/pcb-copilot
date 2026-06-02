type ExportButtonsProps = {
  csvLoading: boolean;
  reportLoading: boolean;
  zipLoading: boolean;
  hasMarkdownReport: boolean;
  onDownloadCsv: () => void;
  onGenerateReport: () => void;
  onDownloadMarkdown: () => void;
  onDownloadZipPackage: () => void;
};

/**
 * Управляет действиями экспорта результата: CSV, Markdown и ZIP.
 * Компонент не знает деталей API и получает готовые handlers от страницы-контейнера.
 */
export function ExportButtons({
  csvLoading,
  reportLoading,
  zipLoading,
  hasMarkdownReport,
  onDownloadCsv,
  onGenerateReport,
  onDownloadMarkdown,
  onDownloadZipPackage,
}: ExportButtonsProps) {
  return (
    <>
      <div className="exportActions">
        <button className="secondaryButton" disabled={csvLoading} onClick={onDownloadCsv} type="button">
          {csvLoading ? "Подготовка CSV..." : "Скачать BoM CSV"}
        </button>
        <button
          className="secondaryButton"
          disabled={reportLoading}
          onClick={onGenerateReport}
          type="button"
        >
          {reportLoading ? "Формирование..." : "Сформировать отчёт"}
        </button>
        {/* Markdown можно скачать только после генерации текста отчёта на backend. */}
        <button
          className="primaryButton"
          disabled={reportLoading || !hasMarkdownReport}
          onClick={onDownloadMarkdown}
          type="button"
        >
          Скачать Markdown
        </button>
        <button
          className="secondaryButton"
          disabled={zipLoading}
          onClick={onDownloadZipPackage}
          type="button"
        >
          {zipLoading ? "Подготовка ZIP..." : "Скачать ZIP-пакет проекта"}
        </button>
      </div>
      <p className="exportHint">
        ZIP содержит project-spec.json, BoM, Markdown-отчёт и черновые заготовки KiCad-файлов.
        Это не готовая плата.
      </p>
    </>
  );
}
