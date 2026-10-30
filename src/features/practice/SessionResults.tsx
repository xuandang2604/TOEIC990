import { UnitNavigation } from './UnitNavigation'
import { mockForSession } from '../../content/mockExams'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { allQuestions, PART_LABELS } from '../../content/questions'
import { resultByPart, sessionUnits } from '../../domain/assessment'
import type { StudySession } from '../../domain/models'
import { useStudy } from '../../application/StudyContext'
import { navigate, useRoute, useAction, returnToQuestion } from '../../application/hooks'
import { SectionTitle, Tag, InlineError } from '../../components/ui'
import { startSession } from '../../application/sessionRepository'
import { UnitContent } from './PracticeUnit'
import { ExamAnswerSheet } from './ExamAnswerSheet'

export function SessionResults({ session }: { session: StudySession }) {
  const heading = useRef<HTMLHeadingElement>(null)
  const route = useRoute()
  const units = sessionUnits(session, allQuestions)
  const focusIndex = units.findIndex((unit) =>
    unit.questionIds.includes(route.focusQuestionId ?? ''),
  )
  useEffect(() => {
    if (focusIndex < 0) heading.current?.focus({ preventScroll: true })
  }, [session.id])
  const data = useStudy(),
    [index, setIndex] = useState(Math.max(0, focusIndex)),
    [review, setReview] = useState(focusIndex >= 0)
  const action = useAction()
  const [filter, setFilter] = useState<'all' | 'wrong' | 'blank' | 'flagged'>('all')
  const attempts = data.attempts.filter((a) => a.sessionId === session.id)
  const byQuestion = new Map(attempts.map((a) => [a.questionId, a]))
  const reviewUnits = units
    .map((unit, index) => ({ unit, index }))
    .filter(
      ({ unit }) =>
        filter === 'all' ||
        unit.questionIds.some((id) =>
          filter === 'flagged'
            ? session.flaggedQuestionIds?.includes(id)
            : filter === 'blank'
              ? byQuestion.get(id)?.selected === null
              : byQuestion.get(id)?.correct === false,
        ),
    )
  const reviewIndex = reviewUnits.some((row) => row.index === index) ? index : reviewUnits[0]?.index
  const wrongIds = units
    .filter((unit) => unit.questionIds.some((id) => byQuestion.get(id)?.correct === false))
    .flatMap((unit) => unit.questionIds)
  async function practiceMistakes() {
    const active = data.sessions.find((row) => row.status === 'active')
    if (active) {
      navigate('session', active.id)
      return
    }
    const hash = window.location.hash
    const next = await action.run(() =>
      startSession('practice', wrongIds, {
        mode: 'study',
        ...(session.mockExamId ? { mockExamId: session.mockExamId } : {}),
      }),
    )
    if (next && window.location.hash === hash) navigate('session', next.id)
  }
  const tutorSource = data.reflections.find((r) => r.transferSessionId === session.id)
  const correct = attempts.filter((a) => a.correct).length
  const blank = attempts.filter((a) => a.selected === null).length
  const rows = resultByPart(session, allQuestions, attempts)
  const media = data.playbacks.filter((p) => p.sessionId === session.id)
  const audioExceptions = units.filter(
    (u) =>
      u.part <= 4 &&
      !media.some((p) => p.stimulusId === u.id && p.status === 'completed' && !p.assisted),
  ).length
  return (
    <>
      <div className="completion">
        <span className="completion-icon">
          <CheckCircle2 size={38} strokeWidth={1.3} />
        </span>
        <p className="eyebrow">
          {session.mode === 'exam'
            ? mockForSession(session)
              ? 'KẾT QUẢ MOCK 200 CÂU'
              : 'KẾT QUẢ EXAM PRACTICE'
            : 'MỘT BƯỚC TIẾN THẬT'}
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {session.finishReason === 'timeout'
            ? 'Đã hết giờ. Cùng nhìn lại.'
            : 'Thêm một bước hiểu sâu hơn.'}
        </h1>
        <p className="lede">
          Phiên học đã được lưu. Đây là độ chính xác trên bộ câu mẫu, không phải điểm TOEIC hay một
          bài thi chính thức.
        </p>
        <div className="completion-stats">
          <div>
            <strong>
              {correct}/{session.questionIds.length}
            </strong>
            <span>câu trả lời đúng</span>
          </div>
          <div>
            <strong>{Math.round((correct / session.questionIds.length) * 100)}%</strong>
            <span>độ chính xác thô</span>
          </div>
          <div>
            <strong>{blank}</strong>
            <span>câu để trống</span>
          </div>
        </div>
        {session.mode === 'exam' && (
          <p className="small muted">
            {audioExceptions
              ? `${audioExceptions} nhóm nghe có lỗi, gián đoạn, bỏ qua, phát hỗ trợ hoặc chưa nghe hết. Không so sánh kết quả này với điều kiện thi chuẩn.`
              : 'Audio nghe một lần theo lịch sử đã ghi. Thiết bị vẫn quyết định chất lượng giọng tổng hợp.'}
          </p>
        )}
        <div className="completion-actions">
          {tutorSource && (
            <button className="button secondary" onClick={() => navigate('tutor', tutorSource.id)}>
              Về sổ giải thích Tutor
              <ArrowRight size={16} />
            </button>
          )}
          {session.dailyPlanId && (
            <button
              className="button secondary"
              onClick={() => navigate('plan', session.dailyPlanId)}
            >
              Về kế hoạch đã lưu
              <ArrowRight size={16} />
            </button>
          )}
          <button className="button primary" onClick={() => setReview((value) => !value)}>
            {review ? 'Ẩn lời giải' : 'Xem lại từng câu'}
            <ArrowRight size={16} />
          </button>
          <button className="button secondary" onClick={() => navigate('today')}>
            Về hôm nay
          </button>
          {wrongIds.length > 0 && (
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => void practiceMistakes()}
            >
              {data.sessions.some((s) => s.status === 'active')
                ? 'Tiếp tục phiên đang mở'
                : 'Ôn nhóm có câu sai / bỏ trống'}
              <ArrowRight size={16} />
            </button>
          )}
          {session.mockExamId && (
            <button className="text-link" onClick={() => navigate('tests', session.mockExamId)}>
              Về trang đề & lịch sử
              <ArrowRight size={15} />
            </button>
          )}
          <button className="text-link" onClick={() => navigate('review')}>
            Mở sổ ôn tập
            <ArrowRight size={15} />
          </button>
        </div>
        <InlineError message={action.error} />
      </div>
      <section className="results-by-part">
        <SectionTitle
          title="Kết quả theo Part"
          note="Câu để trống nằm trong mẫu số và được tính là chưa đúng."
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">Đã trả lời</th>
                <th scope="col">Đúng / Tổng</th>
                <th scope="col">Độ chính xác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.part}>
                  <th scope="row">
                    {row.part} · {PART_LABELS[row.part]}
                  </th>
                  <td>{row.answered}</td>
                  <td>
                    {row.correct}/{row.total}
                  </td>
                  <td>{Math.round((row.correct / row.total) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {review && (
        <section className="section-spaced">
          <SectionTitle
            title="Nhìn lại bằng chứng & cách nghĩ"
            action={<Tag tone="sage">Đã nộp · Có thể đọc transcript</Tag>}
          />
          <div className="filter-tabs" aria-label="Lọc câu để xem lại">
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'wrong', label: 'Sai / bỏ trống' },
                { id: 'blank', label: 'Bỏ trống' },
                { id: 'flagged', label: 'Đã đánh dấu' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                className={filter === item.id ? 'active' : ''}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {session.mockExamId && (
            <ExamAnswerSheet
              session={session}
              review
              currentId={reviewIndex === undefined ? undefined : units[reviewIndex]?.questionIds[0]}
              onSelect={(id) => {
                setFilter('all')
                setIndex(units.findIndex((unit) => unit.questionIds.includes(id)))
                returnToQuestion({ sessionId: session.id, questionId: id })
              }}
            />
          )}
          <UnitNavigation
            count={reviewUnits.length}
            current={Math.max(
              0,
              reviewUnits.findIndex((row) => row.index === reviewIndex),
            )}
          >
            <nav className="unit-navigation" aria-label="Chọn nhóm để xem lời giải">
              {reviewUnits.map(({ unit, index: i }) => (
                <button
                  key={unit.id}
                  className={i === reviewIndex ? 'active' : ''}
                  aria-current={i === reviewIndex ? 'step' : undefined}
                  onClick={() => setIndex(i)}
                >
                  P{unit.part} · {i + 1}
                </button>
              ))}
            </nav>
          </UnitNavigation>
          {reviewIndex !== undefined && units[reviewIndex] ? (
            <UnitContent
              key={units[reviewIndex].id}
              unit={units[reviewIndex]}
              session={session}
              review
            />
          ) : (
            <p className="notice" role="status">
              Không có nhóm câu khớp bộ lọc. Chọn “Tất cả” để xem lại bài.
            </p>
          )}
        </section>
      )}
    </>
  )
}
