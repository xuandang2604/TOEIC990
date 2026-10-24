import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Popover from '@radix-ui/react-popover'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { localDictionary } from '../../providers/dictionary'
import type { TextSelection } from './useLearningSelection'
import { WordDetails } from './WordDetails'

export function ContextLookup({
  selection,
  onClose,
  onDetail,
  onSearch,
}: {
  selection: TextSelection
  onClose: () => void
  onDetail: (id: string) => void
  onSearch: () => void
}) {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches)
  const entry = localDictionary.lookup(selection.text)
  const leaving = useRef(false)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)')
    const update = () => setMobile(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const content = (
    <>
      <p className="lookup-source small muted">
        Đã chọn: <span lang="en">{selection.text}</span>
        {entry && entry.word.toLowerCase() !== selection.text.toLowerCase()
          ? ' · Hiển thị mục từ liên quan'
          : ''}
      </p>
      {entry ? (
        <>
          <WordDetails entry={entry} compact context={selection.context} />
          {selection.context && (
            <p className="small muted">
              Nghĩa chọn lọc từ dữ liệu local; tự đối chiếu với câu nguồn. Không tự dịch hoặc phân
              tích nghĩa toàn câu.
            </p>
          )}
          <button
            className="text-link lookup-detail-link"
            onClick={() => {
              leaving.current = true
              onDetail(entry.id)
            }}
          >
            Mở mục từ đầy đủ
            <ArrowUpRight size={15} />
          </button>
        </>
      ) : (
        <div className="lookup-missing">
          <h3 lang="en">{selection.text}</h3>
          <p>Chưa có mục từ hoặc cụm này trong bộ từ chọn lọc. Thử một từ gốc hoặc cụm ngắn hơn.</p>
          <button
            className="text-link"
            onClick={() => {
              leaving.current = true
              onSearch()
            }}
          >
            <Search size={15} />
            Tìm tài liệu liên quan
          </button>
        </div>
      )}
    </>
  )
  const restoreFocus = (event: Event) => {
    event.preventDefault()
    if (!leaving.current && selection.focus?.isConnected)
      selection.focus.focus({ preventScroll: true })
  }
  if (mobile)
    return (
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dictionary-sheet"
            data-dictionary
            onCloseAutoFocus={restoreFocus}
          >
            <Dialog.Title className="sr-only">Tra từ đã chọn</Dialog.Title>
            <Dialog.Description className="sr-only">
              Nghĩa chọn lọc và phát âm của từ hoặc cụm từ tiếng Anh.
            </Dialog.Description>
            <Dialog.Close className="icon-button popover-close" aria-label="Đóng tra từ">
              <X size={18} />
            </Dialog.Close>
            {content}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  return (
    <Popover.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Popover.Anchor virtualRef={{ current: { getBoundingClientRect: () => selection.rect } }} />
      <Popover.Portal>
        <Popover.Content
          className="dictionary-popover"
          side="bottom"
          sideOffset={10}
          collisionPadding={16}
          aria-label="Tra từ đã chọn"
          data-dictionary
          onCloseAutoFocus={restoreFocus}
        >
          <Popover.Close className="icon-button popover-close" aria-label="Đóng tra từ">
            <X size={18} />
          </Popover.Close>
          {content}
          <Popover.Arrow className="popover-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
