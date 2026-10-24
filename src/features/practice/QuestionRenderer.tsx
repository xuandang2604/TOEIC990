import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import type { OptionId, Question } from '../../content/schema'
import type { Confidence, PracticeMode } from '../../domain/models'
import { protectLearningSelection } from '../../components/learningText'

/** Content-independent renderer. The owner decides when feedback is allowed. */
export function QuestionRenderer({
  question,
  number,
  mode,
  selected,
  locked,
  feedback,
  busy,
  onSelect,
  confidence = null,
  onConfidence,
  onSubmit,
  autoFocus = false,
  scrollOnFocus = false,
  qualityLabel,
}: {
  question: Question
  number: number
  mode: PracticeMode
  selected: OptionId | null
  locked: boolean
  feedback: boolean
  busy: boolean
  onSelect: (id: OptionId) => void
  confidence?: Confidence | null
  onConfidence?: (confidence: Confidence | null) => void
  onSubmit?: () => void
  autoFocus?: boolean
  scrollOnFocus?: boolean
  qualityLabel?: string
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (autoFocus) {
      heading.current?.focus({ preventScroll: true })
      if (scrollOnFocus) heading.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [autoFocus, question.id, scrollOnFocus])
  const spokenChoices = mode === 'exam' && question.part <= 2 && !feedback
  return (
    <form
      className="question-block"
      onKeyDown={(event) => {
        if (locked || busy || event.ctrlKey || event.metaKey || event.altKey) return
        const option = question.options[Number(event.key) - 1]
        if (
          option &&
          !(event.target instanceof HTMLInputElement && event.target.name.startsWith('confidence-'))
        ) {
          event.preventDefault()
          onSelect(option.id)
        }
      }}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      <p className="eyebrow">
        CÂU {number}
        {question.blankKey ? ` · CHỖ TRỐNG [${question.blankKey}]` : ''}
      </p>
      <h2
        ref={heading}
        tabIndex={autoFocus ? -1 : undefined}
        className="question-prompt"
        lang="en"
        data-learning={!spokenChoices || undefined}
      >
        {spokenChoices && question.part === 2
          ? 'Listen and choose the best response.'
          : question.prompt}
      </h2>
      {qualityLabel ? (
        <p className="small muted">
          {question.provenance.kind === 'original' &&
          question.provenance.editorialStatus === 'ai-draft'
            ? 'AI biên soạn · '
            : ''}
          {qualityLabel}
        </p>
      ) : (
        question.provenance.kind === 'original' &&
        question.provenance.editorialStatus === 'ai-draft' && (
          <p className="small muted">AI biên soạn · Chưa thẩm định độc lập</p>
        )
      )}
      <fieldset className="answer-options" disabled={locked || busy}>
        <legend className="sr-only">Lựa chọn cho câu {number}</legend>
        {question.options.map((option) => {
          const chosen = selected === option.id,
            correct = feedback && question.answer === option.id,
            wrong = feedback && chosen && !correct
          return (
            <label
              className={`answer-option ${chosen ? 'chosen' : ''} ${correct ? 'correct' : ''} ${wrong ? 'incorrect' : ''}`}
              key={option.id}
              onClick={protectLearningSelection}
            >
              <input
                type="radio"
                name={`answer-${question.id}`}
                aria-label={spokenChoices ? `Đáp án ${option.id}` : undefined}
                value={option.id}
                checked={chosen}
                onChange={() => onSelect(option.id)}
              />
              <span className="option-letter">{option.id}</span>
              <span lang="en" data-learning={!spokenChoices || undefined}>
                {spokenChoices ? `Response ${option.id}` : option.text}
              </span>
              {correct ? (
                <Check size={18} aria-label="Đáp án đúng" />
              ) : wrong ? (
                <X size={18} aria-label="Chưa đúng" />
              ) : null}
            </label>
          )
        })}
      </fieldset>
      {!locked && (
        <p className="small muted">
          Khi đang ở câu này, dùng phím 1–{question.options.length} hoặc phím mũi tên để chọn.
        </p>
      )}
      {spokenChoices && (
        <p className="small muted">Nội dung lựa chọn chỉ được đọc trong audio ở chế độ thi.</p>
      )}
      {mode === 'study' && !locked && (
        <>
          <fieldset className="confidence-field" disabled={busy}>
            <legend>
              Bạn chắc chắn đến đâu? <span className="muted">(tuỳ chọn)</span>
            </legend>
            <label className={confidence === null ? 'active' : ''}>
              <input
                type="radio"
                name={`confidence-${question.id}`}
                checked={confidence === null}
                onChange={() => onConfidence?.(null)}
              />
              Bỏ qua
            </label>
            {(
              [
                { value: 1, label: 'Còn phân vân' },
                { value: 2, label: 'Khá chắc' },
                { value: 3, label: 'Rất chắc' },
              ] as const
            ).map((item) => (
              <label className={confidence === item.value ? 'active' : ''} key={item.value}>
                <input
                  type="radio"
                  name={`confidence-${question.id}`}
                  checked={confidence === item.value}
                  onChange={() => onConfidence?.(item.value)}
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          <div className="question-submit">
            <button type="submit" className="button primary" disabled={!selected || busy}>
              {busy ? 'Đang lưu…' : 'Kiểm tra đáp án'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}
