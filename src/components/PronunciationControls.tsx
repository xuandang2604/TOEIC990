import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Square, Volume2 } from 'lucide-react'
import { browserPronunciation } from '../providers/pronunciation'
import type { PronunciationLocale, VocabularyEntry } from '../content/schema'

export function PronunciationControls({ entry }: { entry: VocabularyEntry }) {
  const [voices, setVoices] = useState(browserPronunciation.capabilities)
  const [playing, setPlaying] = useState<PronunciationLocale | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stop = useRef<(() => void) | null>(null)
  useEffect(() => {
    const refresh = () => setVoices(browserPronunciation.capabilities())
    const unsubscribe = browserPronunciation.subscribe(refresh)
    refresh()
    return () => {
      unsubscribe()
      stop.current?.()
    }
  }, [entry.id])
  function play(locale: PronunciationLocale) {
    stop.current?.()
    if (playing === locale) {
      setPlaying(null)
      return
    }
    setError(null)
    setPlaying(locale)
    stop.current = browserPronunciation.play(
      { text: entry.pronunciationText ?? entry.word, locale },
      () => setPlaying(null),
      (message) => {
        setPlaying(null)
        setError(message)
      },
    )
  }
  return (
    <div className="pronunciation-controls">
      <div className="pronunciation-variants">
        {voices.map((voice) => (
          <div key={voice.locale}>
            <div className="pronunciation-variant-line">
              <button
                type="button"
                className={`pronunciation-button ${playing === voice.locale ? 'is-playing' : ''}`}
                disabled={!voice.available}
                onClick={() => play(voice.locale)}
                aria-label={`${playing === voice.locale ? 'Dừng' : 'Nghe'} phát âm ${voice.locale === 'en-US' ? 'Mỹ' : 'Anh'} của ${entry.word}`}
              >
                {playing === voice.locale ? <Square size={14} /> : <Volume2 size={16} />}
                {voice.locale === 'en-US' ? 'US' : 'UK'}
              </button>
              {entry.pronunciations.some((p) => p.locale === voice.locale) && (
                <span className="ipa" lang="en">
                  {entry.pronunciations.find((p) => p.locale === voice.locale)?.ipa}
                </span>
              )}
            </div>
            {!voice.available && <small className="muted">Chưa có giọng này</small>}
          </div>
        ))}
        {!voices.every((v) => v.available) && (
          <button
            type="button"
            className="icon-button"
            aria-label="Kiểm tra lại giọng đọc"
            onClick={() => setVoices(browserPronunciation.capabilities())}
          >
            <RefreshCw size={15} />
          </button>
        )}
      </div>
      <p className="small muted">
        Giọng máy của thiết bị
        {voices.some((v) => v.available && !v.local) ? '; một số giọng cần mạng' : ''}. IPA của
        nghĩa từ đang học.
      </p>
      {entry.pronunciationText && (
        <p className="small muted">
          Nghe trong cụm: <span lang="en">{entry.pronunciationText}</span>.
        </p>
      )}
      {!voices.some((v) => v.available) && (
        <p className="small muted">
          Cài hoặc bật giọng tiếng Anh trong thiết bị/trình duyệt để nghe. Bạn vẫn có thể học qua
          IPA và ví dụ.
        </p>
      )}
      {error && (
        <p role="alert" className="small brass-text">
          {error}
        </p>
      )}
    </div>
  )
}
