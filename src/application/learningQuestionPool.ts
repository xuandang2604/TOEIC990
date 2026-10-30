import { practiceQuestions, mockQuestions } from '../content/questions'
import { availableMockExams } from '../content/mockExams'
import { sessionMatchesMock } from '../domain/contentInventory'
import type { StudySession } from '../domain/models'

/** Completed full tests can supply targeted study. Unsubmitted tests stay out of daily plans. */
export function learningQuestionPool(sessions: StudySession[]) {
  const released = new Set(
    availableMockExams
      .filter((exam) =>
        sessions.some((s) => s.status === 'completed' && sessionMatchesMock(s, exam)),
      )
      .flatMap((exam) => exam.questionIds),
  )
  return [...practiceQuestions, ...mockQuestions.filter((q) => released.has(q.id))]
}
