import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { liveQuery } from 'dexie'
import { readStudyData, type StudyData } from './studyRepository'
import { RecoveryExport } from '../components/RecoveryExport'
import { MemoryDraftRecovery } from '../components/MemoryDraftRecovery'
import { contentIssues } from '../content/catalog'

const StudyContext = createContext<StudyData | null>(null)
export function StudyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StudyData | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (contentIssues.length) return
    setError(false)
    const subscription = liveQuery(readStudyData).subscribe({
      next: (snapshot) => {
        setData(snapshot)
        setError(false)
      },
      error: (failure: unknown) => {
        console.error(
          'study990: storage read failed',
          failure instanceof Error ? failure.name : 'Unknown',
        )
        setError(true)
      },
    })
    return () => subscription.unsubscribe()
  }, [retry])
  if (contentIssues.length)
    return (
      <div className="boot-state" role="alert">
        <span className="eyebrow">STUDY 990</span>
        <h1>Bộ bài học cần được cập nhật.</h1>
        <p>
          Một số nội dung không vượt qua kiểm tra cấu trúc. Ứng dụng dừng nhận bài học mới để tránh
          chấm sai. Tiến độ hiện có chưa bị xóa.
        </p>
        <MemoryDraftRecovery />
      </div>
    )
  if (error)
    return (
      <div className="boot-state" role="alert">
        <span className="eyebrow">STUDY 990</span>
        <h1>Chưa mở được sổ học.</h1>
        <p>
          Trình duyệt đang chặn hoặc không truy cập được dữ liệu trên thiết bị. Dữ liệu hiện có chưa
          bị xóa. Hãy cho phép lưu trữ trang web rồi thử lại.
        </p>
        <button className="button primary" onClick={() => setRetry((n) => n + 1)}>
          Thử mở lại
        </button>
        <RecoveryExport />
        <MemoryDraftRecovery />
      </div>
    )
  if (!data)
    return (
      <div className="boot-state" role="status">
        <span className="eyebrow">STUDY 990</span>
        <div className="loading-line" />
        <p>Đang mở không gian học của bạn…</p>
      </div>
    )
  return <StudyContext.Provider value={data}>{children}</StudyContext.Provider>
}
export function useStudy() {
  const value = useContext(StudyContext)
  if (!value) throw new Error('StudyProvider is required')
  return value
}
