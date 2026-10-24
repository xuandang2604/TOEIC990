import 'fake-indexeddb/auto'
import { after, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir, stat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { renderToStaticMarkup } from 'react-dom/server'
import { contentBank } from '../src/content/catalog'
import { allQuestions, practiceQuestions, questionById } from '../src/content/questions'
import { mockExams, availableMockExams } from '../src/content/mockExams'
import { installedPackages } from '../src/content/generated'
import {
  draftEditorial,
  packageFingerprint,
  advanceEditorial,
  editorialIssues,
  questionFingerprint,
  type HumanReview,
} from '../src/content/editorial'
import { validateContentPackage, type ContentPackage } from '../src/content/ingestion'
import { validateContentBank } from '../src/content/validation'
import {
  auditContent,
  assessmentEligible,
  editorialStatus,
  legacySamplePackageEligible,
  legacySampleQuestionEligible,
} from '../src/content/quality'
import { questionAssessmentEligible } from '../src/content/eligibility'
import { QuestionPreview } from '../src/dev/contentStudio/QuestionPreview'
import { StudioStore } from '../build/studioStore'
import { studioRequestAllowed } from '../build/studio'
import { inspectMediaFiles } from '../build/contentFiles'
import { activateContentBatch } from '../build/contentActivation'
import { db, StudyDatabase } from '../src/persistence/database'
import {
  createBackup,
  canonical,
  parseBackup,
  previewImport,
  commitImport,
} from '../src/persistence/backup'
import { reportContent } from '../src/application/contentFeedbackRepository'
import { reviewFeedback } from '../src/dev/contentStudio/reviewRepository'
import { validRecord } from '../src/persistence/records'
import { startSession, submitAnswer } from '../src/application/studyRepository'

const fixtures: string[] = []
async function folder() {
  const path = await mkdtemp(join(resolve('content'), '.task11-test-'))
  fixtures.push(path)
  return path
}
beforeEach(async () => {
  await db.delete()
  await db.open()
})
after(async () => {
  await db.delete()
  for (const path of fixtures) {
    assert.ok(path.startsWith(join(resolve('content'), '.task11-test-')))
    await rm(path, { recursive: true, force: true })
  }
})
function sample(): ContentPackage {
  const q = structuredClone(questionById.get('p5-efficiently')!)
  q.id = 'studio-fixture:q001'
  q.prompt =
    'The purchasing analyst described the revised allocation process ------- during the workshop.'
  q.provenance = {
    kind: 'original',
    author: 'Test fixture only',
    revision: 'r1',
    note: 'Test fixture; not learner content.',
  }
  const pkg: ContentPackage = {
    format: 'study990.content',
    formatVersion: 3,
    id: 'studio-fixture',
    revision: 'r1',
    purpose: 'practice',
    review: {
      status: 'unreviewed',
      author: 'Test fixture',
      date: '2026-10-22',
      note: 'Not an actual content review.',
    },
    media: [],
    bank: {
      questions: [q],
      stimuli: [],
      passages: [],
      grammarIds: contentBank.grammarIds,
      vocabularyIds: contentBank.vocabularyIds,
    },
  }
  pkg.editorial = draftEditorial(packageFingerprint(pkg), 'Fixture author', '2026-10-22T10:00:00Z')
  return pkg
}
const review: HumanReview = {
  reviewer: 'Human-review fixture only',
  attestation: 'human-review',
  answerKey: true,
  distractors: true,
  language: true,
  evidence: true,
  rights: true,
}
function publish(pkg: ContentPackage) {
  for (let i = 0; i < 4; i++)
    pkg.editorial = advanceEditorial(
      pkg.editorial!,
      packageFingerprint(pkg),
      'Test operator',
      true,
      review,
    )
  return pkg
}

describe('content quality and development-only authoring', () => {
  it('requires the ordered lifecycle and explicit current-content human attestation', () => {
    const p = sample(),
      fingerprint = packageFingerprint(p)
    assert.ok(validateContentPackage(p, contentBank).some((i) => i.path === 'editorial.state'))
    assert.deepEqual(validateContentPackage(p, contentBank, true), [])
    p.editorial = advanceEditorial(p.editorial!, fingerprint, 'Editor', true)
    assert.equal(editorialStatus(p).humanReviewed, false)
    p.editorial = advanceEditorial(p.editorial, fingerprint, 'Editor', true)
    assert.throws(() => advanceEditorial(p.editorial!, fingerprint, 'Editor', true))
    assert.throws(() =>
      advanceEditorial(p.editorial!, fingerprint, 'Editor', true, {
        ...review,
        distractors: false,
      }),
    )
    p.editorial = advanceEditorial(p.editorial, fingerprint, 'Editor', true, review)
    assert.equal(editorialStatus(p).humanReviewed, true)
    p.editorial = advanceEditorial(p.editorial, fingerprint, 'Editor', true)
    assert.deepEqual(editorialIssues(p.editorial, fingerprint), [])
    p.bank.questions[0].explanation += ' changed'
    assert.equal(editorialStatus(p).humanReviewed, false)
    assert.ok(validateContentPackage(p, contentBank).some((i) => i.path === 'editorial'))
    for (const value of [null, {}, { state: 'APPROVED', history: [null] }])
      assert.ok(editorialIssues(value as never, fingerprint).length)
  })
  it('does not equate legacy approval labels or validation with assessment eligibility', () => {
    assert.equal(editorialStatus(installedPackages[0]).humanReviewed, false)
    assert.equal(assessmentEligible(installedPackages[0]), false)
    assert.equal(assessmentEligible(installedPackages[0], true), true)
    assert.ok(practiceQuestions.every((q) => questionAssessmentEligible(q.id)))
    assert.equal(questionAssessmentEligible('unknown:q1'), false)
    const changed = structuredClone(installedPackages[0])
    changed.bank.questions[0].prompt += ' changed'
    assert.equal(legacySamplePackageEligible(changed), false)
    const changedStarter = structuredClone(questionById.get('p5-efficiently')!)
    changedStarter.explanation += ' changed'
    assert.equal(legacySampleQuestionEligible(changedStarter), false)
    const p = publish(sample())
    assert.equal(assessmentEligible(p), false)
    p.editorial!.eligibility.assessment = 'reviewed'
    assert.equal(assessmentEligible(p), true)
    p.bank.questions[0].answer = 'A'
    assert.equal(assessmentEligible(p), false)
  })
  it('detects correctness flags, missing reasoning, duplicate choices and unsupported evidence', () => {
    const mutations = [
      (p: ContentPackage) => {
        ;(p.bank.questions[0].options[0] as unknown as Record<string, unknown>).correct = true
      },
      (p: ContentPackage) => {
        p.bank.questions[0].answer = 'Z' as never
      },
      (p: ContentPackage) => {
        p.bank.questions[0].options[0].reasoning = ''
      },
      (p: ContentPackage) => {
        p.bank.questions[0].options[0].text = p.bank.questions[0].options[1].text
      },
      (p: ContentPackage) => {
        p.bank.questions[0].difficulty = 'expert' as never
      },
    ]
    for (const change of mutations) {
      const p = sample()
      change(p)
      assert.ok(validateContentPackage(p, contentBank, true).length)
    }
    const bank = structuredClone(contentBank),
      q = bank.questions.find((q) => q.id === 'p7-return')!
    q.evidence = [
      {
        passageId: 'library-notice',
        quote: 'Readers may return books at the service desk or renew them online.',
        explanation: 'Bằng chứng đúng nguồn.',
      },
    ]
    assert.deepEqual(validateContentBank(bank), [])
    q.evidence[0].quote = 'Invented evidence.'
    assert.ok(validateContentBank(bank).some((i) => i.path.includes('evidence')))
    const deep: Record<string, unknown> = {}
    let node = deep
    for (let i = 0; i < 40; i++) {
      node.next = {}
      node = node.next as Record<string, unknown>
    }
    assert.ok(validateContentPackage(deep, contentBank).some((i) => i.message.includes('safety')))
  })
  it('computes actual coverage and rejects invalid or media-broken assessments', () => {
    const a = auditContent(
      contentBank,
      installedPackages,
      mockExams,
      allQuestions.map((q) => q.id),
    )
    assert.equal(a.total, 452)
    assert.equal(a.valid, 452)
    assert.equal(a.usable, 452)
    assert.equal(a.humanReviewed, 0)
    assert.equal(a.requiringReview, 452)
    assert.deepEqual(
      a.byPart.map((p) => p.total),
      [13, 54, 72, 57, 118, 36, 102],
    )
    assert.equal(a.assessments.filter((e) => e.available).length, 1)
    assert.equal(availableMockExams.length, 1)
    const broken = structuredClone(contentBank)
    broken.questions.find((q) => q.id === mockExams[0].questionIds[0])!.explanation = ''
    const b = auditContent(broken, installedPackages, mockExams, [])
    assert.equal(b.assessments[0].available, false)
    assert.equal(b.incompleteExplanations.length, 1)
    const photo = contentBank.stimuli.find((s) => s.part === 1 && s.photograph.status === 'ready')!
    assert.ok(photo.part === 1 && photo.photograph.status === 'ready')
    assert.ok(
      auditContent(
        contentBank,
        installedPackages,
        mockExams,
        [],
        [{ path: photo.photograph.src, message: 'Missing' }],
      ).missingMediaQuestions.length > 0,
    )
  })
  it('uses the production renderer and shared stimulus rendering for all Parts in editor preview', () => {
    for (const part of [1, 2, 3, 4, 5, 6, 7]) {
      const q = allQuestions.find((q) => q.part === part)!
      const html = renderToStaticMarkup(<QuestionPreview question={q} bank={contentBank} />)
      assert.ok(html.includes('Production renderer preview'))
      assert.ok(html.includes('question-block'))
      assert.ok(!html.includes('feedback-panel'))
      if (q.stimulusId) assert.ok(html.includes('shared-stimulus'))
    }
  })
  it('persists separate authoring drafts, rejects stale saves and keeps old bytes intact', async () => {
    const path = await folder()
    await mkdir(join(path, 'content'))
    const store = new StudioStore(path),
      pkg = sample()
    const first = await store.save('author-draft', pkg, 0)
    assert.equal(first.revision, 1)
    assert.equal(canonical((await store.load('author-draft'))?.package), canonical(pkg))
    const before = await readFile(join(path, 'content/studio-drafts/author-draft.json'), 'utf8')
    await assert.rejects(store.save('author-draft', { changed: true }, 0), /changed/)
    assert.equal(
      await readFile(join(path, 'content/studio-drafts/author-draft.json'), 'utf8'),
      before,
    )
    await assert.rejects(store.save('../escape', pkg, 0), /Invalid draft ID/)
    const raced = await Promise.allSettled([
      store.save('author-draft', pkg, 1),
      store.save('author-draft', pkg, 1),
    ])
    assert.equal(raced.filter((r) => r.status === 'fulfilled').length, 1)
    assert.deepEqual(await store.list(), ['author-draft'])
  })
  it('isolates local draft operations from cross-origin and non-loopback callers', () => {
    assert.equal(studioRequestAllowed('127.0.0.1:5173', undefined, '127.0.0.1'), true)
    assert.equal(
      studioRequestAllowed('127.0.0.1:5173', 'http://127.0.0.1:5173', '127.0.0.1', true),
      true,
    )
    assert.equal(
      studioRequestAllowed('attacker.test:5173', 'http://attacker.test:5173', '127.0.0.1', true),
      false,
    )
    assert.equal(
      studioRequestAllowed('127.0.0.1:5173', 'https://external.test', '127.0.0.1', true),
      false,
    )
    assert.equal(studioRequestAllowed('127.0.0.1:5173', undefined, '192.168.1.5'), false)
    assert.equal(studioRequestAllowed('127.0.0.1:5173', undefined, '127.0.0.1', true), false)
  })
  it('checks missing, unsafe, empty and checksum-mismatched media files', async () => {
    const path = await folder()
    await mkdir(join(path, 'media'))
    await writeFile(join(path, 'media/sample.mp3'), 'fixture bytes')
    assert.deepEqual(await inspectMediaFiles([{ path: '/media/sample.mp3' }], path), [])
    assert.equal(
      (
        await inspectMediaFiles(
          [
            { path: '/media/absent.mp3' },
            { path: '/media/../escape' },
            { path: '/media/sample.mp3', sha256: '0'.repeat(64) },
          ],
          path,
        )
      ).length,
      3,
    )
  })
  it('keeps the active registry unchanged if staged activation fails, then safely reuses immutable staging', async () => {
    const path = await folder(),
      packages = join(path, 'packages'),
      registry = join(path, 'index.ts')
    await writeFile(registry, 'original active registry\n')
    const p = publish(sample())
    await assert.rejects(
      activateContentBatch(packages, registry, [], [p], {}, async () => {
        throw new Error('simulated interrupted activation')
      }),
      /interrupted/,
    )
    assert.equal(await readFile(registry, 'utf8'), 'original active registry\n')
    assert.equal((await readdir(packages)).filter((f) => f.endsWith('.json')).length, 1)
    await activateContentBatch(packages, registry, [], [p])
    assert.ok((await readFile(registry, 'utf8')).includes('studio-fixture--'))
    assert.equal((await readdir(packages)).length, 1)
  })
  it('rejects an invalid batch install without changing the real active registry or opening learner storage', async () => {
    const path = await folder(),
      valid = join(path, 'valid.json'),
      bad = join(path, 'bad.json')
    const pkg = publish(sample())
    await writeFile(valid, JSON.stringify(pkg))
    await writeFile(bad, '{"format":"invalid"}')
    const registry = resolve('src/content/generated/index.ts'),
      before = await readFile(registry, 'utf8')
    const report = 'task11-negative-' + crypto.randomUUID()
    try {
      await assert.rejects(
        promisify(execFile)(
          process.execPath,
          [
            '--import',
            'tsx',
            'scripts/import-content.ts',
            valid,
            bad,
            '--install',
            '--report-name=' + report,
          ],
          { cwd: process.cwd(), maxBuffer: 2 * 1024 * 1024 },
        ),
        (e: unknown) => Boolean(e && typeof e === 'object' && 'code' in e && e.code === 1),
      )
      assert.equal(await readFile(registry, 'utf8'), before)
      const result = JSON.parse(await readFile(resolve('docs/content', report + '.json'), 'utf8'))
      assert.equal(result.status, 'rejected')
      assert.equal(result.installedNew, 0)
    } finally {
      await rm(resolve('docs/content', report + '.json'), { force: true })
    }
    await assert.rejects(stat(resolve('.content-import.lock')), (e: unknown) =>
      Boolean(e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT'),
    )
  })
  it('preserves version-linked learner reports and review history without changing attempts or schedules', async () => {
    const q = questionById.get('p5-efficiently')!,
      session = await startSession('practice', [q.id])
    await submitAnswer(session.id, q.id, 'A', 3)
    const before = await createBackup(db)
    await reportContent(q, 'wording', 'Cần làm rõ ý định của câu.', 'report-fixture')
    await reportContent(q, 'wording', 'Cần làm rõ ý định của câu.', 'report-fixture')
    const row = await db.contentFeedback.get('report-fixture')
    assert.equal(row?.fingerprint, questionFingerprint(q))
    assert.equal(row?.snapshot.answer, q.answer)
    await reviewFeedback('report-fixture', 'triaged', 'Đối chiếu bản chụp trước khi sửa source.', 1)
    await assert.rejects(
      reviewFeedback('report-fixture', 'resolved', 'A stale update.', 1),
      /tab khác/,
    )
    const after = await createBackup(db)
    for (const table of ['attempts', 'cards', 'reviewEvents', 'skillEvidence'] as const)
      assert.equal(canonical(before.data[table]), canonical(after.data[table]))
    assert.equal(after.data.contentFeedback.length, 1)
    assert.equal(after.data.contentFeedback[0].history.length, 2)
    const target = new StudyDatabase('feedback-backup-' + crypto.randomUUID())
    try {
      const candidate = await parseBackup(JSON.stringify(after))
      await commitImport(target, await previewImport(target, candidate, 'replace'))
      assert.equal(
        canonical(await target.contentFeedback.toArray()),
        canonical(after.data.contentFeedback),
      )
    } finally {
      await target.delete()
    }
    assert.equal(
      validRecord('contentFeedback', {
        ...after.data.contentFeedback[0],
        contentRevision: 'wrong',
      }),
      false,
    )
  })
})
