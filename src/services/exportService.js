const normalizeFileName = (fileName) => (
  fileName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
);

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) return '';

  const text = String(value).replace(/\r?\n/g, ' ').trim();
  if (!/[",]/.test(text)) return text;

  return `"${text.replace(/"/g, '""')}"`;
};

export const exportCsv = ({ fileName, columns, rows }) => {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const body = rows.map((row) => (
    columns.map((column) => escapeCsvValue(column.value(row))).join(',')
  ));
  const content = `\uFEFF${[header, ...body].join('\r\n')}`;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { fileName, rowCount: rows.length };
  }

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${normalizeFileName(fileName)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return { fileName: link.download, rowCount: rows.length };
};

// ─── Excel Export (SheetJS) ──────────────────────────────────────────────────
export const exportXlsx = async ({ fileName, sheetName = 'Dữ liệu', columns, rows }) => {
  const XLSX = await import('xlsx');

  const headers = columns.map((c) => c.label);
  const data = rows.map((row) =>
    columns.map((c) => {
      const val = c.value(row);
      return val === null || val === undefined ? '' : String(val);
    })
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Tự động điều chỉnh độ rộng cột
  const colWidths = headers.map((h, i) => ({
    wch: Math.max(
      h.length + 2,
      ...data.map((row) => String(row[i] || '').length + 2),
    ),
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${normalizeFileName(fileName)}.xlsx`);

  return { fileName: `${normalizeFileName(fileName)}.xlsx`, rowCount: rows.length };
};
