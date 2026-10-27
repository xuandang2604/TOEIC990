import { questionById, questions, stimuli } from '../content/questions'
import { MINI_EXAM_MINUTES, questionAvailable } from '../domain/assessment'
import type { PracticeMode, SessionKind } from '../domain/models'
import { db } from '../persistence/database'
import { StudyOperationError } from './errors'
import { mockById, availableMockExams } from '../content/mockExams'
import { questionAssessmentEligible } from '../content/eligibility'
import { finishExam } from './examRepository'
import { finishQuestionTiming } from './timingRepository'
import { validRecord } from '../persistence/records'

export async function startSession(
  kind: SessionKind,
  questionIds: string[],
  options: { mode?: PracticeMode; durationMinutes?: number; mockExamId?: string } = {},
) {
  const mode = kind === 'mini-exam' ? 'exam' : (options.mode ?? 'study')
  const duration = options.durationMinutes ?? MINI_EXAM_MINUTES
  if (
    (mode !== 'study' && mode !== 'exam') ||
    (mode === 'exam' &&
      (!Number.isInteger(duration) ||
        duration < 1 ||
        duration > 120 ||
        !['practice', 'mini-exam'].includes(kind)))
  )
    throw new StudyOperationError('Thiết lập phiên thi không hợp lệ.')
  const ids = [...new Set(questionIds)]
  if (mode === 'exam' && ids.some((id) => !questionAssessmentEligible(id)))
    throw new StudyOperationError(
      'Nội dung này chưa được cho phép dùng trong lượt tự đánh giá. Hãy dùng Study Mode.',
    )
  if (options.mockExamId) {
    const exam = mockById.get(options.mockExamId)
    if (
      !exam ||
      !availableMockExams.includes(exam) ||
      mode !== 'exam' ||
      kind !== 'practice' ||
      duration !== exam.durationMinutes ||
      ids.join('|') !== exam.questionIds.join('|')
    )
      throw new StudyOperationError('Bộ mock chưa đủ cấu trúc hoặc lựa chọn phiên không khớp đề.')
  }
  if (!ids.length || ids.some((id) => !questionById.has(id)))
    throw new StudyOperationError('Không có câu hỏi phù hợp để bắt đầu.')
  if (ids.some((id) => !questionAvailable(questionById.get(id)!, stimuli)))
    throw new StudyOperationError('Một câu chưa có tư liệu sẵn sàng để chấm. Hãy chọn nhóm khác.')
  if (kind === 'mini-exam' && new Set(ids.map((id) => questionById.get(id)!.part)).size !== 7)
    throw new StudyOperationError('Mini-test cần tư liệu sẵn sàng cho cả bảy Parts.')
  if (mode === 'exam') {
    for (const id of ids) {
      const question = questionById.get(id)!
      if (
        question.stimulusId &&
        [3, 4, 6, 7].includes(question.part) &&
        questions.some((q) => q.stimulusId === question.stimulusId && !ids.includes(q.id))
      )
        throw new StudyOperationError(
          'Phiên thi phải giữ đủ nhóm câu dùng chung audio hoặc văn bản.',
        )
    }
  }
  if (mode === 'exam') ids.sort((a, b) => questionById.get(a)!.part - questionById.get(b)!.part)
  return db.transaction('rw', db.sessions, async () => {
    const active = await db.sessions.where('status').equals('active').first()
    if (active) return active
    const session = {
      id: crypto.randomUUID(),
      kind,
      mode,
      questionIds: ids,
      cursor: 0,
      status: 'active' as const,
      startedAt: Date.now(),
      ...(options.mockExamId ? { mockExamId: options.mockExamId } : {}),
      ...(mode === 'exam'
        ? {
            deadlineAt: Date.now() + duration * 60_000,
            lastObservedAt: Date.now(),
            readingStarted: questionById.get(ids[0])!.part >= 5,
          }
        : {}),
    }
    await db.sessions.add(session)
    return session
  })
}

/** Close only an unrenderable active session. Preserve answers/drafts, and never grade or award completion. */
export async function closeUnavailableSession(sessionId: string) {
  return db.transaction('rw', [db.sessions, db.dailyPlans, db.timingLeases], async () => {
    const session = await db.sessions.get(sessionId)
    if (!session) throw new StudyOperationError('Không tìm thấy phiên học.')
    if (session.status !== 'active') return session
    if (
      session.questionIds.every((id) => {
        const question = questionById.get(id)
        return question && questionAvailable(question, stimuli)
      })
    )
      throw new StudyOperationError(
        'Tư liệu của phiên vẫn sẵn sàng. Hãy kết thúc phiên theo luồng học bình thường.',
      )
    const now = Date.now()
    const updated = {
      ...session,
      status: 'interrupted' as const,
      interruptedAt: now,
      interruptionReason: 'content-unavailable' as const,
    }
    await db.sessions.put(updated)
    const plans = await db.dailyPlans
      .where('status')
      .equals('active')
      .filter((p) => p.practiceSessionId === sessionId)
      .toArray()
    for (const plan of plans)
      await db.dailyPlans.put({ ...plan, status: 'archived', completedAt: now })
    const lease = await db.timingLeases.get('foreground')
    if (lease?.sessionId === sessionId) await db.timingLeases.delete('foreground')
    return updated
  })
}

/** One atomic checkpoint for an explicit "end sessions and update" action; no study drafts are graded. */
export async function finishSessionsForUpdate() {
  await db.transaction('rw', db.tables, async () => {
    const sessions = await db.sessions.where('status').equals('active').toArray()
    if (sessions.some((session) => !validRecord('sessions', session)))
      throw new StudyOperationError(
        'Có phiên học cần kiểm tra dữ liệu. Chưa kết thúc phiên hoặc cập nhật; hãy xuất sổ học để kiểm tra.',
      )
    for (const session of sessions) {
      if (session.mode === 'exam') {
        // Reuse the normal submission path: saved choices and omissions, with existing idempotency.
        await finishExam(session.id)
      } else {
        const now = Date.now()
        const attempts = await db.attempts.where('sessionId').equals(session.id).toArray()
        const answered = new Set(
          attempts.filter((a) => a.selected !== null).map((a) => a.questionId),
        )
        const complete = session.questionIds.every((id) => answered.has(id))
        const lease = await db.timingLeases.get('foreground')
        if (lease?.sessionId === session.id)
          await finishQuestionTiming(session.id, lease.questionId, now)
        await db.sessions.put(
          complete
            ? { ...session, status: 'completed', completedAt: now }
            : {
                ...session,
                status: 'interrupted',
                interruptedAt: now,
                interruptionReason: 'app-update',
              },
        )
        if (!complete) {
          const plans = await db.dailyPlans
            .where('status')
            .equals('active')
            .filter((plan) => plan.practiceSessionId === session.id)
            .toArray()
          for (const plan of plans)
            await db.dailyPlans.put({ ...plan, status: 'archived', completedAt: now })
        }
      }
      await db.playbacks
        .where('sessionId')
        .equals(session.id)
        .filter((p) => p.status === 'started')
        .modify({ status: 'failed', error: 'interrupted', assisted: true, updatedAt: Date.now() })
    }
  })
}

export async function hasActiveSessions() {
  return (await db.sessions.where('status').equals('active').count()) > 0
}
