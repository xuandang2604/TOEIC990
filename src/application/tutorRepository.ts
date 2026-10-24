import { db } from '../persistence/database'
import { allQuestions, questionById, stimuli } from '../content/questions'
import { grammarById } from '../content/grammar'
import { tutorLessonByQuestion } from '../content/tutorLessons'
import type { TutorContext, TutorDraft, TutorTurn, RevisionStance } from '../domain/tutorModels'
import type { TutorReflection } from '../domain/models'
import { chooseTutorTransfer, currentTutorTurns, tutorQuestion } from '../domain/tutoring'
import { guidedTutor, requestTutorGuidance, type TutorProvider } from '../providers/tutor'
import { startSession } from './sessionRepository'
import { StudyOperationError } from './errors'

const revisionOf = (reflection: TutorReflection | undefined) => reflection?.tutor?.revision ?? 0
export class TutorDraftConflict extends StudyOperationError {}
async function archiveDraft(draft: TutorDraft) {
  const id = `${draft.id}:recovered:${draft.ownerId ?? 'legacy'}`
  const existing = await db.tutorDrafts.get(id)
  if (!existing || existing.updatedAt <= draft.updatedAt)
    await db.tutorDrafts.put({ ...draft, id, recoveryOf: draft.id })
}
/** Caller includes tutorDrafts: preserve a concurrently edited payload before clearing the slot. */
async function clearSubmittedDraft(id: string, text?: string, choice?: string | null) {
  const draft = await db.tutorDrafts.get(id)
  if (!draft) return
  if (
    text === undefined ||
    draft.text.trim() !== text ||
    (draft.phase === 'explanation' ? draft.reasonId : draft.stance) !== choice
  )
    await archiveDraft(draft)
  await db.tutorDrafts.delete(id)
}
const requireText = (text: string) => {
  const value = text.trim()
  if (value.length < 10 || value.length > 2000)
    throw new StudyOperationError(
      'Viết từ 10 đến 2.000 ký tự để lưu cách hiểu. Độ dài không được dùng để chấm chất lượng.',
    )
  return value
}
async function requireStudyAccess() {
  if (
    await db.sessions
      .where('status')
      .equals('active')
      .filter((s) => s.mode === 'exam')
      .first()
  )
    throw new StudyOperationError('Hoàn thành phiên thi trước khi mở hướng dẫn Tutor.')
}
function requireRevision(reflection: TutorReflection | undefined, expected: number) {
  if (revisionOf(reflection) !== expected)
    throw new StudyOperationError(
      'Sổ Tutor vừa thay đổi ở cửa sổ khác. Nháp hiện tại chưa được ghi chồng; mở lại câu để dùng phiên bản mới.',
    )
}
export async function readTutorDraft(id: string) {
  const draft = await db.tutorDrafts.get(id)
  if (
    draft &&
    (draft.id !== `${draft.reflectionId}:${draft.phase}` ||
      !['explanation', 'revision'].includes(draft.phase) ||
      typeof draft.text !== 'string' ||
      draft.text.length > 2000 ||
      !Number.isInteger(draft.version) ||
      draft.version < 1 ||
      !Number.isInteger(draft.baseRevision) ||
      draft.baseRevision < 0 ||
      (draft.reasonId !== null && typeof draft.reasonId !== 'string') ||
      !['changed', 'confirmed', 'uncertain'].includes(draft.stance))
  )
    throw new StudyOperationError(
      'Bản nháp đã lưu có cấu trúc cần kiểm tra. Dữ liệu được giữ nguyên; xuất bản sao trước khi thay đổi.',
    )
  return draft
}
export async function saveTutorDraft(
  input: Omit<TutorDraft, 'version' | 'updatedAt'>,
  expectedVersion: number,
) {
  if (
    input.id !== `${input.reflectionId}:${input.phase}` ||
    !['explanation', 'revision'].includes(input.phase) ||
    input.text.length > 2000 ||
    !['changed', 'confirmed', 'uncertain'].includes(input.stance)
  )
    throw new StudyOperationError('Bản nháp Tutor không hợp lệ.')
  return db.transaction(
    'rw',
    [db.tutorDrafts, db.reflections, db.attempts, db.sessions],
    async () => {
      await requireStudyAccess()
      const attempt = await db.attempts.get(input.reflectionId)
      if (!attempt || attempt.selected === null)
        throw new StudyOperationError('Cần một câu đã nộp trước khi lưu cách giải thích.')
      const reflection = await db.reflections.get(input.reflectionId)
      if (revisionOf(reflection) !== input.baseRevision)
        throw new TutorDraftConflict(
          'Sổ Tutor đã đổi phiên bản; nháp của bạn được giữ riêng để đối chiếu.',
        )
      if (reflection?.transferSessionId)
        throw new TutorDraftConflict(
          'Câu vận dụng đã bắt đầu; nháp chưa nộp được giữ riêng để đối chiếu.',
        )
      const existing = await db.tutorDrafts.get(input.id)
      if ((existing?.version ?? 0) !== expectedVersion)
        throw new TutorDraftConflict(
          'Có bản nháp mới hơn ở cửa sổ khác. Nháp đang gõ được giữ thành bản riêng, không ghi chồng.',
        )
      if (
        existing &&
        existing.ownerId !== input.ownerId &&
        (existing.text !== input.text ||
          existing.reasonId !== input.reasonId ||
          existing.stance !== input.stance)
      )
        await archiveDraft(existing)
      const saved: TutorDraft = { ...input, version: expectedVersion + 1, updatedAt: Date.now() }
      await db.tutorDrafts.put(saved)
      return saved
    },
  )
}

