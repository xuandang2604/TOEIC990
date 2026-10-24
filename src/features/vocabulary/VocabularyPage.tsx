import { useDeferredValue, useState } from 'react'
import { Bookmark, BookOpen, Search } from 'lucide-react'
import { localDictionary } from '../../providers/dictionary'
import { useStudy } from '../../application/StudyContext'
import { navigateReference } from '../../application/hooks'
import { vocabulary, vocabularyById } from '../../content/vocabulary'
import { EmptyState, PageHeading, Tag } from '../../components/ui'
import { WordDetails } from '../dictionary/Dictionary'
import { Highlight } from '../dictionary/Highlight'
import { useReferenceFocus } from '../../components/useReferenceFocus'

export function VocabularyPage({ id }: { id?: string }) {
  const data = useStudy()
  const [query, setQuery] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const deferred = useDeferredValue(query)
  const savedIds = new Set(
    data.cards.filter((c) => c.kind === 'vocabulary').map((c) => c.contentId),
  )
  const results = localDictionary
    .search(deferred)
    .filter((entry) => !savedOnly || savedIds.has(entry.id))
  const selected = id ? vocabularyById.get(id) : results[0]
  const detail = useReferenceFocus(id && selected ? id : undefined, 520)
  return (
    <>
      <PageHeading
        eyebrow="TỪ VỰNG, ĐẶT TRONG NGỮ CẢNH"
        title="Không chỉ biết một nghĩa."
        description="Hiểu cách dùng, nhớ theo cụm và đưa từ trở lại đúng lúc."
        action={<Tag>{vocabulary.length} mục từ ngoại tuyến</Tag>}
      />
      <div className="vocabulary-layout">
        <section className="dictionary-index panel">
          <label className="search-field">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm từ hoặc nghĩa tiếng Việt…"
              aria-label="Tìm từ vựng"
            />
          </label>
          <div className="segment-control" aria-label="Bộ lọc từ vựng">
            <button
              aria-pressed={!savedOnly}
              className={!savedOnly ? 'active' : ''}
              onClick={() => setSavedOnly(false)}
            >
              <BookOpen size={15} />
              Tất cả
            </button>
            <button
              aria-pressed={savedOnly}
              className={savedOnly ? 'active' : ''}
              onClick={() => setSavedOnly(true)}
            >
              <Bookmark size={15} />
              Đã lưu ({savedIds.size})
            </button>
          </div>
          <p className="index-count small muted" aria-live="polite">
            {results.length} mục từ{deferred ? ` cho “${deferred}”` : ''}
          </p>
          <div className="vocabulary-list">
            {results.map((entry) => (
              <button
                key={entry.id}
                className={`vocab-row ${selected?.id === entry.id ? 'active' : ''}`}
                aria-current={selected?.id === entry.id ? 'true' : undefined}
                onClick={() => navigateReference('vocabulary', entry.id)}
              >
                <span>
                  <strong lang="en">
                    <Highlight text={entry.word} query={deferred} />
                  </strong>
                  {savedIds.has(entry.id) && <Bookmark size={13} />}
                </span>
                <small>
                  <Highlight text={entry.meaning} query={deferred} />
                </small>
              </button>
            ))}
            {!results.length && (
              <EmptyState
                icon={savedOnly ? Bookmark : Search}
                title={savedOnly ? 'Sổ từ đang chờ bạn.' : 'Chưa tìm thấy từ phù hợp.'}
              >
                {savedOnly
                  ? 'Lưu một từ trong bài học hoặc từ điển để bắt đầu ôn lại.'
                  : `Thử dạng gốc hoặc nghĩa tiếng Việt. Bộ từ hiện tại có ${vocabulary.length} mục.`}
              </EmptyState>
            )}
          </div>
        </section>
        <section
          className="vocabulary-detail panel"
          ref={detail}
          tabIndex={-1}
          aria-label="Chi tiết từ vựng"
        >
          {selected ? (
            <>
              <div className="word-detail-meta">
                <span className="eyebrow">TỪ ĐIỂN ANH – VIỆT</span>
                <Tag>{selected.topic}</Tag>
              </div>
              {!results.some((entry) => entry.id === selected.id) && (
                <div className="reference-filter-note">
                  <p className="small muted">Mục từ đang mở nằm ngoài bộ lọc hiện tại.</p>
                  <button
                    className="text-link"
                    onClick={() => {
                      setQuery('')
                      setSavedOnly(false)
                    }}
                  >
                    Xem tất cả
                  </button>
                </div>
              )}
              <WordDetails key={selected.id} entry={selected} />
              <div className="learning-tip">
                <span className="eyebrow">THỬ CHỦ ĐỘNG NHỚ LẠI</span>
                <p>
                  Che nghĩa, tự đặt một câu có từ này, rồi đối chiếu với ví dụ. Khi đã lưu, bạn có
                  thể ôn bằng thẻ lật ở mục Ôn tập.
                </p>
              </div>
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={id ? 'Mục từ này chưa có trong bộ chọn lọc.' : 'Một từ, nhiều kết nối.'}
            >
              Chọn một từ trong danh sách hoặc thay đổi từ khóa để khám phá cách dùng.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  )
}
