import { useState } from 'react'
import { ArrowRight, CheckCircle2, Compass, RotateCcw } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, useAction } from '../../application/hooks'
import { finishDailyPlan, planProgress, startPlanPractice } from '../../application/plansRepository'
import { questionById } from '../../content/questions'
import { vocabularyById } from '../../content/vocabulary'
import { grammarById } from '../../content/grammar'
import type { ReviewCard } from '../../domain/models'
import { EmptyState, InlineError, PageHeading, SectionTitle, Tag } from '../../components/ui'
import { RecallCard } from '../review/RecallCard'

export function DailyPlanPage({ id }: { id?: string }) {
  const data = useStudy(),
    action = useAction()
  const [flash, setFlash] = useState<ReviewCard | null>(null)
  const plan = data.dailyPlans.find((p) => p.id === id)
  function contentLabel(contentId: string) {
    const question = questionById.get(contentId)
    if (question) return question.prompt
    const card = data.cards.find((c) => c.id === contentId)
    return (
      (card?.kind === 'vocabulary'
        ? vocabularyById.get(card.contentId)?.word
        : card?.kind === 'knowledge'
          ? grammarById.get(card.contentId)?.title
          : undefined) ?? 'Nội dung thẻ chưa có trong bộ học hiện tại'
    )
  }
  if (!plan)
    return (
      <EmptyState icon={Compass} title="Không tìm thấy kế hoạch.">
        Mở kế hoạch từ Hôm nay trong trình duyệt đã dùng để học.
      </EmptyState>
    )
  const progress = planProgress(plan, data)
  const otherSession = data.sessions.find(
    (s) => s.status === 'active' && s.id !== plan.practiceSessionId,
  )
  async function practice() {
    const sourceHash = window.location.hash
    const session = await action.run(() => startPlanPractice(plan!.id))
    if (session && window.location.hash === sourceHash) navigate('session', session.id)
  }
  return (
    <>
      <PageHeading
        eyebrow="MỘT LƯỢT HỌC VỪA SỨC"
        title={
          plan.status === 'completed'
            ? 'Đã hoàn thành kế hoạch.'
            : plan.status === 'archived'
              ? 'Lượt học đã được khép lại.'
              : `Kế hoạch ${plan.minutes} phút của bạn.`
        }
        description={`Khoảng ${Math.ceil(plan.estimatedSeconds / 60)} phút nội dung được chọn khi lập kế hoạch; bạn có thể tạm dừng và quay lại.`}
      />
      <div className="adaptive-plan-summary panel">
        <div className="tag-list">
          <Tag tone="sage">
            {progress.completedCards.length}/{plan.cardIds.length} thẻ đã ôn
          </Tag>
          <Tag>
            {progress.session?.status === 'completed'
              ? 'Phiên câu hỏi đã xong'
              : `${plan.questionIds.length} câu luyện`}
          </Tag>
        </div>
        {plan.summary.map((reason) => (
          <p className="small muted" key={reason}>
            {reason}
          </p>
        ))}
      </div>
      {otherSession && (
        <div className="resume-banner">
          <p>Một phiên câu hỏi khác đang mở; dữ liệu được giữ nguyên.</p>
          <button className="button secondary" onClick={() => navigate('session', otherSession.id)}>
            Tiếp tục phiên đó
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      {plan.status === 'active' && (
        <>
          {plan.cardIds.length > 0 && (
            <section className="section-spaced">
              <SectionTitle
                title="01 · Tự nhớ lại các thẻ đến hạn"
                note="Lật thẻ sau khi đã thử nhớ; đánh giá được lưu vào cùng lịch ôn."
              />
              <div className="plan-card-list">
                {plan.cardIds.map((cardId) => {
                  const card = data.cards.find((c) => c.id === cardId),
                    done = progress.completedCards.includes(cardId)
                  return (
                    <div className="plan-card-row" key={cardId}>
                      <span>{done ? <CheckCircle2 size={18} /> : <RotateCcw size={18} />}</span>
                      <strong>{contentLabel(cardId)}</strong>
                      <span className="small muted">
                        {done ? 'Đã ôn sau khi lập kế hoạch' : 'Chờ tự nhớ'}
                      </span>
                      <button
                        className="text-link"
                        disabled={!card || done || Boolean(flash)}
                        onClick={() => {
                          if (card) setFlash(card)
                        }}
                      >
                        Ôn thẻ
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
          {flash && (
            <RecallCard
              key={`${flash.id}:${flash.dueAt}`}
              card={flash}
              onFinish={() => setFlash(null)}
            />
          )}
          {plan.questionIds.length > 0 && (
            <section className="section-spaced">
              <SectionTitle
                title="02 · Luyện truy hồi trong ngữ cảnh"
                note="Giữ nguyên nhóm audio/văn bản; chỉ nộp đáp án mới ghi kết quả."
              />
              <div className="panel plan-practice-step">
                <p>
                  {plan.questionIds.length} câu ·{' '}
                  {progress.session?.status === 'completed'
                    ? 'Đã hoàn thành'
                    : progress.session
                      ? 'Phiên đã được lưu'
                      : 'Chưa bắt đầu'}
                </p>
                <button
                  className="button primary"
                  disabled={action.busy}
                  onClick={() => void practice()}
                >
                  {progress.session?.status === 'completed'
                    ? 'Xem lại kết quả'
                    : progress.session
                      ? 'Tiếp tục phiên'
                      : 'Bắt đầu phần câu hỏi'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </section>
          )}
          <div className="plan-finish-actions">
            <button
              className="button primary"
              disabled={!progress.done || action.busy}
              onClick={() => void action.run(() => finishDailyPlan(plan.id))}
            >
              <CheckCircle2 size={16} />
              Hoàn thành kế hoạch
            </button>
            <button
              className="text-link"
              disabled={action.busy || progress.session?.status === 'active'}
              onClick={() => void action.run(() => finishDailyPlan(plan.id, true))}
            >
              Khép lại lượt học, giữ kết quả hiện có
            </button>
          </div>
        </>
      )}
      <InlineError message={action.error} />
      {plan.status !== 'active' && progress.session && (
        <button
          className="button secondary"
          onClick={() => navigate('session', progress.session!.id)}
        >
          {progress.session.status === 'interrupted'
            ? 'Xem phiên đã đóng & dữ liệu được giữ'
            : 'Xem kết quả phiên câu hỏi'}
          <ArrowRight size={16} />
        </button>
      )}
      <details className="plan-item-reasons">
        <summary>Nội dung đã chọn & lý do</summary>
        {plan.reasons.map((reason) => (
          <p key={reason.contentId}>
            <strong>{contentLabel(reason.contentId)}</strong>
            <br />
            {reason.text}
          </p>
        ))}
      </details>
      <button className="text-link" onClick={() => navigate('today')}>
        Về Hôm nay
        <ArrowRight size={15} />
      </button>
    </>
  )
}
