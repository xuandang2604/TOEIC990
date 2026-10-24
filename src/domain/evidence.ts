import type { Question } from '../content/schema'
import type { Attempt, MistakeAnnotation, MistakeRecord, SkillEvidence } from './models'
import { skillAncestors, skillTaxonomy } from './skillTaxonomy'

export function captureEvidence(attempt: Attempt, question: Question, legacy = false) {
  const snapshot = attempt.questionSnapshot ?? {
    content: structuredClone(question),
    part: question.part,
    difficulty: question.difficulty,
    skills: [...question.skills],
    correctOption: question.answer,
    revision: question.provenance.revision,
    origin: legacy ? ('legacy-current-content' as const) : ('at-answer' as const),
  }
  const explicitConfidence = attempt.confidenceSource === 'explicit' ? attempt.confidence : null
  const outcome = attempt.selected === null ? 'omitted' : attempt.correct ? 'correct' : 'incorrect'
  const evidence: SkillEvidence[] = [...new Set(snapshot.skills)].map((skillId) => ({
    id: `${attempt.id}:${skillId}`,
    attemptId: attempt.id,
    questionId: attempt.questionId,
    sessionId: attempt.sessionId,
    skillId,
    part: snapshot.part,
    difficulty: snapshot.difficulty,
    outcome,
    occurredAt: attempt.occurredAt,
    confidence: explicitConfidence,
    timeSpentMs: attempt.timeSpentMs ?? null,
    origin: snapshot.origin,
    source: 'question',
  }))
  const mistake: MistakeRecord | undefined = attempt.correct
    ? undefined
    : {
        id: attempt.id,
        sessionId: attempt.sessionId,
        questionId: attempt.questionId,
        skills: snapshot.skills,
        selected: attempt.selected,
        correctOption: snapshot.correctOption,
        occurredAt: attempt.occurredAt,
        timeSpentMs: attempt.timeSpentMs ?? null,
        confidence: explicitConfidence,
        revision: snapshot.revision,
        origin: snapshot.origin,
        omitted: attempt.selected === null,
      }
  return { attempt: { ...attempt, questionSnapshot: snapshot }, evidence, mistake }
}

/** A parent counts each attempt once, even when it contributes several leaf skills. */
export function aggregateSkillEvidence(evidence: SkillEvidence[], from = -Infinity, to = Infinity) {
  const buckets = new Map<string, Map<string, SkillEvidence>>()
  for (const item of evidence) {
    if (item.occurredAt < from || item.occurredAt >= to) continue
    for (const id of skillAncestors(item.skillId)) {
      const bucket = buckets.get(id) ?? new Map<string, SkillEvidence>()
      bucket.set(item.attemptId, item)
      buckets.set(id, bucket)
    }
  }
  return skillTaxonomy.map((node) => {
    const rows = [...(buckets.get(node.id)?.values() ?? [])]
    const answered = rows.filter((row) => row.outcome !== 'omitted')
    const correct = answered.filter((row) => row.outcome === 'correct').length
    return {
      ...node,
      total: rows.length,
      answered: answered.length,
      correct,
      missed: answered.length - correct,
      omitted: rows.length - answered.length,
      distinctQuestions: new Set(answered.map((r) => r.questionId)).size,
      referenceAnswered: answered.filter((r) => r.source === 'grammar-practice').length,
      accuracy: answered.length ? correct / answered.length : null,
      firstEncounterAt: rows.length
        ? rows.reduce((value, row) => Math.min(value, row.occurredAt), Infinity)
        : null,
      lastEncounterAt: rows.length
        ? rows.reduce((value, row) => Math.max(value, row.occurredAt), -Infinity)
        : null,
    }
  })
}
export function misconceptionSignals(
  mistake: MistakeRecord,
  mistakes: MistakeRecord[],
  annotations: MistakeAnnotation[],
) {
  const annotation = annotations.find((a) => a.id === mistake.id)
  const repeated =
    mistake.selected !== null &&
    mistake.sessionId !== null &&
    new Set(
      mistakes
        .filter(
          (m) =>
            m.sessionId !== null &&
            m.questionId === mistake.questionId &&
            m.revision === mistake.revision &&
            m.selected === mistake.selected &&
            m.correctOption === mistake.correctOption &&
            m.occurredAt <= mistake.occurredAt &&
            m.occurredAt >= mistake.occurredAt - 90 * 86_400_000,
        )
        .map((m) => m.sessionId),
    ).size >= 2
  return {
    reportedCategory: annotation?.category ?? 'unclassified',
    repeated,
    highConfidenceError: mistake.confidence === 3 && !mistake.omitted,
    timePressure: annotation?.category === 'time-pressure',
    possibleGuess: annotation?.category === 'possible-guess',
  }
}