/** Save a separate recovery branch after a concurrency conflict, never replace the main draft. */
export async function preserveTutorDraft(
  input: Omit<TutorDraft, 'version' | 'updatedAt'>,
  recoveryId: string,
) {
  if (!/^[a-f0-9-]{36}$/i.test(recoveryId) || input.text.length > 2000)
    throw new StudyOperationError('Không thể tạo bản nháp đối chiếu hợp lệ.')
  const id = `${input.id}:recovered:${recoveryId}`
  await db.transaction('rw', db.tutorDrafts, async () => {
    const previous = await db.tutorDrafts.get(id)
    await db.tutorDrafts.put({
      ...input,
      id,
      recoveryOf: input.id,
      version: (previous?.version ?? 0) + 1,
      updatedAt: Date.now(),
    })
  })
}

export async function submitTutorExplanation(
  input: {
    attemptId: string
    text: string
    reasonId: string | null
    expectedRevision: number
    operationId: string
  },
  signal: AbortSignal,
  provider: TutorProvider = guidedTutor,
) {
  const text = requireText(input.text)
  if (!input.operationId || input.operationId.length > 128)
    throw new StudyOperationError('Mã lượt giải thích không hợp lệ.')
  const prepared = await db.transaction(
    'r',
    [db.attempts, db.reflections, db.tutorTurns, db.sessions],
    async () => {
      await requireStudyAccess()
      const reflection = await db.reflections.get(input.attemptId)
      const existing = await db.tutorTurns.get(input.operationId)
      if (existing) {
        if (
          existing.reflectionId !== input.attemptId ||
          existing.kind !== 'explanation' ||
          existing.text !== text ||
          existing.reasonId !== input.reasonId
        )
          throw new StudyOperationError('Lượt giải thích đã thuộc một thao tác khác.')
        if (!reflection)
          throw new StudyOperationError(
            'Bản ghi gốc của lượt giải thích đang thiếu. Dữ liệu được giữ nguyên.',
          )
        return { existing: reflection }
      }
      requireRevision(reflection, input.expectedRevision)
      if (reflection?.tutor)
        throw new StudyOperationError(
          'Cách nghĩ ban đầu đã được lưu. Dùng bước Viết lại để giữ cả trước và sau khi đối chiếu.',
        )
      const attempt = await db.attempts.get(input.attemptId)
      const question = attempt && tutorQuestion(attempt, questionById)
      if (!attempt || attempt.selected === null || !question)
        throw new StudyOperationError('Chưa có câu đã trả lời với nội dung phù hợp để hướng dẫn.')
      // A stale content snapshot must not be represented as a newly authored targeted lesson.
      const lesson =
        question.provenance.revision === questionById.get(question.id)?.provenance.revision
          ? (tutorLessonByQuestion.get(question.id) ?? null)
          : null
      if (input.reasonId !== null && !lesson?.reasons.some((r) => r.id === input.reasonId))
        throw new StudyOperationError('Lý do đã chọn không thuộc hướng dẫn của câu này.')
      const turns = await db.tutorTurns
        .where('reflectionId')
        .equals(input.attemptId)
        .sortBy('createdAt')
      const context: TutorContext = {
        schemaVersion: 1,
        question,
        answer: {
          selected: attempt.selected,
          correct: attempt.correct,
          confidence: attempt.confidenceSource === 'explicit' ? attempt.confidence : null,
        },
        knowledge: question.grammarIds.flatMap((id) => {
          const g = grammarById.get(id)
          return g ? [g] : []
        }),
        lesson,
        explanation: { text, reasonId: input.reasonId },
        conversation: turns.slice(-8).map((turn) => ({
          role: 'learner',
          kind: turn.kind === 'legacy-explanation' ? 'explanation' : turn.kind,
          text: turn.text,
        })),
        privacy: { storage: 'device-only', networkConsent: false },
      }
      return { context }
    },
  )
  if ('existing' in prepared) return prepared.existing
  const response = await requestTutorGuidance(provider, prepared.context, signal)
  if (response.status !== 'ok') throw new StudyOperationError(response.message)
  return db.transaction(
    'rw',
    [db.reflections, db.tutorTurns, db.tutorDrafts, db.sessions],
    async () => {
      if (signal.aborted)
        throw new StudyOperationError('Đã dừng mở hướng dẫn. Phần chưa nộp được giữ ở nháp.')
      await requireStudyAccess()
      const existing = await db.tutorTurns.get(input.operationId)
      const previous = await db.reflections.get(input.attemptId)
      if (existing) {
        if (
          existing.reflectionId !== input.attemptId ||
          existing.kind !== 'explanation' ||
          existing.text !== text ||
          existing.reasonId !== input.reasonId
        )
          throw new StudyOperationError('Lượt giải thích đã thuộc một thao tác khác.')
        if (!previous)
          throw new StudyOperationError(
            'Bản ghi gốc của lượt giải thích đang thiếu. Dữ liệu được giữ nguyên.',
          )
        return previous
      }
      requireRevision(previous, input.expectedRevision)
      const now = Date.now()
      const turn: TutorTurn = {
        id: input.operationId,
        reflectionId: input.attemptId,
        kind: 'explanation',
        text,
        reasonId: input.reasonId,
        guidance: response.guidance,
        createdAt: now,
      }
      const reflection: TutorReflection = {
        ...previous,
        id: input.attemptId,
        attemptId: input.attemptId,
        questionId: prepared.context.question.id,
        reasoning: text,
        createdAt: previous?.createdAt ?? now,
        tutor: {
          schemaVersion: 1,
          revision: input.expectedRevision + 1,
          explanationId: turn.id,
          updatedAt: now,
        },
      }
      if (previous && !previous.tutor)
        await db.tutorTurns.add({
          id: `legacy:${previous.id}`,
          reflectionId: previous.id,
          kind: 'legacy-explanation',
          text: previous.reasoning,
          createdAt: previous.createdAt,
        })
      if (signal.aborted)
        throw new StudyOperationError('Đã dừng mở hướng dẫn. Bản nháp chưa bị xóa.')
      await db.tutorTurns.add(turn)
      await db.reflections.put(reflection)
      await clearSubmittedDraft(`${input.attemptId}:explanation`, text, input.reasonId)
      await clearSubmittedDraft(`${input.attemptId}:revision`)
      if (signal.aborted)
        throw new StudyOperationError('Đã dừng mở hướng dẫn. Bản nháp chưa bị xóa.')
      return reflection
    },
  )
}

