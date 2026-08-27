/**
 * CSV export.
 *
 * Unlike most "export" buttons in this prototype, this one is real: it builds a
 * CSV from the rows already on screen and hands the browser a Blob to download.
 * Nothing is sent anywhere — the file is produced entirely in the tab, from the
 * same mock data the table is showing.
 */

/** Wraps a value for CSV, escaping quotes and anything that would break a cell. */
function escapeCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(
  columns: Array<{ key: string; header: string }>,
  rows: Array<Record<string, string | number>>,
): string {
  const header = columns.map((column) => escapeCell(column.header)).join(',')
  const body = rows.map((row) => columns.map((column) => escapeCell(row[column.key])).join(','))
  return [header, ...body].join('\r\n')
}

export function downloadCsv(fileName: string, csv: string) {
  // A BOM keeps Excel from mangling non-ASCII characters on open.
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}
