import {
  allQuestions,
  questionById,
  practiceQuestions as questions,
  stimuli,
} from '../content/questions'
import { vocabularyById } from '../content/vocabulary'
import { grammarById } from '../content/grammar'
import { schedulableCard, makeReviewEvent } from '../domain/scheduler'
import type { OptionId, Question } from '../content/schema'
import { newCard, scheduleReview } from '../domain/learning'
import { recommendDailyPlan } from '../domain/adaptivePlan'
import { sessionUnits } from '../domain/assessment'
import { recordAttempt } from './attemptRecorder'
import { finishQuestionTiming } from './timingRepository'
import {
  DEFAULT_PREFERENCES,
  type Confidence,
  type Preferences,
  type ReviewCard,
  type ReviewGrade,
} from '../domain/models'
import { db } from '../persistence/database'
import { StudyOperationError } from './errors'
import { emptyLearningData, inspectLearningData } from '../persistence/records'
import { textVersion } from '../domain/studio'
import { validScore } from '../domain/roadmap'

export async function readStudyData() {
  return db.transaction('r', db.tables, async () => {
    const [
      preferences,
      attempts,
      sessions,
      cards,
      reviewEvents,
      reflections,
      responses,
      playbacks,
      recentSearches,
      studyDrafts,
      skillEvidence,
      mistakes,
      mistakeAnnotations,
      dailyPlans,
      tutorTurns,
      readingWorkspaces,
      learningActivities,
      vocabularyContexts,
    ] = await Promise.all([
      db.preferences.get('preferences'),
      db.attempts.toArray(),
      db.sessions.toArray(),
      db.cards.toArray(),
      db.reviewEvents.toArray(),
      db.reflections.toArray(),
      db.responses.toArray(),
      db.playbacks.toArray(),
      db.recentSearches.orderBy('lastUsedAt').reverse().toArray(),
      db.studyDrafts.toArray(),
      db.skillEvidence.toArray(),
      db.mistakes.toArray(),
      db.mistakeAnnotations.toArray(),
      db.dailyPlans.toArray(),
      db.tutorTurns.toArray(),
      db.readingWorkspaces.toArray(),
      db.learningActivities.toArray(),
      db.vocabularyContexts.toArray(),
    ])
    const checked = inspectLearningData({
      ...emptyLearningData(),
      preferences: preferences ? [preferences] : [],
      attempts,
      sessions,
      cards,
      reviewEvents,
      reflections,
      responses,
      playbacks,
      recentSearches,
      studyDrafts,
      skillEvidence,
      mistakes,
      mistakeAnnotations,
      dailyPlans,
      tutorTurns,
      readingWorkspaces,
      learningActivities,
      vocabularyContexts,
    })
    const {
      preferences: validPreferences,
      questionTimings: _timings,
      tutorDrafts: _drafts,
      ...safe
    } = checked.data
    return {
      ...safe,
      preferences: validPreferences[0] ?? DEFAULT_PREFERENCES,
      invalidRecordCount: checked.invalid.length,
    }
  })
}
export type StudyData = Awaited<ReturnType<typeof readStudyData>>

export function dailyPlan(data: StudyData, now: number): Question[] {
  return recommendDailyPlan(
    { ...data, questions, stimuli },
    data.preferences.studyMinutes,
    now,
  ).questionIds.map((id) => questionById.get(id)!)
}

export { startSession } from './sessionRepository'

