import { useStudy } from '../../application/StudyContext'
import { useAction } from '../../application/hooks'
import { annotateMistake, ERROR_CATEGORIES } from '../../application/mistakesRepository'
import { misconceptionSignals } from '../../domain/evidence'
import type { ErrorCategory } from '../../domain/models'
import { InlineError } from '../../components/ui'

export function MistakeNote({ attemptId }: { attemptId: string }) {
  const { mistakes, mistakeAnnotations } = useStudy(),
    action = useAction()
  const mistake = mistakes.find((m) => m.id === attemptId)
  if (!mistake) return null
  const signals = misconceptionSignals(mistake, mistakes, mistakeAnnotations)
  return (
    <div className="mistake-note">
      <label>
        Nguyên nhân theo bạn <span className="muted">(tuỳ chọn)</span>
        <select
          value={signals.reportedCategory}
          disabled={action.busy}
          onChange={(e) =>
            void action.run(() => annotateMistake(attemptId, e.target.value as ErrorCategory))
          }
        >
          {ERROR_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      {signals.repeated && (
        <p className="small brass-text">
          Cùng lựa chọn sai đã xuất hiện ở ít nhất hai phiên trong 90 ngày. Đối chiếu lại lập luận;
          đây chưa phải kết luận về nguyên nhân.
        </p>
      )}
      {signals.highConfidenceError && (
        <p className="small muted">
          Bạn đã chọn mức rất chắc nhưng trả lời chưa đúng. Thử giải thích lại quy tắc trước khi xem
          thêm gợi ý.
        </p>
      )}
      <InlineError message={action.error} />
    </div>
  )
}
