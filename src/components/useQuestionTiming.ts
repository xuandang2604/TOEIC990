import { useEffect, useState } from 'react'
import { checkpointQuestionTime } from '../application/timingRepository'

/** One focused question per unit. Background time is not filled in after a restart. */
export function useQuestionTiming(sessionId: string, questionId: string, enabled: boolean) {
  const [warning, setWarning] = useState<string | null>(null)
  useEffect(() => {
    if (!enabled) return
    const ownerId = crypto.randomUUID()
    let mounted = true
    let pending = Promise.resolve()
    let failureLogged = false
    const write = (active: boolean) => {
      const now = Date.now()
      pending = pending.then(async () => {
        try {
          await checkpointQuestionTime(sessionId, questionId, ownerId, active, now)
          failureLogged = false
          if (mounted) setWarning(null)
        } catch (failure) {
          if (!failureLogged)
            console.error(
              'study990: timing checkpoint failed',
              failure instanceof Error ? failure.name : 'Unknown',
            )
          failureLogged = true
          if (mounted)
            setWarning(
              'Chưa ghi được thời gian tương tác. Bạn vẫn có thể trả lời; khoảng thời gian thiếu sẽ không được tự điền.',
            )
        }
      })
    }
    const pulse = () =>
      write(
        document.visibilityState === 'visible' &&
          document.hasFocus() &&
          !document.querySelector('[role="dialog"]'),
      )
    const suspend = () => write(false)
    pulse()
    const timer = window.setInterval(pulse, 5000)
    document.addEventListener('visibilitychange', pulse)
    document.addEventListener('focusin', pulse)
    window.addEventListener('focus', pulse)
    window.addEventListener('blur', suspend)
    window.addEventListener('pagehide', suspend)
    return () => {
      mounted = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', pulse)
      document.removeEventListener('focusin', pulse)
      window.removeEventListener('focus', pulse)
      window.removeEventListener('blur', suspend)
      window.removeEventListener('pagehide', suspend)
      suspend()
    }
  }, [sessionId, questionId, enabled])
  return warning
}
