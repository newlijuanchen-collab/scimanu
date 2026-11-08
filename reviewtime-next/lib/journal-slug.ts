export function getJournalSlug(label: string, journalKey?: string): string {
  const base = label
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  const identifier = journalKey?.split(':').pop()?.toLowerCase()
  return [base || 'journal', identifier].filter(Boolean).join('-')
}
