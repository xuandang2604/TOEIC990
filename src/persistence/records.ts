import type {
  Attempt,
  Preferences,
  ReviewCard,
  ReviewEvent,
  StudySession,
  TutorReflection,
  ExamResponse,
  PlaybackRecord,
  RecentSearch,
  StudyDraft,
  SkillEvidence,
  MistakeRecord,
  MistakeAnnotation,
  QuestionTiming,
  DailyPlan,
} from '../domain/models'
import type { TutorDraft, TutorTurn } from '../domain/tutorModels'
import { schedulableCard } from '../domain/scheduler'
import { SKILL_LABELS } from '../domain/skillTaxonomy'
import type { ReadingWorkspace, LearningActivity, VocabularyContext } from '../domain/studio'
import { validStudioRecord } from './studioRecords'
import { FEEDBACK_CATEGORIES, type ContentFeedback } from '../domain/contentFeedback'
import { questionFingerprint } from '../content/editorial'
import type { Question } from '../content/schema'
import { validLearningProfile, validScore, validVocabularyReminder } from '../domain/roadmap'

export interface RecordTypes {
  contentFeedback: ContentFeedback
  readingWorkspaces: ReadingWorkspace
  learningActivities: LearningActivity
  vocabularyContexts: VocabularyContext
  preferences: Preferences
  attempts: Attempt
  sessions: StudySession
  cards: ReviewCard
  reviewEvents: ReviewEvent
  reflections: TutorReflection
  responses: ExamResponse
  playbacks: PlaybackRecord
  recentSearches: RecentSearch
  studyDrafts: StudyDraft
  skillEvidence: SkillEvidence
  mistakes: MistakeRecord
  mistakeAnnotations: MistakeAnnotation
  questionTimings: QuestionTiming
  dailyPlans: DailyPlan
  tutorTurns: TutorTurn
  tutorDrafts: TutorDraft
}
export const LEARNING_TABLES = [
  'contentFeedback',
  'readingWorkspaces',
  'learningActivities',
  'vocabularyContexts',
  'preferences',
  'sessions',
  'attempts',
  'cards',
  'reviewEvents',
  'reflections',
  'responses',
  'playbacks',
  'recentSearches',
  'studyDrafts',
  'skillEvidence',
  'mistakes',
  'mistakeAnnotations',
  'questionTimings',
  'dailyPlans',
  'tutorTurns',
  'tutorDrafts',
] as const satisfies readonly (keyof RecordTypes)[]
export type LearningTable = (typeof LEARNING_TABLES)[number]
export type LearningData = { [K in LearningTable]: RecordTypes[K][] }
export interface InvalidRecord {
  table: LearningTable
  key: string
  record: unknown
  reasons: string[]
}
export interface QuarantinedRecord extends InvalidRecord {
  id: string
  quarantinedAt: number
  encoding?: 'study990.structured.v1'
}
export interface RecoveryPoint {
  id: 'last-change'
  token?: string
  createdAt: number
  reason: 'import' | 'reset' | 'repair'
  data: LearningData
  quarantine: QuarantinedRecord[]
}
export const emptyLearningData = (): LearningData =>
  Object.fromEntries(LEARNING_TABLES.map((table) => [table, []])) as unknown as LearningData
export const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, max = 500) => typeof v === 'string' && v.length > 0 && v.length <= max
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0
const stamp = (v: unknown) => num(v) && Number.isSafeInteger(v) && (v as number) <= 8.64e15
const integer = (v: unknown) => num(v) && Number.isInteger(v)
const strings = (v: unknown) => Array.isArray(v) && v.every((x) => str(x))
const one = (v: unknown, values: readonly unknown[]) => values.includes(v)
const option = (v: unknown) => one(v, ['A', 'B', 'C', 'D'])
const confidence = (v: unknown) => v === null || one(v, [1, 2, 3])
const skillList = (v: unknown) =>
  strings(v) &&
  (v as string[]).length > 0 &&
  (v as string[]).every((s) => Object.hasOwn(SKILL_LABELS, s))
const kinds = ['daily', 'practice', 'review', 'tutor', 'mini-exam']
const optional = (row: Record<string, unknown>, key: string, validate: (v: unknown) => boolean) =>
  row[key] === undefined || validate(row[key])
