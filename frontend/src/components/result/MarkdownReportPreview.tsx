/**
 * Показывает инженерный отчёт после его генерации backend.
 * До генерации компонент ничего не рендерит, чтобы не создавать пустой блок результата.
 */
export function MarkdownReportPreview({ markdownReport }: { markdownReport: string | null }) {
  if (!markdownReport) {
    return null;
  }

  return (
    <div className="reportPreviewPanel">
      <div className="subsectionHeading">
        <h3>Инженерный отчёт (.md)</h3>
        <span>Markdown</span>
      </div>
      <pre className="markdownPreview">{markdownReport}</pre>
    </div>
  );
}
