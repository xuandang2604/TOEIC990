/** Mounted editors own their save operation. Updating never guesses how to submit an exercise. */
const preparations = new Set<() => Promise<void>>()
export function registerUpdatePreparation(prepare: () => Promise<void>) {
  preparations.add(prepare)
  return () => {
    preparations.delete(prepare)
  }
}
export async function prepareLearningForUpdate() {
  // A failed save stops the sequence before any session is ended or the page is reloaded.
  for (const prepare of [...preparations]) await prepare()
}
