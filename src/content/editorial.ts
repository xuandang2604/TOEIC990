import type { Question } from './schema'

export const EDITORIAL_STATES = [
  'DRAFT',
  'VALIDATED',
  'NEEDS_REVIEW',
  'APPROVED',
  'PUBLISHED',
] as const
export type EditorialState = (typeof EDITORIAL_STATES)[number]
export interface HumanReview {
  reviewer: string
  answerKey: boolean
  distractors: boolean
  language: boolean
  evidence: boolean
  rights: boolean
  attestation: 'human-review'
}
export interface EditorialRecord {
  state: EditorialState
  fingerprint: string
  history: {
    state: EditorialState
    actor: string
    at: string
    fingerprint: string
    review?: HumanReview
  }[]
  eligibility: { practice: boolean; assessment: 'none' | 'unreviewed-practice' | 'reviewed' }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']'
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
        .join(',') +
      '}'
    )
  return JSON.stringify(value) ?? 'null'
}
/** Content-change detection, NOT a cryptographic signature or proof of a reviewer's identity. */
export function contentFingerprint(value: unknown) {
  const text = canonical(value)
  let a = 2166136261,
    b = 5381
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 16777619)
    b = Math.imul(b, 33) ^ text.charCodeAt(i)
  }
  return `${text.length}-${(a >>> 0).toString(16)}-${(b >>> 0).toString(16)}`
}
export const questionFingerprint = (q: Question) => contentFingerprint(q)
export function packageFingerprint(pkg: {
  revision: string
  bank: unknown
  media: unknown
  purpose?: string
}) {
  return contentFingerprint({
    revision: pkg.revision,
    bank: pkg.bank,
    media: pkg.media,
    purpose: pkg.purpose,
  })
}
export function humanReviewComplete(review: HumanReview | undefined) {
  return Boolean(
    review &&
    review.attestation === 'human-review' &&
    typeof review.reviewer === 'string' &&
    review.reviewer.trim() &&
    [review.answerKey, review.distractors, review.language, review.evidence, review.rights].every(
      (v) => v === true,
    ),
  )
}
export function editorialIssues(
  record: EditorialRecord | undefined,
  fingerprint: string,
): string[] {
  if (
    !record ||
    !EDITORIAL_STATES.includes(record.state) ||
    !Array.isArray(record.history) ||
    record.history.length < 1 ||
    record.history.length > 100
  )
    return ['Missing editorial lifecycle.']
  const issues: string[] = []
  if (record.fingerprint !== fingerprint)
    issues.push('Content changed since validation/review; reset to DRAFT.')
  if (
    !record.eligibility ||
    typeof record.eligibility.practice !== 'boolean' ||
    !['none', 'unreviewed-practice', 'reviewed'].includes(record.eligibility.assessment)
  )
    issues.push('Explicit practice/assessment eligibility required.')
  const last = record.history.at(-1)
  if (last?.state !== record.state || record.history[0]?.state !== 'DRAFT')
    issues.push('Invalid lifecycle history endpoints.')
  record.history.forEach((event, i) => {
    if (
      !event ||
      EDITORIAL_STATES[i] !== event.state ||
      typeof event.actor !== 'string' ||
      !event.actor.trim() ||
      typeof event.at !== 'string' ||
      !Number.isFinite(Date.parse(event.at)) ||
      event.fingerprint !== fingerprint
    )
      issues.push('Invalid or stale lifecycle event.')
    if (event?.state === 'APPROVED' && !humanReviewComplete(event.review))
      issues.push('APPROVED requires explicit human review of the current content.')
  })
  if (
    record.eligibility?.assessment === 'reviewed' &&
    ['APPROVED', 'PUBLISHED'].includes(record.state) &&
    !record.history.some((e) => e?.state === 'APPROVED' && humanReviewComplete(e.review))
  )
    issues.push('Reviewed assessment eligibility lacks human approval.')
  return issues
}
export function draftEditorial(
  fingerprint: string,
  actor: string,
  at = new Date().toISOString(),
): EditorialRecord {
  return {
    state: 'DRAFT',
    fingerprint,
    history: [{ state: 'DRAFT', fingerprint, actor, at }],
    eligibility: { practice: true, assessment: 'none' },
  }
}
export function advanceEditorial(
  record: EditorialRecord,
  fingerprint: string,
  actor: string,
  valid: boolean,
  review?: HumanReview,
): EditorialRecord {
  if (editorialIssues(record, fingerprint).length || !valid || !actor.trim())
    throw new Error('Fix validation failures or reset changed content to DRAFT before advancing.')
  const next = EDITORIAL_STATES[EDITORIAL_STATES.indexOf(record.state) + 1]
  if (!next) throw new Error('This revision is already published.')
  if (next === 'APPROVED' && !humanReviewComplete(review))
    throw new Error('A named human must explicitly attest to the review checklist.')
  return {
    ...record,
    state: next,
    history: [
      ...record.history,
      {
        state: next,
        fingerprint,
        actor,
        at: new Date().toISOString(),
        ...(next === 'APPROVED' ? { review } : {}),
      },
    ],
  }
}
