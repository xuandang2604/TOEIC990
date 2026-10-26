import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Square } from 'lucide-react'
import type { AudioAsset } from '../content/schema'
import { speakEnglish } from '../providers/speech'
import { assetUrl } from './assetUrl'

export interface MediaEvents {
  ended: () => void
  failed: () => void
}
export function MediaPlayer({
  audio,
  once = false,
  consumed = false,
  interrupted = false,
  disabled = false,
  begin,
  onSkip,
}: {
  audio: AudioAsset
  once?: boolean
  consumed?: boolean
  interrupted?: boolean
  disabled?: boolean
  begin?: (recover: boolean) => Promise<MediaEvents | undefined>
  onSkip?: () => Promise<unknown>
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [rate, setRate] = useState(0.9)
  const stop = useRef<(() => void) | null>(null)
  const element = useRef<HTMLAudioElement>(null)
  const events = useRef<MediaEvents | undefined>(undefined)
  const mounted = useRef(true)
  const busy = useRef(false)
  useEffect(() => {
    mounted.current = true
    const ownedAudioElement = element.current
    return () => {
      mounted.current = false
      stop.current?.()
      ownedAudioElement?.pause()
    }
  }, [audio])
  const finish = (message?: string) => {
    if (!mounted.current) return
    setState('idle')
    if (message) {
      setError(message)
      events.current?.failed()
    } else events.current?.ended()
    events.current = undefined
  }
  async function start() {
    if (busy.current || disabled || (once && consumed)) return
    busy.current = true
    setState('loading')
    setError(null)
    try {
      const callbacks = await begin?.(interrupted)
      if (begin && !callbacks) {
        if (mounted.current) setState('idle')
        return
      }
      if (!mounted.current) {
        callbacks?.failed()
        return
      }
      events.current = callbacks
      setState('playing')
      if (audio.kind === 'synthetic') {
        stop.current = speakEnglish(
          audio.transcript,
          () => finish(),
          (message) => finish(message),
          once ? 1 : rate,
          true,
        )
      } else if (element.current) {
        element.current.currentTime = 0
        element.current.playbackRate = once ? 1 : rate
        await element.current.play()
      }
    } catch {
      finish(
        'Không phát được âm thanh. Bạn có thể thử lại hoặc dùng bản chép lời trong chế độ học.',
      )
    } finally {
      busy.current = false
    }
  }
  function pause() {
    if (once) return
    if (state === 'paused') {
      if (audio.kind === 'synthetic') window.speechSynthesis.resume()
      else
        void element.current?.play().catch(() => finish('Không tiếp tục được audio. Hãy phát lại.'))
      setState('playing')
    } else {
      if (audio.kind === 'synthetic') window.speechSynthesis.pause()
      else element.current?.pause()
      setState('paused')
    }
  }
  function stopPlayback() {
    stop.current?.()
    element.current?.pause()
    setState('idle')
    events.current = undefined
  }
  return (
    <div className="media-player">
      <div className="media-actions">
        <button
          type="button"
          className="button secondary"
          onClick={() => void start()}
          disabled={disabled || state !== 'idle' || (once && consumed)}
        >
          <Play size={17} />
          {state === 'loading'
            ? 'Đang chuẩn bị…'
            : consumed && once
              ? 'Đã nghe xong'
              : interrupted && once
                ? 'Nghe lại sau gián đoạn'
                : once
                  ? 'Phát một lần'
                  : 'Phát từ đầu'}
        </button>
        {!once && (state === 'playing' || state === 'paused') && (
          <>
            <button type="button" className="button secondary" onClick={pause}>
              {state === 'paused' ? <Play size={16} /> : <Pause size={16} />}
              {state === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Dừng audio"
              onClick={stopPlayback}
            >
              <Square size={16} />
            </button>
          </>
        )}
        {!once && (
          <label className="speed-control">
            Tốc độ
            <select
              aria-label="Tốc độ audio"
              value={rate}
              disabled={state !== 'idle'}
              onChange={(e) => setRate(Number(e.target.value))}
            >
              {[0.75, 0.9, 1, 1.15].map((value) => (
                <option key={value} value={value}>
                  {value}×
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="small muted">
        {audio.kind === 'synthetic'
          ? 'Giọng tổng hợp của trình duyệt, không phải bản thu TOEIC. Cần giọng tiếng Anh khả dụng.'
          : audio.credit}
      </p>
      {once && (
        <p className="small muted">
          Không tua, không replay sau khi nghe xong. Phát lại do gián đoạn/lỗi sẽ được ghi nhận là
          hỗ trợ.
        </p>
      )}
      <p className="small muted" role="status">
        {state === 'playing' ? 'Đang phát âm thanh…' : state === 'paused' ? 'Đã tạm dừng' : ''}
      </p>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {once && !consumed && onSkip && (
        <button
          type="button"
          className="text-link"
          disabled={disabled || state === 'loading'}
          onClick={() => {
            stopPlayback()
            void onSkip()
          }}
        >
          <RotateCcw size={14} />
          Bỏ qua audio (ghi nhận trong kết quả)
        </button>
      )}
      {audio.kind === 'recording' && (
        <audio
          ref={element}
          preload="none"
          src={assetUrl(audio.src)}
          onEnded={() => finish()}
          onError={() =>
            finish('Tệp âm thanh không khả dụng. Phiên học và lựa chọn đã lưu vẫn được giữ.')
          }
        />
      )}
    </div>
  )
}
