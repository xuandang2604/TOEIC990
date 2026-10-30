import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Headphones, Play, RotateCcw, Timer } from 'lucide-react'
import {
  practiceQuestions,
  questionById,
  starterQuestions,
  PART_LABELS,
  stimuli,
} from '../../content/questions'
import type { Skill, ToeicPart, Topic } from '../../content/schema'
import type { PracticeMode } from '../../domain/models'
import {
  filterPracticeUnits,
  miniExamQuestions,
  MINI_EXAM_MINUTES,
  questionAvailable,
  takeUnits,
} from '../../domain/assessment'
import { prioritizeQuestions, SKILL_LABELS } from '../../domain/learning'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate } from '../../application/hooks'
import { startSession } from '../../application/studyRepository'
import { availableMockExams } from '../../content/mockExams'
import { learningQuestionPool } from '../../application/learningQuestionPool'
import { questionAssessmentEligible } from '../../content/eligibility'
import { EmptyState, InlineError, PageHeading, Tag } from '../../components/ui'
import { SourceEvidencePanel } from './SourceEvidencePanel'

const TOPICS: Record<Topic, string> = {
  office: 'Công sở',
  travel: 'Du lịch',
  training: 'Đào tạo',
  shopping: 'Mua sắm',
  facilities: 'Cơ sở vật chất',
  grammar: 'Ngữ pháp',
}
const PART_NOTES: Record<ToeicPart, string> = {
  1: 'Quan sát ảnh, nghe bốn mô tả và chọn mô tả phù hợp.',
  2: 'Nghe ý định. Chọn lời đáp phù hợp.',
  3: 'Một hội thoại cho ba câu; một số nhóm có bảng biểu.',
  4: 'Một bài nói cho ba câu; một số nhóm có bảng biểu.',
  5: 'Nhìn cấu trúc. Hiểu cách dùng từ.',
  6: 'Hoàn thành từ và cả câu trong văn bản.',
  7: 'Đọc một hoặc nhiều văn bản để tìm bằng chứng.',
}

