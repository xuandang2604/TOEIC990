import { useId, useMemo, useRef, useState } from 'react'
import { DIFFICULTY_LABELS, passages, questionById, stimulusFor } from '../../content/questions'
import type { Question } from '../../content/schema'
import type { Attempt, StudySession } from '../../domain/models'
import type { PracticeUnit } from '../../domain/assessment'
import { listeningAudio } from '../../domain/listening'
import { useStudy } from '../../application/StudyContext'
import { useAction, useRoute } from '../../application/hooks'
import { saveStudyDraft, submitAnswer } from '../../application/studyRepository'
import { saveExamResponse, toggleExamFlag } from '../../application/examRepository'
import { Flag } from 'lucide-react'
import { MediaPlayer } from '../../components/MediaPlayer'
import { InlineError, Tag } from '../../components/ui'
import { QuestionRenderer } from './QuestionRenderer'
import { QuestionFeedback, SaveQuestionButton } from './QuestionFeedback'
import { StimulusView } from './StimulusView'
import { useQuestionTiming } from '../../components/useQuestionTiming'
import { ListeningLab } from '../listening/ListeningLab'
import { ListeningTranscript } from '../listening/ListeningTranscript'
import { ReadingDocument } from '../reading/ReadingDocument'
import { ReportQuestion } from './ReportQuestion'
import { questionQualityLabel } from '../../content/eligibility'

