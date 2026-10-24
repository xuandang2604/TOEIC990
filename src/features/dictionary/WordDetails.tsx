import { ArrowRight, Bookmark, BookmarkCheck, RotateCcw } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigateReference } from '../../application/hooks'
import { saveCard } from '../../application/studyRepository'
import type { VocabularyEntry } from '../../content/schema'
import { grammarById } from '../../content/grammar'
import { PronunciationControls } from '../../components/PronunciationControls'
import { InlineError, Tag } from '../../components/ui'

export function SaveWordButton({ entry, context }: { entry: VocabularyEntry; context?: string }) {
  const { cards, vocabularyContexts } = useStudy()
  const saved = cards.some((card) => card.id === `vocabulary:${entry.id}`)
  const contextSaved =
    context && vocabularyContexts.some((c) => c.vocabularyId === entry.id && c.sentence === context)
  const action = useAction()
  return (
    <div>
      <button
        type="button"
        className={`button ${saved ? 'saved' : 'secondary'}`}
        disabled={(context ? Boolean(contextSaved) : saved) || action.busy}
        onClick={() =>
          void action.run(() =>
            saveCard(
              'vocabulary',
              entry.id,
              context
                ? { sentence: context, source: window.location.hash.slice(0, 500) || '#/today' }
                : undefined,
            ),
          )
        }
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        <span aria-live="polite">
          {contextSaved
            ? 'Đã lưu cùng câu nguồn'
            : action.busy
              ? 'Đang lưu…'
              : context
                ? 'Lưu từ cùng câu nguồn'
                : saved
                  ? 'Đã lưu vào ôn tập'
                  : 'Lưu từ'}
        </span>
      </button>
      <InlineError message={action.error} />
    </div>
  )
}

export function WordDetails({
  entry,
  compact = false,
  context,
}: {
  entry: VocabularyEntry
  compact?: boolean
  context?: string
}) {
  return (
    <div className={`word-detail ${compact ? 'compact' : ''}`}>
      <div className="word-heading">
        <div>
          <h2 lang="en">{entry.word}</h2>
          <span className="lexical-sense">
            Nghĩa dùng trong {entry.topic.toLocaleLowerCase('vi')}
          </span>
        </div>
        <Tag>{entry.partOfSpeech}</Tag>
      </div>
      <p className="word-meaning">{entry.meaning}</p>
      {!compact && (
        <p className="muted" lang="en">
          {entry.definition}
        </p>
      )}
      <PronunciationControls key={entry.id} entry={entry} />
      <blockquote>
        <span className="eyebrow">{context ? 'TRONG BÀI ĐANG ĐỌC' : 'VÍ DỤ CÔNG VIỆC'}</span>
        <p lang="en" data-learning>
          {context ?? entry.example}
        </p>
        {!context && <footer>{entry.translation}</footer>}
      </blockquote>
      {!compact && (
        <>
          {entry.forms.length > 0 && (
            <section className="word-section">
              <h3>Dạng từ & biến thể</h3>
              <p lang="en" data-learning>
                {entry.forms.join(' · ')}
              </p>
            </section>
          )}
          <section className="word-section">
            <h3>Cụm từ thường gặp</h3>
            <div className="tag-list" lang="en" data-learning>
              {entry.collocations.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </section>
          {entry.family.length > 0 && (
            <section className="word-section">
              <h3>Họ từ</h3>
              <p lang="en" data-learning>
                {entry.family.join(' · ')}
              </p>
            </section>
          )}
          {entry.synonyms?.length || entry.antonyms?.length ? (
            <div className="lexical-relations">
              {entry.synonyms?.length ? (
                <section>
                  <h3>Gần nghĩa trong ngữ cảnh này</h3>
                  <p lang="en" data-learning>
                    {entry.synonyms.join(' · ')}
                  </p>
                </section>
              ) : null}
              {entry.antonyms?.length ? (
                <section>
                  <h3>Trái nghĩa trong ngữ cảnh này</h3>
                  <p lang="en" data-learning>
                    {entry.antonyms.join(' · ')}
                  </p>
                </section>
              ) : null}
            </div>
          ) : null}
          <section className="lexical-note">
            <h3>Cách dùng & điểm dễ nhầm</h3>
            <p>{entry.usageNote}</p>
          </section>
          <section className="word-section">
            <h3>Kết nối ngữ pháp</h3>
            <div className="related-content">
              {entry.grammarIds.map((id) => (
                <button
                  key={id}
                  className="text-link"
                  onClick={() => navigateReference('grammar', id)}
                >
                  {grammarById.get(id)?.title}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      <div className="word-actions">
        <SaveWordButton entry={entry} context={context} />
        {!compact && (
          <button className="text-link" onClick={() => navigateReference('review')}>
            <RotateCcw size={15} />
            Mở sổ ôn tập
          </button>
        )}
      </div>
      {!compact && (
        <p className="content-provenance small muted">
          {entry.provenance.author} · {entry.provenance.revision}. {entry.provenance.note}
        </p>
      )}
    </div>
  )
}
