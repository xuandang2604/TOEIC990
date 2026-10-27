import type { Skill, ToeicPart } from '../content/schema'
import type { Preferences, SkillEvidence } from './models'
import { aggregateSkillEvidence } from './evidence'
import { localDayKey } from './learning'

/** Optional, versioned preference extensions. No learner tables or old schedules are rewritten. */
export interface LearningProfile {
  version: 1
  baselineScore: number | null
  startedOn: string
  deadline: string
  minutesPerDay: number
  studyDays: number[] // JS weekdays, 0 = Sunday; the learner chooses actual days.
  focus: 'balanced' | 'listening' | 'reading'
}
export interface VocabularyReminder {
  version: 1
  enabled: boolean
  time: string // Local device time, HH:mm.
  lastNotifiedOn?: string
  dismissedOn?: string
}
export const validScore = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 10 &&
  value <= 990 &&
  value % 5 === 0

export function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const stamp = Date.parse(value + 'T00:00:00Z')
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value
}
export const dayDistance = (from: string, to: string) =>
  Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86_400_000)
export function addDays(day: string, days: number) {
  if (!validDay(day) || !Number.isSafeInteger(days)) return ''
  return new Date(Date.parse(day + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10)
}
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)
export function validLearningProfile(value: unknown): value is LearningProfile {
  if (!object(value)) return false
  return (
    value.version === 1 &&
    (value.baselineScore === null || validScore(value.baselineScore)) &&
    validDay(value.startedOn) &&
    validDay(value.deadline) &&
    dayDistance(value.startedOn, value.deadline) >= 6 &&
    dayDistance(value.startedOn, value.deadline) <= 365 &&
    typeof value.minutesPerDay === 'number' &&
    Number.isInteger(value.minutesPerDay) &&
    value.minutesPerDay >= 10 &&
    value.minutesPerDay <= 240 &&
    value.minutesPerDay % 5 === 0 &&
    Array.isArray(value.studyDays) &&
    value.studyDays.length > 0 &&
    value.studyDays.length <= 7 &&
    new Set(value.studyDays).size === value.studyDays.length &&
    value.studyDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
    ['balanced', 'listening', 'reading'].includes(String(value.focus))
  )
}
export function validVocabularyReminder(value: unknown): value is VocabularyReminder {
  return (
    object(value) &&
    value.version === 1 &&
    typeof value.enabled === 'boolean' &&
    typeof value.time === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time) &&
    (value.lastNotifiedOn === undefined || validDay(value.lastNotifiedOn)) &&
    (value.dismissedOn === undefined || validDay(value.dismissedOn))
  )
}
export type RoadmapPhaseId = 'foundation' | 'application' | 'integration' | 'consolidation'
export interface RoadmapPhase {
  id: RoadmapPhaseId
  title: string
  purpose: string
  methods: string[]
  parts: ToeicPart[]
  grammarIds: string[]
  from: string
  through: string
}
const PHASES = [
  {
    id: 'foundation',
    title: 'Chẩn đoán & củng cố nền tảng',
    purpose: 'Quan sát cách làm từng Part, tìm lỗi lặp và học cách giải thích đáp án.',
    methods: [
      'Làm một nhóm nhỏ ở mỗi Part để thu thập bằng chứng.',
      'Part 2: xác định dạng câu hỏi trước khi nghe đáp lời.',
      'Part 5: tìm chủ ngữ, động từ và vị trí từ loại.',
    ],
    parts: [1, 2, 5],
    grammarIds: ['word-forms', 'agreement', 'tenses'],
  },
  {
    id: 'application',
    title: 'Vận dụng trong ngữ cảnh',
    purpose: 'Chuyển quy tắc và từ vựng sang hội thoại, thông báo và văn bản hoàn chỉnh.',
    methods: [
      'Nghe một lượt, trả lời rồi nghe lại đúng câu bị bỏ lỡ.',
      'Part 6: đọc cả đoạn trước khi chọn liên kết và câu chèn.',
      'Lưu từ cùng câu nguồn; thử nhớ nghĩa trước khi lật thẻ.',
    ],
    parts: [2, 3, 4, 5, 6],
    grammarIds: ['verb-patterns', 'passive', 'connectors'],
  },
  {
    id: 'integration',
    title: 'Kết nối thông tin & quản lý thời gian',
    purpose: 'Luyện suy luận có bằng chứng và đối chiếu nhiều tư liệu, giữ nguyên nhóm câu.',
    methods: [
      'Part 3/4: nối thông tin nghe với bảng biểu khi có.',
      'Part 7: chỉ ra câu bằng chứng, điều kiện và ngoại lệ.',
      'Ghi lại câu sai vì thiếu kiến thức hay thiếu thời gian bằng tự đánh giá.',
    ],
    parts: [3, 4, 6, 7],
    grammarIds: ['relatives', 'conditionals', 'comparisons'],
  },
  {
    id: 'consolidation',
    title: 'Tổng ôn & tự đánh giá',
    purpose: 'Giảm lỗi lặp, kiểm tra khả năng truy hồi sau khoảng nghỉ và giữ nhịp học vừa sức.',
    methods: [
      'Trộn các Part thay vì chỉ làm dạng quen.',
      'Nếu có 120 phút riêng, có thể dùng mock 200 câu mẫu; xem độ chính xác từng Part.',
      'Đối chiếu sổ sai và làm bài chuyển giao; không học thuộc chữ cái đáp án.',
    ],
    parts: [1, 2, 3, 4, 5, 6, 7],
    grammarIds: ['prepositions', 'modals', 'subjunctive'],
  },
] satisfies Omit<RoadmapPhase, 'from' | 'through'>[]

