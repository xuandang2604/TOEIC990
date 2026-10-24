import { db } from '../../persistence/database'
import { validRecord } from '../../persistence/records'
import { StudyOperationError } from '../../application/errors'
import type { FeedbackStatus } from '../../domain/contentFeedback'
export async function reviewFeedback(
  id: string,
  status: FeedbackStatus,
  note: string,
  expectedRevision: number,
) {
  if (
    !['open', 'triaged', 'resolved', 'dismissed'].includes(status) ||
    !note.trim() ||
    note.length > 2000
  )
    throw new StudyOperationError('Chọn trạng thái và ghi rõ kết luận biên tập.')
  await db.transaction('rw', db.contentFeedback, async () => {
    const row = await db.contentFeedback.get(id)
    if (!row || !validRecord('contentFeedback', row) || row.revision !== expectedRevision)
      throw new StudyOperationError(
        'Phản hồi đã đổi ở tab khác hoặc không hợp lệ; tải lại danh sách.',
      )
    const now = Date.now()
    const next = {
      ...row,
      status,
      revision: row.revision + 1,
      updatedAt: now,
      history: [...row.history, { status, note: note.trim(), at: now }],
    }
    if (!validRecord('contentFeedback', next))
      throw new StudyOperationError('Không lưu được lịch sử phản hồi hợp lệ.')
    await db.contentFeedback.put(next)
  })
}
