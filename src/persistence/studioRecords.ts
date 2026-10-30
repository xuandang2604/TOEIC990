import { compareDictation, normalizeDictation } from '../domain/studio'
import { validSourcePractice } from '../domain/sourcePractice'

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown, max: number) => typeof v === 'string' && v.length <= max
const id = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 500
const integer = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0
const option = (v: unknown) => ['A', 'B', 'C', 'D'].includes(v as string)
export function validStudioRecord(table: string, row: Record<string, unknown>) {
  const length =
    typeof row.contentVersion === 'string' && /^\d+-[a-f0-9]+$/.test(row.contentVersion)
      ? Number(row.contentVersion.split('-')[0])
      : -1
  if (table === 'readingWorkspaces')
    return (
      id(row.contentVersion) &&
      length > 0 &&
      integer(row.revision) &&
      integer(row.position) &&
      (row.position as number) <= length &&
      integer(row.updatedAt) &&
      Array.isArray(row.marks) &&
      row.marks.length <= 100 &&
      new Set(row.marks.map((m) => (object(m) ? m.id : null))).size === row.marks.length &&
      row.marks.every(
        (m) =>
          object(m) &&
          id(m.id) &&
          integer(m.start) &&
          integer(m.end) &&
          (m.end as number) > (m.start as number) &&
          (m.end as number) <= length &&
          text(m.quote, 3000) &&
          (m.quote as string).length === (m.end as number) - (m.start as number) &&
          text(m.note, 1000),
      )
    )
  if (table === 'vocabularyContexts')
    return (
      id(row.vocabularyId) &&
      text(row.sentence, 1000) &&
      (row.sentence as string).trim().length > 0 &&
      id(row.source) &&
      integer(row.createdAt)
    )
  if (table !== 'learningActivities' || !id(row.contentId) || !integer(row.occurredAt)) return false
  if (row.kind === 'source-practice') return validSourcePractice(row)
  if (row.kind === 'dictation') {
    if (!text(row.input, 3000) || !text(row.reference, 3000)) return false
    if (
      normalizeDictation(row.input as string).length > 250 ||
      normalizeDictation(row.reference as string).length > 250
    )
      return false
    const result = compareDictation(row.reference as string, row.input as string)
    return row.matched === result.matched && row.total === result.total && result.total > 0
  }
  if (row.kind === 'correction')
    return (
      option(row.selected) &&
      typeof row.correct === 'boolean' &&
      text(row.reason, 2000) &&
      (row.transferId === undefined
        ? row.transferSelected === undefined && row.transferCorrect === undefined
        : id(row.transferId) &&
          option(row.transferSelected) &&
          typeof row.transferCorrect === 'boolean')
    )
  return (
    row.kind === 'micro-lesson' &&
    integer(row.revision) &&
    integer(row.step) &&
    (row.step as number) <= 5 &&
    (row.prediction === null || option(row.prediction)) &&
    (row.practiceSelected === null || option(row.practiceSelected)) &&
    (row.transferSelected === null || option(row.transferSelected)) &&
    text(row.explanation, 2000) &&
    typeof row.completed === 'boolean' &&
    row.completed === (row.step === 5) &&
    ((row.step as number) < 3 || (row.explanation as string).trim().length > 0) &&
    ((row.step as number) < 2 || option(row.prediction)) &&
    ((row.step as number) < 4 || option(row.practiceSelected)) &&
    (!row.completed || (row.step === 5 && option(row.transferSelected)))
  )
}
