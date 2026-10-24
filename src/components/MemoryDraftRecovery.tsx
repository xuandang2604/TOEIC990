import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  clearTutorDraftMemory,
  hasUnsavedTutorWork,
  readTutorDraftMemory,
  setTutorDraftPending,
  subscribeTutorDraftMemory,
} from '../application/tutorDraftRecovery'

const EMPTY_DRAFTS: ReturnType<typeof readTutorDraftMemory> = []

/** Explicit escape hatch after a failed draft write; never silently clears the emergency copy. */
export function MemoryDraftRecovery() {
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (hasUnsavedTutorWork()) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [])
  const drafts = useSyncExternalStore(
    subscribeTutorDraftMemory,
    readTutorDraftMemory,
    () => EMPTY_DRAFTS,
  )
  const [acknowledged, setAcknowledged] = useState<string | null>(null)
  if (!drafts.length) return null
  return (
    <section className="data-section" aria-label="Bản tạm Tutor chưa lưu">
      <h2>Giữ riêng bản tạm Tutor</h2>
      <p>
        Các đoạn này chỉ còn trong bộ nhớ tab sau lỗi ghi. Chọn và sao chép phần cần giữ ra nơi khác
        trước khi cập nhật hoặc khôi phục sổ học. Bỏ bản tạm không nộp bài viết hoặc xóa nháp đã lưu
        trong kho.
      </p>
      {drafts.map((draft) => (
        <article className="memory-draft" key={draft.id}>
          <p className="small muted">
            {draft.phase === 'explanation' ? 'Giải thích' : 'Viết lại'} ·{' '}
            {new Date(draft.updatedAt).toLocaleString('vi-VN')}
          </p>
          <p className="memory-draft-text">{draft.text || '(Đoạn viết đang trống)'}</p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={acknowledged === draft.id}
              onChange={(e) => setAcknowledged(e.target.checked ? draft.id : null)}
            />{' '}
            Tôi đã sao chép nội dung cần giữ ra nơi khác
          </label>
          <button
            className="button secondary"
            disabled={acknowledged !== draft.id}
            onClick={() => {
              clearTutorDraftMemory(draft.id)
              setTutorDraftPending(draft.id, false)
              setAcknowledged(null)
            }}
          >
            Bỏ bản tạm này khỏi tab
          </button>
        </article>
      ))}
    </section>
  )
}
