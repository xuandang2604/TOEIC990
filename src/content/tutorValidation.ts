import type { Question } from './schema'
import type { ContentIssue } from './validation'
import { SKILL_LABELS } from '../domain/skillTaxonomy'

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown) => typeof v === 'string' && v.trim().length > 0
const texts = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every(text)
export function validateTutorLessons(
  input: unknown,
  questions: Question[],
  grammarIds: string[],
): ContentIssue[] {
  if (!Array.isArray(input)) return [{ path: 'tutor', message: 'Expected authored lessons.' }]
  const issues: ContentIssue[] = [],
    ids = new Set<string>(),
    covered = new Set<string>(),
    bank = new Map(questions.map((q) => [q.id, q]))
  const fail = (path: string, message: string) => issues.push({ path, message })
  input.forEach((lesson, i) => {
    const path = `tutor[${i}]`
    if (!object(lesson)) {
      fail(path, 'Expected lesson.')
      return
    }
    if (!text(lesson.id) || ids.has(String(lesson.id)))
      fail(`${path}.id`, 'Unique lesson ID required.')
    ids.add(String(lesson.id))
    if (!grammarIds.includes(String(lesson.grammarId)))
      fail(`${path}.grammarId`, 'Missing grammar reference.')
    if (!texts(lesson.skills) || lesson.skills.some((id) => !Object.hasOwn(SKILL_LABELS, id)))
      fail(`${path}.skills`, 'Known skills required.')
    for (const key of ['questionIds', 'transferIds']) {
      if (
        !texts(lesson[key]) ||
        new Set(lesson[key]).size !== lesson[key].length ||
        lesson[key].some((id) => !bank.has(id))
      )
        fail(`${path}.${key}`, 'Known, unique question references required.')
    }
    if (texts(lesson.questionIds))
      for (const id of lesson.questionIds) {
        if (covered.has(id)) fail(`${path}.questionIds`, 'Question has ambiguous tutor ownership.')
        covered.add(id)
        const q = bank.get(id)
        if (
          q &&
          (!q.grammarIds.includes(String(lesson.grammarId)) ||
            !texts(lesson.skills) ||
            !q.skills.some((s) => (lesson.skills as string[]).includes(s)))
        )
          fail(`${path}.questionIds`, 'Tutor/question knowledge mismatch.')
      }
    if (
      texts(lesson.transferIds) &&
      (!texts(lesson.questionIds) ||
        lesson.transferIds.some((id) => !(lesson.questionIds as string[]).includes(id)) ||
        lesson.transferIds.length < 2)
    )
      fail(`${path}.transferIds`, 'At least two supported transfer items required.')
    if (
      !text(lesson.cue) ||
      !text(lesson.simple) ||
      !texts(lesson.steps) ||
      lesson.steps.length < 3
    )
      fail(path, 'Substantial simple/step guidance required.')
    const example = lesson.example,
      prompts = lesson.prompts,
      provenance = lesson.provenance
    if (
      !object(example) ||
      !['sentence', 'explanation', 'changed', 'contrast'].every((key) => text(example[key]))
    )
      fail(`${path}.example`, 'Contrasting example required.')
    if (
      !object(prompts) ||
      !['why', 'rule', 'simplify', 'change', 'exception', 'apply'].every((key) =>
        text(prompts[key]),
      )
    )
      fail(`${path}.prompts`, 'All contextual Socratic prompts required.')
    const reasons = Array.isArray(lesson.reasons) ? lesson.reasons : []
    if (
      reasons.length < 2 ||
      new Set(reasons.map((r) => (object(r) ? r.id : ''))).size !== reasons.length ||
      reasons.some(
        (r) => !object(r) || !['id', 'label', 'response', 'followUp'].every((key) => text(r[key])),
      )
    )
      fail(`${path}.reasons`, 'Distinct authored reasoning branches required.')
    if (
      !object(provenance) ||
      provenance.kind !== 'original' ||
      !['author', 'revision', 'note'].every((key) => text(provenance[key]))
    )
      fail(`${path}.provenance`, 'Original provenance required.')
  })
  return issues
}
