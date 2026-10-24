import { grammarById } from '../content/grammar'
import type { OptionId } from '../content/schema'
import type { GrammarReferenceSnapshot, SkillEvidence } from '../domain/models'
import { assessGrammarExercise } from '../domain/grammarPractice'
import { db } from '../persistence/database'
import { StudyOperationError } from './errors'

/** Reference practice records evidence without opening/replacing a TOEIC session or rating a card. */
export async function submitGrammarPractice(
  lessonId: string,
  exerciseId: string,
  selected: OptionId,
  operationId: string,
  timeSpentMs: number | null,
) {
  const lesson = grammarById.get(lessonId),
    exercise = lesson?.practice.find((e) => e.id === exerciseId)
  const result = exercise ? assessGrammarExercise(exercise, selected) : undefined
  if (
    !lesson ||
    !exercise ||
    !result ||
    !operationId ||
    operationId.length > 80 ||
    (timeSpentMs !== null && (!Number.isFinite(timeSpentMs) || timeSpentMs < 0))
  )
    throw new StudyOperationError('Bài luyện ngữ pháp hoặc lựa chọn không hợp lệ.')
  const attemptId = `grammar:${operationId}`,
    questionId = `grammar:${lessonId}:${exerciseId}`
  return db.transaction('rw', [db.skillEvidence, db.mistakes, db.sessions], async () => {
    const existing = await db.skillEvidence.where('attemptId').equals(attemptId).first()
    if (existing) {
      if (existing.questionId !== questionId || existing.reference?.selected !== selected)
        throw new StudyOperationError(
          'Lượt luyện đã thuộc một thao tác khác. Chọn Làm lại để bắt đầu lượt mới.',
        )
      return result
    }
    if (
      await db.sessions
        .where('status')
        .equals('active')
        .filter((s) => s.mode === 'exam')
        .first()
    )
      throw new StudyOperationError('Hãy hoàn thành phiên thi trước khi luyện ngữ pháp.')
    const now = Date.now()
    const reference: GrammarReferenceSnapshot = {
      lessonId,
      exerciseId,
      prompt: exercise.prompt,
      options: structuredClone(exercise.options),
      selected,
      answer: exercise.answer,
      explanation: exercise.explanation,
      revision: lesson.provenance.revision,
    }
    const rows: SkillEvidence[] = [...new Set(lesson.skills)].map((skillId) => ({
      id: `${attemptId}:${skillId}`,
      attemptId,
      questionId,
      sessionId: null,
      skillId,
      part: null,
      difficulty: null,
      outcome: result.correct ? 'correct' : 'incorrect',
      occurredAt: now,
      confidence: null,
      timeSpentMs,
      origin: 'at-answer',
      source: 'grammar-practice',
      reference,
    }))
    await db.skillEvidence.bulkAdd(rows)
    if (!result.correct)
      await db.mistakes.add({
        id: attemptId,
        sessionId: null,
        questionId,
        skills: [...lesson.skills],
        selected,
        correctOption: exercise.answer,
        occurredAt: now,
        confidence: null,
        timeSpentMs,
        revision: lesson.provenance.revision,
        origin: 'at-answer',
        omitted: false,
        reference,
      })
    return result
  })
}
