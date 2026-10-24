/** One normalization policy for Vietnamese search and English phrase lookup. */
export function normalizeReference(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
export function lookupKey(value: string): string {
  return normalizeReference(value).replace(/^[^a-z]+|[^a-z]+$/g, '')
}
export interface SearchDocument {
  key: string
  kind: 'vocabulary' | 'grammar' | 'reference'
  id: string
  title: string
  description: string
  label: string
  aliases: string[]
  keywords: string
}
export interface SearchHit extends SearchDocument {
  saved: boolean
}
export type SearchScope = 'all' | 'vocabulary' | 'grammar' | 'saved' | 'reference'

/** Precompute searchable fields once; saving words never rebuilds the content index. */
export function createReferenceIndex(documents: SearchDocument[]) {
  const rows = documents.map((document) => ({
    document,
    title: normalizeReference(document.title),
    aliases: document.aliases.map(normalizeReference),
    text: normalizeReference(
      `${document.title} ${document.description} ${document.keywords} ${document.aliases.join(' ')}`,
    ),
  }))
  return (
    query: string,
    scope: SearchScope = 'all',
    savedIds = new Set<string>(),
    limit = 30,
  ): SearchHit[] => {
    const key = normalizeReference(query).slice(0, 120)
    const tokens = key.split(' ').filter(Boolean)
    return rows
      .flatMap((row) => {
        const saved = row.document.kind === 'vocabulary' && savedIds.has(row.document.id)
        if (scope === 'saved' ? !saved : scope !== 'all' && scope !== row.document.kind) return []
        if (!tokens.every((token) => row.text.includes(token))) return []
        const score = !key
          ? 0
          : row.title === key
            ? 100
            : row.aliases.includes(key)
              ? 95
              : row.title.startsWith(key)
                ? 80
                : row.title.includes(key)
                  ? 60
                  : 20
        return [{ ...row.document, saved, score }]
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.saved) - Number(a.saved) ||
          a.title.localeCompare(b.title, 'en'),
      )
      .slice(0, limit)
  }
}

/** Original character offsets are preserved even when an accent normalizes to multiple code points. */
export function highlightedSegments(
  value: string,
  query: string,
): { text: string; match: boolean }[] {
  const tokens = normalizeReference(query).split(' ').filter(Boolean)
  if (!tokens.length) return [{ text: value, match: false }]
  const flags = Array<boolean>(value.length).fill(false)
  let normalized = ''
  const offsets: number[] = []
  for (let i = 0; i < value.length; i++) {
    const part = normalizeReference(value[i])
    // Preserve spaces, which trim() intentionally removes in the query normalizer.
    const text = /\s/.test(value[i]) ? ' ' : part
    for (const char of text) {
      normalized += char
      offsets.push(i)
    }
  }
  for (const token of tokens) {
    let from = 0,
      at = normalized.indexOf(token)
    while (at >= 0) {
      for (let i = offsets[at]; i <= offsets[at + token.length - 1]; i++) flags[i] = true
      from = at + token.length
      at = normalized.indexOf(token, from)
    }
  }
  const segments: { text: string; match: boolean }[] = []
  for (let i = 0; i < value.length; i++) {
    const last = segments.at(-1)
    if (last && last.match === flags[i]) last.text += value[i]
    else segments.push({ text: value[i], match: flags[i] })
  }
  return segments
}
