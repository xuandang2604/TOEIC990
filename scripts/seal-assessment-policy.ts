import { readFile, writeFile, rename, rm } from 'node:fs/promises'
import { starterQuestions } from '../src/content/questions'
import { installedPackages } from '../src/content/generated'
import { packageFingerprint, questionFingerprint } from '../src/content/editorial'
// One-time sealing of Task 11's existing allowlist; never adds IDs or grants human review.
const path = 'content/assessment-policy.json'
const policy = JSON.parse(await readFile(path, 'utf8')) as {
  legacyStarterIds: string[]
  legacyPackages: string[]
  legacyPackageFingerprints?: unknown
  legacyStarterFingerprints?: unknown
}
if (policy.legacyPackageFingerprints || policy.legacyStarterFingerprints)
  throw new Error('Policy already sealed. No automatic extension permitted.')
const packages = new Map(installedPackages.map((p) => [p.id, p])),
  questions = new Map(starterQuestions.map((q) => [q.id, q]))
const result = {
  ...policy,
  legacyPackageFingerprints: Object.fromEntries(
    policy.legacyPackages.map((id) => {
      const p = packages.get(id)
      if (!p) throw new Error('Missing allowlisted package.')
      return [id, packageFingerprint(p)]
    }),
  ),
  legacyStarterFingerprints: Object.fromEntries(
    policy.legacyStarterIds.map((id) => {
      const q = questions.get(id)
      if (!q) throw new Error('Missing allowlisted question.')
      return [id, questionFingerprint(q)]
    }),
  ),
}
const temp = path + '.' + crypto.randomUUID() + '.tmp'
try {
  await writeFile(temp, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' })
  await rename(temp, path)
} finally {
  await rm(temp, { force: true })
}
