/**
 * Готовит безопасное имя файла для локального скачивания пользовательских артефактов.
 */
export function safeFileName(projectName: string, extension: string) {
  const baseName = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "pcb-copilot-project"}${extension}`;
}

/**
 * Скачивает файл, полученный от backend как Blob, без открытия нового окна браузера.
 */
export function downloadBlob(blob: Blob, fileName: string) {
  // CSV, Markdown и ZIP приходят от backend как Blob.
  // Для скачивания создаём временный object URL и сразу освобождаем его после клика.
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
