import { db } from '../persistence/database'

const LEASE_MS = 12_000
const MAX_CHECKPOINT_MS = 10_000
/** Caller owns timings + leases in its transaction. Returns measured time, or unknown. */
export async function finishQuestionTiming(
  sessionId: string,
  questionId: string,
  now: number,
): Promise<number | null> {
  const lease = await db.timingLeases.get('foreground')
  const id = `${sessionId}:${questionId}`
  const row = await db.questionTimings.get(id)
  if (lease?.sessionId === sessionId && lease.questionId === questionId) {
    const delta =
      now >= lease.checkpointAt && now <= lease.expiresAt
        ? Math.min(MAX_CHECKPOINT_MS, now - lease.checkpointAt)
        : 0
    const elapsedMs = (row?.elapsedMs ?? 0) + delta
    await db.questionTimings.put({ id, sessionId, questionId, elapsedMs, updatedAt: now })
    await db.timingLeases.delete('foreground')
    return elapsedMs
  }
  return row?.elapsedMs ?? null
}
export async function checkpointQuestionTime(
  sessionId: string,
  questionId: string,
  ownerId: string,
  active: boolean,
  now: number,
) {
  if (!Number.isFinite(now)) return
  await db.transaction(
    'rw',
    [db.sessions, db.attempts, db.questionTimings, db.timingLeases],
    async () => {
      const session = await db.sessions.get(sessionId)
      const lease = await db.timingLeases.get('foreground')
      const measuredNow =
        session?.mode === 'exam' && session.deadlineAt !== undefined
          ? Math.min(now, session.deadlineAt)
          : now
      if (
        lease?.ownerId === ownerId &&
        lease.sessionId === sessionId &&
        lease.questionId === questionId
      )
        await finishQuestionTiming(sessionId, questionId, measuredNow)
      else if (lease && lease.expiresAt > now) return
      if (
        !active ||
        !session ||
        session.status !== 'active' ||
        (session.mode === 'exam' &&
          session.deadlineAt !== undefined &&
          now >= session.deadlineAt) ||
        !session.questionIds.includes(questionId) ||
        (await db.attempts.get(`${sessionId}:${questionId}`))
      )
        return
      const id = `${sessionId}:${questionId}`
      if (!(await db.questionTimings.get(id)))
        await db.questionTimings.put({ id, sessionId, questionId, elapsedMs: 0, updatedAt: now })
      await db.timingLeases.put({
        id: 'foreground',
        ownerId,
        sessionId,
        questionId,
        checkpointAt: now,
        expiresAt: now + LEASE_MS,
      })
    },
  )
}
