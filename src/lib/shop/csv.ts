/**
 * تصدير CSV من المتصفح. يُضاف BOM (UTF-8) ليفتح Excel العربية سليمة، وتُقتبس
 * الخانات التي تحوي فاصلة أو سطرًا أو علامة اقتباس. الخانات التي تبدأ بـ
 * `= + - @` تُسبق بفاصلة عليا: وإلا فسّرها Excel صيغةً (حقن صيغ من بيانات
 * عميل كتب اسمه `=HYPERLINK(...)`).
 */
export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const cell = (v: string | number) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
): void {
  const blob = new Blob(["﻿" + toCsv(headers, rows)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
