import type { TutorDraft } from '../domain/tutorModels'

type MemoryDraft = Pick<TutorDraft, 'reflectionId' | 'phase' | 'text'> & {
  id: string
  updatedAt: number
}
let snapshot: MemoryDraft[] = []
const listeners = new Set<() => void>()
const pendingDrafts = new Set<string>()
export const hasUnsavedTutorWork = () => pendingDrafts.size > 0 || snapshot.length > 0
export function setTutorDraftPending(id: string, pending: boolean) {
  if (pending === pendingDrafts.has(id)) return
  if (pending) pendingDrafts.add(id)
  else pendingDrafts.delete(id)
  changed()
}
const changed = () => {
  for (const listener of listeners) listener()
}
/** Emergency copy for failed disk writes; never presented as durable storage. */
export function retainTutorDraftMemory(
  id: string,
  draft: Pick<MemoryDraft, 'reflectionId' | 'phase' | 'text'>,
) {
  snapshot = [...snapshot.filter((row) => row.id !== id), { ...draft, id, updatedAt: Date.now() }]
  changed()
}
export function clearTutorDraftMemory(id: string) {
  if (!snapshot.some((row) => row.id === id)) return
  snapshot = snapshot.filter((row) => row.id !== id)
  changed()
}
export const readTutorDraftMemory = () => snapshot
export const subscribeTutorDraftMemory = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
