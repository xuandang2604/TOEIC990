import { useEffect, useRef, useState } from 'react'
import type { Passage } from '../../content/schema'
import type { ReadingWorkspace } from '../../domain/studio'
import { textVersion, readingBlocks, readingText } from '../../domain/studio'
import { useStudy } from '../../application/StudyContext'
import { useAction } from '../../application/hooks'
import { saveReadingWorkspace } from '../../application/studioRepository'
import { InlineError } from '../../components/ui'

export function ReadingDocument({ passage }: { passage: Passage }) {
  const { readingWorkspaces } = useStudy()
  const action = useAction()
  const body = useRef<HTMLDivElement>(null)
  const editing = useRef(false)
  const row = readingWorkspaces.find((w) => w.id === passage.id)
  const text = readingText(passage.text)
  const version = textVersion(text)
  const stale = row && row.contentVersion !== version
  const workspace: ReadingWorkspace =
    !row || stale
      ? {
          id: passage.id,
          contentVersion: version,
          revision: row?.revision ?? 0,
          position: 0,
          marks: [],
          updatedAt: 0,
        }
      : row
  const [selection, setSelection] = useState<{
    start: number
    end: number
    quote: string
    revision: number
  } | null>(null)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const blocks = readingBlocks(text).filter((b) => b.quote.length <= 3000)
  useEffect(() => {
    const capture = () => {
      if (editing.current) return
      const selected = window.getSelection()
      if (!selected || selected.isCollapsed || selected.rangeCount !== 1 || !body.current) return
      const range = selected.getRangeAt(0)
      if (
        !body.current.contains(range.startContainer) ||
        !body.current.contains(range.endContainer)
      )
        return
      const before = range.cloneRange()
      before.selectNodeContents(body.current)
      before.setEnd(range.startContainer, range.startOffset)
      const start = before.toString().length
      const quote = range.toString()
      if (quote.trim() && quote.length <= 3000) {
        setSelection({ start, end: start + quote.length, quote, revision: row?.revision ?? 0 })
        const previous = row?.marks.find((m) => m.start === start && m.end === start + quote.length)
        setNote(previous?.note ?? '')
        editing.current = Boolean(previous?.note)
      }
    }
    document.addEventListener('selectionchange', capture)
    return () => document.removeEventListener('selectionchange', capture)
  }, [passage.id, row?.revision])
  async function save(patch: Partial<ReadingWorkspace>, expectedRevision = workspace.revision) {
    const ok = await action.run(async () => {
      await saveReadingWorkspace({ ...workspace, ...patch }, expectedRevision)
      return true
    })
    if (ok) setStatus('Đã lưu trên thiết bị.')
    return ok
  }
  const boundaries = [
    ...new Set([
      0,
      text.length,
      ...workspace.marks.flatMap((m) => [m.start, m.end]),
      workspace.position,
    ]),
  ].sort((a, b) => a - b)
  return (
    <section className="stimulus-document reading-document" aria-label={passage.title}>
      <div className="studio-heading">
        <h3>{passage.title}</h3>
        <span className="small muted">READING STUDIO</span>
      </div>
      {stale && (
        <p className="notice">
          Văn bản đã đổi phiên bản. Ghi chú cũ vẫn trong bản sao dữ liệu; không áp vị trí cũ lên văn
          bản mới. Xuất bản sao trước khi tạo ghi chú thay thế.
        </p>
      )}
      <div className="reading-toolbar">
        <button
          className="button secondary"
          disabled={!row || Boolean(stale)}
          onClick={() =>
            body.current
              ?.querySelector('[data-reading-position]')
              ?.scrollIntoView({ block: 'center', behavior: 'instant' })
          }
        >
          Về vị trí đã lưu
        </button>
        <span className="small muted">
          Chọn một đoạn để đánh dấu hoặc ghi chú. Tra từ: Alt + Enter.
        </span>
        {!stale && (
          <label className="form-label">
            Chọn đoạn bằng bàn phím
            <select
              value=""
              disabled={action.busy || editing.current}
              onChange={(e) => {
                const selected = blocks[Number(e.target.value)]
                if (!selected) return
                const previous = workspace.marks.find(
                  (m) => m.start === selected.start && m.end === selected.end,
                )
                setSelection({ ...selected, revision: workspace.revision })
                setNote(previous?.note ?? '')
                editing.current = Boolean(previous?.note)
              }}
            >
              <option value="">Chọn một đoạn để ghi chú…</option>
              {blocks.map((b, i) => (
                <option key={b.start} value={i}>
                  Đoạn {i + 1}: {b.quote.replace(/\s+/g, ' ').slice(0, 75)}…
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div ref={body} className="passage-body reading-text" lang="en" data-learning>
        {boundaries.slice(0, -1).map((start, i) => {
          const end = boundaries[i + 1]
          const marks = workspace.marks.filter((m) => m.start < end && m.end > start)
          return (
            <span
              key={start}
              data-reading-position={
                start === workspace.position ||
                (workspace.position === text.length && end === text.length) ||
                undefined
              }
            >
              {marks.length ? (
                <mark title={marks.map((m) => m.note || 'Đã đánh dấu').join(' · ')}>
                  {text.slice(start, end)}
                </mark>
              ) : (
                text.slice(start, end)
              )}
            </span>
          )
        })}
      </div>
      {selection && !stale && (
        <div className="reading-annotation">
          <p className="small" lang="en">
            “{selection.quote.slice(0, 160)}
            {selection.quote.length > 160 ? '…' : ''}”
          </p>
          <label className="form-label">
            Ghi chú (tuỳ chọn)
            <textarea
              maxLength={1000}
              rows={2}
              value={note}
              disabled={action.busy}
              onChange={(e) => {
                editing.current = Boolean(e.target.value)
                setNote(e.target.value)
              }}
            />
          </label>
          {editing.current && (
            <p className="small muted">
              Đang sửa ghi chú cho đoạn này. Lưu hoặc bỏ chọn trước khi đổi đoạn.
            </p>
          )}
          <div className="studio-actions">
            <button
              className="button secondary"
              disabled={action.busy || workspace.marks.length >= 100}
              onClick={() =>
                void (async () => {
                  const existing = workspace.marks.find(
                    (m) => m.start === selection.start && m.end === selection.end,
                  )
                  const marks = [
                    ...workspace.marks.filter((m) => m.id !== existing?.id),
                    {
                      start: selection.start,
                      end: selection.end,
                      quote: selection.quote,
                      id: existing?.id ?? crypto.randomUUID(),
                      note,
                    },
                  ]
                  if (await save({ marks, position: selection.start }, selection.revision)) {
                    editing.current = false
                    setSelection(null)
                    setNote('')
                  }
                })()
              }
            >
              Lưu đánh dấu & ghi chú
            </button>
            <button
              className="text-link"
              disabled={action.busy}
              onClick={() => void save({ position: selection.start }, selection.revision)}
            >
              Đặt mốc đọc ở đây
            </button>
            <button
              className="text-link"
              disabled={action.busy}
              onClick={() => {
                editing.current = false
                setSelection(null)
                setNote('')
              }}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}
      {workspace.marks.length > 0 && (
        <details className="reading-notes">
          <summary>{workspace.marks.length} đánh dấu & ghi chú</summary>
          {workspace.marks.map((m) => (
            <div key={m.id}>
              <blockquote lang="en">{m.quote}</blockquote>
              <p>{m.note || 'Đoạn đã đánh dấu'}</p>
              <button
                className="text-link"
                disabled={action.busy}
                onClick={() =>
                  void save({ marks: workspace.marks.filter((item) => item.id !== m.id) })
                }
              >
                Xóa đánh dấu này
              </button>
            </div>
          ))}
        </details>
      )}
      <p className="small muted" role="status">
        {status}
      </p>
      <InlineError message={action.error} />
    </section>
  )
}
