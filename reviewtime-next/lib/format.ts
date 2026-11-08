export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat().format(value)
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatMonthLabel(value: string | null | undefined): string {
  if (!value) return '—'
  return value
}
