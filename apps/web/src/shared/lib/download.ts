/** Triggers a browser download for an in-memory file. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const datedFileName = (prefix: string, extension: string, now = new Date()): string =>
  `${prefix}-${now.toISOString().slice(0, 10)}.${extension}`;
