import type { ContentBank } from './validation'

export interface SimilarityWarning {
  kind: 'question' | 'stimulus' | 'passage'
  left: string
  right: string
  similarity: number
}
const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/\d+(?:[.:]\d+)?/g, '#')
    .match(/[a-z]+|#/g) ?? []
const shingles = (text: string) => {
  const tokens = words(text)
  return new Set(tokens.slice(1).map((token, i) => `${tokens[i]} ${token}`))
}
/** Inverted shingle index avoids comparing every pair. Warnings require editorial resolution, not auto-deletion. */
export function findTextNearDuplicates(
  kind: SimilarityWarning['kind'],
  rows: { id: string; text: string; group?: string }[],
  threshold = 0.78,
): SimilarityWarning[] {
  const warnings: SimilarityWarning[] = []
  const index = new Map<string, number[]>()
  const prior: { id: string; tokens: Set<string>; group?: string }[] = []
  for (const row of rows) {
    const tokens = shingles(row.text)
    const candidates = new Map<number, number>()
    for (const token of tokens)
      for (const i of index.get(token) ?? []) candidates.set(i, (candidates.get(i) ?? 0) + 1)
    if (tokens.size >= 8)
      for (const [i, overlap] of candidates) {
        const other = prior[i]
        if (row.group && row.group === other.group) continue
        const union = tokens.size + other.tokens.size - overlap
        const similarity = overlap / union
        if (similarity >= threshold)
          warnings.push({
            kind,
            left: other.id,
            right: row.id,
            similarity: Math.round(similarity * 1000) / 1000,
          })
      }
    const i = prior.length
    prior.push({ id: row.id, tokens, group: row.group })
    for (const token of tokens) {
      const entries = index.get(token) ?? []
      entries.push(i)
      index.set(token, entries)
    }
  }
  return warnings
}

export function findNearDuplicates(bank: ContentBank, threshold = 0.78): SimilarityWarning[] {
  const warnings: SimilarityWarning[] = []
  const inspect = (
    kind: SimilarityWarning['kind'],
    rows: { id: string; text: string; group?: string }[],
  ) => warnings.push(...findTextNearDuplicates(kind, rows, threshold))
  inspect(
    'question',
    bank.questions.map((q) => ({
      id: q.id,
      text:
        q.prompt +
        ' ' +
        q.options
          .map((o) => o.text)
          .sort()
          .join(' ') +
        (q.part === 6
          ? ' ' +
            bank.stimuli
              .filter((s) => s.id === q.stimulusId && 'passageIds' in s)
              .flatMap((s) => ('passageIds' in s ? s.passageIds : []))
              .map((id) => bank.passages.find((p) => p.id === id)?.text ?? '')
              .join(' ')
          : ''),
      group: q.stimulusId,
    })),
  )
  // Part 1 instructions are intentionally shared; compare their actual spoken choices too.
  inspect(
    'stimulus',
    bank.stimuli
      .filter((s) => 'audio' in s)
      .map((s) => ({
        id: s.id,
        text:
          ('audio' in s ? s.audio.transcript : '') +
          (s.part <= 2
            ? ' ' +
              bank.questions
                .filter((q) => q.stimulusId === s.id)
                .flatMap((q) => q.options.map((o) => o.text))
                .join(' ')
            : ''),
      })),
  )
  inspect(
    'passage',
    bank.passages.map((p) => ({ id: p.id, text: p.text })),
  )
  return warnings
}
