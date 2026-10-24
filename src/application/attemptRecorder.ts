import type { Attempt } from '../domain/models'
import { gradeForAnswer, newCard } from '../domain/learning'
import { makeReviewEvent, schedulableCard, scheduleReview } from '../domain/scheduler'
import { captureEvidence } from '../domain/evidence'
import { questionById } from '../content/questions'
import { db } from '../persistence/database'
import { StudyOperationError } from './errors'

/** Caller owns attempts/cards/reviewEvents/skillEvidence/mistakes in one transaction. */
export async function recordAttempt(input: Attempt, recall: boolean) {
  const question = questionById.get(input.questionId)
  if (
    !question ||
    input.id !== `${input.sessionId}:${input.questionId}` ||
    (input.selected !== null && !question.options.some((o) => o.id === input.selected)) ||
    input.correct !== (input.selected === question.answer) ||
    !Number.isFinite(input.occurredAt) ||
    (input.timeSpentMs != null && (!Number.isFinite(input.timeSpentMs) || input.timeSpentMs < 0))
  )
    throw new StudyOperationError('Bản ghi trả lời không hợp lệ. Không có thay đổi nào được lưu.')
  const captured = captureEvidence({ ...input, questionSnapshot: undefined }, question)
  const attempt = captured.attempt
  await db.attempts.add(attempt)
  await db.skillEvidence.bulkAdd(captured.evidence)
  if (captured.mistake) await db.mistakes.add(captured.mistake)
  const cardId = `question:${attempt.questionId}`
  const card = await db.cards.get(cardId)
  if (card && !schedulableCard(card))
    throw new StudyOperationError(
      'Lịch ôn của câu này không hợp lệ. Bản ghi hiện có được giữ nguyên.',
    )
  if (
    card &&
    (attempt.occurredAt < card.createdAt ||
      (card.lastReviewedAt !== undefined && attempt.occurredAt < card.lastReviewedAt))
  )
    throw new StudyOperationError(
      'Đồng hồ thiết bị đang lùi so với lịch ôn. Chỉnh lại thời gian rồi thử lại.',
    )
  if (attempt.selected === null) {
    await db.cards.put({
      ...(card ?? newCard('question', attempt.questionId, attempt.occurredAt)),
      dueAt: attempt.occurredAt,
    })
    return
  }
  if (!card && attempt.correct) return
  const before = card ?? newCard('question', attempt.questionId, attempt.occurredAt)
  const confidence = attempt.confidenceSource === 'explicit' ? attempt.confidence : null
  const grade = gradeForAnswer(attempt.correct, confidence)
  const updated = scheduleReview(before, grade, attempt.occurredAt)
  await db.cards.put(updated)
  await db.reviewEvents.add(
    makeReviewEvent(
      attempt.id,
      before,
      updated,
      grade,
      attempt.occurredAt,
      recall ? 'question-review' : card ? 'practice-retrieval' : 'practice-error',
      confidence === null ? 'answer' : 'answer-and-confidence',
    ),
  )
}
