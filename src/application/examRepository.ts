import { allQuestions, questionById, stimulusFor } from '../content/questions'
import {
  assessExam,
  canNavigateExam,
  examExpired,
  playbackDecision,
  sessionUnits,
  validSelection,
} from '../domain/assessment'
import type { OptionId } from '../content/schema'
import type { PlaybackRecord, StudySession } from '../domain/models'
import { db } from '../persistence/database'
import { recordAttempt } from './attemptRecorder'
import { StudyOperationError } from './errors'
import { finishQuestionTiming } from './timingRepository'

const examTables = [
  db.sessions,
  db.responses,
  db.attempts,
  db.cards,
  db.reviewEvents,
  db.skillEvidence,
  db.mistakes,
  db.questionTimings,
  db.timingLeases,
]
function requireExam(session: StudySession | undefined): asserts session is StudySession {
  if (!session || session.mode !== 'exam')
    throw new StudyOperationError('Không tìm thấy phiên thi.')
  if (!Number.isFinite(session.deadlineAt))
    throw new StudyOperationError(
      'Phiên thi thiếu hạn giờ hợp lệ. Dữ liệu được giữ nguyên; hãy xuất bản sao để kiểm tra.',
    )
}
/** Caller owns the complete exam transaction; all scoring is committed once, with the session. */
async function finalize(session: StudySession, now: number) {
  if (session.status !== 'active') return session
  const timedOut = examExpired(session, now)
  const completedAt = timedOut ? session.deadlineAt! : now
  const responses = await db.responses.where('sessionId').equals(session.id).toArray()
  const attempts = assessExam(session, allQuestions, responses, completedAt)
  for (const attempt of attempts) {
    attempt.timeSpentMs = await finishQuestionTiming(
      session.id,
      attempt.questionId,
      Math.min(now, session.deadlineAt!),
    )
    await recordAttempt(attempt, false)
  }
  const updated: StudySession = {
    ...session,
    status: 'completed',
    completedAt,
    finishReason: timedOut ? 'timeout' : 'submitted',
    lastObservedAt: Math.max(now, session.lastObservedAt ?? now),
  }
  await db.sessions.put(updated)
  return updated
}
export async function finishExam(sessionId: string) {
  return db.transaction('rw', examTables, async () => {
    const session = await db.sessions.get(sessionId)
    requireExam(session)
    return finalize(session, Date.now())
  })
}
export async function saveExamResponse(sessionId: string, questionId: string, selected: OptionId) {
  const question = questionById.get(questionId)
  if (!question || !validSelection(question, selected))
    throw new StudyOperationError('Lựa chọn không hợp lệ.')
  return db.transaction('rw', examTables, async () => {
    const session = await db.sessions.get(sessionId)
    requireExam(session)
    const now = Date.now()
    if (session.status !== 'active') return session
    if (examExpired(session, now)) return finalize(session, now)
    const unit = sessionUnits(session, allQuestions).find((u) =>
      u.questionIds.includes(session.questionIds[session.cursor]),
    )
    if (!unit?.questionIds.includes(questionId))
      throw new StudyOperationError('Nhóm câu hỏi đã thay đổi. Vui lòng mở lại phiên thi.')
    await db.responses.put({
      id: `${sessionId}:${questionId}`,
      sessionId,
      questionId,
      selected,
      updatedAt: now,
    })
    await db.sessions.put({
      ...session,
      lastObservedAt: Math.max(now, session.lastObservedAt ?? now),
    })
    return session
  })
}
export async function navigateExam(sessionId: string, targetId: string) {
  return db.transaction('rw', [...examTables, db.playbacks], async () => {
    const session = await db.sessions.get(sessionId)
    requireExam(session)
    const now = Date.now()
    if (session.status !== 'active') return session
    if (examExpired(session, now)) return finalize(session, now)
    if (!canNavigateExam(session, allQuestions, targetId))
      throw new StudyOperationError(
        'Phần nghe đi theo thứ tự và không quay lại sau khi chuyển nhóm.',
      )
    const units = sessionUnits(session, allQuestions)
    const current = units.find((u) => u.questionIds.includes(session.questionIds[session.cursor]))!
    const target = questionById.get(targetId)!
    if (current.part <= 4 && !current.questionIds.includes(targetId)) {
      const playback = await db.playbacks.get(`${sessionId}:${current.id}`)
      if (!playback || playback.status === 'started')
        throw new StudyOperationError('Hãy nghe xong hoặc chọn bỏ qua audio trước khi chuyển nhóm.')
    }
    const updated = {
      ...session,
      cursor: session.questionIds.indexOf(targetId),
      readingStarted: session.readingStarted || target.part >= 5,
      lastObservedAt: Math.max(now, session.lastObservedAt ?? now),
    }
    await db.sessions.put(updated)
    return updated
  })
}
export async function beginExamPlayback(sessionId: string, stimulusId: string, recover = false) {
  return db.transaction('rw', [db.sessions, db.playbacks], async () => {
    const session = await db.sessions.get(sessionId)
    requireExam(session)
    if (session.status !== 'active' || examExpired(session, Date.now()))
      throw new StudyOperationError('Phiên thi đã kết thúc hoặc hết giờ.')
    const unit = sessionUnits(session, allQuestions).find((u) =>
      u.questionIds.includes(session.questionIds[session.cursor]),
    )
    const q = unit ? questionById.get(unit.questionIds[0]) : undefined
    const stimulus = q ? stimulusFor(q) : undefined
    if (!unit || unit.id !== stimulusId || !stimulus || !('audio' in stimulus))
      throw new StudyOperationError('Audio không thuộc nhóm câu hiện tại.')
    const id = `${sessionId}:${stimulusId}`
    const previous = await db.playbacks.get(id)
    const decision = playbackDecision(previous, recover)
    if (decision === 'blocked')
      throw new StudyOperationError(
        'Audio của nhóm này đã phát. Chế độ thi không phát lại sau khi nghe xong.',
      )
    const record: PlaybackRecord = {
      id,
      sessionId,
      stimulusId,
      token: crypto.randomUUID(),
      status: 'started',
      playCount: (previous?.playCount ?? 0) + 1,
      assisted: previous?.assisted || decision === 'recover',
      updatedAt: Date.now(),
      ...(decision === 'recover' ? { error: 'interrupted' as const } : {}),
    }
    await db.playbacks.put(record)
    return record
  })
}
export async function endExamPlayback(record: PlaybackRecord, status: 'completed' | 'failed') {
  return db.transaction('rw', [db.playbacks, db.sessions], async () => {
    const current = await db.playbacks.get(record.id)
    if (!current || current.token !== record.token || current.status !== 'started') return
    const session = await db.sessions.get(record.sessionId)
    if (!session || session.status !== 'active' || examExpired(session, Date.now())) return
    await db.playbacks.put({
      ...current,
      status,
      error: status === 'failed' ? 'media' : current.error,
      assisted: current.assisted || status === 'failed',
      updatedAt: Date.now(),
    })
  })
}
export async function skipExamAudio(sessionId: string, stimulusId: string) {
  return db.transaction('rw', [db.sessions, db.playbacks], async () => {
    const session = await db.sessions.get(sessionId)
    requireExam(session)
    if (session.status !== 'active') return
    const unit = sessionUnits(session, allQuestions).find((u) =>
      u.questionIds.includes(session.questionIds[session.cursor]),
    )
    if (unit?.id !== stimulusId || unit.part > 4)
      throw new StudyOperationError('Nhóm nghe không hợp lệ.')
    const id = `${sessionId}:${stimulusId}`
    const previous = await db.playbacks.get(id)
    if (previous?.status === 'completed') return
    await db.playbacks.put({
      id,
      sessionId,
      stimulusId,
      token: crypto.randomUUID(),
      status: 'failed',
      playCount: previous?.playCount ?? 0,
      assisted: true,
      error: 'skipped',
      updatedAt: Date.now(),
    })
  })
}
