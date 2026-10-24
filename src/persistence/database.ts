import Dexie, { type EntityTable } from 'dexie'
import type {
  Attempt,
  Preferences,
  ReviewCard,
  ReviewEvent,
  StudySession,
  TutorReflection,
  ExamResponse,
  PlaybackRecord,
  RecentSearch,
  StudyDraft,
  SkillEvidence,
  MistakeRecord,
  MistakeAnnotation,
  QuestionTiming,
  TimingLease,
  DailyPlan,
} from '../domain/models'
import { migrateLearningV4 } from './learningMigration'
import type { TutorDraft, TutorTurn } from '../domain/tutorModels'
import type { QuarantinedRecord, RecoveryPoint } from './records'
import type { ReadingWorkspace, LearningActivity, VocabularyContext } from '../domain/studio'
import type { ContentFeedback } from '../domain/contentFeedback'

export class StudyDatabase extends Dexie {
  contentFeedback!: EntityTable<ContentFeedback, 'id'>
  readingWorkspaces!: EntityTable<ReadingWorkspace, 'id'>
  learningActivities!: EntityTable<LearningActivity, 'id'>
  vocabularyContexts!: EntityTable<VocabularyContext, 'id'>
  preferences!: EntityTable<Preferences, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  sessions!: EntityTable<StudySession, 'id'>
  cards!: EntityTable<ReviewCard, 'id'>
  reviewEvents!: EntityTable<ReviewEvent, 'id'>
  reflections!: EntityTable<TutorReflection, 'id'>
  responses!: EntityTable<ExamResponse, 'id'>
  playbacks!: EntityTable<PlaybackRecord, 'id'>
  recentSearches!: EntityTable<RecentSearch, 'id'>
  studyDrafts!: EntityTable<StudyDraft, 'id'>
  skillEvidence!: EntityTable<SkillEvidence, 'id'>
  mistakes!: EntityTable<MistakeRecord, 'id'>
  mistakeAnnotations!: EntityTable<MistakeAnnotation, 'id'>
  questionTimings!: EntityTable<QuestionTiming, 'id'>
  timingLeases!: EntityTable<TimingLease, 'id'>
  dailyPlans!: EntityTable<DailyPlan, 'id'>
  tutorTurns!: EntityTable<TutorTurn, 'id'>
  tutorDrafts!: EntityTable<TutorDraft, 'id'>
  quarantine!: EntityTable<QuarantinedRecord, 'id'>
  recoveryPoints!: EntityTable<RecoveryPoint, 'id'>

  constructor(name = 'study990') {
    super(name)
    this.version(1).stores({
      preferences: 'id',
      attempts: 'id, sessionId, questionId, occurredAt',
      sessions: 'id, status, startedAt',
      cards: 'id, kind, dueAt, contentId',
      reviewEvents: 'id, cardId, occurredAt',
      reflections: 'id, attemptId, createdAt',
    })
    this.version(2)
      .stores({ responses: 'id, sessionId, questionId', playbacks: 'id, sessionId, stimulusId' })
      .upgrade(async (tx) => {
        await tx
          .table('sessions')
          .toCollection()
          .modify((session) => {
            session.mode = 'study'
          })
      })
    this.version(3).stores({
      recentSearches: 'id, lastUsedAt',
      studyDrafts: 'id, sessionId, questionId',
    })
    this.version(4)
      .stores({
        skillEvidence: 'id, attemptId, questionId, skillId, occurredAt, [skillId+occurredAt]',
        mistakes: 'id, questionId, occurredAt, sessionId',
        mistakeAnnotations: 'id, category',
        questionTimings: 'id, sessionId, questionId',
        timingLeases: 'id',
        dailyPlans: 'id, status, createdAt',
      })
      .upgrade(migrateLearningV4)
    // Additive upgrade: legacy reflections and their transfer links are not rewritten.
    this.version(5).stores({
      tutorTurns: 'id, reflectionId, createdAt',
      tutorDrafts: 'id, reflectionId',
    })
    this.version(6).stores({
      quarantine: 'id, table, quarantinedAt',
      recoveryPoints: 'id, createdAt',
    })
    // v7 adds an explicit interrupted-session state; all existing records remain untouched.
    this.version(7).stores({})
    // Additive; annotations and follow-up activities never rewrite original assessment evidence.
    this.version(8).stores({
      readingWorkspaces: 'id, updatedAt',
      learningActivities: 'id, kind, contentId, occurredAt',
      vocabularyContexts: 'id, vocabularyId, createdAt',
    })
    this.version(9).stores({
      contentFeedback: 'id, questionId, contentRevision, status, createdAt',
    })
  }
}
export const db = new StudyDatabase()
