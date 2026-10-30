import { useStudy } from '../../application/StudyContext'
import type { StudySession } from '../../domain/models'
import { questionById } from '../../content/questions'

export function ExamAnswerSheet({
  session,
  onSelect,
  disabled,
  currentId,
  review = false,
}: {
  session: StudySession
  onSelect: (id: string) => void
  disabled?: (id: string) => boolean
  currentId?: string
  review?: boolean
}) {
  const data = useStudy()
  const attempts = new Map(
    data.attempts.filter((a) => a.sessionId === session.id).map((a) => [a.questionId, a]),
  )
  const responses = new Set(
    session.mode === 'exam'
      ? data.responses.filter((r) => r.sessionId === session.id).map((r) => r.questionId)
      : [...attempts.values()]
          .map((a) => a.questionId)
          .concat(
            data.studyDrafts
              .filter((draft) => draft.sessionId === session.id && draft.selected !== null)
              .map((draft) => draft.questionId),
          ),
  )
  const flags = new Set(session.flaggedQuestionIds ?? [])
  return (
    <details className="exam-answer-sheet panel">
      <summary>
        Phiếu đáp án · {review ? attempts.size : responses.size}/{session.questionIds.length}{' '}
        {review ? 'câu đã chấm' : 'lựa chọn đã lưu'}
        {flags.size ? ` · ${flags.size} câu đánh dấu` : ''}
      </summary>
      <p className="small muted">
        {review
          ? '✓ Đúng · × Sai · — Bỏ trống · ★ Đã đánh dấu'
          : session.mode === 'exam'
            ? '● Đã chọn · ★ Đánh dấu xem lại. Phần nghe chỉ mở nhóm hiện tại hoặc nhóm tiếp theo sau khi nghe xong.'
            : '● Đã chọn hoặc đã nộp. Bạn có thể mở lại mọi nhóm trong chế độ học.'}
      </p>
      {([1, 2, 3, 4, 5, 6, 7] as const).map((part) => {
        const ids = session.questionIds.filter((id) => questionById.get(id)?.part === part)
        return ids.length ? (
          <section key={part}>
            <h3>Part {part}</h3>
            <nav aria-label={`Câu hỏi Part ${part}`} className="exam-answer-grid">
              {ids.map((id) => {
                const attempt = attempts.get(id)
                const status = review
                  ? attempt?.selected == null
                    ? 'blank'
                    : attempt.correct
                      ? 'correct'
                      : 'wrong'
                  : responses.has(id)
                    ? 'answered'
                    : 'empty'
                const label = review
                  ? status === 'correct'
                    ? 'đúng'
                    : status === 'wrong'
                      ? 'sai'
                      : 'bỏ trống'
                  : status === 'answered'
                    ? 'đã chọn'
                    : 'chưa chọn'
                return (
                  <button
                    type="button"
                    key={id}
                    className={`answer-cell ${status} ${flags.has(id) ? 'flagged' : ''}`}
                    aria-label={`Câu ${session.questionIds.indexOf(id) + 1}, ${label}${flags.has(id) ? ', đã đánh dấu' : ''}`}
                    aria-current={currentId === id ? 'step' : undefined}
                    disabled={disabled?.(id)}
                    onClick={() => onSelect(id)}
                  >
                    <span>{session.questionIds.indexOf(id) + 1}</span>
                    <small aria-hidden="true">
                      {review
                        ? status === 'correct'
                          ? '✓'
                          : status === 'wrong'
                            ? '×'
                            : '—'
                        : status === 'answered'
                          ? '●'
                          : '·'}
                      {flags.has(id) ? '★' : ''}
                    </small>
                  </button>
                )
              })}
            </nav>
          </section>
        ) : null
      })}
    </details>
  )
}
