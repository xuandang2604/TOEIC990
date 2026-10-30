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
import { handbookGuides } from './handbook'
import { validateHandbook } from './handbook/validation'
import { validateVocabularyBands } from './vocabularyBands'
import { validateListeningTranslations } from './listeningTranslations'
import { validateCurriculum } from './curriculum'
import { validateQuestionDesigns } from './questionDesign'
import { officialSourceIssues } from './officialSources'
import { practiceReleaseIssues } from './ingestion'

/** Validate once before any learning route can consume the bundled bank. No data is deleted on failure. */
export const contentBank = {
  questions: allQuestions,
  passages,
  stimuli,
  grammarIds: grammar.map((g) => g.id),
  vocabularyIds: vocabulary.map((v) => v.id),
}
export const contentIssues = [
  ...installedPackages.flatMap(practiceReleaseIssues),
  ...officialSourceIssues(grammar.map((lesson) => lesson.id)),
  ...validateQuestionDesigns(allQuestions, stimuli, passages),
  ...validateCurriculum(grammar.map((lesson) => lesson.id)),
  ...validateVocabularyBands(vocabulary),
  ...validateListeningTranslations(stimuli, allQuestions),
  ...validateHandbook(grammar, handbookGuides),
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
