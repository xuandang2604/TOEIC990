import type { OptionId, Question, Skill, ToeicPart } from '../content/schema'
import type { TutorLearningState } from './tutorModels'
import type { LearningProfile, VocabularyReminder } from './roadmap'

export type Confidence = 1 | 2 | 3
export type SessionKind = 'daily' | 'practice' | 'review' | 'tutor' | 'mini-exam'
export type PracticeMode = 'study' | 'exam'
export type ReviewGrade = 1 | 3 | 4 | 5
export type Theme = 'system' | 'light' | 'dark'
export type StudyMinutes = 10 | 20 | 40
export type ConfidenceSource = 'explicit' | 'not-provided' | 'legacy-unspecified'

export interface Preferences {
  id: 'preferences'
  dailyGoal: number
  targetScore: number
  theme: Theme
  studyMinutes: StudyMinutes
  learningProfile?: LearningProfile
  vocabularyReminder?: VocabularyReminder
}
export interface StudySession {
  id: string
  kind: SessionKind
  mode: PracticeMode
  questionIds: string[]
  cursor: number
  status: 'active' | 'completed' | 'interrupted'
  startedAt: number
  completedAt?: number
  interruptedAt?: number
  interruptionReason?: 'content-unavailable' | 'app-update'
  deadlineAt?: number
  lastObservedAt?: number
  finishReason?: 'submitted' | 'timeout'
  readingStarted?: boolean
  dailyPlanId?: string
  mockExamId?: string
}
export interface Attempt {
  id: string
  sessionId: string
  questionId: string
  selected: OptionId | null
  correct: boolean
  confidence: Confidence | null
  confidenceSource?: ConfidenceSource
  mode?: PracticeMode
  timeSpentMs?: number | null
  questionSnapshot?: QuestionSnapshot
  occurredAt: number
  source: SessionKind
}
export interface ExamResponse {
  id: string
  sessionId: string
  questionId: string
  selected: OptionId
  updatedAt: number
}
export function isAnsweredAttempt(attempt: Attempt): attempt is Attempt & { selected: OptionId } {
  return attempt.selected !== null
}
export interface PlaybackRecord {
  id: string
  sessionId: string
  stimulusId: string
  token: string
  status: 'started' | 'completed' | 'failed'
  playCount: number
  assisted: boolean
  updatedAt: number
  error?: 'media' | 'interrupted' | 'skipped'
}
export interface ReviewCard {
  id: string
  kind: 'question' | 'vocabulary' | 'knowledge'
  contentId: string
  dueAt: number
  intervalDays: number
  ease: number
  repetitions: number
  lapses: number
  createdAt: number
  lastReviewedAt?: number
  firstEncounterAt?: number
  scheduler?: SchedulerState
}
/** Versioned numeric state; dates stay JSON-safe, never platform-specific Date instances. */
export interface SchedulerState {
  algorithm: 'ts-fsrs-5.4.2'
  parameters: 'study990-fsrs-v1'
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  learningSteps: number
  reps: number
  lapses: number
  state: 0 | 1 | 2 | 3
  lastReviewAt?: number
}
export interface ReviewEvent {
  id: string
  cardId: string
  grade: ReviewGrade
  occurredAt: number
  nextDueAt: number
  source?:
    | 'question-review'
    | 'practice-retrieval'
    | 'practice-error'
    | 'vocabulary-recall'
    | 'knowledge-recall'
    | 'legacy'
  algorithm?: 'ts-fsrs-5.4.2' | 'legacy-sm2'
  before?: SchedulerState
  after?: SchedulerState
  previousDueAt?: number
  ratingSource?: 'answer-and-confidence' | 'answer' | 'self-report' | 'legacy'
}
export interface TutorReflection {
  id: string
  attemptId: string
  questionId: string
  reasoning: string
  createdAt: number
  transferSessionId?: string
  tutor?: TutorLearningState
}
export interface RecentSearch {
  id: string
  query: string
  lastUsedAt: number
}
export interface StudyDraft {
  id: string
  sessionId: string
  questionId: string
  selected: OptionId | null
  confidence: Confidence | null
  confidenceSource?: ConfidenceSource
  updatedAt: number
}
export const DEFAULT_PREFERENCES: Preferences = {
  id: 'preferences',
  dailyGoal: 6,
  targetScore: 990,
  theme: 'system',
  studyMinutes: 20,
}

export interface QuestionSnapshot {
  content?: Question
  part: ToeicPart
  difficulty: Question['difficulty']
  skills: Skill[]
  correctOption: OptionId
  revision: string
  origin: 'at-answer' | 'legacy-current-content'
}
export interface SkillEvidence {
  id: string
  attemptId: string
  questionId: string
  sessionId: string | null
  skillId: Skill
  part: ToeicPart | null
  difficulty: Question['difficulty'] | null
  outcome: 'correct' | 'incorrect' | 'omitted'
  occurredAt: number
  confidence: Confidence | null
  timeSpentMs: number | null
  origin: QuestionSnapshot['origin']
  source?: 'question' | 'grammar-practice'
  reference?: GrammarReferenceSnapshot
}
export interface GrammarReferenceSnapshot {
  lessonId: string
  exerciseId: string
  prompt: string
  options: { id: OptionId; text: string; explanation: string }[]
  selected: OptionId
  answer: OptionId
  explanation: string
  revision: string
}
export type ErrorCategory =
  | 'knowledge-gap'
  | 'misapplied-rule'
  | 'possible-guess'
  | 'time-pressure'
  | 'unclassified'
  | 'sentence-structure'
  | 'vocabulary-confusion'
  | 'misheard'
  | 'distractor-confusion'
export interface MistakeRecord {
  id: string
  sessionId: string | null
  questionId: string
  skills: Skill[]
  selected: OptionId | null
  correctOption: OptionId
  occurredAt: number
  timeSpentMs: number | null
  confidence: Confidence | null
  revision: string
  origin: QuestionSnapshot['origin']
  omitted: boolean
  reference?: GrammarReferenceSnapshot
}
export interface MistakeAnnotation {
  id: string
  category: ErrorCategory
  updatedAt: number
}
export interface QuestionTiming {
  id: string
  sessionId: string
  questionId: string
  elapsedMs: number
  updatedAt: number
}
export interface TimingLease {
  id: 'foreground'
  ownerId: string
  sessionId: string
  questionId: string
  checkpointAt: number
  expiresAt: number
}
export interface DailyPlan {
  id: string
  version: 1
  createdAt: number
  minutes: StudyMinutes
  goal: number
  estimatedSeconds: number
  cardIds: string[]
  questionIds: string[]
  reasons: { contentId: string; text: string }[]
  summary: string[]
  timingBasis: 'content-estimate' | 'observed-and-content'
  status: 'active' | 'completed' | 'archived'
  practiceSessionId?: string
  completedAt?: number
}