export function PracticePage({ initialPart }: { initialPart?: string }) {
  const data = useStudy(),
    action = useAction()
  const [part, setPart] = useState<ToeicPart>(
      ['1', '2', '3', '4', '5', '6', '7'].includes(initialPart ?? '')
        ? (Number(initialPart) as ToeicPart)
        : 5,
    ),
    [count, setCount] = useState(6)
  const [mode, setMode] = useState<PracticeMode>('study'),
    [skill, setSkill] = useState<Skill | ''>(''),
    [topic, setTopic] = useState<Topic | ''>('')
  const [sourceId, setSourceId] = useState('skills')
  const learningPool = useMemo(() => learningQuestionPool(data.sessions), [data.sessions])
  const sourceExam = availableMockExams.find((exam) => exam.id === sourceId)
  const questions = useMemo(
    () => (sourceExam ? sourceExam.questionIds.map((id) => questionById.get(id)!) : learningPool),
    [sourceExam, learningPool],
  )
  const active = data.sessions.find((s) => s.status === 'active')
  const pool = questions.filter((q) => q.part === part)
  const ranks = new Map(
    prioritizeQuestions(questions, data.attempts, data.cards, questions.length, Date.now()).map(
      (q, i) => [q.id, i],
    ),
  )
  const usable = questions.filter((q) => questionAvailable(q, stimuli))
  const units = filterPracticeUnits(usable, {
    part,
    skill: skill || undefined,
    topic: topic || undefined,
  }).sort(
    (a, b) =>
      Math.min(...a.questionIds.map((id) => ranks.get(id)!)) -
      Math.min(...b.questionIds.map((id) => ranks.get(id)!)),
  )
  const selectedIds = takeUnits(units, count)
  const examEligible = selectedIds.length > 0 && selectedIds.every(questionAssessmentEligible)
  const miniIds = miniExamQuestions(starterQuestions, stimuli)
  const miniPartCount = new Set(miniIds.map((id) => questionById.get(id)!.part)).size
  const answered = new Set(
    [...data.attempts.filter((a) => a.selected !== null), ...data.responses].map(
      (a) => a.questionId,
    ),
  )
  const recent = [...data.sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 5)
  async function begin(mini = false) {
    if (active) {
      navigate('session', active.id)
      return
    }
    const sourceHash = window.location.hash
    await action.run(async () => {
      const session = await startSession(
        mini ? 'mini-exam' : 'practice',
        mini ? miniIds : selectedIds,
        { mode: mini ? 'exam' : mode, durationMinutes: MINI_EXAM_MINUTES },
      )
      if (window.location.hash === sourceHash) navigate('session', session.id)
    })
  }
  async function openStudio(kind: 'listening' | 'reading') {
    if (active) {
      navigate('session', active.id)
      return
    }
    const sourceHash = window.location.hash
    const target = kind === 'listening' ? (part <= 4 ? part : 3) : part >= 6 ? part : 7
    const ids = takeUnits(filterPracticeUnits(usable, { part: target }), 3)
    await action.run(async () => {
      const session = await startSession('practice', ids, { mode: 'study' })
      if (window.location.hash === sourceHash) navigate('session', session.id)
    })
  }
  return (
    <>
      <PageHeading
        eyebrow="CÓ CHỦ ĐÍCH, CÓ TIẾN BỘ"
        title="Luyện từng Part"
        description="Chọn nguồn câu, chọn Part, rồi bắt đầu một lượt vừa sức."
        action={
          <button className="button secondary" onClick={() => navigate('tests')}>
            <Timer size={17} />
            {availableMockExams.length} full test
            <ArrowRight size={16} />
          </button>
        }
      />
      <div className="practice-workspace">
        <section className="practice-source" aria-label="Nguồn câu luyện">
          <label className="form-label">
            Nguồn câu
            <select
              value={sourceId}
              onChange={(event) => {
                setSourceId(event.target.value)
                setSkill('')
                setTopic('')
                setMode('study')
              }}
            >
              <option value="skills">Luyện kỹ năng · {learningPool.length} câu</option>
              <optgroup label="Luyện theo Part từ bộ đề">
                {availableMockExams.map((exam) => (
                  <option value={exam.id} key={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <div>
            <strong>
              {questions.filter((q) => answered.has(q.id)).length}/{questions.length}
            </strong>
            <span> câu đã trả lời trong nguồn này</span>
          </div>
          <p className="small muted">
            {sourceExam
              ? 'Luyện trước sẽ được ghi nhận là đã trả lời câu trong đề này. Chọn Full test để làm trọn bài 120 phút.'
              : `${practiceQuestions.length} câu bài tập, cộng câu từ full test đã nộp. Những đề còn lại được giữ riêng.`}
          </p>
        </section>
        {active && (
          <div className="resume-banner">
            <div>
              <RotateCcw size={21} />
              <span>
                Bạn có một phiên {active.mode === 'exam' ? 'thi có thời gian' : 'học'} đang mở.
                <small>
                  {active.mode === 'exam'
                    ? 'Giờ vẫn chạy khi bạn rời trang. Mở lại để tiếp tục hoặc xem kết quả khi hết giờ.'
                    : 'Mở lại đúng nhóm câu đã lưu. Phiên mới sẽ không ghi đè phiên này.'}
                </small>
              </span>
            </div>
            <button className="button secondary" onClick={() => navigate('session', active.id)}>
              Tiếp tục
              <ArrowRight size={16} />
            </button>
          </div>
        )}
        <details className="practice-extra">
          <summary>Nghe kỹ & đọc sâu</summary>
          <section className="studio-launchers" aria-label="Không gian học trong ngữ cảnh">
            <div>
              <Headphones size={22} />
              <h2>Listening Lab</h2>
              <p>Parts 1–4 · nghe lại, chép chính tả, nhại giọng. Giọng máy được ghi nhãn.</p>
              <button
                className="text-link"
                disabled={action.busy}
                onClick={() => void openStudio('listening')}
              >
                {active ? 'Tiếp tục phiên đang mở' : `Mở Part ${part <= 4 ? part : 3} trong Lab`}
                <ArrowRight size={15} />
              </button>
            </div>
            <div>
              <BookOpen size={22} />
              <h2>Reading Studio</h2>
              <p>Parts 6–7 · đọc đủ ngữ cảnh, ghi chú, lưu từ và đối chiếu bằng chứng.</p>
              <button
                className="text-link"
                disabled={action.busy}
                onClick={() => void openStudio('reading')}
              >
                {active ? 'Tiếp tục phiên đang mở' : `Mở Part ${part >= 6 ? part : 7} trong Studio`}
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </details>
        <div className="practice-layout">
          <section>
            <div className="section-title">
              <h2>Chọn Part muốn luyện</h2>
              <span className="small muted">{usable.length} câu sẵn sàng</span>
            </div>
            <div className="part-grid seven-parts">
              {([1, 2, 3, 4, 5, 6, 7] as const).map((value) => {
                const Icon = value <= 4 ? Headphones : BookOpen
                const available = questions.filter((q) => q.part === value)
                const ready = available.filter((q) => questionAvailable(q, stimuli))
                return (
                  <button
                    key={value}
                    className={`part-card ${part === value ? 'selected' : ''}`}
                    aria-pressed={part === value}
                    onClick={() => {
                      setPart(value)
                      setSkill('')
                      setTopic('')
                    }}
                  >
                    <div className="part-card-top">
                      <Icon size={21} strokeWidth={1.5} />
                      <span>PART {value}</span>
                      <span className="selection-dot" />
                    </div>
                    <h3>{PART_LABELS[value]}</h3>
                    <div className="part-card-bottom">
                      <span>{ready.length} câu sẵn sàng</span>
                      <span>{available.filter((q) => answered.has(q.id)).length} đã trả lời</span>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="practice-mobile-start">
              <span>
                Part {part} · {selectedIds.length} câu
              </span>
              <button
                className="button secondary"
                onClick={() => {
                  const settings = document.getElementById('practice-settings')
                  settings?.scrollIntoView({ block: 'start' })
                  settings?.focus({ preventScroll: true })
                }}
              >
                Thiết lập
              </button>
              <button
                className="button primary"
                disabled={
                  action.busy ||
                  (!active && (!selectedIds.length || (mode === 'exam' && !examEligible)))
                }
                onClick={() => void begin()}
              >
                {active ? 'Tiếp tục' : 'Bắt đầu'}
                <ArrowRight size={16} />
              </button>
            </div>
            <details className="practice-extra practice-filter-details">
              <summary>Lọc kỹ năng & chủ đề{skill || topic ? ' · đang lọc' : ''}</summary>
              <div className="practice-filters">
                <label className="form-label">
                  Kỹ năng
                  <select value={skill} onChange={(e) => setSkill(e.target.value as Skill | '')}>
                    <option value="">Tất cả kỹ năng</option>
                    {[...new Set(pool.flatMap((q) => q.skills))].map((value) => (
                      <option key={value} value={value}>
                        {SKILL_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-label">
                  Chủ đề
                  <select value={topic} onChange={(e) => setTopic(e.target.value as Topic | '')}>
                    <option value="">Tất cả chủ đề</option>
                    {[...new Set(pool.map((q) => q.topic))].map((value) => (
                      <option key={value} value={value}>
                        {TOPICS[value]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {(skill || topic) && (
                <button
                  className="text-link"
                  onClick={() => {
                    setSkill('')
                    setTopic('')
                  }}
                >
                  Xóa bộ lọc
                </button>
              )}
            </details>
            <p className="small muted">
              {units.length} nhóm phù hợp · luôn giữ đủ nhóm audio hoặc văn bản.
            </p>
            {!units.length && (
              <EmptyState
                icon={BookOpen}
                title={
                  part === 1 && !usable.some((q) => q.part === 1)
                    ? 'Chưa có ảnh sẵn sàng cho Part 1.'
                    : 'Chưa có nhóm khớp hai bộ lọc.'
                }
                action={
                  <button
                    className="button secondary"
                    onClick={() => {
                      setSkill('')
                      setTopic('')
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                }
              >
                Thử chọn kỹ năng hoặc chủ đề khác.
              </EmptyState>
            )}
            <details className="practice-extra">
              <summary>
                Mini-test · {miniIds.length} câu · {MINI_EXAM_MINUTES} phút
              </summary>
              <section className="mini-exam-panel panel">
                <div>
                  <Tag tone="brass">MINI MOCK · {MINI_EXAM_MINUTES} PHÚT</Tag>
                  <h2>Một lần tự đánh giá trọn nhịp.</h2>
                  <p>
                    {miniIds.length} câu từ {miniPartCount} Parts có tư liệu sẵn sàng. Audio tổng
                    hợp, không phải bài thi chính thức. Kết quả là số câu đúng và tỷ lệ theo Part;
                    không quy đổi điểm TOEIC.
                  </p>
                  <p className="small muted">Bộ mẫu ngắn dùng lại cùng câu hỏi khi làm lại.</p>
                </div>
                <button
                  className="button primary"
                  disabled={action.busy || (!active && miniPartCount !== 7)}
                  onClick={() => void begin(true)}
                >
                  <Timer size={17} />
                  {active
                    ? 'Tiếp tục phiên đang mở'
                    : miniPartCount !== 7
                      ? 'Chưa đủ tư liệu cho mini-test 7 Parts'
                      : 'Bắt đầu mini-test'}
                </button>
              </section>
            </details>
            {recent.length > 0 && (
              <section className="section-spaced">
                <h2 className="recent-title">Các phiên đã hoàn thành</h2>
                <div className="recent-sessions">
                  {recent.map((session) => (
                    <button
                      key={session.id}
                      className="word-result"
                      onClick={() => navigate('session', session.id)}
                    >
                      <span>
                        <strong>
                          {session.mode === 'exam' ? 'Exam Mode' : 'Study Mode'} ·{' '}
                          {session.questionIds.length} câu
                        </strong>
                        <small>{new Date(session.completedAt!).toLocaleString('vi-VN')}</small>
                      </span>
                      <span>
                        Xem kết quả
                        <ArrowRight size={15} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </section>
          <aside
            id="practice-settings"
            tabIndex={-1}
            aria-label="Thiết lập phiên luyện"
            className="panel session-config"
          >
            <p className="eyebrow">PHIÊN LUYỆN TẬP</p>
            <h2>Part {part}</h2>
            <p className="muted">{PART_NOTES[part]}</p>
            <fieldset className="mode-selector">
              <legend>Cách luyện tập</legend>
              <label className={mode === 'study' ? 'active' : ''}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'study'}
                  onChange={() => setMode('study')}
                />
                Học từng câu
              </label>
              <label className={mode === 'exam' ? 'active' : ''}>
                <input
                  type="radio"
                  name="mode"
                  disabled={!examEligible}
                  checked={mode === 'exam'}
                  onChange={() => setMode('exam')}
                />
                Bấm giờ {MINI_EXAM_MINUTES} phút
              </label>
            </fieldset>
            <p className="small muted">
              {mode === 'study'
                ? 'Replay, tốc độ, transcript và giải thích sau khi nộp từng câu.'
                : `${MINI_EXAM_MINUTES} phút, audio một lượt, không hiện đáp án trước khi nộp. Phần nghe không quay lại; phần đọc có thể xem lại.`}
            </p>
            {!examEligible && (
              <p className="small muted">
                Lựa chọn này chưa đủ điều kiện dùng trong lượt tự đánh giá. Study Mode vẫn dành cho
                nội dung luyện hợp lệ.
              </p>
            )}
            <label className="form-label">
              Số câu mục tiêu
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[3, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} câu
                  </option>
                ))}
              </select>
            </label>
            <p className="small muted">
              Phiên này có <strong>{selectedIds.length} câu</strong>. Giữ đủ nhóm audio/văn bản nên
              số thực tế có thể khác mục tiêu.
            </p>
            <button
              className="button primary full"
              disabled={
                action.busy ||
                (!active && (!selectedIds.length || (mode === 'exam' && !examEligible)))
              }
              onClick={() => void begin()}
            >
              <Play size={16} fill="currentColor" />
              {active ? 'Tiếp tục phiên đang học' : `Luyện ${selectedIds.length} câu`}
            </button>
            <InlineError message={action.error} />
            <div className="config-footer">
              <p>
                Nội dung tự biên/chuyển soạn, chưa thẩm định độc lập. Không quy đổi thành điểm
                TOEIC.
              </p>
            </div>
          </aside>
        </div>
        <details className="practice-extra">
          <summary>Tài liệu nguồn & phiếu đối chiếu</summary>
          <SourceEvidencePanel />
        </details>
      </div>
    </>
  )
}
