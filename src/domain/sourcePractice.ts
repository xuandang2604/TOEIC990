import type { OptionId, ToeicPart } from '../content/schema'

/** References and learner responses only. No third-party question text, images, audio or keys. */
export interface PracticeSource {
  id: string
  revision: string
  title: string
  kind: 'official-sample' | 'personal'
  url: string | null
  groups: { part: ToeicPart; numbers: number[] }[]
}
export interface SourcePracticeActivity {
  id: string
  contentId: string
  kind: 'source-practice'
  occurredAt: number
  updatedAt: number
  revision: number
  source: PracticeSource
  assistance: 'unassisted' | 'assisted'
  seenBefore: boolean
  status: 'answering' | 'checking' | 'completed' | 'abandoned'
  items: { number: number; part: ToeicPart; selected: OptionId | null; key: OptionId | null }[]
  lockedAt?: number
  completedAt?: number
}
export function sourceItems(source: PracticeSource): SourcePracticeActivity['items'] {
  return source.groups.flatMap(({ part, numbers }) =>
    numbers.map((number) => ({ number, part, selected: null, key: null })),
  )
}
export const sourceChoices = (part: ToeicPart): OptionId[] =>
  part === 2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']

export function personalPracticeSource(title: string, scope: ToeicPart | 'full'): PracticeSource {
  const limits = [
    [1, 6],
    [7, 31],
    [32, 70],
    [71, 100],
    [101, 130],
    [131, 146],
    [147, 200],
  ]
  const normalized = title.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ')
  return {
    id: `personal:${normalized}`,
    revision: 'personal-v1',
    title: title.trim(),
    kind: 'personal',
    url: null,
    groups: limits.flatMap(([from, through], i) =>
      scope === 'full' || scope === i + 1
        ? [
            {
              part: (i + 1) as ToeicPart,
              numbers: Array.from({ length: through - from + 1 }, (_, j) => from + j),
            },
          ]
        : [],
    ),
  }
}
const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown, max = 200): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max
const stamp = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0
const part = (v: unknown): v is ToeicPart =>
  [1, 2, 3, 4, 5, 6, 7].includes(Number(v)) && typeof v === 'number'

export function validPracticeSource(value: unknown): value is PracticeSource {
  if (!object(value) || !text(value.id, 500) || !text(value.revision) || !text(value.title))
    return false
  if (!['official-sample', 'personal'].includes(String(value.kind))) return false
  if (value.url !== null) {
    if (!text(value.url, 2000)) return false
    try {
      const url = new URL(value.url)
      if (url.protocol !== 'https:' || url.username || url.password) return false
      if (
        value.kind === 'official-sample' &&
        (url.origin !== 'https://www.iibc-global.org' ||
          !/^\/toeic\/test\/lr\/about\/format\/sample(?:0[1-6]|07_0[1-4])\.html$/.test(
            url.pathname,
          ) ||
          url.search ||
          url.hash)
      )
        return false
    } catch {
      return false
    }
  } else if (value.kind === 'official-sample') return false
  if (!Array.isArray(value.groups) || !value.groups.length || value.groups.length > 200)
    return false
  const numbers: number[] = []
  for (const group of value.groups) {
    if (
      !object(group) ||
      !part(group.part) ||
      !Array.isArray(group.numbers) ||
      !group.numbers.length ||
      group.numbers.length > 200
    )
      return false
    for (const number of group.numbers) {
      if (!Number.isSafeInteger(number) || number < 1 || number > 200) return false
      numbers.push(number)
    }
  }
  return numbers.length <= 200 && new Set(numbers).size === numbers.length
}

