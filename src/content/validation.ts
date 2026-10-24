import type { Passage, Question, Stimulus } from './schema'
import { SKILL_LABELS } from '../domain/skillTaxonomy'

export interface ContentBank {
  questions: Question[]
  stimuli: Stimulus[]
  passages: Passage[]
  grammarIds: string[]
  vocabularyIds: string[]
}
export interface ContentIssue {
  path: string
  message: string
}
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const stringList = (value: unknown): value is string[] => Array.isArray(value) && value.every(text)
const asset = (value: unknown) =>
  text(value) && /^\/media\/[a-z0-9._/-]+$/i.test(value) && !value.split('/').includes('..')
const https = (value: unknown) => {
  if (!text(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
  } catch {
    return false
  }
}
const skills = Object.keys(SKILL_LABELS)
const topics = ['office', 'travel', 'training', 'shopping', 'facilities', 'grammar']
export function questionSignature(q: Pick<Question, 'prompt' | 'options'>) {
  const normalize = (value: string) =>
    value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()
  return (
    normalize(q.prompt) +
    '|' +
    q.options
      .map((o) => normalize(o.text))
      .sort()
      .join('|')
  )
}

/** Validates untrusted shape and cross-references; semantic/content review remains human-owned. */
export function validateContentBank(input: unknown): ContentIssue[] {
  const issues: ContentIssue[] = []
  const fail = (path: string, message: string) => issues.push({ path, message })
  if (!object(input)) return [{ path: 'bank', message: 'Expected a content bank object.' }]
  for (const key of ['questions', 'stimuli', 'passages', 'grammarIds', 'vocabularyIds'])
    if (!Array.isArray(input[key])) fail(key, 'Expected an array.')
  const questionRows = list(input.questions),
    stimulusRows = list(input.stimuli),
    passageRows = list(input.passages)
  if (!questionRows.length) fail('questions', 'No questions available.')
  function ids(rows: unknown[], path: string) {
    const seen = new Set<string>()
    rows.forEach((row, i) => {
      if (!object(row) || !text(row.id)) fail(`${path}[${i}].id`, 'Missing ID.')
      else {
        if (seen.has(row.id)) fail(`${path}[${i}].id`, 'Duplicate ID.')
        seen.add(row.id)
      }
    })
    return seen
  }
  ids(questionRows, 'questions')
  const stimulusIds = ids(stimulusRows, 'stimuli')
  const passageIds = ids(passageRows, 'passages')
  function provenance(value: unknown, path: string) {
    if (
      !object(value) ||
      !['original', 'licensed'].includes(String(value.kind)) ||
      !text(value.author) ||
      !text(value.revision) ||
      !text(value.note)
    )
      fail(path, 'Authored or licensed content provenance is required.')
    else if (
      value.kind === 'licensed' &&
      (!text(value.provider) ||
        !text(value.attribution) ||
        !text(value.license) ||
        !https(value.licenseUrl) ||
        !https(value.sourceUrl))
    )
      fail(path, 'Licensed content requires provider, attribution, source and license metadata.')
  }
  passageRows.forEach((p, i) => {
    if (
      object(p) &&
      (!text(p.title) ||
        !text(p.text) ||
        !['email', 'notice', 'article', 'chat'].includes(String(p.format)))
    )
      fail(`passages[${i}]`, 'Invalid passage.')
  })
  const kinds: Record<number, string> = {
    1: 'photograph',
    2: 'question-response',
    3: 'conversation',
    4: 'talk',
    6: 'text-completion',
    7: 'reading',
  }
  stimulusRows.forEach((s, i) => {
    const path = `stimuli[${i}]`
    if (!object(s)) return
    if (
      !text(s.title) ||
      !topics.includes(String(s.topic)) ||
      typeof s.part !== 'number' ||
      ![1, 2, 3, 4, 6, 7].includes(s.part) ||
      kinds[s.part] !== s.kind
    )
      fail(path, 'Invalid stimulus kind, Part, title or topic.')
    provenance(s.provenance, `${path}.provenance`)
    if (Number(s.part) <= 4) {
      const audio = s.audio
      if (
        !object(audio) ||
        !text(audio.transcript) ||
        !['synthetic', 'recording'].includes(String(audio.kind)) ||
        (audio.kind === 'recording' && (!asset(audio.src) || !text(audio.credit)))
      )
        fail(`${path}.audio`, 'Valid local audio/transcript is required.')
    }
    if (s.part === 1) {
      const photo = s.photograph
      if (!object(photo) || !['ready', 'placeholder'].includes(String(photo.status)))
        fail(`${path}.photograph`, 'Missing photograph state.')
      else if (
        photo.status === 'ready' &&
        (!asset(photo.src) ||
          !text(photo.alt) ||
          !text(photo.author) ||
          !https(photo.sourceUrl) ||
          !https(photo.licenseUrl) ||
          !['CC0-1.0', 'CC-BY-4.0'].includes(String(photo.license)))
      )
        fail(
          `${path}.photograph`,
          'Photograph requires a local asset and explicit license/attribution.',
        )
      else if (photo.status === 'placeholder' && !text(photo.reason))
        fail(`${path}.photograph`, 'Placeholder needs an honest reason.')
    }
    if (s.part === 6 || s.part === 7) {
      if (
        !stringList(s.passageIds) ||
        !s.passageIds.length ||
        s.passageIds.some((id) => !passageIds.has(id)) ||
        new Set(s.passageIds).size !== s.passageIds.length ||
        (s.part === 6 && s.passageIds.length !== 1) ||
        s.passageIds.length > 3
      )
        fail(`${path}.passageIds`, 'Missing, duplicate or invalid passage references.')
    }
    if (s.exhibit !== undefined) {
      const e = s.exhibit
      if (![3, 4].includes(Number(s.part)) || !object(e) || !text(e.title))
        fail(`${path}.exhibit`, 'Only Part 3/4 supports an exhibit.')
      else if (e.kind === 'table') {
        if (
          !stringList(e.columns) ||
          !e.columns.length ||
          !Array.isArray(e.rows) ||
          !e.rows.length ||
          e.rows.some((row) => !stringList(row) || row.length !== (e.columns as unknown[]).length)
        )
          fail(`${path}.exhibit`, 'Exhibit table dimensions do not match.')
      } else if (e.kind !== 'image' || !asset(e.src) || !text(e.alt) || !text(e.credit))
        fail(`${path}.exhibit`, 'Invalid exhibit image.')
    }
    const grouped = questionRows.filter((q) => object(q) && q.stimulusId === s.id)
    if (!grouped.length) fail(path, 'Stimulus is unused.')
    if ((s.part === 3 || s.part === 4) && grouped.length !== 3)
      fail(path, 'Conversation/talk sets require three questions.')
    if (s.part === 6) {
      const p = passageRows.find((row) => object(row) && row.id === list(s.passageIds)[0])
      const markers =
        object(p) && text(p.text) ? [...p.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => m[1]) : []
      const keys = grouped.filter(object).map((q) => q.blankKey)
      if (
        grouped.length !== 4 ||
        markers.length !== 4 ||
        new Set(markers).size !== 4 ||
        new Set(keys).size !== 4 ||
        markers.some((key) => !keys.includes(key)) ||
        !grouped.some((q) => object(q) && q.blankType === 'sentence')
      )
        fail(path, 'Part 6 requires four unique mapped blanks, including a sentence blank.')
    }
  })
  const signatures = new Set<string>()
  questionRows.forEach((q, i) => {
    const path = `questions[${i}]`
    if (!object(q)) return
    if (
      q.schemaVersion !== 1 ||
      ![1, 2, 3, 4, 5, 6, 7].includes(Number(q.part)) ||
      typeof q.part !== 'number' ||
      !text(q.prompt) ||
      !text(q.explanation) ||
      !text(q.takeaway) ||
      !['foundation', 'intermediate', 'advanced'].includes(String(q.difficulty)) ||
      !topics.includes(String(q.topic))
    )
      fail(path, 'Invalid question metadata.')
    provenance(q.provenance, `${path}.provenance`)
    if (
      !stringList(q.skills) ||
      !q.skills.length ||
      q.skills.some((skill) => !skills.includes(skill))
    )
      fail(`${path}.skills`, 'Unknown or empty skill tags.')
    for (const key of ['grammarIds', 'vocabularyIds'] as const)
      if (!stringList(q[key]) || (q[key] as string[]).some((id) => !list(input[key]).includes(id)))
        fail(`${path}.${key}`, 'Unknown knowledge reference.')
    const opts = list(q.options)
    const expected = q.part === 2 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']
    if (
      opts.length !== expected.length ||
      expected.some((id) => opts.filter((o) => object(o) && o.id === id).length !== 1) ||
      opts.some((o) => !object(o) || !text(o.text) || !text(o.reasoning)) ||
      !expected.includes(String(q.answer))
    )
      fail(`${path}.options`, 'Invalid choices or answer key.')
    else {
      const typed = q as unknown as Question
      if (opts.some((o) => object(o) && (o.correct !== undefined || o.isCorrect !== undefined)))
        fail(
          `${path}.options`,
          'Use one question.answer key; per-choice correctness flags are unsupported.',
        )
      if (
        new Set(typed.options.map((o) => o.text.normalize('NFKC').toLowerCase().trim())).size !==
        opts.length
      )
        fail(`${path}.options`, 'Duplicate choice text cannot yield an unambiguous answer.')
      if (text(q.prompt)) {
        const signature = questionSignature(typed)
        if (signatures.has(signature)) fail(path, 'Duplicate normalized prompt and choices.')
        signatures.add(signature)
      }
    }
    if (q.part !== 5 || q.stimulusId !== undefined) {
      const s = stimulusRows.find((row) => object(row) && row.id === q.stimulusId)
      if (!text(q.stimulusId) || !stimulusIds.has(q.stimulusId) || !object(s) || s.part !== q.part)
        fail(`${path}.stimulusId`, 'Missing or wrong-Part stimulus.')
      if (q.passageId !== undefined && (!object(s) || !list(s.passageIds).includes(q.passageId)))
        fail(`${path}.passageId`, 'Passage must belong to the referenced shared stimulus.')
    }
    if (q.part === 6 && (!text(q.blankKey) || !['word', 'sentence'].includes(String(q.blankType))))
      fail(`${path}.blankKey`, 'Text completion needs blank key and type.')
    if (q.evidence !== undefined) {
      const s = stimulusRows.find((row) => object(row) && row.id === q.stimulusId)
      if (!Array.isArray(q.evidence) || !q.evidence.length || ![6, 7].includes(Number(q.part)))
        fail(`${path}.evidence`, 'Evidence requires a reading question and explicit references.')
      else
        q.evidence.forEach((e, j) => {
          const p = object(e)
            ? passageRows.find((row) => object(row) && row.id === e.passageId)
            : undefined
          if (
            !object(e) ||
            !text(e.quote) ||
            !text(e.explanation) ||
            !object(s) ||
            !list(s.passageIds).includes(e.passageId) ||
            !object(p) ||
            !text(p.text) ||
            !p.text.includes(e.quote)
          )
            fail(
              `${path}.evidence[${j}]`,
              'Evidence quote must exist in a passage belonging to this question stimulus.',
            )
        })
    }
  })
  return issues
}
export function assertValidContentBank(input: unknown): asserts input is ContentBank {
  const issues = validateContentBank(input)
  if (issues.length)
    throw new Error(
      `Invalid content bank:\n${issues.map((i) => `${i.path}: ${i.message}`).join('\n')}`,
    )
}
