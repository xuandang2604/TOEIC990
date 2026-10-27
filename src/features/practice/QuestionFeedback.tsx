import { Bookmark, BookmarkCheck, ArrowRight, Lightbulb, MessageSquareText } from 'lucide-react'
import type { Attempt } from '../../domain/models'
import type { Question } from '../../content/schema'
import { grammar, grammarById } from '../../content/grammar'
import { vocabularyById } from '../../content/vocabulary'
import { useStudy } from '../../application/StudyContext'
import { saveCard } from '../../application/studyRepository'
import { navigate, navigateReference, useAction } from '../../application/hooks'
import { InlineError } from '../../components/ui'
import { MistakeNote } from '../review/MistakeNote'
import { ReportQuestion } from './ReportQuestion'
import { SaveWordButton } from '../dictionary/WordDetails'

export function SaveQuestionButton({ question }: { question: Question }) {
  const data = useStudy()
  const action = useAction()
  const saved = data.cards.some((c) => c.id === `question:${question.id}`)
  return (
    <div>
      <button
        type="button"
        className={`button ${saved ? 'saved' : 'secondary'}`}
        disabled={saved || action.busy}
        onClick={() => void action.run(() => saveCard('question', question.id))}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {saved ? 'Đã có trong ôn tập' : 'Lưu câu hỏi'}
      </button>
      <InlineError message={action.error} />
    </div>
  )
}
export function QuestionFeedback({
  question,
  attempt,
  showMistakeNote = true,
}: {
  question: Question
  attempt: Attempt
  showMistakeNote?: boolean
}) {
  return (
    <section className="feedback-panel" aria-label="Giải thích đáp án">
      <h3 role="status" className={attempt.correct ? 'success-text' : 'brass-text'}>
        {attempt.correct
          ? 'Bạn đã trả lời đúng.'
          : attempt.selected
            ? `Bạn chọn ${attempt.selected}. Cùng xem lại.`
            : 'Bạn đã để trống câu này.'}{' '}
        Đáp án: {question.answer}.
      </h3>
      <p data-learning>{question.explanation}</p>
      <div className="answer-reasoning">
        {question.options.map((option) => (
          <div key={option.id}>
            <span className={`reasoning-letter ${question.answer === option.id ? 'correct' : ''}`}>
              {option.id}
            </span>
            <p>{option.reasoning}</p>
          </div>
        ))}
      </div>
      <div className="takeaway">
        <Lightbulb size={19} />
        <p>{question.takeaway}</p>
      </div>
      <p className="small muted">
        {attempt.timeSpentMs == null
          ? 'Chưa có thời gian tương tác được ghi nhận cho lượt này.'
          : `${Math.round(attempt.timeSpentMs / 1000)} giây tương tác khi tab có focus; không phải tốc độ làm bài chuẩn.`}
      </p>
      {attempt.correct && attempt.confidenceSource === 'explicit' && attempt.confidence === 1 && (
        <p className="small brass-text">
          Bạn trả lời đúng nhưng còn phân vân. Thử tự giải thích rồi làm lại sau; chỉ tín hiệu này
          chưa đủ để kết luận bạn đã đoán.
        </p>
      )}
      {!attempt.correct && showMistakeNote && <MistakeNote attemptId={attempt.id} />}
      <div className="related-content">
        {grammar
          .filter((g) => question.grammarIds.includes(g.id) || g.questionIds.includes(question.id))
          .map(({ id }) => (
            <button
              className="text-link"
              key={id}
              onClick={() =>
                navigateReference('grammar', id, {
                  sessionId: attempt.sessionId,
                  questionId: question.id,
                })
              }
            >
              {grammarById.get(id)?.title}
              <ArrowRight size={14} />
            </button>
          ))}
      </div>
      {question.vocabularyIds.length > 0 && (
        <section className="question-word-notes" aria-label="Từ vựng liên quan">
          <h4>Từ vựng liên quan · lưu để ôn lại</h4>
          {question.vocabularyIds.map((id) => {
            const entry = vocabularyById.get(id)
            if (!entry) return null
            return (
              <div className="question-word-row" key={id}>
                <button
                  className="word-chip"
                  lang="en"
                  onClick={() =>
                    navigateReference('vocabulary', id, {
                      sessionId: attempt.sessionId,
                      questionId: question.id,
                    })
                  }
                >
                  {entry.word}
                </button>
                <span className="small muted">{entry.meaning}</span>
                <SaveWordButton entry={entry} compact />
              </div>
            )
          })}
        </section>
      )}
      <div className="feedback-tools">
        {attempt.selected && (
          <button className="text-link" onClick={() => navigate('tutor', attempt.id)}>
            <MessageSquareText size={16} />
            Giải thích cách nghĩ
          </button>
        )}
      </div>
      <p className="content-provenance small muted">
        Nguồn: {question.provenance.author} · {question.provenance.revision}.{' '}
        {question.provenance.note}
      </p>
      <ReportQuestion question={question} />
    </section>
  )
}
