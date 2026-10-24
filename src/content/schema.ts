export type ToeicPart = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type OptionId = 'A' | 'B' | 'C' | 'D'
export type Skill =
  | 'word-form'
  | 'agreement'
  | 'tenses'
  | 'passive'
  | 'verb-patterns'
  | 'connectors'
  | 'conditionals'
  | 'relative-clauses'
  | 'subjunctive'
  | 'prepositions'
  | 'comparisons'
  | 'modals'
  | 'listening-intent'
  | 'listening-detail'
  | 'reading-detail'
  | 'reading-inference'
  | 'photo-detail'
  | 'listening-main-idea'
  | 'listening-inference'
  | 'visual-integration'
  | 'text-cohesion'
  | 'cross-text'

export type Topic = 'office' | 'travel' | 'training' | 'shopping' | 'facilities' | 'grammar'
interface OriginalProvenance {
  kind: 'original'
  author: string
  revision: string
  note: string
  editorialStatus?: 'ai-draft' | 'human-reviewed'
}
export type ContentProvenance =
  | OriginalProvenance
  | {
      kind: 'licensed'
      author: string
      revision: string
      note: string
      provider: string
      sourceUrl: string
      attribution: string
      license: string
      licenseUrl: string
    }
export const ORIGINAL_PROVENANCE: ContentProvenance = {
  kind: 'original',
  author: 'STUDY 990',
  revision: '2026-10-task02',
  note: 'Câu hỏi và lời giải gốc, không trích đề ETS. Chưa qua hội đồng thẩm định độc lập.',
}
export type AudioAsset =
  | { kind: 'synthetic'; transcript: string }
  | { kind: 'recording'; src: string; transcript: string; credit: string }
export type Photograph =
  | {
      status: 'ready'
      src: string
      alt: string
      author: string
      sourceUrl: string
      license: 'CC0-1.0' | 'CC-BY-4.0'
      licenseUrl: string
    }
  | { status: 'placeholder'; reason: string }
export type Exhibit =
  | { kind: 'table'; title: string; columns: string[]; rows: string[][] }
  | { kind: 'image'; title: string; src: string; alt: string; credit: string }
interface StimulusBase {
  id: string
  title: string
  topic: Topic
  provenance: ContentProvenance
}
export type Stimulus = StimulusBase &
  (
    | { kind: 'photograph'; part: 1; audio: AudioAsset; photograph: Photograph }
    | { kind: 'question-response'; part: 2; audio: AudioAsset }
    | { kind: 'conversation'; part: 3; audio: AudioAsset; exhibit?: Exhibit }
    | { kind: 'talk'; part: 4; audio: AudioAsset; exhibit?: Exhibit }
    | { kind: 'text-completion'; part: 6; passageIds: [string] }
    | { kind: 'reading'; part: 7; passageIds: string[] }
  )

export interface QuestionOption {
  id: OptionId
  text: string
  reasoning: string
}

export interface Passage {
  id: string
  title: string
  format: 'email' | 'notice' | 'article' | 'chat'
  text: string
}

/** Versioned content contract; grouped passages/media can be reused by future exam sets. */
export interface Question {
  schemaVersion: 1
  id: string
  part: ToeicPart
  prompt: string
  options: QuestionOption[]
  answer: OptionId
  explanation: string
  takeaway: string
  skills: Skill[]
  difficulty: 'foundation' | 'intermediate' | 'advanced'
  grammarIds: string[]
  vocabularyIds: string[]
  provenance: ContentProvenance
  topic: Topic
  stimulusId?: string
  blankKey?: string
  blankType?: 'word' | 'sentence'
  passageId?: string
  groupId?: string
  evidence?: { passageId: string; quote: string; explanation: string }[]
  media?: {
    audio?:
      | { kind: 'synthetic'; transcript: string }
      | { kind: 'recording'; src: string; transcript: string }
    image?: { src: string; alt: string }
  }
}
export type LegacyQuestion = Omit<Question, 'provenance' | 'topic'>

export interface VocabularyBase {
  id: string
  word: string
  ipa: string
  partOfSpeech: string
  meaning: string
  definition: string
  example: string
  translation: string
  family: string[]
  collocations: string[]
  topic: string
}

export type PronunciationLocale = 'en-US' | 'en-GB'
export type LexicalProvenance =
  | ContentProvenance
  | {
      kind: 'licensed'
      author: string
      revision: string
      note: string
      provider: string
      attribution: string
      licenseUrl: string
    }
export interface VocabularyEntry extends VocabularyBase {
  forms: string[]
  pronunciations: { locale: PronunciationLocale; ipa: string }[]
  usageNote: string
  grammarIds: string[]
  synonyms?: string[]
  antonyms?: string[]
  pronunciationText?: string
  provenance: LexicalProvenance
}

export interface GrammarBase {
  id: string
  title: string
  englishTitle: string
  summary: string
  rules: { title: string; description: string; formula: string }[]
  examples: { correct: string; incorrect: string; explanation: string }[]
  traps: string[]
  skills: Skill[]
}

export interface GrammarExercise {
  id: string
  prompt: string
  options: { id: OptionId; text: string; explanation: string }[]
  answer: OptionId
  explanation: string
}
export interface GrammarLesson extends GrammarBase {
  vocabularyIds: string[]
  questionIds: string[]
  practice: GrammarExercise[]
  provenance: ContentProvenance
}
