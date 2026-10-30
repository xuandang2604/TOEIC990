import type { OptionId } from '../content/schema'
import type { SourcePracticeActivity } from './sourcePractice'

export interface ReadingWorkspace {
  id: string // stable passage ID
  contentVersion: string
  revision: number
  position: number
  marks: { id: string; start: number; end: number; quote: string; note: string }[]
  updatedAt: number
}
export interface VocabularyContext {
  id: string
  vocabularyId: string
  sentence: string
  source: string
  createdAt: number
}
export type LearningActivity = {
  id: string
  contentId: string
  occurredAt: number
} & (
  | Omit<SourcePracticeActivity, 'id' | 'contentId' | 'occurredAt'>
  | { kind: 'dictation'; input: string; reference: string; matched: number; total: number }
  | {
      kind: 'correction'
      selected: OptionId
      correct: boolean
      reason: string
      transferId?: string
      transferSelected?: OptionId
      transferCorrect?: boolean
    }
  | {
      kind: 'micro-lesson'
      step: number
      prediction: OptionId | null
      practiceSelected: OptionId | null
      transferSelected: OptionId | null
      explanation: string
      completed: boolean
      revision: number
    }
)

/** Content identity only, not a security hash. Stale offsets are never applied to revised text. */
export function textVersion(text: string) {
  let hash = 2166136261
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return `${text.length}-${(hash >>> 0).toString(16)}`
}
/** Paragraph choices retain exact UTF-16 offsets, including line breaks. */
export function readingBlocks(text: string) {
  return [...text.matchAll(/[^\n]+(?:\n(?!\n)[^\n]+)*/g)].map((match) => ({
    start: match.index,
    end: match.index + match[0].length,
    quote: match[0],
  }))
}
/** One display/annotation coordinate system, shared by UI and persistence. */
export function readingText(text: string) {
  return text.replace(/\{\{(\d+)\}\}/g, '[$1]')
}
export function normalizeDictation(text: string): string[] {
  // Case, Unicode typography, punctuation and repeated whitespace are ignored.
  // Apostrophes inside words remain significant: contractions are not expanded.
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .replaceAll('’', "'")
      .match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) ?? []
  )
}
export interface WordDifference {
  kind: 'match' | 'missing' | 'extra' | 'mismatch'
  expected?: string
  actual?: string
}
/** Bounded Levenshtein alignment; substitutions, insertions and deletions cost one word. */
export function compareDictation(reference: string, input: string) {
  const expected = normalizeDictation(reference).slice(0, 250)
  const actual = normalizeDictation(input).slice(0, 250)
  const dp = Array.from({ length: expected.length + 1 }, () => new Uint16Array(actual.length + 1))
  for (let i = 0; i <= expected.length; i++) dp[i][0] = i
  for (let j = 0; j <= actual.length; j++) dp[0][j] = j
  for (let i = 1; i <= expected.length; i++)
    for (let j = 1; j <= actual.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + Number(expected[i - 1] !== actual[j - 1]),
      )
  const words: WordDifference[] = []
  let i = expected.length,
    j = actual.length
  while (i || j) {
    if (i && j && dp[i][j] === dp[i - 1][j - 1] + Number(expected[i - 1] !== actual[j - 1])) {
      words.push({
        kind: expected[i - 1] === actual[j - 1] ? 'match' : 'mismatch',
        expected: expected[--i],
        actual: actual[--j],
      })
    } else if (i && dp[i][j] === dp[i - 1][j] + 1)
      words.push({ kind: 'missing', expected: expected[--i] })
    else words.push({ kind: 'extra', actual: actual[--j] })
  }
  words.reverse()
  return { words, matched: words.filter((w) => w.kind === 'match').length, total: expected.length }
}

/** Text units for synthetic replay only. These are NOT recording timestamps. */
export function transcriptSegments(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [])
    .map((line) => line.trim())
    .filter(Boolean)
}
