import { useRef, useState } from 'react'
import type { Question } from '../../content/schema'
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from '../../domain/contentFeedback'
import { reportContent } from '../../application/contentFeedbackRepository'
import { useAction } from '../../application/hooks'
import { InlineError } from '../../components/ui'
export function ReportQuestion({ question }: { question: Question }) {
  const [category, setCategory] = useState<FeedbackCategory>('wording')
  const [detail, setDetail] = useState('')
  const [saved, setSaved] = useState(false)
  const operation = useRef(crypto.randomUUID())
  const action = useAction()
  return (
    <details className="question-report">
      <summary>Báo vấn đề nội dung</summary>
      <p className="small muted">
        Lưu riêng trên thiết bị, gắn với câu và phiên bản đang xem. Không gửi ra ngoài, không tự đổi
        đáp án hoặc điểm đã chấm.
      </p>
      {saved ? (
        <p role="status">
          Đã lưu phản hồi trên thiết bị. Phản hồi đi cùng bản sao dữ liệu của bạn; chưa được gửi đến
          người khác.
        </p>
      ) : (
        <>
          <label className="form-label">
            Loại vấn đề
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
            >
              {Object.entries(FEEDBACK_CATEGORIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Mô tả
            <textarea
              rows={3}
              maxLength={2000}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              disabled={action.busy}
            />
          </label>
          <button
            className="button secondary"
            disabled={!detail.trim() || action.busy}
            onClick={() =>
              void action.run(async () => {
                await reportContent(question, category, detail, operation.current)
                setSaved(true)
              })
            }
          >
            Lưu phản hồi
          </button>
        </>
      )}
      <InlineError message={action.error} />
    </details>
  )
}
