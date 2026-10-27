import { ArrowRight, Bookmark, BookmarkCheck, RotateCcw } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigateReference } from '../../application/hooks'
import { saveCard } from '../../application/studyRepository'
import type { VocabularyEntry } from '../../content/schema'
import { grammarById } from '../../content/grammar'
import { PronunciationControls } from '../../components/PronunciationControls'
import { InlineError, Tag } from '../../components/ui'
import { vocabularyBandFor } from '../../content/vocabularyBands'

export function SaveWordButton({
  entry,
  context,
  compact = false,
}: {
  entry: VocabularyEntry
  context?: string
  compact?: boolean
}) {
  const { cards, vocabularyContexts } = useStudy()
  const saved = cards.some((card) => card.id === `vocabulary:${entry.id}`)
  const contextSaved = Boolean(
    context &&
    vocabularyContexts.some((c) => c.vocabularyId === entry.id && c.sentence === context),
  )
  const action = useAction()
  let label = saved ? 'Đã lưu vào ôn tập' : 'Lưu từ'
  if (context) label = contextSaved ? 'Đã lưu cùng câu nguồn' : 'Lưu từ cùng câu nguồn'
  if (compact)
    label =
      contextSaved || (!context && saved) ? 'Đã lưu' : context && saved ? 'Lưu ngữ cảnh' : 'Lưu từ'
  if (action.busy) label = 'Đang lưu…'
  return (
    <div>
      <button
        type="button"
        className={`${compact ? 'word-save-button' : 'button'} ${saved ? 'saved' : 'secondary'}`}
        aria-label={
          contextSaved
            ? `Đã lưu từ ${entry.word} cùng ngữ cảnh`
            : context
              ? `Lưu từ ${entry.word} cùng ngữ cảnh vào sổ ôn`
              : `${saved ? 'Đã lưu' : 'Lưu'} từ ${entry.word} vào sổ ôn`
        }
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
        <span aria-live="polite">{label}</span>
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
          {!compact && (
            <span className="lexical-sense">
              Nghĩa dùng trong {entry.topic.toLocaleLowerCase('vi')}
            </span>
          )}
        </div>
        <Tag>{entry.partOfSpeech}</Tag>
      </div>
      <div className="word-meaning-row">
        <p className="word-meaning">{entry.meaning}</p>
        <SaveWordButton entry={entry} context={context} compact />
      </div>
      {!compact && vocabularyBandFor(entry.id) && (
        <p
          className="small muted vocabulary-band-label"
          title="Nhóm học do STUDY 990 gợi ý; không phải band từ vựng chính thức của ETS."
        >
          Mốc luyện gợi ý · {vocabularyBandFor(entry.id)!.label}
        </p>
      )}
      {!compact && (
        <p className="muted" lang="en">
          {entry.definition}
        </p>
      )}
      <PronunciationControls key={entry.id} entry={entry} compact={compact} />
      <details className="word-example" open={compact ? undefined : true}>
        <summary>{context ? 'Ngữ cảnh đã chọn' : 'Ví dụ'}</summary>
        <blockquote>
          <span className="eyebrow">{context ? 'TRONG BÀI ĐANG ĐỌC' : 'VÍ DỤ CÔNG VIỆC'}</span>
          <p lang="en" data-learning>
            {context ?? entry.example}
          </p>
          {!context && <footer>{entry.translation}</footer>}
        </blockquote>
      </details>
      {!compact && (
        <details className="word-more">
          <summary>Cách dùng & liên quan</summary>
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
          <p className="content-provenance small muted">
            {entry.provenance.author} · {entry.provenance.revision}. {entry.provenance.note}
          </p>
        </details>
      )}
      {!compact && (
        <div className="word-actions">
          <button className="text-link" onClick={() => navigateReference('review')}>
            <RotateCcw size={15} />
            Mở sổ ôn tập
          </button>
        </div>
      )}
    </div>
  )
}
