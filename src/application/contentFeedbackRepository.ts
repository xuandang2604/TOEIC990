import type { Question } from '../content/schema'
import { questionFingerprint } from '../content/editorial'
import { db } from '../persistence/database'
import { validRecord } from '../persistence/records'
import { StudyOperationError } from './errors'
import type { ContentFeedback, FeedbackCategory } from '../domain/contentFeedback'

export async function reportContent(
  question: Question,
  category: FeedbackCategory,
  detail: string,
  operationId: string,
) {
  const now = Date.now()
  const row: ContentFeedback = {
    id: operationId,
    questionId: question.id,
    contentRevision: question.provenance.revision,
    fingerprint: questionFingerprint(question),
    snapshot: structuredClone(question),
    category,
    detail: detail.trim(),
    createdAt: now,
    updatedAt: now,
    revision: 1,
    status: 'open',
    history: [{ status: 'open', note: 'Learner report', at: now }],
  }
  if (!validRecord('contentFeedback', row))
    throw new StudyOperationError('Phản hồi cần nội dung mô tả hợp lệ, tối đa 2.000 ký tự.')
  await db.transaction('rw', db.contentFeedback, async () => {
    const previous = await db.contentFeedback.get(row.id)
    if (previous) {
      if (
        previous.questionId !== row.questionId ||
        previous.fingerprint !== row.fingerprint ||
        previous.category !== row.category ||
        previous.detail !== row.detail
      )
        throw new StudyOperationError('Mã phản hồi đã được dùng cho nội dung khác.')
      return
    }
    await db.contentFeedback.add(row)
  })
}
