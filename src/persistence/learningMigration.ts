import type { Transaction } from 'dexie'
import { questionById } from '../content/questions'
import { captureEvidence } from '../domain/evidence'
import type { Attempt, ReviewCard, ReviewEvent, StudyDraft, StudySession } from '../domain/models'

/** One upgrade transaction. Do not reschedule, regrade or delete legacy learning records. */
export async function migrateLearningV4(tx: Transaction) {
  await tx
    .table('preferences')
    .toCollection()
    .modify((row) => {
      row.studyMinutes ??= 20
    })
  const sessions = new Map<string, StudySession>(
    (await tx.table('sessions').toArray()).map((s) => [s.id, s]),
  )
  const attempts: Attempt[] = await tx.table('attempts').toArray()
  for (const original of attempts) {
    const question = questionById.get(original.questionId)
    const mode = sessions.get(original.sessionId)?.mode ?? 'study'
    const attempt: Attempt = {
      ...original,
      mode,
      timeSpentMs: original.timeSpentMs ?? null,
      confidenceSource:
        mode !== 'exam' && [1, 3].includes(original.confidence ?? 0)
          ? 'explicit'
          : 'legacy-unspecified',
    }
    if (!question) {
      await tx.table('attempts').put(attempt)
      continue
    }
    const captured = captureEvidence(attempt, question, true)
    await tx.table('attempts').put(captured.attempt)
    await tx.table('skillEvidence').bulkPut(captured.evidence)
    if (captured.mistake) await tx.table('mistakes').put(captured.mistake)
  }
  await tx
    .table('cards')
    .toCollection()
    .modify((card: ReviewCard) => {
      card.firstEncounterAt ??= card.createdAt
    })
  await tx
    .table('reviewEvents')
    .toCollection()
    .modify((event: ReviewEvent) => {
      event.algorithm ??= 'legacy-sm2'
      event.source ??= 'legacy'
      event.ratingSource ??= 'legacy'
    })
  await tx
    .table('studyDrafts')
    .toCollection()
    .modify((draft: StudyDraft) => {
      draft.confidenceSource ??= [1, 3].includes(draft.confidence ?? 0)
        ? 'explicit'
        : 'legacy-unspecified'
    })
}
