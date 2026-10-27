import { useId, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import type { GrammarLesson } from '../../content/schema'
import { grammarById } from '../../content/grammar'
import { chapters, levelLabels, type FeynmanGuide } from '../../content/handbook'
import { practiceQuestions, stimuli } from '../../content/questions'
import { vocabularyById } from '../../content/vocabulary'
import { makeUnits, questionAvailable, takeUnits } from '../../domain/assessment'
import { navigate, navigateReference, useAction } from '../../application/hooks'
import { useStudy } from '../../application/StudyContext'
import { startSession } from '../../application/studyRepository'
import { InlineError, Tag } from '../../components/ui'
import { SaveKnowledgeButton } from '../review/SaveKnowledgeButton'
import { GrammarPractice } from './GrammarPractice'
import { MicroLessons } from './MicroLesson'

type View = 'read' | 'feynman' | 'practice'
export function HandbookLesson({ lesson, guide }: { lesson: GrammarLesson; guide: FeynmanGuide }) {
  const [view, setView] = useState<View>('read'),
    [visitedFeynman, setVisitedFeynman] = useState(false)
  const [referenceLimit, setReferenceLimit] = useState(6)
  const panelId = useId(),
    action = useAction(),
    data = useStudy()
  const active = data.sessions.find((s) => s.status === 'active')
  const related = practiceQuestions.filter(
    (q) => q.grammarIds.includes(lesson.id) || lesson.questionIds.includes(q.id),
  )
  async function practiceRelated() {
    if (active) {
      navigate('session', active.id)
      return
    }
    const references = new Set(related.map((q) => q.id))
    const units = makeUnits(practiceQuestions.filter((q) => questionAvailable(q, stimuli))).filter(
      (u) => u.questionIds.some((id) => references.has(id)),
    )
    const source = window.location.hash
    const session = await action.run(() => startSession('practice', takeUnits(units, 6)))
    if (session && window.location.hash === source) navigate('session', session.id)
  }
  function choose(next: View) {
    setView(next)
    if (next === 'feynman') setVisitedFeynman(true)
  }
  return (
    <>
      <header className="handbook-lesson-header">
        <div className="article-kicker">
          <span>{chapters.find((c) => c.id === guide.chapterId)?.title}</span>
          <Tag tone={guide.level === 'advanced' ? 'brass' : 'sage'}>{levelLabels[guide.level]}</Tag>
        </div>
        <h2>{lesson.title}</h2>
        <p className="handbook-english-title" lang="en">
          {lesson.englishTitle}
        </p>
        <p className="handbook-summary">{guide.plain}</p>
      </header>
      <div className="handbook-views" role="group" aria-label="Cách học chủ điểm này">
        {(
          [
            ['read', 'Đọc nhanh'],
            ['feynman', 'Tự giải thích'],
            ['practice', 'Thử sức'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            aria-controls={`${panelId}-${id}`}
            onClick={() => choose(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <section id={`${panelId}-read`} hidden={view !== 'read'} aria-label="Giải thích và ví dụ">
        <details className="handbook-why">
          <summary>Vì sao lại dùng như vậy?</summary>
          <p>{guide.why}</p>
        </details>
        <details className="handbook-notation">
          <summary>Đọc công thức: S, V, V3 là gì?</summary>
          <p>
            S = chủ ngữ; V = động từ; O = tân ngữ; V2 = dạng quá khứ; V3 = phân từ quá khứ; V-ing =
            dạng thêm -ing. Các dạng có thể bất quy tắc: go – went – gone. Dấu “/” cho các lựa chọn,
            không yêu cầu đọc liền tất cả.
          </p>
        </details>
        <div className="handbook-rules">
          {lesson.rules.map((rule, i) => (
            <details key={rule.title} open={i === 0} className="handbook-rule">
              <summary>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {rule.title}
              </summary>
              <p>{rule.description}</p>
              <div className="formula" lang="en" data-learning>
                {rule.formula}
              </div>
            </details>
          ))}
        </div>
        <section className="handbook-examples">
          <h3>Đặt cạnh nhau để hiểu</h3>
          {lesson.examples.map((ex) => (
            <div className="example-pair" key={ex.correct}>
              <div className="correct-example">
                <Check size={17} />
                <p>
                  <span className="handbook-example-label">Dùng được</span>
                  <span lang="en" data-learning>
                    {ex.correct}
                  </span>
                </p>
              </div>
              <div className="incorrect-example">
                <X size={17} />
                <p>
                  <span className="handbook-example-label">Cần sửa trong ý đang xét</span>
                  <span lang="en" data-learning>
                    {ex.incorrect}
                  </span>
                </p>
              </div>
              <p className="small muted">{ex.explanation}</p>
            </div>
          ))}
        </section>
        <details className="handbook-traps">
          <summary>Lỗi thường gặp & giới hạn của mẹo nhớ</summary>
          <ul>
            {lesson.traps.map((trap) => (
              <li key={trap}>{trap}</li>
            ))}
          </ul>
        </details>
        <div className="handbook-read-next">
          <p>Hiểu một ý rồi thử kể lại trước khi xem hướng dẫn.</p>
          <button className="button secondary" onClick={() => choose('feynman')}>
            Thử giải thích theo Feynman
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
      <section
        id={`${panelId}-feynman`}
        hidden={view !== 'feynman'}
        aria-label="Học bằng tự giải thích"
      >
        {visitedFeynman && <MicroLessons key={lesson.id} lessonId={lesson.id} />}
      </section>
      <section
        id={`${panelId}-practice`}
        hidden={view !== 'practice'}
        aria-label="Bài tự kiểm tra chủ điểm"
      >
        <GrammarPractice lesson={lesson} enabled={view === 'practice'} />
      </section>
      <div className="handbook-save">
        <SaveKnowledgeButton lessonId={lesson.id} />
        <span className="small muted">
          Lưu để tự nhớ lại trong Ôn tập. Đã đọc không đồng nghĩa đã thành thạo.
        </span>
      </div>
      <details className="handbook-connections">
        <summary>Kết nối để học tiếp</summary>
        <h3>Chủ điểm gần nhau</h3>
        <div className="handbook-related-links">
          {guide.relatedIds.map((id) => (
            <button key={id} className="text-link" onClick={() => navigateReference('grammar', id)}>
              {grammarById.get(id)?.title}
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
        <h3>Từ vựng để đặt câu</h3>
        <div className="tag-list">
          {lesson.vocabularyIds.map((id) => (
            <button
              className="word-chip"
              key={id}
              lang="en"
              onClick={() => navigateReference('vocabulary', id)}
            >
              {vocabularyById.get(id)?.word}
              <ArrowRight size={13} />
            </button>
          ))}
        </div>
      </details>
      <details className="handbook-question-links">
        <summary>Câu TOEIC liên quan ({related.length})</summary>
        {related.length ? (
          <>
            <p className="small muted">
              Chỉ gồm câu luyện; câu trong mock được giữ riêng. Khi mở một lượt mới, các nhóm dùng
              chung tư liệu được giữ đủ.
            </p>
            {related.slice(0, referenceLimit).map((q) => (
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
            {related.length > referenceLimit && (
              <button className="text-link" onClick={() => setReferenceLimit((n) => n + 6)}>
                Xem thêm 6 câu
              </button>
            )}
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => void practiceRelated()}
            >
              {active ? 'Tiếp tục phiên đang học' : 'Luyện một nhóm ngắn'}
              <ArrowRight size={15} />
            </button>
          </>
        ) : (
          <p className="small muted">
            Chủ điểm có bài tự kiểm tra trong sổ tay, chưa có câu TOEIC gắn riêng trong ngân hàng
            hiện tại.
          </p>
        )}
      </details>
      <InlineError message={action.error} />
      <p className="small muted content-provenance">
        {lesson.provenance.author} · {lesson.provenance.revision}. Hướng dẫn ngoại tuyến, chưa thẩm
        định độc lập; không chấm hiểu phần viết tự do.
      </p>
      <button className="text-link" onClick={() => navigate('practice')}>
        <ArrowLeft size={15} />
        Về luyện tập
      </button>
    </>
  )
}
