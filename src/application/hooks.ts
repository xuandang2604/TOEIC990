import { useCallback, useEffect, useRef, useState } from 'react'
import { StudyOperationError } from './errors'

let pendingOperations = 0
const operationListeners = new Set<() => void>()
export const readPendingOperations = () => pendingOperations
export const subscribeOperations = (listener: () => void) => {
  operationListeners.add(listener)
  return () => {
    operationListeners.delete(listener)
  }
}
function changeOperations(delta: number) {
  pendingOperations += delta
  for (const listener of operationListeners) listener()
}

export function useAction() {
  const lock = useRef(false)
  const mounted = useRef(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const run = useCallback(async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    if (lock.current) return undefined
    lock.current = true
    changeOperations(1)
    setBusy(true)
    setError(null)
    try {
      return await action()
    } catch (failure) {
      if (!(failure instanceof StudyOperationError))
        console.error(
          'study990: action failed',
          failure instanceof Error ? failure.name : 'Unknown',
        )
      if (mounted.current)
        setError(
          failure instanceof StudyOperationError
            ? failure.message
            : 'Không lưu được dữ liệu. Kiểm tra dung lượng hoặc quyền lưu trữ rồi thử lại. Thao tác chưa được ghi nhận.',
        )
      return undefined
    } finally {
      lock.current = false
      changeOperations(-1)
      if (mounted.current) setBusy(false)
    }
  }, [])
  return { run, busy, error, clearError: () => setError(null) }
}

export function useNow() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const update = () => setTick((tick) => tick + 1)
    const interval = window.setInterval(update, 30_000)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', update)
    }
  }, [])
  // Also read the clock on data-driven renders so a just-created card is due immediately.
  return Date.now()
}

export interface Route {
  page: string
  id?: string
  returnTo?: ReferenceOrigin
  focusQuestionId?: string
  returnTutorId?: string
}
export interface ReferenceOrigin {
  sessionId: string
  questionId: string
}
function readRoute(): Route {
  const [path, search = ''] = window.location.hash.replace(/^#\/?/, '').split('?')
  const [page, id] = path.split('/')
  try {
    const params = new URLSearchParams(search)
    const sessionId = params.get('from'),
      questionId = params.get('question')
    return {
      page: page || 'today',
      id: id ? decodeURIComponent(id) : undefined,
      ...(sessionId && questionId ? { returnTo: { sessionId, questionId } } : {}),
      focusQuestionId: params.get('focus') ?? undefined,
      returnTutorId: params.get('tutor') ?? undefined,
    }
  } catch (error) {
    if (error instanceof URIError) return { page: 'not-found' }
    throw error
  }
}
export function useRoute() {
  const [route, setRoute] = useState(readRoute)
  useEffect(() => {
    const onChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
export function navigate(page: string, id?: string) {
  window.location.hash = `/${page}${id ? `/${encodeURIComponent(id)}` : ''}`
}
/** Reference links carry the source question in the URL; browser Back and refresh keep the trail. */
export function navigateReference(
  page: 'grammar' | 'vocabulary' | 'review' | 'reference',
  id?: string,
  origin?: ReferenceOrigin,
  tutorId?: string,
) {
  const source = origin ?? readRoute().returnTo
  const tutor = tutorId ?? readRoute().returnTutorId
  const params = new URLSearchParams()
  if (source) {
    params.set('from', source.sessionId)
    params.set('question', source.questionId)
  }
  if (tutor) params.set('tutor', tutor)
  window.location.hash = `/${page}${id ? `/${encodeURIComponent(id)}` : ''}${params.size ? `?${params}` : ''}`
}
export function returnToQuestion(origin: ReferenceOrigin) {
  window.location.hash = `/session/${encodeURIComponent(origin.sessionId)}?focus=${encodeURIComponent(origin.questionId)}`
}
