import { useEffect, useRef, useState } from 'react'
import { microLessons } from '../../content/microLessons'
import { grammarById } from '../../content/grammar'
import type { LearningActivity } from '../../domain/studio'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate } from '../../application/hooks'
import { saveLearningActivity } from '../../application/studioRepository'
import { InlineError } from '../../components/ui'
import { SaveKnowledgeButton } from '../review/SaveKnowledgeButton'
import { ChoiceChallenge } from './ChoiceChallenge'

const steps = ['Quan sát', 'Dự đoán', 'Giải thích', 'Luyện tập', 'Vận dụng', 'Ôn lại']
type Progress = Extract<LearningActivity, { kind: 'micro-lesson' }>
function LessonFlow({ id }: { id: string }) {
  const { learningActivities, attempts } = useStudy()
  const lesson = microLessons.find((l) => l.id === id)!
  const saved = learningActivities.find((a) => a.kind === 'micro-lesson' && a.contentId === id)
  const [progress, setProgress] = useState<Progress>(() =>
    saved?.kind === 'micro-lesson'
      ? saved
      : {
          id: `micro:${id}`,
          kind: 'micro-lesson',
          contentId: id,
          occurredAt: 0,
          step: 0,
          prediction: null,
          practiceSelected: null,
          transferSelected: null,
          explanation: '',
          completed: false,
          revision: 0,
        },
  )
  const [explanation, setExplanation] = useState(progress.explanation)
  const [hint, setHint] = useState(false)
  const action = useAction()
  const stepHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    stepHeading.current?.focus({ preventScroll: true })
  }, [progress.step])
  const reference = grammarById.get(lesson.lessonId)!
  const practice = lesson.practice
  const tutorAttempt = [...attempts]
    .reverse()
    .find((a) => a.selected && a.questionSnapshot?.content?.grammarIds.includes(reference.id))
  async function save(patch: Partial<Progress>) {
    const next = { ...progress, ...patch, occurredAt: Date.now() }
    const ok = await action.run(async () => {
      await saveLearningActivity(next)
      return true
    })
    if (ok) setProgress({ ...next, revision: progress.revision + 1 })
  }
  return (
    <section className="micro-lesson">
      <div className="studio-heading">
        <h3 ref={stepHeading} tabIndex={-1}>
          {lesson.title} · {steps[progress.step]}
        </h3>
        <span className="small muted">BÀI HỌC NGẮN</span>
      </div>
      <ol className="micro-steps" aria-label="Các bước bài học">
        {steps.map((s, i) => (
          <li key={s} aria-current={progress.step === i ? 'step' : undefined}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      {progress.step === 0 && (
        <>
          <div className="micro-observe">
            <p lang="en" data-learning>
              {lesson.observe}
            </p>
            <p lang="en" data-learning>
              {lesson.contrast}
            </p>
          </div>
          <p>Hai câu khác nhau ở cấu trúc nào? Thử dự đoán trước khi mở quy tắc.</p>
          <button
            className="button secondary"
            disabled={action.busy}
            onClick={() => void save({ step: 1 })}
          >
            Tôi đã quan sát · thử dự đoán
          </button>
        </>
      )}
      {progress.step === 1 && (
        <>
          <ChoiceChallenge
            key={lesson.prediction.id}
            exercise={lesson.prediction}
            answer={null}
            busy={action.busy}
            onSubmit={(prediction) => void save({ prediction, step: 2 })}
          />
          <button className="text-link" onClick={() => setHint(!hint)}>
            {hint ? 'Ẩn' : 'Một'} gợi ý nhỏ
          </button>
          {hint && <p className="notice">{lesson.hint}</p>}
        </>
      )}
      {progress.step === 2 && (
        <>
          <div className="notice">
            <strong>
              {progress.prediction === lesson.prediction.answer
                ? 'Dự đoán đúng.'
                : 'Đối chiếu lại dự đoán.'}
            </strong>
            <p>{lesson.prediction.explanation}</p>
            <p>{lesson.principle}</p>
          </div>
          <label className="form-label">
            Giải thích quy tắc bằng lời của bạn
            <textarea
              disabled={action.busy}
              maxLength={2000}
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </label>
          <p className="small muted">
            Bạn tự đối chiếu với quy tắc. Nội dung viết không được phần mềm chấm hiểu đúng/sai.
          </p>
          <button
            className="button secondary"
            disabled={!explanation.trim() || action.busy}
            onClick={() => void save({ explanation, step: 3 })}
          >
            Lưu cách hiểu · luyện tập
          </button>
        </>
      )}
      {progress.step === 3 && (
        <>
          <p>{lesson.principle}</p>
          <ChoiceChallenge
            key={practice.id}
            exercise={practice}
            answer={progress.practiceSelected}
            busy={action.busy}
            onSubmit={(practiceSelected) => void save({ practiceSelected })}
          />
          {progress.practiceSelected && (
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => void save({ step: 4 })}
            >
              Thử một cấu trúc khác
            </button>
          )}
        </>
      )}
      {progress.step === 4 && (
        <>
          <ChoiceChallenge
            key={lesson.transfer.id}
            exercise={lesson.transfer}
            answer={progress.transferSelected}
            busy={action.busy}
            onSubmit={(transferSelected) => void save({ transferSelected })}
          />
          {progress.transferSelected && (
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => void save({ step: 5, completed: true })}
            >
              Kết thúc & lên lịch ôn
            </button>
          )}
        </>
      )}
      {progress.step === 5 && (
        <>
          <p role="status">
            Đã hoàn thành các bước. Vận dụng:{' '}
            {progress.transferSelected === lesson.transfer.answer ? 'đúng' : 'cần đối chiếu lại'}.
            Hoàn thành bài không đồng nghĩa đã thành thạo.
          </p>
          <blockquote>{progress.explanation}</blockquote>
          <p>{lesson.principle}</p>
          <SaveKnowledgeButton lessonId={reference.id} />
          <p className="small muted">
            Lưu quy tắc để tự nhớ lại trong Ôn tập; lịch FSRS chỉ thay đổi khi bạn thực sự đánh giá
            lượt ôn.
          </p>
          {tutorAttempt && (
            <button className="text-link" onClick={() => navigate('tutor', tutorAttempt.id)}>
              Giải thích một câu đã gặp cùng Tutor
            </button>
          )}
        </>
      )}
      <InlineError message={action.error} />
      <p className="small muted">
        Nội dung tự biên soạn · hướng dẫn ngoại tuyến · chưa thẩm định độc lập. Tiến độ lưu sau mỗi
        bước; đoạn viết chỉ lưu khi bấm tiếp.
      </p>
    </section>
  )
}
export function MicroLessons({ lessonId }: { lessonId: string }) {
  const lessons = microLessons.filter((l) => l.lessonId === lessonId)
  const [chosen, setChosen] = useState(lessons[0]?.id)
  if (!lessons.length) return null
  return (
    <section className="micro-lessons">
      <h3>Hiểu qua một lần thử</h3>
      {lessons.length > 1 && (
        <label className="form-label">
          Chủ đề bài ngắn
          <select value={chosen} onChange={(e) => setChosen(e.target.value)}>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <LessonFlow key={chosen} id={chosen ?? lessons[0].id} />
    </section>
  )
}
