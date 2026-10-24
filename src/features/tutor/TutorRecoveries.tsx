import { useEffect, useState, useSyncExternalStore } from 'react'
import { liveQuery } from 'dexie'
import { db } from '../../persistence/database'
import type { TutorDraft } from '../../domain/tutorModels'
import {
  readTutorDraftMemory,
  subscribeTutorDraftMemory,
} from '../../application/tutorDraftRecovery'

/** Narrow subscription: draft autosaves do not reload the application's full learning history. */
export function TutorRecoveries({ reflectionId }: { reflectionId: string }) {
  const [rows, setRows] = useState<TutorDraft[]>([])
  const [error, setError] = useState(false)
  const [limit, setLimit] = useState(6)
  const memory = useSyncExternalStore(subscribeTutorDraftMemory, readTutorDraftMemory).filter(
    (row) => row.reflectionId === reflectionId,
  )
  useEffect(() => {
    const subscription = liveQuery(() =>
      db.tutorDrafts
        .where('reflectionId')
        .equals(reflectionId)
        .filter((d) => Boolean(d.recoveryOf))
        .toArray(),
    ).subscribe({
      next: (data) => {
        setRows(data.sort((a, b) => b.updatedAt - a.updatedAt))
        setError(false)
      },
      error: (failure: unknown) => {
        console.error(
          'study990: tutor recovery read failed',
          failure instanceof Error ? failure.name : 'Unknown',
        )
        setError(true)
      },
    })
    return () => subscription.unsubscribe()
  }, [reflectionId])
  if (error && !memory.length)
    return (
      <p role="alert" className="small brass-text">
        Chưa đọc được các nháp cần đối chiếu. Bản ghi hiện có chưa bị xóa; tải lại khi có thể truy
        cập dữ liệu.
      </p>
    )
  if (!rows.length && !memory.length) return null
  return (
    <details className="tutor-history" open>
      <summary>Nháp cần đối chiếu ({rows.length + memory.length})</summary>
      {memory.map((draft) => (
        <article key={draft.id}>
          <strong className="small brass-text">
            Bản tạm chưa lưu được vào kho. Sao chép trước khi đóng tab.
          </strong>
          <p>{draft.text}</p>
        </article>
      ))}
      {error && (
        <p role="alert" className="small brass-text">
          Chưa đọc được các bản nháp trong kho; bản tạm bên trên chỉ còn trong bộ nhớ của tab này.
        </p>
      )}
      <p className="small muted">
        Các bản này được giữ riêng khi có cập nhật từ cửa sổ khác, chưa được nộp hoặc chấm. Có thể
        chọn và sao chép nội dung; sổ đã nộp không bị ghi đè.
      </p>
      {rows.slice(0, limit).map((draft) => (
        <article key={draft.id}>
          <span className="eyebrow">
            {draft.phase === 'revision' ? 'VIẾT LẠI' : 'GIẢI THÍCH'} ·{' '}
            {new Date(draft.updatedAt).toLocaleString('vi-VN')}
          </span>
          <p>{draft.text}</p>
        </article>
      ))}
      {rows.length > limit && (
        <button className="text-link" onClick={() => setLimit((n) => n + 6)}>
          Xem thêm nháp cần đối chiếu
        </button>
      )}
    </details>
  )
}
