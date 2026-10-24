import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { contentBank } from '../src/content/catalog'
import { installedPackages } from '../src/content/generated'
import {
  allQuestions,
  practiceQuestions,
  mockQuestions,
  starterQuestions,
  stimuli,
} from '../src/content/questions'
import { miniExamQuestions } from '../src/domain/assessment'
import { mockExams } from '../src/content/mockExams'
import { auditContent } from '../src/content/quality'
import { inspectMediaFiles, referencedMedia } from '../build/contentFiles'
const media = await inspectMediaFiles(
  [
    ...referencedMedia(contentBank).map((path) => ({ path })),
    ...installedPackages.flatMap((p) => p.media),
  ],
  resolve('public'),
)
const audit = auditContent(
  contentBank,
  installedPackages,
  mockExams,
  allQuestions.map((q) => q.id),
  media,
  [{ id: 'starter-mini-sample', questionIds: miniExamQuestions(starterQuestions, stimuli) }],
)
const result = {
  format: 'study990.content-audit',
  version: 1,
  generatedAt: new Date().toISOString(),
  practice: practiceQuestions.length,
  reservedMock: mockQuestions.length,
  tutor: allQuestions.length - practiceQuestions.length - mockQuestions.length,
  ...audit,
}
await mkdir('docs/content', { recursive: true })
await writeFile('docs/content/task11-audit.json', JSON.stringify(result, null, 2) + '\n', 'utf8')
console.log(JSON.stringify({ ...result, statuses: undefined }, null, 2))
if (
  audit.issues.length ||
  audit.mediaFailures.length ||
  audit.nearDuplicates.length ||
  audit.incompleteExplanations.length
)
  process.exitCode = 1