export async function saveStudyDraft(
  sessionId: string,
  questionId: string,
  patch: { selected?: OptionId; confidence?: Confidence | null },
) {
  const question = questionById.get(questionId)
  if (
    !question ||
    (patch.selected !== undefined && !question.options.some((o) => o.id === patch.selected)) ||
    (patch.confidence !== undefined &&
      patch.confidence !== null &&
      ![1, 2, 3].includes(patch.confidence))
  )
    throw new StudyOperationError('Lựa chọn nháp không hợp lệ.')
  await db.transaction('rw', [db.sessions, db.attempts, db.studyDrafts], async () => {
    const session = await db.sessions.get(sessionId)
    const id = `${sessionId}:${questionId}`
    if (
      !session ||
      session.mode !== 'study' ||
      session.status !== 'active' ||
      !session.questionIds.includes(questionId) ||
      (await db.attempts.get(id))
    )
      throw new StudyOperationError('Câu hỏi hoặc phiên học đã thay đổi. Hãy mở lại phiên học.')
    const previous = await db.studyDrafts.get(id)
    await db.studyDrafts.put({
      id,
      sessionId,
      questionId,
      selected: previous?.selected ?? null,
      confidence: previous?.confidence ?? null,
      confidenceSource:
        patch.confidence !== undefined
          ? patch.confidence === null
            ? 'not-provided'
            : 'explicit'
          : (previous?.confidenceSource ?? 'not-provided'),
      ...patch,
      updatedAt: Date.now(),
    })
  })
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  selected: OptionId,
  confidence: Confidence | null,
) {
  const question = questionById.get(questionId)
  if (confidence !== null && ![1, 2, 3].includes(confidence))
    throw new StudyOperationError('Mức độ tự tin không hợp lệ.')
  if (!question || !question.options.some((o) => o.id === selected))
    throw new StudyOperationError('Lựa chọn không hợp lệ.')
  return db.transaction(
    'rw',
    [
      db.sessions,
      db.attempts,
      db.cards,
      db.reviewEvents,
      db.studyDrafts,
      db.skillEvidence,
      db.mistakes,
      db.questionTimings,
      db.timingLeases,
    ],
    async () => {
      const session = await db.sessions.get(sessionId)
      if (
        !session ||
        session.mode !== 'study' ||
        session.status !== 'active' ||
        !sessionUnits(session, allQuestions)
          .find((unit) => unit.questionIds.includes(session.questionIds[session.cursor]))
          ?.questionIds.includes(questionId)
      )
        throw new StudyOperationError('Phiên học đã thay đổi. Vui lòng mở lại phiên đang học.')
      const id = `${sessionId}:${questionId}`
      const existing = await db.attempts.get(id)
      if (existing) return existing
      const now = Date.now()
      const attempt = {
        id,
        sessionId,
        questionId,
        selected,
        confidence,
        confidenceSource: confidence === null ? ('not-provided' as const) : ('explicit' as const),
        mode: session.mode,
        timeSpentMs: await finishQuestionTiming(sessionId, questionId, now),
        correct: selected === question.answer,
        occurredAt: now,
        source: session.kind,
      }
      const card = await db.cards.get(`question:${questionId}`)
      const isRecall =
        session.kind === 'review' || (session.kind === 'daily' && card && card.dueAt <= now)
      await recordAttempt(attempt, Boolean(isRecall))
      await db.studyDrafts.delete(id)
      return attempt
    },
  )
}

export async function advanceSession(sessionId: string, expectedQuestionId: string) {
  return db.transaction('rw', [db.sessions, db.attempts], async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) throw new StudyOperationError('Không tìm thấy phiên học.')
    if (session.mode !== 'study')
      throw new StudyOperationError('Phiên thi cần được nộp theo chế độ thi.')
    if (session.status !== 'active' || session.questionIds[session.cursor] !== expectedQuestionId)
      return session
    const units = sessionUnits(session, allQuestions)
    const current = units.findIndex((unit) => unit.questionIds.includes(expectedQuestionId))
    const currentUnit = units[current]
    if (!currentUnit) throw new StudyOperationError('Không tìm thấy nhóm câu hỏi.')
    const attempts = await db.attempts.bulkGet(
      currentUnit.questionIds.map((id) => `${sessionId}:${id}`),
    )
    if (attempts.some((a) => !a))
      throw new StudyOperationError('Hãy nộp các câu trong nhóm trước khi tiếp tục.')
    const allAttempts = await db.attempts.where('sessionId').equals(sessionId).toArray()
    const next = units
      .slice(current + 1)
      .find((unit) => unit.questionIds.some((id) => !allAttempts.some((a) => a.questionId === id)))
    const final = session.questionIds.every((id) => allAttempts.some((a) => a.questionId === id))
    const firstUnanswered = units.find((unit) =>
      unit.questionIds.some((id) => !allAttempts.some((a) => a.questionId === id)),
    )
    const updated = {
      ...session,
      cursor: final
        ? session.cursor
        : session.questionIds.indexOf((next ?? firstUnanswered)!.questionIds[0]),
      status: final ? ('completed' as const) : ('active' as const),
      ...(final ? { completedAt: Date.now() } : {}),
    }
    await db.sessions.put(updated)
    return updated
  })
}
export async function navigateStudyQuestion(sessionId: string, questionId: string) {
  return db.transaction('rw', db.sessions, async () => {
    const session = await db.sessions.get(sessionId)
    if (
      !session ||
      session.mode !== 'study' ||
      session.status !== 'active' ||
      !session.questionIds.includes(questionId)
    )
      throw new StudyOperationError('Không thể chuyển tới câu hỏi này.')
    await db.sessions.put({ ...session, cursor: session.questionIds.indexOf(questionId) })
  })
}

