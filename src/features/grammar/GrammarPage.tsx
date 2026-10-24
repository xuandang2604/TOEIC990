import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, Search, X } from 'lucide-react'
import { grammar, grammarById } from '../../content/grammar'
import { questions } from '../../content/questions'
import { vocabularyById } from '../../content/vocabulary'
import { useAction, navigate, navigateReference } from '../../application/hooks'
import { useStudy } from '../../application/StudyContext'
import { searchReferences } from '../../application/referenceCatalog'
import { startSession } from '../../application/studyRepository'
import { EmptyState, InlineError, PageHeading, Tag } from '../../components/ui'
import { GrammarPractice } from './GrammarPractice'
import { Highlight } from '../dictionary/Highlight'
import { useReferenceFocus } from '../../components/useReferenceFocus'
import { SaveKnowledgeButton } from '../review/SaveKnowledgeButton'
import { MicroLessons } from './MicroLesson'

export function GrammarPage({ id }: { id?: string }) {
  const [query, setQuery] = useState('')
  const action = useAction()
  const data = useStudy()
  const active = data.sessions.find((s) => s.status === 'active')
  const results = query.trim()
    ? searchReferences(query, 'grammar', undefined, grammar.length).map((hit) =>
        grammarById.get(hit.id)!,
      )
    : grammar
  const lesson = id ? grammarById.get(id) : results[0]
  const article = useReferenceFocus(id && lesson ? id : undefined, 1000)
  const related = lesson
    ? questions.filter((q) => q.grammarIds.includes(lesson.id) || lesson.questionIds.includes(q.id))
    : []
  async function practice() {
    if (active) {
      navigate('session', active.id)
      return
    }
    await action.run(async () => {
      const sourceHash = window.location.hash
      const session = await startSession(
        'practice',
        related.map((q) => q.id),
      )
      if (window.location.hash === sourceHash) navigate('session', session.id)
    })
  }
  return (
    <>
      <PageHeading
        eyebrow="NHÌN THẤY CẤU TRÚC BÊN DƯỚI"
        title="Ngữ pháp có lý do."
        description="Những quy tắc ngắn gọn, ví dụ rõ ràng và các điểm dễ nhầm trong TOEIC."
      />
      <div className="grammar-layout">
        <aside className="grammar-index">
          <label className="search-field">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm chủ điểm…"
              aria-label="Tìm bài ngữ pháp"
            />
          </label>
          <p className="eyebrow">{results.length} CHỦ ĐIỂM</p>
          <nav aria-label="Các chủ điểm ngữ pháp">
            {results.map((item, index) => (
              <button
                key={item.id}
                className={lesson?.id === item.id ? 'active' : ''}
                aria-current={lesson?.id === item.id ? 'page' : undefined}
                onClick={() => navigateReference('grammar', item.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <Highlight text={item.title} query={query} />
                  <small lang="en">{item.englishTitle}</small>
                </span>
              </button>
            ))}
          </nav>
        </aside>
        <article
          className="grammar-article panel"
          ref={article}
          tabIndex={-1}
          aria-label="Bài ngữ pháp"
        >
          {lesson ? (
            <>
              {!results.some((item) => item.id === lesson.id) && (
                <div className="reference-filter-note">
                  <p className="small muted">Bài đang mở nằm ngoài kết quả tìm kiếm.</p>
                  <button className="text-link" onClick={() => setQuery('')}>
                    Xem tất cả chủ điểm
                  </button>
                </div>
              )}
              <div className="article-kicker">
                <Tag tone="sage">GHI CHÚ NGỮ PHÁP</Tag>
                <span className="small muted" lang="en">
                  {lesson.englishTitle}
                </span>
              </div>
              <h2>{lesson.title}</h2>
              <p className="article-summary">{lesson.summary}</p>
              <MicroLessons key={lesson.id} lessonId={lesson.id} />
              {lesson.rules.map((rule, index) => (
                <section className="grammar-rule" key={rule.title}>
                  <h3>
                    <span>0{index + 1}</span>
                    {rule.title}
                  </h3>
                  <p>{rule.description}</p>
                  <div className="formula" lang="en" data-learning>
                    {rule.formula}
                  </div>
                </section>
              ))}
              <section className="examples-section">
                <h3>Đặt cạnh nhau để thấy khác biệt</h3>
                {lesson.examples.map((example) => (
                  <div key={example.correct} className="example-pair">
                    <div className="correct-example">
                      <Check size={18} />
                      <span className="sr-only">Đúng:</span>
                      <p lang="en" data-learning>
                        {example.correct}
                      </p>
                    </div>
                    <div className="incorrect-example">
                      <X size={18} />
                      <span className="sr-only">Sai:</span>
                      <p lang="en" data-learning>
                        {example.incorrect}
                      </p>
                    </div>
                    <p className="small muted">{example.explanation}</p>
                  </div>
                ))}
              </section>
              <section className="trap-section">
                <h3>Điểm dễ nhầm</h3>
                <ul>
                  {lesson.traps.map((trap) => (
                    <li key={trap}>{trap}</li>
                  ))}
                </ul>
              </section>
              <GrammarPractice key={lesson.id} lesson={lesson} />
              <SaveKnowledgeButton lessonId={lesson.id} />
              <section className="grammar-related-words">
                <h3>Từ vựng để dùng cấu trúc này</h3>
                <div className="tag-list">
                  {lesson.vocabularyIds.map((wordId) => (
                    <button
                      key={wordId}
                      className="word-chip"
                      lang="en"
                      onClick={() => navigateReference('vocabulary', wordId)}
                    >
                      {vocabularyById.get(wordId)?.word}
                      <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              </section>
              <section className="grammar-question-refs">
                <h3>Gặp trong câu luyện tập</h3>
                {related.map((q) => (
                  <button
                    key={q.id}
                    className="reference-question-link"
                    onClick={() => navigateReference('reference', q.id)}
                  >
                    <Tag>Part {q.part}</Tag>
                    <span lang="en">{q.prompt}</span>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </section>
              <div className="grammar-practice">
                <div>
                  <h3>Hiểu rồi? Thử vận dụng.</h3>
                  <p className="small muted">
                    {related.length} câu hỏi liên quan trong bộ mẫu.
                    {active
                      ? ' Phiên đang học được giữ nguyên; hoàn thành phiên đó trước khi mở nhóm mới.'
                      : ''}
                  </p>
                </div>
                {related.length > 0 && (
                  <button
                    className="button primary"
                    onClick={() => void practice()}
                    disabled={action.busy}
                  >
                    {active ? 'Tiếp tục phiên đang học' : 'Luyện chủ điểm này'}
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
              <InlineError message={action.error} />
              <p className="small muted content-provenance">
                {lesson.provenance.author} · {lesson.provenance.revision}. Bài học tự biên soạn, ví
                dụ theo ngữ cảnh công việc.
              </p>
              <button className="text-link" onClick={() => navigate('practice')}>
                <ArrowLeft size={15} />
                Về luyện tập
              </button>
            </>
          ) : (
            <EmptyState icon={BookOpen} title="Không có chủ điểm phù hợp">
              Thử tên tiếng Việt hoặc tiếng Anh, chẳng hạn “từ loại” hoặc “passive”.
            </EmptyState>
          )}
        </article>
      </div>
    </>
  )
}
