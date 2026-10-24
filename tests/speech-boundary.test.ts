import { it } from 'node:test'
import assert from 'node:assert/strict'
import { speakEnglish } from '../src/providers/speech'

/** Contract fixtures only: no real browser, sound device or installed voices are exercised. */
class Utterance {
  lang = ''
  rate = 1
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  text: string
  constructor(text: string) {
    this.text = text
  }
}
class Synthesis extends EventTarget {
  voices: { lang: string; localService: boolean }[] = []
  spoken: Utterance[] = []
  paused = false
  canceled = 0
  getVoices() {
    return this.voices
  }
  speak(utterance: Utterance) {
    this.spoken.push(utterance)
  }
  cancel() {
    this.canceled++
  }
  resume() {
    this.paused = false
  }
}
function platform(english = false) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const previousUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance')
  const synthesis = new Synthesis()
  if (english) synthesis.voices = [{ lang: 'en-US', localService: true }]
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      speechSynthesis: synthesis,
      setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
      clearTimeout: (timer: ReturnType<typeof setTimeout>) => globalThis.clearTimeout(timer),
    },
  })
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: Utterance,
  })
  return {
    synthesis,
    restore() {
      if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
      else Reflect.deleteProperty(globalThis, 'window')
      if (previousUtterance)
        Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', previousUtterance)
      else Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance')
    },
  }
}

it('waits for English voices to load, then starts the shared script once', () => {
  const env = platform()
  let ended = 0,
    failed = 0
  const stop = speakEnglish(
    'Original listening script.',
    () => ended++,
    () => failed++,
    1,
    true,
  )
  try {
    assert.equal(env.synthesis.spoken.length, 0)
    env.synthesis.voices = [{ lang: 'en-US', localService: true }]
    env.synthesis.dispatchEvent(new Event('voiceschanged'))
    env.synthesis.dispatchEvent(new Event('voiceschanged'))
    assert.equal(env.synthesis.spoken.length, 1)
    env.synthesis.spoken[0].onend?.()
    assert.equal(ended, 1)
    assert.equal(failed, 0)
  } finally {
    stop()
    env.restore()
  }
})
it('reports unavailable English voices without declaring successful playback', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const env = platform()
  let ended = 0,
    failed = 0
  const stop = speakEnglish(
    'A sample.',
    () => ended++,
    () => failed++,
    1,
    true,
  )
  try {
    context.mock.timers.tick(2500)
    assert.equal(failed, 1)
    assert.equal(ended, 0)
    assert.equal(env.synthesis.spoken.length, 0)
  } finally {
    stop()
    env.restore()
    context.mock.timers.reset()
  }
})
it('reports interrupted playback as an error and preserves the new playback owner', () => {
  const env = platform(true)
  let firstEnded = 0,
    firstFailed = 0,
    secondEnded = 0
  const stopFirst = speakEnglish(
    'First script.',
    () => firstEnded++,
    () => firstFailed++,
    1,
    true,
  )
  const stopSecond = speakEnglish(
    'Second script.',
    () => secondEnded++,
    () => {},
    1,
    true,
  )
  try {
    assert.equal(firstFailed, 1)
    assert.equal(firstEnded, 0)
    const canceled = env.synthesis.canceled
    stopFirst()
    assert.equal(env.synthesis.canceled, canceled)
    env.synthesis.spoken[1].onend?.()
    assert.equal(secondEnded, 1)
  } finally {
    stopFirst()
    stopSecond()
    env.restore()
  }
})
it('keeps a deliberately paused study playback alive without reporting a timeout', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const env = platform(true)
  let failed = 0
  const stop = speakEnglish(
    'Study script.',
    () => {},
    () => failed++,
    0.9,
    true,
  )
  try {
    env.synthesis.paused = true
    context.mock.timers.tick(60_000)
    assert.equal(failed, 0)
  } finally {
    stop()
    env.restore()
    context.mock.timers.reset()
  }
})
