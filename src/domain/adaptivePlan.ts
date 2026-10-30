import type { Question, Stimulus, ToeicPart } from '../content/schema'
import type {
  Attempt,
  DailyPlan,
  Preferences,
  ReviewCard,
  SkillEvidence,
  StudyMinutes,
  StudySession,
} from './models'
import { aggregateSkillEvidence } from './evidence'
import { makeUnits, questionAvailable } from './assessment'
import { localDayKey } from './learning'
import { schedulableCard } from './scheduler'
import { SKILL_LABELS } from './skillTaxonomy'
import { learningRoadmap } from './roadmap'

export interface PlanInput {
  questions: Question[]
  stimuli: Stimulus[]
  attempts: Attempt[]
  cards: ReviewCard[]
  skillEvidence: SkillEvidence[]
  sessions: StudySession[]
  preferences: Preferences
  budgetSeconds?: number
  priorityParts?: ToeicPart[]
  reviewParts?: ToeicPart[]
}
export type PlanRecommendation = Omit<DailyPlan, 'id' | 'status'>
const DEFAULT_SECONDS: Record<ToeicPart, number> = {
  1: 60,
  2: 50,
  3: 70,
  4: 70,
  5: 65,
  6: 90,
  7: 100,
}
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/** Heuristic policy v1; deterministic with explicit content, evidence and clock. No claimed AI/ability score. */
export function recommendDailyPlan(
  input: PlanInput,
  minutes: StudyMinutes,
  now: number,
): PlanRecommendation {
  const { attempts, cards, sessions, preferences, skillEvidence } = input
  const roadmap = learningRoadmap(preferences, skillEvidence, now)
  const usable = input.questions.filter((q) => questionAvailable(q, input.stimuli))
  const byId = new Map(usable.map((q) => [q.id, q]))
  const answered = attempts.filter((a) => a.selected !== null && a.occurredAt <= now)
  const observedParts = new Set(
    answered.map((a) => a.questionSnapshot?.part ?? byId.get(a.questionId)?.part),
  )
  const diagnosticParts = new Set<ToeicPart>(
    input.priorityParts ??
      (roadmap && (roadmap.profile.baselineScore === null || preferences.targetScore >= 900)
        ? ([1, 2, 3, 4, 5, 6, 7] as const).filter((part) => !observedParts.has(part))
        : []),
  )
  const today = new Set(
    answered.filter((a) => localDayKey(a.occurredAt) === localDayKey(now)).map((a) => a.questionId),
  )
  const todayCount = answered.filter((a) => localDayKey(a.occurredAt) === localDayKey(now)).length
  const recent = aggregateSkillEvidence(skillEvidence, now - 14 * 86_400_000, now + 1).filter(
    (s) => s.leaf,
  )
  const misses = new Map(recent.map((s) => [s.id, s]))
  const lastSession = [...sessions]
    .filter((s) => s.status === 'completed' && (s.completedAt ?? 0) <= now)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0]
  const previous = answered.filter((a) => a.sessionId === lastSession?.id)
  const recovering =
    previous.length >= 3 && previous.filter((a) => a.correct).length / previous.length < 0.6
  const firstAnswers = new Map<string, Attempt>()
  for (const answer of attempts
    .filter((attempt) => attempt.occurredAt <= now)
    .sort((a, b) => a.occurredAt - b.occurredAt || a.id.localeCompare(b.id)))
    if (byId.has(answer.questionId) && !firstAnswers.has(answer.questionId))
      firstAnswers.set(answer.questionId, answer)
  const recentAnswers = [...firstAnswers.values()]
    .sort((a, b) => b.occurredAt - a.occurredAt || a.id.localeCompare(b.id))
    .slice(0, 20)
  const advancedReady =
    !recovering &&
    recentAnswers.length >= 12 &&
    recentAnswers.filter((a) => a.correct).length / recentAnswers.length >= 0.85
  const dueCards = cards
    .filter((c) => schedulableCard(c) && c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id))
  const questionDue = new Set(
    dueCards.filter((c) => c.kind === 'question' && byId.has(c.contentId)).map((c) => c.contentId),
  )
  const seen = new Set(answered.map((a) => a.questionId))
  const lowConfidenceCorrect = new Set(
    answered
      .filter(
        (a) =>
          a.correct &&
          a.confidenceSource === 'explicit' &&
          a.confidence === 1 &&
          a.occurredAt >= now - 14 * 86_400_000,
      )
      .map((a) => a.questionId),
  )
  const durations = new Map<ToeicPart, number>()
  for (const part of [1, 2, 3, 4, 5, 6, 7] as const) {
    const samples = answered
      .filter(
        (a) =>
          (a.questionSnapshot?.part ?? byId.get(a.questionId)?.part) === part &&
          a.timeSpentMs != null &&
          a.timeSpentMs >= 5000 &&
          a.timeSpentMs <= 900_000,
      )
      .map((a) => a.timeSpentMs! / 1000)
    if (samples.length >= 3)
      durations.set(
        part,
        Math.max(
          DEFAULT_SECONDS[part] * 0.65,
          Math.min(DEFAULT_SECONDS[part] * 2, median(samples)),
        ),
      )
  }
  const budget = input.budgetSeconds ?? minutes * 60
  if (!Number.isFinite(budget) || budget < 0 || budget > 240 * 60)
    throw new Error('Practice budget must be between zero and 240 minutes.')
  const cardIds: string[] = [],
    questionIds: string[] = [],
    reasons: DailyPlan['reasons'] = []
  let seconds = 0
  for (const card of dueCards.filter((c) => c.kind !== 'question')) {
    const estimate = card.kind === 'knowledge' ? 90 : 35
    if (seconds + estimate > budget * 0.4 || cardIds.length >= 16) continue
    cardIds.push(card.id)
    seconds += estimate
    reasons.push({ contentId: card.id, text: 'Đã đến hạn theo lịch ôn đã lưu.' })
  }
  const goalRemaining = Math.max(0, preferences.dailyGoal - todayCount)
  const cap = Math.max(3, goalRemaining + (minutes === 40 ? 9 : minutes === 20 ? 3 : 0))
  const units = makeUnits(usable).filter((u) =>
    u.questionIds.some((id) => !today.has(id) || questionDue.has(id)),
  )
  const difficultyValue = (q: Question) =>
    q.difficulty === 'foundation'
      ? recovering || !advancedReady
        ? 12
        : 2
      : q.difficulty === 'intermediate'
        ? 6
        : advancedReady &&
            (!roadmap || preferences.targetScore >= 800 || roadmap.current.id !== 'foundation')
          ? 6
          : -25
  const score = (q: Question) =>
    (questionDue.has(q.id) ? 100 : 0) +
    (!seen.has(q.id) ? 20 : 0) +
    (lowConfidenceCorrect.has(q.id) && !today.has(q.id) ? 10 : 0) +
    difficultyValue(q) +
    (diagnosticParts.has(q.part) ? 48 : 0) +
    (input.reviewParts?.includes(q.part) ? 24 : 0) +
    (roadmap && !roadmap.ended && roadmap.current.parts.includes(q.part) ? 12 : 0) +
    (roadmap && !roadmap.ended && q.part === roadmap.dailyPart ? 6 : 0) +
    (roadmap && !roadmap.ended
      ? q.skills.filter((s) => roadmap.prioritySkills.includes(s)).length * 5
      : 0) +
    (roadmap?.profile.focus === 'listening' && q.part <= 4
      ? 8
      : roadmap?.profile.focus === 'reading' && q.part >= 5
        ? 8
        : 0) +
    q.skills.reduce((n, skill) => {
      const stat = misses.get(skill)
      return n + (stat?.missed ? Math.min(12, stat.missed * 3) : 0)
    }, 0)
  let lastPart: number | undefined
  while (units.length && questionIds.length < cap) {
    const ranked = units
      .map((unit, index) => ({
        unit,
        index,
        score:
          Math.max(...unit.questionIds.map((id) => score(byId.get(id)!))) +
          (lastPart !== undefined && unit.part !== lastPart ? 12 : 0),
        seconds: Math.ceil(
          unit.questionIds.length * (durations.get(unit.part) ?? DEFAULT_SECONDS[unit.part]),
        ),
      }))
      .filter((r) => seconds + r.seconds <= budget)
      .sort((a, b) => b.score - a.score || a.unit.id.localeCompare(b.unit.id))
    const next = ranked[0]
    if (!next) break
    units.splice(next.index, 1)
    questionIds.push(...next.unit.questionIds)
    seconds += next.seconds
    lastPart = next.unit.part
    for (const id of next.unit.questionIds) {
      const q = byId.get(id)!
      const missed = q.skills.find((skill) => (misses.get(skill)?.missed ?? 0) > 0)
      const reason = questionDue.has(id)
        ? 'Câu đã lưu đến hạn ôn.'
        : missed
          ? `Có lượt sai gần đây ở ${SKILL_LABELS[missed]}; cần thêm bằng chứng qua luyện tập.`
          : input.reviewParts?.includes(q.part)
            ? `Ôn Part ${q.part} theo phiếu đối chiếu từ nguồn gốc; khóa đáp án do bạn nhập, không phải điểm TOEIC.`
            : !seen.has(id)
              ? 'Nội dung chưa có lượt trả lời trong sổ học.'
              : lowConfidenceCorrect.has(id)
                ? 'Đã trả lời đúng nhưng tự tin thấp; thử nhớ lại sau một khoảng nghỉ.'
                : 'Luyện truy hồi và xen kẽ kỹ năng đã gặp.'
      reasons.push({ contentId: id, text: reason })
    }
  }
  const summary = [
    `${dueCards.length} mục đến hạn; ưu tiên trong phần thời gian đã chọn.`,
    todayCount < preferences.dailyGoal
      ? `Còn ${goalRemaining} lượt trả lời để đạt mục tiêu ${preferences.dailyGoal} câu hôm nay.`
      : 'Đã đạt mục tiêu câu hỏi hôm nay; đây là lượt củng cố tự chọn.',
    recovering
      ? 'Phiên gần nhất có ít nhất 3 câu trả lời, độ chính xác dưới 60%; ưu tiên câu nền tảng.'
      : advancedReady
        ? 'Kết quả lần làm đầu trên ít nhất 12 câu khác nhau trong bộ phù hợp đạt ngưỡng nội bộ; cho phép thêm bài vận dụng.'
        : 'Chưa đủ bằng chứng để tăng độ khó; bắt đầu từ nền tảng và vận dụng vừa sức.',
  ]
  const sourceParts =
    input.reviewParts?.filter((part) => questionIds.some((id) => byId.get(id)?.part === part)) ?? []
  if (sourceParts.length)
    summary.push(
      `Ưu tiên ôn Part ${sourceParts.join(', ')} từ phiếu đối chiếu: ít nhất 4 câu khác nhau, lần đầu tự làm dưới 80%. Đây là quy tắc chọn bài nội bộ, không phải hiệu chuẩn điểm.`,
    )
  if (roadmap && !roadmap.ended) {
    summary.push(
      `Lộ trình mục tiêu ${preferences.targetScore}: ${roadmap.current.title.toLocaleLowerCase('vi')}. Bài được ưu tiên theo giai đoạn và lượt sai thực tế.`,
    )
    if (diagnosticParts.size)
      summary.push(
        `Còn ${diagnosticParts.size} Part chưa có lượt trả lời; ưu tiên lấy mẫu trước khi kết luận điểm yếu.`,
      )
    if (!roadmap.isStudyDay)
      summary.push(
        'Hôm nay ngoài lịch học bạn chọn; phiên này là tự chọn, không có bài học bù bắt buộc.',
      )
  }
  if (seconds < budget * 0.6)
    summary.push(
      `Đã chọn khoảng ${Math.ceil(seconds / 60)} phút nội dung trong khung ${Math.ceil(budget / 60)} phút. Có thể dành phần còn lại để phân tích lỗi; không thêm câu lặp chỉ để đủ phút.`,
    )
  return {
    version: 1,
    createdAt: now,
    minutes,
    goal: preferences.dailyGoal,
    estimatedSeconds: seconds,
    cardIds,
    questionIds,
    reasons,
    summary,
    timingBasis: durations.size ? 'observed-and-content' : 'content-estimate',
  }
}
