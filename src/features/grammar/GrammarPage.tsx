import { useDeferredValue, useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, BookOpen, List, X } from 'lucide-react'
import { grammar, grammarById } from '../../content/grammar'
import {
  handbookGuideById,
  levelLabels,
  chapters,
  type ChapterId,
  type HandbookLevel,
} from '../../content/handbook'
import { navigateReference } from '../../application/hooks'
import { searchReferences } from '../../application/referenceCatalog'
import { EmptyState, PageHeading, Tag } from '../../components/ui'
import { useReferenceFocus } from '../../components/useReferenceFocus'
import { HandbookIndex } from './HandbookIndex'
import { HandbookLesson } from './HandbookLesson'
import './handbook.css'

export function GrammarPage({ id }: { id?: string }) {
  const [query, setQuery] = useState(''),
    deferred = useDeferredValue(query)
  const [chapter, setChapter] = useState<ChapterId | ''>('')
  const [level, setLevel] = useState<HandbookLevel | ''>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const close = useRef<HTMLButtonElement>(null)
  const picker = useRef<HTMLButtonElement>(null)
  const choseFromSheet = useRef(false)
  const [viewport, setViewport] = useState<{ height: number; bottom: number }>()
  useEffect(() => {
    if (!mobileOpen) return
    const visual = window.visualViewport
    const update = () => {
      const height = Math.floor(visual?.height ?? window.innerHeight)
      const bottom = Math.max(0, Math.floor(window.innerHeight - height - (visual?.offsetTop ?? 0)))
      setViewport((old) =>
        old?.height === height && old.bottom === bottom ? old : { height, bottom },
      )
    }
    update()
    visual?.addEventListener('resize', update)
    visual?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      visual?.removeEventListener('resize', update)
      visual?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [mobileOpen])
  const hits = deferred.trim()
    ? new Set(searchReferences(deferred, 'grammar', undefined, grammar.length).map((hit) => hit.id))
    : null
  const results = grammar.filter((lesson) => {
    const guide = handbookGuideById.get(lesson.id)
    return (
      (!hits || hits.has(lesson.id)) &&
      (!chapter || guide?.chapterId === chapter) &&
      (!level || guide?.level === level)
    )
  })
  // Searching filters the index; it never silently replaces an open learner explanation.
  const lesson = id ? grammarById.get(id) : grammar[0]
  const guide = lesson ? handbookGuideById.get(lesson.id) : undefined
  const article = useReferenceFocus(id && lesson ? id : undefined, 1100)
  const clear = () => {
    setQuery('')
    setChapter('')
    setLevel('')
  }
  const indexProps = {
    query,
    onQuery: setQuery,
    chapter,
    onChapter: setChapter,
    level,
    onLevel: setLevel,
    results,
    selectedId: lesson?.id,
    onChoose: (id: string) => {
      choseFromSheet.current = mobileOpen
      navigateReference('grammar', id)
      setMobileOpen(false)
    },
    onClear: clear,
  }
  return (
    <div className="grammar-handbook">
      <PageHeading
        eyebrow="SỔ TAY NGỮ PHÁP ANH"
        title="Hiểu được. Kể lại được. Dùng được."
        description="Từ bộ khung câu đến cấu trúc nâng cao. Đọc một ý, giải thích bằng lời mình, rồi thử trong ngữ cảnh khác."
        action={
          <Tag>
            {grammar.length} chủ điểm · {chapters.length} chương
          </Tag>
        }
      />
      <div className="handbook-mobile-picker">
        <button ref={picker} className="button secondary" onClick={() => setMobileOpen(true)}>
          <List size={17} />
          Mục lục & tìm kiếm
        </button>
        {guide && <span className="small muted">{levelLabels[guide.level]}</span>}
      </div>
      <div className="handbook-layout">
        <aside className="handbook-desktop-index" aria-label="Mục lục sổ tay">
          <HandbookIndex {...indexProps} />
        </aside>
        <article
          className="handbook-reader panel"
          ref={article}
          tabIndex={-1}
          aria-label="Nội dung chủ điểm ngữ pháp"
        >
          {lesson && guide ? (
            <>
              {!results.some((l) => l.id === lesson.id) && (
                <div className="reference-filter-note">
                  <p className="small muted">
                    Bài đang đọc nằm ngoài bộ lọc. Nội dung và phần đang viết vẫn được giữ.
                  </p>
                  <button className="text-link" onClick={clear}>
                    Bỏ bộ lọc
                  </button>
                </div>
              )}
              <HandbookLesson key={lesson.id} lesson={lesson} guide={guide} />
            </>
          ) : (
            <EmptyState icon={BookOpen} title="Chủ điểm này chưa có trong sổ tay.">
              Mở mục lục để chọn một bài hiện có.
            </EmptyState>
          )}
        </article>
      </div>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay handbook-sheet-overlay" />
          <Dialog.Content
            className="handbook-sheet"
            data-compact={viewport && viewport.height < 340 ? 'true' : undefined}
            style={
              viewport
                ? { maxHeight: Math.max(0, viewport.height - 16), bottom: viewport.bottom }
                : undefined
            }
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              close.current?.focus()
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              if (choseFromSheet.current) {
                choseFromSheet.current = false
                article.current?.focus({ preventScroll: true })
              } else picker.current?.focus({ preventScroll: true })
            }}
          >
            <header>
              <div>
                <Dialog.Title>Mục lục sổ tay</Dialog.Title>
                <Dialog.Description>Tìm và chọn một chủ điểm để đọc.</Dialog.Description>
              </div>
              <Dialog.Close ref={close} className="icon-button" aria-label="Đóng mục lục">
                <X size={21} />
              </Dialog.Close>
            </header>
            <HandbookIndex {...indexProps} />
            <Dialog.Close className="button secondary handbook-sheet-close">
              Tiếp tục bài đang đọc
              <ArrowRight size={15} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
