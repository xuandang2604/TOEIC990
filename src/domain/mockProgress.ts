import { sessionMatchesMock, type MockExam } from './contentInventory'
import type { Attempt, ExamResponse, StudySession } from './models'
import type { learningRoadmap } from './roadmap'
import { localDayKey } from './learning'

/** Answer counts describe recorded answers, not whether a learner has ever seen a question. */
export function mockProgress(
  exam: MockExam,
  sessions: StudySession[],
  attempts: Attempt[],
  savedResponses: ExamResponse[],
) {
  const ids = new Set(exam.questionIds)
  const completed = sessions
    .filter((s) => s.status === 'completed' && sessionMatchesMock(s, exam))
    .sort((a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt))
  const latest = completed[0]
  const responses = latest
    ? attempts.filter((a) => a.sessionId === latest.id && ids.has(a.questionId))
    : []
  const completeResult =
    responses.length === ids.size && new Set(responses.map((a) => a.questionId)).size === ids.size
  return {
    exam,
    completed,
    latest,
    answered: new Set(
      [
        ...attempts.filter((a) => ids.has(a.questionId) && a.selected !== null),
        ...savedResponses.filter((r) => ids.has(r.questionId)),
      ].map((answer) => answer.questionId),
    ).size,
    result: completeResult
      ? {
          correct: responses.filter((a) => a.correct && a.selected !== null).length,
          total: ids.size,
        }
      : null,
  }
}

/** Calendar suggestions, not predicted score dates. A repeat of one form is one checkpoint. */
export function roadmapCheckpoints(
  roadmap: NonNullable<ReturnType<typeof learningRoadmap>>,
  exams: MockExam[],
  sessions: StudySession[],
  attempts: Attempt[],
  savedResponses: ExamResponse[],
  now: number,
) {
  const fractions =
    roadmap.studyDates.length < 6
      ? [0.95]
      : roadmap.totalDays >= 45
        ? [0.12, 0.32, 0.52, 0.72, 0.95]
        : [0.2, 0.6, 0.95]
  const dates = [
    ...new Set(
      fractions
        .map(
          (fraction) => roadmap.studyDates[Math.round((roadmap.studyDates.length - 1) * fraction)],
        )
        .filter((d): d is string => Boolean(d)),
    ),
  ]
  const rows = exams.map((exam) => mockProgress(exam, sessions, attempts, savedResponses))
  const completed = rows
    .filter((row) =>
      row.completed.some((s) => {
        const at = s.completedAt ?? s.startedAt
        return at <= now && localDayKey(at) >= roadmap.profile.startedOn
      }),
    )
    .sort((a, b) => {
      const first = (row: typeof a) =>
        Math.min(
          ...row.completed
            .filter((s) => localDayKey(s.completedAt ?? s.startedAt) >= roadmap.profile.startedOn)
            .map((s) => s.completedAt ?? s.startedAt),
        )
      return first(a) - first(b)
    })
  const used = new Set(completed.map((r) => r.exam.id))
  const remaining = rows.filter((r) => !used.has(r.exam.id)).sort((a, b) => a.answered - b.answered)
  return dates.map((date, index) => ({
    date,
    index,
    progress: completed[index] ?? remaining[index - completed.length],
    complete: index < completed.length,
    due: date <= localDayKey(now),
  }))
}
