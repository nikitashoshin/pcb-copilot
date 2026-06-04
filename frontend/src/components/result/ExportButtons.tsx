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
 * Управляет действиями экспорта результата и поясняет назначение каждого файла.
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
    <div className="exportCard">
      <div className="exportOption">
        <button className="secondaryButton" disabled={csvLoading} onClick={onDownloadCsv} type="button">
          {csvLoading ? "Подготовка файла..." : "Скачать перечень элементов (.csv)"}
        </button>
        <p>Табличный файл для Excel и других табличных редакторов.</p>
      </div>

      <div className="exportOption">
        <button
          className="secondaryButton"
          disabled={reportLoading}
          onClick={onGenerateReport}
          type="button"
        >
          {reportLoading ? "Формирование..." : "Сформировать инженерный отчёт"}
        </button>
        <p>Подготавливает текстовый инженерный отчёт по текущему результату.</p>
      </div>

      <div className="exportOption">
        {/* Отчёт можно скачать только после генерации текста на backend. */}
        <button
          className="primaryButton"
          disabled={reportLoading || !hasMarkdownReport}
          onClick={onDownloadMarkdown}
          type="button"
        >
          Скачать отчёт (.md)
        </button>
        <p>Текстовый инженерный отчёт в формате Markdown.</p>
      </div>

      <div className="exportOption">
        <button
          className="secondaryButton"
          disabled={zipLoading}
          onClick={onDownloadZipPackage}
          type="button"
        >
          {zipLoading ? "Подготовка архива..." : "Скачать архив проекта (.zip)"}
        </button>
        <p>Архив с требованиями, отчётом, перечнем элементов и черновыми KiCad-файлами.</p>
      </div>
    </div>
  );
}
