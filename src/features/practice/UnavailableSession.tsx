import { CircleHelp } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, useAction } from '../../application/hooks'
import { closeUnavailableSession } from '../../application/sessionRepository'
import type { StudySession } from '../../domain/models'
import { EmptyState, InlineError } from '../../components/ui'

export function UnavailableSession({ session }: { session: StudySession }) {
  const data = useStudy(),
    action = useAction()
  const submitted = data.attempts.filter((a) => a.sessionId === session.id).length
  const selected = data.responses.filter((r) => r.sessionId === session.id).length
  const closed = session.status === 'interrupted'
  return (
    <>
      <EmptyState
        icon={CircleHelp}
        title={
          closed
            ? 'Phiên thiếu tư liệu đã được đóng.'
            : 'Bộ bài hiện tại chưa có đủ tư liệu cho phiên này.'
        }
        action={
          <div className="session-recovery-actions">
            {!closed && session.status === 'active' && (
              <button
                className="button secondary"
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    const source = window.location.hash
                    await closeUnavailableSession(session.id)
                    if (window.location.hash === source) navigate('today')
                  })
                }
              >
                Đóng phiên, giữ lịch sử & học tiếp
              </button>
            )}
            <button
              className="button primary"
              onClick={() => navigate(closed ? 'practice' : 'today')}
            >
              {closed ? 'Chọn bài luyện khác' : 'Về hôm nay'}
            </button>
          </div>
        }
      >
        Đã giữ {submitted} lượt đã nộp
        {session.mode === 'exam' ? ` và ${selected} lựa chọn bài thi` : ''} cùng bản nháp. Đóng
        phiên không chấm phần còn lại, không tăng số phiên hoàn thành hoặc thay đổi lịch ôn. Có thể
        xuất sổ học để giữ nguyên bản ghi; kế hoạch gắn với phiên sẽ được khép lại để bạn bắt đầu
        lượt khác.
      </EmptyState>
      <InlineError message={action.error} />
    </>
  )
}
