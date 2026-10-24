import { ArrowLeft, CornerUpLeft } from 'lucide-react'
import { useStudy } from '../application/StudyContext'
import { navigateStudyQuestion } from '../application/studyRepository'
import { useAction, navigate, returnToQuestion, type Route } from '../application/hooks'
import { InlineError } from './ui'

export function ReferenceReturn({ route }: { route: Route }) {
  const { sessions, attempts } = useStudy()
  const action = useAction()
  if (!['vocabulary', 'grammar', 'review', 'reference'].includes(route.page)) return null
  if (sessions.some((s) => s.status === 'active' && s.mode === 'exam')) return null
  const tutor =
    route.returnTutorId && attempts.find((a) => a.id === route.returnTutorId && a.selected !== null)
  const source = sessions.find(
    (s) => s.id === route.returnTo?.sessionId && s.questionIds.includes(route.returnTo.questionId),
  )
  const session = source ?? sessions.find((s) => s.status === 'active' && s.mode === 'study')
  if (!session && !tutor) return null
  const questionId = source ? route.returnTo!.questionId : session?.questionIds[session.cursor]
  if (!questionId && !tutor) return null
  const number = session && questionId ? session.questionIds.indexOf(questionId) + 1 : 0
  return (
    <div className="reference-return">
      <CornerUpLeft size={18} />
      <span>
        {tutor
          ? 'Có thể trở lại đúng sổ giải thích Tutor từ đây.'
          : session?.status === 'active'
            ? `Phiên học được giữ tại câu ${number}.`
            : `Từ câu ${number} trong phiên đã hoàn thành.`}
      </span>
      {tutor && (
        <button className="text-link" onClick={() => navigate('tutor', tutor.id)}>
          <CornerUpLeft size={15} />
          Trở lại Tutor
        </button>
      )}
      {session && questionId && (
        <>
          <button
            className="text-link"
            disabled={action.busy}
            onClick={() =>
              void action.run(async () => {
                const sourceHash = window.location.hash
                if (session.status === 'active') await navigateStudyQuestion(session.id, questionId)
                if (window.location.hash === sourceHash)
                  returnToQuestion({ sessionId: session.id, questionId })
              })
            }
          >
            <ArrowLeft size={15} />
            {session.status === 'active' ? 'Trở lại câu hỏi' : 'Trở lại kết quả'}
          </button>
        </>
      )}
      <InlineError message={action.error} />
    </div>
  )
}
