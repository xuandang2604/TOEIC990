import type { GrammarLesson } from '../schema'
import type { ContentIssue } from '../validation'
import { chapters, type FeynmanGuide, levelLabels } from './model'

/** Structural/reference checks only; these cannot certify a grammar explanation's meaning. */
export function validateHandbook(lessons: GrammarLesson[], guides: FeynmanGuide[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const ids = new Set(lessons.map((l) => l.id)),
    seen = new Set<string>()
  const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0
  for (const guide of guides) {
    const path = `handbook.${guide.lessonId}`
    const fail = (message: string) => issues.push({ path, message })
    if (!ids.has(guide.lessonId) || seen.has(guide.lessonId))
      fail('Missing or duplicate grammar reference.')
    seen.add(guide.lessonId)
    if (!chapters.some((c) => c.id === guide.chapterId) || !Object.hasOwn(levelLabels, guide.level))
      fail('Unknown chapter or level.')
    if (
      ![guide.plain, guide.why, guide.prompt].every(text) ||
      guide.selfCheck.length < 3 ||
      !guide.selfCheck.every(text)
    )
      fail('Missing authored Feynman explanation or checklist.')
    if (
      guide.relatedIds.some((id) => !ids.has(id) || id === guide.lessonId) ||
      new Set(guide.relatedIds).size !== guide.relatedIds.length
    )
      fail('Invalid related lesson links.')
    if (!guide.aliases.every(text)) fail('Invalid search aliases.')
    const q = guide.prediction
    if (
      !q ||
      !text(q.id) ||
      !text(q.prompt) ||
      !text(q.explanation) ||
      q.options.length < 3 ||
      q.options.length > 4 ||
      !q.options.some((o) => o.id === q.answer) ||
      new Set(q.options.map((o) => o.id)).size !== q.options.length ||
      new Set(q.options.map((o) => o.text.trim().toLowerCase())).size !== q.options.length ||
      q.options.some(
        (o) => !['A', 'B', 'C', 'D'].includes(o.id) || !text(o.text) || !text(o.explanation),
      )
    )
      fail('Invalid Feynman prediction options/key.')
  }
  for (const lesson of lessons)
    if (!seen.has(lesson.id))
      issues.push({ path: `handbook.${lesson.id}`, message: 'Missing Feynman guide.' })
  return issues
}
