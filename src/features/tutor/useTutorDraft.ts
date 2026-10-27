import { useEffect, useRef, useState } from 'react'
import {
  preserveTutorDraft,
  readTutorDraft,
  saveTutorDraft,
  TutorDraftConflict,
} from '../../application/tutorRepository'
import { StudyOperationError } from '../../application/errors'
import {
  clearTutorDraftMemory,
  retainTutorDraftMemory,
  setTutorDraftPending,
} from '../../application/tutorDraftRecovery'
import type { TutorDraft } from '../../domain/tutorModels'
import { registerUpdatePreparation } from '../../application/updatePreparation'

type Values = Pick<TutorDraft, 'text' | 'reasonId' | 'stance'>
/** Serialized, optimistic draft writes. A stale tab never silently replaces a newer draft. */
export function useTutorDraft(
  reflectionId: string,
  phase: TutorDraft['phase'],
  baseRevision: number,
  initial: Values,
) {
  const [values, setValues] = useState<Values>(initial)
  const initialValues = useRef(initial)
  const [loaded, setLoaded] = useState(false)
  const ready = useRef(false)
  const [retry, setRetry] = useState(0)
  const latest = useRef(values),
    dirty = useRef(false),
    submitted = useRef(false)
  const version = useRef(0),
    mounted = useRef(true)
  const pending = useRef<Promise<boolean>>(Promise.resolve(true))
  const recoveryId = useRef(crypto.randomUUID())
  const [status, setStatus] = useState('Đang mở bản nháp…')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let current = true
    void readTutorDraft(`${reflectionId}:${phase}`)
      .then((draft) => {
        if (!current) return
        version.current = draft?.version ?? 0
        const restored =
          draft?.baseRevision === baseRevision
            ? { text: draft.text, reasonId: draft.reasonId, stance: draft.stance }
            : initialValues.current
        latest.current = restored
        setValues(restored)
        ready.current = true
        setLoaded(true)
        setError(null)
        setStatus(
          draft?.baseRevision === baseRevision ? 'Nháp đã lưu trên thiết bị' : 'Chưa chỉnh sửa',
        )
      })
      .catch((failure: unknown) => {
        if (!(failure instanceof StudyOperationError))
          console.error(
            'study990: tutor draft read failed',
            failure instanceof Error ? failure.name : 'Unknown',
          )
        if (current) {
          setStatus('Chưa mở được nháp')
          setError(
            failure instanceof StudyOperationError
              ? failure.message
              : 'Chưa đọc được bản nháp. Thử mở lại; không có dữ liệu nào bị xóa.',
          )
        }
      })
    return () => {
      current = false
    }
  }, [reflectionId, phase, baseRevision, retry])
  function update(patch: Partial<Values>) {
    latest.current = { ...latest.current, ...patch }
    dirty.current = true
    setTutorDraftPending(recoveryId.current, true)
    setValues(latest.current)
    setStatus('Có thay đổi chưa lưu…')
  }
  function flush() {
    pending.current = pending.current.then(async () => {
      if (!ready.current) return false
      if (!dirty.current || submitted.current) return true
      const snapshot = latest.current
      try {
        const saved = await saveTutorDraft(
          {
            ...snapshot,
            id: `${reflectionId}:${phase}`,
            reflectionId,
            phase,
            baseRevision,
            ownerId: recoveryId.current,
          },
          version.current,
        )
        version.current = saved.version
        clearTutorDraftMemory(recoveryId.current)
        if (latest.current === snapshot) {
          dirty.current = false
          setTutorDraftPending(recoveryId.current, false)
        }
        if (mounted.current) {
          setError(null)
          setStatus(dirty.current ? 'Có thay đổi chưa lưu…' : 'Nháp đã lưu trên thiết bị')
        }
        return true
      } catch (failure) {
        let message: string | undefined
        let recovered = false
        if (failure instanceof TutorDraftConflict) {
          try {
            await preserveTutorDraft(
              { ...snapshot, id: `${reflectionId}:${phase}`, reflectionId, phase, baseRevision },
              recoveryId.current,
            )
            message =
              'Có cập nhật từ cửa sổ khác. Nội dung của bạn đã được giữ ở mục “Nháp cần đối chiếu”; sao chép lại trước khi mở lại câu.'
            recovered = true
          } catch (recoveryFailure) {
            console.error(
              'study990: tutor draft recovery failed',
              recoveryFailure instanceof Error ? recoveryFailure.name : 'Unknown',
            )
            message =
              'Chưa lưu được bản nháp xung đột. Giữ trang này mở và sao chép nội dung trước khi rời trang.'
          }
        }
        if (!(failure instanceof StudyOperationError))
          console.error(
            'study990: tutor draft failed',
            failure instanceof Error ? failure.name : 'Unknown',
          )
        if (recovered) {
          clearTutorDraftMemory(recoveryId.current)
          if (latest.current === snapshot) setTutorDraftPending(recoveryId.current, false)
        } else
          retainTutorDraftMemory(recoveryId.current, { reflectionId, phase, text: snapshot.text })
        if (mounted.current) {
          setError(
            message ??
              (failure instanceof StudyOperationError
                ? failure.message
                : 'Chưa lưu được nháp. Giữ trang này mở, sao chép nội dung nếu cần rồi thử lưu lại.'),
          )
          setStatus(recovered ? 'Nháp đã được giữ riêng' : 'Nháp chưa được lưu')
        }
        return false
      }
    })
    return pending.current
  }
  useEffect(
    () =>
      registerUpdatePreparation(async () => {
        if (dirty.current && !submitted.current && !(await flush()))
          throw new StudyOperationError(
            'Chưa lưu xong nháp Tutor. Giữ trang mở và dùng nút lưu/thử lại trong Tutor trước khi cập nhật.',
          )
      }),
    [reflectionId, phase, baseRevision],
  )
  useEffect(() => {
    if (!dirty.current) return
    const timer = window.setTimeout(() => {
      void flush()
    }, 700)
    return () => window.clearTimeout(timer)
  }, [values])
  useEffect(() => {
    mounted.current = true
    const save = () => {
      void flush()
    }
    window.addEventListener('blur', save)
    window.addEventListener('pagehide', save)
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current && !submitted.current) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      mounted.current = false
      window.removeEventListener('blur', save)
      window.removeEventListener('pagehide', save)
      window.removeEventListener('beforeunload', beforeUnload)
      void flush()
    }
  }, [reflectionId, phase, baseRevision])
  return {
    values,
    update,
    flush,
    status,
    error,
    loaded,
    retry: () => setRetry((n) => n + 1),
    committed: () => {
      clearTutorDraftMemory(recoveryId.current)
      submitted.current = true
      dirty.current = false
      setTutorDraftPending(recoveryId.current, false)
    },
  }
}
