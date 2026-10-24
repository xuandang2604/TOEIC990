import type { Attempt, ReviewEvent, StudySession } from './models'
import { localDayKey } from './learning'

/** Observable activity only: these milestones never change skill evidence or review scheduling. */
export function learningMilestones(
  attempts: Attempt[],
  events: ReviewEvent[],
  sessions: StudySession[],
) {
  const answered = attempts.filter((a) => a.selected !== null)
  const recalled = events.filter(
    (e) => e.source === 'vocabulary-recall' || e.source === 'knowledge-recall',
  )
  const days = new Set([
    ...answered.map((a) => localDayKey(a.occurredAt)),
    ...recalled.map((e) => localDayKey(e.occurredAt)),
  ])
  return [
    {
      id: 'first-session',
      title: 'Phiên học đầu tiên',
      count: sessions.filter((s) => s.status === 'completed').length,
      target: 1,
      note: 'Đã hoàn thành và lưu kết quả.',
    },
    {
      id: 'ten-questions',
      title: '10 câu đã thử sức',
      count: new Set(answered.map((a) => a.questionId)).size,
      target: 10,
      note: 'Tính câu khác nhau, có tự chọn đáp án.',
    },
    {
      id: 'ten-recalls',
      title: '10 lượt tự nhớ',
      count: recalled.length,
      target: 10,
      note: 'Lượt ôn từ hoặc kiến thức đã tự đánh giá.',
    },
    {
      id: 'five-days',
      title: '5 ngày dành cho việc học',
      count: days.size,
      target: 5,
      note: 'Không cần liên tiếp. Quay lại khi phù hợp với bạn.',
    },
  ].map((m) => ({ ...m, achieved: m.count >= m.target }))
}
