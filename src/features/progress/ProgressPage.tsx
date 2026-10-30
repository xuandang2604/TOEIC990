import { LearningMilestones } from '../../components/LearningMilestones'
import { SourceEvidencePanel } from '../practice/SourceEvidencePanel'
import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Target,
} from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, navigateReference, useNow } from '../../application/hooks'
import { questionById, PART_LABELS } from '../../content/questions'
import { grammar } from '../../content/grammar'
import { isAnsweredAttempt } from '../../domain/models'
import { aggregateSkillEvidence } from '../../domain/evidence'
import { skillAncestors } from '../../domain/skillTaxonomy'
import {
  accuracyTrend,
  analyticsPeriodStart,
  comparableSkillChanges,
  learningActivity,
  queueDistribution,
  recallEvents,
} from '../../domain/analytics'
import { EmptyState, PageHeading, SectionTitle, Tag } from '../../components/ui'
import type { Skill } from '../../content/schema'

export function ProgressPage() {
  const data = useStudy(),
    now = useNow()
  const [period, setPeriod] = useState<7 | 28 | 0>(28)
  const [activityMode, setActivityMode] = useState<'all' | 'questions' | 'grammar' | 'reviews'>(
    'all',
  )
  const [sessionLimit, setSessionLimit] = useState(8)
  const [planLimit, setPlanLimit] = useState(6)
  const completedSessions = data.sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  const savedPlans = [...data.dailyPlans].sort((a, b) => b.createdAt - a.createdAt)
  const [expanded, setExpanded] = useState(
    new Set(['reading', 'reading.grammar', 'listening', 'listening.comprehension']),
  )
  const from = analyticsPeriodStart(now, period)
  const attempts = data.attempts.filter((a) => a.occurredAt >= from && a.occurredAt <= now)
  const answered = attempts.filter(isAnsweredAttempt),
    correct = attempts.filter((a) => a.correct).length
  const reviews = recallEvents(
    data.reviewEvents.filter((e) => e.occurredAt >= from && e.occurredAt <= now),
  )
  const skills = aggregateSkillEvidence(data.skillEvidence, from, now + 1)
  const changes = comparableSkillChanges(data.skillEvidence, now)
  const days = learningActivity(data.attempts, data.reviewEvents, now, 28, data.skillEvidence)
  const referenceCount = new Set(
    data.skillEvidence
      .filter((e) => e.source === 'grammar-practice' && e.occurredAt >= from && e.occurredAt <= now)
      .map((e) => e.attemptId),
  ).size
  const last7 = days.slice(-7)
  const activityCount = (day: (typeof days)[number]) =>
    activityMode === 'questions'
      ? day.questions
      : activityMode === 'grammar'
        ? day.grammarExercises
        : activityMode === 'reviews'
          ? day.vocabulary + day.knowledge
          : day.total
  const maximum = Math.max(1, ...last7.map(activityCount))
  const queue = queueDistribution(data.cards, now),
    maxQueue = Math.max(1, ...queue.rows.map((r) => r.count))
  const trend = accuracyTrend(data.attempts, now)
  const explicit = answered.filter((a) => a.confidenceSource === 'explicit')
  const highErrors = explicit.filter((a) => !a.correct && a.confidence === 3).length
  const lowCorrect = explicit.filter((a) => a.correct && a.confidence === 1).length
  const missed = skills
    .filter((s) => s.leaf && s.missed > 0)
    .sort((a, b) => b.missed - a.missed || b.distinctQuestions - a.distinctQuestions)
    .slice(0, 6)
  const knownPart = (id: string) => questionById.get(id)?.part
  return (
    <>
      <LearningMilestones />
      <PageHeading
        eyebrow="NHỮNG BƯỚC TIẾN CÓ THẬT"
        title="Thấy rõ cách mình học."
        description="Quan sát kết quả và nhịp học đã ghi nhận. Không dự đoán điểm TOEIC hoặc tuyên bố đã thành thạo."
      />
      <SourceEvidencePanel />
      <div className="filter-tabs" aria-label="Khoảng dữ liệu">
        {(
          [
            { value: 7, label: '7 ngày' },
            { value: 28, label: '28 ngày' },
            { value: 0, label: 'Tất cả' },
          ] as const
        ).map((item) => (
          <button
            key={item.value}
            aria-pressed={period === item.value}
            className={period === item.value ? 'active' : ''}
            onClick={() => setPeriod(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="progress-stat-grid">
        {[
          {
            icon: BookOpen,
            value: answered.length,
            label: 'Lượt trả lời TOEIC',
            note: `${new Set(answered.map((a) => a.questionId)).size} câu khác nhau · ${referenceCount} lượt tự kiểm tra ngữ pháp riêng`,
          },
          {
            icon: Target,
            value: attempts.length ? `${Math.round((correct / attempts.length) * 100)}%` : '—',
            label: 'Độ chính xác thô',
            note: `${correct}/${attempts.length} đã chấm · ${attempts.length - answered.length} bỏ trống`,
          },
          {
            icon: CheckCircle2,
            value: reviews.length,
            label: 'Lượt ôn đã ghi',
            note: 'Gồm đúng/sai và thẻ tự đánh giá',
          },
          {
            icon: Compass,
            value: data.sessions.filter(
              (s) =>
                s.status === 'completed' &&
                (s.completedAt ?? 0) >= from &&
                (s.completedAt ?? 0) <= now,
            ).length,
            label: 'Phiên câu hỏi đã xong',
            note: `${data.sessions.filter((s) => s.status === 'active').length} phiên đang mở`,
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div className="progress-stat panel" key={stat.label}>
              <Icon size={21} strokeWidth={1.4} />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              <small>{stat.note}</small>
            </div>
          )
        })}
      </div>
      <div className="progress-columns">
        <section className="panel activity-panel">
          <SectionTitle
            title="Hoạt động 7 ngày"
            note="Mỗi lượt trả lời hoặc tự kiểm tra được tính một lần; ôn từ/kiến thức được ghi riêng."
          />
          <div className="analytics-toggle">
            {(['all', 'questions', 'grammar', 'reviews'] as const).map((value) => (
              <button
                key={value}
                aria-pressed={activityMode === value}
                onClick={() => setActivityMode(value)}
              >
                {value === 'all'
                  ? 'Tất cả'
                  : value === 'questions'
                    ? 'Câu TOEIC'
                    : value === 'grammar'
                      ? 'Ngữ pháp'
                      : 'Ôn thẻ'}
              </button>
            ))}
          </div>
          <div
            className="activity-chart"
            role="img"
            aria-label={last7
              .map(
                (day) => `${day.date.toLocaleDateString('vi-VN')}: ${activityCount(day)} hoạt động`,
              )
              .join('; ')}
          >
            {last7.map((day) => (
              <div className="activity-column" key={day.key}>
                <span>{activityCount(day)}</span>
                <div className="bar-track">
                  <i style={{ height: `${(activityCount(day) / maximum) * 100}%` }} />
                </div>
                <small>{day.date.toLocaleDateString('vi-VN', { weekday: 'short' })}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="panel calendar-panel">
          <SectionTitle
            title="Đều đặn theo cách của bạn"
            note="28 ngày · ngày nghỉ không xóa kết quả đã học"
          />
          <div className="activity-calendar">
            {days.map((day) => (
              <div
                className={`calendar-day ${day.total ? 'studied' : ''} ${day.questions >= data.preferences.dailyGoal ? 'goal-met' : ''}`}
                key={day.key}
                title={`${day.date.toLocaleDateString('vi-VN')}: ${day.questions} câu TOEIC, ${day.grammarExercises} tự kiểm tra ngữ pháp, ${day.vocabulary} ôn từ, ${day.knowledge} ôn kiến thức`}
                aria-label={`${day.date.toLocaleDateString('vi-VN')}: ${day.total} hoạt động`}
              >
                <span>{day.date.getDate()}</span>
                {day.total > 0 && <i />}
              </div>
            ))}
          </div>
          <p className="small muted">
            {days.filter((d) => d.total).length} ngày có hoạt động; đạt mục tiêu ngày được tính bằng
            lượt trả lời câu TOEIC.
          </p>
        </section>
      </div>
      <section className="section-spaced">
        <SectionTitle
          title="Độ chính xác theo Part"
          note="Bao gồm câu bỏ trống trong mẫu số. Kết quả trên bộ luyện, không phải thang điểm TOEIC."
        />
        <div className="table-scroll">
          <table className="analytics-part-table">
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">Đúng / Đã chấm</th>
                <th scope="col">Độ chính xác thô</th>
                <th scope="col">Bỏ trống</th>
              </tr>
            </thead>
            <tbody>
              {([1, 2, 3, 4, 5, 6, 7] as const).map((part) => {
                const rows = attempts.filter(
                    (a) => (a.questionSnapshot?.part ?? knownPart(a.questionId)) === part,
                  ),
                  successes = rows.filter((a) => a.correct).length
                return (
                  <tr key={part}>
                    <th scope="row">
                      {part} · {PART_LABELS[part]}
                    </th>
                    <td>
                      {successes}/{rows.length}
                    </td>
                    <td>
                      <span className="mini-bar">
                        <i
                          style={{ width: `${rows.length ? (successes / rows.length) * 100 : 0}%` }}
                        />
                      </span>
                      {rows.length
                        ? `${Math.round((successes / rows.length) * 100)}%`
                        : 'Chưa có dữ liệu'}
                    </td>
                    <td>{rows.filter((a) => a.selected === null).length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section-spaced">
        <SectionTitle
          title="Bản đồ kỹ năng"
          note="Gồm câu TOEIC và tự kiểm tra ngữ pháp có lựa chọn; bỏ trống ghi riêng. Nhóm cha đếm mỗi lượt một lần. Thống kê Part chỉ dùng câu TOEIC."
        />
        <div className="taxonomy-table">
          {skills
            .filter((node) =>
              skillAncestors(node.id)
                .slice(1)
                .every((parent) => expanded.has(parent)),
            )
            .map((stat) => {
              const depth = skillAncestors(stat.id).length - 1,
                change = changes.find((c) => c.id === stat.id)
              return (
                <div className={`taxonomy-row ${stat.leaf ? 'leaf' : 'branch'}`} key={stat.id}>
                  <div style={{ paddingLeft: depth * 16 }}>
                    {stat.leaf ? (
                      <span>{stat.label}</span>
                    ) : (
                      <button
                        aria-expanded={expanded.has(stat.id)}
                        onClick={() =>
                          setExpanded((current) => {
                            const next = new Set(current)
                            if (next.has(stat.id)) next.delete(stat.id)
                            else next.add(stat.id)
                            return next
                          })
                        }
                      >
                        {expanded.has(stat.id) ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                        {stat.label}
                      </button>
                    )}
                  </div>
                  <span className="taxonomy-accuracy">
                    <span className="mini-bar">
                      <i style={{ width: `${(stat.accuracy ?? 0) * 100}%` }} />
                    </span>
                    {stat.accuracy === null ? '—' : `${Math.round(stat.accuracy * 100)}%`}
                  </span>
                  <span className="small muted">
                    {stat.answered} lượt · {stat.distinctQuestions} câu
                    {stat.referenceAnswered ? ` · ${stat.referenceAnswered} lượt ngữ pháp` : ''}
                    {stat.omitted ? ` · ${stat.omitted} trống` : ''}
                  </span>
                  <span className="small muted">
                    {!stat.answered
                      ? 'Chưa có dữ liệu'
                      : stat.answered < 3 || stat.distinctQuestions < 2
                        ? 'Mẫu còn ít'
                        : change?.delta != null
                          ? `${change.delta > 0 ? '+' : ''}${Math.round(change.delta)} điểm % / tuần`
                          : 'Chưa đủ mẫu để so tuần'}
                  </span>
                </div>
              )
            })}
        </div>
        <p className="small muted analytics-note">
          So sánh tuần cần ít nhất 5 lượt và 3 câu khác nhau ở cả hai tuần. Kết quả vẫn có thể khác
          do bộ câu và độ khó, không chứng minh thay đổi năng lực.
        </p>
      </section>
      <div className="progress-columns section-spaced">
        <section className="panel queue-analytics">
          <SectionTitle
            title="Lịch ôn phía trước"
            note="Số thẻ trong kho hiện tại, không bị giới hạn bởi bộ lọc ngày."
          />
          {queue.rows.map((row) => (
            <div className="queue-bar-row" key={row.label}>
              <span>{row.label}</span>
              <span className="mini-bar">
                <i style={{ width: `${(row.count / maxQueue) * 100}%` }} />
              </span>
              <strong>{row.count}</strong>
            </div>
          ))}
          {queue.invalid > 0 && (
            <p className="small brass-text">
              {queue.invalid} thẻ có lịch cần kiểm tra; dữ liệu vẫn được giữ nguyên.
            </p>
          )}
          <button className="text-link" onClick={() => navigate('review')}>
            Mở sổ ôn tập
            <ArrowRight size={15} />
          </button>
        </section>
        <section className="panel trend-analytics">
          <SectionTitle
            title="Kết quả qua 4 tuần"
            note="Độ chính xác thô quan sát được · tuần không có dữ liệu để trống."
          />
          {trend.some((p) => p.total) ? (
            <svg
              className="accuracy-trend"
              viewBox="0 0 500 180"
              role="img"
              aria-label={trend
                .map(
                  (p) => `${p.label}: ${p.total ? `${p.correct}/${p.total}` : 'chưa có dữ liệu'}`,
                )
                .join('; ')}
            >
              {[0, 0.5, 1].map((tick) => (
                <g key={tick}>
                  <line x1="40" x2="475" y1={140 - tick * 110} y2={140 - tick * 110} />
                  <text x="3" y={145 - tick * 110}>
                    {tick * 100}%
                  </text>
                </g>
              ))}
              {trend.map((point, i) => (
                <g key={point.label}>
                  {i > 0 && point.accuracy !== null && trend[i - 1].accuracy !== null && (
                    <line
                      className="trend-connection"
                      x1={55 + (i - 1) * 132}
                      y1={140 - trend[i - 1].accuracy! * 110}
                      x2={55 + i * 132}
                      y2={140 - point.accuracy * 110}
                    />
                  )}
                  {point.accuracy !== null && (
                    <>
                      <circle cx={55 + i * 132} cy={140 - point.accuracy * 110} r="5" />
                      <text
                        className="trend-label"
                        x={55 + i * 132}
                        y={125 - point.accuracy * 110}
                        textAnchor="middle"
                      >
                        {Math.round(point.accuracy * 100)}% · {point.total} lượt
                      </text>
                    </>
                  )}
                  <text x={55 + i * 132} y="170" textAnchor="middle">
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          ) : (
            <p className="small muted">Chưa có lượt được chấm để vẽ xu hướng.</p>
          )}
        </section>
      </div>
      <section className="section-spaced">
        <SectionTitle
          title="Những khái niệm thường cần xem lại"
          note="Đếm lượt sai có lựa chọn trong khoảng đang xem; không coi câu bỏ trống là hổng kiến thức."
        />
        {missed.length ? (
          <div className="frequent-concepts">
            {missed.map((stat) => {
              const lesson = grammar.find((g) => g.skills.includes(stat.id as Skill))
              return (
                <div className="panel" key={stat.id}>
                  <Tag>
                    {stat.missed} lượt sai / {stat.answered} lượt
                  </Tag>
                  <h3>{stat.label}</h3>
                  <p className="small muted">
                    {stat.distinctQuestions} câu khác nhau đã có lựa chọn.
                  </p>
                  <button
                    className="text-link"
                    onClick={() =>
                      lesson ? navigateReference('grammar', lesson.id) : navigate('review')
                    }
                  >
                    {lesson ? 'Đối chiếu quy tắc' : 'Xem lượt cần củng cố'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState icon={BarChart3} title="Chưa có khái niệm nào cần xếp theo lượt sai.">
            Sau khi luyện, dữ liệu thực tế sẽ xuất hiện ở đây.
          </EmptyState>
        )}
      </section>
      <div className="progress-insights">
        <div>
          <Tag tone="sage">TỰ QUAN SÁT</Tag>
          <h3>Độ tự tin có đi cùng kết quả?</h3>
          <p>
            {explicit.length} lượt có tự đánh giá rõ ràng: {highErrors} lượt rất chắc nhưng sai;{' '}
            {lowCorrect} lượt đúng nhưng còn phân vân. Đây là tín hiệu để tự giải thích và thử lại,
            chưa đủ để kết luận đoán đúng hay quá tự tin.
          </p>
          <p className="small muted">
            {answered.length - explicit.length} lượt không có tự tin được cung cấp hoặc dữ liệu cũ
            chưa rõ; không được tự gán mức tự tin.
          </p>
        </div>
        <div>
          <Tag>TRUY HỒI & ĐỐI CHIẾU</Tag>
          <h3>Tự nhớ và trả lời là hai nguồn bằng chứng.</h3>
          <p>
            Đánh giá thẻ từ/kiến thức là tự báo cáo. Độ chính xác câu hỏi được chấm từ lựa chọn. Hai
            nguồn được giữ riêng, không đổi thành xác suất nhớ hoặc điểm TOEIC dự đoán.
          </p>
        </div>
      </div>
      <section className="section-spaced">
        <SectionTitle
          title="Những phiên đã hoàn thành"
          note="Lịch sử đã lưu, không giới hạn bởi bộ lọc biểu đồ."
        />
        {completedSessions.slice(0, sessionLimit).map((session) => (
          <button
            className="reference-question-link"
            key={session.id}
            onClick={() => navigate('session', session.id)}
          >
            <Tag>{session.mode === 'exam' ? 'Tự đánh giá' : 'Luyện tập'}</Tag>
            <span>
              {new Date(session.completedAt ?? session.startedAt).toLocaleString('vi-VN')} ·{' '}
              {data.attempts.filter((a) => a.sessionId === session.id && a.correct).length}/
              {session.questionIds.length} đúng
            </span>
            <ArrowRight size={15} />
          </button>
        ))}
        {completedSessions.length > sessionLimit && (
          <button className="button secondary" onClick={() => setSessionLimit((n) => n + 8)}>
            Xem thêm phiên trước
          </button>
        )}
        {!completedSessions.length && (
          <p className="small muted">Chưa có phiên câu hỏi hoàn thành.</p>
        )}
      </section>
      {data.sessions.some((s) => s.status === 'interrupted') && (
        <section className="section-spaced">
          <SectionTitle
            title="Phiên đã đóng vì thiếu tư liệu"
            note="Giữ dữ liệu đã ghi; không tính là phiên hoàn thành."
          />
          {data.sessions
            .filter((s) => s.status === 'interrupted')
            .sort((a, b) => (b.interruptedAt ?? 0) - (a.interruptedAt ?? 0))
            .slice(0, sessionLimit)
            .map((s) => (
              <button
                className="reference-question-link"
                key={s.id}
                onClick={() => navigate('session', s.id)}
              >
                <Tag>Đã đóng</Tag>
                <span>
                  {new Date(s.interruptedAt ?? s.startedAt).toLocaleString('vi-VN')} · Lịch sử được
                  giữ
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
        </section>
      )}
      <section className="section-spaced">
        <SectionTitle title="Kế hoạch được giữ trong sổ học" />
        {savedPlans.slice(0, planLimit).map((plan) => (
          <button
            className="reference-question-link"
            key={plan.id}
            onClick={() => navigate('plan', plan.id)}
          >
            <Tag>
              {plan.status === 'completed'
                ? 'Đã hoàn thành'
                : plan.status === 'archived'
                  ? 'Đã khép lượt'
                  : 'Đang học'}
            </Tag>
            <span>
              {plan.minutes} phút · {new Date(plan.createdAt).toLocaleString('vi-VN')} ·{' '}
              {plan.questionIds.length} câu / {plan.cardIds.length} thẻ
            </span>
            <ArrowRight size={15} />
          </button>
        ))}
        {savedPlans.length > planLimit && (
          <button className="button secondary" onClick={() => setPlanLimit((n) => n + 6)}>
            Xem thêm kế hoạch
          </button>
        )}
        {!savedPlans.length && (
          <p className="small muted">Chưa có kế hoạch được bắt đầu từ Hôm nay.</p>
        )}
      </section>
    </>
  )
}
