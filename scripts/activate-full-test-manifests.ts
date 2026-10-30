import { readFile, writeFile, rename, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { mockExamIssues, type MockExam } from '../src/domain/contentInventory'
import { questionAssessmentEligible } from '../src/content/eligibility'
import { mockBankIssues } from '../src/content/mockExams'
import { questions, stimuli } from '../src/content/questions'

async function main() {
  const args = process.argv.slice(2)
  if (args.some((a) => !['--revise', '--acknowledge-history'].includes(a)))
    throw new Error('Unknown manifest activation flag.')
  const target = resolve('content/mock-exams.json')
  const existing = JSON.parse(await readFile(target, 'utf8')) as MockExam[]
  const additions = JSON.parse(
    await readFile('content/full-tests2026/mock-manifests.json', 'utf8'),
  ) as MockExam[]
  if (additions.length !== 9) throw new Error('Expected nine prepared additions.')
  const merged = [...existing]
  for (const exam of additions) {
    if (
      !/^fulltests2026-(?:0[2-9]|10)$/.test(exam.id) ||
      exam.editorialStatus !== 'ai-draft' ||
      exam.eligibility !== 'unreviewed-practice'
    )
      throw new Error('Unexpected unreviewed-practice manifest.')
    const issues = [
      ...mockExamIssues(exam, questions, stimuli),
      ...mockBankIssues(exam).map((i) => i.message),
    ]
    if (issues.length || !exam.questionIds.every(questionAssessmentEligible))
      throw new Error(`Cannot activate ${exam.id}: ${issues.join('; ') || 'Package not eligible.'}`)
    const previous = merged.find((e) => e.id === exam.id)
    if (previous && JSON.stringify(previous) !== JSON.stringify(exam)) {
      if (
        !args.includes('--revise') ||
        !args.includes('--acknowledge-history') ||
        previous.revision === exam.revision ||
        previous.questionIds.join('|') !== exam.questionIds.join('|')
      )
        throw new Error(
          'Manifest corrections require a new revision, stable question order and --revise --acknowledge-history.',
        )
      // Existing scores are not regraded; installed package revisions remain archived.
      merged[merged.indexOf(previous)] = exam
    }
    if (!previous) merged.push(exam)
  }
  const ids = merged.flatMap((e) => e.questionIds)
  if (new Set(ids).size !== ids.length)
    throw new Error('Repeated question IDs across full forms. Manifest activation stopped.')
  const temp = target + '.' + crypto.randomUUID() + '.tmp'
  try {
    await writeFile(temp, JSON.stringify(merged, null, 2) + '\n', { flag: 'wx' })
    await rename(temp, target)
  } finally {
    await rm(temp, { force: true })
  }
  console.log(
    JSON.stringify({
      completeMockExams: merged.length,
      questions: ids.length,
      uniqueQuestionIds: new Set(ids).size,
      learnerDataModified: false,
    }),
  )
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Manifest activation failed.')
  process.exitCode = 1
})
