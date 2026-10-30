import { curriculum, curriculumMatches, type CurriculumUnit } from '../content/curriculum'
import type { Question, Stimulus, ToeicPart } from '../content/schema'
import type { Attempt } from './models'
import { makeUnits, questionAvailable } from './assessment'
import { localDayKey } from './learning'
import type { RoadmapPhaseId } from './roadmap'

export const CURRICULUM_POLICY = {
  firstPassWindow: 12,
  firstPassAccuracy: 0.9,
  studyDays: 2,
  recallGapMs: 48 * 60 * 60 * 1000,
} as const

/** Match focus questions, but launch their entire shared-stimulus groups. */
export function curriculumPool(unit: CurriculumUnit, questions: Question[], stimuli: Stimulus[]) {
  const sources = new Map(stimuli.map((stimulus) => [stimulus.id, stimulus]))
  const matched = new Set(
    questions
      .filter((question) => {
        if (!curriculumMatches(unit, question)) return false
        const source = sources.get(question.stimulusId ?? '')
        if (
          unit.passages &&
          (!source || !('passageIds' in source) || source.passageIds.length !== unit.passages)
        )
          return false
        if (unit.exhibitOnly && (!source || !('exhibit' in source) || !source.exhibit)) return false
        return true
      })
      .map((question) => question.id),
  )
  const byId = new Map(questions.map((question) => [question.id, question]))
  const groups = makeUnits(questions).filter(
    (group) =>
      group.questionIds.some((id) => matched.has(id)) &&
      group.questionIds.every((id) => questionAvailable(byId.get(id)!, stimuli)),
  )
  const ids = new Set(groups.flatMap((group) => group.questionIds))
  return {
    questions: questions.filter((question) => ids.has(question.id)),
    focusIds: new Set([...matched].filter((id) => ids.has(id))),
    groups: groups.length,
  }
}

export type CurriculumStatus =
  'reference' | 'new' | 'repair' | 'sample' | 'more-content' | 'recall' | 'evidence'
export const CURRICULUM_STATUS: Record<CurriculumStatus, string> = {
  reference: 'Học qua sổ tay',
  new: 'Chưa luyện',
  repair: 'Cần xem lại',
  sample: 'Luyện thêm câu mới',
  'more-content': 'Cần thêm câu mới',
  recall: 'Ôn lại cách ngày',
  evidence: 'Đã củng cố trên bộ mẫu',
}

