import { readingEvidence } from '../../content/readingEvidence'
import { passageById } from '../../content/questions'
import { useStudy } from '../../application/StudyContext'
import { textVersion, readingText } from '../../domain/studio'
import type { Question } from '../../content/schema'

export function EvidenceCheck({
  questionId,
  question,
  references,
}: {
  questionId: string
  question?: Question
  references?: { passageId: string; quote: string; note: string }[]
}) {
  const { readingWorkspaces } = useStudy()
  const specified =
    references ??
    question?.evidence?.map((e) => ({
      passageId: e.passageId,
      quote: e.quote,
      note: e.explanation,
    })) ??
    readingEvidence[questionId]
  const evidence = specified?.filter((e) => passageById.get(e.passageId)?.text.includes(e.quote))
  if (specified && !evidence?.length)
    return (
      <p className="notice">
        Tham chiếu bằng chứng thuộc phiên bản văn bản khác hoặc chưa có sẵn. Không tự gán trích dẫn
        thay thế.
      </p>
    )
  if (!evidence) return null
  const matches = evidence.map((e) =>
    readingWorkspaces
      .find(
        (w) =>
          w.id === e.passageId &&
          w.contentVersion === textVersion(readingText(passageById.get(e.passageId)?.text ?? '')),
      )
      ?.marks.some((m) => m.quote.includes(readingText(e.quote))),
  )
  return (
    <details className="evidence-check">
      <summary>Bằng chứng trong bài đọc</summary>
      <p className="small muted" role="status">
        {matches.filter(Boolean).length}/{evidence.length} đoạn tham chiếu nằm trong phần bạn đã
        đánh dấu. Đây là đối chiếu tham khảo, không chấm điểm suy luận.
      </p>
      <div className="evidence-reference">
        {evidence.map((e) => (
          <div key={e.quote}>
            <small>{passageById.get(e.passageId)?.title}</small>
            <blockquote lang="en" data-learning>
              {readingText(e.quote)}
            </blockquote>
            <p>{e.note}</p>
          </div>
        ))}
      </div>
    </details>
  )
}
