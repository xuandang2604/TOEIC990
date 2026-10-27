import type { ContentIssue } from './validation'
import { SKILL_LABELS } from '../domain/skillTaxonomy'

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string' && Boolean(value.trim())
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text)

/** Validate shape and links at the content boundary, before any reference or practice route. */
export function validateReferences(input: unknown, questionIds: string[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const fail = (path: string, message: string) => issues.push({ path, message })
  if (!object(input)) return [{ path: 'references', message: 'Expected a reference collection.' }]
  const words = list(input.vocabulary),
    lessons = list(input.grammar)
  if (!Array.isArray(input.vocabulary) || words.length < 80)
    fail('vocabulary', 'At least 80 curated entries required.')
  if (
    words.filter((row) => object(row) && text(row.word) && /^[A-Za-z]+$/.test(row.word)).length < 80
  )
    fail('vocabulary.words', 'At least 80 single-word entries required, excluding phrases.')
  if (!Array.isArray(input.grammar) || lessons.length < 12)
    fail('grammar', 'At least 12 lessons required.')
  function ids(rows: unknown[], path: string) {
    const seen = new Set<string>()
    rows.forEach((row, i) => {
      if (!object(row) || !text(row.id) || !/^[a-z0-9-]+$/.test(row.id))
        fail(`${path}[${i}].id`, 'Invalid stable ID.')
      else {
        if (seen.has(row.id)) fail(`${path}[${i}].id`, 'Duplicate ID.')
        seen.add(row.id)
      }
    })
    return seen
  }
  const wordIds = ids(words, 'vocabulary'),
    lessonIds = ids(lessons, 'grammar'),
    questions = new Set(questionIds)
  function refs(value: unknown, allowed: Set<string>, path: string) {
    if (
      !strings(value) ||
      new Set(value).size !== value.length ||
      value.some((id) => !allowed.has(id))
    )
      fail(path, 'Invalid or duplicate reference.')
  }
  function provenance(value: unknown, path: string) {
    if (
      !object(value) ||
      value.kind !== 'original' ||
      !['author', 'revision', 'note'].every((key) => text(value[key]))
    )
      fail(path, 'Original editorial provenance required.')
  }
  words.forEach((row, i) => {
    const path = `vocabulary[${i}]`
    if (!object(row)) {
      fail(path, 'Expected entry.')
      return
    }
    for (const key of [
      'word',
      'ipa',
      'partOfSpeech',
      'meaning',
      'definition',
      'example',
      'translation',
      'topic',
      'usageNote',
    ])
      if (!text(row[key])) fail(`${path}.${key}`, 'Required text missing.')
    for (const key of ['forms', 'family', 'collocations'])
      if (!strings(row[key])) fail(`${path}.${key}`, 'Expected string array.')
    if (list(row.collocations).length < 2)
      fail(`${path}.collocations`, 'Provide at least two workplace collocations.')
    for (const key of ['synonyms', 'antonyms'])
      if (row[key] !== undefined && !strings(row[key]))
        fail(`${path}.${key}`, 'Expected curated relationships.')
    if (row.pronunciationText !== undefined && !text(row.pronunciationText))
      fail(`${path}.pronunciationText`, 'Expected a pronunciation cue.')
    const locales = new Set<string>()
    if (!list(row.pronunciations).length) fail(`${path}.pronunciations`, 'IPA required.')
    list(row.pronunciations).forEach((pronunciation) => {
      if (
        !object(pronunciation) ||
        !['en-US', 'en-GB'].includes(String(pronunciation.locale)) ||
        !text(pronunciation.ipa) ||
        !/^\/.+\/$/.test(pronunciation.ipa) ||
        locales.has(String(pronunciation.locale))
      )
        fail(`${path}.pronunciations`, 'Invalid or duplicate pronunciation.')
      else locales.add(String(pronunciation.locale))
    })
    refs(row.grammarIds, lessonIds, `${path}.grammarIds`)
    provenance(row.provenance, `${path}.provenance`)
  })
  lessons.forEach((row, i) => {
    const path = `grammar[${i}]`
    if (!object(row)) {
      fail(path, 'Expected lesson.')
      return
    }
    for (const key of ['title', 'englishTitle', 'summary'])
      if (!text(row[key])) fail(`${path}.${key}`, 'Required text missing.')
    for (const [key, fields, min] of [
      ['rules', ['title', 'description', 'formula'], 3],
      ['examples', ['correct', 'incorrect', 'explanation'], 2],
    ] as const) {
      if (
        list(row[key]).length < min ||
        list(row[key]).some((item) => !object(item) || fields.some((field) => !text(item[field])))
      )
        fail(`${path}.${key}`, 'Incomplete lesson section.')
    }
    if (!strings(row.traps) || row.traps.length < 2)
      fail(`${path}.traps`, 'At least two traps required.')
    if (
      !strings(row.skills) ||
      !row.skills.length ||
      new Set(row.skills).size !== row.skills.length ||
      row.skills.some((skill) => !Object.hasOwn(SKILL_LABELS, skill))
    )
      fail(`${path}.skills`, 'Known, non-duplicate skill tags required.')
    refs(row.vocabularyIds, wordIds, `${path}.vocabularyIds`)
    refs(row.questionIds, questions, `${path}.questionIds`)
    if (
      row.coverage !== undefined &&
      !['question-linked', 'reference-only'].includes(String(row.coverage))
    )
      fail(`${path}.coverage`, 'Unknown grammar coverage status.')
    if (!list(row.questionIds).length && row.coverage !== 'reference-only')
      fail(
        `${path}.questionIds`,
        'Question references or explicit reference-only coverage required.',
      )
    const exercises = list(row.practice)
    ids(exercises, `${path}.practice`)
    if (exercises.length < 2) fail(`${path}.practice`, 'At least two original exercises required.')
    exercises.forEach((exercise, j) => {
      const p = `${path}.practice[${j}]`
      if (!object(exercise)) {
        fail(p, 'Invalid exercise.')
        return
      }
      const options = list(exercise.options)
      const optionIds = options.flatMap((o) => (object(o) ? [o.id] : []))
      if (
        !text(exercise.prompt) ||
        !text(exercise.explanation) ||
        options.length < 3 ||
        options.length > 4 ||
        new Set(optionIds).size !== options.length ||
        !optionIds.includes(exercise.answer) ||
        options.some(
          (o) =>
            !object(o) ||
            !['A', 'B', 'C', 'D'].includes(String(o.id)) ||
            !text(o.text) ||
            !text(o.explanation),
        )
      )
        fail(p, 'Invalid exercise options/answer.')
    })
    provenance(row.provenance, `${path}.provenance`)
  })
  return issues
}