/** Transparent planning heuristics, not an ETS score model or a promise of a score increase. */
export function learningRoadmap(preferences: Preferences, evidence: SkillEvidence[], now: number) {
  const profile = preferences.learningProfile
  if (!profile || !validLearningProfile(profile)) return null
  const today = localDayKey(now)
  const totalDays = dayDistance(profile.startedOn, profile.deadline) + 1
  const advancedStart = profile.baselineScore !== null && profile.baselineScore >= 850
  const foundationEnd = Math.max(1, Math.floor(totalDays * (advancedStart ? 0.12 : 0.3)))
  const applicationEnd = Math.max(foundationEnd + 1, Math.floor(totalDays * 0.62))
  const integrationEnd = Math.max(applicationEnd + 1, Math.floor(totalDays * 0.86))
  const boundaries = [0, foundationEnd, applicationEnd, integrationEnd, totalDays]
  const phases: RoadmapPhase[] = PHASES.map((phase, i) => ({
    ...phase,
    parts: [...phase.parts],
    grammarIds: [...phase.grammarIds],
    from: addDays(profile.startedOn, boundaries[i]),
    through: addDays(profile.startedOn, boundaries[i + 1] - 1),
  }))
  const current =
    phases.find((phase) => today >= phase.from && today <= phase.through) ??
    (today < profile.startedOn ? phases[0] : phases[3])
  const days: string[] = []
  for (let i = 0; i < totalDays; i++) {
    const day = addDays(profile.startedOn, i)
    if (profile.studyDays.includes(new Date(day + 'T00:00:00Z').getUTCDay())) days.push(day)
  }
  const weakSkills = aggregateSkillEvidence(evidence, now - 21 * 86_400_000, now + 1)
    .filter((s) => s.leaf && s.distinctQuestions >= 3 && s.missed > 0)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0) || b.missed - a.missed)
    .slice(0, 3)
  const warnings: string[] = []
  if (profile.baselineScore === null)
    warnings.push(
      'Chưa có điểm đầu vào. Tuần đầu ưu tiên thu thập kết quả; điểm mục tiêu không được dùng làm điểm hiện tại.',
    )
  if (
    preferences.targetScore >= 900 &&
    (profile.baselineScore === null || profile.baselineScore < 850)
  )
    warnings.push(
      'Mục tiêu cao cần nền tảng vững. Hãy dùng kết quả sau mỗi tuần để điều chỉnh thời hạn; ứng dụng không cam kết đạt điểm trong thời gian đã chọn.',
    )
  if (
    profile.baselineScore !== null &&
    preferences.targetScore - profile.baselineScore >= 200 &&
    totalDays <= 60
  )
    warnings.push(
      'Khoảng tăng mục tiêu lớn trong thời gian ngắn. Ưu tiên tiến bộ theo kỹ năng và cân nhắc kéo dài lộ trình khi cần.',
    )
  if (today > profile.deadline)
    warnings.push(
      'Đã qua ngày mục tiêu. Lịch sử vẫn còn; bạn có thể cập nhật thời hạn để tiếp tục.',
    )
  const reviewMinutes = Math.max(5, Math.round((profile.minutesPerDay * 0.2) / 5) * 5)
  const remaining = profile.minutesPerDay - reviewMinutes
  const listeningShare =
    profile.focus === 'listening' ? 0.65 : profile.focus === 'reading' ? 0.35 : 0.5
  const listeningMinutes =
    remaining < 10
      ? Math.round(remaining * listeningShare)
      : Math.round((remaining * listeningShare) / 5) * 5
  const practicedIndex = days.filter((day) => day <= today).length - 1
  const dailyPart = current.parts[Math.max(0, practicedIndex) % current.parts.length]
  const prioritySkills: Skill[] =
    current.id === 'foundation'
      ? ['word-form', 'agreement', 'tenses', 'listening-detail']
      : preferences.targetScore >= 900
        ? [
            'reading-inference',
            'cross-text',
            'listening-inference',
            'visual-integration',
            'subjunctive',
          ]
        : preferences.targetScore >= 700
          ? ['reading-detail', 'text-cohesion', 'listening-intent', 'connectors', 'verb-patterns']
          : ['word-form', 'agreement', 'prepositions', 'listening-detail', 'photo-detail']
  return {
    profile,
    phases,
    current,
    today,
    totalDays,
    dayNumber: Math.max(0, Math.min(totalDays, dayDistance(profile.startedOn, today) + 1)),
    studyDates: days,
    plannedHours: (days.length * profile.minutesPerDay) / 60,
    isStudyDay: days.includes(today),
    ended: today > profile.deadline,
    weakSkills,
    warnings,
    reviewMinutes,
    listeningMinutes,
    readingMinutes: remaining - listeningMinutes,
    prioritySkills,
    dailyPart,
  }
}
