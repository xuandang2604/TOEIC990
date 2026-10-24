import type { AudioAsset, Question, Stimulus } from '../content/schema'

/** Spoken-only choices in Parts 1/2; Parts 3/4 retain printed prompts/options. */
export function listeningAudio(stimulus: Stimulus, questions: Question[]): AudioAsset | undefined {
  if (!('audio' in stimulus)) return undefined
  if (stimulus.audio.kind === 'recording') return stimulus.audio
  const base = stimulus.audio.transcript
  const transcript =
    stimulus.part <= 2
      ? `${base}\n${questions[0]?.options.map((o) => `${o.id}. ${o.text}`).join('\n') ?? ''}`
      : `${base.replace(/^[A-Za-z ]{1,30}:\s*/gm, '')}\n${questions.map((q, i) => `Question ${i + 1}. ${q.prompt}`).join('\n')}`
  return { kind: 'synthetic', transcript }
}
