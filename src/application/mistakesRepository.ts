import { db } from '../persistence/database'
import type { ErrorCategory } from '../domain/models'
import { StudyOperationError } from './errors'

export const ERROR_CATEGORIES: { id: ErrorCategory; label: string }[] = [
  { id: 'unclassified', label: 'Chưa rõ / không ghi nhận' },
  { id: 'knowledge-gap', label: 'Mình chưa biết kiến thức này' },
  { id: 'misapplied-rule', label: 'Mình biết nhưng áp dụng nhầm' },
  { id: 'sentence-structure', label: 'Mình hiểu nhầm cấu trúc câu' },
  { id: 'vocabulary-confusion', label: 'Mình nhầm nghĩa hoặc cách dùng từ' },
  { id: 'misheard', label: 'Mình nghe nhầm thông tin' },
  { id: 'distractor-confusion', label: 'Mình nhầm bẫy / cách diễn đạt tương đương' },
  { id: 'possible-guess', label: 'Mình đã đoán lựa chọn' },
  { id: 'time-pressure', label: 'Mình gặp áp lực thời gian' },
]
export async function annotateMistake(attemptId: string, category: ErrorCategory) {
  if (!ERROR_CATEGORIES.some((c) => c.id === category))
    throw new StudyOperationError('Phân loại lỗi không hợp lệ.')
  await db.transaction('rw', [db.mistakes, db.mistakeAnnotations], async () => {
    if (!(await db.mistakes.get(attemptId)))
      throw new StudyOperationError('Lượt sai này không còn khả dụng.')
    await db.mistakeAnnotations.put({ id: attemptId, category, updatedAt: Date.now() })
  })
}
