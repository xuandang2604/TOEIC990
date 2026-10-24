import { useState } from 'react'
import type { ReactNode } from 'react'
import { readingEvidence } from '../../content/readingEvidence'
import { passageById } from '../../content/questions'
import { useStudy } from '../../application/StudyContext'
import { textVersion, readingText } from '../../domain/studio'
import type { Question } from '../../content/schema'

export function EvidenceCheck({
  questionId,
  children,
  question,
}: {
  questionId: string
  children: ReactNode
  question?: Question
}) {
  const [revealed, setRevealed] = useState(false)
  const { readingWorkspaces } = useStudy()
  const specified =
    question?.evidence?.map((e) => ({
      passageId: e.passageId,
      quote: e.quote,
      note: e.explanation,
    })) ?? readingEvidence[questionId]
  const evidence = specified?.filter((e) => passageById.get(e.passageId)?.text.includes(e.quote))
  if (specified && !evidence?.length)
    return (
      <>
        <p className="notice">
          Tham chiếu bằng chứng thuộc phiên bản văn bản khác hoặc chưa có sẵn. Không tự gán trích
          dẫn thay thế.
        </p>
        {children}
      </>
    )
  if (!evidence || revealed)
    return (
      <>
        {revealed && evidence && (
          <div className="evidence-reference">
            <h3>Đối chiếu bằng chứng</h3>
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
        )}
        {children}
      </>
    )
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
    <section className="evidence-check">
      <p className="eyebrow">EVIDENCE CHECK</p>
      <h3>Dòng nào giúp bạn quyết định?</h3>
      <p>
        Trước khi xem lời giải, chọn và lưu đoạn bằng chứng trong văn bản. Đây là bước tự đối chiếu,
        không chấm điểm khả năng suy luận.
      </p>
      <p className="small muted" role="status">
        {matches.filter(Boolean).length}/{evidence.length} đoạn tham chiếu nằm trong phần bạn đã
        đánh dấu. Trích đoạn hẹp hơn có thể vẫn hữu ích.
      </p>
      <button className="button secondary" onClick={() => setRevealed(true)}>
        Đối chiếu & xem lời giải
      </button>
    </section>
  )
}
