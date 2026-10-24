import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, RefreshCw, WifiOff } from 'lucide-react'
import { useStudy } from '../application/StudyContext'
import { hasUnsavedTutorWork, subscribeTutorDraftMemory } from '../application/tutorDraftRecovery'
import { readPendingOperations, subscribeOperations, useAction } from '../application/hooks'
import { StudyOperationError } from '../application/errors'
import { InlineError } from './ui'

interface InstallEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
export function OfflineStatus() {
  const data = useStudy()
  const [offline, setOffline] = useState(!navigator.onLine)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>()
  const [waiting, setWaiting] = useState(false)
  const [install, setInstall] = useState<InstallEvent>()
  const [status, setStatus] = useState('')
  const action = useAction()
  const dirty = useSyncExternalStore(subscribeTutorDraftMemory, hasUnsavedTutorWork, () => false)
  const pending = useSyncExternalStore(subscribeOperations, readPendingOperations, () => 0)
  const active = data.sessions.some((s) => s.status === 'active')
  useEffect(() => {
    const online = () => setOffline(!navigator.onLine)
    const installable = (event: Event) => {
      event.preventDefault()
      setInstall(event as InstallEvent)
    }
    window.addEventListener('online', online)
    window.addEventListener('offline', online)
    window.addEventListener('beforeinstallprompt', installable)
    let mounted = true,
      cleanup = () => {}
    if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, {
          scope: import.meta.env.BASE_URL,
          updateViaCache: 'none',
        })
        .then((reg) => {
          if (!mounted) return
          setRegistration(reg)
          setWaiting(!!reg.waiting)
          let worker: ServiceWorker | null = null
          const changed = () => {
            if (mounted && worker?.state === 'redundant')
              setStatus(
                'Chưa tải đủ bản ứng dụng để dùng ngoại tuyến hoặc cập nhật. Sổ học hiện có được giữ nguyên; thử lại khi có mạng và đủ dung lượng.',
              )
            if (mounted && worker?.state === 'installed') {
              setWaiting(!!reg.waiting)
              setStatus(reg.waiting ? '' : 'Đã chuẩn bị nội dung để học ngoại tuyến.')
            }
          }
          const found = () => {
            worker?.removeEventListener('statechange', changed)
            worker = reg.installing
            worker?.addEventListener('statechange', changed)
            changed()
          }
          reg.addEventListener('updatefound', found)
          found()
          cleanup = () => {
            reg.removeEventListener('updatefound', found)
            worker?.removeEventListener('statechange', changed)
          }
        })
        .catch((failure: unknown) => {
          console.error(
            'study990: offline registration failed',
            failure instanceof Error ? failure.name : 'Unknown',
          )
          if (mounted)
            setStatus(
              'Chưa chuẩn bị được chế độ ngoại tuyến. Bạn vẫn có thể học khi trang còn mở; thử tải lại khi có mạng.',
            )
        })
    } else if (import.meta.env.PROD) {
      setStatus(
        window.isSecureContext
          ? 'Trình duyệt chưa hỗ trợ chế độ cài đặt và cache ngoại tuyến của ứng dụng. Sổ học vẫn lưu trên thiết bị khi IndexedDB khả dụng.'
          : 'Chế độ ngoại tuyến cần HTTPS hoặc địa chỉ loopback localhost. Sổ học hiện có chưa bị thay đổi.',
      )
    }
    return () => {
      mounted = false
      cleanup()
      window.removeEventListener('online', online)
      window.removeEventListener('offline', online)
      window.removeEventListener('beforeinstallprompt', installable)
    }
  }, [])
  async function update() {
    if (active || hasUnsavedTutorWork() || readPendingOperations() > 1 || !registration?.waiting)
      throw new StudyOperationError('Kết thúc phiên học và lưu nháp trước khi cập nhật.')
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', changed)
        window.clearTimeout(timer)
      }
      const changed = () => {
        cleanup()
        resolve()
        window.location.reload()
      }
      const timer = window.setTimeout(() => {
        cleanup()
        reject(
          new StudyOperationError(
            'Chưa kích hoạt được bản cập nhật. Hãy thử lại. Dữ liệu học không bị thay đổi.',
          ),
        )
      }, 15000)
      navigator.serviceWorker.addEventListener('controllerchange', changed)
      registration.waiting?.postMessage({ type: 'ACTIVATE_UPDATE' })
    })
  }
  if (!offline && !waiting && !install && !status && !action.error) return null
  return (
    <aside className="offline-status" aria-label="Trạng thái ứng dụng">
      {offline && (
        <p role="status">
          <WifiOff size={16} /> Đang ngoại tuyến. Nội dung đã chuẩn bị vẫn dùng được; giọng đọc tùy
          trình duyệt và thiết bị. Nội dung chưa được chuẩn bị có thể cần kết nối.
        </p>
      )}
      {waiting && (
        <div>
          <p>Có phiên bản mới. Tiến độ đã lưu nằm trên thiết bị.</p>
          <button
            className="button secondary"
            disabled={active || dirty || pending > 0}
            onClick={() => void action.run(update)}
          >
            <RefreshCw size={15} /> Cập nhật & mở lại
          </button>
          {(active || dirty) && (
            <p className="small muted">Hoàn thành phiên học và lưu nháp trước khi cập nhật.</p>
          )}
        </div>
      )}
      {install && (
        <button
          className="button secondary"
          disabled={action.busy}
          onClick={() =>
            void action.run(async () => {
              await install.prompt()
              const result = await install.userChoice
              setInstall(undefined)
              setStatus(
                result.outcome === 'accepted'
                  ? 'Đã gửi yêu cầu cài ứng dụng cho trình duyệt.'
                  : 'Bạn có thể tiếp tục học trong trình duyệt.',
              )
            })
          }
        >
          <Download size={15} /> Thêm STUDY 990 vào thiết bị
        </button>
      )}
      {status && (
        <p className="small" role="status">
          {status}
        </p>
      )}
      <InlineError message={action.error} />
    </aside>
  )
}
