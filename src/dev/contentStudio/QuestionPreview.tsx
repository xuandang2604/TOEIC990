import { useMemo, useState } from 'react'
import type { ContentBank } from '../../content/validation'
import type { OptionId, Question } from '../../content/schema'
import { QuestionRenderer } from '../../features/practice/QuestionRenderer'
import { StimulusView } from '../../features/practice/StimulusView'
import { listeningAudio } from '../../domain/listening'
import { MediaPlayer } from '../../components/MediaPlayer'
export function QuestionPreview({ question, bank }: { question: Question; bank: ContentBank }) {
  const [selected, setSelected] = useState<OptionId | null>(null),
    [reveal, setReveal] = useState(false)
  const stimulus = bank.stimuli.find((s) => s.id === question.stimulusId)
  const audio = useMemo(
    () =>
      stimulus
        ? listeningAudio(
            stimulus,
            bank.questions.filter((q) => q.stimulusId === stimulus.id),
          )
        : undefined,
    [stimulus, bank.questions],
  )
  return (
    <section className="studio-preview panel">
      <h2>Production renderer preview</h2>
      <p className="small muted">
        Only this editor can deliberately reveal the key. No attempts or review ratings are written.
      </p>
      {stimulus && (
        <StimulusView stimulus={stimulus} passages={bank.passages} reveal={reveal}>
          {audio && <MediaPlayer audio={audio} />}
        </StimulusView>
      )}
      <QuestionRenderer
        question={question}
        number={1}
        mode="study"
        selected={selected}
        locked={false}
        feedback={reveal}
        busy={false}
        onSelect={setSelected}
        onSubmit={() => setReveal(true)}
      />
      <button className="button secondary" onClick={() => setReveal(!reveal)}>
        {reveal ? 'Hide' : 'Reveal'} key for preview
      </button>
      {reveal && (
        <>
          <p>{question.explanation}</p>
          {question.options.map((o) => (
            <p key={o.id}>
              {o.id}. {o.reasoning}
            </p>
          ))}
        </>
      )}
    </section>
  )
}
