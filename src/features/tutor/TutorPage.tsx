import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookmarkCheck, BookOpen, Lightbulb, MessageSquareText } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate, navigateReference, returnToQuestion } from '../../application/hooks'
import { submitTutorExplanation } from '../../application/tutorRepository'
import { navigateStudyQuestion } from '../../application/studyRepository'
import { questionById } from '../../content/questions'
import { tutorLessonByQuestion } from '../../content/tutorLessons'
import { grammarById } from '../../content/grammar'
import { vocabularyById } from '../../content/vocabulary'
import type { Attempt } from '../../domain/models'
import { currentTutorTurns, tutorQuestion } from '../../domain/tutoring'
import { EmptyState, InlineError, PageHeading, Tag } from '../../components/ui'
import { SaveKnowledgeButton } from '../review/SaveKnowledgeButton'
import { TutorWriting } from './TutorWriting'
import { TutorGuidance } from './TutorGuidance'
import { TutorTransfer } from './TutorTransfer'
import { TutorRecoveries } from './TutorRecoveries'

export function TutorPage({ id }: { id?: string }) {
  const { attempts } = useStudy()
  const ordered = attempts
    .filter((a) => a.selected !== null)
    .sort((a, b) => b.occurredAt - a.occurredAt)
  const attempt = id
    ? ordered.find((a) => a.id === id)
    : (ordered.find((a) => a.source !== 'tutor') ?? ordered[0])
  const [limit, setLimit] = useState(25)
  const choices = [
    ...new Map(
      [...(attempt ? [attempt] : []), ...ordered.slice(0, limit)].map((a) => [a.id, a]),
    ).values(),
  ]
  return (
    <>
      <PageHeading
        eyebrow="GIẢI THÍCH · ĐỐI CHIẾU · VẬN DỤNG"
        title="Hiểu đến mức nói lại được."
        description="Một sổ học lấy cảm hứng từ cách học Feynman. Làm rõ cách nghĩ của bạn, rồi kiểm chứng trong một câu khác."
        action={<Tag tone="sage">Tutor offline · Hướng dẫn soạn sẵn</Tag>}
      />
      <div className="tutor-boundary">
        <Lightbulb size={18} />
        <p>
          Tutor đối chiếu đáp án và lý do bạn tự chọn. Phần viết tự do được lưu để bạn xem lại; hệ
          thống không đọc hiểu hoặc chấm ngữ nghĩa phần viết đó.
        </p>
      </div>
      {ordered.length > 0 && (
        <div className="tutor-selector-row">
          <label className="form-label tutor-question-select">
            Câu đã nộp để cùng xem lại
            <select
              value={attempt?.id ?? ''}
              onChange={(event) => navigate('tutor', event.target.value)}
            >
              {!attempt && (
                <option value="" disabled>
                  Chọn một câu đã trả lời
                </option>
              )}
              {choices.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.correct ? 'Đúng' : 'Cần củng cố'} ·{' '}
                  {(tutorQuestion(a, questionById)?.prompt ?? 'Nội dung câu đang thiếu').slice(
                    0,
                    85,
                  )}{' '}
                  · {new Date(a.occurredAt).toLocaleString('vi-VN')}
                </option>
              ))}
            </select>
          </label>
          {ordered.length > limit && (
            <button className="text-link" onClick={() => setLimit((n) => n + 25)}>
              Thêm câu trước
            </button>
          )}
        </div>
      )}
      {attempt ? (
        <TutorFlow key={attempt.id} attempt={attempt} />
      ) : (
        <EmptyState
          icon={MessageSquareText}
          title={id ? 'Không tìm thấy lượt trả lời này.' : 'Bắt đầu từ một câu đã làm.'}
          action={
            <button className="button primary" onClick={() => navigate('practice')}>
              Mở bài luyện
              <ArrowRight size={16} />
            </button>
          }
        >
          {id
            ? 'Lịch sử hiện có vẫn được giữ. Chọn một câu khác đã nộp trong sổ học.'
            : 'Trả lời một câu trước, rồi giải thích cách chọn, đối chiếu hướng dẫn và thử vận dụng.'}
        </EmptyState>
      )}
    </>
  )
}

