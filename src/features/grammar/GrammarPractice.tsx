import { useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import type { GrammarExercise, GrammarLesson, OptionId } from '../../content/schema'
import { assessGrammarExercise } from '../../domain/grammarPractice'
import { protectLearningSelection } from '../../components/learningText'
import { useAction } from '../../application/hooks'
import { submitGrammarPractice } from '../../application/grammarPracticeRepository'
import { InlineError } from '../../components/ui'
import { useForegroundDuration } from '../../components/useForegroundDuration'

function Exercise({
  exercise,
  number,
  lessonId,
  active,
  onActivate,
}: {
  exercise: GrammarExercise
  number: number
  lessonId: string
  active: boolean
  onActivate: () => void
}) {
  const [selected, setSelected] = useState<OptionId | null>(null)
  const [result, setResult] = useState<ReturnType<typeof assessGrammarExercise>>()
  const action = useAction()
  const operationId = useRef(crypto.randomUUID())
  const timing = useForegroundDuration(active && !result && !action.busy)
  return (
    <form
      className="grammar-exercise"
      onPointerDownCapture={onActivate}
      onFocusCapture={onActivate}
      onSubmit={(e) => {
        e.preventDefault()
        if (selected) {
          const timeSpentMs = timing.read()
          void action.run(async () => {
            const result = await submitGrammarPractice(
              lessonId,
              exercise.id,
              selected,
              operationId.current,
              timeSpentMs,
            )
            setResult(result)
          })
        }
      }}
    >
      <fieldset disabled={Boolean(result) || action.busy}>
        <legend>
          <span className="eyebrow">THỬ SỨC {number}</span>
          <span lang="en" data-learning>
            {exercise.prompt}
          </span>
        </legend>
        <div className="grammar-exercise-options">
          {exercise.options.map((option) => (
            <label
              key={option.id}
              onClick={protectLearningSelection}
              className={selected === option.id ? 'chosen' : ''}
            >
              <input
                type="radio"
                name={exercise.id}
                value={option.id}
                checked={selected === option.id}
                onChange={() => setSelected(option.id)}
              />
              <span className="exercise-option-letter">{option.id}</span>
              <span lang="en" data-learning>
                {option.text}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {result ? (
        <div className="grammar-exercise-feedback" role="status">
          <strong>
            {result.correct ? 'Đúng rồi.' : `Cùng xem lại. Đáp án ${exercise.answer}.`}
          </strong>
          <p>
            {result.reasoning} {result.explanation}
          </p>
          <details>
            <summary>Vì sao các lựa chọn khác không phù hợp?</summary>
            {exercise.options
              .filter((o) => o.id !== result.selected)
              .map((o) => (
                <p key={o.id}>
                  <strong>
                    {o.id}. {o.text}
                  </strong>{' '}
                  — {o.explanation}
                </p>
              ))}
          </details>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setSelected(null)
              setResult(undefined)
              operationId.current = crypto.randomUUID()
              timing.reset()
            }}
          >
            <RotateCcw size={14} />
            Làm lại
          </button>
        </div>
      ) : (
        <button type="submit" className="button secondary" disabled={!selected || action.busy}>
          <Check size={15} />
          Kiểm tra
        </button>
      )}
      <InlineError message={action.error} />
    </form>
  )
}
export function GrammarPractice({ lesson }: { lesson: GrammarLesson }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  return (
    <section className="grammar-mini-practice">
      <h3>Tự kiểm tra ngay</h3>
      <p className="small muted">
        Chọn đáp án rồi kiểm tra cách suy luận. Kết quả được ghi ở kỹ năng ngữ pháp, tách khỏi thống
        kê Part và lịch ôn thẻ.
      </p>
      {lesson.practice.map((exercise, i) => (
        <Exercise
          key={exercise.id}
          exercise={exercise}
          number={i + 1}
          lessonId={lesson.id}
          active={activeId === exercise.id}
          onActivate={() => setActiveId(exercise.id)}
        />
      ))}
    </section>
  )
}
