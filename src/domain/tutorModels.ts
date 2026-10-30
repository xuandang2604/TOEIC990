import type { ContentProvenance, GrammarLesson, OptionId, Question, Skill } from '../content/schema'
import type { QuestionDesign } from '../content/questionDesign'

export type TeachingMode = 'simple' | 'steps' | 'distractors' | 'example' | 'check'
export const TEACHING_MODES: { id: TeachingMode; label: string }[] = [
  { id: 'simple', label: 'Nói đơn giản' },
  { id: 'steps', label: 'Từng bước' },
  { id: 'distractors', label: 'Vì sao đáp án khác sai?' },
  { id: 'example', label: 'Một ví dụ khác' },
  { id: 'check', label: 'Kiểm tra cách hiểu' },
]
export type RevisionStance = 'changed' | 'confirmed' | 'uncertain'
export interface TutorReason {
  id: string
  label: string
  response: string
  followUp: string
}
export interface TutorLesson {
  id: string
  grammarId: string
  questionIds: string[]
  transferIds: string[]
  skills: Skill[]
  cue: string
  simple: string
  steps: string[]
  reasons: TutorReason[]
  example: { sentence: string; explanation: string; changed: string; contrast: string }
  prompts: {
    why: string
    rule: string
    simplify: string
    change: string
    exception: string
    apply: string
  }
  provenance: ContentProvenance
}
export interface TutorSection {
  title: string
  paragraphs: string[]
  steps?: string[]
}
export interface TutorGuidance {
  schemaVersion: 1
  providerId: string
  questionId: string
  contentRevision: string
  lessonId: string | null
  lessonRevision: string | null
  reasonId: string | null
  basis: 'selected-reason' | 'answer-reference'
  observation: string
  followUp: string
  sections: Record<TeachingMode, TutorSection>
}
export interface TutorConversationItem {
  role: 'learner' | 'guide'
  kind: 'explanation' | 'revision' | 'guidance'
  text: string
}
/** Explicitly selected evidence is distinct from untrusted, arbitrary free text. */
export interface TutorContext {
  schemaVersion: 1
  question: Question
  /** Optional authored reference, pinned to this exact question and shared stimulus. */
  analysis?: QuestionDesign
  answer: { selected: OptionId | null; correct: boolean; confidence: 1 | 2 | 3 | null }
  knowledge: GrammarLesson[]
  lesson: TutorLesson | null
  explanation: { text: string; reasonId: string | null }
  conversation: TutorConversationItem[]
  privacy: { storage: 'device-only' | 'consented-backend'; networkConsent: boolean }
}
export interface TutorLearningState {
  schemaVersion: 1
  revision: number
  explanationId: string
  revisionId?: string
  updatedAt: number
}
interface TutorTurnBase {
  id: string
  reflectionId: string
  createdAt: number
  text: string
}
export type TutorTurn =
  | (TutorTurnBase & { kind: 'legacy-explanation' })
  | (TutorTurnBase & { kind: 'explanation'; reasonId: string | null; guidance: TutorGuidance })
  | (TutorTurnBase & { kind: 'revision'; explanationId: string; stance: RevisionStance })
export interface TutorDraft {
  id: string
  reflectionId: string
  phase: 'explanation' | 'revision'
  baseRevision: number
  version: number
  text: string
  reasonId: string | null
  stance: RevisionStance
  updatedAt: number
  recoveryOf?: string
  ownerId?: string
}
