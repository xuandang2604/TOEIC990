import { useDeferredValue, useState } from 'react'
import { ArrowRight, Bookmark, BookOpen, Search } from 'lucide-react'
import { localDictionary } from '../../providers/dictionary'
import { useStudy } from '../../application/StudyContext'
import { navigate, navigateReference, useNow } from '../../application/hooks'
import { vocabulary, vocabularyById } from '../../content/vocabulary'
import { EmptyState, PageHeading, Tag } from '../../components/ui'
import { WordDetails } from '../dictionary/Dictionary'
import { Highlight } from '../dictionary/Highlight'
import { useReferenceFocus } from '../../components/useReferenceFocus'
import { VocabularyReminderSettings } from './VocabularyReminders'
import { schedulableCard } from '../../domain/scheduler'
import { localDayKey } from '../../domain/learning'
import {
  vocabularyBandFor,
  vocabularyBands,
  type VocabularyBandId,
} from '../../content/vocabularyBands'

export function VocabularyPage({ id }: { id?: string }) {
  const data = useStudy()
  const [query, setQuery] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const [dueOnly, setDueOnly] = useState(false)
  const [topic, setTopic] = useState('')
  const [band, setBand] = useState<VocabularyBandId | ''>('')
  const [includeFoundation, setIncludeFoundation] = useState(true)
  const now = useNow()
  const cards = new Map(
    data.cards
      .filter((c) => c.kind === 'vocabulary' && vocabularyById.has(c.contentId))
      .map((c) => [c.contentId, c]),
  )
  const dueCards = [...cards.values()].filter(
    (c) => vocabularyById.has(c.contentId) && schedulableCard(c) && c.dueAt <= now,
  )
  const dueIds = new Set(dueCards.map((c) => c.contentId))
  const reviewedToday = new Set(
    data.reviewEvents
      .filter(
        (e) => e.source === 'vocabulary-recall' && localDayKey(e.occurredAt) === localDayKey(now),
      )
      .map((e) => e.cardId),
  ).size
  const deferred = useDeferredValue(query)
  const savedIds = new Set(cards.keys())
  const results = localDictionary
    .search(deferred)
    .filter((entry) => !savedOnly || savedIds.has(entry.id))
    .filter((entry) => !dueOnly || dueIds.has(entry.id))
    .filter((entry) => !topic || entry.topic === topic)
    .filter((entry) => {
      if (!band) return true
      const assigned = vocabularyBandFor(entry.id)
      const target = vocabularyBands.find((item) => item.id === band)!
      return (
        assigned && (includeFoundation ? assigned.ceiling <= target.ceiling : assigned.id === band)
      )
    })
  const selected = id ? vocabularyById.get(id) : results[0]
  const detail = useReferenceFocus(id && selected ? id : undefined, 520)
  return (
    <>
      <PageHeading
        eyebrow="SỔ TAY ANH – VIỆT"
        title="Từ vựng"
        description="Tra từ. Lưu lại. Ôn đúng lúc."
        action={<Tag>{vocabulary.length} mục từ ngoại tuyến</Tag>}
      />
      <section
        className="vocabulary-notebook vocabulary-notebook-compact panel"
        aria-label="Sổ từ vựng cá nhân"
      >
        <div>
          <p>
            <strong>{savedIds.size}</strong> đã lưu · <strong>{dueCards.length}</strong> đến hạn ·{' '}
            {reviewedToday} đã ôn hôm nay
          </p>
        </div>
        <button className="button primary" onClick={() => navigate('review', 'vocabulary')}>
          Ôn từ
          <ArrowRight size={16} />
        </button>
      </section>
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
              onClick={() => {
                setSavedOnly(false)
                setDueOnly(false)
              }}
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
          <label className="form-label notebook-topic">
            Band điểm
            <select value={band} onChange={(e) => setBand(e.target.value as VocabularyBandId | '')}>
              <option value="">Tất cả band điểm</option>
              {vocabularyBands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} (
                  {vocabulary.filter((word) => vocabularyBandFor(word.id)?.id === item.id).length})
                </option>
              ))}
            </select>
          </label>
          <details className="vocabulary-filters">
            <summary>
              Bộ lọc khác{topic || dueOnly || (band && !includeFoundation) ? ' · đang áp dụng' : ''}
            </summary>
            <label className="form-label notebook-topic">
              Chủ đề
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Tất cả chủ đề</option>
                {[...new Set(vocabulary.map((v) => v.topic))].sort().map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            {band && (
              <label className="reminder-checkbox">
                <input
                  type="checkbox"
                  checked={includeFoundation}
                  onChange={(e) => setIncludeFoundation(e.target.checked)}
                />
                Kèm từ ở các band nền tảng
              </label>
            )}
            <p className="small muted vocabulary-band-note">
              Band là gợi ý học, không phải phân loại ETS. Mục tiêu cao vẫn cần chắc từ nền tảng.
            </p>
            <label className="reminder-checkbox">
              <input
                type="checkbox"
                checked={dueOnly}
                onChange={(e) => {
                  setDueOnly(e.target.checked)
                  if (e.target.checked) setSavedOnly(true)
                }}
              />
              Chỉ từ đến hạn ({dueCards.length})
            </label>
          </details>
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
                <small className="vocabulary-band-label">
                  Band {vocabularyBandFor(entry.id)?.shortLabel}
                </small>
                {cards.has(entry.id) && (
                  <small className="notebook-due">
                    {dueIds.has(entry.id)
                      ? 'Đến hạn ôn'
                      : `Ôn tiếp: ${new Date(cards.get(entry.id)!.dueAt).toLocaleDateString('vi-VN')}`}
                  </small>
                )}
              </button>
            ))}
            {!results.length && (
              <EmptyState
                icon={savedOnly ? Bookmark : Search}
                title={
                  savedOnly && savedIds.size === 0
                    ? 'Sổ từ đang chờ bạn.'
                    : 'Chưa tìm thấy từ phù hợp.'
                }
              >
                {savedOnly && savedIds.size === 0
                  ? 'Lưu một từ trong bài học hoặc từ điển để bắt đầu ôn lại.'
                  : 'Thử bỏ bộ lọc band, chủ đề hoặc đến hạn, hay tìm bằng dạng gốc/nghĩa tiếng Việt.'}
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
                      setDueOnly(false)
                      setTopic('')
                      setBand('')
                    }}
                  >
                    Xem tất cả
                  </button>
                </div>
              )}
              <WordDetails key={selected.id} entry={selected} />
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
      <details className="section-spaced vocabulary-reminder-disclosure">
        <summary>Nhắc ôn từ</summary>
        <VocabularyReminderSettings />
      </details>
    </>
  )
}
