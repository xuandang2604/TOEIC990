import { UnitNavigation } from './UnitNavigation'
import { mockForSession } from '../../content/mockExams'
import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, ArrowRight, Clock3, CircleHelp } from 'lucide-react'
import { allQuestions, PART_LABELS, questionById } from '../../content/questions'
import type { StudySession } from '../../domain/models'
import {
  canNavigateExam,
  examExpired,
  sessionUnits,
  type PracticeUnit,
} from '../../domain/assessment'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate } from '../../application/hooks'
import { advanceSession, navigateStudyQuestion } from '../../application/studyRepository'
import {
  beginExamPlayback,
  endExamPlayback,
  finishExam,
  navigateExam,
  skipExamAudio,
} from '../../application/examRepository'
import { EmptyState, InlineError, Tag } from '../../components/ui'
import { UnitContent } from './PracticeUnit'
import { SessionResults } from './SessionResults'
import { UnavailableSession } from './UnavailableSession'

export function SessionPage({ id }: { id?: string }) {
  const data = useStudy()
  const session = data.sessions.find((s) => s.id === id)
  if (!session)
    return (
      <EmptyState
        icon={CircleHelp}
        title="Không tìm thấy phiên học"
        action={
          <button className="button primary" onClick={() => navigate('practice')}>
            Chọn bài luyện tập
          </button>
        }
      >
        Hãy mở phiên trong trình duyệt đã dùng để học.
      </EmptyState>
    )
  if (session.status === 'interrupted' || session.questionIds.some((qid) => !questionById.has(qid)))
    return <UnavailableSession session={session} />
  if (session.mode === 'exam' && !session.deadlineAt)
    return (
      <EmptyState icon={CircleHelp} title="Phiên này thiếu nội dung hoặc thiết lập thời gian">
        Dữ liệu đã lưu chưa bị xóa. Không thể chấm chính xác phiên này bằng bộ nội dung hiện tại.
      </EmptyState>
    )
  if (session.status === 'completed') return <SessionResults session={session} />
  return <ActiveSession session={session} />
}

