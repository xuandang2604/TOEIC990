import sets from '../../content/mock-exams.json'
import { questions, stimuli, passages } from './questions'
import { mockExamIssues, sessionMatchesMock, type MockExam } from '../domain/contentInventory'
import type { StudySession } from '../domain/models'
import { questionAssessmentEligible, questionReviewedAssessmentEligible } from './eligibility'
import { validateContentBank } from './validation'
export function mockBankIssues(exam: MockExam) {
  const ids = new Set(exam.questionIds)
  const selected = questions.filter((q) => ids.has(q.id))
  const sids = new Set(selected.map((q) => q.stimulusId))
  const media = stimuli.filter((s) => sids.has(s.id))
  const pids = new Set(media.flatMap((s) => ('passageIds' in s ? s.passageIds : [])))
  return validateContentBank({
    questions: selected,
    stimuli: media,
    passages: passages.filter((p) => pids.has(p.id)),
    grammarIds: [...new Set(selected.flatMap((q) => q.grammarIds))],
    vocabularyIds: [...new Set(selected.flatMap((q) => q.vocabularyIds))],
  })
}
export const mockExams = sets as MockExam[]
export const mockById = new Map(mockExams.map((exam) => [exam.id, exam]))
export const mockIssues = mockExams.flatMap((exam) => [
  ...mockExamIssues(exam, questions, stimuli).map((message) => ({ path: exam.id, message })),
  ...mockBankIssues(exam),
])
export const availableMockExams = mockExams.filter(
  (exam) =>
    !mockExamIssues(exam, questions, stimuli).length &&
    !mockBankIssues(exam).length &&
    (exam.editorialStatus !== 'human-reviewed' ||
      exam.questionIds.every(questionReviewedAssessmentEligible)) &&
    exam.questionIds.every(questionAssessmentEligible),
)
/** An imported label alone must not turn an arbitrary session into a complete mock. */
export function mockForSession(session: StudySession) {
  const exam = session.mockExamId ? mockById.get(session.mockExamId) : undefined
  return exam && sessionMatchesMock(session, exam) ? exam : undefined
}
