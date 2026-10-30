import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock3, FileCheck2, RotateCcw, Search } from 'lucide-react'
import { availableMockExams, mockById } from '../../content/mockExams'
import { questionById, PART_LABELS } from '../../content/questions'
import type { ToeicPart } from '../../content/schema'
import { useStudy } from '../../application/StudyContext'
import { navigate, useAction } from '../../application/hooks'
import { startSession } from '../../application/sessionRepository'
import { PageHeading, EmptyState, InlineError, Tag } from '../../components/ui'
import { mockProgress } from '../../domain/mockProgress'
import { OFFICIAL_PART_COUNTS } from '../../domain/contentInventory'

const PART_FORMAT = [
  'Ảnh và 4 mô tả nghe; không in lời lựa chọn.',
  'Câu hỏi/thông báo và 3 lời đáp đều ở audio.',
  '13 hội thoại × 3 câu; có thể kèm bảng biểu.',
  '10 bài nói × 3 câu; có thể kèm bảng biểu.',
  'Chọn từ hoặc cụm từ hoàn chỉnh câu.',
  '4 đoạn × 4 câu; điền từ, cụm từ và câu.',
  '29 câu đọc đơn và 25 câu đọc nhiều văn bản.',
]

export function FullTestLibrary({ id }: { id?: string }) {
  const data = useStudy(),
    action = useAction()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'done'>('all')
  const [mode, setMode] = useState<'exam' | 'study'>('exam')
  const [parts, setParts] = useState<ToeicPart[]>([1, 2, 3, 4, 5, 6, 7])
  const active = data.sessions.find((session) => session.status === 'active')
  const progress = useMemo(
    () =>
      availableMockExams.map((exam) =>
        mockProgress(exam, data.sessions, data.attempts, data.responses),
      ),
    [data.sessions, data.attempts, data.responses],
  )
  const progressById = new Map(progress.map((row) => [row.exam.id, row]))
  const completed = (examId: string) => progressById.get(examId)?.completed ?? []
  const next =
    progress.find((r) => !r.completed.length && !r.answered) ??
    progress.find((r) => !r.completed.length)
  const exam = id ? mockById.get(id) : undefined
  async function begin() {
    if (active) {
      navigate('session', active.id)
      return
    }
    if (!exam) return
    const ids =
      mode === 'exam'
        ? exam.questionIds
        : exam.questionIds.filter((id) => parts.includes(questionById.get(id)!.part))
    const hash = window.location.hash
    const session = await action.run(() =>
      startSession('practice', ids, {
        mode,
        mockExamId: exam.id,
        durationMinutes: exam.durationMinutes,
        sectionTiming: mode === 'exam',
      }),
    )
    if (session && window.location.hash === hash) navigate('session', session.id)
  }
  if (id && (!exam || !availableMockExams.includes(exam)))
    return (
      <EmptyState
        icon={FileCheck2}
        title="Đề chưa sẵn sàng để làm bài."
        action={
          <button className="button secondary" onClick={() => navigate('tests')}>
            Về thư viện đề
          </button>
        }
      >
        Đề cần đủ câu hỏi, nhóm tư liệu, media và điều kiện nội dung. Lịch sử đã lưu được giữ
        nguyên.
      </EmptyState>
    )
  if (exam) {
    const history = data.sessions
      .filter((s) => s.mockExamId === exam.id)
      .sort((a, b) => b.startedAt - a.startedAt)
    const selectedCount = exam.questionIds.filter((id) =>
      parts.includes(questionById.get(id)!.part),
    ).length
    return (
      <>
        <PageHeading
          eyebrow="FULL TEST · 7 PARTS"
          title={exam.title}
          description="Làm trọn bài hoặc học sâu từng Part, cùng một nguồn đề và lịch sử riêng cho mỗi lượt."
          action={
            <button className="button secondary" onClick={() => navigate('tests')}>
              <ArrowLeft size={16} />
              Thư viện đề
            </button>
          }
        />
        <div className="full-test-detail">
          <section className="panel full-test-setup">
            <div className="tag-list">
              <Tag tone="sage">200 câu</Tag>
              <Tag>Listening 100 · Reading 100</Tag>
              <Tag tone="brass">
                {exam.editorialStatus === 'human-reviewed'
                  ? 'Đã duyệt nội dung'
                  : 'AI biên soạn · chưa thẩm định độc lập'}
              </Tag>
            </div>
            {completed(exam.id).length > 0 && (
              <p className="small muted">
                Bạn đã hoàn thành đề này {completed(exam.id).length} lượt. Làm lại dùng cùng câu
                hỏi.
              </p>
            )}
            <div className="filter-tabs" aria-label="Cách làm đề">
              <button
                className={mode === 'exam' ? 'active' : ''}
                aria-pressed={mode === 'exam'}
                onClick={() => setMode('exam')}
              >
                Full test
              </button>
              <button
                className={mode === 'study' ? 'active' : ''}
                aria-pressed={mode === 'study'}
                onClick={() => setMode('study')}
              >
                Luyện theo Part
              </button>
            </div>
            {mode === 'exam' ? (
              <div className="full-test-policy">
                <h2>Một lượt tập trung, đủ 200 câu</h2>
                <p>
                  Listening tối đa 45 phút; khi sang Reading, bạn có riêng 75 phút. Audio từng nhóm
                  phát một lượt, chuyển nhóm theo thứ tự.
                </p>
                <p className="small muted">
                  Audio tổng hợp theo nhóm, chuyển nhóm thủ công; chưa mô phỏng bản thu liên tục dài
                  45 phút của kỳ thi. Chuyển Reading sớm sẽ bắt đầu 75 phút ngay. Rời trang hoặc
                  refresh không dừng giờ.
                </p>
              </div>
            ) : (
              <>
                <h2>Chọn các Part muốn học</h2>
                <div className="full-test-part-presets" aria-label="Chọn nhanh phần thi">
                  {[
                    { label: 'Tất cả', values: [1, 2, 3, 4, 5, 6, 7] },
                    { label: 'Listening', values: [1, 2, 3, 4] },
                    { label: 'Reading', values: [5, 6, 7] },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      className="button secondary"
                      aria-pressed={
                        parts.length === preset.values.length &&
                        preset.values.every((p) => parts.includes(p as ToeicPart))
                      }
                      onClick={() => setParts(preset.values as ToeicPart[])}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="full-test-part-picker">
                  {([1, 2, 3, 4, 5, 6, 7] as const).map((part) => (
                    <label key={part}>
                      <input
                        type="checkbox"
                        checked={parts.includes(part)}
                        onChange={(e) =>
                          setParts((current) =>
                            e.target.checked
                              ? [...current, part].sort((a, b) => a - b)
                              : current.filter((p) => p !== part),
                          )
                        }
                      />
                      <span>
                        Part {part}
                        <small>
                          {
                            exam.questionIds.filter((id) => questionById.get(id)!.part === part)
                              .length
                          }{' '}
                          câu
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="small muted">
                  {selectedCount} câu · giữ đủ nhóm audio/văn bản. Không giới hạn giờ; được nghe
                  lại, tra từ và xem giải thích sau khi nộp từng câu.
                </p>
              </>
            )}
            <button
              className="button primary"
              disabled={action.busy || (!active && mode === 'study' && !selectedCount)}
              onClick={() => void begin()}
            >
              {active
                ? 'Tiếp tục phiên đang mở'
                : mode === 'exam'
                  ? 'Bắt đầu full test'
                  : `Luyện ${selectedCount} câu`}
              <ArrowRight size={16} />
            </button>
            <InlineError message={action.error} />
            <details className="full-test-provenance">
              <summary>Nguồn & giới hạn kết quả</summary>
              <p className="small muted">
                {exam.note} Không phải đề thi ETS. Chỉ báo số đúng/sai/bỏ trống và độ chính xác;
                không quy đổi thành điểm TOEIC.
              </p>
            </details>
          </section>
          <aside className="panel full-test-outline">
            <h2>Cấu trúc đề</h2>
            {([1, 2, 3, 4, 5, 6, 7] as const).map((part) => (
              <div key={part}>
                <span>
                  Part {part}
                  <small>{PART_LABELS[part]}</small>
                </span>
                <strong>
                  {exam.questionIds.filter((id) => questionById.get(id)!.part === part).length}
                </strong>
              </div>
            ))}
            <p className="small muted">
              Đáp án lưu trên thiết bị. Lượt làm mới không ghi đè lượt trước.
            </p>
          </aside>
        </div>
        {history.length > 0 && (
          <section className="section-spaced">
            <h2 className="recent-title">Lịch sử của đề này</h2>
            <div className="full-test-history">
              {history.slice(0, 20).map((session) => {
                const attempts = data.attempts.filter((a) => a.sessionId === session.id)
                return (
                  <button key={session.id} onClick={() => navigate('session', session.id)}>
                    <span>
                      <strong>
                        {session.mode === 'exam' ? 'Full test' : 'Luyện theo Part'} ·{' '}
                        {session.questionIds.length} câu
                      </strong>
                      <small>{new Date(session.startedAt).toLocaleString('vi-VN')}</small>
                    </span>
                    <span>
                      {session.status === 'completed'
                        ? `${attempts.filter((a) => a.correct).length}/${session.questionIds.length} đúng`
                        : session.status === 'active'
                          ? 'Tiếp tục'
                          : 'Bị gián đoạn'}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                )
              })}
            </div>
            {history.length > 20 && (
              <p className="small muted">
                Hiện 20 lượt gần nhất; toàn bộ lịch sử vẫn được giữ trong sổ học và bản sao lưu.
              </p>
            )}
          </section>
        )}
      </>
    )
  }
  const visible = availableMockExams.filter(
    (exam) =>
      exam.title.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')) &&
      (filter === 'all' ||
        (filter === 'done' ? completed(exam.id).length > 0 : !completed(exam.id).length)),
  )
  return (
    <>
      <PageHeading
        eyebrow="THƯ VIỆN ĐỀ · TOEIC LISTENING & READING"
        title="Full test"
        description={`${availableMockExams.length} bộ đề · Listening 45 phút, Reading 75 phút. Làm trọn bài hoặc luyện từng Part.`}
      />
      <section className="test-library-overview" aria-label="Tiến độ thư viện đề">
        <div>
          <strong>
            {progress.filter((r) => r.completed.length > 0).length}/{availableMockExams.length}
          </strong>
          <span> bộ đề đã nộp full test</span>
        </div>
        <div>
          <strong>{progress.reduce((n, r) => n + r.answered, 0)}</strong>
          <span> câu đã trả lời trong các bộ đề</span>
        </div>
        {!active && next && (
          <button className="text-link" onClick={() => navigate('tests', next.exam.id)}>
            Đề tiếp theo
            <ArrowRight size={16} />
          </button>
        )}
      </section>
      {active && (
        <div className="resume-banner">
          <span>
            <RotateCcw size={18} />
            Bạn có một phiên đang mở.{' '}
            {active.mode === 'exam' ? 'Giờ vẫn chạy.' : 'Lựa chọn đã lưu được giữ.'}
          </span>
          <button className="button secondary" onClick={() => navigate('session', active.id)}>
            Tiếp tục
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <details className="test-format-guide">
        <summary>Cấu trúc 7 Parts & cách làm</summary>
        <div>
          {PART_FORMAT.map((description, index) => (
            <div key={index}>
              <span className="eyebrow">
                PART {index + 1} · {OFFICIAL_PART_COUNTS[index]} CÂU
              </span>
              <strong>{PART_LABELS[(index + 1) as ToeicPart]}</strong>
              <p>{description}</p>
            </div>
          ))}
        </div>
        <p className="small muted">
          Trong Exam Mode, không mở transcript hay lời giải trước khi nộp. Audio mẫu là giọng tổng
          hợp theo nhóm; chưa mô phỏng bản thu liên tục của kỳ thi.
        </p>
      </details>
      <div className="full-test-search">
        <label>
          <Search size={18} />
          <span className="sr-only">Tìm tên đề</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên đề…"
          />
        </label>
        <div className="filter-tabs" aria-label="Lọc lịch sử đề">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'new', label: 'Chưa nộp full test' },
              { id: 'done', label: 'Đã nộp' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              className={filter === item.id ? 'active' : ''}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="full-test-catalog">
        {visible.map((exam) => (
          <article className="panel full-test-card" key={exam.id}>
            <span className="eyebrow">ĐỀ LUYỆN · 200 CÂU</span>
            <h2>{exam.title}</h2>
            <p>
              <Clock3 size={16} />
              Listening tối đa 45′ · Reading 75′
            </p>
            <p className="small muted">
              {progressById.get(exam.id)?.answered ?? 0}/200 câu đã trả lời ·{' '}
              {completed(exam.id).length} lượt nộp
            </p>
            {progressById.get(exam.id)?.result && (
              <p className="test-last-result">
                Gần nhất: <strong>{progressById.get(exam.id)!.result!.correct}/200 đúng</strong>
              </p>
            )}
            <Tag tone="brass">
              {exam.editorialStatus === 'human-reviewed'
                ? 'Đã duyệt nội dung'
                : 'Đề luyện · chưa thẩm định'}
            </Tag>
            <button className="button primary" onClick={() => navigate('tests', exam.id)}>
              Chọn cách làm bài
              <ArrowRight size={16} />
            </button>
          </article>
        ))}
      </div>
      {!visible.length && (
        <EmptyState
          icon={FileCheck2}
          title="Chưa có đề khớp lựa chọn."
          action={
            <button
              className="button secondary"
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
            >
              Xem tất cả đề sẵn sàng
            </button>
          }
        >
          Chỉ hiển thị bộ đủ nội dung và media; không tăng số đề bằng cách nhân bản câu hỏi.
        </EmptyState>
      )}
      <p className="small muted full-test-library-note">
        Đề luyện hiện chưa hiệu chuẩn theo thang điểm TOEIC. Bạn có thể dùng{' '}
        <button className="text-link" onClick={() => navigate('sources')}>
          nguồn IIBC và phiếu cho tài liệu cá nhân
          <ArrowRight size={14} />
        </button>{' '}
        để đối chiếu thêm.
      </p>
    </>
  )
}
