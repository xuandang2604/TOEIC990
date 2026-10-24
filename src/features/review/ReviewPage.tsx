import { useState } from 'react'
import { ArrowRight, BookOpen, Check, Clock3, RotateCcw } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction, navigate, navigateReference, useNow } from '../../application/hooks'
import { startSession } from '../../application/studyRepository'
import { questionById } from '../../content/questions'
import { vocabularyById } from '../../content/vocabulary'
import { grammarById } from '../../content/grammar'
import type { ReviewCard } from '../../domain/models'
import { schedulableCard } from '../../domain/scheduler'
import { EmptyState, InlineError, PageHeading, SectionTitle } from '../../components/ui'
import { RecallCard } from './RecallCard'
import { MistakeReview } from './MistakeReview'

function knownCard(card: ReviewCard) {
  return card.kind === 'question'
    ? questionById.has(card.contentId)
    : card.kind === 'vocabulary'
      ? vocabularyById.has(card.contentId)
      : card.kind === 'knowledge' && grammarById.has(card.contentId)
}
function dueLabel(card: ReviewCard, now: number) {
  return !schedulableCard(card)
    ? 'Lịch cần kiểm tra'
    : card.dueAt <= now
      ? 'Đến hạn'
      : new Date(card.dueAt).toLocaleString('vi-VN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
}

export function ReviewPage() {
  const data = useStudy(),
    now = useNow(),
    action = useAction()
  const [filter, setFilter] = useState<'due' | 'all' | 'mistakes'>('due')
  const [flash, setFlash] = useState<ReviewCard | null>(null)
  const [reviewed, setReviewed] = useState(0)
  const [limit, setLimit] = useState(40)
  const knownCards = data.cards.filter(knownCard)
  const due = knownCards
    .filter((c) => schedulableCard(c) && c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || a.id.localeCompare(b.id))
  const dueQuestions = due.filter((c) => c.kind === 'question')
  const dueWords = due.filter((c) => c.kind === 'vocabulary')
  const dueKnowledge = due.filter((c) => c.kind === 'knowledge')
  const mistakes = new Set(data.mistakes.map((m) => m.questionId))
  const visible = (filter === 'due' ? due : knownCards)
    .filter((c) => filter !== 'mistakes' || (c.kind === 'question' && mistakes.has(c.contentId)))
    .sort((a, b) => a.dueAt - b.dueAt)
  const active = data.sessions.find((s) => s.status === 'active')
  async function reviewQuestions() {
    await action.run(async () => {
      const session = await startSession(
        'review',
        dueQuestions.slice(0, 6).map((c) => c.contentId),
      )
      navigate('session', session.id)
    })
  }
  return (
    <>
      <PageHeading
        eyebrow="QUAY LẠI ĐÚNG LÚC"
        title="Nhớ lâu hơn, học nhẹ hơn."
        description="Tự nhớ trước khi xem lại. Lịch ôn dùng những lượt trả lời và tự đánh giá đã được lưu."
      />
      <div className="review-intro">
        <div>
          <span className="eyebrow">HÀNG ĐỢI HÔM NAY</span>
          <h2>
            {due.length
              ? `${due.length} điều đang chờ bạn nhớ lại.`
              : 'Một khoảng nghỉ cũng có ích.'}
          </h2>
          <p>
            {due.length
              ? `${dueQuestions.length} câu hỏi · ${dueWords.length} từ vựng · ${dueKnowledge.length} thẻ kiến thức`
              : knownCards.length
                ? 'Các thẻ đã lưu chưa đến hạn; xem lịch ở phía dưới.'
                : 'Lưu từ, quy tắc hoặc luyện vài câu để bắt đầu sổ ôn của bạn.'}
          </p>
        </div>
        <RotateCcw size={58} strokeWidth={0.8} />
      </div>
      {knownCards.length < data.cards.length && (
        <p className="inline-error" role="status">
          Có {data.cards.length - knownCards.length} thẻ thiếu nội dung tương ứng. Bản ghi được giữ
          nguyên trong dữ liệu xuất.
        </p>
      )}
      {active && (
        <div className="resume-banner">
          <p>Một phiên câu hỏi đang mở. Hoàn thành phiên đó trước khi bắt đầu ôn câu hỏi mới.</p>
          <button className="button secondary" onClick={() => navigate('session', active.id)}>
            Tiếp tục
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <div className="review-modes three-review-modes">
        <section className="panel review-mode">
          <span className="small muted">01 / CÂU HỎI</span>
          <h2>Hiểu lại một lần nữa.</h2>
          <p>Giải lại câu đã lưu; chấm đúng/sai trước khi cập nhật lịch ôn.</p>
          <button
            className="button primary"
            disabled={action.busy || !dueQuestions.length || Boolean(active)}
            onClick={() => void reviewQuestions()}
          >
            Ôn {Math.min(6, dueQuestions.length)} câu hỏi
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="panel review-mode">
          <span className="small muted">02 / TỪ VỰNG</span>
          <h2>Gợi lại, rồi đối chiếu.</h2>
          <p>Tự nói nghĩa và một ví dụ trước khi lật thẻ.</p>
          <button
            className="button secondary"
            disabled={!dueWords.length || Boolean(flash)}
            onClick={() => setFlash(dueWords[0])}
          >
            Ôn {dueWords.length} từ
            <ArrowRight size={16} />
          </button>
        </section>
        <section className="panel review-mode">
          <span className="small muted">03 / KIẾN THỨC</span>
          <h2>Giải thích bằng lời mình.</h2>
          <p>Tự nêu cấu trúc và lý do dùng; sau đó đối chiếu quy tắc.</p>
          <button
            className="button secondary"
            disabled={!dueKnowledge.length || Boolean(flash)}
            onClick={() => setFlash(dueKnowledge[0])}
          >
            Ôn {dueKnowledge.length} quy tắc
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <InlineError message={action.error} />
      {flash && (
        <RecallCard
          key={`${flash.id}:${flash.dueAt}`}
          card={flash}
          onFinish={(done) => {
            setFlash(null)
            if (done) setReviewed((n) => n + 1)
          }}
        />
      )}
      {reviewed > 0 && !flash && (
        <div className="review-completed" role="status">
          <Check size={20} />
          <span>Đã ôn {reviewed} thẻ trong lượt này. Lịch mới đã được lưu.</span>
          {[...dueWords, ...dueKnowledge][0] && (
            <button
              className="text-link"
              onClick={() => setFlash([...dueWords, ...dueKnowledge][0])}
            >
              Thẻ tiếp theo
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
      <section className="section-spaced">
        <SectionTitle
          title="Sổ ôn tập"
          note="Một công cụ hỗ trợ nhịp học, không phải nghĩa vụ hay xác suất nhớ được dự đoán."
        />
        <div className="filter-tabs" aria-label="Lọc sổ ôn tập">
          {(
            [
              { id: 'due', label: `Đến hạn (${due.length})` },
              { id: 'all', label: `Tất cả (${knownCards.length})` },
              { id: 'mistakes', label: 'Câu sai / bỏ trống' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              aria-pressed={filter === item.id}
              className={filter === item.id ? 'active' : ''}
              onClick={() => {
                setFilter(item.id)
                setLimit(40)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {visible.length ? (
          <div className="review-list">
            {visible.slice(0, limit).map((card) => (
              <div key={card.id} className="review-row">
                <span className="review-kind">
                  {card.kind === 'question' ? <RotateCcw size={18} /> : <BookOpen size={18} />}
                </span>
                <div>
                  <strong lang={card.kind === 'knowledge' ? 'vi' : 'en'}>
                    {card.kind === 'question'
                      ? questionById.get(card.contentId)?.prompt
                      : card.kind === 'vocabulary'
                        ? vocabularyById.get(card.contentId)?.word
                        : grammarById.get(card.contentId)?.title}
                  </strong>
                  <p>
                    {card.kind === 'question'
                      ? `Part ${questionById.get(card.contentId)?.part}`
                      : card.kind === 'knowledge'
                        ? 'Kiến thức · tự đánh giá'
                        : 'Từ vựng · tự đánh giá'}{' '}
                    · {card.repetitions} lần nhớ/trả lời đúng liên tiếp
                  </p>
                </div>
                <span className={`due-label ${card.dueAt <= now ? 'is-due' : ''}`}>
                  <Clock3 size={13} />
                  {dueLabel(card, now)}
                </span>
                <button
                  className="text-link"
                  disabled={action.busy || !schedulableCard(card)}
                  onClick={() =>
                    card.kind === 'question'
                      ? void action.run(async () => {
                          const session = await startSession('practice', [card.contentId])
                          navigate('session', session.id)
                        })
                      : navigateReference(
                          card.kind === 'knowledge' ? 'grammar' : 'vocabulary',
                          card.contentId,
                        )
                  }
                >
                  {card.kind === 'question'
                    ? 'Luyện lại'
                    : card.kind === 'knowledge'
                      ? 'Xem bài'
                      : 'Xem từ'}
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={RotateCcw}
            title={filter === 'due' ? 'Chưa có mục nào đến hạn.' : 'Một trang sổ còn mới.'}
            action={
              <button className="button secondary" onClick={() => navigate('practice')}>
                Khám phá bài luyện
                <ArrowRight size={15} />
              </button>
            }
          >
            Thẻ sai được đưa vào lịch củng cố; từ và kiến thức được lưu theo lựa chọn của bạn.
          </EmptyState>
        )}
      </section>
      {visible.length > limit && (
        <button className="button secondary" onClick={() => setLimit((n) => n + 40)}>
          Xem thêm 40 mục ({Math.min(limit, visible.length)}/{visible.length})
        </button>
      )}
      <MistakeReview />
      <p className="small muted review-method">
        Lịch FSRS dùng đánh giá nhớ lại và lịch sử thực tế. Tham số hiện là mặc định chung, chưa
        được tối ưu riêng cho bạn. Lịch cũ được giữ khi nâng dữ liệu; lượt ôn mới bắt đầu dùng FSRS.
      </p>
    </>
  )
}
