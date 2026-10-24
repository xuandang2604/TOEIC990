import type { Question, Skill } from '../content/schema'
import type { Attempt, ReviewCard } from './models'

export { SKILL_LABELS } from './skillTaxonomy'
export { newCard, scheduleReview, gradeForAnswer } from './scheduler'
export function localDayKey(time: number): string {
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function startOfToday(now: number): number {
  const date = new Date(now)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}
export function skillStats(attempts: Attempt[], questions: Question[]) {
  const lookup = new Map(questions.map((q) => [q.id, q]))
  const stats = new Map<Skill, { total: number; correct: number }>()
  for (const attempt of attempts) {
    if (attempt.selected === null) continue
    for (const skill of attempt.questionSnapshot?.skills ??
      lookup.get(attempt.questionId)?.skills ??
      []) {
      const current = stats.get(skill) ?? { total: 0, correct: 0 }
      stats.set(skill, {
        total: current.total + 1,
        correct: current.correct + Number(attempt.correct),
      })
    }
  }
  return [...stats]
    .map(([skill, stat]) => ({ skill, ...stat, accuracy: stat.correct / stat.total }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
}
/** Due items first, then unseen material and observed weaknesses. Stable tie-breaks. */
export function prioritizeQuestions(
  questions: Question[],
  attempts: Attempt[],
  cards: ReviewCard[],
  count: number,
  now: number,
): Question[] {
  const stats = new Map(skillStats(attempts, questions).map((s) => [s.skill, s]))
  const seen = new Set(attempts.filter((a) => a.selected !== null).map((a) => a.questionId))
  const latest = new Map<string, number>()
  for (const attempt of attempts)
    latest.set(
      attempt.questionId,
      Math.max(latest.get(attempt.questionId) ?? 0, attempt.occurredAt),
    )
  const due = new Set(
    cards.filter((c) => c.kind === 'question' && c.dueAt <= now).map((c) => c.contentId),
  )
  const priority = (q: Question) =>
    (due.has(q.id) ? 100 : 0) +
    (!seen.has(q.id) ? 20 : 0) +
    q.skills.reduce(
      (sum, skill) => sum + (stats.has(skill) ? (1 - stats.get(skill)!.accuracy) * 12 : 0),
      0,
    )
  return [...questions]
    .sort(
      (a, b) =>
        priority(b) - priority(a) ||
        (latest.get(a.id) ?? 0) - (latest.get(b.id) ?? 0) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, Math.max(1, count))
}
