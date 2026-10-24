import { useEffect, useId, useMemo, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowUpRight, Bookmark, BookOpen, Clock3, FileQuestion, Search, X } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction } from '../../application/hooks'
import { clearSearchHistory, rememberSearch } from '../../application/searchHistory'
import { searchReferences } from '../../application/referenceCatalog'
import type { SearchHit, SearchScope } from '../../domain/referenceSearch'
import { EmptyState, InlineError } from '../../components/ui'
import { Highlight } from './Highlight'

const scopes: { id: SearchScope; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'vocabulary', label: 'Từ vựng' },
  { id: 'grammar', label: 'Ngữ pháp' },
  { id: 'saved', label: 'Từ đã lưu' },
  { id: 'reference', label: 'Câu luyện tập' },
]
export function QuickSearch({
  initialQuery,
  onClose,
  onSelect,
  returnFocus,
}: {
  initialQuery: string
  onClose: () => void
  onSelect: (hit: SearchHit) => void
  returnFocus: HTMLElement | null
}) {
  const { cards, recentSearches } = useStudy()
  const [query, setQuery] = useState(initialQuery)
  const [scope, setScope] = useState<SearchScope>('all')
  const [active, setActive] = useState(0)
  const [pending, setPending] = useState<SearchHit | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const leaving = useRef(false)
  const mounted = useRef(true)
  const sourceHash = useRef(window.location.hash)
  const intent = useRef(0)
  const action = useAction()
  const listId = useId()
  const savedIds = useMemo(
    () => new Set(cards.filter((c) => c.kind === 'vocabulary').map((c) => c.contentId)),
    [cards],
  )
  const results = useMemo(() => searchReferences(query, scope, savedIds), [query, scope, savedIds])
  const index = Math.min(active, results.length - 1)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: 'nearest' })
  }, [index, listId, query, scope])
  function open(hit: SearchHit) {
    if (!mounted.current || window.location.hash !== sourceHash.current) return
    leaving.current = true
    onSelect(hit)
  }
  function updateSearch(nextQuery: string, nextScope = scope) {
    intent.current++
    setQuery(nextQuery)
    setScope(nextScope)
    setActive(0)
    setPending(null)
    action.clearError()
  }
  async function choose(hit: SearchHit) {
    if (action.busy) return
    if (!query.trim()) {
      open(hit)
      return
    }
    const version = intent.current
    const saved = await action.run(async () => {
      await rememberSearch(query)
      return true
    })
    if (!mounted.current || intent.current !== version) return
    if (saved) open(hit)
    else setPending(hit)
  }
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
          className="dialog quick-search-dialog"
          data-dictionary
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            input.current?.focus()
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            if (!leaving.current && returnFocus?.isConnected)
              returnFocus.focus({ preventScroll: true })
          }}
        >
          <Dialog.Title className="sr-only">Tìm kiếm nhanh</Dialog.Title>
          <Dialog.Description className="sr-only">
            Tìm từ, ngữ pháp và câu luyện tập. Phím lên xuống để chọn, Enter để mở, Escape để đóng.
          </Dialog.Description>
          <div className="quick-search-input">
            <Search size={21} />
            <input
              ref={input}
              role="combobox"
              aria-label="Tìm từ, ngữ pháp và tài liệu"
              aria-autocomplete="list"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-activedescendant={index >= 0 ? `${listId}-${index}` : undefined}
              autoComplete="off"
              spellCheck={false}
              maxLength={120}
              placeholder="Một từ, một chủ điểm, một điều cần hiểu…"
              value={query}
              onChange={(e) => updateSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  if (results.length)
                    setActive(
                      (index + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length,
                    )
                } else if (e.key === 'Enter' && results[index]) {
                  e.preventDefault()
                  void choose(results[index])
                }
              }}
            />
            <Dialog.Close className="icon-button" aria-label="Đóng tìm kiếm">
              <X size={19} />
            </Dialog.Close>
          </div>
          <div className="quick-search-scopes" aria-label="Phạm vi tìm kiếm">
            {scopes.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={scope === item.id}
                onClick={() => {
                  updateSearch(query, item.id)
                  input.current?.focus()
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="quick-search-scroll">
            {!query && recentSearches.length > 0 && (
              <section className="search-recents">
                <div>
                  <span className="eyebrow">TÌM GẦN ĐÂY</span>
                  <button
                    className="text-link small"
                    disabled={action.busy}
                    onClick={() => void action.run(clearSearchHistory)}
                  >
                    Xóa lịch sử
                  </button>
                </div>
                <div className="tag-list">
                  {recentSearches.map((recent) => (
                    <button
                      key={recent.id}
                      className="word-chip"
                      onClick={() => {
                        updateSearch(recent.query)
                        input.current?.focus()
                      }}
                    >
                      <Clock3 size={13} />
                      {recent.query}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <p className="quick-search-caption small muted" role="status">
              {query
                ? `${results.length} kết quả${results.length === 30 ? ' đầu tiên' : ''}`
                : scope === 'saved'
                  ? 'Những từ bạn đã chọn để ôn'
                  : 'Khám phá tài liệu trên thiết bị'}
            </p>
            <div role="listbox" id={listId} aria-label="Kết quả tìm kiếm" aria-busy={action.busy}>
              {results.map((hit, i) => {
                const Icon = hit.saved
                  ? Bookmark
                  : hit.kind === 'reference'
                    ? FileQuestion
                    : BookOpen
                return (
                  <button
                    type="button"
                    role="option"
                    title={`${hit.title} — ${hit.description}`}
                    aria-selected={index === i}
                    id={`${listId}-${i}`}
                    tabIndex={-1}
                    key={hit.key}
                    className={`quick-result ${index === i ? 'active' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerMove={() => setActive(i)}
                    onClick={() => void choose(hit)}
                    disabled={action.busy}
                  >
                    <span className="quick-result-icon">
                      <Icon size={18} />
                    </span>
                    <span className="quick-result-copy">
                      <strong lang={hit.kind === 'grammar' ? 'vi' : 'en'}>
                        <Highlight text={hit.title} query={query} />
                      </strong>
                      <small>
                        <Highlight text={hit.description} query={query} />
                      </small>
                    </span>
                    <span className="quick-result-label">
                      {hit.saved ? 'Đã lưu · ' : ''}
                      {hit.label}
                    </span>
                    <ArrowUpRight size={14} />
                  </button>
                )
              })}
            </div>
            {!results.length && (
              <EmptyState
                icon={scope === 'saved' ? Bookmark : Search}
                title={
                  scope === 'saved' && !savedIds.size
                    ? 'Sổ từ đang chờ bạn.'
                    : 'Chưa tìm thấy kết quả.'
                }
              >
                {scope === 'saved' && !savedIds.size
                  ? 'Lưu từ từ bài học hoặc từ điển để ôn lại ở đây.'
                  : 'Thử dạng từ gốc, cụm ngắn hơn hoặc tiếng Việt không dấu. Bạn có thể đổi sang “Tất cả”.'}
              </EmptyState>
            )}
            <InlineError message={action.error} />
            {pending && (
              <div className="search-history-recovery">
                <p className="small">Chưa ghi được lịch sử tìm kiếm. Bạn vẫn có thể mở tài liệu.</p>
                <button className="text-link" onClick={() => open(pending)}>
                  Mở tài liệu mà không lưu lịch sử
                  <ArrowUpRight size={14} />
                </button>
              </div>
            )}
          </div>
          <footer className="quick-search-footer">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> Chọn <kbd>Enter</kbd> Mở <kbd>Esc</kbd> Đóng
            </span>
            <span>Tìm kiếm trên thiết bị</span>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