export async function submitTutorRevision(input: {
  reflectionId: string
  text: string
  stance: RevisionStance
  expectedRevision: number
  operationId: string
}) {
  const text = requireText(input.text)
  if (
    !['changed', 'confirmed', 'uncertain'].includes(input.stance) ||
    !input.operationId ||
    input.operationId.length > 128
  )
    throw new StudyOperationError('Lượt sửa cách hiểu không hợp lệ.')
  return db.transaction(
    'rw',
    [db.reflections, db.tutorTurns, db.tutorDrafts, db.sessions],
    async () => {
      await requireStudyAccess()
      const reflection = await db.reflections.get(input.reflectionId)
      const previous = await db.tutorTurns.get(input.operationId)
      if (previous) {
        if (
          previous.reflectionId !== input.reflectionId ||
          previous.kind !== 'revision' ||
          previous.text !== text ||
          previous.stance !== input.stance
        )
          throw new StudyOperationError('Lượt sửa đã thuộc một thao tác khác.')
        return reflection
      }
      requireRevision(reflection, input.expectedRevision)
      if (!reflection?.tutor || reflection.transferSessionId)
        throw new StudyOperationError(
          'Hãy mở hướng dẫn trước, hoặc xem lại lượt vận dụng đã bắt đầu.',
        )
      const explanation = await db.tutorTurns.get(reflection.tutor.explanationId)
      if (explanation?.kind !== 'explanation')
        throw new StudyOperationError(
          'Bản hướng dẫn liên quan đang thiếu. Dữ liệu được giữ nguyên.',
        )
      const now = Date.now()
      const turn: TutorTurn = {
        id: input.operationId,
        reflectionId: reflection.id,
        kind: 'revision',
        explanationId: explanation.id,
        text,
        stance: input.stance,
        createdAt: now,
      }
      await db.tutorTurns.add(turn)
      const updated = {
        ...reflection,
        tutor: {
          ...reflection.tutor,
          revision: input.expectedRevision + 1,
          revisionId: turn.id,
          updatedAt: now,
        },
      }
      await db.reflections.put(updated)
      await clearSubmittedDraft(`${reflection.id}:revision`, text, input.stance)
      return updated
    },
  )
}

