import {
  questionSignature,
  validateContentBank,
  type ContentBank,
  type ContentIssue,
} from './validation'
import { editorialIssues, packageFingerprint, type EditorialRecord } from './editorial'
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export interface ContentPackage {
  format: 'study990.content'
  formatVersion: 1 | 2 | 3 | 4
  id: string
  revision: string
  bank: ContentBank
  media: {
    path: string
    author: string
    sourceUrl: string
    license: string
    licenseUrl: string
    sha256?: string
  }[]
  purpose?: 'practice' | 'mock'
  editorial?: EditorialRecord
  practiceRelease?: {
    kind: 'unreviewed-practice'
    fingerprint: string
    note: string
  }
  review:
    | { reviewer: string; date: string; verdict: 'approved' }
    | { status: 'ai-draft' | 'unreviewed'; author: string; date: string; note: string }
}
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
/** Explicit AI/source practice release; never substitutes for the version-3 human review path. */
export function practiceReleaseIssues(pkg: ContentPackage): ContentIssue[] {
  if (pkg.formatVersion !== 4) return []
  return pkg.purpose === 'mock' &&
    isObject(pkg.review) &&
    !('verdict' in pkg.review) &&
    ['ai-draft', 'unreviewed'].includes(String(pkg.review.status)) &&
    isObject(pkg.bank) &&
    Array.isArray(pkg.bank.questions) &&
    Array.isArray(pkg.bank.stimuli) &&
    [...pkg.bank.questions, ...pkg.bank.stimuli].every(
      (row) => row.provenance.kind === 'licensed' || row.provenance.editorialStatus === 'ai-draft',
    ) &&
    pkg.practiceRelease?.kind === 'unreviewed-practice' &&
    pkg.practiceRelease.fingerprint === packageFingerprint(pkg) &&
    text(pkg.practiceRelease.note) &&
    pkg.editorial === undefined
    ? []
    : [
        {
          path: 'practiceRelease',
          message:
            'Version-4 practice requires a pinned unreviewed release; human approval must use version 3.',
        },
      ]
}
function boundedJson(input: unknown) {
  const pending: { value: unknown; depth: number }[] = [{ value: input, depth: 0 }]
  let nodes = 0
  while (pending.length) {
    const { value, depth } = pending.pop()!
    if (++nodes > 200000 || depth > 32 || (typeof value === 'number' && !Number.isFinite(value)))
      return false
    if (Array.isArray(value))
      for (const item of value) pending.push({ value: item, depth: depth + 1 })
    else if (isObject(value))
      for (const [key, item] of Object.entries(value)) {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) return false
        pending.push({ value: item, depth: depth + 1 })
      }
  }
  return true
}
const https = (v: unknown) => {
  try {
    const u = new URL(String(v))
    return u.protocol === 'https:' && !u.username && !u.password
  } catch {
    return false
  }
}
/** Ingestion is a build-time review boundary, not a runtime bank installer. */
export function validateContentPackage(
  input: unknown,
  existing: ContentBank,
  authoring = false,
): ContentIssue[] {
  if (!boundedJson(input))
    return [
      {
        path: 'package',
        message: 'Content exceeds JSON safety/depth limits or contains unsafe keys.',
      },
    ]
  if (
    !isObject(input) ||
    input.format !== 'study990.content' ||
    ![1, 2, 3, 4].includes(Number(input.formatVersion))
  )
    return [{ path: 'package', message: 'Unsupported content package/version.' }]
  const issues = validateContentBank(input.bank)
  const fail = (path: string, message: string) => issues.push({ path, message })
  if (!text(input.id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.id) || !text(input.revision))
    fail('package.id', 'Stable package ID and revision required.')
  const review = input.review
  const validDate =
    isObject(review) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(review.date)) &&
    Number.isFinite(Date.parse(String(review.date))) &&
    new Date(String(review.date)).toISOString().slice(0, 10) === review.date
  const human = isObject(review) && text(review.reviewer) && review.verdict === 'approved'
  const draft =
    [2, 3, 4].includes(Number(input.formatVersion)) &&
    isObject(review) &&
    (review.status === 'ai-draft' ||
      ([3, 4].includes(Number(input.formatVersion)) && review.status === 'unreviewed')) &&
    text(review.author) &&
    text(review.note)
  if (!validDate || (!human && !draft))
    fail('review', 'Explicit human approval or version-2 AI-draft editorial status is required.')
  if (
    [2, 3, 4].includes(Number(input.formatVersion)) &&
    !['practice', 'mock'].includes(String(input.purpose))
  )
    fail('purpose', 'Version-2 packages require practice or mock purpose.')
  if (!isObject(input.bank)) return issues
  const bank = input.bank
  if (issues.length) return issues
  const typed = bank as unknown as ContentBank
  if (input.formatVersion === 4)
    issues.push(...practiceReleaseIssues(input as unknown as ContentPackage))
  if (
    [3, 4].includes(Number(input.formatVersion)) &&
    [...typed.questions, ...typed.stimuli].some((r) => r.provenance.revision !== input.revision)
  )
    fail('revision', 'Version-3 question/stimulus provenance must match the package revision.')
  if (input.formatVersion === 3 && !authoring) {
    const record = input.editorial as EditorialRecord | undefined
    for (const message of editorialIssues(
      record,
      packageFingerprint(input as unknown as ContentPackage),
    ))
      fail('editorial', message)
    if (record?.state === 'DRAFT')
      fail('editorial.state', 'DRAFT content must pass validation before import.')
    if (
      human &&
      (!Array.isArray(record?.history) ||
        !record.history.some(
          (e) => e?.state === 'APPROVED' && e.review?.attestation === 'human-review',
        ))
    )
      fail('review', 'A legacy review label cannot replace a current human approval record.')
  }
  if (
    draft &&
    isObject(review) &&
    review.status === 'ai-draft' &&
    typed.questions.some(
      (q) => q.provenance.kind !== 'original' || q.provenance.editorialStatus !== 'ai-draft',
    )
  )
    fail('review', 'AI-draft questions must disclose their status in provenance.')
  const seen = new Set(
    [...existing.questions, ...existing.stimuli, ...existing.passages].map((r) => r.id),
  )
  for (const row of [...typed.questions, ...typed.stimuli, ...typed.passages]) {
    if (!row.id.startsWith(`${input.id}:`) || !/^[a-z0-9:-]+$/.test(row.id) || row.id.length > 150)
      fail(row.id, 'IDs must use the package namespace, e.g. bank-name:q1.')
    if (seen.has(row.id)) fail(row.id, 'Duplicate ID across packages or content kinds.')
    seen.add(row.id)
  }
  const signatures = new Set(existing.questions.map(questionSignature))
  for (const q of typed.questions) {
    const key = questionSignature(q)
    if (signatures.has(key)) fail(q.id, 'Duplicate normalized prompt and options.')
    signatures.add(key)
    if (q.media) fail(q.id, 'Use shared stimulus media rather than legacy question.media.')
  }
  for (const key of ['grammarIds', 'vocabularyIds'] as const)
    if (typed[key].some((id) => !existing[key].includes(id)))
      fail(
        key,
        'This pipeline only links existing reference entries; reference additions require their own reviewed source update.',
      )
  const referenced = new Set<string>()
  function findMedia(value: unknown) {
    if (Array.isArray(value)) value.forEach(findMedia)
    else if (isObject(value)) {
      if (typeof value.src === 'string') referenced.add(value.src)
      Object.values(value).forEach(findMedia)
    }
  }
  findMedia(typed)
  const declared = new Set<string>()
  if (!Array.isArray(input.media))
    fail('media', 'Media manifest is required, including an empty array for text-only banks.')
  else
    for (const [i, m] of input.media.entries()) {
      if (
        !isObject(m) ||
        !text(m.path) ||
        !/^\/media\/[a-z0-9._/-]+$/i.test(m.path) ||
        m.path
          .slice(1)
          .split('/')
          .some((s) => s === '..' || !s) ||
        !text(m.author) ||
        !text(m.license) ||
        !https(m.sourceUrl) ||
        !https(m.licenseUrl)
      ) {
        fail(`media[${i}]`, 'Safe local asset path and explicit author/source/license required.')
        continue
      }
      if (
        m.sha256 !== undefined &&
        (typeof m.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(m.sha256))
      )
        fail(m.path, 'Invalid SHA-256 metadata.')
      if (declared.has(m.path)) fail(m.path, 'Duplicate media declaration.')
      declared.add(m.path)
    }
  for (const path of referenced)
    if (!declared.has(path)) fail(path, 'Referenced asset missing from licensed media manifest.')
  for (const path of declared) if (!referenced.has(path)) fail(path, 'Unused media declaration.')
  return issues
}
