import bundled from './questionDesignNotes.json'
import type { OptionId, Passage, Question, Stimulus } from './schema'
import { contentFingerprint } from './editorial'
import type { ContentIssue } from './validation'

export const DECISION_KINDS = {
  structure: 'Cấu trúc tại chỗ trống',
  context: 'Nghĩa & quan hệ trong ngữ cảnh',
  response: 'Chức năng của lời đáp',
  cohesion: 'Liên kết câu trước – câu sau',
  inference: 'Suy luận có bằng chứng',
  integration: 'Ghép nhiều dữ kiện',
  photo: 'Đối chiếu với ảnh',
} as const
export type FrameFit = 'fits-frame' | 'fails-frame' | 'not-rated'
export interface QuestionDesign {
  questionId: string
  sourceFingerprint: string
  kind: keyof typeof DECISION_KINDS
  target: string
  decisivePoint: string
  evidence: {
    source: 'prompt' | 'audio' | 'passage' | 'table' | 'photo'
    sourceId?: string
    quote?: string
    note: string
  }[]
  options: { id: OptionId; frame: FrameFit; reason: string }[]
  demandNote: string
  reviewPrompt: string
}
export const questionDesigns = bundled as QuestionDesign[]
const byQuestion = new Map(questionDesigns.map((note) => [note.questionId, note]))

/** Pin the explanation to the entire question AND shared context; never revise grading/history. */
export function questionDesignFingerprint(
  question: Question,
  stimuli: Stimulus[],
  passages: Passage[],
) {
  const stimulus = stimuli.find((item) => item.id === question.stimulusId)
  return contentFingerprint({
    question,
    stimulus,
    passages:
      stimulus && 'passageIds' in stimulus
        ? stimulus.passageIds.map((id) => passages.find((item) => item.id === id))
        : [],
  })
}
export function questionDesignFor(question: Question, stimuli: Stimulus[], passages: Passage[]) {
  const note = byQuestion.get(question.id)
  if (!note) return undefined
  return note?.sourceFingerprint === questionDesignFingerprint(question, stimuli, passages)
    ? note
    : undefined
}

/** Structural consistency only. This cannot prove semantic uniqueness or certify item difficulty. */
export function validateQuestionDesigns(
  questions: Question[],
  stimuli: Stimulus[],
  passages: Passage[],
): ContentIssue[] {
  const issues: ContentIssue[] = [],
    seen = new Set<string>()
  const byId = new Map(questions.map((question) => [question.id, question]))
  const text = (value: unknown): value is string =>
    typeof value === 'string' && Boolean(value.trim())
  for (const note of questionDesigns) {
    const fail = (message: string) =>
      issues.push({ path: `questionDesign.${note.questionId}`, message })
    const question = byId.get(note.questionId)
    if (!question || seen.has(note.questionId)) {
      fail('Unknown or duplicate question ID.')
      continue
    }
    seen.add(note.questionId)
    if (note.sourceFingerprint !== questionDesignFingerprint(question, stimuli, passages))
      fail('Question/context changed. Revise or remove the authored analysis.')
    if (
      !Object.hasOwn(DECISION_KINDS, note.kind) ||
      ![note.target, note.decisivePoint, note.demandNote, note.reviewPrompt].every(text)
    )
      fail('Missing decision analysis.')
    if (
      !Array.isArray(note.options) ||
      note.options.length !== question.options.length ||
      new Set(note.options.map((option) => option.id)).size !== question.options.length ||
      question.options.some((option) => !note.options.some((row) => row.id === option.id)) ||
      note.options.some(
        (option) =>
          !['fits-frame', 'fails-frame', 'not-rated'].includes(option.frame) ||
          !text(option.reason),
      )
    )
      fail('Every option requires its own structural/contextual explanation.')
    const stimulus = stimuli.find((item) => item.id === question.stimulusId)
    if (!Array.isArray(note.evidence) || !note.evidence.length) {
      fail('At least one decisive observation required.')
      continue
    }
    for (const item of note.evidence) {
      if (!text(item.note)) fail('Observation must explain its relevance.')
      if (item.source === 'photo') {
        if (stimulus?.kind !== 'photograph' || item.quote !== undefined)
          fail('Photo observation must refer to a photograph, without invented quotations.')
        continue
      }
      const source =
        item.source === 'prompt'
          ? question.prompt
          : item.source === 'audio' && stimulus && 'audio' in stimulus
            ? stimulus.audio.transcript
            : item.source === 'passage' &&
                stimulus &&
                'passageIds' in stimulus &&
                stimulus.passageIds.includes(item.sourceId ?? '')
              ? passages.find((passage) => passage.id === item.sourceId)?.text
              : item.source === 'table' &&
                  stimulus &&
                  'exhibit' in stimulus &&
                  stimulus.exhibit?.kind === 'table'
                ? [
                    stimulus.exhibit.title,
                    ...stimulus.exhibit.columns,
                    ...stimulus.exhibit.rows.flat(),
                  ].join('\n')
                : undefined
      if (!text(item.quote) || !source?.includes(item.quote))
        fail('Quoted evidence must exist in this question or its own shared stimulus.')
    }
  }
  return issues
}
