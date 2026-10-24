import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Download, X } from 'lucide-react'
import { useStudy } from '../application/StudyContext'
import { navigate, useAction } from '../application/hooks'
import { exportStudyData, savePreferences } from '../application/studyRepository'
import type { StudyMinutes, Theme } from '../domain/models'
import { InlineError } from './ui'
import { downloadJson } from './downloadJson'

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { preferences } = useStudy()
  const [draft, setDraft] = useState(preferences)
  const [exported, setExported] = useState(false)
  const returnFocus = useRef(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const action = useAction()
  async function download() {
    await action.run(async () => {
      const json = await exportStudyData()
      downloadJson(json)
      setExported(true)
    })
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!action.busy) onOpenChange(value)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog settings-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            returnFocus.current?.focus({ preventScroll: true })
          }}
        >
          <Dialog.Title>Nhịp học của bạn</Dialog.Title>
          <Dialog.Description className="muted">
            Một kế hoạch vừa sức luôn tốt hơn một kế hoạch bỏ dở.
          </Dialog.Description>
          <Dialog.Close
            className="icon-button dialog-close"
            aria-label="Đóng thiết lập"
            disabled={action.busy}
          >
            <X size={20} />
          </Dialog.Close>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void action.run(async () => {
                await savePreferences(draft)
                onOpenChange(false)
              })
            }}
          >
            <label className="form-label">
              Mục tiêu mỗi ngày
              <select
                value={draft.dailyGoal}
                onChange={(event) => setDraft({ ...draft, dailyGoal: Number(event.target.value) })}
              >
                {[3, 6, 9, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} câu hỏi / ngày
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Thời lượng một lượt học
              <select
                value={draft.studyMinutes}
                onChange={(event) =>
                  setDraft({ ...draft, studyMinutes: Number(event.target.value) as StudyMinutes })
                }
              >
                {[10, 20, 40].map((minutes) => (
                  <option value={minutes} key={minutes}>
                    {minutes} phút · kế hoạch ước tính
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Mục tiêu TOEIC
              <select
                value={draft.targetScore}
                onChange={(event) =>
                  setDraft({ ...draft, targetScore: Number(event.target.value) })
                }
              >
                {[450, 650, 800, 900, 990].map((n) => (
                  <option key={n} value={n}>
                    {n} điểm
                  </option>
                ))}
              </select>
            </label>
            <p className="small muted">
              Đây là mục tiêu cá nhân. Ứng dụng không dự đoán điểm thi TOEIC.
            </p>
            <label className="form-label">
              Giao diện
              <select
                value={draft.theme}
                onChange={(event) => setDraft({ ...draft, theme: event.target.value as Theme })}
              >
                <option value="system">Theo thiết bị</option>
                <option value="light">Sáng</option>
                <option value="dark">Tối</option>
              </select>
            </label>
            <InlineError message={action.error} />
            <div className="form-actions">
              <Dialog.Close type="button" className="button secondary" disabled={action.busy}>
                Hủy
              </Dialog.Close>
              <button type="submit" className="button primary" disabled={action.busy}>
                {action.busy ? 'Đang lưu…' : 'Lưu thay đổi'}
                <Check size={16} />
              </button>
            </div>
          </form>
          <div className="export-section">
            <h3>Sổ học trên thiết bị</h3>
            <p className="small muted">
              Tiến độ nằm trong trình duyệt này. Xuất một bản sao trước khi xóa dữ liệu trình duyệt.
              Nhập, đối chiếu và khôi phục trong mục quản lý sổ học.
            </p>
            <button
              className="button secondary"
              onClick={() => void download()}
              disabled={action.busy}
            >
              <Download size={16} />
              Xuất dữ liệu JSON
            </button>
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => {
                onOpenChange(false)
                navigate('data')
              }}
            >
              Quản lý sổ học & khôi phục
            </button>
            {exported && (
              <p className="small success-text" role="status">
                Đã tạo tệp để tải xuống.
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
