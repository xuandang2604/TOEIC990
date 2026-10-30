import { LearningMilestones } from '../../components/LearningMilestones'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Leaf,
  Play,
  RotateCcw,
  Target,
} from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate, useNow } from '../../application/hooks'
import {
  adaptiveRecommendation,
  startAdaptivePlan,
  plannedCurriculumFocus,
} from '../../application/plansRepository'
import { vocabulary, vocabularyById } from '../../content/vocabulary'
import { questionById } from '../../content/questions'
import { grammarById } from '../../content/grammar'
import { schedulableCard } from '../../domain/scheduler'
import { localDayKey, SKILL_LABELS, startOfToday } from '../../domain/learning'
import { aggregateSkillEvidence } from '../../domain/evidence'
import { InlineError, ProgressRing, SectionTitle, Tag, TextLink } from '../../components/ui'
import { SaveWordButton } from '../dictionary/Dictionary'
import { isAnsweredAttempt, type StudyMinutes } from '../../domain/models'
import { AdaptivePlanPreview } from './AdaptivePlanPreview'
import { learningRoadmap } from '../../domain/roadmap'

function LearningIllustration() {
  return (
    <div className="learning-illustration" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <span className="orbit-label label-understand">HIỂU</span>
      <span className="orbit-label label-remember">NHỚ</span>
      <span className="orbit-label label-use">DÙNG</span>
      <svg viewBox="0 0 260 230" className="book-illustration">
        <path
          d="M38 72 128 100 220 69 215 158 127 189 40 161Z"
          fill="var(--book-back)"
          stroke="var(--illustration-stroke)"
          strokeWidth="1.3"
        />
        <path
          d="M45 61Q89 61 128 91 172 59 218 58L211 149Q165 153 128 178 87 151 48 151Z"
          fill="var(--book-pages)"
          stroke="var(--illustration-stroke)"
          strokeWidth="1.3"
        />
        <path
          d="M128 91V178M57 75Q93 77 116 94M57 87Q89 89 116 106M57 99Q90 100 116 118M57 111Q90 113 116 130M141 94Q171 76 203 74M141 107Q170 88 202 87M141 120Q171 102 201 101M141 133Q170 116 200 115"
          fill="none"
          stroke="var(--illustration-stroke)"
          strokeWidth="1.3"
        />
        <path d="m168 71 11-6-3 63-11-8-8 14Z" fill="var(--brass)" />
        <path
          d="M38 165 126 194 216 164"
          stroke="var(--illustration-stroke)"
          fill="none"
          strokeWidth="1.3"
        />
      </svg>
      <span className="illustration-caption">THE ART OF LEARNING WELL</span>
    </div>
  )
}