const source = (v: unknown) => one(v, ['explicit', 'not-provided', 'legacy-unspecified'])
const origin = (v: unknown) => one(v, ['at-answer', 'legacy-current-content'])
function questionSnapshot(v: unknown) {
  if (
    !isObject(v) ||
    !one(v.part, [1, 2, 3, 4, 5, 6, 7]) ||
    !skillList(v.skills) ||
    !option(v.correctOption) ||
    !one(v.difficulty, ['foundation', 'intermediate', 'advanced']) ||
    !str(v.revision) ||
    !origin(v.origin)
  )
    return false
  if (v.part === 2 && v.correctOption === 'D') return false
  if (v.content !== undefined) {
    const q = v.content
    if (
      !isObject(q) ||
      !str(q.id) ||
      q.schemaVersion !== 1 ||
      q.part !== v.part ||
      q.answer !== v.correctOption ||
      !str(q.prompt, 20_000) ||
      !str(q.explanation, 20_000) ||
      !str(q.takeaway, 5000) ||
      !skillList(q.skills) ||
      !strings(q.grammarIds) ||
      !strings(q.vocabularyIds) ||
      !Array.isArray(q.options) ||
      q.options.length < 3 ||
      q.options.length > 4 ||
      q.options.some(
        (o) => !isObject(o) || !option(o.id) || !str(o.text, 5000) || !str(o.reasoning, 10_000),
      ) ||
      !isObject(q.provenance) ||
      !str(q.provenance.revision)
    )
      return false
    if (
      q.evidence !== undefined &&
      (![6, 7].includes(Number(q.part)) ||
        !Array.isArray(q.evidence) ||
        q.evidence.length > 20 ||
        q.evidence.some(
          (e) =>
            !isObject(e) || !str(e.passageId) || !str(e.quote, 10000) || !str(e.explanation, 10000),
        ))
    )
      return false
    const expected = q.part === 2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']
    const options = q.options as Record<string, unknown>[]
    if (
      options.length !== expected.length ||
      expected.some((id) => options.filter((o) => o.id === id).length !== 1) ||
      q.difficulty !== v.difficulty ||
      q.provenance.revision !== v.revision ||
      JSON.stringify([...(q.skills as string[])].sort()) !==
        JSON.stringify([...(v.skills as string[])].sort())
    )
      return false
  }
  return true
}
function grammarReference(v: unknown) {
  return (
    isObject(v) &&
    str(v.lessonId) &&
    str(v.exerciseId) &&
    str(v.prompt, 20_000) &&
    option(v.answer) &&
    option(v.selected) &&
    str(v.revision) &&
    str(v.explanation, 20_000) &&
    Array.isArray(v.options) &&
    v.options.length >= 3 &&
    v.options.length <= 4 &&
    v.options.every(
      (o) => isObject(o) && option(o.id) && str(o.text, 5000) && str(o.explanation, 10_000),
    )
  )
}
function schedulerState(v: unknown) {
  return (
    isObject(v) &&
    schedulableCard({
      id: 'validation',
      kind: 'knowledge',
      contentId: 'validation',
      dueAt: 0,
      intervalDays: 0,
      ease: 2.5,
      repetitions: 0,
      lapses: 0,
      createdAt: 0,
      lastReviewedAt: v.lastReviewAt as number | undefined,
      scheduler: v as unknown as NonNullable<ReviewCard['scheduler']>,
    })
  )
}
function guidance(v: unknown) {
  return (
    isObject(v) &&
    v.schemaVersion === 1 &&
    str(v.providerId) &&
    str(v.questionId) &&
    str(v.contentRevision) &&
    (v.lessonId === null || str(v.lessonId)) &&
    (v.lessonRevision === null || str(v.lessonRevision)) &&
    (v.reasonId === null || str(v.reasonId)) &&
    one(v.basis, ['selected-reason', 'answer-reference']) &&
    str(v.observation, 2400) &&
    str(v.followUp, 2400) &&
    isObject(v.sections) &&
    ['simple', 'steps', 'distractors', 'example', 'check'].every((mode) => {
      const s = (v.sections as Record<string, unknown>)[mode]
      return (
        isObject(s) &&
        str(s.title, 2400) &&
        Array.isArray(s.paragraphs) &&
        s.paragraphs.length > 0 &&
        s.paragraphs.length <= 8 &&
        s.paragraphs.every((p) => str(p, 2400)) &&
        optional(
          s,
          'steps',
          (steps) => Array.isArray(steps) && steps.length <= 12 && steps.every((p) => str(p, 2400)),
        )
      )
    })
  )
}

