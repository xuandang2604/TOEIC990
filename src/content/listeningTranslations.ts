import bundled from './listeningVietnamese.json'
import type { OptionId, Question, Stimulus } from './schema'
import type { ContentIssue } from './validation'

interface ListeningTranslation {
  english: string
  vietnamese: string
  choices: { id: string; english: string; vietnamese: string }[]
}
const entries: Readonly<Record<string, ListeningTranslation>> = bundled.entries
export const listeningTranslationProvenance = bundled.provenance

/** Pin supplementary translations to their exact English source without revising exam packages. */
export function transcriptTranslation(stimulusId: string, english: string) {
  const entry = entries[stimulusId]
  return entry?.english === english ? entry.vietnamese : undefined
}
export function listeningChoiceTranslation(stimulusId: string, id: OptionId, english: string) {
  return entries[stimulusId]?.choices.find(
    (choice) => choice.id === id && choice.english === english,
  )?.vietnamese
}

export function validateListeningTranslations(
  stimuli: Stimulus[],
  questions: Question[],
): ContentIssue[] {
  const issues: ContentIssue[] = []
  const listening = stimuli.filter((stimulus) => 'audio' in stimulus)
  const known = new Set(listening.map((stimulus) => stimulus.id))
  const fail = (id: string, message: string) =>
    issues.push({ path: `listeningTranslations.${id}`, message })
  for (const id of Object.keys(entries)) if (!known.has(id)) fail(id, 'Unknown listening stimulus.')
  for (const stimulus of listening) {
    const entry = entries[stimulus.id]
    // Future imported audio can remain usable while its optional translation is being authored.
    if (!entry) continue
    if (entry.english !== stimulus.audio.transcript || !entry.vietnamese.trim()) {
      fail(stimulus.id, 'Missing translation or English source changed; revise the translation.')
      continue
    }
    if (
      entry.english.split('\n').length !== entry.vietnamese.split('\n').length ||
      entry.vietnamese.split('\n').some((line) => !line.trim())
    )
      fail(stimulus.id, 'Speaker turns must align between English and Vietnamese.')
    const options =
      stimulus.part <= 2
        ? (questions.find((question) => question.stimulusId === stimulus.id)?.options ?? [])
        : []
    if (
      entry.choices.length !== options.length ||
      new Set(entry.choices.map((choice) => choice.id)).size !== entry.choices.length ||
      options.some(
        (option) => !listeningChoiceTranslation(stimulus.id, option.id, option.text)?.trim(),
      )
    )
      fail(stimulus.id, 'Missing, duplicate or stale spoken-choice translation.')
  }
  return issues
}