export async function saveCard(
  kind: ReviewCard['kind'],
  contentId: string,
  context?: { sentence: string; source: string },
) {
  if (
    !(kind === 'question'
      ? questionById.has(contentId)
      : kind === 'knowledge'
        ? grammarById.has(contentId)
        : vocabularyById.has(contentId))
  )
    throw new StudyOperationError('Không tìm thấy nội dung để lưu.')
  if (
    context &&
    (kind !== 'vocabulary' ||
      !context.sentence.trim() ||
      context.sentence.length > 1000 ||
      !context.source ||
      context.source.length > 500)
  )
    throw new StudyOperationError('Ngữ cảnh lưu từ không hợp lệ.')
  return db.transaction('rw', [db.cards, db.vocabularyContexts], async () => {
    const id = `${kind}:${contentId}`
    if (!(await db.cards.get(id))) await db.cards.add(newCard(kind, contentId, Date.now()))
    if (context) {
      const contextId = `${contentId}:${textVersion(context.source + '\n' + context.sentence)}`
      const previous = await db.vocabularyContexts.get(contextId)
      if (
        previous &&
        (previous.sentence !== context.sentence || previous.source !== context.source)
      )
        throw new StudyOperationError(
          'Ngữ cảnh trùng mã với một câu khác. Câu đã lưu vẫn được giữ nguyên.',
        )
      if (!previous)
        await db.vocabularyContexts.add({
          id: contextId,
          vocabularyId: contentId,
          ...context,
          createdAt: Date.now(),
        })
    }
  })
}

/** An idempotency token belongs to one revealed card, so double clicks cannot advance it twice. */
export async function rateRecallCard(
  cardId: string,
  grade: ReviewGrade,
  operationId: string,
  expectedDueAt: number,
) {
  if (
    ![1, 3, 4, 5].includes(grade) ||
    !operationId ||
    operationId.length > 128 ||
    !Number.isFinite(expectedDueAt)
  )
    throw new StudyOperationError('Đánh giá ôn tập không hợp lệ.')
  return db.transaction('rw', [db.cards, db.reviewEvents, db.sessions], async () => {
    const existing = await db.reviewEvents.get(operationId)
    if (existing) {
      if (existing.cardId !== cardId || existing.grade !== grade)
        throw new StudyOperationError('Lượt đánh giá đã thuộc một thao tác khác. Hãy mở lại thẻ.')
      return
    }
    if (
      await db.sessions
        .where('status')
        .equals('active')
        .filter((s) => s.mode === 'exam')
        .first()
    )
      throw new StudyOperationError('Hãy hoàn thành phiên thi trước khi ôn thẻ.')
    const card = await db.cards.get(cardId)
    if (!card || !['vocabulary', 'knowledge'].includes(card.kind))
      throw new StudyOperationError('Không tìm thấy thẻ ôn tập.')
    if (card.dueAt !== expectedDueAt)
      throw new StudyOperationError(
        'Thẻ này vừa được ôn ở cửa sổ khác. Hãy chuyển sang thẻ tiếp theo.',
      )
    const now = Date.now()
    if (!schedulableCard(card))
      throw new StudyOperationError(
        'Lịch ôn của thẻ không hợp lệ. Dữ liệu được giữ nguyên; hãy xuất bản sao để kiểm tra.',
      )
    if (now < card.createdAt || (card.lastReviewedAt !== undefined && now < card.lastReviewedAt))
      throw new StudyOperationError(
        'Đồng hồ thiết bị đang lùi so với lịch sử thẻ. Chỉnh lại thời gian rồi thử lại.',
      )
    const updated = scheduleReview(card, grade, now)
    await db.cards.put(updated)
    await db.reviewEvents.add(
      makeReviewEvent(
        operationId,
        card,
        updated,
        grade,
        now,
        card.kind === 'knowledge' ? 'knowledge-recall' : 'vocabulary-recall',
        'self-report',
      ),
    )
  })
}

export const rateVocabulary = rateRecallCard

export async function savePreferences(preferences: Preferences) {
  if (
    ![3, 6, 9, 12].includes(preferences.dailyGoal) ||
    !validScore(preferences.targetScore) ||
    !['system', 'light', 'dark'].includes(preferences.theme) ||
    ![10, 20, 40].includes(preferences.studyMinutes)
  )
    throw new StudyOperationError('Thiết lập không hợp lệ.')
  await db.transaction('rw', db.preferences, async () => {
    const current = (await db.preferences.get('preferences')) ?? DEFAULT_PREFERENCES
    // This form owns these four fields only; keep newer roadmap/reminder changes from other tabs.
    await db.preferences.put({
      ...current,
      id: 'preferences',
      dailyGoal: preferences.dailyGoal,
      targetScore: preferences.targetScore,
      theme: preferences.theme,
      studyMinutes: preferences.studyMinutes,
    })
  })
}

export { saveReflection, startTransfer } from './tutorRepository'

export async function exportStudyData() {
  const { exportBackup } = await import('../persistence/backup')
  return exportBackup(db)
}
