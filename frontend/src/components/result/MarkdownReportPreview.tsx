/**
 * Показывает Markdown-отчёт после его генерации backend.
 * До генерации компонент ничего не рендерит, чтобы не создавать пустой блок результата.
 */
export function MarkdownReportPreview({ markdownReport }: { markdownReport: string | null }) {
  if (!markdownReport) {
    return null;
  }

  return (
    <section>
      <div className="sectionTitle">
        <h2>Markdown-отчёт</h2>
        <span>.md</span>
      </div>
      <pre className="markdownPreview">{markdownReport}</pre>
    </section>
  );
}
