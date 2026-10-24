import { useEffect, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { useAction } from '../../application/hooks'
import { submitTutorExplanation, submitTutorRevision } from '../../application/tutorRepository'
import type { TutorDraft, TutorLesson, RevisionStance } from '../../domain/tutorModels'
import { InlineError } from '../../components/ui'
import { useTutorDraft } from './useTutorDraft'

export function TutorWriting({
  attemptId,
  phase,
  baseRevision,
  initialText = '',
  lesson,
  initialStance = 'uncertain',
}: {
  attemptId: string
  phase: TutorDraft['phase']
  baseRevision: number
  initialText?: string
  lesson: TutorLesson | null
  initialStance?: RevisionStance
}) {
  const writing = useTutorDraft(attemptId, phase, baseRevision, {
    text: initialText,
    reasonId: null,
    stance: initialStance,
  })
  const { values } = writing
  const action = useAction(),
    controller = useRef<AbortController | null>(null)
  const operationId = useRef(crypto.randomUUID())
  useEffect(() => () => controller.current?.abort(), [])
  const submit = async () => {
    if (!(await writing.flush())) return
    controller.current = new AbortController()
    if (phase === 'explanation')
      await submitTutorExplanation(
        {
          attemptId,
          text: values.text,
          reasonId: values.reasonId,
          expectedRevision: baseRevision,
          operationId: operationId.current,
        },
        controller.current.signal,
      )
    else
      await submitTutorRevision({
        reflectionId: attemptId,
        text: values.text,
        stance: values.stance,
        expectedRevision: baseRevision,
        operationId: operationId.current,
      })
    writing.committed()
  }
  const revisionPrompt =
    values.stance === 'changed'
      ? 'Điểm nào trong cách nghĩ ban đầu cần sửa? Viết quy tắc mới và một dấu hiệu để nhận ra.'
      : values.stance === 'confirmed'
        ? 'Giữ kết luận nhưng làm rõ bằng chứng: quy tắc nào áp dụng, và vì sao một đáp án khác không phù hợp?'
        : 'Nêu điều bạn đã hiểu và điểm vẫn chưa chắc. Có thể thử câu vận dụng để xem thêm bằng chứng.'
  return (
    <form
      className="tutor-writing"
      onBlur={() => {
        void writing.flush()
      }}
      onSubmit={(event) => {
        event.preventDefault()
        void action.run(submit)
      }}
    >
      {phase === 'explanation' && lesson && (
        <fieldset className="tutor-reason-choices" disabled={action.busy || !writing.loaded}>
          <legend>
            Ý nào gần với cách bạn đã chọn nhất? <span className="muted">(tuỳ chọn)</span>
          </legend>
          {lesson.reasons.map((reason) => (
            <label key={reason.id} className={values.reasonId === reason.id ? 'selected' : ''}>
              <input
                type="radio"
                name={`reason-${attemptId}`}
                checked={values.reasonId === reason.id}
                onChange={() => writing.update({ reasonId: reason.id })}
              />
              {reason.label}
            </label>
          ))}
          <label className={values.reasonId === null ? 'selected' : ''}>
            <input
              type="radio"
              name={`reason-${attemptId}`}
              checked={values.reasonId === null}
              onChange={() => writing.update({ reasonId: null })}
            />
            Cách nghĩ khác / chưa muốn chọn
          </label>
        </fieldset>
      )}
      {phase === 'revision' && (
        <fieldset className="tutor-revision-stance" disabled={action.busy || !writing.loaded}>
          <legend>Sau khi đối chiếu, bạn thấy thế nào?</legend>
          {(
            [
              { id: 'changed', label: 'Mình cần sửa một điểm' },
              { id: 'confirmed', label: 'Mình muốn làm rõ lập luận' },
              { id: 'uncertain', label: 'Mình vẫn còn băn khoăn' },
            ] as const
          ).map((stance) => (
            <label key={stance.id}>
              <input
                type="radio"
                name={`stance-${attemptId}`}
                checked={values.stance === stance.id}
                onChange={() => writing.update({ stance: stance.id })}
              />
              {stance.label}
            </label>
          ))}
        </fieldset>
      )}
      <label htmlFor={`tutor-${phase}`} className="form-label">
        {phase === 'explanation'
          ? (lesson?.prompts.why ??
            'Vì sao bạn chọn đáp án đó? Bằng chứng nào trong câu hoặc tư liệu đã dẫn bạn đến lựa chọn?')
          : revisionPrompt}
      </label>
      <textarea
        id={`tutor-${phase}`}
        data-tutor-revision={phase === 'revision' || undefined}
        rows={5}
        maxLength={2000}
        value={values.text}
        disabled={action.busy || !writing.loaded}
        onChange={(event) => writing.update({ text: event.target.value })}
        placeholder={
          phase === 'explanation'
            ? 'Mình đã dựa vào… nên chọn…'
            : 'Lúc đầu mình… Bây giờ mình hiểu… Với câu khác, mình sẽ kiểm tra…'
        }
      />
      <div className="reasoning-footer">
        <span className="small muted">
          {values.text.length}/2.000 · {writing.status}
        </span>
        <button
          className="button primary"
          type="submit"
          disabled={action.busy || !writing.loaded || values.text.trim().length < 10}
        >
          {action.busy
            ? 'Đang lưu…'
            : phase === 'explanation'
              ? 'Lưu & đối chiếu hướng dẫn'
              : 'Lưu cách hiểu để vận dụng'}
          <ArrowRight size={16} />
        </button>
      </div>
      <p className="small muted">
        Chỉ lưu trên thiết bị. Phần viết không được tự động chấm; số ký tự không thể hiện mức hiểu.
      </p>
      <InlineError message={writing.error ?? action.error} />
      {writing.error && (
        <button
          type="button"
          className="text-link"
          onClick={() => {
            if (writing.loaded) void writing.flush()
            else writing.retry()
          }}
        >
          {writing.loaded ? 'Thử lưu nháp lại' : 'Thử mở nháp lại'}
        </button>
      )}
    </form>
  )
}
