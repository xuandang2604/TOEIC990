import type { PronunciationLocale } from '../content/schema'
import { speakEnglish } from './speech'

export interface PronunciationCapability {
  locale: PronunciationLocale
  available: boolean
  local: boolean
}
export interface PronunciationProvider {
  capabilities(): PronunciationCapability[]
  subscribe(onChange: () => void): () => void
  play(
    request: { text: string; locale: PronunciationLocale },
    onEnd: () => void,
    onError: (message: string) => void,
  ): () => void
}
export const browserPronunciation: PronunciationProvider = {
  capabilities() {
    const voices =
      typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : []
    return (['en-US', 'en-GB'] as const).map((locale) => {
      const matches = voices.filter(
        (voice) => voice.lang.replace('_', '-').toLowerCase() === locale.toLowerCase(),
      )
      return {
        locale,
        available: Boolean(matches.length),
        local: matches.some((voice) => voice.localService),
      }
    })
  },
  subscribe(onChange) {
    if (!('speechSynthesis' in window)) return () => {}
    window.speechSynthesis.addEventListener('voiceschanged', onChange)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onChange)
  },
  play({ text, locale }, onEnd, onError) {
    return speakEnglish(text, onEnd, onError, 0.88, true, locale)
  },
}
