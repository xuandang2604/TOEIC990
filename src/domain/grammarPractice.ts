import type { GrammarExercise, OptionId } from '../content/schema'

export function assessGrammarExercise(exercise: GrammarExercise, selected: OptionId) {
  const option = exercise.options.find((option) => option.id === selected)
  if (!option) return undefined
  return {
    selected,
    correct: selected === exercise.answer,
    explanation: exercise.explanation,
    reasoning: option.explanation,
  }
}