function ActiveSession({ session }: { session: StudySession }) {
  const data = useStudy(),
    action = useAction(),
    mediaAction = useAction(),
    timerAction = useAction()
  const [now, setNow] = useState(Date.now)
  const [confirm, setConfirm] = useState<'submit' | 'reading' | null>(null)
  const confirmReturnFocus = useRef<HTMLElement | null>(null)
  function openConfirm(value: 'submit' | 'reading') {
    confirmReturnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setConfirm(value)
  }
  const units = sessionUnits(session, allQuestions)
  const unitIndex = units.findIndex((u) =>
    u.questionIds.includes(session.questionIds[session.cursor]),
  )
  const unit = units[unitIndex]
  const requestedUnit = useRef<string | null>(null)
  useEffect(() => {
    if (requestedUnit.current === unit?.id) {
      document
        .querySelector('.question-meta')
        ?.scrollIntoView({ block: 'start', behavior: 'instant' })
      requestedUnit.current = null
    }
  }, [unit?.id])
  const expired = examExpired(session, now)
  const exam = session.mode === 'exam'
  useEffect(() => {
    if (!exam) return
    const update = () => setNow(Date.now())
    const timer = window.setInterval(update, 500)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', update)
    }
  }, [exam])
  useEffect(() => {
    if (expired) void timerAction.run(() => finishExam(session.id))
  }, [expired, session.id])
  const answered = exam
    ? data.responses.filter((r) => r.sessionId === session.id).length
    : data.attempts.filter((a) => a.sessionId === session.id).length
  async function go(target: PracticeUnit) {
    if (exam && unit.part <= 4 && target.part >= 5) {
      openConfirm('reading')
      return
    }
    await action.run(async () => {
      requestedUnit.current = target.id
      if (exam) await navigateExam(session.id, target.questionIds[0])
      else await navigateStudyQuestion(session.id, target.questionIds[0])
    })
  }
  if (!unit)
    return (
      <EmptyState icon={CircleHelp} title="Vị trí phiên học không hợp lệ">
        Không có thay đổi nào được ghi vào lịch sử.
      </EmptyState>
    )
  const playback = data.playbacks.find((p) => p.id === `${session.id}:${unit.id}`)
  const unitDone = unit.questionIds.every((id) =>
    data.attempts.some((a) => a.sessionId === session.id && a.questionId === id),
  )
  const audioPending = exam && unit.part <= 4 && (!playback || playback.status === 'started')
  const remaining = Math.max(
    0,
    Math.ceil(((session.deadlineAt ?? now) - Math.max(now, session.lastObservedAt ?? now)) / 1000),
  )
  return (
    <div className="study-space" data-lookup-disabled={exam || undefined}>
      <h1 className="sr-only">
        {exam ? 'Bài tự đánh giá có thời gian' : 'Phiên luyện tập có hướng dẫn'}
      </h1>
      <div className="study-toolbar">
        <button className="text-link" onClick={() => navigate('today')}>
          <ArrowLeft size={16} />
          {exam ? 'Rời trang (giờ vẫn chạy)' : 'Tạm dừng & học sau'}
        </button>
        {session.dailyPlanId && (
          <button className="text-link" onClick={() => navigate('plan', session.dailyPlanId)}>
            Về kế hoạch
          </button>
        )}
        <Tag tone={exam ? 'brass' : 'sage'}>{exam ? 'EXAM MODE' : 'STUDY MODE'}</Tag>
        {exam ? (
          <span
            className={`exam-clock ${remaining < 60 ? 'brass-text' : ''}`}
            role="timer"
            aria-label={`Còn ${Math.floor(remaining / 60)} phút ${remaining % 60} giây`}
          >
            <Clock3 size={16} />
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </span>
        ) : (
          <span>
            {answered}/{session.questionIds.length} câu đã nộp
          </span>
        )}
        {exam && (
          <button
            className="button secondary"
            disabled={expired || action.busy}
            onClick={() => openConfirm('submit')}
          >
            Nộp bài
          </button>
        )}
      </div>
      <div
        className="session-progress"
        role="progressbar"
        aria-label="Số câu đã lưu"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={session.questionIds.length}
      >
        <span style={{ width: `${(answered / session.questionIds.length) * 100}%` }} />
      </div>
      {exam && (
        <p className="exam-note">
          {mockForSession(session)
            ? 'Mock 200 câu, nội dung AI chưa thẩm định độc lập.'
            : 'Exam practice trên bộ câu luyện.'}{' '}
          Không phải kỳ thi chính thức. Phần nghe đi theo thứ tự, audio một lần; phần đọc có thể xem
          lại. Không có lời giải, transcript hoặc tra từ trước khi nộp bài. Reload không đặt lại
          thời gian.
        </p>
      )}
      {!exam && (
        <p className="lookup-hint">
          Tra từ/cụm: bôi chọn tiếng Anh rồi nhấn “Tra” hoặc Alt + Enter. Nháp lựa chọn được lưu,
          chỉ nộp mới chấm điểm.
        </p>
      )}
      <UnitNavigation count={units.length} current={unitIndex}>
        <nav className="unit-navigation" aria-label="Điều hướng nhóm câu hỏi">
          {units.map((u, i) => {
            const count = u.questionIds.filter((id) =>
              exam
                ? data.responses.some((r) => r.id === `${session.id}:${id}`)
                : data.attempts.some((a) => a.id === `${session.id}:${id}`),
            ).length
            return (
              <button
                key={u.id}
                className={i === unitIndex ? 'active' : ''}
                aria-current={i === unitIndex ? 'step' : undefined}
                disabled={
                  action.busy ||
                  expired ||
                  (exam &&
                    ((audioPending && i !== unitIndex) ||
                      !canNavigateExam(session, allQuestions, u.questionIds[0])))
                }
                onClick={() => void go(u)}
              >
                P{u.part} · {i + 1}
                <small>
                  {count}/{u.questionIds.length}
                </small>
              </button>
            )
          })}
        </nav>
      </UnitNavigation>
      <InlineError message={action.error ?? mediaAction.error ?? timerAction.error} />
      {expired ? (
        <div className="resume-banner" role="status">
          <p>
            Đã hết giờ. Đang chốt bài từ các lựa chọn đã lưu; chưa có lựa chọn nào được nhận thêm.
          </p>
          <button
            className="button secondary"
            disabled={timerAction.busy}
            onClick={() => void timerAction.run(() => finishExam(session.id))}
          >
            Thử chốt bài lại
          </button>
        </div>
      ) : (
        <>
          <div className="question-meta">
            <Tag tone="sage">PART {unit.part}</Tag>
            <span>{PART_LABELS[unit.part]}</span>
            <span>
              · Nhóm {unitIndex + 1}/{units.length} · {unit.questionIds.length} câu
            </span>
          </div>
          <UnitContent
            key={unit.id}
            unit={unit}
            session={session}
            beginAudio={async (recover) => {
              const record = await mediaAction.run(() =>
                beginExamPlayback(session.id, unit.id, recover),
              )
              return record
                ? {
                    ended: () => {
                      void mediaAction.run(() => endExamPlayback(record, 'completed'))
                    },
                    failed: () => {
                      void mediaAction.run(() => endExamPlayback(record, 'failed'))
                    },
                  }
                : undefined
            }}
            skipAudio={() => mediaAction.run(() => skipExamAudio(session.id, unit.id))}
          />
          <div className="unit-footer">
            <span className="small muted">
              {exam
                ? `${answered}/${session.questionIds.length} lựa chọn đã lưu, chưa chấm điểm.`
                : unitDone
                  ? 'Nhóm này đã được lưu. Bạn có thể xem lại mọi nhóm.'
                  : 'Nộp từng câu để nhận phản hồi ngay.'}
            </span>
            {exam ? (
              unitIndex < units.length - 1 ? (
                <button
                  className="button primary"
                  disabled={action.busy || audioPending}
                  onClick={() => void go(units[unitIndex + 1])}
                >
                  {unit.part <= 4 && units[unitIndex + 1].part >= 5
                    ? 'Chuyển sang phần đọc'
                    : 'Nhóm tiếp theo'}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button className="button primary" onClick={() => openConfirm('submit')}>
                  Nộp bài & xem kết quả
                  <ArrowRight size={16} />
                </button>
              )
            ) : (
              <button
                className="button primary"
                disabled={action.busy || !unitDone}
                onClick={() =>
                  void action.run(() =>
                    advanceSession(session.id, session.questionIds[session.cursor]),
                  )
                }
              >
                {answered === session.questionIds.length ? 'Hoàn thành phiên học' : 'Tiếp tục'}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}
      <Dialog.Root
        open={Boolean(confirm) && !expired}
        onOpenChange={(open) => {
          if (!open && !action.busy) setConfirm(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog settings-dialog"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              confirmReturnFocus.current?.focus({ preventScroll: true })
            }}
          >
            <Dialog.Title>
              {confirm === 'reading' ? 'Chuyển sang phần đọc?' : 'Nộp mini practice?'}
            </Dialog.Title>
            <Dialog.Description className="muted">
              {confirm === 'reading'
                ? 'Bạn sẽ không quay lại câu hỏi nghe. Lựa chọn đã lưu được giữ, câu chưa chọn sẽ để trống.'
                : `Đã lưu ${answered}/${session.questionIds.length} câu. ${session.questionIds.length - answered} câu còn trống sẽ được tính là chưa đúng. Sau khi nộp, bạn có thể xem lời giải từng câu.`}
            </Dialog.Description>
            <InlineError message={action.error} />
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                disabled={action.busy}
                onClick={() => setConfirm(null)}
              >
                Quay lại
              </button>
              <button
                type="button"
                className="button primary"
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    if (confirm === 'reading') {
                      await navigateExam(session.id, units[unitIndex + 1].questionIds[0])
                      setConfirm(null)
                    } else await finishExam(session.id)
                  })
                }
              >
                {confirm === 'reading' ? 'Bắt đầu phần đọc' : 'Nộp bài'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
