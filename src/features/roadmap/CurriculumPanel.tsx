import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Headphones, RotateCcw } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, useAction, useNow } from '../../application/hooks'
import { startRoadmapPractice } from '../../application/roadmapRepository'
import {
  curriculumProgress,
  nextCurriculumFocus,
  CURRICULUM_POLICY,
  CURRICULUM_STATUS,
} from '../../domain/curriculum'
import type { RoadmapPhaseId } from '../../domain/roadmap'
import type { StudyMinutes } from '../../domain/models'
import { stimuli } from '../../content/questions'
import { learningQuestionPool } from '../../application/learningQuestionPool'
import { grammarById } from '../../content/grammar'
import { availableMockExams } from '../../content/mockExams'
import { InlineError, Tag } from '../../components/ui'
import { useReferenceFocus } from '../../components/useReferenceFocus'
import { sourceReviewParts } from '../../domain/sourcePractice'

const phases: { id: RoadmapPhaseId; label: string }[] = [
  { id: 'foundation', label: '01 · Nền tảng' },
  { id: 'application', label: '02 · Vận dụng' },
  { id: 'integration', label: '03 · Tích hợp' },
  { id: 'consolidation', label: '04 · Củng cố' },
]

export function CurriculumPanel({ currentPhase }: { currentPhase: RoadmapPhaseId }) {
  const data = useStudy(),
    now = useNow(),
    action = useAction()
  const practiceQuestions = useMemo(() => learningQuestionPool(data.sessions), [data.sessions])
  const rows = useMemo(
    () => curriculumProgress(practiceQuestions, stimuli, data.attempts, now),
    [practiceQuestions, data.attempts, now],
  )
  const next = nextCurriculumFocus(
    rows,
    currentPhase,
    sourceReviewParts(data.learningActivities, now),
  )
  const [selection, setSelection] = useState<string | null>(null)
  const [phase, setPhase] = useState<RoadmapPhaseId | null>(null)
  const [minutes, setMinutes] = useState<StudyMinutes>(data.preferences.studyMinutes)
  const detail = useReferenceFocus(selection ?? undefined, 900)
  const chosen = rows.find((row) => row.unit.id === selection) ?? next ?? rows[0]
  const visiblePhase = phase ?? chosen.unit.phase
  const visible = rows.filter((row) => row.unit.phase === visiblePhase)
  const active = data.sessions.find((session) => session.status === 'active')
  const activePlan = data.dailyPlans.find((plan) => plan.status === 'active')
  const diagnostic = rows[0]
  const needsContent = rows.filter((row) => row.contentShortfall).length
  function select(id: string) {
    const row = rows.find((row) => row.unit.id === id)!
    setSelection(id)
    setPhase(row.unit.phase)
  }
  async function begin() {
    if (active) {
      navigate('session', active.id)
      return
    }
    if (activePlan) {
      navigate('plan', activePlan.id)
      return
    }
    if (!chosen.available) {
      navigate('grammar', chosen.unit.grammarIds[0])
      return
    }
    const source = window.location.hash
    const session = await action.run(() =>
      startRoadmapPractice('all', { unitId: chosen.unit.id, minutes }),
    )
    if (session && window.location.hash === source) navigate('session', session.id)
  }
  return (
    <section className="curriculum" aria-label="Chương trình hướng tới TOEIC 990">
      <header className="curriculum-heading">
        <div>
          <span className="eyebrow">HIỂU → VẬN DỤNG → KIỂM TRA LẠI</span>
          <h2>Chương trình hướng tới 990</h2>
          <p>{rows.length} chuyên đề · cả 7 Parts · tiến độ từ những lượt làm đã lưu.</p>
        </div>
        <Tag tone="sage">{7 - diagnostic.unmetParts.length}/7 Parts đã lấy mẫu</Tag>
      </header>
      {next && next.unit.id !== chosen.unit.id && (
        <button className="curriculum-next text-link" onClick={() => select(next.unit.id)}>
          Nên học tiếp: {next.unit.title}
          <ArrowRight size={15} />
        </button>
      )}
      <nav className="curriculum-phases" aria-label="Giai đoạn chương trình">
        {phases.map((item) => (
          <button
            key={item.id}
            aria-pressed={visiblePhase === item.id}
            onClick={() => {
              setPhase(item.id)
              setSelection(rows.find((row) => row.unit.phase === item.id)!.unit.id)
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="curriculum-workspace">
        <nav className="curriculum-index" aria-label="Chuyên đề">
          {visible.map((row) => (
            <button
              key={row.unit.id}
              aria-current={chosen.unit.id === row.unit.id ? 'true' : undefined}
              onClick={() => select(row.unit.id)}
            >
              <strong>{row.unit.title}</strong>
              <small>
                {CURRICULUM_STATUS[row.status]} ·{' '}
                {row.available ? `${row.seen}/${row.available} câu` : 'Sổ tay & mini practice'}
              </small>
            </button>
          ))}
        </nav>
        <article
          className="curriculum-lesson panel"
          key={chosen.unit.id}
          ref={detail}
          tabIndex={-1}
          aria-label={chosen.unit.title}
        >
          <div className="curriculum-lesson-meta">
            <Tag>{chosen.unit.parts.map((part) => `P${part}`).join(' · ')}</Tag>
            <span>{CURRICULUM_STATUS[chosen.status]}</span>
          </div>
          <h3>{chosen.unit.title}</h3>
          <p className="curriculum-outcome">{chosen.unit.outcome}</p>
          <dl className="curriculum-evidence">
            <div>
              <dt>Đúng ở lần đầu gần nhất</dt>
              <dd>
                {chosen.firstSample
                  ? `${chosen.firstCorrect}/${chosen.firstSample}`
                  : 'Chưa có dữ liệu'}
              </dd>
            </div>
            <div>
              <dt>Câu chưa gặp</dt>
              <dd>{chosen.unseen}</dd>
            </div>
            <div>
              <dt>Nhớ lại sau ≥48 giờ</dt>
              <dd>{chosen.recalled} câu</dd>
            </div>
          </dl>
          {chosen.unmetParts.length > 0 && (
            <p className="small muted">
              Chưa lấy mẫu: {chosen.unmetParts.map((part) => `Part ${part}`).join(', ')}.
            </p>
          )}
          {chosen.contentShortfall && (
            <p className="curriculum-content-note">
              {!chosen.available
                ? 'Chưa có câu TOEIC riêng cho chuyên đề này. Học qua sổ tay và mini practice bên dưới.'
                : chosen.available < chosen.unit.minimumQuestions
                  ? `Có ${chosen.available} câu trọng tâm; chưa đủ mốc lấy mẫu ${chosen.unit.minimumQuestions} câu.`
                  : 'Chưa đủ nội dung bao phủ mọi Part của chuyên đề.'}
            </p>
          )}
          {chosen.unsupportedParts.length > 0 && (
            <p className="small muted">
              Chưa có câu đúng dạng cho{' '}
              {chosen.unsupportedParts.map((part) => `Part ${part}`).join(', ')} trong chuyên đề.
              Không thay bằng dạng khác để tính tiến độ.
            </p>
          )}
          {chosen.status === 'more-content' && (
            <p className="curriculum-content-note">
              Cần đối chiếu trên câu mới. Làm lại bộ đã gặp vẫn có ích, nhưng không bổ sung kết quả
              lần đầu.
            </p>
          )}
          <div className="curriculum-session-controls">
            <label>
              Khung thời gian
              <select
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value) as StudyMinutes)}
              >
                {[10, 20, 40].map((value) => (
                  <option key={value} value={value}>
                    {value} phút
                  </option>
                ))}
              </select>
            </label>
            <button className="button primary" disabled={action.busy} onClick={() => void begin()}>
              {chosen.unit.parts.every((part) => part <= 4) ? (
                <Headphones size={17} />
              ) : (
                <BookOpen size={17} />
              )}
              {active
                ? 'Tiếp tục phiên'
                : activePlan
                  ? 'Tiếp tục kế hoạch'
                  : !chosen.available
                    ? 'Học qua sổ tay'
                    : chosen.unseen
                      ? 'Luyện chuyên đề'
                      : 'Ôn nhóm đã gặp'}
              <ArrowRight size={16} />
            </button>
          </div>
          <InlineError message={action.error} />
          <details className="curriculum-guide">
            <summary>Hiểu đơn giản & cách luyện</summary>
            <p>{chosen.unit.explainSimply}</p>
            <ol>
              {chosen.unit.routine.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <blockquote>
              <p lang="en" data-learning>
                {chosen.unit.contrast.example}
              </p>
              <footer>{chosen.unit.contrast.explanation}</footer>
            </blockquote>
            <p className="curriculum-self-check">
              <strong>Tự giải thích:</strong> {chosen.unit.selfCheck}
            </p>
          </details>
          <details className="curriculum-guide">
            <summary>Sổ tay & ôn tập liên quan</summary>
            <div className="curriculum-reference-links">
              {chosen.unit.grammarIds.map((id) => (
                <button key={id} className="text-link" onClick={() => navigate('grammar', id)}>
                  {grammarById.get(id)?.title}
                  <ArrowRight size={14} />
                </button>
              ))}
              <button className="text-link" onClick={() => navigate('vocabulary')}>
                Tra & lưu từ
                <ArrowRight size={14} />
              </button>
              <button className="text-link" onClick={() => navigate('review')}>
                <RotateCcw size={14} />
                Ôn thẻ đến hạn
              </button>
            </div>
          </details>
        </article>
      </div>
      <details className="curriculum-guide curriculum-method">
        <summary>Cách đọc tiến độ & mốc củng cố</summary>
        <p>
          Lần đầu là lần gặp câu trong app ở revision hiện tại; có thể đã dùng gợi ý. Chỉ dùng câu
          luyện và câu từ full test đã nộp; không lấy câu từ đề chưa nộp, Tutor hoặc mini practice
          ngữ pháp. Cùng câu được làm lại không thành câu mới.
        </p>
        <p>
          Mốc nội bộ: đủ số câu theo chuyên đề; ít nhất {CURRICULUM_POLICY.firstPassAccuracy * 100}%
          trên tối đa {CURRICULUM_POLICY.firstPassWindow} lần gặp đầu gần nhất; luyện trên{' '}
          {CURRICULUM_POLICY.studyDays} ngày; ôn đúng ít nhất một phần ba số câu tối thiểu sau ≥48
          giờ. Đây là gợi ý tiếp tục học, không phải chuẩn quy đổi điểm ETS hay xác nhận thành thạo.
        </p>
        <p>
          Ôn lại sau 48 giờ kiểm tra việc nhớ, chưa chứng minh vận dụng trên câu mới. Nếu bộ câu đã
          hết, cần bổ sung tài liệu hợp pháp thay vì học thuộc đáp án.
        </p>
      </details>
      <details className="curriculum-guide curriculum-checkpoint">
        <summary>Kiểm tra cuối chặng & độ đầy đủ của nội dung</summary>
        <p>
          Bộ app có {practiceQuestions.length} câu luyện và {availableMockExams.length} mock mẫu đủ
          cấu trúc. {needsContent} chuyên đề chưa đủ câu lấy mẫu. Nội dung mẫu chưa thẩm định độc
          lập; audio ban đầu là giọng tổng hợp.
        </p>
        <ol>
          <li>
            Dùng một đề mới có nguồn hợp pháp, nghe một lượt, không tra từ hay mở bản dịch khi làm.
          </li>
          <li>
            Tách Listening khoảng 45 phút và Reading 75 phút. Luyện sức bền bằng một lượt trọn bài,
            rồi phân tích lỗi theo Part.
          </li>
          <li>
            Reading có thể thử nhịp cá nhân P5: 10 phút, P6: 8 phút, P7: 57 phút. Đây là điểm khởi
            đầu để điều chỉnh, không phải quy định thời gian từng Part của ETS.
          </li>
          <li>
            Sau khi sửa lỗi, kiểm tra lại trên đề khác và các buổi khác. Chú ý câu bỏ trống, sai vì
            điều kiện/ngoại lệ và câu đúng nhưng còn phân vân.
          </li>
        </ol>
        <div className="curriculum-reference-links">
          <button className="text-link" onClick={() => navigate('tests')}>
            Chọn full test & xem lịch sử
            <ArrowRight size={14} />
          </button>
          <a
            className="text-link"
            href="https://www.ets.org/toeic/test-takers/prepare.html"
            target="_blank"
            rel="noreferrer"
          >
            Tài liệu chuẩn bị chính thức ETS ↗
          </a>
          <a
            className="text-link"
            href="https://www.ets.org/pdfs/toeic/toeic-listening-reading-score-descriptors.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Mô tả năng lực ETS ↗
          </a>
        </div>
        <p className="small muted">
          App không quy đổi độ chính xác thành điểm TOEIC và không xác nhận sẵn sàng đạt 990 từ bộ
          câu mẫu. Hướng dẫn chuyên đề do AI biên soạn, chưa thẩm định độc lập.
        </p>
      </details>
    </section>
  )
}
