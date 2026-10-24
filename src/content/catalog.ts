import { allQuestions, passages, stimuli } from './questions'
import { grammar } from './grammar'
import { vocabulary } from './vocabulary'
import { validateContentBank } from './validation'
import { validateReferences } from './referenceValidation'
import { validateSkillTaxonomy } from '../domain/skillTaxonomy'
import { knowledgePrompts } from './knowledgeCards'
import { tutorLessons } from './tutorLessons'
import { validateTutorLessons } from './tutorValidation'
import { mockIssues } from './mockExams'
import { installedPackages } from './generated'
import { editorialIssues, packageFingerprint } from './editorial'

/** Validate once before any learning route can consume the bundled bank. No data is deleted on failure. */
export const contentBank = {
  questions: allQuestions,
  passages,
  stimuli,
  grammarIds: grammar.map((g) => g.id),
  vocabularyIds: vocabulary.map((v) => v.id),
}
export const contentIssues = [
  ...installedPackages
    .filter((p) => p.formatVersion === 3)
    .flatMap((p) =>
      [
        ...editorialIssues(p.editorial, packageFingerprint(p)),
        ...(p.editorial?.state !== 'PUBLISHED'
          ? ['Installed version-3 content must be PUBLISHED.']
          : []),
      ].map((message) => ({ path: `packages.${p.id}.editorial`, message })),
    ),
  ...mockIssues,
  ...validateTutorLessons(
    tutorLessons,
    allQuestions,
    grammar.map((g) => g.id),
  ),
  ...validateSkillTaxonomy(),
  ...grammar
    .filter((g) => !knowledgePrompts[g.id]?.trim())
    .map((g) => ({ path: `knowledge.${g.id}`, message: 'Missing authored recall prompt.' })),
  ...validateContentBank(contentBank),
  ...validateReferences(
    { vocabulary, grammar },
    allQuestions.map((q) => q.id),
  ),
]
