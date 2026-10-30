import { ArrowRight, Check, FileCheck2 } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate } from '../../application/hooks'
import { availableMockExams } from '../../content/mockExams'
import { roadmapCheckpoints } from '../../domain/mockProgress'
import type { learningRoadmap } from '../../domain/roadmap'

export function RoadmapCheckpoints({
  roadmap,
  now,
}: {
  roadmap: NonNullable<ReturnType<typeof learningRoadmap>>
  now: number
}) {
  const data = useStudy()
  const rows = roadmapCheckpoints(
    roadmap,
    availableMockExams,
    data.sessions,
    data.attempts,
    data.responses,
    now,
  )
  return (
    <section className="roadmap-checkpoints panel" aria-labelledby="checkpoint-title">
      <header>
        <div>
          <span className="eyebrow">LÀM ĐỀ → CHỮA LỖI → ÔN LẠI</span>
          <h2 id="checkpoint-title">Những lượt đề trong lộ trình</h2>
        </div>
        <span className="small muted">
          {rows.filter((r) => r.complete).length}/{rows.length} mốc đã có bài nộp
        </span>
      </header>
      <p className="small muted">
        Mốc gợi ý theo lịch của bạn. Mỗi full test cần dành riêng 120 phút; thời gian chữa đề không
        tính trong đó. Bạn có thể làm vào ngày khác; đây không phải hạn nộp.
      </p>
      <ol>
        {rows.map(({ date, index, progress, complete, due }) => (
          <li key={date} data-complete={complete || undefined}>
            <span className="checkpoint-marker" aria-hidden="true">
              {complete ? <Check size={17} /> : String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <time dateTime={date}>
                {new Date(date + 'T12:00:00').toLocaleDateString('vi-VN', {
                  day: 'numeric',
                  month: 'numeric',
                })}
              </time>
              <h3>{progress?.exam.title ?? 'Chờ bộ đề đủ tư liệu'}</h3>
              <p className="small muted">
                {complete
                  ? progress?.result
                    ? `${progress.result.correct}/${progress.result.total} câu đúng ở lượt nộp gần nhất · cần chữa và ôn lại`
                    : 'Đã nộp bài · mở kết quả để chữa'
                  : progress?.answered
                    ? `${progress.answered}/200 câu đã từng trả lời · kết quả có thể chịu ảnh hưởng khi làm lại`
                    : due
                      ? 'Có thể dành một buổi riêng để làm đề'
                      : 'Dành một buổi làm đề và một lượt chữa sau đó'}
              </p>
            </div>
            {progress && (
              <button
                className="button secondary"
                onClick={() =>
                  complete && progress.latest
                    ? navigate('session', progress.latest.id)
                    : navigate('tests', progress.exam.id)
                }
              >
                {complete ? 'Chữa đề' : 'Xem đề'}
                <ArrowRight size={15} />
              </button>
            )}
          </li>
        ))}
      </ol>
      {!rows.length && (
        <p className="small muted">
          <FileCheck2 size={16} /> Chọn thêm ngày học để có mốc tự đánh giá.
        </p>
      )}
      <p className="small muted">
        Làm lại cùng một đề không tạo thêm mốc. Câu từ đề đã nộp sẽ được dùng để luyện điểm yếu; các
        đề chưa nộp được giữ riêng khỏi gợi ý hằng ngày.
      </p>
    </section>
  )
}
