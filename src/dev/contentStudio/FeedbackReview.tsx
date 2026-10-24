import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { db } from '../../persistence/database'
import { validRecord } from '../../persistence/records'
import {
  FEEDBACK_CATEGORIES,
  type ContentFeedback,
  type FeedbackStatus,
} from '../../domain/contentFeedback'
import { useAction } from '../../application/hooks'
import { InlineError } from '../../components/ui'
import { questionById } from '../../content/questions'
import { questionFingerprint } from '../../content/editorial'
import { reviewFeedback } from './reviewRepository'
function FeedbackRow({ row }: { row: ContentFeedback }) {
  const [status, setStatus] = useState(row.status),
    [note, setNote] = useState('')
  const action = useAction()
  const current = questionById.get(row.questionId)
  return (
    <article className="panel studio-feedback">
      <strong>
        {row.questionId} · {FEEDBACK_CATEGORIES[row.category]}
      </strong>
      <p className="small muted">
        {row.contentRevision} · {row.status} · {new Date(row.createdAt).toLocaleString('vi-VN')} ·{' '}
        {current && questionFingerprint(current) === row.fingerprint
          ? 'khớp câu hiện tại'
          : 'bản chụp khác nội dung hiện tại / không còn trong catalog'}
      </p>
      <blockquote lang="en">{row.snapshot.prompt}</blockquote>
      <p>{row.detail}</p>
      <details>
        <summary>Bản chụp gốc và lịch xử lý</summary>
        <pre>{JSON.stringify({ snapshot: row.snapshot, history: row.history }, null, 2)}</pre>
      </details>
      <label className="form-label">
        Trạng thái
        <select value={status} onChange={(e) => setStatus(e.target.value as FeedbackStatus)}>
          {['open', 'triaged', 'resolved', 'dismissed'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label className="form-label">
        Kết luận / hướng xử lý
        <textarea
          value={note}
          maxLength={2000}
          rows={2}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button
        className="button secondary"
        disabled={!note.trim() || action.busy}
        onClick={() =>
          void action.run(async () => {
            await reviewFeedback(row.id, status, note, row.revision)
            setNote('')
          })
        }
      >
        Lưu kết luận
      </button>
      <InlineError message={action.error} />
    </article>
  )
}
export function FeedbackReview() {
  const [rows, setRows] = useState<ContentFeedback[]>([]),
    [error, setError] = useState(''),
    [filter, setFilter] = useState('open'),
    [limit, setLimit] = useState(20)
  useEffect(() => {
    const sub = liveQuery(() =>
      db.contentFeedback.orderBy('createdAt').reverse().toArray(),
    ).subscribe({
      next: (data) => {
        setRows(data.filter((r) => validRecord('contentFeedback', r)))
        setError(
          data.some((r) => !validRecord('contentFeedback', r))
            ? 'Có phản hồi lỗi định dạng, bản gốc vẫn được giữ trong kho dữ liệu.'
            : '',
        )
      },
      error: () => setError('Không đọc được phản hồi trong IndexedDB của origin này.'),
    })
    return () => sub.unsubscribe()
  }, [])
  const shown = rows.filter((r) => filter === 'all' || r.status === filter)
  return (
    <section>
      <h2>Phản hồi của người học</h2>
      <p className="muted">
        Chỉ đọc kho cùng origin/profile hiện tại. Kết luận xử lý không thay đổi nội dung, attempts
        hoặc điểm cũ. Dùng backup để chuyển phản hồi có chủ ý giữa origin.
      </p>
      <label className="form-label">
        Lọc
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setLimit(20)
          }}
        >
          {['open', 'triaged', 'resolved', 'dismissed', 'all'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      {!shown.length && <p>Chưa có phản hồi khớp bộ lọc.</p>}
      {shown.slice(0, limit).map((row) => (
        <FeedbackRow key={`${row.id}:${row.revision}`} row={row} />
      ))}
      {shown.length > limit && (
        <button className="button secondary" onClick={() => setLimit(limit + 20)}>
          Xem thêm
        </button>
      )}
    </section>
  )
}
