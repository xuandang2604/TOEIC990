import { useEffect, useRef, useState } from 'react'

/** Ephemeral local recording. No upload, persistent blob, background capture or speech grading. */
export function ShadowRecorder() {
  const [state, setState] = useState<'idle' | 'requesting' | 'recording'>('idle')
  const [url, setUrl] = useState<string>()
  const [error, setError] = useState('')
  const stream = useRef<MediaStream | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const generation = useRef(0)
  const locked = useRef(false)
  const alive = useRef(true)
  const supported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      generation.current++
      window.clearTimeout(timer.current)
      if (recorder.current) {
        recorder.current.ondataavailable = null
        recorder.current.onstop = null
        recorder.current.onerror = null
        if (recorder.current.state !== 'inactive') recorder.current.stop()
      }
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  function stop() {
    window.clearTimeout(timer.current)
    if (recorder.current?.state !== 'inactive') recorder.current?.stop()
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    locked.current = false
    setState('idle')
  }
  async function start() {
    if (!supported || locked.current) return
    locked.current = true
    const token = ++generation.current
    setState('requesting')
    setError('')
    let acquired: MediaStream | undefined
    try {
      acquired = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (generation.current !== token) {
        acquired.getTracks().forEach((t) => t.stop())
        if (alive.current) {
          locked.current = false
          setState('idle')
        }
        return
      }
      stream.current = acquired
      const media = new MediaRecorder(acquired)
      recorder.current = media
      const chunks: Blob[] = []
      let bytes = 0
      media.ondataavailable = (event) => {
        if (token !== generation.current) return
        bytes += event.data.size
        if (bytes > 5 * 1024 * 1024) {
          setError('Đạt giới hạn 5 MB. Hãy ghi một câu ngắn hơn.')
          stop()
          return
        }
        if (event.data.size) chunks.push(event.data)
      }
      media.onerror = () => {
        if (token !== generation.current) return
        setError('Ghi âm bị gián đoạn. Có thể tiếp tục nhại giọng mà không ghi.')
        stop()
      }
      media.onstop = () => {
        acquired?.getTracks().forEach((t) => t.stop())
        if (token !== generation.current) return
        if (chunks.length && bytes <= 5 * 1024 * 1024)
          setUrl(URL.createObjectURL(new Blob(chunks, { type: media.mimeType })))
        if (recorder.current === media) {
          recorder.current = null
          stream.current = null
          window.clearTimeout(timer.current)
          locked.current = false
          setState('idle')
        }
      }
      setUrl(undefined)
      media.start(500)
      setState('recording')
      timer.current = window.setTimeout(stop, 60_000)
    } catch (failure) {
      acquired?.getTracks().forEach((t) => t.stop())
      if (token !== generation.current) {
        if (alive.current) {
          locked.current = false
          setState('idle')
        }
        return
      }
      locked.current = false
      setState('idle')
      setError(
        failure instanceof DOMException && failure.name === 'NotAllowedError'
          ? 'Micro chưa được cho phép. Bạn vẫn có thể nghe và nhại lại; chỉ cấp quyền khi muốn ghi âm.'
          : 'Không mở được micro hoặc định dạng ghi âm. Thử lại hoặc tự nhại lại không ghi.',
      )
    }
  }
  return (
    <div className="shadow-recorder">
      <h4>Nghe → nhại lại → tự đối chiếu</h4>
      <p className="small muted">
        Ghi tối đa 60 giây, chỉ trong bộ nhớ tab; rời bài sẽ mất bản ghi. Không chấm phát âm. Micro
        chỉ mở sau khi bạn bấm ghi.
      </p>
      {!supported ? (
        <p role="status">
          Trình duyệt chưa hỗ trợ ghi âm tại đây. Nghe rồi nhại lại vẫn dùng được.
        </p>
      ) : (
        <div className="studio-actions">
          <button
            className="button secondary"
            disabled={state === 'requesting'}
            onClick={() => (state === 'recording' ? stop() : void start())}
          >
            {state === 'requesting'
              ? 'Đang xin quyền micro…'
              : state === 'recording'
                ? 'Dừng ghi âm'
                : 'Ghi giọng của tôi'}
          </button>
          {state === 'requesting' && (
            <button
              className="text-link"
              onClick={() => {
                generation.current++
                setError(
                  'Đã hủy lượt ghi. Đóng hộp xin quyền của trình duyệt để hoàn tất; nếu quyền được cấp muộn, micro sẽ được đóng ngay.',
                )
              }}
            >
              Hủy yêu cầu trong ứng dụng
            </button>
          )}
        </div>
      )}
      <p role="status" className="small">
        {state === 'recording' ? 'Đang ghi · tự dừng sau 60 giây' : ''}
      </p>
      {url && (
        <div>
          <audio controls src={url} aria-label="Nghe lại giọng vừa ghi" />
          <button className="text-link" onClick={() => setUrl(undefined)}>
            Xóa bản ghi
          </button>
        </div>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