function TutorFlow({ attempt }: { attempt: Attempt }) {
  const data = useStudy(),
    action = useAction()
  const [historyLimit, setHistoryLimit] = useState(6)
  const legacyController = useRef<AbortController | null>(null)
  useEffect(() => () => legacyController.current?.abort(), [])
  const question = tutorQuestion(attempt, questionById)
  const reflection = data.reflections.find((r) => r.attemptId === attempt.id)
  const { explanation, revision } = currentTutorTurns(reflection, data.tutorTurns)
  if (!question)
    return (
      <EmptyState icon={BookOpen} title="Nội dung câu gốc đang thiếu.">
        Phần tự giải thích và kết quả cũ vẫn được giữ. Chưa thể tạo hướng dẫn khớp câu này.
      </EmptyState>
    )
  const lesson =
    question.provenance.revision === questionById.get(question.id)?.provenance.revision
      ? (tutorLessonByQuestion.get(question.id) ?? null)
      : null
  const origin = { sessionId: attempt.sessionId, questionId: question.id }
  const sourceSession = data.sessions.find((s) => s.id === attempt.sessionId)
  async function returnToSource() {
    const sourceHash = window.location.hash
    await action.run(async () => {
      if (sourceSession?.status === 'active')
        await navigateStudyQuestion(sourceSession.id, origin.questionId)
      if (window.location.hash === sourceHash) returnToQuestion(origin)
    })
  }
  const flowRevision = reflection?.tutor?.revision ?? 0
  const frozen = Boolean(reflection?.transferSessionId)
  const history = data.tutorTurns
    .filter((t) => t.reflectionId === attempt.id)
    .sort((a, b) => b.createdAt - a.createdAt)
  const missingFlow = Boolean(reflection?.tutor && !explanation)
  const relatedGrammar = [
    ...new Set([...question.grammarIds, ...(lesson ? [lesson.grammarId] : [])]),
  ].flatMap((id) => {
    const g = grammarById.get(id)
    return g ? [g] : []
  })
  return (
    <div className="tutor-workspace">
      <div className="tutor-notebook">
        <InlineError message={action.error} />
        <TutorRecoveries reflectionId={attempt.id} />
        <section className="tutor-step">
          <span className="step-marker done">01</span>
          <div className="tutor-step-content">
            <p className="eyebrow">BẮT ĐẦU TỪ LỰA CHỌN CỦA BẠN</p>
            <h2 lang="en" data-learning>
              {question.prompt}
            </h2>
            <div className="tutor-answer">
              <Tag tone={attempt.correct ? 'sage' : 'brass'}>
                Đã chọn {attempt.selected} · {attempt.correct ? 'Đúng' : 'Chưa đúng'}
              </Tag>
              <p lang="en" data-learning>
                {question.options.find((o) => o.id === attempt.selected)?.text}
              </p>
            </div>
            <p className="small muted">
              {lesson
                ? 'Có hướng dẫn theo ngộ nhận được biên soạn riêng cho mẫu câu này.'
                : 'Chưa có nhánh ngộ nhận riêng cho câu này. Tutor dùng lời giải và tài liệu tham chiếu, không suy diễn nguyên nhân bạn chọn.'}
            </p>
            <button
              className="text-link"
              disabled={!sourceSession || action.busy}
              onClick={() => void returnToSource()}
            >
              Về câu gốc và tư liệu
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
        <section className="tutor-step">
          <span className={`step-marker ${explanation ? 'done' : 'current'}`}>02</span>
          <div className="tutor-step-content">
            <p className="eyebrow">TỰ GIẢI THÍCH TRƯỚC</p>
            <h2>Bạn đã nghĩ như thế nào?</h2>
            {missingFlow ? (
              <p role="alert">
                Một bản ghi hướng dẫn liên quan đang thiếu. Sổ hiện có được giữ nguyên; xuất dữ liệu
                để kiểm tra trước khi thay đổi.
              </p>
            ) : explanation ? (
              <div className="tutor-written-note">
                <span className="small muted">
                  Cách nghĩ ban đầu · {new Date(explanation.createdAt).toLocaleString('vi-VN')}
                </span>
                <p>{explanation.text}</p>
                {explanation.reasonId && (
                  <p className="small muted">
                    Lý do tự chọn:{' '}
                    {lesson?.reasons.find((r) => r.id === explanation.reasonId)?.label ??
                      'Lý do đã ghi trong bản hướng dẫn'}
                  </p>
                )}
              </div>
            ) : frozen && reflection ? (
              <>
                <div className="tutor-written-note">
                  <p>{reflection.reasoning}</p>
                </div>
                <p className="small muted">
                  Bản lưu Tutor cũ đã có câu vận dụng; không có bản ghi bước viết lại. Giữ nguyên
                  kết quả cũ, không giả rằng nó đã đi qua luồng mới.
                </p>
                <button
                  className="button secondary"
                  disabled={action.busy}
                  onClick={() =>
                    void action.run(() => {
                      legacyController.current = new AbortController()
                      return submitTutorExplanation(
                        {
                          attemptId: attempt.id,
                          text: reflection.reasoning,
                          reasonId: null,
                          expectedRevision: flowRevision,
                          operationId: crypto.randomUUID(),
                        },
                        legacyController.current.signal,
                      )
                    })
                  }
                >
                  Mở hướng dẫn cho bản lưu
                  <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <TutorWriting
                key={`explanation:${flowRevision}`}
                attemptId={attempt.id}
                phase="explanation"
                baseRevision={flowRevision}
                initialText={reflection?.reasoning}
                lesson={lesson}
              />
            )}
          </div>
        </section>
        {explanation && (
          <section className="tutor-step">
            <span className="step-marker done">03</span>
            <div className="tutor-step-content">
              <p className="eyebrow">ĐỐI CHIẾU, KHÔNG PHÁN ĐOÁN</p>
              <h2>Nhìn lại một dấu hiệu quan trọng.</h2>
              <TutorGuidance guidance={explanation.guidance} />
            </div>
          </section>
        )}
        {explanation && (
          <section className="tutor-step">
            <span className={`step-marker ${revision ? 'done' : 'current'}`}>04</span>
            <div className="tutor-step-content">
              <p className="eyebrow">THỬ NÓI LẠI RÕ HƠN</p>
              <h2>Điều gì thay đổi trong cách hiểu?</h2>
              {frozen ? (
                revision ? (
                  <div className="tutor-written-note">
                    <p>{revision.text}</p>
                    <small>Được lưu trước khi bắt đầu vận dụng; chưa được tự động chấm.</small>
                  </div>
                ) : (
                  <p className="small muted">
                    Lượt vận dụng cũ không có bản ghi viết lại. Không dựng lại một câu trả lời thay
                    bạn.
                  </p>
                )
              ) : (
                <>
                  <TutorWriting
                    key={`revision:${flowRevision}`}
                    attemptId={attempt.id}
                    phase="revision"
                    baseRevision={flowRevision}
                    initialText={revision?.text}
                    initialStance={revision?.stance}
                    lesson={lesson}
                  />
                  {revision && (
                    <p className="tutor-saved-status">
                      <BookmarkCheck size={16} />
                      Đã lưu cách hiểu. Có thể chỉnh thêm trước khi mở câu vận dụng.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>
        )}
        {reflection && (explanation || frozen) && (
          <TutorTransfer reflection={reflection} question={question} lesson={lesson} />
        )}
        {history.length > 0 && (
          <details className="tutor-history">
            <summary>Những lần tự giải thích đã lưu ({history.length})</summary>
            {history.slice(0, historyLimit).map((turn) => (
              <article key={turn.id}>
                <span className="eyebrow">
                  {turn.kind === 'revision'
                    ? 'VIẾT LẠI'
                    : turn.kind === 'legacy-explanation'
                      ? 'BẢN LƯU TUTOR CŨ'
                      : 'CÁCH NGHĨ BAN ĐẦU'}{' '}
                  · {new Date(turn.createdAt).toLocaleString('vi-VN')}
                </span>
                <p>{turn.text}</p>
              </article>
            ))}
            {history.length > historyLimit && (
              <button className="text-link" onClick={() => setHistoryLimit((n) => n + 6)}>
                Xem thêm bản lưu
              </button>
            )}
          </details>
        )}
      </div>
      <aside className="tutor-reference-rail" aria-label="Tài liệu để đối chiếu">
        <p className="eyebrow">ĐẶT KIẾN THỨC BÊN CẠNH</p>
        <h2>Một điểm tựa khi cần.</h2>
        <p className="small muted">
          Rời trang không kết thúc phiên học. Nháp Tutor được lưu sau khi gõ hoặc rời ô viết; xem
          trạng thái lưu trước khi đóng trình duyệt.
        </p>
        {relatedGrammar.map((g) => (
          <div className="tutor-reference-item" key={g.id}>
            <button
              className="text-link"
              onClick={() => navigateReference('grammar', g.id, origin, attempt.id)}
            >
              <BookOpen size={16} />
              {g.title}
              <ArrowRight size={14} />
            </button>
            <SaveKnowledgeButton lessonId={g.id} />
          </div>
        ))}
        {question.vocabularyIds.length > 0 && (
          <>
            <h3>Từ trong ngữ cảnh</h3>
            <div className="tag-list">
              {question.vocabularyIds.map((id) => (
                <button
                  key={id}
                  lang="en"
                  className="word-chip"
                  onClick={() => navigateReference('vocabulary', id, origin, attempt.id)}
                >
                  {vocabularyById.get(id)?.word ?? 'Từ đang thiếu'}
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          </>
        )}
        <div className="tutor-learning-limit">
          <strong>Một bước hiểu rõ hơn.</strong>
          <p>
            Viết hay hoặc lưu lời giải thích không làm tăng độ chính xác, độ thành thạo hay tự giãn
            lịch ôn. Câu vận dụng được chấm như một lượt luyện thực tế.
          </p>
        </div>
        {lesson && (
          <p className="small muted">
            Hướng dẫn: {lesson.provenance.author} · {lesson.provenance.revision}.
          </p>
        )}
      </aside>
    </div>
  )
}
