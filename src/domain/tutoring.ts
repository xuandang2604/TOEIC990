import type { Attempt, TutorReflection } from './models'
import type { Question, Stimulus } from '../content/schema'
import type { TutorContext, TutorGuidance, TutorLesson, TutorTurn } from './tutorModels'
import { makeUnits, questionAvailable } from './assessment'

export function tutorQuestion(attempt: Attempt, bank: Map<string, Question>) {
  return attempt.questionSnapshot?.content ?? bank.get(attempt.questionId)
}
export function currentTutorTurns(reflection: TutorReflection | undefined, turns: TutorTurn[]) {
  const explanation = turns.find((t) => t.id === reflection?.tutor?.explanationId)
  const revision = turns.find((t) => t.id === reflection?.tutor?.revisionId)
  return {
    explanation: explanation?.kind === 'explanation' ? explanation : undefined,
    revision:
      revision?.kind === 'revision' && revision.explanationId === explanation?.id
        ? revision
        : undefined,
  }
}
/** Return an intact, related unit. A seen unit is marked as reuse rather than called new. */
export function chooseTutorTransfer(
  question: Question,
  lesson: TutorLesson | null,
  questions: Question[],
  stimuli: Stimulus[],
  attempts: Attempt[],
) {
  const seen = new Set(attempts.map((a) => a.questionId))
  const allowed = lesson ? new Set(lesson.transferIds) : null
  return makeUnits(questions.filter((q) => questionAvailable(q, stimuli)))
    .filter(
      (unit) =>
        !unit.questionIds.includes(question.id) &&
        unit.questionIds.some((id) => {
          const q = questions.find((q) => q.id === id)!
          return allowed
            ? allowed.has(id)
            : q.skills.some((skill) => question.skills.includes(skill))
        }),
    )
    .map((unit) => ({ ...unit, reused: unit.questionIds.some((id) => seen.has(id)) }))
    .sort((a, b) => Number(a.reused) - Number(b.reused) || a.id.localeCompare(b.id))[0]
}

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0 && v.length <= 2400
/** Provider output is untrusted. Exact context bindings prevent stale or unrelated advice. */
export function validTutorGuidance(
  value: unknown,
  context: TutorContext,
  providerId: string,
): value is TutorGuidance {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    value.providerId !== providerId ||
    value.questionId !== context.question.id ||
    value.contentRevision !== context.question.provenance.revision ||
    value.lessonId !== (context.lesson?.id ?? null) ||
    value.lessonRevision !== (context.lesson?.provenance.revision ?? null) ||
    value.reasonId !== context.explanation.reasonId ||
    value.basis !==
      (context.lesson && context.explanation.reasonId ? 'selected-reason' : 'answer-reference') ||
    !text(value.observation) ||
    !text(value.followUp) ||
    !object(value.sections)
  )
    return false
  for (const mode of ['simple', 'steps', 'distractors', 'example', 'check']) {
    const section = value.sections[mode]
    if (
      !object(section) ||
      !text(section.title) ||
      !Array.isArray(section.paragraphs) ||
      !section.paragraphs.length ||
      section.paragraphs.length > 8 ||
      !section.paragraphs.every(text) ||
      (section.steps !== undefined &&
        (!Array.isArray(section.steps) || section.steps.length > 12 || !section.steps.every(text)))
    )
      return false
  }
  return JSON.stringify(value).length <= 30_000
}
