import type { StudioCatalog } from './client'
export function Dashboard({ catalog }: { catalog: StudioCatalog }) {
  const a = catalog.audit
  return (
    <section className="studio-dashboard">
      <div className="studio-stats">
        {[
          ['Tổng', a.total],
          ['Hợp lệ cấu trúc', a.valid],
          ['Dùng được', a.usable],
          ['Cần người thẩm định', a.requiringReview],
          ['Đã có review hợp lệ', a.humanReviewed],
          ['Câu thiếu media', a.missingMediaQuestions.length],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p>
        {catalog.counts.practice} câu luyện · {catalog.counts.mock} câu mock riêng. Các câu chưa
        reviewed vẫn có nhãn và chính sách dùng riêng; kiểm tra bằng máy không chứng minh ngữ nghĩa
        đúng.
      </p>
      <div className="studio-overview">
        <table>
          <caption>Coverage theo Part, kể cả Tutor</caption>
          <thead>
            <tr>
              <th>Part</th>
              <th>Tổng</th>
              <th>Valid</th>
              <th>Usable</th>
            </tr>
          </thead>
          <tbody>
            {a.byPart.map((p) => (
              <tr key={p.part}>
                <th>{p.part}</th>
                <td>{p.total}</td>
                <td>{p.valid}</td>
                <td>{p.usable}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <section>
          <h2>Assessment sets</h2>
          {a.assessments.map((exam) => (
            <div key={exam.id}>
              <strong>{exam.id}</strong>
              <p>
                {exam.questions} câu ·{' '}
                {exam.structurallyComplete ? 'đủ cấu trúc' : 'chưa đủ cấu trúc'} ·{' '}
                {exam.available ? 'đủ điều kiện sample practice' : 'chưa sẵn sàng'}
              </p>
              {exam.issues.map((s) => (
                <p key={s} className="notice">
                  {s}
                </p>
              ))}
            </div>
          ))}
          {a.samples.map((sample) => (
            <p key={sample.id}>
              {sample.id}: {sample.questions} câu ·{' '}
              {sample.available ? 'sample sẵn sàng' : 'sample chưa sẵn sàng'} · không phải full
              exam.
            </p>
          ))}
          <p className="small muted">
            Sample chưa thẩm định không phải bài thi ETS hay chứng nhận chất lượng.
          </p>
        </section>
      </div>
      <details>
        <summary>Coverage kỹ năng ({a.bySkill.length})</summary>
        <table>
          <thead>
            <tr>
              <th>Kỹ năng</th>
              <th>Số câu gắn tag</th>
            </tr>
          </thead>
          <tbody>
            {a.bySkill.map((s) => (
              <tr key={s.skill}>
                <td>{s.skill}</td>
                <td>{s.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <details>
        <summary>
          Vấn đề ({a.issues.length}), gần trùng ({a.nearDuplicates.length}), thiếu lời giải (
          {a.incompleteExplanations.length})
        </summary>
        <pre>
          {JSON.stringify(
            {
              issues: a.issues,
              nearDuplicates: a.nearDuplicates,
              media: a.mediaFailures,
              incompleteExplanations: a.incompleteExplanations,
            },
            null,
            2,
          )}
        </pre>
      </details>
      <details>
        <summary>
          Nội dung chưa có nơi dùng ({Object.values(a.unused).reduce((n, v) => n + v.length, 0)})
        </summary>
        <pre>{JSON.stringify(a.unused, null, 2)}</pre>
        <p className="small muted">
          Tính theo bộ luyện, mock và Tutor trong catalog; không phải số câu người học chưa làm.
        </p>
      </details>
    </section>
  )
}
