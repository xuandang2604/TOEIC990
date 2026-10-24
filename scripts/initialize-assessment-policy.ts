import { writeFile } from 'node:fs/promises'
import { starterQuestions } from '../src/content/questions'
import { installedPackages } from '../src/content/generated'
import { packageFingerprint, questionFingerprint } from '../src/content/editorial'
// One-time compatibility migration. Never extend this allowlist automatically on import.
await writeFile(
  'content/assessment-policy.json',
  JSON.stringify(
    {
      version: 1,
      note: 'Existing unreviewed sample practice only. This is eligibility, not human review or ETS approval. New content is ineligible by default.',
      legacyStarterIds: starterQuestions.map((q) => q.id),
      legacyPackages: installedPackages.map((p) => p.id),
      legacyPackageFingerprints: Object.fromEntries(
        installedPackages.map((p) => [p.id, packageFingerprint(p)]),
      ),
      legacyStarterFingerprints: Object.fromEntries(
        starterQuestions.map((q) => [q.id, questionFingerprint(q)]),
      ),
    },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
)
