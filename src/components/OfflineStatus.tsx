import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Download, RefreshCw, WifiOff } from 'lucide-react'
import { useStudy } from '../application/StudyContext'
import { hasUnsavedTutorWork, subscribeTutorDraftMemory } from '../application/tutorDraftRecovery'
import { readPendingOperations, subscribeOperations, useAction } from '../application/hooks'
import { StudyOperationError } from '../application/errors'
import { InlineError } from './ui'
import { prepareLearningForUpdate } from '../application/updatePreparation'
import { finishSessionsForUpdate, hasActiveSessions } from '../application/sessionRepository'

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
  const [updating, setUpdating] = useState(false)
  const [updateStep, setUpdateStep] = useState('')
  const cancelActivation = useRef<(() => void) | null>(null)
  const action = useAction()
  const dirty = useSyncExternalStore(subscribeTutorDraftMemory, hasUnsavedTutorWork, () => false)
  const pending = useSyncExternalStore(subscribeOperations, readPendingOperations, () => 0)
  const active = data.sessions.some((s) => s.status === 'active')
  const activeExam = data.sessions.some((s) => s.status === 'active' && s.mode === 'exam')
  useEffect(() => () => cancelActivation.current?.(), [])
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
    const worker = registration?.waiting
    if (!worker)
      throw new StudyOperationError('Chưa có bản mới sẵn sàng. Tiến độ hiện có vẫn được giữ.')
    if (readPendingOperations() > 1)
      throw new StudyOperationError(
        'Đang lưu một thao tác khác. Chờ lưu xong rồi thử cập nhật lại.',
      )
    setUpdating(true)
    try {
      setUpdateStep('Đang lưu các bản nháp…')
      await prepareLearningForUpdate()
      if (hasUnsavedTutorWork())
        throw new StudyOperationError(
          'Còn nháp Tutor chưa lưu được. Giữ trang mở và giữ lại nội dung trước khi cập nhật.',
        )
      if (registration?.waiting !== worker)
        throw new StudyOperationError(
          'Bản cập nhật vừa thay đổi. Nháp đã lưu; hãy thử cập nhật lại.',
        )
      setUpdateStep('Đang khép phiên và giữ kết quả đã làm…')
      await finishSessionsForUpdate()
      if ((await hasActiveSessions()) || hasUnsavedTutorWork() || readPendingOperations() > 1)
        throw new StudyOperationError(
          'Có thao tác học mới đang mở hoặc đang lưu. Chưa tải lại trang; hãy chờ thao tác đó hoàn tất rồi thử lại.',
        )
      setUpdateStep('Đang kích hoạt bản mới và mở lại…')
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          navigator.serviceWorker.removeEventListener('controllerchange', changed)
          window.clearTimeout(timer)
          cancelActivation.current = null
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
              'Chưa kích hoạt được bản cập nhật. Phiên đã được khép và dữ liệu đã lưu; bấm cập nhật để thử lại.',
            ),
          )
        }, 15000)
        cancelActivation.current = () => {
          cleanup()
          reject(new StudyOperationError('Đã dừng chờ cập nhật; dữ liệu đã lưu được giữ nguyên.'))
        }
        navigator.serviceWorker.addEventListener('controllerchange', changed)
        try {
          worker.postMessage({ type: 'ACTIVATE_UPDATE' })
        } catch {
          cleanup()
          reject(
            new StudyOperationError('Chưa gửi được yêu cầu cập nhật. Tiến độ đã lưu; hãy thử lại.'),
          )
        }
      })
    } finally {
      setUpdating(false)
    }
  }
  if (!offline && !waiting && !install && !status && !action.error && !updating) return null
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
            className={`button secondary ${active ? 'update-end-session' : ''}`}
            disabled={action.busy || pending > 0}
            onClick={() => void action.run(update)}
          >
            <RefreshCw size={15} />{' '}
            {active
              ? 'Kết thúc phiên & cập nhật'
              : dirty
                ? 'Lưu nháp & cập nhật'
                : 'Cập nhật & mở lại'}
          </button>
          {(active || dirty) && (
            <p className="small muted">
              {activeExam
                ? 'Bài thi sẽ được nộp với các lựa chọn đã lưu; câu còn trống được ghi nhận khi nộp.'
                : active
                  ? 'Giữ đáp án đã nộp và nháp. Phần chưa làm không bị chấm sai hoặc tính là đã hoàn thành.'
                  : 'Nháp sẽ được lưu trước khi mở lại bản mới.'}
            </p>
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
      <Dialog.Root open={updating}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog update-progress-dialog"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <Dialog.Title>Đang lưu và cập nhật</Dialog.Title>
            <Dialog.Description>Trang sẽ tự mở lại khi bản mới sẵn sàng.</Dialog.Description>
            <p role="status" aria-live="polite">
              {updateStep}
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </aside>
  )
}
