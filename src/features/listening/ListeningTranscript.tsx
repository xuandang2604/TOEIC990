import { vocabulary } from '../../content/vocabulary'
import {
  listeningChoiceTranslation,
  listeningTranslationProvenance,
  transcriptTranslation,
} from '../../content/listeningTranslations'
import type { QuestionOption } from '../../content/schema'
import { transcriptSegments } from '../../domain/studio'

const known = new Set(
  vocabulary
    .filter((word) => !word.word.includes(' '))
    .flatMap((word) => [word.word, ...word.forms])
    .map((word) => word.toLowerCase()),
)
function EnglishText({ text, highlight }: { text: string; highlight: boolean }) {
  return (
    <p lang="en" data-learning>
      {highlight
        ? text.split(/([A-Za-z]+(?:['’-][A-Za-z]+)*)/g).map((word, index) =>
            known.has(word.toLowerCase()) ? (
              <mark className="transcript-word" key={index}>
                {word}
              </mark>
            ) : (
              word
            ),
          )
        : text}
    </p>
  )
}

/** English stays the audio source. Vietnamese is learning support and never enters playback. */
export function ListeningTranscript({
  stimulusId,
  transcript,
  options = [],
  segment,
  highlight = false,
}: {
  stimulusId: string
  transcript: string
  options?: QuestionOption[]
  segment?: string
  highlight?: boolean
}) {
  const translated = transcriptTranslation(stimulusId, transcript)?.split('\n')
  const rows = transcript
    .split('\n')
    .map((english, index) => ({ english, vietnamese: translated?.[index] }))
  const matching =
    segment === undefined
      ? rows
      : rows.filter((row) => transcriptSegments(row.english).includes(segment))
  const selected = segment !== undefined ? matching.slice(0, 1) : matching
  return (
    <div className="bilingual-transcript">
      <p className="small muted">Anh – Việt · Bản dịch hỗ trợ học</p>
      {(selected.length
        ? selected
        : [{ english: segment ?? transcript, vietnamese: undefined }]
      ).map((row, index) => (
        <div className="transcript-pair" key={index}>
          <EnglishText text={segment ?? row.english} highlight={highlight} />
          {row.vietnamese ? (
            <p lang="vi" className="transcript-translation">
              {segment !== undefined && segment !== row.english && (
                <span className="transcript-context-label">Dịch cả lượt nói chứa câu này: </span>
              )}
              {row.vietnamese}
            </p>
          ) : (
            <p className="small muted" lang="vi">
              Chưa có bản dịch khớp với phiên bản tiếng Anh này.
            </p>
          )}
        </div>
      ))}
      {options.map((option) => (
        <div className="transcript-pair transcript-choice" key={option.id}>
          <span className="option-letter" aria-hidden="true">
            {option.id}
          </span>
          <div>
            <span className="sr-only">Lựa chọn {option.id}.</span>
            <EnglishText text={option.text} highlight={highlight} />
            <p lang="vi" className="transcript-translation">
              {listeningChoiceTranslation(stimulusId, option.id, option.text) ??
                'Chưa có bản dịch cho lựa chọn này.'}
            </p>
          </div>
        </div>
      ))}
      <p className="small muted transcript-provenance">{listeningTranslationProvenance.note}</p>
    </div>
  )
}
