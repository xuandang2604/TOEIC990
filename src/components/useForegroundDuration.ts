import { useEffect, useRef } from 'react'

/** Ephemeral reference exercise timing; only a submitted assessment is persisted. */
export function useForegroundDuration(enabled: boolean) {
  const elapsed = useRef(0),
    last = useRef<number | null>(null)
  const checkpoint = (running: boolean) => {
    const now = performance.now()
    if (last.current !== null) elapsed.current += Math.max(0, Math.min(2000, now - last.current))
    last.current = running ? now : null
  }
  useEffect(() => {
    if (!enabled) return
    const update = () =>
      checkpoint(
        document.visibilityState === 'visible' &&
          document.hasFocus() &&
          !document.querySelector('[role="dialog"]'),
      )
    const pause = () => checkpoint(false)
    update()
    const timer = window.setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    document.addEventListener('focusin', update)
    window.addEventListener('focus', update)
    window.addEventListener('blur', pause)
    window.addEventListener('pagehide', pause)
    return () => {
      pause()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
      document.removeEventListener('focusin', update)
      window.removeEventListener('focus', update)
      window.removeEventListener('blur', pause)
      window.removeEventListener('pagehide', pause)
    }
  }, [enabled])
  return {
    read: () => {
      checkpoint(false)
      return Math.round(elapsed.current)
    },
    reset: () => {
      elapsed.current = 0
      last.current = null
    },
  }
}
