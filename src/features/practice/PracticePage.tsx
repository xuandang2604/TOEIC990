import { useState } from 'react'
import { ArrowRight, BookOpen, Headphones, Play, RotateCcw, Timer } from 'lucide-react'
import {
  practiceQuestions as questions,
  mockQuestions,
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
import { questionInventory } from '../../domain/contentInventory'
import { questionAssessmentEligible } from '../../content/eligibility'
import { EmptyState, InlineError, PageHeading, Tag } from '../../components/ui'

const TOPICS: Record<Topic, string> = {
  office: 'Công sở',
  travel: 'Du lịch',
  training: 'Đào tạo',
  shopping: 'Mua sắm',
  facilities: 'Cơ sở vật chất',
  grammar: 'Ngữ pháp',
}
const PART_NOTES: Record<ToeicPart, string> = {
  1: 'Ảnh photograph có giấy phép. Nghe mô tả.',
  2: 'Nghe ý định. Chọn lời đáp phù hợp.',
  3: 'Hội thoại chung cho ba câu, kèm bảng biểu.',
  4: 'Bài nói chung cho ba câu, kèm bảng biểu.',
  5: 'Nhìn cấu trúc. Hiểu cách dùng từ.',
  6: 'Hoàn thành từ và cả câu trong văn bản.',
  7: 'Đọc một hoặc nhiều văn bản để tìm bằng chứng.',
}

export function PracticePage() {
  const data = useStudy(),
    action = useAction()
  const [part, setPart] = useState<ToeicPart>(5),
    [count, setCount] = useState(6)
  const [mode, setMode] = useState<PracticeMode>('study'),
    [skill, setSkill] = useState<Skill | ''>(''),
    [topic, setTopic] = useState<Topic | ''>('')
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
  const miniPartCount = new Set(miniIds.map((id) => questions.find((q) => q.id === id)!.part)).size
  const answered = new Set(
    data.attempts.filter((a) => a.selected !== null).map((a) => a.questionId),
  )
  const inventory = questionInventory(questions, mockQuestions, stimuli, data.attempts)
  const recent = [...data.sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
    .slice(0, 5)
  async function begin(mini = false) {
    await action.run(async () => {
      const session = await startSession(
        mini ? 'mini-exam' : 'practice',
        mini ? miniIds : selectedIds,
        { mode: mini ? 'exam' : mode, durationMinutes: MINI_EXAM_MINUTES },
      )
      navigate('session', session.id)
    })
  }
  async function openStudio(kind: 'listening' | 'reading') {
    const target = kind === 'listening' ? (part <= 4 ? part : 3) : part >= 6 ? part : 7
    const ids = takeUnits(filterPracticeUnits(usable, { part: target }), 3)
    await action.run(async () => {
      const session = await startSession('practice', ids, { mode: 'study' })
      navigate('session', session.id)
    })
  }
  return (
    <>
      <PageHeading
        eyebrow="CÓ CHỦ ĐÍCH, CÓ TIẾN BỘ"
        title="Tập trung vào từng kỹ năng."
        description="Bảy Parts, nhóm tư liệu đầy đủ và hai nhịp học: hiểu từng câu hoặc tự đánh giá có thời gian."
      />
      <section className="bank-inventory panel" aria-label="Nội dung đang có">
        <div>
          <strong>{inventory.availablePractice}</strong>
          <span>câu luyện sẵn sàng</span>
        </div>
        <div>
          <strong>{inventory.attemptedPractice}</strong>
          <span>câu luyện đã trả lời</span>
        </div>
        <div>
          <strong>{availableMockExams.length}</strong>
          <span>mock đủ 200 câu · {inventory.reservedMock} câu riêng</span>
        </div>
        <p className="small muted">
          Nội dung mới do AI biên soạn, chưa thẩm định độc lập. Câu trong mock được giữ riêng khỏi
          bộ luyện. Mini-test bên dưới là bộ mẫu ngắn.
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
      <div className="practice-layout">
        <section>
          <div className="section-title">
            <h2>Chọn một Part</h2>
            <Tag>{new Set(usable.map((q) => q.part)).size} phần có tư liệu sẵn sàng</Tag>
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
                  <p>
                    {ready.length
                      ? PART_NOTES[value]
                      : 'Chưa có tư liệu có thể chấm. Nội dung mẫu đang chờ bổ sung.'}
                  </p>
                  <div className="part-card-bottom">
                    <span>{ready.length} câu sẵn sàng</span>
                    <span>{available.filter((q) => answered.has(q.id)).length} đã gặp</span>
                  </div>
                </button>
              )
            })}
          </div>
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
          <p className="small muted">
            {units.length} nhóm khớp bộ lọc. Khi một câu khớp, cả nhóm dùng chung tư liệu được giữ
            lại để học đủ ngữ cảnh.
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
          <section className="mini-exam-panel panel">
            <div>
              <Tag tone="brass">MINI MOCK · {MINI_EXAM_MINUTES} PHÚT</Tag>
              <h2>Một lần tự đánh giá trọn nhịp.</h2>
              <p>
                {miniIds.length} câu từ {miniPartCount} Parts có tư liệu sẵn sàng. Audio tổng hợp,
                không phải bài thi chính thức. Kết quả là số câu đúng và tỷ lệ theo Part; không quy
                đổi điểm TOEIC.
              </p>
              <p className="small muted">
                Bộ mẫu ngắn được giữ riêng với mock 200 câu bên dưới; không phải bài thi chính thức.
              </p>
            </div>
            <button
              className="button primary"
              disabled={action.busy || miniPartCount !== 7}
              onClick={() => void begin(true)}
            >
              <Timer size={17} />
              {miniPartCount !== 7
                ? 'Chưa đủ tư liệu cho mini-test 7 Parts'
                : active
                  ? 'Tiếp tục phiên đang mở'
                  : 'Bắt đầu mini-test'}
            </button>
          </section>
          {availableMockExams.map((exam) => (
            <section className="mini-exam-panel panel" key={exam.id}>
              <div>
                <Tag tone="brass">MOCK 200 CÂU · 120 PHÚT</Tag>
                <h2>{exam.title}</h2>
                <p>
                  Đủ phân bố 6/25/39/30/30/16/54, có nhóm nghe và đọc đơn/đôi/ba văn bản. Giọng máy,
                  nội dung AI chưa thẩm định độc lập.
                </p>
                <p className="small muted">
                  120 phút là ngân sách tổng của lượt luyện; không tái tạo lịch audio chuẩn hay chia
                  giờ chính thức. Chỉ báo accuracy, không điểm TOEIC. Làm lại sẽ gặp cùng đề.
                </p>
              </div>
              <button
                className="button primary"
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    const session = await startSession('practice', exam.questionIds, {
                      mode: 'exam',
                      durationMinutes: exam.durationMinutes,
                      mockExamId: exam.id,
                    })
                    navigate('session', session.id)
                  })
                }
              >
                <Timer size={17} />
                {active ? 'Tiếp tục phiên đang mở' : 'Làm mock 200 câu'}
              </button>
            </section>
          ))}
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
        <aside className="panel session-config">
          <p className="eyebrow">PHIÊN LUYỆN TẬP</p>
          <h2>Vừa sức, mỗi ngày.</h2>
          <p className="muted">
            Part {part} · {PART_LABELS[part]}
          </p>
          <fieldset className="mode-selector">
            <legend>Cách luyện tập</legend>
            <label className={mode === 'study' ? 'active' : ''}>
              <input
                type="radio"
                name="mode"
                checked={mode === 'study'}
                onChange={() => setMode('study')}
              />
              Study · Học & phản hồi
            </label>
            <label className={mode === 'exam' ? 'active' : ''}>
              <input
                type="radio"
                name="mode"
                disabled={!examEligible}
                checked={mode === 'exam'}
                onChange={() => setMode('exam')}
              />
              Exam · Tự đánh giá
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
            <strong>
              {units.reduce((n, u) => n + u.questionIds.length, 0)} câu trong {units.length} nhóm
            </strong>{' '}
            khớp lựa chọn. Phiên này có <strong>{selectedIds.length} câu</strong>. Nhóm audio/văn
            bản được giữ nguyên nên số thực tế có thể vượt mục tiêu hoặc ít hơn khi bộ mẫu nhỏ.
          </p>
          <button
            className="button primary full"
            disabled={action.busy || !selectedIds.length || (mode === 'exam' && !examEligible)}
            onClick={() => void begin()}
          >
            <Play size={16} fill="currentColor" />
            {active ? 'Tiếp tục phiên đang học' : 'Bắt đầu luyện tập'}
          </button>
          <InlineError message={action.error} />
          <div className="config-footer">
            <p>
              Nội dung gốc của STUDY 990. Ảnh Part 1 có giấy phép CC0; nội dung mới ghi rõ chưa thẩm
              định độc lập. Không phải đề thi ETS.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
