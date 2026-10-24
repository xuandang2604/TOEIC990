import type { TutorContext, TutorGuidance } from '../domain/tutorModels'
import { validTutorGuidance } from '../domain/tutoring'

export interface TutorProvider {
  readonly id: string
  readonly mode: 'authored' | 'backend'
  readonly analyzesFreeText: boolean
  generate(context: TutorContext, signal: AbortSignal): Promise<unknown>
}
export type TutorProviderResult =
  | { status: 'ok'; guidance: TutorGuidance }
  | { status: 'cancelled' | 'unavailable' | 'invalid-output'; message: string }

/** No free-text inspection: only a submitted option and an explicitly selected reason. */
export const guidedTutor: TutorProvider = {
  id: 'study990-authored-v2',
  mode: 'authored',
  analyzesFreeText: false,
  async generate(context, signal) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError')
    const { question: q, lesson } = context
    const reason = lesson?.reasons.find((reason) => reason.id === context.explanation.reasonId)
    const selected = q.options.find((option) => option.id === context.answer.selected)
    const reference = context.knowledge[0]
    const guidance: TutorGuidance = {
      schemaVersion: 1,
      providerId: this.id,
      questionId: q.id,
      contentRevision: q.provenance.revision,
      lessonId: lesson?.id ?? null,
      lessonRevision: lesson?.provenance.revision ?? null,
      reasonId: context.explanation.reasonId,
      basis: reason ? 'selected-reason' : 'answer-reference',
      observation: reason
        ? reason.response
        : `Đối chiếu lựa chọn đã nộp${selected ? ` “${selected.text}”` : ''}: ${selected?.reasoning ?? q.explanation} Phần này là tham chiếu theo đáp án, không phải nhận xét về bài viết của bạn.`,
      followUp:
        reason?.followUp ??
        lesson?.prompts.rule ??
        'Bạn có thể chỉ ra dấu hiệu hoặc bằng chứng trong tư liệu đã giúp loại một lựa chọn không?',
      sections: {
        simple: {
          title: 'Nói như đang hướng dẫn một người bạn',
          paragraphs: [
            lesson?.simple ?? q.takeaway,
            lesson?.prompts.simplify ??
              'Nói lại bằng một hoặc hai câu đơn giản: bạn dựa vào bằng chứng nào và nó giúp chọn đáp án ra sao?',
          ],
        },
        steps: {
          title: 'Tách cách suy luận thành từng bước',
          paragraphs: [lesson?.cue ?? 'Đối chiếu với lời giải đã biên soạn cho câu này.'],
          steps: lesson?.steps ?? [q.explanation, q.takeaway],
        },
        distractors: {
          title: 'Đặt các lựa chọn cạnh nhau',
          paragraphs: [
            'Đây là phân tích đáp án có sẵn của câu đã nộp. Nó không chứng minh bạn đã nghĩ theo cùng cách.',
          ],
          steps: q.options.map(
            (option) =>
              `${option.id}. ${option.text}${option.id === q.answer ? ' · Đáp án đúng' : ''} — ${option.reasoning}`,
          ),
        },
        example: lesson
          ? {
              title: 'Thay cấu trúc, kiểm lại quy tắc',
              paragraphs: [
                lesson.example.sentence,
                lesson.example.explanation,
                lesson.example.changed,
                lesson.example.contrast,
                lesson.prompts.exception,
              ],
            }
          : {
              title: 'Thêm một điểm đối chiếu',
              paragraphs: reference
                ? [
                    reference.examples[0].correct,
                    reference.examples[0].explanation,
                    reference.traps[0],
                  ]
                : [
                    q.takeaway,
                    'Chưa có ví dụ thay cấu trúc được biên soạn riêng cho câu này. Dùng câu vận dụng liên quan ở bước tiếp theo để tự kiểm tra.',
                  ],
            },
        check: {
          title: 'Tự giải thích rồi thử trong câu khác',
          paragraphs: [
            lesson?.prompts.change ??
              'Nếu đổi một chi tiết trong tư liệu, bằng chứng cho đáp án có còn đúng không?',
            lesson?.prompts.apply ??
              'Đối chiếu điều vừa hiểu với một câu có cùng kỹ năng. Kết quả câu mới mới là bằng chứng trả lời; bài viết chưa được tự động chấm.',
            'Viết lại cách hiểu ở bước tiếp theo, rồi mở câu vận dụng. Đáp án câu vận dụng chỉ xuất hiện sau khi nộp.',
          ],
        },
      },
    }
    return guidance
  },
}

/** Bounded platform/provider boundary; no response can commit after cancellation or invalid output. */
export async function requestTutorGuidance(
  provider: TutorProvider,
  context: TutorContext,
  signal: AbortSignal,
): Promise<TutorProviderResult> {
  if (signal.aborted) return { status: 'cancelled', message: 'Đã dừng mở hướng dẫn.' }
  if (provider.mode === 'backend' && !context.privacy.networkConsent)
    return {
      status: 'unavailable',
      message: 'Chưa có sự đồng ý gửi nội dung ra dịch vụ. Hướng dẫn offline vẫn khả dụng.',
    }
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  let onAbort: () => void = () => undefined
  const interrupted = new Promise<never>((_, reject) => {
    onAbort = () => {
      controller.abort()
      reject(new DOMException('Cancelled', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    timeout = setTimeout(() => {
      controller.abort()
      reject(new Error('Tutor provider timed out.'))
    }, 10_000)
  })
  try {
    const value = await Promise.race([provider.generate(context, controller.signal), interrupted])
    if (signal.aborted) return { status: 'cancelled', message: 'Đã dừng mở hướng dẫn.' }
    return validTutorGuidance(value, context, provider.id)
      ? { status: 'ok', guidance: value }
      : {
          status: 'invalid-output',
          message:
            'Hướng dẫn không khớp cấu trúc hoặc câu hỏi. Nội dung đó chưa được lưu; hãy thử lại.',
        }
  } catch (failure) {
    if (signal.aborted) return { status: 'cancelled', message: 'Đã dừng mở hướng dẫn.' }
    console.error('study990: tutor provider failed', {
      provider: provider.id,
      category: failure instanceof Error ? failure.name : 'Unknown',
    })
    return {
      status: 'unavailable',
      message:
        'Chưa mở được hướng dẫn. Phần bạn viết vẫn được giữ trong nháp; thử lại hoặc mở bài tham chiếu.',
    }
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', onAbort)
  }
}
