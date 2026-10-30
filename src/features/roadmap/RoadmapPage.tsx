import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, Check, Compass, Headphones, BookOpen } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, useAction, useNow } from '../../application/hooks'
import { saveLearningProfile, startRoadmapPractice } from '../../application/roadmapRepository'
import { startAdaptivePlan } from '../../application/plansRepository'
import { addDays, learningRoadmap, type LearningProfile } from '../../domain/roadmap'
import { localDayKey } from '../../domain/learning'
import { SKILL_LABELS } from '../../domain/skillTaxonomy'
import { grammarById } from '../../content/grammar'
import { PART_LABELS } from '../../content/questions'
import { learningQuestionPool } from '../../application/learningQuestionPool'
import { PageHeading, InlineError, Tag, SectionTitle } from '../../components/ui'
import { CurriculumPanel } from './CurriculumPanel'
import { SourceEvidencePanel } from '../practice/SourceEvidencePanel'
import { RoadmapCheckpoints } from './RoadmapCheckpoints'

const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const dateLabel = (day: string) =>
  new Date(day + 'T12:00:00').toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })

export function RoadmapPage() {
  const data = useStudy(),
    now = useNow(),
    action = useAction()
  const today = localDayKey(now)
  const practiceQuestions = useMemo(() => learningQuestionPool(data.sessions), [data.sessions])
  const [editing, setEditing] = useState(!data.preferences.learningProfile)
  const [profile, setProfile] = useState<LearningProfile>(
    data.preferences.learningProfile ?? {
      version: 1,
      baselineScore: null,
      startedOn: today,
      deadline: addDays(today, 59),
      minutesPerDay: 60,
      studyDays: [1, 2, 3, 4, 5, 6],
      focus: 'balanced',
    },
  )
  const [target, setTarget] = useState(data.preferences.targetScore)
  const [saved, setSaved] = useState(false)
  const roadmap = learningRoadmap(data.preferences, data.skillEvidence, now)
  const active = data.sessions.find((s) => s.status === 'active')
  const activePlan = data.dailyPlans.find((p) => p.status === 'active')
  const dailyAttempts = data.attempts.filter(
    (a) => a.selected !== null && localDayKey(a.occurredAt) === today,
  )
  const dailyReviews = data.reviewEvents.filter(
    (r) => localDayKey(r.occurredAt) === today && r.source !== 'practice-error',
  )
  const activeDates = new Set([
    ...data.attempts.filter((a) => a.selected !== null).map((a) => localDayKey(a.occurredAt)),
    ...data.reviewEvents
      .filter((r) => r.source !== 'practice-error')
      .map((r) => localDayKey(r.occurredAt)),
  ])
  async function begin() {
    const source = window.location.hash
    const dest = await action.run(() => startAdaptivePlan(data.preferences.studyMinutes))
    if (dest && window.location.hash === source) navigate(dest.page, dest.id)
  }
  async function focused(section: 'listening' | 'reading') {
    const source = window.location.hash
    const session = await action.run(() => startRoadmapPractice(section))
    if (session && window.location.hash === source) navigate('session', session.id)
  }
  return (
    <>
      <PageHeading
        eyebrow="TỪ ĐIỂM XUẤT PHÁT CỦA BẠN"
        title="Lộ trình của bạn"
        description="Từ điểm đầu vào đến mục tiêu, bằng những việc học cụ thể."
        action={
          roadmap && !editing ? (
            <button
              className="button secondary"
              onClick={() => {
                setProfile(data.preferences.learningProfile!)
                setTarget(data.preferences.targetScore)
                setEditing(true)
                setSaved(false)
              }}
            >
              Điều chỉnh lộ trình
            </button>
          ) : undefined
        }
      />
      {editing && (
        <section className="panel roadmap-setup" aria-label="Thiết kế lộ trình cá nhân">
          <div>
            <span className="eyebrow">01 / THIẾT KẾ NHỊP HỌC</span>
            <h2>Bạn muốn đi từ đâu, đến đâu?</h2>
            <p className="muted">
              Nhập trình độ, mục tiêu và nhịp học. Chưa biết điểm đầu vào thì để trống.
            </p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void action.run(async () => {
                await saveLearningProfile(profile, target)
                setEditing(false)
                setSaved(true)
              })
            }}
          >
            <div className="roadmap-fields">
              <label className="form-label">
                Điểm TOEIC hiện tại (nếu biết)
                <input
                  type="number"
                  min={10}
                  max={990}
                  step={5}
                  placeholder="Chưa biết điểm"
                  value={profile.baselineScore ?? ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      baselineScore: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="form-label">
                Điểm mục tiêu
                <input
                  type="number"
                  min={10}
                  max={990}
                  step={5}
                  required
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                />
              </label>
              <label className="form-label">
                Ngày bắt đầu
                <input
                  type="date"
                  required
                  max={today}
                  value={profile.startedOn}
                  onChange={(e) => setProfile({ ...profile, startedOn: e.target.value })}
                />
              </label>
              <label className="form-label">
                Ngày mục tiêu
                <input
                  type="date"
                  required
                  min={
                    today > addDays(profile.startedOn, 6) ? today : addDays(profile.startedOn, 6)
                  }
                  max={addDays(profile.startedOn, 365)}
                  value={profile.deadline}
                  onChange={(e) => setProfile({ ...profile, deadline: e.target.value })}
                />
              </label>
              <label className="form-label">
                Thời gian mỗi ngày (phút)
                <input
                  type="number"
                  required
                  min={10}
                  max={240}
                  step={5}
                  value={profile.minutesPerDay}
                  onChange={(e) =>
                    setProfile({ ...profile, minutesPerDay: Number(e.target.value) })
                  }
                />
              </label>
              <label className="form-label">
                Ưu tiên thêm
                <select
                  value={profile.focus}
                  onChange={(e) =>
                    setProfile({ ...profile, focus: e.target.value as LearningProfile['focus'] })
                  }
                >
                  <option value="balanced">Cân bằng Nghe & Đọc</option>
                  <option value="listening">Nghe nhiều hơn</option>
                  <option value="reading">Đọc nhiều hơn</option>
                </select>
              </label>
            </div>
            <fieldset className="roadmap-days">
              <legend>Ngày học trong tuần</legend>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <label key={d}>
                  <input
                    type="checkbox"
                    checked={profile.studyDays.includes(d)}
                    onChange={() =>
                      setProfile({
                        ...profile,
                        studyDays: profile.studyDays.includes(d)
                          ? profile.studyDays.filter((day) => day !== d)
                          : [...profile.studyDays, d],
                      })
                    }
                  />
                  <span>{DAY_NAMES[d]}</span>
                </label>
              ))}
            </fieldset>
            <div className="roadmap-presets">
              <span className="small muted">Điền nhanh mục tiêu:</span>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setTarget(700)
                  setProfile({ ...profile, startedOn: today, deadline: addDays(today, 59) })
                }}
              >
                700 · 60 ngày
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setTarget(990)
                  setProfile({ ...profile, startedOn: today, deadline: addDays(today, 29) })
                }}
              >
                990 · 30 ngày
              </button>
            </div>
            <p className="small muted">
              Mốc thời gian là lựa chọn của bạn, không phải cam kết đạt điểm. Ngày nghỉ không tạo
              bài học bù. Thay đổi chỉ áp dụng cho gợi ý mới, phiên đang học được giữ nguyên.
            </p>
            <div className="form-actions">
              {roadmap && (
                <button
                  type="button"
                  className="button secondary"
                  disabled={action.busy}
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </button>
              )}
              <button
                className="button primary"
                disabled={action.busy || !profile.studyDays.length}
              >
                Lưu & tạo lộ trình
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </section>
      )}
      <InlineError message={action.error} />
      {saved && (
        <p className="small success-text" role="status">
          Đã lưu lộ trình trên thiết bị này và đưa vào gợi ý học mới.
        </p>
      )}
      {roadmap && !editing && (
        <>
          <section className="roadmap-focus panel" aria-label="Mục tiêu và bước học tiếp theo">
            <div className="roadmap-focus-goal">
              <span className="eyebrow">MỤC TIÊU CỦA BẠN</span>
              <h2>
                {data.preferences.targetScore}
                <span>TOEIC</span>
              </h2>
              <p className="small muted">
                {roadmap.profile.baselineScore === null
                  ? 'Chưa có điểm đầu vào'
                  : `Điểm đầu vào tự khai: ${roadmap.profile.baselineScore}`}
              </p>
            </div>
            <div className="roadmap-focus-next">
              <span className="eyebrow">
                {roadmap.isStudyDay ? 'NHỊP HỌC HÔM NAY' : 'NGÀY NGHỈ · HỌC NẾU BẠN MUỐN'}
              </span>
              <h3>{roadmap.current.title}</h3>
              <p className="small muted">
                {roadmap.profile.minutesPerDay} phút/ngày · {roadmap.profile.studyDays.length}{' '}
                ngày/tuần · đến {dateLabel(roadmap.profile.deadline)}
              </p>
              <div className="roadmap-focus-actions">
                <button
                  className="button primary"
                  disabled={action.busy}
                  onClick={() => void begin()}
                >
                  {active
                    ? 'Tiếp tục phiên'
                    : activePlan
                      ? 'Tiếp tục kế hoạch'
                      : `Học một lượt ${data.preferences.studyMinutes} phút`}
                  <ArrowRight size={16} />
                </button>
                <button className="text-link" onClick={() => navigate('tests')}>
                  Thư viện đề
                  <ArrowRight size={15} />
                </button>
              </div>
              <p className="small muted">
                Một ngày có thể chia thành nhiều lượt. Giai đoạn phản ánh lịch; chuyên đề ưu tiên
                được điều chỉnh theo kết quả đã lưu.
              </p>
            </div>
            <div className="roadmap-focus-time">
              <label htmlFor="roadmap-calendar">
                Ngày lịch {roadmap.dayNumber}/{roadmap.totalDays}
              </label>
              <progress
                id="roadmap-calendar"
                value={roadmap.dayNumber}
                max={roadmap.totalDays}
                aria-label="Thời gian lịch đã qua, không phải mức thành thạo"
              />
              <span>
                {roadmap.studyDates.filter((d) => activeDates.has(d)).length} ngày trong lịch có
                hoạt động
              </span>
            </div>
          </section>
          {roadmap.ended && (
            <p className="notice">
              Đã qua ngày mục tiêu. Lịch sử vẫn được giữ; chọn “Điều chỉnh lộ trình” để đặt mốc tiếp
              theo.
            </p>
          )}
          {!editing && data.preferences.targetScore >= 900 && (
            <CurriculumPanel currentPhase={roadmap.current.id} />
          )}
          <RoadmapCheckpoints roadmap={roadmap} now={now} />
          <details className="roadmap-calendar-details">
            <summary>Chi tiết lịch, phân bổ thời gian & phương pháp học</summary>
            <section className="roadmap-overview panel">
              <div>
                <span className="eyebrow">ĐÍCH ĐẾN DO BẠN CHỌN</span>
                <h2>
                  {data.preferences.targetScore}
                  <small> TOEIC</small>
                </h2>
                <p>
                  {roadmap.profile.baselineScore === null
                    ? 'Chưa có điểm đầu vào'
                    : `Đầu vào tự khai: ${roadmap.profile.baselineScore}`}{' '}
                  · {roadmap.totalDays} ngày lịch
                </p>
              </div>
              <dl>
                <div>
                  <dt>Lịch đã chọn</dt>
                  <dd>
                    {roadmap.studyDates.length} buổi · ~{Math.round(roadmap.plannedHours * 10) / 10}{' '}
                    giờ dự kiến
                  </dd>
                </div>
                <div>
                  <dt>Ngày mục tiêu</dt>
                  <dd>{dateLabel(roadmap.profile.deadline)}</dd>
                </div>
                <div>
                  <dt>Nhịp mỗi ngày</dt>
                  <dd>
                    {roadmap.profile.minutesPerDay} phút · {roadmap.profile.studyDays.length}{' '}
                    ngày/tuần
                  </dd>
                </div>
              </dl>
              <div className="roadmap-calendar-progress">
                <span>
                  Ngày lịch {roadmap.dayNumber}/{roadmap.totalDays}
                </span>
                <span>
                  {roadmap.studyDates.filter((d) => activeDates.has(d)).length} ngày trong lịch có
                  hoạt động
                </span>
              </div>
              <p className="small muted">
                Ngày đã qua thể hiện lịch, không phải tỷ lệ thành thạo. Ứng dụng không quy đổi độ
                chính xác thành điểm TOEIC dự đoán.
              </p>
            </section>
            {roadmap.warnings.length > 0 && (
              <aside className="roadmap-caveats" aria-label="Điều chỉnh kỳ vọng">
                {roadmap.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </aside>
            )}
            <section className="section-spaced">
              <SectionTitle
                title={
                  roadmap.ended
                    ? 'Tiếp tục củng cố'
                    : roadmap.isStudyDay
                      ? 'Lượt học hôm nay'
                      : 'Hôm nay là ngày nghỉ bạn đã chọn'
                }
                note="Có thể chia thời gian thành nhiều phiên; các con số dưới đây là phân bổ dự kiến."
              />
              <p className="small muted roadmap-focus-note">
                Trọng tâm luân phiên: Part {roadmap.dailyPart} · {PART_LABELS[roadmap.dailyPart]}.
                Các kỹ năng ưu tiên ở giai đoạn này:{' '}
                {roadmap.prioritySkills.map((s) => SKILL_LABELS[s]).join(', ')}.
              </p>
              <div className="roadmap-workload">
                <article>
                  <span className="eyebrow">ÔN TRUY HỒI · {roadmap.reviewMinutes} PHÚT</span>
                  <h3>Nhớ lại trước khi xem</h3>
                  <p>
                    {dailyReviews.length} lượt ôn đã ghi hôm nay. Ưu tiên thẻ đến hạn; chưa có thẻ
                    thì lưu từ trong bài.
                  </p>
                  <button className="text-link" onClick={() => navigate('review')}>
                    Mở sổ ôn
                    <ArrowRight size={15} />
                  </button>
                </article>
                <article>
                  <span className="eyebrow">NGHE · {roadmap.listeningMinutes} PHÚT</span>
                  <h3>Nghe có mục đích</h3>
                  <p>
                    Trả lời trước, sau đó đối chiếu transcript và lưu từ trong câu. Giọng đọc mẫu là
                    giọng máy.
                  </p>
                  <button
                    className="text-link"
                    disabled={action.busy}
                    onClick={() => void focused('listening')}
                  >
                    <Headphones size={16} />
                    {active ? 'Tiếp tục phiên đang mở' : 'Mở nhóm câu Nghe'}
                  </button>
                </article>
                <article>
                  <span className="eyebrow">ĐỌC · {roadmap.readingMinutes} PHÚT</span>
                  <h3>Chọn đáp án bằng bằng chứng</h3>
                  <p>
                    {dailyAttempts.length} lượt trả lời hôm nay, tổng cả Nghe và Đọc. Đọc lời giải
                    cho cả lựa chọn sai.
                  </p>
                  <button
                    className="text-link"
                    disabled={action.busy}
                    onClick={() => void focused('reading')}
                  >
                    <BookOpen size={16} />
                    {active ? 'Tiếp tục phiên đang mở' : 'Mở nhóm câu Đọc'}
                  </button>
                </article>
              </div>
              <div className="roadmap-next panel">
                <Compass size={24} />
                <div>
                  <h3>{roadmap.current.title}</h3>
                  <p>{roadmap.current.purpose}</p>
                </div>
                <button
                  className="button primary"
                  disabled={action.busy}
                  onClick={() => void begin()}
                >
                  {active
                    ? 'Tiếp tục phiên'
                    : activePlan
                      ? 'Tiếp tục kế hoạch'
                      : `Học một lượt ${data.preferences.studyMinutes} phút`}
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
            {roadmap.weakSkills.length > 0 && (
              <section className="section-spaced">
                <SectionTitle
                  title="Điều chỉnh từ kết quả thật"
                  note="Chỉ đưa vào khi đã gặp ít nhất 3 câu khác nhau trong 21 ngày gần đây. Đây chưa phải kết luận năng lực."
                />
                <div className="tag-list">
                  {roadmap.weakSkills.map((s) => (
                    <Tag key={s.id}>
                      {SKILL_LABELS[s.id as keyof typeof SKILL_LABELS]} · {s.missed} lượt sai /{' '}
                      {s.answered} lượt
                    </Tag>
                  ))}
                </div>
              </section>
            )}
            <section className="section-spaced">
              <SectionTitle
                title="Bản đồ học của bạn"
                note="Các giai đoạn phân bổ theo đầu vào và thời hạn; độ khó chỉ tăng khi lượt làm thực tế hỗ trợ."
              />
              <div className="roadmap-phases">
                {roadmap.phases.map((phase, i) => (
                  <details
                    key={phase.id}
                    open={phase.id === roadmap.current.id}
                    className="panel roadmap-phase"
                  >
                    <summary>
                      <span className="roadmap-phase-number">0{i + 1}</span>
                      <span>
                        <strong>{phase.title}</strong>
                        <small>
                          {dateLabel(phase.from)} – {dateLabel(phase.through)}
                        </small>
                      </span>
                      {phase.id === roadmap.current.id && <Tag tone="sage">Hiện tại</Tag>}
                    </summary>
                    <div className="roadmap-phase-body">
                      <p>{phase.purpose}</p>
                      <ul>
                        {phase.methods.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                      <div className="tag-list">
                        {phase.parts.map((p) => (
                          <Tag key={p}>
                            Part {p} · {PART_LABELS[p]}
                          </Tag>
                        ))}
                      </div>
                      <div className="roadmap-reference-links">
                        {phase.grammarIds
                          .filter((id) => grammarById.has(id))
                          .map((id) => (
                            <button
                              key={id}
                              className="text-link"
                              onClick={() => navigate('grammar', id)}
                            >
                              {grammarById.get(id)!.title}
                              <ArrowRight size={13} />
                            </button>
                          ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
            <section className="section-spaced">
              <SectionTitle
                title="7 ngày tới"
                note="Dấu ghi nhận xuất phát từ lượt trả lời hoặc ôn thẻ, không phải dấu hoàn thành tự động."
              />
              <ol className="roadmap-week">
                {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((day) => {
                  const stage = roadmap.phases.find((p) => day >= p.from && day <= p.through)
                  const scheduled = roadmap.studyDates.includes(day)
                  return (
                    <li key={day}>
                      <CalendarDays size={16} />
                      <time dateTime={day}>{dateLabel(day)}</time>
                      <span>
                        {scheduled && stage
                          ? stage.title
                          : stage
                            ? 'Nghỉ / ôn tự chọn'
                            : 'Ngoài thời hạn đã chọn'}
                      </span>
                      {activeDates.has(day) && <Check size={16} aria-label="Có hoạt động đã lưu" />}
                    </li>
                  )
                })}
              </ol>
            </section>
            <p className="small muted section-spaced">
              {practiceQuestions.length} câu đang dùng cho lượt học kỹ năng, gồm bài tập và đề đã
              nộp. Các đề chưa nộp được giữ riêng để tự đánh giá.
            </p>
          </details>
          <details className="curriculum-guide">
            <summary>Tài liệu nguồn & kết quả đối chiếu</summary>
            <SourceEvidencePanel />
          </details>
        </>
      )}
    </>
  )
}