/** Shared untrusted-record boundary for import and live reads. Never rewrites original values. */
export function validRecord(table: LearningTable, value: unknown): boolean {
  if (!isObject(value) || !str(value.id) || value.id === '__proto__' || value.id === 'constructor')
    return false
  const r = value
  switch (table) {
    case 'preferences':
      return (
        r.id === 'preferences' &&
        one(r.dailyGoal, [3, 6, 9, 12]) &&
        one(r.studyMinutes, [10, 20, 40]) &&
        validScore(r.targetScore) &&
        one(r.theme, ['system', 'light', 'dark']) &&
        optional(r, 'learningProfile', validLearningProfile) &&
        optional(r, 'vocabularyReminder', validVocabularyReminder)
      )
    case 'sessions':
      return (
        one(r.kind, kinds) &&
        one(r.mode, ['study', 'exam']) &&
        strings(r.questionIds) &&
        (r.questionIds as string[]).length > 0 &&
        new Set(r.questionIds as string[]).size === (r.questionIds as string[]).length &&
        integer(r.cursor) &&
        (r.cursor as number) < (r.questionIds as string[]).length &&
        one(r.status, ['active', 'completed', 'interrupted']) &&
        (r.status !== 'interrupted' ||
          (stamp(r.interruptedAt) &&
            one(r.interruptionReason, ['content-unavailable', 'app-update']))) &&
        stamp(r.startedAt) &&
        optional(r, 'completedAt', stamp) &&
        (r.mode !== 'exam' || stamp(r.deadlineAt)) &&
        optional(r, 'lastObservedAt', stamp) &&
        optional(r, 'dailyPlanId', str) &&
        optional(r, 'mockExamId', str) &&
        optional(r, 'readingStarted', (v) => typeof v === 'boolean')
      )
    case 'attempts':
      return (
        str(r.sessionId) &&
        str(r.questionId) &&
        r.id === `${r.sessionId}:${r.questionId}` &&
        (r.selected === null || option(r.selected)) &&
        typeof r.correct === 'boolean' &&
        confidence(r.confidence) &&
        optional(r, 'confidenceSource', source) &&
        stamp(r.occurredAt) &&
        one(r.source, kinds) &&
        optional(r, 'mode', (v) => one(v, ['study', 'exam'])) &&
        optional(r, 'timeSpentMs', (v) => v === null || num(v)) &&
        optional(r, 'questionSnapshot', questionSnapshot) &&
        (!isObject(r.questionSnapshot) ||
          r.questionSnapshot.origin !== 'at-answer' ||
          (r.correct === (r.selected === r.questionSnapshot.correctOption) &&
            !(r.questionSnapshot.part === 2 && r.selected === 'D'))) &&
        (!isObject(r.questionSnapshot) ||
          !isObject(r.questionSnapshot.content) ||
          r.questionSnapshot.content.id === r.questionId)
      )
    case 'cards':
      return (
        one(r.kind, ['question', 'vocabulary', 'knowledge']) &&
        str(r.contentId) &&
        r.id === `${r.kind}:${r.contentId}` &&
        schedulableCard(r as unknown as ReviewCard)
      )
    case 'reviewEvents':
      return (
        str(r.cardId) &&
        one(r.grade, [1, 3, 4, 5]) &&
        stamp(r.occurredAt) &&
        stamp(r.nextDueAt) &&
        optional(r, 'previousDueAt', stamp) &&
        optional(r, 'before', schedulerState) &&
        optional(r, 'after', schedulerState) &&
        optional(r, 'source', (v) =>
          one(v, [
            'question-review',
            'practice-retrieval',
            'practice-error',
            'vocabulary-recall',
            'knowledge-recall',
            'legacy',
          ]),
        ) &&
        optional(r, 'algorithm', (v) => one(v, ['ts-fsrs-5.4.2', 'legacy-sm2'])) &&
        optional(r, 'ratingSource', (v) =>
          one(v, ['answer-and-confidence', 'answer', 'self-report', 'legacy']),
        )
      )
    case 'reflections':
      return (
        r.id === r.attemptId &&
        str(r.questionId) &&
        str(r.reasoning, 2000) &&
        stamp(r.createdAt) &&
        optional(r, 'transferSessionId', str) &&
        optional(
          r,
          'tutor',
          (v) =>
            isObject(v) &&
            v.schemaVersion === 1 &&
            integer(v.revision) &&
            str(v.explanationId) &&
            optional(v, 'revisionId', str) &&
            stamp(v.updatedAt),
        )
      )
    case 'responses':
      return (
        str(r.sessionId) &&
        str(r.questionId) &&
        r.id === `${r.sessionId}:${r.questionId}` &&
        option(r.selected) &&
        stamp(r.updatedAt)
      )
    case 'playbacks':
      return (
        str(r.sessionId) &&
        str(r.stimulusId) &&
        r.id === `${r.sessionId}:${r.stimulusId}` &&
        str(r.token) &&
        one(r.status, ['started', 'completed', 'failed']) &&
        integer(r.playCount) &&
        typeof r.assisted === 'boolean' &&
        stamp(r.updatedAt) &&
        optional(r, 'error', (v) => one(v, ['media', 'interrupted', 'skipped']))
      )
    case 'recentSearches':
      return str(r.query, 200) && stamp(r.lastUsedAt)
    case 'studyDrafts':
      return (
        str(r.sessionId) &&
        str(r.questionId) &&
        r.id === `${r.sessionId}:${r.questionId}` &&
        (r.selected === null || option(r.selected)) &&
        confidence(r.confidence) &&
        optional(r, 'confidenceSource', source) &&
        stamp(r.updatedAt)
      )
    case 'skillEvidence':
      return (
        str(r.attemptId) &&
        str(r.questionId) &&
        (r.sessionId === null || str(r.sessionId)) &&
        str(r.skillId) &&
        Object.hasOwn(SKILL_LABELS, r.skillId as string) &&
        r.id === `${r.attemptId}:${r.skillId}` &&
        (r.part === null || one(r.part, [1, 2, 3, 4, 5, 6, 7])) &&
        (r.difficulty === null || one(r.difficulty, ['foundation', 'intermediate', 'advanced'])) &&
        one(r.outcome, ['correct', 'incorrect', 'omitted']) &&
        stamp(r.occurredAt) &&
        confidence(r.confidence) &&
        (r.timeSpentMs === null || num(r.timeSpentMs)) &&
        origin(r.origin) &&
        optional(r, 'source', (v) => one(v, ['question', 'grammar-practice'])) &&
        optional(r, 'reference', grammarReference) &&
        (r.source !== 'grammar-practice' || grammarReference(r.reference))
      )
    case 'mistakes':
      return (
        (r.sessionId === null || str(r.sessionId)) &&
        str(r.questionId) &&
        skillList(r.skills) &&
        (r.selected === null || option(r.selected)) &&
        option(r.correctOption) &&
        stamp(r.occurredAt) &&
        confidence(r.confidence) &&
        (r.timeSpentMs === null || num(r.timeSpentMs)) &&
        str(r.revision) &&
        origin(r.origin) &&
        typeof r.omitted === 'boolean' &&
        optional(r, 'reference', grammarReference)
      )
    case 'mistakeAnnotations':
      return (
        one(r.category, [
          'knowledge-gap',
          'misapplied-rule',
          'possible-guess',
          'time-pressure',
          'unclassified',
          'sentence-structure',
          'vocabulary-confusion',
          'misheard',
          'distractor-confusion',
        ]) && stamp(r.updatedAt)
      )
    case 'readingWorkspaces':
    case 'learningActivities':
    case 'vocabularyContexts':
      return validStudioRecord(table, r)
    case 'contentFeedback': {
      const q = r.snapshot
      return (
        isObject(q) &&
        isObject(q.provenance) &&
        q.id === r.questionId &&
        q.provenance.revision === r.contentRevision &&
        questionSnapshot({
          content: q,
          part: q.part,
          correctOption: q.answer,
          difficulty: q.difficulty,
          skills: q.skills,
          revision: r.contentRevision,
          origin: 'at-answer',
        }) &&
        r.fingerprint === questionFingerprint(q as unknown as Question) &&
        Object.hasOwn(FEEDBACK_CATEGORIES, String(r.category)) &&
        str(r.detail, 2000) &&
        stamp(r.createdAt) &&
        stamp(r.updatedAt) &&
        (r.updatedAt as number) >= (r.createdAt as number) &&
        integer(r.revision) &&
        one(r.status, ['open', 'triaged', 'resolved', 'dismissed']) &&
        Array.isArray(r.history) &&
        r.history.length <= 100 &&
        r.history.length > 0 &&
        r.revision === r.history.length &&
        r.history[0]?.status === 'open' &&
        r.history[0]?.at === r.createdAt &&
        r.history.every(
          (e) =>
            isObject(e) &&
            one(e.status, ['open', 'triaged', 'resolved', 'dismissed']) &&
            typeof e.note === 'string' &&
            e.note.length <= 2000 &&
            stamp(e.at),
        ) &&
        r.history.at(-1)?.status === r.status &&
        r.history.at(-1)?.at === r.updatedAt
      )
    }
    case 'questionTimings':
      return (
        str(r.sessionId) &&
        str(r.questionId) &&
        r.id === `${r.sessionId}:${r.questionId}` &&
        num(r.elapsedMs) &&
        stamp(r.updatedAt)
      )
    case 'dailyPlans':
      return (
        r.version === 1 &&
        stamp(r.createdAt) &&
        one(r.minutes, [10, 20, 40]) &&
        one(r.goal, [3, 6, 9, 12]) &&
        num(r.estimatedSeconds) &&
        strings(r.cardIds) &&
        strings(r.questionIds) &&
        Array.isArray(r.reasons) &&
        r.reasons.every((v) => isObject(v) && str(v.contentId) && str(v.text, 5000)) &&
        strings(r.summary) &&
        one(r.timingBasis, ['content-estimate', 'observed-and-content']) &&
        one(r.status, ['active', 'completed', 'archived']) &&
        optional(r, 'practiceSessionId', str) &&
        optional(r, 'completedAt', stamp)
      )
    case 'tutorTurns':
      return (
        str(r.reflectionId) &&
        stamp(r.createdAt) &&
        str(r.text, 2000) &&
        (r.kind === 'legacy-explanation' ||
          (r.kind === 'explanation' &&
            (r.reasonId === null || str(r.reasonId)) &&
            guidance(r.guidance)) ||
          (r.kind === 'revision' &&
            str(r.explanationId) &&
            one(r.stance, ['changed', 'confirmed', 'uncertain'])))
      )
    case 'tutorDrafts':
      return (
        str(r.reflectionId) &&
        one(r.phase, ['explanation', 'revision']) &&
        integer(r.baseRevision) &&
        integer(r.version) &&
        (r.version as number) > 0 &&
        typeof r.text === 'string' &&
        r.text.length <= 2000 &&
        (r.reasonId === null || str(r.reasonId)) &&
        one(r.stance, ['changed', 'confirmed', 'uncertain']) &&
        stamp(r.updatedAt) &&
        optional(r, 'recoveryOf', str) &&
        optional(r, 'ownerId', str)
      )
  }
}
export function inspectLearningData(input: LearningData) {
  const data = emptyLearningData(),
    invalid: InvalidRecord[] = []
  for (const table of LEARNING_TABLES) {
    const seen = new Set<string>()
    for (const [index, record] of (input[table] as unknown[]).entries()) {
      const key = isObject(record) && typeof record.id === 'string' ? record.id : `row-${index}`
      if (!validRecord(table, record) || seen.has(key))
        invalid.push({
          table,
          key,
          record,
          reasons: [
            seen.has(key) ? 'ID trùng trong bảng.' : 'Cấu trúc hoặc giá trị bản ghi không hợp lệ.',
          ],
        })
      else {
        seen.add(key)
        ;(data[table] as unknown[]).push(record)
      }
    }
  }
  const sessions = new Map(data.sessions.map((s) => [s.id, s]))
  let attempts = new Map(data.attempts.map((a) => [a.id, a]))
  for (const table of [
    'attempts',
    'responses',
    'studyDrafts',
    'playbacks',
    'questionTimings',
    'reflections',
    'skillEvidence',
    'mistakes',
    'tutorTurns',
    'tutorDrafts',
  ] as const) {
    data[table] = (data[table] as unknown[]).filter((value) => {
      const r = value as unknown as Record<string, unknown>
      const session = typeof r.sessionId === 'string' ? sessions.get(r.sessionId) : undefined
      let valid = !(
        typeof r.sessionId === 'string' &&
        (!session ||
          (typeof r.questionId === 'string' && !session.questionIds.includes(r.questionId)))
      )
      const attempt = attempts.get((r.attemptId ?? r.reflectionId ?? r.id) as string)
      if (table === 'reflections') valid &&= !!attempt && attempt.questionId === r.questionId
      if (table === 'skillEvidence' && r.source !== 'grammar-practice')
        valid &&=
          !!attempt &&
          attempt.questionId === r.questionId &&
          attempt.sessionId === r.sessionId &&
          r.outcome ===
            (attempt.selected === null ? 'omitted' : attempt.correct ? 'correct' : 'incorrect')
      if (table === 'skillEvidence' && r.source === 'grammar-practice' && isObject(r.reference))
        valid &&=
          r.outcome === (r.reference.selected === r.reference.answer ? 'correct' : 'incorrect')
      if (table === 'mistakes' && !r.reference)
        valid &&=
          !!attempt &&
          !attempt.correct &&
          attempt.questionId === r.questionId &&
          attempt.selected === r.selected &&
          attempt.sessionId === r.sessionId
      if (table === 'tutorDrafts' || table === 'tutorTurns')
        valid &&= attempts.has(r.reflectionId as string)
      if (table === 'tutorTurns' && r.kind === 'explanation' && isObject(r.guidance))
        valid &&=
          !!attempt &&
          r.guidance.questionId === attempt.questionId &&
          r.guidance.reasonId === r.reasonId &&
          (!attempt.questionSnapshot ||
            r.guidance.contentRevision === attempt.questionSnapshot.revision)
      if (!valid)
        invalid.push({
          table,
          key: r.id as string,
          record: value,
          reasons: ['Bản ghi phụ thuộc phiên hoặc lượt trả lời không còn hợp lệ.'],
        })
      return valid
    }) as never
    if (table === 'attempts') attempts = new Map(data.attempts.map((a) => [a.id, a]))
  }
  const turns = new Map(data.tutorTurns.map((turn) => [turn.id, turn]))
  data.learningActivities = data.learningActivities.filter((row) => {
    if (row.kind !== 'correction') return true
    const original = attempts.get(row.contentId)
    const valid =
      original &&
      !original.correct &&
      (!original.questionSnapshot ||
        row.correct === (row.selected === original.questionSnapshot.correctOption))
    if (!valid)
      invalid.push({
        table: 'learningActivities',
        key: row.id,
        record: row,
        reasons: ['Lượt sửa lỗi không khớp lượt trả lời gốc.'],
      })
    return Boolean(valid)
  })
  data.reflections = data.reflections.filter((reflection) => {
    const state = reflection.tutor
    if (!state) return true
    const explanation = turns.get(state.explanationId)
    const revision = state.revisionId ? turns.get(state.revisionId) : undefined
    const valid =
      explanation?.kind === 'explanation' &&
      explanation.reflectionId === reflection.id &&
      (!state.revisionId ||
        (revision?.kind === 'revision' &&
          revision.reflectionId === reflection.id &&
          revision.explanationId === state.explanationId))
    if (!valid)
      invalid.push({
        table: 'reflections',
        key: reflection.id,
        record: reflection,
        reasons: ['Liên kết lượt giải thích hoặc viết lại của Tutor không hợp lệ.'],
      })
    return valid
  })
  return { data, invalid }
}
