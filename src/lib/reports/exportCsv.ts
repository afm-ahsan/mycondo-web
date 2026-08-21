export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

const UTF8_BOM = '﻿';

/**
 * Client-side CSV export for report tables — the project has no PDF/Excel library (`window.print()`
 * plus a page-local `@media print` override is the only existing "export" story, see
 * FinancialSummaryReportPage), and Template 5 asks reports to preserve numeric values in a
 * spreadsheet-openable format without pulling in a heavy export dependency. A UTF-8 BOM is
 * prepended so Excel renders BDT/Bangla characters correctly instead of mojibake.
 */
export function exportReportToCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const escapeCell = (value: string): string => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

  const lines = [
    columns.map((column) => escapeCell(column.header)).join(','),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const value = column.accessor(row);
          return escapeCell(value === null || value === undefined ? '' : String(value));
        })
        .join(','),
    ),
  ];

  const blob = new Blob([UTF8_BOM + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
