import { useEffect, useState } from 'react'
import type { ContentPackage } from '../../content/ingestion'
import { validateContentBank, type ContentIssue } from '../../content/validation'
import {
  draftEditorial,
  packageFingerprint,
  advanceEditorial,
  editorialIssues,
  type HumanReview,
} from '../../content/editorial'
import { useAction } from '../../application/hooks'
import { StudyOperationError } from '../../application/errors'
import { downloadJson } from '../../components/downloadJson'
import { InlineError } from '../../components/ui'
import { studioApi, newPackage, type StudioCatalog, type StudioDraft } from './client'
import { QuestionFields } from './QuestionFields'
import { Resources } from './Resources'
import { QuestionPreview } from './QuestionPreview'

interface Validation {
  issues: ContentIssue[]
  near: unknown[]
  valid: boolean
}
function shape(pkg: unknown): pkg is ContentPackage {
  if (!pkg || typeof pkg !== 'object') return false
  const p = pkg as ContentPackage
  return Boolean(
    typeof p.id === 'string' &&
    typeof p.revision === 'string' &&
    p.review &&
    typeof p.review === 'object' &&
    Array.isArray(p.media) &&
    p.bank &&
    Array.isArray(p.bank.questions) &&
    p.bank.questions.every(
      (q) =>
        q &&
        ['id', 'prompt', 'explanation', 'takeaway'].every(
          (key) => typeof (q as unknown as Record<string, unknown>)[key] === 'string',
        ) &&
        q.provenance &&
        typeof q.provenance === 'object' &&
        Array.isArray(q.options) &&
        q.options.every(
          (o) =>
            o &&
            ['id', 'text', 'reasoning'].every(
              (key) => typeof (o as unknown as Record<string, unknown>)[key] === 'string',
            ),
        ) &&
        Array.isArray(q.skills) &&
        Array.isArray(q.grammarIds) &&
        Array.isArray(q.vocabularyIds) &&
        (q.evidence === undefined ||
          (Array.isArray(q.evidence) &&
            q.evidence.every(
              (e) =>
                e &&
                typeof e.passageId === 'string' &&
                typeof e.quote === 'string' &&
                typeof e.explanation === 'string',
            ))),
    ) &&
    Array.isArray(p.bank.stimuli) &&
    p.bank.stimuli.every(
      (s) =>
        s &&
        typeof s.id === 'string' &&
        (!('audio' in s) || (s.audio && typeof s.audio.transcript === 'string')),
    ) &&
    Array.isArray(p.bank.passages) &&
    p.bank.passages.every(
      (s) =>
        s && typeof s.id === 'string' && typeof s.text === 'string' && typeof s.title === 'string',
    ),
  )
}
export function PackageEditor({ catalog }: { catalog: StudioCatalog }) {
  const action = useAction()
  const [actor, setActor] = useState(''),
    [draftId, setDraftId] = useState('original-batch'),
    [revision, setRevision] = useState(0)
  const [pkg, setPkg] = useState<ContentPackage>(() => {
    const p = newPackage()
    p.bank.grammarIds = catalog.bank.grammarIds
    p.bank.vocabularyIds = catalog.bank.vocabularyIds
    return { ...p, editorial: draftEditorial(packageFingerprint(p), 'Local draft') }
  })
  const [json, setJson] = useState(() => JSON.stringify(pkg, null, 2)),
    [rawDirty, setRawDirty] = useState(false),
    [dirty, setDirty] = useState(false)
  const [validation, setValidation] = useState<Validation>(),
    [message, setMessage] = useState(''),
    [index, setIndex] = useState(0),
    [query, setQuery] = useState('')
  const [drafts, setDrafts] = useState<string[]>([])
  const [review, setReview] = useState({
      answerKey: false,
      distractors: false,
      language: false,
      evidence: false,
      rights: false,
    }),
    [attestation, setAttestation] = useState('')
  useEffect(() => {
    void action.run(async () => setDrafts(await studioApi<string[]>('drafts')))
  }, [])
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty || rawDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty, rawDirty])
  function change(next: ContentPackage) {
    const edited = {
      ...next,
      formatVersion: 3 as const,
      editorial: draftEditorial(packageFingerprint(next), actor.trim() || 'Local draft'),
    }
    if (pkg.editorial) edited.editorial.eligibility = { ...pkg.editorial.eligibility }
    setPkg(edited)
    setJson(JSON.stringify(edited, null, 2))
    setValidation(undefined)
    setRawDirty(false)
    setDirty(true)
    setMessage('')
    setReview({
      answerKey: false,
      distractors: false,
      language: false,
      evidence: false,
      rights: false,
    })
    setAttestation('')
  }
  function open(next: ContentPackage, id: string, rev = 0, keepRecord = false) {
    if (
      (dirty || rawDirty) &&
      !window.confirm(
        'Bản nháp còn thay đổi chưa lưu. Xuất buffer hoặc lưu trước nếu muốn giữ. Mở nội dung khác?',
      )
    )
      return
    const source = { ...structuredClone(next), formatVersion: 3 as const }
    if (!keepRecord || editorialIssues(source.editorial, packageFingerprint(source)).length) {
      source.editorial = draftEditorial(packageFingerprint(source), actor.trim() || 'Local draft')
      if ('reviewer' in source.review)
        source.review = {
          status: 'unreviewed',
          author: actor || 'Local author',
          date: new Date().toISOString().slice(0, 10),
          note: 'Imported review labels do not transfer approval to this edited draft.',
        }
    }
    setPkg(source)
    setJson(JSON.stringify(source, null, 2))
    setDraftId(id)
    setRevision(rev)
    setDirty(!keepRecord)
    setRawDirty(false)
    setIndex(0)
    setValidation(undefined)
    setMessage('')
    setQuery('')
  }
  async function validate() {
    const result = await studioApi<Validation>('validate', { package: pkg })
    setValidation(result)
    return result
  }
  async function advance() {
    const result = await validate()
    if (!result.valid)
      throw new StudyOperationError(
        'Fix validation failures and near-duplicate warnings before advancing.',
      )
    if (!actor.trim() || !pkg.editorial)
      throw new StudyOperationError('Enter the name of the person responsible for this transition.')
    const human: HumanReview = { ...review, reviewer: actor.trim(), attestation: 'human-review' }
    if (pkg.editorial.state === 'NEEDS_REVIEW' && attestation !== 'TÔI ĐÃ THẨM ĐỊNH')
      throw new StudyOperationError(
        'Human approval requires the exact attestation and all checklist items.',
      )
    try {
      const next = {
        ...pkg,
        editorial: advanceEditorial(pkg.editorial, packageFingerprint(pkg), actor, true, human),
      }
      setPkg(next)
      setJson(JSON.stringify(next, null, 2))
      setDirty(true)
    } catch (error) {
      throw new StudyOperationError(
        error instanceof Error ? error.message : 'Editorial transition failed.',
      )
    }
  }
  const usable = shape(pkg)
  const question = usable ? pkg.bank.questions[index] : undefined
  const localIssues = usable
    ? validateContentBank(pkg.bank)
    : [{ path: 'package', message: 'Use complete JSON editing to repair the bank structure.' }]
  const options = usable
    ? pkg.bank.questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => `${q.id} ${q.prompt}`.toLowerCase().includes(query.toLowerCase()))
    : []
  return (
    <section className="studio-editor">
      <h2>Authoring workspace</h2>
      <p className="muted">
        Save writes only content/studio-drafts. Export does not publish. Existing IDs are
        identities, not editable counters. Content edits reset validation and human approval.
      </p>
      <div className="studio-fields">
        <label className="form-label">
          Open installed source package
          <select
            value=""
            disabled={action.busy}
            onChange={(e) => {
              const p = catalog.packages.find((p) => p.id === e.target.value)
              if (p) open(p, p.id + '-draft')
            }}
          >
            <option value="">Select package…</option>
            {catalog.packages.map((p) => (
              <option key={p.id}>{p.id}</option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Open saved local draft
          <select
            value=""
            disabled={action.busy}
            onChange={(e) => {
              if (e.target.value)
                void action.run(async () => {
                  const d = await studioApi<StudioDraft>(
                    'draft?id=' + encodeURIComponent(e.target.value),
                  )
                  if (!shape(d.package))
                    throw new StudyOperationError(
                      'Saved draft has malformed shape. Use its JSON file directly; original retained.',
                    )
                  open(d.package, d.id, d.revision, true)
                })
            }}
          >
            <option value="">Select draft…</option>
            {drafts.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="studio-actions">
        <button
          className="button secondary"
          onClick={() => {
            const p = newPackage()
            p.bank.grammarIds = catalog.bank.grammarIds
            p.bank.vocabularyIds = catalog.bank.vocabularyIds
            open(p, 'original-batch')
          }}
        >
          New original package
        </button>
        <label className="button secondary">
          Open package JSON
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f)
                void action.run(async () => {
                  if (f.size > 5 * 1024 * 1024)
                    throw new StudyOperationError('Maximum editor file size is 5 MiB.')
                  const parsed: unknown = JSON.parse(await f.text())
                  if (!shape(parsed))
                    throw new StudyOperationError('Expected a structured content package.')
                  open(parsed, parsed.id + '-draft')
                })
              e.target.value = ''
            }}
          />
        </label>
        <button className="text-link" onClick={() => downloadJson(json, 'content-buffer')}>
          Export current JSON buffer
        </button>
      </div>
      <fieldset disabled={action.busy || rawDirty}>
        <div className="studio-fields">
          <label className="form-label">
            Draft file ID
            <input value={draftId} onChange={(e) => setDraftId(e.target.value)} />
          </label>
          <label className="form-label">
            Responsible author / reviewer
            <input value={actor} onChange={(e) => setActor(e.target.value)} />
          </label>
          <label className="form-label">
            Package ID
            <input value={pkg.id} onChange={(e) => change({ ...pkg, id: e.target.value })} />
          </label>
          <label className="form-label">
            Content revision
            <input
              value={pkg.revision}
              onChange={(e) => change({ ...pkg, revision: e.target.value })}
            />
          </label>
          <label className="form-label">
            Purpose
            <select
              value={pkg.purpose}
              onChange={(e) => change({ ...pkg, purpose: e.target.value as 'practice' | 'mock' })}
            >
              <option>practice</option>
              <option>mock</option>
            </select>
          </label>
        </div>
        <button
          className="text-link"
          onClick={() =>
            change({
              ...pkg,
              bank: {
                ...pkg.bank,
                questions: pkg.bank.questions.map((q) => ({
                  ...q,
                  provenance: { ...q.provenance, revision: pkg.revision },
                })),
                stimuli: pkg.bank.stimuli.map((s) => ({
                  ...s,
                  provenance: { ...s.provenance, revision: pkg.revision },
                })),
              },
            })
          }
        >
          Apply package revision to question/stimulus provenance in this draft
        </button>
        {usable && (
          <>
            <label className="form-label">
              Find question
              <input value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label className="form-label">
              Question ({options.length} matches; first 100 shown)
              <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
                {options.slice(0, 100).map(({ q, i }) => (
                  <option key={q.id} value={i}>
                    {q.id} · {q.prompt.slice(0, 75)}
                  </option>
                ))}
              </select>
            </label>
            {question && (
              <QuestionFields
                question={question}
                onChange={(q) =>
                  change({
                    ...pkg,
                    bank: {
                      ...pkg.bank,
                      questions: pkg.bank.questions.map((v, i) => (i === index ? q : v)),
                    },
                  })
                }
              />
            )}
            <Resources pkg={pkg} onChange={change} />
          </>
        )}
        <section className="studio-editorial">
          <h3>Editorial lifecycle · {pkg.editorial?.state ?? 'DRAFT'}</h3>
          <p>
            DRAFT → VALIDATED → NEEDS REVIEW → APPROVED → PUBLISHED. Machine validation never signs
            the human-review checklist.
          </p>
          <label className="form-label">
            Assessment eligibility
            <select
              value={pkg.editorial?.eligibility.assessment ?? 'none'}
              onChange={(e) => {
                if (pkg.editorial) {
                  const next = {
                    ...pkg,
                    editorial: {
                      ...pkg.editorial,
                      eligibility: {
                        ...pkg.editorial.eligibility,
                        assessment: e.target.value as 'none' | 'reviewed' | 'unreviewed-practice',
                      },
                    },
                  }
                  setPkg(next)
                  setJson(JSON.stringify(next, null, 2))
                  setDirty(true)
                }
              }}
            >
              <option value="none">Not eligible</option>
              <option value="reviewed">Reviewed practice assessment</option>
            </select>
          </label>
          {pkg.editorial?.state === 'NEEDS_REVIEW' && (
            <>
              <p>Only the person who actually checked this revision should approve it.</p>
              {Object.entries(review).map(([key, value]) => (
                <label key={key} className="studio-check">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setReview({ ...review, [key]: e.target.checked })}
                  />
                  I checked {key} for this exact revision.
                </label>
              ))}
              <label className="form-label">
                Type TÔI ĐÃ THẨM ĐỊNH
                <input value={attestation} onChange={(e) => setAttestation(e.target.value)} />
              </label>
            </>
          )}
          <div className="studio-actions">
            <button className="button secondary" onClick={() => void action.run(validate)}>
              Validate content & media
            </button>
            <button
              className="button secondary"
              disabled={pkg.editorial?.state === 'PUBLISHED'}
              onClick={() => void action.run(advance)}
            >
              Advance one editorial stage
            </button>
            <button
              className="button primary"
              onClick={() =>
                void action.run(async () => {
                  const d = await studioApi<StudioDraft>('draft', {
                    id: draftId,
                    package: pkg,
                    expectedRevision: revision,
                  })
                  setRevision(d.revision)
                  setDirty(false)
                  setDrafts(await studioApi<string[]>('drafts'))
                  setMessage(
                    'Draft saved to its separate local file. Active source and learner history unchanged.',
                  )
                })
              }
            >
              Save draft (file revision {revision})
            </button>
          </div>
          <details>
            <summary>Recorded editorial history</summary>
            <pre>{JSON.stringify(pkg.editorial, null, 2)}</pre>
          </details>
        </section>
      </fieldset>
      <details className="studio-json">
        <summary>Complete package JSON · add groups, resources, licensing and metadata</summary>
        <label className="form-label">
          JSON buffer
          <textarea
            spellCheck={false}
            rows={22}
            value={json}
            onChange={(e) => {
              setJson(e.target.value)
              setRawDirty(true)
            }}
          />
        </label>
        <button
          className="button secondary"
          disabled={action.busy || !rawDirty}
          onClick={() =>
            void action.run(async () => {
              let parsed: unknown
              try {
                parsed = JSON.parse(json)
              } catch {
                throw new StudyOperationError('Invalid JSON; buffer retained.')
              }
              if (!shape(parsed))
                throw new StudyOperationError(
                  'Repair the structured bank before applying. Buffer retained.',
                )
              change(parsed)
            })
          }
        >
          Apply buffer as a new DRAFT
        </button>
        <p className="small muted">
          Unapplied JSON disables form writes. Export the buffer to keep even an incomplete/invalid
          draft.
        </p>
      </details>
      <InlineError message={action.error} />
      {message && <p role="status">{message}</p>}
      {validation && (
        <section>
          <h3>
            {validation.valid
              ? 'Machine checks passed; human review still separate.'
              : 'Validation requires attention.'}
          </h3>
          <pre>{JSON.stringify(validation, null, 2)}</pre>
        </section>
      )}
      {question && localIssues.length === 0 ? (
        <QuestionPreview
          key={question.id + packageFingerprint(pkg)}
          question={question}
          bank={pkg.bank}
        />
      ) : (
        <details>
          <summary>
            Preview unavailable until structural validation succeeds ({localIssues.length})
          </summary>
          <pre>{JSON.stringify(localIssues, null, 2)}</pre>
        </details>
      )}
      <p className="notice">
        Activation is a separate CLI operation: export a validated package, run content:import for a
        dry run, then explicitly use --install. New v3 packages must reach PUBLISHED. Installed
        revisions also require --revise --acknowledge-history. No button here rewrites the active
        bank.
      </p>
    </section>
  )
}
