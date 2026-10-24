import { useEffect, useId, useRef, useState } from 'react'
import { Eye } from 'lucide-react'
import { vocabularyById } from '../../content/vocabulary'
import { grammarById } from '../../content/grammar'
import { knowledgePrompts } from '../../content/knowledgeCards'
import type { ReviewCard, ReviewGrade } from '../../domain/models'
import { intervalLabel, schedulableCard, scheduleReview } from '../../domain/scheduler'
import { useAction, useNow, navigateReference } from '../../application/hooks'
import { rateRecallCard } from '../../application/studyRepository'
import { InlineError, Tag } from '../../components/ui'
import { useStudy } from '../../application/StudyContext'

export function RecallCard({
  card,
  onFinish,
}: {
  card: ReviewCard
  onFinish: (reviewed: boolean) => void
}) {
  const answerId = useId()
  const answer = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    title.current?.focus({ preventScroll: true })
  }, [card.id])
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    if (revealed) answer.current?.focus({ preventScroll: true })
  }, [revealed])
  const [historyLimit, setHistoryLimit] = useState(8)
  const { reviewEvents, vocabularyContexts } = useStudy()
  const history = reviewEvents
    .filter((event) => event.cardId === card.id)
    .sort((a, b) => b.occurredAt - a.occurredAt)
  const operationId = useRef(crypto.randomUUID())
  const action = useAction(),
    now = useNow()
  const word = card.kind === 'vocabulary' ? vocabularyById.get(card.contentId) : undefined
  const lesson = card.kind === 'knowledge' ? grammarById.get(card.contentId) : undefined
  const valid =
    schedulableCard(card) &&
    (word || lesson) &&
    now >= card.createdAt &&
    (card.lastReviewedAt === undefined || now >= card.lastReviewedAt)
  async function rate(grade: ReviewGrade) {
    if (!revealed || !valid) return
    const saved = await action.run(async () => {
      await rateRecallCard(card.id, grade, operationId.current, card.dueAt)
      return true
    })
    if (saved) onFinish(true)
  }
  return (
    <section className="flashcard panel" aria-label={word ? 'Thẻ ôn từ vựng' : 'Thẻ ôn kiến thức'}>
      <div className="flashcard-top">
        <Tag tone="sage">TỰ NHỚ TRƯỚC KHI XEM</Tag>
        <button className="text-link" disabled={action.busy} onClick={() => onFinish(false)}>
          Để sau
        </button>
      </div>
      <h2 ref={title} tabIndex={-1} lang={word ? 'en' : 'vi'}>
        {word?.word ?? lesson?.title ?? 'Thẻ cần được kiểm tra'}
      </h2>
      {word && (
        <p className="ipa" lang="en">
          {word.ipa} · {word.partOfSpeech}
        </p>
      )}
      {lesson && <p className="knowledge-recall-prompt">{knowledgePrompts[lesson.id]}</p>}
      {!valid ? (
        <p role="alert">
          Chưa có nội dung hoặc lịch ôn hợp lệ cho thẻ này. Dữ liệu được giữ nguyên; hãy kiểm tra
          đồng hồ thiết bị hoặc xuất bản sao dữ liệu.
        </p>
      ) : revealed ? (
        <>
          <div
            className="flashcard-answer"
            id={answerId}
            ref={answer}
            tabIndex={-1}
            role="region"
            aria-label="Đáp án và hướng dẫn đối chiếu"
          >
            {word && (
              <>
                <h3>{word.meaning}</h3>
                <p lang="en" data-learning>
                  {word.example}
                </p>
                <p className="small muted">{word.translation}</p>
                {vocabularyContexts
                  .filter((c) => c.vocabularyId === word.id)
                  .slice(-3)
                  .map((c) => (
                    <blockquote key={c.id}>
                      <span className="eyebrow">CÂU BẠN ĐÃ LƯU</span>
                      <p lang="en" data-learning>
                        {c.sentence}
                      </p>
                    </blockquote>
                  ))}
              </>
            )}
            {lesson && (
              <>
                {lesson.rules.map((rule) => (
                  <div className="recall-rule" key={rule.title}>
                    <h3>{rule.title}</h3>
                    <p lang="en" data-learning>
                      {rule.formula}
                    </p>
                    <p className="small muted">{rule.description}</p>
                  </div>
                ))}
                <p lang="en" data-learning>
                  {lesson.examples[0].correct}
                </p>
              </>
            )}
          </div>
          <p className="small muted">
            Bạn đã tự nhớ được trước khi xem ở mức nào? Đây là tự đánh giá, không phải điểm thi.
          </p>
          <div className="rating-buttons">
            {(
              [
                { grade: 1, label: 'Chưa nhớ' },
                { grade: 3, label: 'Khó nhớ' },
                { grade: 4, label: 'Nhớ được' },
                { grade: 5, label: 'Rất dễ' },
              ] as const
            ).map((item) => (
              <button
                key={item.grade}
                className="button secondary"
                disabled={action.busy}
                onClick={() => void rate(item.grade)}
              >
                {item.label}
                <small>{intervalLabel(scheduleReview(card, item.grade, now).dueAt, now)}</small>
              </button>
            ))}
          </div>
          <button
            className="text-link"
            onClick={() => navigateReference(word ? 'vocabulary' : 'grammar', card.contentId)}
          >
            Mở bài tham chiếu
          </button>
          <details className="recall-history">
            <summary>Lịch sử thẻ ({history.length} lượt đã ghi)</summary>
            <p className="small muted">
              Ghi nhận đầu tiên:{' '}
              {new Date(card.firstEncounterAt ?? card.createdAt).toLocaleString('vi-VN')} ·{' '}
              {card.lapses} lần quên đã được scheduler ghi nhận.
            </p>
            <p className="small muted">
              Lịch hiện tại: {new Date(card.dueAt).toLocaleString('vi-VN')}
            </p>
            {history.slice(0, historyLimit).map((event) => (
              <p className="small muted" key={event.id}>
                {new Date(event.occurredAt).toLocaleString('vi-VN')} ·{' '}
                {event.grade === 1
                  ? 'Chưa nhớ'
                  : event.grade === 3
                    ? 'Khó nhớ'
                    : event.grade === 5
                      ? 'Rất dễ'
                      : 'Nhớ được'}{' '}
                · Hẹn {new Date(event.nextDueAt).toLocaleString('vi-VN')}
              </p>
            ))}
            {history.length > historyLimit && (
              <button
                type="button"
                className="text-link"
                onClick={() => setHistoryLimit((n) => n + 8)}
              >
                Xem thêm lịch sử
              </button>
            )}
          </details>
        </>
      ) : (
        <>
          <p className="muted">
            {word
              ? 'Tự nói nghĩa tiếng Việt và một ví dụ trước khi lật thẻ.'
              : 'Tự giải thích thành lời hoặc viết một ví dụ, rồi đối chiếu cấu trúc.'}
          </p>
          <button
            className="button primary"
            aria-expanded={revealed}
            aria-controls={answerId}
            onClick={() => setRevealed(true)}
          >
            <Eye size={17} />
            {word ? 'Xem nghĩa & tự đánh giá' : 'Đối chiếu kiến thức'}
          </button>
        </>
      )}
      {!revealed && <div id={answerId} hidden />}
      <InlineError message={action.error} />
    </section>
  )
}
