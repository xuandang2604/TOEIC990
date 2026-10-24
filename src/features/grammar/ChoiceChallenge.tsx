import { useState } from 'react'
import type { GrammarExercise, OptionId } from '../../content/schema'
import { protectLearningSelection } from '../../components/learningText'

/** Shared prediction, structure-choice and transfer interaction; feedback follows submission only. */
export function ChoiceChallenge({
  exercise,
  answer,
  busy,
  onSubmit,
}: {
  exercise: GrammarExercise
  answer: OptionId | null
  busy: boolean
  onSubmit: (answer: OptionId) => void
}) {
  const [selected, setSelected] = useState<OptionId | null>(answer)
  const chosen = answer ?? selected
  return (
    <form
      className="grammar-exercise"
      onSubmit={(e) => {
        e.preventDefault()
        if (selected) onSubmit(selected)
      }}
    >
      <fieldset disabled={Boolean(answer) || busy}>
        <legend lang="en" data-learning>
          {exercise.prompt}
        </legend>
        <div className="grammar-exercise-options">
          {exercise.options.map((o) => (
            <label
              key={o.id}
              className={chosen === o.id ? 'chosen' : ''}
              onClick={protectLearningSelection}
            >
              <input
                type="radio"
                name={exercise.id}
                checked={chosen === o.id}
                onChange={() => setSelected(o.id)}
              />
              <span className="exercise-option-letter">{o.id}</span>
              <span lang="en" data-learning>
                {o.text}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {answer ? (
        <div className="grammar-exercise-feedback" role="status">
          <strong>
            {answer === exercise.answer ? 'Đúng rồi.' : 'Cùng xem lại.'} Đáp án {exercise.answer}.
          </strong>
          <p>{exercise.explanation}</p>
          <details>
            <summary>Đối chiếu từng lựa chọn</summary>
            {exercise.options.map((o) => (
              <p key={o.id}>
                {o.id}. {o.explanation}
              </p>
            ))}
          </details>
        </div>
      ) : (
        <button className="button secondary" type="submit" disabled={!selected || busy}>
          Chốt lựa chọn
        </button>
      )}
    </form>
  )
}
