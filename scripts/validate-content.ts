import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { contentBank, contentIssues } from '../src/content/catalog'
import { validateContentPackage, type ContentPackage } from '../src/content/ingestion'
import {
  practiceQuestions,
  mockQuestions,
  starterQuestions,
  questions,
} from '../src/content/questions'
import { availableMockExams } from '../src/content/mockExams'
import { findNearDuplicates } from '../src/content/similarity'
import { inspectMediaFiles, referencedMedia } from '../build/contentFiles'
import { installedPackages } from '../src/content/generated'

async function main() {
  const file = process.argv[2]
  if (!file) {
    const near = findNearDuplicates(contentBank)
    const mediaIssues = await inspectMediaFiles(
      [
        ...referencedMedia(contentBank).map((path) => ({ path })),
        ...installedPackages.flatMap((p) => p.media),
      ],
      resolve('public'),
    )
    console.log(
      JSON.stringify(
        {
          kind: 'bundled-content',
          questionsIncludingTutor: contentBank.questions.length,
          originalPractice: starterQuestions.length,
          availablePractice: practiceQuestions.length,
          reservedMockQuestions: mockQuestions.length,
          completeMockSets: availableMockExams.length,
          byPart: [1, 2, 3, 4, 5, 6, 7].map((part) => ({
            part,
            practice: practiceQuestions.filter((q) => q.part === part).length,
            mock: mockQuestions.filter((q) => q.part === part).length,
            total: questions.filter((q) => q.part === part).length,
          })),
          nearDuplicates: near,
          issues: [...contentIssues, ...mediaIssues],
        },
        null,
        2,
      ),
    )
    if (contentIssues.length || mediaIssues.length || near.length) process.exitCode = 1
    return
  }
  if ((await stat(file)).size > 10 * 1024 * 1024) throw new Error('Content JSON exceeds 10 MB.')
  const input: unknown = JSON.parse(await readFile(file, 'utf8'))
  const issues = validateContentPackage(input, contentBank)
  if (!issues.length) {
    issues.push(...(await inspectMediaFiles((input as ContentPackage).media, resolve('public'))))
  }
  console.log(
    JSON.stringify(
      {
        kind: 'content-package',
        issues,
        status: issues.length ? 'rejected' : 'structure-and-files-valid',
        note: 'No files installed. Human approval metadata does not prove semantic accuracy or licensing rights.',
      },
      null,
      2,
    ),
  )
  if (issues.length) process.exitCode = 1
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Content validation failed.')
  process.exitCode = 1
})
