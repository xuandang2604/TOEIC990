import { ArrowRight } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, useNow } from '../../application/hooks'
import { sourcePartEvidence, validSourcePractice } from '../../domain/sourcePractice'
import { officialSampleCount } from '../../content/officialSources'

export function SourceEvidencePanel() {
  const data = useStudy(),
    now = useNow()
  const rows = sourcePartEvidence(data.learningActivities, now)
  const completed = data.learningActivities.filter(
    (row) => validSourcePractice(row) && row.status === 'completed',
  ).length
  const active = data.learningActivities.find(
    (row) => validSourcePractice(row) && (row.status === 'answering' || row.status === 'checking'),
  )
  return (
    <section className="source-evidence panel" aria-label="Đối chiếu với nguồn gốc">
      <div>
        <span className="eyebrow">MẪU CHÍNH THỨC & TÀI LIỆU CỦA BẠN</span>
        <h2>Làm với đề gốc, giữ lại cách học.</h2>
        <p className="small muted">
          {officialSampleCount} câu mẫu tại IIBC · phiếu riêng cho sách/bộ đề cá nhân · {completed}{' '}
          lượt đã đối chiếu.
        </p>
      </div>
      <button className="button secondary" onClick={() => navigate('sources', active?.id)}>
        {active ? 'Tiếp tục phiếu' : 'Mở nguồn & phiếu làm bài'}
        <ArrowRight size={16} />
      </button>
      {rows.some((row) => row.total > 0) && (
        <details>
          <summary>Đối chiếu lần đầu trong 28 ngày</summary>
          <div className="source-part-results">
            {rows
              .filter((row) => row.total > 0)
              .map((row) => (
                <div key={row.part}>
                  <span>Part {row.part}</span>
                  <strong>
                    {row.correct}/{row.total}
                  </strong>
                  <button
                    className="text-link"
                    onClick={() => navigate('practice', String(row.part))}
                  >
                    Luyện tiếp
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
          </div>
          <p className="small muted">
            Theo khóa bạn nhập và điều kiện tự khai. Loại lượt có hỗ trợ/đã gặp đề; không gộp thành
            điểm TOEIC hay độ khó đã hiệu chuẩn.
          </p>
        </details>
      )}
    </section>
  )
}
