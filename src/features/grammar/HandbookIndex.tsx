import { Search } from 'lucide-react'
import { grammar } from '../../content/grammar'
import type { GrammarLesson } from '../../content/schema'
import {
  chapters,
  handbookGuideById,
  levelLabels,
  type ChapterId,
  type HandbookLevel,
} from '../../content/handbook'
import { Highlight } from '../dictionary/Highlight'

const ordinals = new Map(grammar.map((lesson, i) => [lesson.id, String(i + 1).padStart(2, '0')]))
export function HandbookIndex({
  query,
  onQuery,
  chapter,
  onChapter,
  level,
  onLevel,
  results,
  selectedId,
  onChoose,
  onClear,
}: {
  query: string
  onQuery: (value: string) => void
  chapter: ChapterId | ''
  onChapter: (value: ChapterId | '') => void
  level: HandbookLevel | ''
  onLevel: (value: HandbookLevel | '') => void
  results: GrammarLesson[]
  selectedId?: string
  onChoose: (id: string) => void
  onClear: () => void
}) {
  const selectedChapter = selectedId ? handbookGuideById.get(selectedId)?.chapterId : undefined
  return (
    <div className="handbook-index">
      <div className="handbook-index-filters">
        <label className="search-field">
          <Search size={17} />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Tìm: đảo ngữ, mạo từ…"
            aria-label="Tìm trong sổ tay ngữ pháp"
          />
        </label>
        <div className="handbook-filter-row">
          <label>
            Chương
            <select value={chapter} onChange={(e) => onChapter(e.target.value as ChapterId | '')}>
              <option value="">Tất cả chương</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mức độ
            <select value={level} onChange={(e) => onLevel(e.target.value as HandbookLevel | '')}>
              <option value="">Tất cả mức độ</option>
              {Object.entries(levelLabels).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="small muted" aria-live="polite">
          {results.length} / {grammar.length} chủ điểm{query ? ` cho “${query}”` : ''}
        </p>
      </div>
      <nav className="handbook-chapters" aria-label="Các chương ngữ pháp">
        {chapters.map((group, i) => {
          const lessons = results.filter((l) => handbookGuideById.get(l.id)?.chapterId === group.id)
          if (!lessons.length) return null
          return (
            <details
              key={group.id}
              open={Boolean(query.trim() || chapter || level || group.id === selectedChapter)}
            >
              <summary>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <strong>{group.title}</strong>
                <small>{lessons.length}</small>
              </summary>
              <p className="handbook-chapter-note">{group.description}</p>
              {lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  aria-current={selectedId === lesson.id ? 'page' : undefined}
                  className={selectedId === lesson.id ? 'active' : ''}
                  onClick={() => onChoose(lesson.id)}
                >
                  <span className="handbook-ordinal">{ordinals.get(lesson.id)}</span>
                  <span>
                    <Highlight text={lesson.title} query={query} />
                    <small lang="en">{lesson.englishTitle}</small>
                  </span>
                </button>
              ))}
            </details>
          )
        })}
        {!results.length && (
          <div className="handbook-index-empty">
            <p>Chưa tìm thấy chủ điểm phù hợp.</p>
            <p className="small muted">Thử tên không dấu hoặc bỏ bớt điều kiện lọc.</p>
            <button className="text-link" onClick={onClear}>
              Xem tất cả chủ điểm
            </button>
          </div>
        )}
      </nav>
    </div>
  )
}
