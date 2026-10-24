import type { Attempt, ReviewCard, ReviewEvent, SkillEvidence } from './models'
import { localDayKey, startOfToday } from './learning'
import { aggregateSkillEvidence } from './evidence'
import { schedulableCard } from './scheduler'
export function analyticsPeriodStart(now: number, days: number) {
  if (!days) return -Infinity
  const start = new Date(startOfToday(now))
  start.setDate(start.getDate() - days + 1)
  return start.getTime()
}

export function recallEvents(events: ReviewEvent[]) {
  return events.filter((e) => e.source !== 'practice-error')
}
export function learningActivity(
  attempts: Attempt[],
  events: ReviewEvent[],
  now: number,
  count = 28,
  evidence: SkillEvidence[] = [],
) {
  const buckets = new Map<
    string,
    { questions: number; vocabulary: number; knowledge: number; grammarExercises: number }
  >()
  const entry = (time: number) => {
    const key = localDayKey(time),
      row = buckets.get(key) ?? { questions: 0, vocabulary: 0, knowledge: 0, grammarExercises: 0 }
    buckets.set(key, row)
    return row
  }
  for (const a of attempts)
    if (a.selected !== null && a.occurredAt <= now) entry(a.occurredAt).questions++
  for (const event of recallEvents(events)) {
    if (event.occurredAt > now) continue
    if (event.cardId.startsWith('vocabulary:')) entry(event.occurredAt).vocabulary++
    if (event.cardId.startsWith('knowledge:')) entry(event.occurredAt).knowledge++
  }
  const references = new Map(
    evidence
      .filter((e) => e.source === 'grammar-practice' && e.occurredAt <= now)
      .map((e) => [e.attemptId, e]),
  )
  for (const item of references.values()) entry(item.occurredAt).grammarExercises++
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(startOfToday(now))
    date.setDate(date.getDate() - count + 1 + i)
    const key = localDayKey(date.getTime()),
      row = buckets.get(key) ?? { questions: 0, vocabulary: 0, knowledge: 0, grammarExercises: 0 }
    return {
      date,
      key,
      ...row,
      total: row.questions + row.vocabulary + row.knowledge + row.grammarExercises,
    }
  })
}
export function queueDistribution(cards: ReviewCard[], now: number) {
  const valid = cards.filter(schedulableCard),
    day = 86_400_000
  const ranges = [
    { label: 'Đang đến hạn', from: -Infinity, to: now },
    { label: 'Trong 24 giờ tới', from: now, to: now + day },
    { label: 'Sau 1–7 ngày', from: now + day, to: now + 7 * day },
    { label: 'Sau 7 ngày', from: now + 7 * day, to: Infinity },
  ]
  return {
    invalid: cards.length - valid.length,
    rows: ranges.map((range) => ({
      label: range.label,
      count: valid.filter((c) => c.dueAt > range.from && c.dueAt <= range.to).length,
    })),
  }
}
export function accuracyTrend(attempts: Attempt[], now: number) {
  const today = startOfToday(now)
  return Array.from({ length: 4 }, (_, index) => {
    const start = new Date(today),
      end = new Date(today)
    start.setDate(start.getDate() - (3 - index) * 7 - 6)
    end.setDate(end.getDate() - (3 - index) * 7 + 1)
    const rows = attempts.filter(
      (a) => a.occurredAt >= start.getTime() && a.occurredAt < end.getTime() && a.occurredAt <= now,
    )
    const correct = rows.filter((a) => a.correct).length
    return {
      label: `${start.getDate()}/${start.getMonth() + 1}`,
      total: rows.length,
      correct,
      accuracy: rows.length ? correct / rows.length : null,
    }
  })
}
export function comparableSkillChanges(evidence: SkillEvidence[], now: number) {
  const boundary = new Date(startOfToday(now))
  boundary.setDate(boundary.getDate() - 6)
  const prior = new Date(boundary)
  prior.setDate(prior.getDate() - 7)
  const previous = aggregateSkillEvidence(evidence, prior.getTime(), boundary.getTime())
  const current = aggregateSkillEvidence(evidence, boundary.getTime(), now + 1)
  return current
    .filter((s) => s.leaf)
    .map((s) => {
      const p = previous.find((row) => row.id === s.id)!
      const enough =
        s.answered >= 5 && p.answered >= 5 && s.distinctQuestions >= 3 && p.distinctQuestions >= 3
      return {
        id: s.id,
        previous: p,
        current: s,
        delta: enough ? (s.accuracy! - p.accuracy!) * 100 : null,
      }
    })
}
