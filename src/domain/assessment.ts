import type { OptionId, Question, Stimulus, ToeicPart, Topic, Skill } from '../content/schema'
import type { Attempt, ExamResponse, PlaybackRecord, StudySession } from './models'

export interface PracticeUnit {
  id: string
  part: ToeicPart
  questionIds: string[]
  stimulusId?: string
}
export function makeUnits(items: Question[]): PracticeUnit[] {
  const units = new Map<string, PracticeUnit>()
  for (const q of items) {
    const id = q.stimulusId ?? q.id
    const unit = units.get(id) ?? { id, part: q.part, questionIds: [], stimulusId: q.stimulusId }
    unit.questionIds.push(q.id)
    units.set(id, unit)
  }
  return [...units.values()]
}
export function sessionUnits(session: StudySession, items: Question[]) {
  const lookup = new Map(items.map((q) => [q.id, q]))
  return makeUnits(
    session.questionIds.map((id) => lookup.get(id)).filter((q): q is Question => Boolean(q)),
  )
}
export function filterPracticeUnits(
  items: Question[],
  filter: { part: ToeicPart; skill?: Skill; topic?: Topic },
) {
  const lookup = new Map(items.map((q) => [q.id, q]))
  return makeUnits(items.filter((q) => q.part === filter.part)).filter((unit) =>
    unit.questionIds.some((id) => {
      const q = lookup.get(id)!
      return (
        (!filter.skill || q.skills.includes(filter.skill)) &&
        (!filter.topic || q.topic === filter.topic)
      )
    }),
  )
}
export function takeUnits(units: PracticeUnit[], requested: number): string[] {
  const ids: string[] = []
  for (const unit of units) {
    if (ids.length >= requested) break
    ids.push(...unit.questionIds)
  }
  return ids
}
export function validSelection(question: Question, selected: unknown): selected is OptionId {
  return typeof selected === 'string' && question.options.some((o) => o.id === selected)
}
export function assess(question: Question, selected: unknown) {
  if (selected !== null && !validSelection(question, selected))
    throw new Error('Invalid answer selection.')
  return { selected: selected as OptionId | null, correct: selected === question.answer }
}
export function assessExam(
  session: StudySession,
  items: Question[],
  responses: ExamResponse[],
  now: number,
): Attempt[] {
  const bank = new Map(items.map((q) => [q.id, q]))
  return session.questionIds.map((id) => {
    const question = bank.get(id)
    if (!question) throw new Error(`Unavailable content: ${id}`)
    const response = responses.find((r) => r.sessionId === session.id && r.questionId === id)
    return {
      id: `${session.id}:${id}`,
      sessionId: session.id,
      questionId: id,
      ...assess(question, response?.selected ?? null),
      confidence: null,
      confidenceSource: 'not-provided',
      mode: 'exam',
      occurredAt: now,
      source: session.kind,
    }
  })
}
export function resultByPart(session: StudySession, items: Question[], attempts: Attempt[]) {
  const lookup = new Map(items.map((q) => [q.id, q]))
  const results = new Map<
    ToeicPart,
    { part: ToeicPart; total: number; answered: number; correct: number }
  >()
  for (const id of session.questionIds) {
    const q = lookup.get(id)
    if (!q) continue
    const attempt = attempts.find((a) => a.sessionId === session.id && a.questionId === id)
    const current = results.get(q.part) ?? { part: q.part, total: 0, answered: 0, correct: 0 }
    current.total++
    current.answered += Number(Boolean(attempt?.selected))
    current.correct += Number(attempt?.correct ?? false)
    results.set(q.part, current)
  }
  return [...results.values()].sort((a, b) => a.part - b.part)
}
export function questionAvailable(question: Question, stimuli: Stimulus[]) {
  if (question.part === 5) return true
  const s = stimuli.find((item) => item.id === question.stimulusId)
  return Boolean(s && (s.kind !== 'photograph' || s.photograph.status === 'ready'))
}
export const MINI_EXAM_MINUTES = 20
export function miniExamQuestions(items: Question[], stimuli: Stimulus[]): string[] {
  const usable = items.filter((q) => questionAvailable(q, stimuli))
  const ids: string[] = []
  for (const part of [1, 2, 3, 4, 5, 6, 7] as const) {
    let units = makeUnits(usable.filter((q) => q.part === part))
    if (part === 7) {
      const passageCount = (unit: PracticeUnit) => {
        const stimulus = stimuli.find((s) => s.id === unit.stimulusId)
        return stimulus?.kind === 'reading' ? stimulus.passageIds.length : 0
      }
      units = [...units].sort((a, b) => passageCount(b) - passageCount(a))
    }
    ids.push(...takeUnits(units, part === 2 ? 2 : part === 5 ? 3 : 1))
  }
  return ids
}
export function examExpired(session: StudySession, now: number) {
  return (
    session.mode === 'exam' &&
    session.deadlineAt !== undefined &&
    Math.max(now, session.lastObservedAt ?? now) >= session.deadlineAt
  )
}
export const FULL_TEST_LISTENING_MS = 45 * 60_000
export const FULL_TEST_READING_MS = 75 * 60_000
export function readingTransitionDue(session: StudySession, now: number) {
  return (
    session.mode === 'exam' &&
    session.status === 'active' &&
    Boolean(session.sectionTiming) &&
    !session.readingStarted &&
    Math.max(now, session.lastObservedAt ?? now) >= session.sectionTiming!.listeningDeadlineAt
  )
}
export function validSectionTiming(value: unknown, session: Record<string, unknown>) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const timing = value as Record<string, unknown>
  if (
    session.mode !== 'exam' ||
    typeof session.mockExamId !== 'string' ||
    timing.version !== 1 ||
    timing.listeningDeadlineAt !== Number(session.startedAt) + FULL_TEST_LISTENING_MS
  )
    return false
  return session.readingStarted === true
    ? Number.isSafeInteger(timing.readingStartedAt) &&
        Number(timing.readingStartedAt) >= Number(session.startedAt) &&
        Number(timing.readingStartedAt) <= Number(timing.listeningDeadlineAt) &&
        session.deadlineAt === Number(timing.readingStartedAt) + FULL_TEST_READING_MS
    : timing.readingStartedAt === undefined &&
        session.deadlineAt ===
          Number(session.startedAt) + FULL_TEST_LISTENING_MS + FULL_TEST_READING_MS
}
export function canNavigateExam(session: StudySession, items: Question[], targetId: string) {
  const units = sessionUnits(session, items)
  const current = units.findIndex((u) =>
    u.questionIds.includes(session.questionIds[session.cursor]),
  )
  const target = units.findIndex((u) => u.questionIds.includes(targetId))
  if (current < 0 || target < 0) return false
  if (session.readingStarted) return units[target].part >= 5
  return target === current || target === current + 1
}
export function playbackDecision(
  record: PlaybackRecord | undefined,
  recover: boolean,
): 'start' | 'recover' | 'blocked' {
  if (!record) return 'start'
  if (record.status === 'completed') return 'blocked'
  return recover || record.status === 'failed' ? 'recover' : 'blocked'
}
