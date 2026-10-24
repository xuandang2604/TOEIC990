import type { PronunciationLocale } from '../content/schema'

/** Browser/OS boundary. A voice can need an installed language pack or a network connection. */
interface Playback {
  utterance: SpeechSynthesisUtterance
  timer: number
  interrupted: () => void
  voiceListener?: () => void
}
let active: Playback | null = null

function detach(playback: Playback) {
  window.clearTimeout(playback.timer)
  playback.utterance.onend = null
  playback.utterance.onerror = null
  if (playback.voiceListener)
    window.speechSynthesis.removeEventListener('voiceschanged', playback.voiceListener)
}

export function speakEnglish(
  text: string,
  onEnd: () => void,
  onError: (message: string) => void,
  rate = 0.88,
  requireEnglish = false,
  locale?: PronunciationLocale,
): () => void {
  if (!('speechSynthesis' in window)) {
    onError('Trình duyệt chưa hỗ trợ đọc văn bản. Bạn có thể mở bản chép lời để học tiếp.')
    return () => {}
  }
  if (active) {
    const previous = active
    active = null
    detach(previous)
    window.speechSynthesis.cancel()
    previous.interrupted()
  }
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = locale ?? 'en-US'
  utterance.rate = rate
  const playback: Playback = {
    utterance,
    interrupted: () => onError('Giọng đọc bị gián đoạn. Hãy phát lại khi sẵn sàng.'),
    timer: 0,
  }
  active = playback
  const finish = (message?: string) => {
    if (active !== playback) return
    active = null
    detach(playback)
    if (message) onError(message)
    else onEnd()
  }
  utterance.onend = () => finish()
  utterance.onerror = (event) =>
    finish(
      ['canceled', 'interrupted'].includes(event.error)
        ? 'Giọng đọc bị gián đoạn. Hãy phát lại khi sẵn sàng.'
        : 'Không phát được giọng đọc. Thử lại hoặc mở bản chép lời.',
    )
  const voiceError = locale
    ? `Chưa có giọng ${locale === 'en-GB' ? 'Anh-Anh' : 'Anh-Mỹ'} khả dụng. Cài/bật giọng tương ứng trên thiết bị rồi thử lại.`
    : 'Chưa có giọng tiếng Anh khả dụng. Cài/bật giọng đọc tiếng Anh trên thiết bị rồi thử lại; chế độ học có bản chép lời.'
  let started = false
  const start = () => {
    if (active !== playback || started) return
    const voices = window.speechSynthesis.getVoices()
    const matches = voices.filter((v) =>
      locale
        ? v.lang.replace('_', '-').toLowerCase() === locale.toLowerCase()
        : v.lang.toLowerCase().startsWith('en'),
    )
    const voice =
      matches.find((v) => v.localService && (locale || v.lang === 'en-US')) ?? matches[0] ?? null
    if ((requireEnglish || locale) && !voice) return
    started = true
    window.clearTimeout(playback.timer)
    if (playback.voiceListener)
      window.speechSynthesis.removeEventListener('voiceschanged', playback.voiceListener)
    utterance.voice = voice
    const watchdog = () => {
      if (active !== playback) return
      if (window.speechSynthesis.paused) {
        playback.timer = window.setTimeout(watchdog, 60_000)
        return
      }
      finish('Giọng đọc chưa phản hồi. Bạn có thể học tiếp bằng bản chép lời.')
      window.speechSynthesis.cancel()
    }
    playback.timer = window.setTimeout(
      watchdog,
      Math.max(60_000, Math.ceil(text.length / 7) * 1000),
    )
    try {
      window.speechSynthesis.resume()
      window.speechSynthesis.speak(utterance)
    } catch {
      finish('Không truy cập được giọng đọc của thiết bị. Hãy dùng bản chép lời.')
    }
  }
  const voices = window.speechSynthesis.getVoices()
  if (
    (requireEnglish || locale) &&
    !voices.some((v) =>
      locale
        ? v.lang.replace('_', '-').toLowerCase() === locale.toLowerCase()
        : v.lang.toLowerCase().startsWith('en'),
    )
  ) {
    playback.voiceListener = start
    window.speechSynthesis.addEventListener('voiceschanged', start)
    playback.timer = window.setTimeout(() => finish(voiceError), 2500)
  } else start()
  return () => {
    detach(playback)
    // Unmounting an older button must not cancel another button's current utterance.
    if (active === playback) {
      active = null
      window.speechSynthesis.cancel()
    }
  }
}