export async function beginTutorTransfer(
  reflectionId: string,
  expectedRevision: number,
  requestedQuestionId?: string,
) {
  return db.transaction(
    'rw',
    [db.reflections, db.tutorTurns, db.attempts, db.sessions, db.tutorDrafts],
    async () => {
      await requireStudyAccess()
      const reflection = await db.reflections.get(reflectionId)
      if (!reflection) throw new StudyOperationError('Lưu phần giải thích trước khi vận dụng.')
      if (reflection.transferSessionId) {
        const prior = await db.sessions.get(reflection.transferSessionId)
        if (!prior)
          throw new StudyOperationError(
            'Phiên vận dụng liên quan đang thiếu. Liên kết cũ được giữ nguyên.',
          )
        return prior
      }
      requireRevision(reflection, expectedRevision)
      const turns = await db.tutorTurns.where('reflectionId').equals(reflectionId).toArray()
      if (!currentTutorTurns(reflection, turns).revision)
        throw new StudyOperationError(
          'Hãy viết lại điều vừa hiểu trước khi thử câu vận dụng. Phần viết không được tự động chấm.',
        )
      const attempt = await db.attempts.get(reflection.attemptId)
      const question = attempt && tutorQuestion(attempt, questionById)
      if (!question)
        throw new StudyOperationError('Nội dung câu gốc đang thiếu; lịch sử vẫn được giữ.')
      const attempts = await db.attempts.toArray()
      const lesson =
        question.provenance.revision === questionById.get(question.id)?.provenance.revision
          ? (tutorLessonByQuestion.get(question.id) ?? null)
          : null
      const next = chooseTutorTransfer(question, lesson, allQuestions, stimuli, attempts)
      if (!next || (requestedQuestionId && !next.questionIds.includes(requestedQuestionId)))
        throw new StudyOperationError(
          'Chưa có câu vận dụng phù hợp hoặc đề xuất đã thay đổi. Hãy mở lại phần hướng dẫn.',
        )
      const active = await db.sessions.where('status').equals('active').first()
      if (active) return active
      const session = await startSession('tutor', next.questionIds)
      await db.reflections.put({
        ...reflection,
        transferSessionId: session.id,
        tutor: { ...reflection.tutor!, revision: expectedRevision + 1, updatedAt: Date.now() },
      })
      await clearSubmittedDraft(`${reflectionId}:explanation`)
      await clearSubmittedDraft(`${reflectionId}:revision`)
      return session
    },
  )
}

/** Compatibility exports: one authoritative repository now owns the complete Tutor flow. */
export async function saveReflection(attemptId: string, reasoning: string) {
  const reflection = await db.reflections.get(attemptId)
  return submitTutorExplanation(
    {
      attemptId,
      text: reasoning,
      reasonId: null,
      expectedRevision: revisionOf(reflection),
      operationId: crypto.randomUUID(),
    },
    new AbortController().signal,
  )
}
export async function startTransfer(reflectionId: string, transferQuestionId: string) {
  const reflection = await db.reflections.get(reflectionId)
  return beginTutorTransfer(reflectionId, revisionOf(reflection), transferQuestionId)
}
