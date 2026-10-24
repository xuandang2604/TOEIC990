import { ArrowRight, FileQuestion } from 'lucide-react'
import { allQuestions, questionById, stimulusFor } from '../../content/questions'
import { grammar } from '../../content/grammar'
import { vocabularyById } from '../../content/vocabulary'
import { useStudy } from '../../application/StudyContext'
import { navigate, navigateReference, returnToQuestion, useAction } from '../../application/hooks'
import { navigateStudyQuestion, startSession } from '../../application/studyRepository'
import { EmptyState, InlineError, PageHeading, Tag } from '../../components/ui'

export function QuestionReferencePage({ id }: { id?: string }) {
  const { sessions } = useStudy()
  const action = useAction()
  const question = questionById.get(id ?? '')
  if (!question)
    return (
      <EmptyState icon={FileQuestion} title="Không tìm thấy câu tham chiếu.">
        Chọn một câu trong bài ngữ pháp hoặc dùng tìm kiếm nhanh.
      </EmptyState>
    )
  const stimulus = stimulusFor(question)
  const lessons = grammar.filter(
    (g) => question.grammarIds.includes(g.id) || g.questionIds.includes(question.id),
  )
  const active = sessions.find((s) => s.status === 'active')
  async function openPractice() {
    await action.run(async () => {
      const sourceHash = window.location.hash
      if (active) {
        if (active.mode === 'study' && active.questionIds.includes(question!.id)) {
          await navigateStudyQuestion(active.id, question!.id)
          if (window.location.hash === sourceHash)
            returnToQuestion({ sessionId: active.id, questionId: question!.id })
        } else if (window.location.hash === sourceHash) navigate('session', active.id)
        return
      }
      const ids = allQuestions
        .filter(
          (q) =>
            q.id === question!.id ||
            (question!.stimulusId && q.stimulusId === question!.stimulusId),
        )
        .map((q) => q.id)
      const session = await startSession('practice', ids)
      if (window.location.hash === sourceHash) navigate('session', session.id)
    })
  }
  return (
    <>
      <PageHeading
        eyebrow="TỪ QUY TẮC ĐẾN NGỮ CẢNH"
        title="Thử nhận ra cấu trúc."
        description="Mở câu luyện tập để chọn đáp án và xem lời giải sau khi nộp."
      />
      <article className="panel reference-question-preview">
        <div className="tag-list">
          <Tag>Part {question.part}</Tag>
          <Tag>{stimulus?.title ?? 'Câu hỏi độc lập'}</Tag>
        </div>
        <h2 lang="en" data-learning>
          {question.prompt}
        </h2>
        {lessons.length > 0 && (
          <section>
            <h3>Ngữ pháp liên quan</h3>
            <div className="related-content">
              {lessons.map((g) => (
                <button
                  key={g.id}
                  className="text-link"
                  onClick={() => navigateReference('grammar', g.id)}
                >
                  {g.title}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </section>
        )}
        {question.vocabularyIds.length > 0 && (
          <section>
            <h3>Từ vựng trong ngữ cảnh</h3>
            <div className="tag-list">
              {question.vocabularyIds.map((wordId) => (
                <button
                  className="word-chip"
                  key={wordId}
                  lang="en"
                  onClick={() => navigateReference('vocabulary', wordId)}
                >
                  {vocabularyById.get(wordId)?.word}
                </button>
              ))}
            </div>
          </section>
        )}
        {active && !active.questionIds.includes(question.id) && (
          <p className="small muted">
            Bạn đang có một phiên học khác. Hoàn thành phiên đó để bắt đầu nhóm câu này.
          </p>
        )}
        <button
          className="button primary"
          disabled={action.busy}
          onClick={() => void openPractice()}
        >
          {active && !active.questionIds.includes(question.id)
            ? 'Tiếp tục phiên đang học'
            : 'Mở câu luyện tập'}
          <ArrowRight size={16} />
        </button>
        <InlineError message={action.error} />
        <p className="content-provenance small muted">
          {question.provenance.author} · {question.provenance.revision}. {question.provenance.note}
        </p>
      </article>
    </>
  )
}
