import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { packageFingerprint } from '../src/content/editorial'
import { validateContentPackage, type ContentPackage } from '../src/content/ingestion'
import { contentBank } from '../src/content/catalog'
import { installedPackages } from '../src/content/generated'

/** Prepare only new unreviewed practice releases. Does not publish manifests or touch user data. */
async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--revise')) throw new Error('Unknown preparation flag.')
  const current = structuredClone(contentBank)
  const prepared: { path: string; pkg: ContentPackage }[] = []
  const issues: { file: string; issues: unknown }[] = []
  for (let number = 2; number <= 10; number++) {
    const path = resolve(`content/full-tests2026/form-${String(number).padStart(2, '0')}.json`)
    const pkg = JSON.parse(await readFile(path, 'utf8')) as ContentPackage
    if (
      pkg.formatVersion !== 4 ||
      pkg.id !== `fulltests2026-${String(number).padStart(2, '0')}` ||
      pkg.bank.questions.length !== 200
    )
      throw new Error('Unexpected practice release identity or count.')
    pkg.practiceRelease = {
      kind: 'unreviewed-practice',
      fingerprint: packageFingerprint(pkg),
      note: 'Owner-requested original/MIT-adapted full practice. Structural checks do not establish human review, ETS equivalence, or calibrated TOEIC scores.',
    }
    const previous = installedPackages.find((p) => p.id === pkg.id)
    if (previous) {
      if (
        packageFingerprint(previous) !== packageFingerprint(pkg) &&
        (!args.includes('--revise') || previous.revision === pkg.revision)
      )
        throw new Error('Changed installed practice content requires a new revision and --revise.')
      const qids = new Set(previous.bank.questions.map((q) => q.id))
      const sids = new Set(previous.bank.stimuli.map((s) => s.id))
      const pids = new Set(previous.bank.passages.map((p) => p.id))
      current.questions = current.questions.filter((q) => !qids.has(q.id))
      current.stimuli = current.stimuli.filter((s) => !sids.has(s.id))
      current.passages = current.passages.filter((p) => !pids.has(p.id))
    }
    const found = validateContentPackage(pkg, current)
    if (found.length) issues.push({ file: path, issues: found })
    current.questions.push(...pkg.bank.questions)
    current.stimuli.push(...pkg.bank.stimuli)
    current.passages.push(...pkg.bank.passages)
    prepared.push({ path, pkg })
  }
  if (issues.length) {
    console.error(JSON.stringify(issues, null, 2))
    process.exitCode = 1
    return
  }
  for (const { path, pkg } of prepared)
    await writeFile(path, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  console.log(
    JSON.stringify({
      prepared: prepared.length,
      questions: 1800,
      humanReviewed: false,
      installed: false,
    }),
  )
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Practice preparation failed.')
  process.exitCode = 1
})
