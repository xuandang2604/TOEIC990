import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate, navigateReference } from '../../application/hooks'
import { beginTutorTransfer } from '../../application/tutorRepository'
import { allQuestions, stimuli } from '../../content/questions'
import { chooseTutorTransfer, currentTutorTurns } from '../../domain/tutoring'
import type { TutorReflection } from '../../domain/models'
import type { Question } from '../../content/schema'
import type { TutorLesson } from '../../domain/tutorModels'
import { InlineError, Tag } from '../../components/ui'

export function TutorTransfer({
  reflection,
  question,
  lesson,
}: {
  reflection: TutorReflection
  question: Question
  lesson: TutorLesson | null
}) {
  const data = useStudy(),
    action = useAction()
  const session = data.sessions.find((s) => s.id === reflection.transferSessionId)
  const results = session ? data.attempts.filter((a) => a.sessionId === session.id) : []
  const completed = session?.status === 'completed'
  const { revision } = currentTutorTurns(reflection, data.tutorTurns)
  const candidate = chooseTutorTransfer(question, lesson, allQuestions, stimuli, data.attempts)
  const other = data.sessions.find((s) => s.status === 'active' && s.id !== session?.id)
  async function start() {
    const source = window.location.hash
    const saved = await action.run(() =>
      beginTutorTransfer(reflection.id, reflection.tutor?.revision ?? 0),
    )
    if (saved && window.location.hash === source) navigate('session', saved.id)
  }
  return (
    <section className="tutor-step" id="tutor-transfer">
      <span className={`step-marker ${completed ? 'done' : 'current'}`}>05</span>
      <div className="tutor-step-content">
        <p className="eyebrow">THỬ HIỂU BIẾT TRONG NGỮ CẢNH KHÁC</p>
        <h2>{completed ? 'Một lần vận dụng đã có kết quả.' : 'Bạn có dùng được điều vừa hiểu?'}</h2>
        {completed ? (
          <div className="tutor-transfer-outcome">
            <CheckCircle2 size={26} />
            <div>
              <Tag tone={results.every((a) => a.correct) ? 'sage' : 'brass'}>
                {results.filter((a) => a.correct).length}/{session.questionIds.length} câu đúng
              </Tag>
              <p>
                {results.length !== session.questionIds.length
                  ? 'Một số bản ghi kết quả đang thiếu. Phiên và các câu trả lời hiện có được giữ nguyên.'
                  : results.every((a) => a.correct)
                    ? 'Bạn trả lời đúng ở lượt này. Hãy thử nhớ lại sau một khoảng nghỉ; một lần đúng chưa đủ để kết luận đã thành thạo.'
                    : 'Còn điểm cần củng cố. Câu sai đã được xử lý bởi lịch ôn; hãy đối chiếu dấu hiệu đã dùng với lời giải.'}
              </p>
              <button className="text-link" onClick={() => navigate('session', session.id)}>
                Xem lại câu và lời giải
                <ArrowRight size={15} />
              </button>
              <button
                className="text-link"
                onClick={() =>
                  navigateReference(
                    'review',
                    undefined,
                    { sessionId: session.id, questionId: session.questionIds[0] },
                    reflection.id,
                  )
                }
              >
                <RotateCcw size={15} />
                Xem lịch củng cố
              </button>
            </div>
          </div>
        ) : session?.status === 'interrupted' ? (
          <p role="status">
            Phiên vận dụng đã đóng vì thiếu tư liệu. Phần giải thích và lựa chọn được giữ nguyên,
            không được tính là hoàn thành. Có thể chọn bài luyện khác hoặc xuất bản sao sổ học.
          </p>
        ) : reflection.transferSessionId && !session ? (
          <p role="alert">
            Phiên vận dụng liên quan đang thiếu. Liên kết và phần giải thích cũ được giữ nguyên;
            chưa thể ghi đè bằng phiên mới.
          </p>
        ) : other ? (
          <div className="tutor-active-note">
            <p>
              Hoàn thành phiên đang mở trước khi tạo câu vận dụng riêng. Phần giải thích và nháp vẫn
              được giữ.
            </p>
            <button className="button secondary" onClick={() => navigate('session', other.id)}>
              Tiếp tục phiên đang học
              <ArrowRight size={16} />
            </button>
          </div>
        ) : session ? (
          <>
            <p>
              Phiên vận dụng đã lưu · {results.length}/{session.questionIds.length} câu đã nộp.
            </p>
            <button className="button primary" onClick={() => navigate('session', session.id)}>
              Tiếp tục câu vận dụng
              <ArrowRight size={16} />
            </button>
          </>
        ) : candidate ? (
          <>
            <p>
              {candidate.questionIds.length} câu cùng kỹ năng, giữ nguyên tư liệu chung nếu có.{' '}
              {candidate.reused
                ? 'Các câu liên quan trong bộ mẫu đã từng được làm; lượt này là luyện lại, không được gọi là câu mới.'
                : 'Chưa có lượt trả lời được ghi cho các câu này.'}
            </p>
            <p className="small muted">
              {revision
                ? 'Cách hiểu đã được lưu. Phần viết chưa được chấm; kết quả trả lời mới được ghi vào evidence và lịch ôn theo quy tắc hiện có.'
                : 'Lưu phần viết lại ở bước 04 trước khi bắt đầu. Bạn có thể ghi rõ điểm còn băn khoăn.'}
            </p>
            <button
              className="button primary"
              disabled={!revision || action.busy}
              onClick={() => void start()}
            >
              Thử câu vận dụng
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <p className="muted">
            Bộ mẫu chưa có câu khác phù hợp kỹ năng và tư liệu của câu này. Phần giải thích được
            giữ; có thể mở bài tham chiếu và ôn kiến thức trước.
          </p>
        )}
        <InlineError message={action.error} />
      </div>
    </section>
  )
}
