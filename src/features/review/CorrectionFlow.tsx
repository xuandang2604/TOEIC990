import { useEffect, useRef, useState } from 'react'
import type { Attempt } from '../../domain/models'
import type { OptionId, Question } from '../../content/schema'
import type { LearningActivity } from '../../domain/studio'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate } from '../../application/hooks'
import { saveLearningActivity } from '../../application/studioRepository'
import { practiceQuestions, passages, stimuli, stimulusFor } from '../../content/questions'
import { questionDesignFor } from '../../content/questionDesign'
import { QuestionDesignAnalysis } from '../practice/QuestionDesignAnalysis'
import { listeningAudio } from '../../domain/listening'
import { QuestionRenderer } from '../practice/QuestionRenderer'
import { QuestionFeedback, SaveQuestionButton } from '../practice/QuestionFeedback'
import { StimulusView } from '../practice/StimulusView'
import { MediaPlayer } from '../../components/MediaPlayer'
import { InlineError } from '../../components/ui'
import { ReadingDocument } from '../reading/ReadingDocument'
import { registerUpdatePreparation } from '../../application/updatePreparation'
import { StudyOperationError } from '../../application/errors'

function CorrectionStimulus({ question }: { question: Question }) {
  const stimulus = stimulusFor(question)
  const audio = stimulus ? listeningAudio(stimulus, [question]) : undefined
  return stimulus ? (
    <StimulusView
      stimulus={stimulus}
      passages={passages}
      renderPassage={(passage) => <ReadingDocument passage={passage} />}
    >
      {audio && <MediaPlayer audio={audio} />}
    </StimulusView>
  ) : null
}
export function CorrectionFlow({ question, attempt }: { question: Question; attempt: Attempt }) {
  const data = useStudy()
  const action = useAction()
  const previous = data.learningActivities
    .filter((a) => a.kind === 'correction' && a.contentId === attempt.id)
    .sort((a, b) => b.occurredAt - a.occurredAt)[0]
  const [result, setResult] = useState<
    Extract<LearningActivity, { kind: 'correction' }> | undefined
  >(previous?.kind === 'correction' ? previous : undefined)
  const [selected, setSelected] = useState<OptionId | null>(null)
  const [reason, setReason] = useState('')
  useEffect(
    () =>
      registerUpdatePreparation(async () => {
        if (reason.trim() && !result)
          throw new StudyOperationError(
            'Phần giải thích trong Mistake Lab chưa lưu. Hoàn tất lượt sửa hoặc xóa phần viết nếu muốn bỏ, rồi cập nhật lại.',
          )
      }),
    [reason, result],
  )
  const [transferSelected, setTransferSelected] = useState<OptionId | null>(null)
  const [transferResult, setTransferResult] =
    useState<Extract<LearningActivity, { kind: 'correction' }>>()
  const operation = useRef(crypto.randomUUID())
  const transferOperation = useRef(crypto.randomUUID())
  const transfer = useRef(
    practiceQuestions.find(
      (q) =>
        q.id !== question.id &&
        q.part === question.part &&
        q.skills.some((s) => question.skills.includes(s)) &&
        !data.attempts.some((a) => a.questionId === q.id) &&
        !data.learningActivities.some((a) => a.kind === 'correction' && a.transferId === q.id),
    ),
  )
  const transferDesign = transfer.current
    ? questionDesignFor(transfer.current, stimuli, passages)
    : undefined
  return (
    <div className="correction-flow">
      <p className="eyebrow">MISTAKE LAB · THỬ LẠI → GIẢI THÍCH → CHUYỂN GIAO</p>
      <p className="small muted">
        Lần đầu chọn {attempt.selected ?? 'bỏ trống'}. Lượt sửa này lưu riêng, không thay đổi kết
        quả thi hay tự đánh giá là đã thành thạo.
      </p>
      <CorrectionStimulus question={question} />
      <QuestionRenderer
        question={question}
        number={1}
        mode="study"
        selected={result?.selected ?? selected}
        locked={Boolean(result)}
        feedback={Boolean(result)}
        busy={action.busy}
        onSelect={setSelected}
      />
      {!result ? (
        <div>
          <label className="form-label">
            Vì sao lúc trước bạn chọn như vậy?
            <textarea
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Quy tắc, từ khóa hoặc điều bạn còn phân vân…"
            />
          </label>
          <p className="small muted">
            Lời giải thích được lưu để bạn tự đối chiếu. Phần mềm không phân tích ngữ nghĩa tự do.
          </p>
          <button
            className="button primary"
            disabled={!selected || !reason.trim() || action.busy}
            onClick={() =>
              void action.run(async () => {
                if (!selected) return
                const row: LearningActivity = {
                  id: operation.current,
                  kind: 'correction',
                  contentId: attempt.id,
                  occurredAt: Date.now(),
                  selected,
                  correct: selected === question.answer,
                  reason,
                }
                await saveLearningActivity(row)
                setResult(row)
              })
            }
          >
            Lưu lượt thử & xem lập luận
          </button>
        </div>
      ) : (
        <>
          <p role="status" className="notice">
            Lượt thử lại: {result.correct ? 'đúng' : 'chưa đúng'}. Cùng đối chiếu cách nghĩ đã ghi.
          </p>
          <blockquote>{result.reason}</blockquote>
          <h4>Đối chiếu lập luận cho lượt đầu tiên</h4>
          <QuestionFeedback question={question} attempt={attempt} showMistakeNote={false} />
          {attempt.selected && (
            <button className="button secondary" onClick={() => navigate('tutor', attempt.id)}>
              Giải thích từng bước cùng Tutor
            </button>
          )}
          {transfer.current ? (
            <section className="transfer-exercise">
              <h3>Vận dụng vào câu khác</h3>
              <p className="small muted">
                Chưa có lượt trả lời câu này khi bạn mở Lab. Cùng kỹ năng; không đảm bảo độ khó
                tương đương.
              </p>
              <CorrectionStimulus question={transfer.current} />
              <QuestionRenderer
                question={transfer.current}
                number={2}
                mode="study"
                selected={transferResult?.transferSelected ?? transferSelected}
                locked={Boolean(transferResult)}
                feedback={Boolean(transferResult)}
                busy={action.busy}
                onSelect={setTransferSelected}
              />
              {transferResult ? (
                <div>
                  <strong role="status">
                    {transferResult.transferCorrect ? 'Vận dụng đúng.' : 'Cùng đối chiếu lại.'}
                  </strong>
                  <details className="feedback-disclosure">
                    <summary>Xem giải thích</summary>
                    <p>{transfer.current.explanation}</p>
                    {transferDesign && <QuestionDesignAnalysis design={transferDesign} />}
                    {transfer.current.options.map((o) => (
                      <p key={o.id}>
                        {o.id}.{' '}
                        {transferDesign?.options.find((row) => row.id === o.id)?.reason ??
                          o.reasoning}
                      </p>
                    ))}
                  </details>
                </div>
              ) : (
                <button
                  className="button secondary"
                  disabled={!transferSelected || action.busy}
                  onClick={() =>
                    void action.run(async () => {
                      if (!transferSelected || !transfer.current) return
                      const next = {
                        ...result,
                        id: transferOperation.current,
                        occurredAt: Date.now(),
                        transferId: transfer.current.id,
                        transferSelected,
                        transferCorrect: transferSelected === transfer.current.answer,
                      }
                      await saveLearningActivity(next)
                      setTransferResult(next)
                    })
                  }
                >
                  Kiểm tra chuyển giao
                </button>
              )}
              <SaveQuestionButton question={transfer.current} />
            </section>
          ) : (
            <p className="small muted">
              Chưa có câu chuyển giao chưa gặp cùng kỹ năng. Bạn có thể ôn lại quy tắc hoặc mở Tutor
              cho tình huống được hỗ trợ.
            </p>
          )}
          <SaveQuestionButton question={question} />
        </>
      )}
      <InlineError message={action.error} />
    </div>
  )
}