/** Derived from existing attempts. Repeated answers never become additional first encounters. */
export function curriculumProgress(
  questions: Question[],
  stimuli: Stimulus[],
  attempts: Attempt[],
  now: number,
) {
  const byId = new Map(questions.map((question) => [question.id, question]))
  const eligible = attempts
    .filter((attempt) => {
      const question = byId.get(attempt.questionId)
      return (
        question &&
        Number.isFinite(attempt.occurredAt) &&
        attempt.occurredAt > 0 &&
        attempt.occurredAt <= now &&
        attempt.questionSnapshot?.origin === 'at-answer' &&
        attempt.questionSnapshot.revision === question.provenance.revision
      )
    })
    .sort((a, b) => a.occurredAt - b.occurredAt || a.id.localeCompare(b.id))
  const first = new Map<string, Attempt>(),
    latest = new Map<string, Attempt>()
  for (const attempt of eligible) {
    if (!first.has(attempt.questionId)) first.set(attempt.questionId, attempt)
    latest.set(attempt.questionId, attempt)
  }
  const today = localDayKey(now)
  return curriculum.map((unit) => {
    const pool = curriculumPool(unit, questions, stimuli)
    const initial = [...first.values()].filter((attempt) => pool.focusIds.has(attempt.questionId))
    const latestFirst = initial
      .slice()
      .sort((a, b) => b.occurredAt - a.occurredAt || a.id.localeCompare(b.id))
      .slice(0, CURRICULUM_POLICY.firstPassWindow)
    const firstCorrect = latestFirst.filter(
      (attempt) => attempt.correct && attempt.selected !== null,
    ).length
    const recent = [...latest.values()].filter((attempt) => pool.focusIds.has(attempt.questionId))
    const recentWrong = recent.filter(
      (attempt) => !attempt.correct && attempt.occurredAt >= now - 14 * 86_400_000,
    )
    const delayed = recent.filter(
      (attempt) =>
        attempt.occurredAt - first.get(attempt.questionId)!.occurredAt >=
          CURRICULUM_POLICY.recallGapMs &&
        attempt.sessionId !== first.get(attempt.questionId)!.sessionId,
    )
    const recalled = delayed.filter(
      (attempt) => attempt.correct && attempt.selected !== null,
    ).length
    const days = new Set(
      eligible
        .filter((attempt) => pool.focusIds.has(attempt.questionId) && attempt.selected !== null)
        .map((attempt) => localDayKey(attempt.occurredAt)),
    ).size
    const partsObserved = new Set(
      initial
        .filter((attempt) => attempt.selected !== null)
        .map((attempt) => byId.get(attempt.questionId)!.part),
    )
    const unmetParts = unit.requireAllParts
      ? unit.parts.filter((part) => !partsObserved.has(part))
      : []
    const unsupportedParts = unit.requireAllParts
      ? unit.parts.filter((part) => ![...pool.focusIds].some((id) => byId.get(id)!.part === part))
      : []
    const unseen = pool.focusIds.size - initial.length
    const firstAccuracy = latestFirst.length ? firstCorrect / latestFirst.length : null
    const sufficientFirst =
      initial.length >= unit.minimumQuestions &&
      (firstAccuracy ?? 0) >= CURRICULUM_POLICY.firstPassAccuracy &&
      !unmetParts.length
    const recallRequired = Math.ceil(unit.minimumQuestions / 3)
    const status: CurriculumStatus = !pool.focusIds.size
      ? 'reference'
      : !initial.length
        ? 'new'
        : recentWrong.length
          ? 'repair'
          : !sufficientFirst
            ? unseen
              ? 'sample'
              : 'more-content'
            : days < CURRICULUM_POLICY.studyDays || recalled < recallRequired
              ? 'recall'
              : 'evidence'
    return {
      unit,
      status,
      available: pool.focusIds.size,
      groups: pool.groups,
      seen: initial.length,
      unseen,
      firstAccuracy,
      firstCorrect,
      firstSample: latestFirst.length,
      recentWrong: recentWrong.length,
      recalled,
      recallRequired,
      studyDays: days,
      unmetParts,
      canRecallNow: initial.some(
        (attempt) => now - attempt.occurredAt >= CURRICULUM_POLICY.recallGapMs,
      ),
      unsupportedParts,
      contentShortfall: pool.focusIds.size < unit.minimumQuestions || unsupportedParts.length > 0,
      practicedToday: recent.some((attempt) => localDayKey(attempt.occurredAt) === today),
      lastPracticedAt: recent.length
        ? Math.max(...recent.map((attempt) => attempt.occurredAt))
        : null,
    }
  })
}
export type CurriculumProgress = ReturnType<typeof curriculumProgress>[number]

export function nextCurriculumFocus(
  rows: CurriculumProgress[],
  phase: RoadmapPhaseId,
  reviewParts: ToeicPart[] = [],
) {
  const diagnostic = rows.find((row) => row.unit.id === 'diagnostic')
  if (diagnostic?.unmetParts.length) return diagnostic
  const phases: RoadmapPhaseId[] = ['foundation', 'application', 'integration', 'consolidation']
  const order = phases.indexOf(phase)
  return (
    rows
      .filter(
        (row) =>
          row.available &&
          row.unit.id !== 'diagnostic' &&
          row.status !== 'evidence' &&
          row.status !== 'more-content' &&
          (row.status !== 'recall' || row.canRecallNow) &&
          !row.practicedToday,
      )
      .map((row, index) => ({
        row,
        index,
        priority:
          (row.status === 'repair' ? 100 : row.status === 'recall' ? 30 : 20) +
          (row.unit.phase === phase ? 16 : phases.indexOf(row.unit.phase) < order ? 8 : 0) +
          (row.unit.parts.some((part) => reviewParts.includes(part)) ? 24 : 0) +
          (row.unseen ? 5 : 0),
      }))
      .sort((a, b) => b.priority - a.priority || a.index - b.index)[0]?.row ?? null
  )
}
