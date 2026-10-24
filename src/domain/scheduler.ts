import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import type { Confidence, ReviewCard, ReviewEvent, ReviewGrade, SchedulerState } from './models'

export const SCHEDULER_ID = 'ts-fsrs-5.4.2' as const
export const SCHEDULER_PARAMETERS = 'study990-fsrs-v1' as const
// Population defaults, not individual calibration. No retrievability is exposed to users.
const scheduler = fsrs({
  enable_fuzz: false,
  enable_short_term: true,
  learning_steps: ['10m'],
  relearning_steps: ['10m'],
  request_retention: 0.9,
  maximum_interval: 36_500,
})
export const schedulerPolicy = {
  implementation: SCHEDULER_ID,
  id: SCHEDULER_PARAMETERS,
  calibration: 'population-defaults',
  configuration: { ...scheduler.parameters, w: [...scheduler.parameters.w] },
} as const
const rating = { 1: Rating.Again, 3: Rating.Hard, 4: Rating.Good, 5: Rating.Easy } as const
const validTimestamp = (value: number) => Number.isFinite(value) && value >= 0 && value <= 8.64e15

export function schedulableCard(card: ReviewCard) {
  const state = card.scheduler
  return (
    [card.dueAt, card.createdAt].every(validTimestamp) &&
    [card.intervalDays, card.lapses, card.repetitions, card.ease].every(Number.isFinite) &&
    card.ease >= 1.3 &&
    card.intervalDays >= 0 &&
    (card.lastReviewedAt === undefined || validTimestamp(card.lastReviewedAt)) &&
    (card.firstEncounterAt === undefined || validTimestamp(card.firstEncounterAt)) &&
    Number.isInteger(card.lapses) &&
    card.lapses >= 0 &&
    Number.isInteger(card.repetitions) &&
    card.repetitions >= 0 &&
    (!state ||
      (state.algorithm === SCHEDULER_ID &&
        state.parameters === SCHEDULER_PARAMETERS &&
        [0, 1, 2, 3].includes(state.state) &&
        [
          state.stability,
          state.difficulty,
          state.elapsedDays,
          state.scheduledDays,
          state.learningSteps,
          state.reps,
          state.lapses,
        ].every((n) => Number.isFinite(n) && n >= 0) &&
        state.difficulty <= 10 &&
        (state.state === 0 || (state.stability > 0 && Number.isFinite(state.lastReviewAt))) &&
        [state.learningSteps, state.reps, state.lapses].every(Number.isInteger) &&
        (state.lastReviewAt === undefined || validTimestamp(state.lastReviewAt)) &&
        (state.lastReviewAt === undefined || state.lastReviewAt === card.lastReviewedAt)))
  )
}
function inputCard(card: ReviewCard, now: number): Card {
  if (!schedulableCard(card) || !validTimestamp(now))
    throw new RangeError('Invalid scheduling state.')
  const s = card.scheduler
  // A legacy SM-2 ease value cannot be truthfully converted into FSRS stability.
  // Keep its due date until a real new review, then start conservatively with population defaults.
  return s
    ? {
        due: new Date(card.dueAt),
        stability: s.stability,
        difficulty: s.difficulty,
        elapsed_days: s.elapsedDays,
        scheduled_days: s.scheduledDays,
        learning_steps: s.learningSteps,
        reps: s.reps,
        lapses: s.lapses,
        state: s.state,
        last_review: s.lastReviewAt === undefined ? undefined : new Date(s.lastReviewAt),
      }
    : createEmptyCard(new Date(now))
}
function serialize(card: Card): SchedulerState {
  return {
    algorithm: SCHEDULER_ID,
    parameters: SCHEDULER_PARAMETERS,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReviewAt: card.last_review?.getTime(),
  }
}
export function newCard(kind: ReviewCard['kind'], contentId: string, now: number): ReviewCard {
  return {
    id: `${kind}:${contentId}`,
    kind,
    contentId,
    dueAt: now,
    intervalDays: 0,
    ease: 2.5,
    repetitions: 0,
    lapses: 0,
    createdAt: now,
    firstEncounterAt: now,
  }
}
export function scheduleReview(card: ReviewCard, grade: ReviewGrade, now: number): ReviewCard {
  if (![1, 3, 4, 5].includes(grade)) throw new RangeError('Invalid recall rating.')
  if (now < card.createdAt || (card.lastReviewedAt !== undefined && now < card.lastReviewedAt))
    throw new RangeError('Review clock moved backwards.')
  const result = scheduler.next(inputCard(card, now), new Date(now), rating[grade]).card
  return {
    ...card,
    firstEncounterAt: card.firstEncounterAt ?? card.createdAt,
    scheduler: serialize(result),
    dueAt: result.due.getTime(),
    intervalDays: (result.due.getTime() - now) / 86_400_000,
    repetitions: grade === 1 ? 0 : card.repetitions + 1,
    lapses: card.lapses + Math.max(0, result.lapses - (card.scheduler?.lapses ?? 0)),
    lastReviewedAt: now,
  }
}
/** Correctness is authoritative; optional confidence only refines the successful recall rating. */
export function gradeForAnswer(correct: boolean, confidence: Confidence | null): ReviewGrade {
  return correct ? (confidence === 1 ? 3 : confidence === 3 ? 5 : 4) : 1
}
export function makeReviewEvent(
  id: string,
  before: ReviewCard,
  after: ReviewCard,
  grade: ReviewGrade,
  now: number,
  source: NonNullable<ReviewEvent['source']>,
  ratingSource: NonNullable<ReviewEvent['ratingSource']>,
): ReviewEvent {
  return {
    id,
    cardId: before.id,
    grade,
    occurredAt: now,
    previousDueAt: before.dueAt,
    nextDueAt: after.dueAt,
    before: before.scheduler,
    after: after.scheduler,
    algorithm: SCHEDULER_ID,
    source,
    ratingSource,
  }
}
export function intervalLabel(dueAt: number, now: number) {
  const minutes = Math.max(1, Math.round((dueAt - now) / 60_000))
  if (minutes < 60) return `${minutes} phút`
  if (minutes < 1440) return `${Math.round(minutes / 60)} giờ`
  return `${Math.round(minutes / 1440)} ngày`
}
