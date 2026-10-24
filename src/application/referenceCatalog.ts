import { grammar } from '../content/grammar'
import { practiceQuestions as questions, stimulusFor } from '../content/questions'
import { SKILL_LABELS } from '../domain/learning'
import { vocabularyDocuments } from '../providers/dictionary'
import { createReferenceIndex } from '../domain/referenceSearch'
import { microLessons } from '../content/microLessons'

export const searchReferences = createReferenceIndex([
  ...vocabularyDocuments,
  ...grammar.map((lesson) => ({
    key: `grammar:${lesson.id}`,
    kind: 'grammar' as const,
    id: lesson.id,
    title: lesson.title,
    description: lesson.englishTitle,
    label: 'Ngữ pháp',
    aliases: microLessons
      .filter((micro) => micro.lessonId === lesson.id)
      .map((micro) => micro.title),
    keywords: `${lesson.summary} ${lesson.rules.map((r) => `${r.title} ${r.description} ${r.formula}`).join(' ')} ${lesson.traps.join(' ')}`,
  })),
  ...questions.map((question) => ({
    key: `reference:${question.id}`,
    kind: 'reference' as const,
    id: question.id,
    title: question.prompt,
    description: stimulusFor(question)?.title ?? 'Câu luyện tập tự biên soạn',
    label: `Part ${question.part}`,
    aliases: [],
    // Never index solutions, choices, transcripts or explanations in quick search.
    keywords: `${question.topic} ${question.skills.map((skill) => SKILL_LABELS[skill]).join(' ')} ${question.grammarIds.join(' ')} ${question.vocabularyIds.join(' ')}`,
  })),
])
