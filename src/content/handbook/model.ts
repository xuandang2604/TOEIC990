import type { GrammarExercise, GrammarLesson, OptionId, Skill } from '../schema'

export const chapters = [
  {
    id: 'foundations',
    title: 'Câu & cụm danh từ',
    description: 'Nhìn thấy bộ khung trước khi học ngoại lệ.',
  },
  {
    id: 'time',
    title: 'Thì & thể của động từ',
    description: 'Mốc thời gian, tiến trình và kết quả.',
  },
  { id: 'verbs', title: 'Cấu trúc động từ', description: 'Hòa hợp, bị động, bổ ngữ và sắc thái.' },
  {
    id: 'clauses',
    title: 'Mệnh đề & liên kết',
    description: 'Kết nối thông tin thành một câu rõ nghĩa.',
  },
  {
    id: 'hypothesis',
    title: 'Điều kiện & giả định',
    description: 'Điều có thật, mong muốn và khả năng khác.',
  },
  { id: 'modifiers', title: 'Bổ nghĩa & so sánh', description: 'Từ nào đang mô tả điều gì?' },
  {
    id: 'advanced',
    title: 'Cấu trúc nâng cao',
    description: 'Rút gọn, đảo ngữ, nhấn mạnh và song song.',
  },
] as const
export type ChapterId = (typeof chapters)[number]['id']
export type HandbookLevel = 'foundation' | 'intermediate' | 'advanced'
export const levelLabels: Record<HandbookLevel, string> = {
  foundation: 'Nền tảng',
  intermediate: 'Vận dụng',
  advanced: 'Nâng cao',
}
export type RuleDraft = [title: string, description: string, formula: string]
export type ExampleDraft = [correct: string, incorrect: string, explanation: string]
export type ExerciseDraft = [
  prompt: string,
  choices: [string, string][],
  answer: OptionId,
  explanation: string,
]
export function exercise(
  id: string,
  [prompt, rows, answer, explanation]: ExerciseDraft,
): GrammarExercise {
  return {
    id,
    prompt,
    answer,
    explanation,
    options: rows.map(([text, explanation], i) => ({
      id: (['A', 'B', 'C', 'D'] as const)[i],
      text,
      explanation,
    })),
  }
}
export interface FeynmanGuide {
  lessonId: string
  chapterId: ChapterId
  level: HandbookLevel
  aliases: string[]
  plain: string
  why: string
  prompt: string
  selfCheck: string[]
  relatedIds: string[]
  prediction: GrammarExercise
}
export interface HandbookEntry {
  lesson: GrammarLesson
  guide: FeynmanGuide
}
export interface LessonDraft {
  id: string
  title: string
  en: string
  chapter: ChapterId
  level: HandbookLevel
  plain: string
  why: string
  prompt: string
  checks: string[]
  aliases: string[]
  related: string[]
  skills: Skill[]
  vocabulary: string[]
  rules: RuleDraft[]
  examples: ExampleDraft[]
  traps: string[]
  prediction: ExerciseDraft
  drills: [ExerciseDraft, ExerciseDraft]
}
/** Compact authoring notation only; every explanation, option and transfer is explicitly authored. */
export function entry(d: LessonDraft): HandbookEntry {
  return {
    lesson: {
      id: d.id,
      title: d.title,
      englishTitle: d.en,
      summary: d.plain,
      rules: d.rules.map(([title, description, formula]) => ({ title, description, formula })),
      examples: d.examples.map(([correct, incorrect, explanation]) => ({
        correct,
        incorrect,
        explanation,
      })),
      traps: d.traps,
      skills: d.skills,
      vocabularyIds: d.vocabulary,
      questionIds: [],
      coverage: 'reference-only',
      practice: d.drills.map((drill, i) => exercise(`${d.id}-hb-${i + 1}`, drill)),
      provenance: {
        kind: 'original',
        author: 'STUDY 990 · AI-assisted authoring',
        revision: '2026-10-27-handbook-r1',
        editorialStatus: 'ai-draft',
        note: 'Bài tham khảo và ví dụ gốc, chưa thẩm định độc lập. Bài tự kiểm tra không phải câu đề TOEIC.',
      },
    },
    guide: {
      lessonId: d.id,
      chapterId: d.chapter,
      level: d.level,
      aliases: d.aliases,
      plain: d.plain,
      why: d.why,
      prompt: d.prompt,
      selfCheck: d.checks,
      relatedIds: d.related,
      prediction: exercise(`${d.id}-hb-predict`, d.prediction),
    },
  }
}
