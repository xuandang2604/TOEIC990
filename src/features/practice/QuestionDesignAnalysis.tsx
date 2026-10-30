import { DECISION_KINDS, type QuestionDesign } from '../../content/questionDesign'
import { EvidenceCheck } from '../reading/EvidenceCheck'

const sourceLabels = {
  prompt: 'Trong câu hỏi',
  audio: 'Trong audio',
  passage: 'Trong văn bản',
  table: 'Trong bảng',
  photo: 'Trong ảnh',
} as const

export function QuestionDesignAnalysis({ design }: { design: QuestionDesign }) {
  const references = design.evidence
    .filter((item) => item.source === 'passage' && item.sourceId && item.quote)
    .map((item) => ({ passageId: item.sourceId!, quote: item.quote!, note: item.note }))
  return (
    <details className="question-design-analysis">
      <summary>Câu này kiểm tra gì? · {DECISION_KINDS[design.kind]}</summary>
      <p>{design.target}</p>
      <p>
        <strong>Điểm quyết định:</strong> {design.decisivePoint}
      </p>
      <div className="question-design-evidence">
        {design.evidence
          .filter((item) => item.source !== 'passage')
          .map((item, index) => (
            <div key={index}>
              <span className="eyebrow">{sourceLabels[item.source]}</span>
              {item.quote && (
                <blockquote lang="en" data-learning>
                  {item.quote}
                </blockquote>
              )}
              <p>{item.note}</p>
            </div>
          ))}
      </div>
      {references.length > 0 && (
        <EvidenceCheck questionId={design.questionId} references={references} />
      )}
      <p>
        <strong>Yêu cầu xử lý:</strong> {design.demandNote}
      </p>
      <p className="question-design-recall">
        <strong>Thử tự giải thích:</strong> {design.reviewPrompt}
      </p>
      <p className="small muted">
        Phân tích bổ sung do AI biên soạn, chưa thẩm định độc lập. Không phải độ khó đã hiệu chuẩn
        theo điểm TOEIC.
      </p>
    </details>
  )
}