export function TodayPage({ onSettings }: { onSettings: () => void }) {
  const data = useStudy()
  const now = useNow()
  const action = useAction()
  const [minutes, setMinutes] = useState<StudyMinutes>(data.preferences.studyMinutes)
  useEffect(() => setMinutes(data.preferences.studyMinutes), [data.preferences.studyMinutes])
  const today = data.attempts
    .filter(isAnsweredAttempt)
    .filter((a) => a.occurredAt >= startOfToday(now))
  const due = data.cards.filter(
    (c) =>
      schedulableCard(c) &&
      c.dueAt <= now &&
      (c.kind === 'vocabulary'
        ? vocabularyById.has(c.contentId)
        : c.kind === 'knowledge'
          ? grammarById.has(c.contentId)
          : questionById.has(c.contentId)),
  )
  const active = data.sessions.find((s) => s.status === 'active')
  const activePlan = data.dailyPlans.find((p) => p.status === 'active')
  const plan = adaptiveRecommendation(data, minutes, now)
  const emptyPlan = !plan.questionIds.length && !plan.cardIds.length
  const weaknesses = aggregateSkillEvidence(data.skillEvidence, now - 21 * 86_400_000, now + 1)
    .filter((s) => s.leaf && s.distinctQuestions >= 3)
    .map((s) => ({ ...s, skill: s.id as keyof typeof SKILL_LABELS, accuracy: s.accuracy ?? 0 }))
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered)
    .slice(0, 3)
  const date = new Date(now).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const dayWord =
    vocabulary[Math.floor(new Date(localDayKey(now)).getTime() / 86_400_000) % vocabulary.length]
  const targetMet = today.length >= data.preferences.dailyGoal
  const roadmap = learningRoadmap(data.preferences, data.skillEvidence, now)
  const curriculumFocus = plannedCurriculumFocus(data, now)
  const ambitious = Boolean(roadmap && data.preferences.targetScore >= 900)
  async function begin() {
    if (active) {
      navigate('session', active.id)
      return
    }
    if (activePlan) {
      navigate('plan', activePlan.id)
      return
    }
    if (emptyPlan) {
      navigate(roadmap ? 'roadmap' : 'practice')
      return
    }
    await action.run(async () => {
      const sourceHash = window.location.hash
      const destination = await startAdaptivePlan(minutes)
      if (window.location.hash === sourceHash) navigate(destination.page, destination.id)
    })
  }
  return (
    <>
      <div className="today-date">
        <CalendarDays size={15} />
        <span>{date}</span>
        <span className="date-line" />
        <span>MỖI NGÀY, MỘT CHÚT TỐT HƠN</span>
      </div>
      <section className={`today-hero ${ambitious ? 'today-hero-focused' : ''}`}>
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="sage-dot" />
            {ambitious
              ? `HÔM NAY · MỤC TIÊU ${data.preferences.targetScore}`
              : 'KHÔNG GIAN CHO SỰ TẬP TRUNG'}
          </p>
          <h1>
            {ambitious ? (
              <>
                Đường đến {data.preferences.targetScore}.<br />
                <em>Học chắc từng bước.</em>
              </>
            ) : (
              <>
                Từng bước nhỏ.
                <br />
                <em>Một nền tảng vững.</em>
              </>
            )}
          </h1>
          <p>
            {curriculumFocus && !active && !activePlan && !targetMet
              ? `Trọng tâm: ${curriculumFocus.unit.title}. ${curriculumFocus.unit.outcome}`
              : targetMet
                ? 'Bạn đã đạt nhịp học hôm nay. Có thể dừng ở đây, hoặc dành thêm một chút thời gian để củng cố.'
                : 'Không cần học mọi thứ trong một ngày. Chỉ cần hiểu sâu hơn một chút, và quay lại đúng lúc.'}
          </p>
          <div className="hero-actions">
            <button className="button primary" disabled={action.busy} onClick={() => void begin()}>
              {active ? <RotateCcw size={17} /> : <Play size={16} fill="currentColor" />}
              {active
                ? 'Tiếp tục học'
                : activePlan
                  ? 'Tiếp tục kế hoạch'
                  : emptyPlan
                    ? 'Chọn bước học tiếp'
                    : targetMet
                      ? 'Luyện thêm một lượt'
                      : 'Bắt đầu học hôm nay'}
              <ArrowRight size={17} />
            </button>
            <span>
              {active
                ? `Câu ${active.cursor + 1} / ${active.questionIds.length} · Đã lưu tiến độ`
                : activePlan
                  ? `Kế hoạch ${activePlan.minutes} phút đã lưu`
                  : emptyPlan
                    ? 'Chưa có câu mới hoặc thẻ đến hạn phù hợp trong khung này.'
                    : `${plan.questionIds.length} câu · ${plan.cardIds.length} thẻ · Khoảng ${Math.ceil(plan.estimatedSeconds / 60)} phút`}
            </span>
          </div>
          <div className="duration-choices hero-duration" aria-label="Thời lượng cho lượt học mới">
            {([10, 20, 40] as const).map((value) => (
              <button
                key={value}
                aria-pressed={minutes === value}
                onClick={() => setMinutes(value)}
              >
                {value} phút
              </button>
            ))}
          </div>
          <InlineError message={action.error} />
        </div>
        <LearningIllustration />
      </section>
      <section className="roadmap-entry panel" aria-label="Lộ trình học cá nhân">
        <div>
          <span className="eyebrow">LỘ TRÌNH CỦA BẠN</span>
          <h2>
            {roadmap
              ? `${data.preferences.targetScore} TOEIC · ${roadmap.totalDays} ngày`
              : 'Bắt đầu từ trình độ và mục tiêu của bạn.'}
          </h2>
          <p>
            {roadmap
              ? `${roadmap.current.title} · ${roadmap.profile.minutesPerDay} phút/ngày, ${roadmap.profile.studyDays.length} ngày/tuần.`
              : 'Nhập trình độ, mục tiêu, thời hạn và thời gian học để bắt đầu.'}
          </p>
        </div>
        <button className="button secondary" onClick={() => navigate('roadmap')}>
          {roadmap ? 'Xem lộ trình' : 'Thiết kế lộ trình'}
          <ArrowRight size={16} />
        </button>
      </section>
      <div className="today-stats">
        <div>
          <span className="stat-icon">
            <Check size={20} />
          </span>
          <div>
            <strong>
              {today.length}
              <small> / {data.preferences.dailyGoal}</small>
            </strong>
            <span>Câu đã luyện hôm nay</span>
          </div>
          {targetMet && <Tag tone="sage">Đạt mục tiêu</Tag>}
        </div>
        <div>
          <span className="stat-icon">
            <RotateCcw size={20} />
          </span>
          <div>
            <strong>
              {due.length}
              <small> mục</small>
            </strong>
            <span>Đến lúc ôn lại</span>
          </div>
          <button
            className="icon-button"
            aria-label="Mở hàng đợi ôn tập"
            onClick={() => navigate('review')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div>
          <span className="stat-icon">
            <BookOpen size={20} />
          </span>
          <div>
            <strong>
              {data.cards.filter((c) => c.kind === 'vocabulary').length}
              <small> từ</small>
            </strong>
            <span>Trong sổ từ vựng</span>
          </div>
          <button
            className="icon-button"
            aria-label="Mở sổ từ vựng"
            onClick={() => navigate('vocabulary')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <details className="today-secondary">
        <summary>Chi tiết kế hoạch & tiến độ</summary>
        <LearningMilestones />
        <div className="today-grid">
          <div className="today-main">
            <AdaptivePlanPreview
              plan={plan}
              minutes={minutes}
              onMinutes={setMinutes}
              active={Boolean(active || activePlan)}
              showDuration={false}
            />
            <div className="section-spaced">
              <SectionTitle
                title="Điểm tựa cho lần học tới"
                action={<TextLink onClick={() => navigate('progress')}>Xem tiến độ</TextLink>}
              />
              {weaknesses.length ? (
                <div className="weakness-list">
                  {weaknesses.map((stat) => (
                    <div key={stat.skill}>
                      <span>{SKILL_LABELS[stat.skill]}</span>
                      <span className="mini-bar">
                        <i style={{ width: `${stat.accuracy * 100}%` }} />
                      </span>
                      <strong>{Math.round(stat.accuracy * 100)}%</strong>
                      <small>
                        {stat.answered} lượt · {stat.distinctQuestions} câu
                      </small>
                    </div>
                  ))}
                  <p className="small muted">
                    Gồm câu TOEIC và tự kiểm tra ngữ pháp có lựa chọn; mẫu nhỏ chưa phải đánh giá
                    năng lực toàn diện.
                  </p>
                </div>
              ) : (
                <div className="gentle-empty">
                  <Leaf size={26} strokeWidth={1.2} />
                  <div>
                    <h3>Hành trình bắt đầu từ câu đầu tiên.</h3>
                    <p>Sau khi bạn luyện tập, những kỹ năng cần củng cố sẽ xuất hiện ở đây.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <aside className="today-aside">
            <section className="goal-panel">
              <div className="section-title">
                <h2>Nhịp học của bạn</h2>
                <Target size={18} />
              </div>
              <div className="goal-ring">
                <ProgressRing value={today.length} max={data.preferences.dailyGoal} size={132}>
                  <strong>
                    {Math.min(100, Math.round((today.length / data.preferences.dailyGoal) * 100))}%
                  </strong>
                  <span>hôm nay</span>
                </ProgressRing>
              </div>
              <p>{targetMet ? 'Một ngày học có ý nghĩa.' : 'Đều đặn, không cần hoàn hảo.'}</p>
              <div className="goal-details">
                <span>
                  Mục tiêu mỗi ngày<strong>{data.preferences.dailyGoal} câu</strong>
                </span>
                <span>
                  Đích đến của bạn<strong>{data.preferences.targetScore} TOEIC</strong>
                </span>
              </div>
              <button className="text-link" onClick={onSettings}>
                Điều chỉnh mục tiêu
                <ArrowRight size={15} />
              </button>
            </section>
            <section className="word-of-day">
              <p className="eyebrow">MỘT TỪ CHO HÔM NAY</p>
              <button
                className="word-title-button"
                lang="en"
                onClick={() => navigate('vocabulary', dayWord.id)}
              >
                {dayWord.word}
                <ArrowRight size={20} />
              </button>
              <p className="ipa" lang="en">
                {dayWord.ipa} · {dayWord.partOfSpeech}
              </p>
              <p>{dayWord.meaning}</p>
              <p className="daily-word-example" lang="en" data-learning>
                {dayWord.example}
              </p>
              <SaveWordButton entry={dayWord} />
            </section>
          </aside>
        </div>
      </details>
    </>
  )
}
