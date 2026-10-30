import type { Question } from '../content/schema'
export const FEEDBACK_CATEGORIES = {
  answer: 'Có thể sai đáp án',
  wording: 'Câu mơ hồ / có thể có nhiều đáp án',
  explanation: 'Lời giải chưa rõ',
  media: 'Media bị lỗi',
  translation: 'Bản dịch chưa đúng',
} as const
export type FeedbackCategory = keyof typeof FEEDBACK_CATEGORIES
export type FeedbackStatus = 'open' | 'triaged' | 'resolved' | 'dismissed'
export interface ContentFeedback {
  id: string
  questionId: string
  contentRevision: string
  fingerprint: string
  snapshot: Question
  category: FeedbackCategory
  detail: string
  createdAt: number
  updatedAt: number
  revision: number
  status: FeedbackStatus
  history: { status: FeedbackStatus; note: string; at: number }[]
}
