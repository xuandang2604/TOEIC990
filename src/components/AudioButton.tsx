import { useEffect, useRef, useState } from 'react'
import { Square, Volume2 } from 'lucide-react'
import { speakEnglish } from '../providers/speech'

export function AudioButton({ text, label = 'Nghe phát âm' }: { text: string; label?: string }) {
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stop = useRef<(() => void) | null>(null)
  useEffect(() => () => stop.current?.(), [text])
  function toggle() {
    if (playing) {
      stop.current?.()
      setPlaying(false)
      return
    }
    setError(null)
    setPlaying(true)
    stop.current = speakEnglish(
      text,
      () => setPlaying(false),
      (message) => {
        setError(message)
        setPlaying(false)
      },
    )
  }
  return (
    <div className="audio-control">
      <button
        type="button"
        className={`button secondary ${playing ? 'is-playing' : ''}`}
        onClick={toggle}
        aria-label={playing ? 'Dừng giọng đọc' : label}
      >
        {playing ? <Square size={16} /> : <Volume2 size={18} />}
        {playing ? 'Dừng' : label}
      </button>
      {error && (
        <p className="small muted" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
