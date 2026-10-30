import { db } from '../persistence/database'
import { recommendDailyPlan } from '../domain/adaptivePlan'
import type { DailyPlan, StudyMinutes } from '../domain/models'
import { vocabularyById } from '../content/vocabulary'
import { grammarById } from '../content/grammar'
import { questionById, stimuli } from '../content/questions'
import { learningQuestionPool } from './learningQuestionPool'
import { readStudyData, startSession, type StudyData } from './studyRepository'
import { StudyOperationError } from './errors'
import { learningRoadmap, validLearningProfile } from '../domain/roadmap'
import { curriculumProgress, nextCurriculumFocus, curriculumPool } from '../domain/curriculum'
import { makeUnits } from '../domain/assessment'
import { schedulableCard } from '../domain/scheduler'
import { sourceReviewParts } from '../domain/sourcePractice'

export function plannedCurriculumFocus(data: StudyData, now: number) {
  if (data.preferences.targetScore < 900) return null
  const roadmap = learningRoadmap(data.preferences, data.skillEvidence, now)
  return roadmap
    ? nextCurriculumFocus(
        curriculumProgress(learningQuestionPool(data.sessions), stimuli, data.attempts, now),
        roadmap.current.id,
        sourceReviewParts(data.learningActivities, now),
      )
    : null
}

export function adaptiveRecommendation(data: StudyData, minutes: StudyMinutes, now: number) {
  const questions = learningQuestionPool(data.sessions)
  const cards = data.cards.filter((c) =>
    c.kind === 'vocabulary'
      ? vocabularyById.has(c.contentId)
      : c.kind === 'knowledge'
        ? grammarById.has(c.contentId)
        : questionById.has(c.contentId),
  )
  const focus = plannedCurriculumFocus(data, now)
  const structured =
    data.preferences.targetScore >= 900 && validLearningProfile(data.preferences.learningProfile)
  let pool = questions
  if (structured) {
    const selected = new Set(
      focus
        ? curriculumPool(focus.unit, questions, stimuli).questions.map((question) => question.id)
        : [],
    )
    const due = new Set(
      cards
        .filter((card) => card.kind === 'question' && schedulableCard(card) && card.dueAt <= now)
        .map((card) => card.contentId),
    )
    for (const group of makeUnits(questions))
      if (group.questionIds.some((id) => due.has(id)))
        group.questionIds.forEach((id) => selected.add(id))
    pool = questions.filter((question) => selected.has(question.id))
  }
  const plan = recommendDailyPlan(
    {
      ...data,
      cards,
      questions: pool,
      stimuli,
      priorityParts: focus?.unit.id === 'diagnostic' ? focus.unmetParts : undefined,
      reviewParts: sourceReviewParts(data.learningActivities, now),
    },
    minutes,
    now,
  )
  if (focus)
    plan.summary.unshift(
      `Chuyên đề ưu tiên: ${focus.unit.title}. Giữ nguyên nhóm câu và ôn câu đến hạn.`,
    )
  else if (structured)
    plan.summary.unshift(
      'Chưa có chuyên đề cần mở thêm lúc này. Ưu tiên ôn đến hạn; có thể mở sổ tay hoặc tự chọn bài trong lộ trình.',
    )
  return plan
}
export function planProgress(plan: DailyPlan, data: Pick<StudyData, 'reviewEvents' | 'sessions'>) {
  const reviewedIds = new Set(
    data.reviewEvents
      .filter((event) => event.occurredAt >= plan.createdAt && event.source !== 'practice-error')
      .map((event) => event.cardId),
  )
  const completedCards = plan.cardIds.filter((id) => reviewedIds.has(id))
  const session = data.sessions.find((s) => s.id === plan.practiceSessionId)
  return {
    completedCards,
    pendingCards: plan.cardIds.filter((id) => !reviewedIds.has(id)),
    session,
    done:
      completedCards.length === plan.cardIds.length &&
      (!plan.questionIds.length || session?.status === 'completed'),
  }
}
export async function startAdaptivePlan(minutes: StudyMinutes) {
  if (![10, 20, 40].includes(minutes))
    throw new StudyOperationError('Chọn kế hoạch 10, 20 hoặc 40 phút.')
  return db.transaction('rw', db.tables, async () => {
    const active = await db.sessions.where('status').equals('active').first()
    if (active) return { page: 'session', id: active.id }
    const previous = await db.dailyPlans.where('status').equals('active').first()
    if (previous) return { page: 'plan', id: previous.id }
    const data = await readStudyData()
    const recommendation = adaptiveRecommendation(data, minutes, Date.now())
    if (!recommendation.questionIds.length && !recommendation.cardIds.length)
      throw new StudyOperationError(
        'Chưa có nội dung mới hoặc thẻ đến hạn phù hợp. Bạn có thể tự chọn bài luyện tập hoặc quay lại sau.',
      )
    const plan: DailyPlan = { ...recommendation, id: crypto.randomUUID(), status: 'active' }
    await db.dailyPlans.add(plan)
    await db.preferences.put({ ...data.preferences, studyMinutes: minutes })
    return { page: 'plan', id: plan.id }
  })
}
export async function startPlanPractice(planId: string) {
  return db.transaction('rw', [db.dailyPlans, db.sessions], async () => {
    const plan = await db.dailyPlans.get(planId)
    if (!plan || plan.status !== 'active') throw new StudyOperationError('Kế hoạch không còn mở.')
    if (plan.practiceSessionId) {
      const previous = await db.sessions.get(plan.practiceSessionId)
      if (previous) return previous
      throw new StudyOperationError(
        'Phiên được liên kết đang thiếu. Kế hoạch hiện có được giữ nguyên.',
      )
    }
    const active = await db.sessions.where('status').equals('active').first()
    if (active) return active
    const session = await startSession('daily', plan.questionIds)
    const linked = { ...session, dailyPlanId: planId }
    await db.sessions.put(linked)
    await db.dailyPlans.put({ ...plan, practiceSessionId: session.id })
    return linked
  })
}
export async function finishDailyPlan(planId: string, archive = false) {
  await db.transaction('rw', [db.dailyPlans, db.sessions, db.reviewEvents], async () => {
    const plan = await db.dailyPlans.get(planId)
    if (!plan || plan.status !== 'active') return
    const sessions = await db.sessions.toArray(),
      reviewEvents = await db.reviewEvents.toArray()
    const progress = planProgress(plan, { sessions, reviewEvents })
    if (archive && progress.session?.status === 'active')
      throw new StudyOperationError(
        'Phiên câu hỏi còn đang mở. Hoàn thành phiên đó hoặc tiếp tục học sau trước khi kết thúc kế hoạch.',
      )
    if (!archive && !progress.done)
      throw new StudyOperationError('Kế hoạch vẫn còn mục chưa hoàn thành.')
    await db.dailyPlans.put({
      ...plan,
      status: archive ? 'archived' : 'completed',
      completedAt: Date.now(),
    })
  })
}
