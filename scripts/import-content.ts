import { activateContentBatch } from '../build/contentActivation'
import { readFile, stat, writeFile, rmdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { resolveConfig } from 'prettier'
import { mockExamIssues, type MockExam } from '../src/domain/contentInventory'
import mockSets from '../content/mock-exams.json'
import { mkdir } from 'node:fs/promises'
import { validateContentPackage, type ContentPackage } from '../src/content/ingestion'
import { findNearDuplicates } from '../src/content/similarity'
import { validateContentBank, type ContentBank } from '../src/content/validation'
import { inspectMediaFiles } from '../build/contentFiles'

/** All-input preflight; immutable package files are written before one atomic registry activation. No learner DB access. */
async function run() {
  // Read the active registry only after owning the source-writer lock.
  const { contentBank } = await import('../src/content/catalog')
  const { installedPackages } = await import('../src/content/generated')
  const config = (await resolveConfig('src/content/generated/index.ts')) ?? {}
  const args = process.argv.slice(2)
  const install = args.includes('--install')
  const revise = args.includes('--revise')
  const acknowledgeHistory = args.includes('--acknowledge-history')
  if (
    args.some(
      (a) =>
        a.startsWith('--') &&
        !['--install', '--revise', '--acknowledge-history'].includes(a) &&
        !a.startsWith('--report-name='),
    )
  )
    throw new Error('Unknown importer flag.')
  const reportName =
    args.find((a) => a.startsWith('--report-name='))?.slice('--report-name='.length) ??
    'import-report'
  if (!/^[a-z0-9-]+$/.test(reportName))
    throw new Error('Report name must be a lowercase filename slug.')
  const revised = new Set<string>()
  const files = args.filter((a) => !a.startsWith('--'))
  if (!files.length)
    throw new Error(
      'Supply one or more content package JSON files. Add --install to activate a valid batch.',
    )
  const current: ContentBank = structuredClone(contentBank)
  const accepted: { file: string; pkg: ContentPackage; digest: string }[] = []
  const report: { file: string; status: string; questions?: number; issues?: unknown }[] = []
  const known = new Map(installedPackages.map((p) => [p.id, p]))
  const supplied = new Set<string>()
  const digest = (p: unknown) => createHash('sha256').update(JSON.stringify(p)).digest('hex')
  async function inspectMedia(pkg: ContentPackage) {
    return inspectMediaFiles(pkg.media, resolve('public'))
  }
  for (const file of files) {
    if ((await stat(file)).size > 10 * 1024 * 1024) throw new Error('Package JSON exceeds 10 MiB.')
    const input: unknown = JSON.parse(await readFile(file, 'utf8'))
    if (!input || typeof input !== 'object') {
      report.push({ file, status: 'rejected', issues: ['Expected a package object.'] })
      continue
    }
    const pkg = input as ContentPackage
    if (supplied.has(pkg.id))
      throw new Error(`Duplicate package in batch: ${pkg.id}. No activation performed.`)
    supplied.add(pkg.id)
    const previous = known.get(pkg.id)
    if (previous) {
      if (digest(previous) === digest(pkg)) {
        const mediaIssues = await inspectMedia(pkg)
        report.push({
          file,
          status: mediaIssues.length ? 'rejected' : 'unchanged',
          questions: pkg.bank.questions.length,
          ...(mediaIssues.length ? { issues: mediaIssues } : {}),
        })
        continue
      }
      if (!revise || previous.revision === pkg.revision)
        throw new Error(
          `Changed installed package ${pkg.id}: a new revision and explicit --revise are required.`,
        )
      if (install && !acknowledgeHistory)
        throw new Error(
          'Installed revisions require --acknowledge-history after reviewing a dry-run impact report. Saved attempts are not regraded; historical shared media may require the archived revision.',
        )
      if (
        !pkg.bank ||
        !Array.isArray(pkg.bank.questions) ||
        previous.bank.questions.some((q) => !pkg.bank.questions.some((n) => n.id === q.id))
      )
        throw new Error('Revision cannot remove historical question IDs.')
      for (const key of ['stimuli', 'passages'] as const)
        if (
          !Array.isArray(pkg.bank[key]) ||
          previous.bank[key].some((row) => !pkg.bank[key].some((n) => n.id === row.id))
        )
          throw new Error('Revision cannot remove historical stimulus or passage IDs.')
      revised.add(pkg.id)
      const qids = new Set(previous.bank.questions.map((q) => q.id)),
        sids = new Set(previous.bank.stimuli.map((s) => s.id)),
        pids = new Set(previous.bank.passages.map((p) => p.id))
      current.questions = current.questions.filter((q) => !qids.has(q.id))
      current.stimuli = current.stimuli.filter((s) => !sids.has(s.id))
      current.passages = current.passages.filter((p) => !pids.has(p.id))
    }
    const issues = validateContentPackage(input, current)
    if (install && pkg.formatVersion === 3 && pkg.editorial?.state !== 'PUBLISHED')
      issues.push({
        path: 'editorial',
        message:
          'Only PUBLISHED version-3 packages can be activated. Dry-run remains available earlier.',
      })
    if (
      install &&
      pkg.formatVersion === 3 &&
      (pkg.purpose === 'practice'
        ? !pkg.editorial?.eligibility.practice
        : pkg.editorial?.eligibility.assessment === 'none')
    )
      issues.push({
        path: 'editorial.eligibility',
        message:
          'The activated package needs explicit eligibility for its intended practice/assessment use.',
      })
    if (!issues.length) issues.push(...(await inspectMedia(pkg)))
    if (issues.length) {
      report.push({ file, status: 'rejected', issues })
      continue
    }
    current.questions.push(...pkg.bank.questions)
    current.passages.push(...pkg.bank.passages)
    current.stimuli.push(...pkg.bank.stimuli)
    accepted.push({ file, pkg, digest: digest(pkg) })
    known.set(pkg.id, pkg)
    report.push({
      file,
      status: 'validated-ai-draft-or-declared-review',
      questions: pkg.bank.questions.length,
    })
  }
  const near = findNearDuplicates(current)
  const bankIssues = validateContentBank(current)
  const examIssues = (mockSets as MockExam[]).flatMap((exam) =>
    mockExamIssues(exam, current.questions, current.stimuli),
  )
  const rejected =
    bankIssues.length > 0 ||
    examIssues.length > 0 ||
    report.some((r) => r.status === 'rejected') ||
    near.length > 0
  if (install && !rejected) {
    await activateContentBatch(
      resolve('src/content/generated/packages'),
      resolve('src/content/generated/index.ts'),
      installedPackages,
      accepted.map((item) => item.pkg),
      config,
    )
  }
  const output = {
    format: 'study990.import-report',
    version: 1,
    status: rejected ? 'rejected' : install ? 'activated' : 'validated-only',
    installedNew:
      install && !rejected
        ? accepted
            .filter((a) => !revised.has(a.pkg.id))
            .reduce((n, a) => n + a.pkg.bank.questions.length, 0)
        : 0,
    candidateByPartIncludingTutor: [1, 2, 3, 4, 5, 6, 7].map((part) => ({
      part,
      count: current.questions.filter((q) => q.part === part).length,
    })),
    revisedPackages: [...revised],
    historyAcknowledged: acknowledgeHistory,
    revisionImpact: accepted
      .filter((a) => revised.has(a.pkg.id))
      .map((a) => {
        const old = installedPackages.find((p) => p.id === a.pkg.id)!
        return {
          id: a.pkg.id,
          from: old.revision,
          to: a.pkg.revision,
          oldDigest: digest(old),
          newDigest: a.digest,
          changedQuestionIds: a.pkg.bank.questions
            .filter(
              (q) =>
                JSON.stringify(q) !== JSON.stringify(old.bank.questions.find((n) => n.id === q.id)),
            )
            .map((q) => q.id),
          changedStimulusIds: a.pkg.bank.stimuli
            .filter(
              (s) =>
                JSON.stringify(s) !== JSON.stringify(old.bank.stimuli.find((n) => n.id === s.id)),
            )
            .map((s) => s.id),
          changedPassageIds: a.pkg.bank.passages
            .filter(
              (s) =>
                JSON.stringify(s) !== JSON.stringify(old.bank.passages.find((n) => n.id === s.id)),
            )
            .map((s) => s.id),
        }
      }),
    packages: report,
    examIssues,
    bankIssues,
    nearDuplicates: near,
    note: 'AI drafts are not human-reviewed. No IndexedDB or user history was changed.',
  }
  await mkdir('docs/content', { recursive: true })
  await writeFile(`docs/content/${reportName}.json`, JSON.stringify(output, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify(output, null, 2))
  if (rejected) process.exitCode = 1
}
async function main() {
  const lock = resolve('.content-import.lock')
  try {
    await mkdir(lock)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')
      throw new Error(
        'Content writer lock exists. Check for an active importer; remove a stale empty lock only after it has stopped.',
      )
    throw error
  }
  try {
    await run()
  } finally {
    await rmdir(lock)
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Content import failed.')
  process.exitCode = 1
})