/** The key is explicitly entered by the learner AFTER locking responses, not verified by ETS. */
export function validSourcePractice(value: unknown): value is SourcePracticeActivity {
  if (
    !object(value) ||
    value.kind !== 'source-practice' ||
    !text(value.id, 500) ||
    !validPracticeSource(value.source) ||
    value.contentId !== value.source.id ||
    !stamp(value.occurredAt) ||
    !stamp(value.updatedAt) ||
    value.updatedAt < value.occurredAt ||
    !stamp(value.revision) ||
    !['unassisted', 'assisted'].includes(String(value.assistance)) ||
    typeof value.seenBefore !== 'boolean' ||
    !['answering', 'checking', 'completed', 'abandoned'].includes(String(value.status)) ||
    !Array.isArray(value.items)
  )
    return false
  const expected = sourceItems(value.source)
  if (
    value.items.length !== expected.length ||
    value.items.some(
      (item, i) =>
        !object(item) ||
        item.number !== expected[i].number ||
        item.part !== expected[i].part ||
        (item.selected !== null &&
          !sourceChoices(expected[i].part).includes(item.selected as OptionId)) ||
        (item.key !== null && !sourceChoices(expected[i].part).includes(item.key as OptionId)),
    )
  )
    return false
  if (
    value.status === 'answering' &&
    (value.lockedAt !== undefined ||
      value.completedAt !== undefined ||
      value.items.some((item) => item.key !== null))
  )
    return false
  if (
    ['checking', 'completed'].includes(String(value.status)) &&
    (!stamp(value.lockedAt) ||
      value.lockedAt < value.occurredAt ||
      value.lockedAt > value.updatedAt)
  )
    return false
  if (value.status === 'completed')
    return (
      stamp(value.completedAt) &&
      value.completedAt >= Number(value.lockedAt) &&
      value.completedAt === value.updatedAt &&
      value.items.every((item) => item.key !== null)
    )
  return (
    value.completedAt === undefined &&
    (value.lockedAt === undefined ||
      (stamp(value.lockedAt) &&
        value.lockedAt >= value.occurredAt &&
        value.lockedAt <= value.updatedAt))
  )
}

export function sourceResult(sheet: SourcePracticeActivity) {
  if (sheet.status !== 'completed') return null
  const correct = sheet.items.filter(
    (item) => item.selected !== null && item.selected === item.key,
  ).length
  return {
    correct,
    total: sheet.items.length,
    omitted: sheet.items.filter((item) => item.selected === null).length,
  }
}

export function parseSourceKey(
  input: string,
  items: SourcePracticeActivity['items'],
): { error: string } | { keys: OptionId[] } {
  if (input.length > 4000) return { error: 'Khóa đáp án quá dài.' } as const
  const letters = input.toUpperCase().replace(/[\s,;|]/g, '')
  if (!/^[ABCD]+$/.test(letters))
    return { error: 'Chỉ nhập chuỗi A/B/C/D; bỏ số câu và nội dung lời giải.' } as const
  if (letters.length !== items.length)
    return {
      error: `Cần đúng ${items.length} chữ cái theo thứ tự câu trên phiếu; đang có ${letters.length}.`,
    } as const
  const invalid = items.find(
    (item, i) => !sourceChoices(item.part).includes(letters[i] as OptionId),
  )
  if (invalid) return { error: `Câu ${invalid.number} thuộc Part 2, khóa chỉ nhận A/B/C.` } as const
  return { keys: letters.split('') as OptionId[] } as const
}

/** First encounters on distinct referenced items; repeats and assisted runs never inflate this signal. */
export function sourcePartEvidence(activities: { kind: string }[], now: number) {
  const completed = activities
    .filter(
      (row): row is SourcePracticeActivity =>
        validSourcePractice(row) && row.status === 'completed' && row.completedAt! <= now,
    )
    .sort((a, b) => a.lockedAt! - b.lockedAt! || a.id.localeCompare(b.id))
  const seen = new Set<string>()
  const first: SourcePracticeActivity['items'] = []
  for (const sheet of completed)
    for (const item of sheet.items) {
      const identity = `${sheet.source.kind}:${sheet.source.kind === 'official-sample' ? 'iibc-lr' : sheet.source.id}:${sheet.source.revision}:${item.number}`
      if (seen.has(identity)) continue
      seen.add(identity)
      if (
        !sheet.seenBefore &&
        sheet.assistance === 'unassisted' &&
        sheet.completedAt! >= now - 28 * 86_400_000
      )
        first.push(item)
    }
  return ([1, 2, 3, 4, 5, 6, 7] as const).map((part) => {
    const items = first.filter((item) => item.part === part)
    return {
      part,
      total: items.length,
      correct: items.filter((item) => item.selected !== null && item.selected === item.key).length,
    }
  })
}

/** Study-priority heuristic only: 4+ distinct first encounters, below 80%. Not a score scale. */
export function sourceReviewParts(activities: { kind: string }[], now: number) {
  return sourcePartEvidence(activities, now)
    .filter((row) => row.total >= 4 && row.correct / row.total < 0.8)
    .sort((a, b) => a.correct / a.total - b.correct / b.total || a.part - b.part)
    .map((row) => row.part)
}
