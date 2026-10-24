import type { Question, Stimulus, ToeicPart } from '../content/schema'
import { makeUnits, questionAvailable } from './assessment'

export const OFFICIAL_PART_COUNTS = [6, 25, 39, 30, 30, 16, 54] as const
export interface MockExam {
  id: string
  title: string
  revision: string
  questionIds: string[]
  durationMinutes: number
  editorialStatus: 'ai-draft' | 'human-reviewed'
  note: string
  eligibility?: 'unreviewed-practice' | 'reviewed'
}
/** Completeness is a structural/media contract, not editorial certification or score calibration. */
export function mockExamIssues(exam: MockExam, questions: Question[], stimuli: Stimulus[]) {
  const issues: string[] = []
  if (
    !exam ||
    !Array.isArray(exam.questionIds) ||
    exam.questionIds.some((id) => typeof id !== 'string')
  )
    return ['Mock manifest requires a question ID array.']
  const lookup = new Map(questions.map((q) => [q.id, q]))
  if (
    !exam.id ||
    !exam.revision ||
    !exam.title ||
    exam.durationMinutes !== 120 ||
    !['ai-draft', 'human-reviewed'].includes(exam.editorialStatus) ||
    !['unreviewed-practice', 'reviewed'].includes(String(exam.eligibility)) ||
    (exam.editorialStatus === 'human-reviewed' && exam.eligibility !== 'reviewed')
  )
    issues.push('Invalid exam metadata.')
  if (exam.questionIds.length !== 200 || new Set(exam.questionIds).size !== 200)
    issues.push('A complete mock requires 200 unique question IDs.')
  const items = exam.questionIds.flatMap((id) => (lookup.has(id) ? [lookup.get(id)!] : []))
  if (items.length !== exam.questionIds.length || items.some((q) => !questionAvailable(q, stimuli)))
    issues.push('Question or media unavailable.')
  for (let i = 0; i < 7; i++)
    if (items.filter((q) => q.part === i + 1).length !== OFFICIAL_PART_COUNTS[i])
      issues.push(`Part ${i + 1} has an incorrect count.`)
  if (items.some((q, i) => i > 0 && q.part < items[i - 1].part))
    issues.push('Questions must be ordered by Part.')
  const selected = new Set(exam.questionIds)
  for (const unit of makeUnits(items))
    if (
      unit.stimulusId &&
      questions.some((q) => q.stimulusId === unit.stimulusId && !selected.has(q.id))
    )
      issues.push('Partial stimulus group in mock.')
  for (const part of [3, 4, 6] as const)
    for (const unit of makeUnits(items.filter((q) => q.part === part)))
      if (unit.questionIds.length !== (part === 6 ? 4 : 3))
        issues.push(`Invalid Part ${part} group.`)
  const reading = makeUnits(items.filter((q) => q.part === 7))
  const byId = new Map(stimuli.map((s) => [s.id, s]))
  const singles = reading.filter((u) => {
    const s = byId.get(u.stimulusId!)
    return s?.kind === 'reading' && s.passageIds.length === 1
  })
  const multiple = reading.filter((u) => {
    const s = byId.get(u.stimulusId!)
    return s?.kind === 'reading' && s.passageIds.length > 1
  })
  if (
    singles.length !== 10 ||
    singles.reduce((n, u) => n + u.questionIds.length, 0) !== 29 ||
    singles.some((u) => u.questionIds.length < 2 || u.questionIds.length > 4)
  )
    issues.push('Part 7 singles require 10 texts / 29 questions.')
  if (multiple.length !== 5 || multiple.some((u) => u.questionIds.length !== 5))
    issues.push('Part 7 multiple passages require 5 sets / 25 questions.')
  return issues
}
export function questionInventory(
  practice: Question[],
  mock: Question[],
  stimuli: Stimulus[],
  attempts: { questionId: string; selected: unknown }[],
) {
  const ready = practice.filter((q) => questionAvailable(q, stimuli))
  const attempted = new Set(attempts.filter((a) => a.selected !== null).map((a) => a.questionId))
  return {
    availablePractice: ready.length,
    attemptedPractice: ready.filter((q) => attempted.has(q.id)).length,
    reservedMock: mock.filter((q) => questionAvailable(q, stimuli)).length,
    byPart: ([1, 2, 3, 4, 5, 6, 7] as ToeicPart[]).map((part) => ({
      part,
      available: ready.filter((q) => q.part === part).length,
      attempted: ready.filter((q) => q.part === part && attempted.has(q.id)).length,
    })),
  }
}