export function UnitContent({
  unit,
  session,
  review = false,
  beginAudio,
  skipAudio,
}: {
  unit: PracticeUnit
  session: StudySession
  review?: boolean
  beginAudio?: Parameters<typeof MediaPlayer>[0]['begin']
  skipAudio?: () => Promise<unknown>
}) {
  const data = useStudy()
  const audioId = useId()
  const audioControls = useRef<HTMLDivElement>(null)
  const route = useRoute()
  const items = unit.questionIds.map(
    (id) =>
      data.attempts.find((a) => a.id === `${session.id}:${id}`)?.questionSnapshot?.content ??
      questionById.get(id)!,
  )
  const stimulus = stimulusFor(items[0])
  const key = unit.questionIds.join('|')
  const audio = useMemo(
    () => (stimulus ? listeningAudio(stimulus, items) : undefined),
    [stimulus, key],
  )
  const exam = session.mode === 'exam' && !review
  const [timedQuestionId, setTimedQuestionId] = useState(
    unit.questionIds.includes(route.focusQuestionId ?? '')
      ? route.focusQuestionId!
      : unit.questionIds.includes(session.questionIds[session.cursor])
        ? session.questionIds[session.cursor]
        : unit.questionIds[0],
  )
  const timingWarning = useQuestionTiming(
    session.id,
    timedQuestionId,
    !review &&
      session.status === 'active' &&
      !data.attempts.some((a) => a.id === `${session.id}:${timedQuestionId}`),
  )
  const playback = data.playbacks.find((p) => p.id === `${session.id}:${unit.id}`)
  return (
    <div
      className={`question-layout ${stimulus ? 'with-passage' : ''} grouped-layout`}
      data-session-id={session.id}
      onPointerDownCapture={(event) => {
        const id = (event.target as Element)
          .closest('.question-card')
          ?.getAttribute('data-question-id')
        if (id && unit.questionIds.includes(id)) setTimedQuestionId(id)
      }}
      onFocusCapture={(event) => {
        const id = event.target.closest('.question-card')?.getAttribute('data-question-id')
        if (id && unit.questionIds.includes(id)) setTimedQuestionId(id)
      }}
      data-question-id={
        unit.questionIds.includes(session.questionIds[session.cursor])
          ? session.questionIds[session.cursor]
          : unit.questionIds[0]
      }
    >
      {stimulus && (
        <StimulusView
          key={unit.id}
          stimulus={stimulus}
          passages={passages}
          exam={exam}
          reveal={
            review ||
            items.every((question) =>
              data.attempts.some((attempt) => attempt.id === `${session.id}:${question.id}`),
            )
          }
          renderPassage={(passage) => <ReadingDocument passage={passage} />}
        >
          {audio && (
            <>
              <div
                id={audioId}
                ref={audioControls}
                tabIndex={-1}
                role="region"
                aria-label="Điều khiển âm thanh nhóm câu"
              >
                <MediaPlayer
                  audio={audio}
                  once={exam}
                  consumed={playback?.status === 'completed'}
                  interrupted={Boolean(playback && playback.status !== 'completed')}
                  begin={exam ? beginAudio : undefined}
                  onSkip={exam ? skipAudio : undefined}
                />
              </div>
              {!exam && (
                <ListeningLab
                  audio={'audio' in stimulus ? stimulus.audio : audio}
                  stimulusId={stimulus.id}
                />
              )}
              {!exam && (
                <details className="transcript">
                  <summary>Xem bản chép lời · Anh – Việt (gợi ý)</summary>
                  <ListeningTranscript
                    stimulusId={stimulus.id}
                    transcript={'audio' in stimulus ? stimulus.audio.transcript : ''}
                    options={stimulus.part <= 2 ? items[0].options : []}
                  />
                </details>
              )}
            </>
          )}
        </StimulusView>
      )}
      <div className="unit-questions">
        {audio && (
          <button
            className="mobile-audio-jump button secondary"
            aria-controls={audioId}
            onClick={() => {
              audioControls.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
              audioControls.current?.focus({ preventScroll: true })
            }}
          >
            Về điều khiển âm thanh
          </button>
        )}
        {timingWarning && (
          <p className="small brass-text" role="status">
            {timingWarning}
          </p>
        )}
        {items.map((question, index) => (
          <QuestionCard
            key={`${session.id}:${question.id}:${review}`}
            question={question}
            number={session.questionIds.indexOf(question.id) + 1}
            session={session}
            attempt={data.attempts.find((a) => a.id === `${session.id}:${question.id}`)}
            review={review}
            autoFocus={
              unit.questionIds.includes(route.focusQuestionId ?? '')
                ? question.id === route.focusQuestionId
                : index === 0
            }
          />
        ))}
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  number,
  session,
  attempt,
  review,
  autoFocus,
}: {
  question: Question
  number: number
  session: StudySession
  attempt?: Attempt
  review: boolean
  autoFocus: boolean
}) {
  const route = useRoute()
  const data = useStudy(),
    action = useAction()
  const draft = data.studyDrafts.find((d) => d.id === `${session.id}:${question.id}`)
  const selected = draft?.selected ?? null
  const confidence = draft?.confidenceSource === 'explicit' ? draft.confidence : null
  const exam = session.mode === 'exam' && !review
  const response = data.responses.find((r) => r.id === `${session.id}:${question.id}`)
  return (
    <section className="question-card" data-question-id={question.id}>
      <div className="question-card-meta">
        <Tag>{DIFFICULTY_LABELS[question.difficulty]}</Tag>
        {!exam && <SaveQuestionButton question={question} />}
        {exam && (
          <button
            type="button"
            className="text-link exam-flag"
            aria-pressed={session.flaggedQuestionIds?.includes(question.id) ?? false}
            disabled={action.busy}
            onClick={() => void action.run(() => toggleExamFlag(session.id, question.id))}
          >
            <Flag size={15} />
            {session.flaggedQuestionIds?.includes(question.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
          </button>
        )}
      </div>
      <QuestionRenderer
        qualityLabel={exam ? undefined : questionQualityLabel(question)}
        question={question}
        number={number}
        mode={exam ? 'exam' : 'study'}
        selected={exam ? (response?.selected ?? null) : (attempt?.selected ?? selected)}
        locked={review || Boolean(attempt)}
        feedback={!exam && Boolean(attempt)}
        busy={action.busy}
        onSelect={(option) => {
          if (exam) void action.run(() => saveExamResponse(session.id, question.id, option))
          else void action.run(() => saveStudyDraft(session.id, question.id, { selected: option }))
        }}
        confidence={confidence}
        onConfidence={(confidence) =>
          void action.run(() => saveStudyDraft(session.id, question.id, { confidence }))
        }
        onSubmit={() => {
          if (selected)
            void action.run(() => submitAnswer(session.id, question.id, selected, confidence))
        }}
        autoFocus={autoFocus}
        scrollOnFocus={route.focusQuestionId === question.id}
      />
      <InlineError message={action.error} />
      {!exam && !attempt && <ReportQuestion question={question} />}
      {exam && (
        <p className="small muted" role="status">
          {action.busy
            ? 'Đang lưu lựa chọn…'
            : response
              ? `Đã lưu lựa chọn ${response.selected}.`
              : 'Chưa chọn đáp án.'}
        </p>
      )}
      {!exam && attempt && <QuestionFeedback question={question} attempt={attempt} />}
    </section>
  )
}
