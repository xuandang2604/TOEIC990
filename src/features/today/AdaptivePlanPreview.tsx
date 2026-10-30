import { BookOpen, Headphones, Layers3, RotateCcw } from 'lucide-react'
import type { PlanRecommendation } from '../../domain/adaptivePlan'
import type { StudyMinutes } from '../../domain/models'
import { questionById, PART_LABELS } from '../../content/questions'
import { SectionTitle } from '../../components/ui'

export function AdaptivePlanPreview({
  plan,
  minutes,
  onMinutes,
  active,
  showDuration = true,
}: {
  plan: PlanRecommendation
  minutes: StudyMinutes
  onMinutes: (minutes: StudyMinutes) => void
  active: boolean
  showDuration?: boolean
}) {
  const parts = [...new Set(plan.questionIds.map((id) => questionById.get(id)!.part))]
  return (
    <>
      <SectionTitle
        title={active ? 'Gợi ý cho lượt tiếp theo' : 'Một kế hoạch từ sổ học của bạn'}
        note="Ôn đến hạn, củng cố điểm vừa sai, rồi xen kẽ nội dung phù hợp."
      />
      {showDuration && (
        <div className="duration-choices" aria-label="Thời lượng học">
          {([10, 20, 40] as const).map((value) => (
            <button key={value} aria-pressed={minutes === value} onClick={() => onMinutes(value)}>
              <strong>{value}</strong> phút
            </button>
          ))}
        </div>
      )}
      <p className="plan-estimate small muted">
        Khoảng {Math.ceil(plan.estimatedSeconds / 60)} phút nội dung trong khung {minutes} phút ·{' '}
        {plan.questionIds.length} câu · {plan.cardIds.length} thẻ
        {plan.timingBasis === 'observed-and-content'
          ? ' · có dùng thời gian tương tác đã ghi nhận'
          : ' · ước tính theo nội dung'}
      </p>
      <div className="daily-plan">
        {plan.cardIds.length > 0 && (
          <div className="plan-row">
            <span className="plan-index">
              <RotateCcw size={18} />
            </span>
            <div className="plan-description">
              <span className="eyebrow">TỰ NHỚ LẠI</span>
              <h3>Thẻ từ vựng & kiến thức đến hạn</h3>
              <p>Nhớ trước, đối chiếu sau; tự đánh giá chỉ sau khi lật.</p>
            </div>
            <span className="plan-count">
              {plan.cardIds.length} thẻ
              <Layers3 size={18} />
            </span>
          </div>
        )}
        {parts.map((part) => (
          <div className="plan-row" key={part}>
            <span className="plan-index">P{part}</span>
            <div className="plan-description">
              <span className="eyebrow">{PART_LABELS[part]}</span>
              <h3>
                {part <= 4
                  ? 'Lắng nghe trong ngữ cảnh'
                  : part === 5
                    ? 'Nhìn cấu trúc, chọn có lý do'
                    : 'Đọc để tìm bằng chứng'}
              </h3>
              <p>
                {
                  plan.reasons.find(
                    (r) =>
                      plan.questionIds.includes(r.contentId) &&
                      questionById.get(r.contentId)?.part === part,
                  )?.text
                }
              </p>
            </div>
            <span className="plan-count">
              {plan.questionIds.filter((id) => questionById.get(id)?.part === part).length} câu
              {part <= 4 ? <Headphones size={18} /> : <BookOpen size={18} />}
            </span>
          </div>
        ))}
        {!parts.length && !plan.cardIds.length && (
          <p className="small muted plan-no-content">
            Chưa có mục mới hoặc đến hạn phù hợp. Bạn có thể tự chọn bài luyện.
          </p>
        )}
      </div>
      <details className="plan-rationale">
        <summary>Vì sao có kế hoạch này?</summary>
        {plan.summary.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
        <p>
          Đây là quy tắc đề xuất dùng dữ liệu local, không phải dự đoán điểm hay một kế hoạch do AI
          tạo.
        </p>
      </details>
    </>
  )
}
