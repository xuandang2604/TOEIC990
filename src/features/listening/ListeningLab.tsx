import { useEffect, useMemo, useRef, useState } from 'react'
import type { AudioAsset } from '../../content/schema'
import { compareDictation, transcriptSegments, normalizeDictation } from '../../domain/studio'
import { saveLearningActivity } from '../../application/studioRepository'
import { useAction } from '../../application/hooks'
import { MediaPlayer } from '../../components/MediaPlayer'
import { InlineError } from '../../components/ui'
import { ShadowRecorder } from './ShadowRecorder'
import { ListeningTranscript } from './ListeningTranscript'
import { registerUpdatePreparation } from '../../application/updatePreparation'
import { StudyOperationError } from '../../application/errors'

export function ListeningLab({ audio, stimulusId }: { audio: AudioAsset; stimulusId: string }) {
  const [mode, setMode] = useState<'listen' | 'dictation' | 'shadowing'>('listen')
  const segments = useMemo(() => transcriptSegments(audio.transcript), [audio.transcript])
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ReturnType<typeof compareDictation>>()
  const operation = useRef(crypto.randomUUID())
  const action = useAction()
  useEffect(
    () =>
      registerUpdatePreparation(async () => {
        if (input.trim() && !result)
          throw new StudyOperationError(
            'Bản chép Dictation chưa lưu. Bấm “Đối chiếu bản chép” để lưu, hoặc xóa phần nhập nếu muốn bỏ, rồi cập nhật lại.',
          )
      }),
    [input, result],
  )
  const segment = segments[index] ?? ''
  const synthetic = audio.kind === 'synthetic'
  const segmentAudio = useMemo<AudioAsset>(
    () => (synthetic ? { kind: 'synthetic', transcript: segment } : audio),
    [synthetic, segment, audio],
  )
  const reference = synthetic ? segment : audio.transcript
  const oversized =
    normalizeDictation(reference).length > 250 || normalizeDictation(input).length > 250
  function reset() {
    setInput('')
    setResult(undefined)
    operation.current = crypto.randomUUID()
  }
  return (
    <details className="listening-lab">
      <summary>Listening Lab · nghe kỹ, chép lại, nhại giọng</summary>
      <p className="small muted">
        {synthetic
          ? 'Nguồn: giọng máy tổng hợp. Từng câu được đọc lại từ văn bản; không phải cắt bản thu hay mốc từ chính xác.'
          : 'Nguồn: bản thu có ghi nguồn. Chưa có mốc câu được xác thực: chỉ phát toàn bản thu.'}
      </p>
      <div className="studio-mode-picker" aria-label="Chọn cách luyện nghe">
        {(['listen', 'dictation', 'shadowing'] as const).map((value) => (
          <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>
            {value === 'listen'
              ? 'Nghe & đối chiếu'
              : value === 'dictation'
                ? 'Dictation'
                : 'Shadowing'}
          </button>
        ))}
      </div>
      {synthetic && (
        <div className="segment-controls">
          <label className="form-label">
            Đơn vị văn bản
            <select
              aria-label="Câu nghe"
              value={index}
              onChange={(e) => {
                setIndex(Number(e.target.value))
                reset()
              }}
            >
              {segments.map((_, i) => (
                <option key={i} value={i}>
                  Câu / lượt nói {i + 1} trong {segments.length}
                </option>
              ))}
            </select>
          </label>
          <button
            className="text-link"
            disabled={index === 0}
            onClick={() => {
              setIndex(index - 1)
              reset()
            }}
          >
            Trước
          </button>
          <button
            className="text-link"
            disabled={index >= segments.length - 1}
            onClick={() => {
              setIndex(index + 1)
              reset()
            }}
          >
            Tiếp
          </button>
        </div>
      )}
      <MediaPlayer key={`${stimulusId}:${index}:${mode}`} audio={segmentAudio} />
      {mode === 'listen' && (
        <details className="transcript">
          <summary>Tự nghe trước · đối chiếu Anh – Việt</summary>
          <ListeningTranscript
            stimulusId={stimulusId}
            transcript={audio.transcript}
            segment={synthetic ? segment : undefined}
            highlight
          />
          <p className="small muted">
            Từ đánh dấu có trong từ điển chọn lọc. Chọn từ/cụm → Tra hoặc Alt + Enter.
          </p>
        </details>
      )}
      {mode === 'dictation' && (
        <div className="dictation-workspace">
          <label className="form-label">
            Gõ những gì bạn nghe
            <textarea
              lang="en"
              rows={3}
              maxLength={3000}
              value={input}
              disabled={Boolean(result)}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
          <p className="small muted">
            So khớp chữ: bỏ hoa/thường, dấu câu và khoảng trắng lặp; giữ dạng rút gọn, không đổi số
            thành chữ. Tối đa 250 từ; không đo trình độ hay phát âm.
          </p>
          {!result ? (
            <button
              className="button secondary"
              disabled={
                !input.trim() || action.busy || !reference || reference.length > 3000 || oversized
              }
              onClick={() =>
                void action.run(async () => {
                  const next = compareDictation(reference, input)
                  await saveLearningActivity({
                    id: operation.current,
                    kind: 'dictation',
                    contentId: stimulusId,
                    occurredAt: Date.now(),
                    input,
                    reference,
                    matched: next.matched,
                    total: next.total,
                  })
                  setResult(next)
                })
              }
            >
              Đối chiếu bản chép
            </button>
          ) : (
            <div className="dictation-result">
              <h4 role="status">
                {result.matched}/{result.total} từ trùng sau chuẩn hóa
              </h4>
              <div className="word-differences">
                {result.words.map((w, i) => (
                  <span key={i} className={`word-difference ${w.kind}`}>
                    {w.kind === 'match'
                      ? w.actual
                      : w.kind === 'missing'
                        ? `Thiếu: ${w.expected}`
                        : w.kind === 'extra'
                          ? `Thừa: ${w.actual}`
                          : `${w.actual} → ${w.expected}`}
                  </span>
                ))}
              </div>
              <button className="text-link" onClick={reset}>
                Nghe & thử lại
              </button>
            </div>
          )}
          {oversized && (
            <p className="notice">
              Giới hạn 250 từ cho mỗi lượt và mỗi bản chép. Rút ngắn phần nhập hoặc chọn đơn vị nghe
              ngắn hơn; bản thu không có mốc câu chỉ phát toàn bài.
            </p>
          )}
          <InlineError message={action.error} />
        </div>
      )}
      {mode === 'shadowing' && (
        <>
          <details className="transcript">
            <summary>Xem câu & nghĩa để nhại lại</summary>
            <ListeningTranscript
              stimulusId={stimulusId}
              transcript={audio.transcript}
              segment={synthetic ? segment : undefined}
              highlight
            />
          </details>
          <ShadowRecorder />
        </>
      )}
    </details>
  )
}
