import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink, FileCheck2 } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, useAction } from '../../application/hooks'
import {
  changeSourcePractice,
  startSourcePractice,
  type SourcePracticeChange,
} from '../../application/studioRepository'
import { officialSources, officialSampleCount } from '../../content/officialSources'
import { grammarById } from '../../content/grammar'
import type { ToeicPart } from '../../content/schema'
import {
  personalPracticeSource,
  sourceChoices,
  sourceResult,
  validSourcePractice,
  type PracticeSource,
  type SourcePracticeActivity,
} from '../../domain/sourcePractice'
import { EmptyState, InlineError, PageHeading } from '../../components/ui'
import { registerUpdatePreparation } from '../../application/updatePreparation'
import { StudyOperationError } from '../../application/errors'

export function OfficialPracticePage({ id }: { id?: string }) {
  const data = useStudy(),
    action = useAction()
  const [part, setPart] = useState<ToeicPart>(5)
  const [assistance, setAssistance] = useState<SourcePracticeActivity['assistance']>('unassisted')
  const [seenBefore, setSeenBefore] = useState(false)
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState<ToeicPart | 'full'>('full')
  const sheets = data.learningActivities.filter((row): row is SourcePracticeActivity =>
    validSourcePractice(row),
  )
  const active = sheets.find((row) => row.status === 'answering' || row.status === 'checking')
  async function begin(source: PracticeSource) {
    const hash = window.location.hash
    const sheet = await action.run(() => startSourcePractice(source, { assistance, seenBefore }))
    if (sheet && window.location.hash === hash) navigate('sources', sheet.id)
  }
  if (id) {
    const sheet = sheets.find((sheet) => sheet.id === id)
    return sheet ? (
      <SourceWorksheet key={id} sheet={sheet} />
    ) : (
      <EmptyState
        icon={FileCheck2}
        title="Không tìm thấy phiếu đã lưu."
        action={
          <button className="button secondary" onClick={() => navigate('sources')}>
            Về nguồn luyện
          </button>
        }
      >
        Kiểm tra bản sao lưu nếu phiếu thuộc thiết bị khác. Không tạo lượt mới thay cho lịch sử bị
        thiếu.
      </EmptyState>
    )
  }
  return (
    <>
      <PageHeading
        eyebrow="TÀI LIỆU GỐC · PHIẾU LÀM BÀI CỦA BẠN"
        title="Học với nguồn chính thức"
        description="Đọc/nghe tại IIBC. Ghi lựa chọn, đối chiếu và giữ kết quả trong STUDY 990."
        action={
          <button className="button secondary" onClick={() => navigate('practice')}>
            <ArrowLeft size={16} />
            Luyện tập
          </button>
        }
      />
      <p className="small muted">
        {officialSources.length} trang mẫu · {officialSampleCount} câu tại nguồn · đủ 7 Parts. Đây
        là mẫu công bố chính thức, chưa phải đề thi đầy đủ hoặc đề từng dùng trong kỳ thi.
      </p>
      {active && (
        <div className="resume-banner">
          <span>Phiếu đang mở: {active.source.title}</span>
          <button className="button secondary" onClick={() => navigate('sources', active.id)}>
            Tiếp tục phiếu
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <section className="source-conditions panel" aria-label="Điều kiện lượt làm mới">
        <label className="form-label">
          Cách học
          <select
            value={assistance}
            onChange={(e) => setAssistance(e.target.value as typeof assistance)}
          >
            <option value="unassisted">Tự làm trước, đối chiếu sau</option>
            <option value="assisted">Vừa học vừa tra / nghe lại</option>
          </select>
        </label>
        <label className="source-checkbox">
          <input
            type="checkbox"
            checked={seenBefore}
            onChange={(e) => setSeenBefore(e.target.checked)}
          />
          Tôi đã xem đề hoặc biết đáp án trước đó
        </label>
      </section>
      <div className="filter-tabs source-part-tabs" aria-label="Part từ nguồn gốc">
        {([1, 2, 3, 4, 5, 6, 7] as const).map((value) => (
          <button
            key={value}
            aria-pressed={part === value}
            className={part === value ? 'active' : ''}
            onClick={() => setPart(value)}
          >
            Part {value}
          </button>
        ))}
      </div>
      <section className="source-catalog" aria-label="Mẫu chính thức tại IIBC">
        {officialSources
          .filter((source) => source.groups.some((group) => group.part === part))
          .map((source) => (
            <article key={source.id} className="panel source-catalog-row">
              <div>
                <span className="eyebrow">ETS / IIBC · MẪU CHÍNH THỨC</span>
                <h2>{source.title}</h2>
                <p>{source.focus}</p>
                <span className="small muted">
                  {source.groups.reduce((n, g) => n + g.numbers.length, 0)} câu · kiểm tra liên kết
                  29/10/2026
                </span>
              </div>
              <button
                className="button primary"
                disabled={action.busy}
                onClick={() => void begin(source)}
              >
                {active ? 'Tiếp tục phiếu đang mở' : 'Mở phiếu làm bài'}
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
      </section>
      <InlineError message={action.error} />
      <details className="source-personal panel">
        <summary>Làm cùng sách hoặc bộ đề của tôi</summary>
        <p className="small muted">
          Dùng đề trong tài liệu của bạn. App lưu số câu và lựa chọn; không tải sách lên. Tên tài
          liệu do bạn khai, chưa được xác minh là đề ETS.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void begin(personalPracticeSource(title, scope))
          }}
        >
          <label className="form-label">
            Tên sách, năm và mã đề
            <input
              required
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên sách · năm xuất bản · Test 01"
            />
          </label>
          <label className="form-label">
            Phạm vi phiếu
            <select
              value={scope}
              onChange={(e) =>
                setScope(e.target.value === 'full' ? 'full' : (Number(e.target.value) as ToeicPart))
              }
            >
              <option value="full">Phiếu 200 câu · đánh số theo format L&R</option>
              {([1, 2, 3, 4, 5, 6, 7] as const).map((p) => (
                <option key={p} value={p}>
                  Riêng Part {p}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary" disabled={action.busy || !title.trim()}>
            Tạo phiếu cá nhân
            <ArrowRight size={16} />
          </button>
        </form>
      </details>
      {sheets.length > 0 && (
        <details className="source-history panel">
          <summary>Lịch sử phiếu · {sheets.length} lượt</summary>
          {sheets
            .slice()
            .sort((a, b) => b.occurredAt - a.occurredAt)
            .slice(0, 30)
            .map((sheet) => {
              const result = sourceResult(sheet)
              return (
                <button
                  className="source-history-row"
                  key={sheet.id}
                  onClick={() => navigate('sources', sheet.id)}
                >
                  <span>
                    {sheet.source.title}
                    <small>
                      {new Date(sheet.occurredAt).toLocaleDateString('vi-VN')} ·{' '}
                      {sheet.assistance === 'assisted' ? 'Có hỗ trợ' : 'Tự làm'}
                      {sheet.seenBefore ? ' · đã gặp đề' : ''}
                    </small>
                  </span>
                  <strong>
                    {result
                      ? `${result.correct}/${result.total}`
                      : sheet.status === 'abandoned'
                        ? 'Đã dừng'
                        : 'Chưa kết thúc'}
                  </strong>
                  <ArrowRight size={16} />
                </button>
              )
            })}
          {sheets.length > 30 && (
            <p className="small muted">
              Hiện 30 lượt gần nhất. Toàn bộ lịch sử vẫn nằm trong sổ học và bản sao lưu.
            </p>
          )}
        </details>
      )}
      <p className="small muted source-footnote">
        Đề, hình, audio và đáp án chính thức nằm tại nguồn. Nguồn cần kết nối mạng; phiếu lưu trên
        thiết bị và đi cùng bản xuất dữ liệu. Kết quả thô không quy đổi thành điểm TOEIC.
      </p>
    </>
  )
}

function SourceWorksheet({ sheet }: { sheet: SourcePracticeActivity }) {
  const action = useAction()
  const [page, setPage] = useState(0)
  const [keyText, setKeyText] = useState('')
  useEffect(() => {
    const dirty = Boolean(keyText.trim())
    const unregister = registerUpdatePreparation(async () => {
      if (dirty)
        throw new StudyOperationError(
          'Chuỗi khóa đáp án chưa lưu. Lưu khóa hoặc xóa phần nhập trước khi cập nhật.',
        )
    })
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', protectDraft)
    return () => {
      unregister()
      window.removeEventListener('beforeunload', protectDraft)
    }
  }, [keyText])
  const pages = sheet.source.groups.flatMap((group) => {
    if (sheet.source.kind === 'official-sample') return [group]
    return Array.from({ length: Math.ceil(group.numbers.length / 12) }, (_, i) => ({
      part: group.part,
      numbers: group.numbers.slice(i * 12, i * 12 + 12),
    }))
  })
  const group = pages[Math.min(page, pages.length - 1)]
  const isAnswering = sheet.status === 'answering',
    isChecking = sheet.status === 'checking'
  const result = sourceResult(sheet)
  const source =
    sheet.source.kind === 'official-sample'
      ? officialSources.find(
          (s) => s.id === sheet.source.id && s.revision === sheet.source.revision,
        )
      : undefined
  const omitted = sheet.items.filter((item) => item.selected === null).length
  const keyed = sheet.items.filter((item) => item.key !== null).length
  function change(change: SourcePracticeChange) {
    void action.run(async () => {
      if ((change.kind === 'complete' || change.kind === 'abandon') && keyText.trim())
        throw new StudyOperationError(
          'Lưu khóa đáp án đang nhập hoặc xóa phần nhập trước khi kết thúc phiếu.',
        )
      return changeSourcePractice(sheet.id, sheet.revision, change)
    })
  }
  function returnToSources() {
    if (!keyText.trim()) {
      navigate('sources')
      return
    }
    void action.run(async () => {
      throw new StudyOperationError(
        'Chuỗi khóa đáp án chưa lưu. Lưu hoặc xóa phần nhập trước khi rời phiếu.',
      )
    })
  }
  return (
    <>
      <PageHeading
        eyebrow={
          sheet.source.kind === 'official-sample'
            ? 'MẪU TẠI IIBC · PHIẾU ĐỐI CHIẾU'
            : 'TÀI LIỆU CỦA BẠN · NGUỒN TỰ KHAI'
        }
        title={sheet.source.title}
        description={
          isAnswering
            ? 'Ghi lựa chọn trước khi mở đáp án tại nguồn.'
            : isChecking
              ? 'Lựa chọn đã khóa. Nhập khóa đáp án từ tài liệu gốc để đối chiếu.'
              : result
                ? 'Kết quả theo khóa đáp án bạn nhập, chưa được xác minh tự động.'
                : 'Phiếu đã dừng; lựa chọn cũ được giữ nguyên.'
        }
        action={
          <button className="button secondary" onClick={returnToSources}>
            <ArrowLeft size={16} />
            Các nguồn luyện
          </button>
        }
      />
      <div className="source-workspace-bar panel">
        {sheet.source.url ? (
          <a
            className="button primary"
            href={sheet.source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isAnswering ? 'Mở đề & audio gốc' : 'Mở nguồn để đối chiếu'}
            <ExternalLink size={16} />
          </a>
        ) : (
          <span className="small muted">Mở đúng đề trong sách hoặc tài liệu của bạn.</span>
        )}
        <span className="small muted" role="status">
          {isChecking
            ? `${keyed}/${sheet.items.length} khóa đáp án đã lưu`
            : `${sheet.items.length - omitted}/${sheet.items.length} lựa chọn đã lưu`}
        </span>
      </div>
      <InlineError message={action.error} />
      {isChecking && (
        <details className="source-bulk-key panel">
          <summary>Nhập nhanh toàn bộ khóa đáp án</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void action.run(async () => {
                await changeSourcePractice(sheet.id, sheet.revision, {
                  kind: 'keys',
                  text: keyText,
                })
                setKeyText('')
              })
            }}
          >
            <label className="form-label">
              Chuỗi chữ cái theo thứ tự số câu trên phiếu
              <textarea
                rows={3}
                maxLength={4000}
                spellCheck={false}
                autoCapitalize="characters"
                autoCorrect="off"
                disabled={action.busy}
                value={keyText}
                onChange={(e) => setKeyText(e.target.value)}
                placeholder="A B C D …"
              />
            </label>
            <p className="small muted">
              {keyText.trim() ? 'Chuỗi đang nhập chưa lưu. ' : ''}Nhận khoảng trắng, dấu phẩy hoặc
              xuống dòng. Không kèm số câu. Phiếu nhiều Part dùng thứ tự Part 1 → 7.
            </p>
            <button className="button secondary" disabled={action.busy || !keyText.trim()}>
              Kiểm tra & lưu khóa
            </button>
            {keyText && (
              <button
                className="text-link"
                type="button"
                disabled={action.busy}
                onClick={() => setKeyText('')}
              >
                Xóa phần nhập
              </button>
            )}
          </form>
        </details>
      )}
      {result && (
        <section className="panel source-results" aria-label="Kết quả đối chiếu">
          <strong>
            {result.correct}/{result.total}
            <small> đúng · {Math.round((result.correct / result.total) * 100)}%</small>
          </strong>
          <p className="small muted">
            {result.omitted} câu bỏ trống ·{' '}
            {sheet.assistance === 'assisted' ? 'Có tra cứu/nghe lại' : 'Tự khai làm không hỗ trợ'}
            {sheet.seenBefore ? ' · đã gặp đề: không tính thành câu mới' : ''}
          </p>
          <div className="source-part-results">
            {([1, 2, 3, 4, 5, 6, 7] as const).map((part) => {
              const items = sheet.items.filter((item) => item.part === part)
              return items.length ? (
                <div key={part}>
                  <span>Part {part}</span>
                  <strong>
                    {
                      items.filter((item) => item.selected !== null && item.selected === item.key)
                        .length
                    }
                    /{items.length}
                  </strong>
                  <button className="text-link" onClick={() => navigate('practice', String(part))}>
                    Ôn Part này
                    <ArrowRight size={14} />
                  </button>
                </div>
              ) : null
            })}
          </div>
        </section>
      )}
      <section className="panel source-sheet" aria-label="Phiếu trả lời">
        <label className="form-label source-group-picker">
          {sheet.source.kind === 'official-sample' ? 'Nhóm câu tại nguồn' : 'Trang phiếu'}
          <select
            value={Math.min(page, pages.length - 1)}
            onChange={(e) => setPage(Number(e.target.value))}
          >
            {pages.map((g, i) => (
              <option key={i} value={i}>
                Part {g.part} · câu {g.numbers[0]}
                {g.numbers.length > 1 ? `–${g.numbers.at(-1)}` : ''}
              </option>
            ))}
          </select>
        </label>
        <p className="small muted">
          {isChecking
            ? 'Các nút dưới đây nhập khóa đáp án, không đổi lựa chọn đã nộp.'
            : 'Câu hỏi và tư liệu nằm ở nguồn gốc. Phiếu chỉ ghi số câu và A/B/C/D.'}
        </p>
        {group.numbers.map((number) => {
          const item = sheet.items.find((item) => item.number === number)!
          const correct = result && item.selected !== null && item.selected === item.key
          return (
            <fieldset
              className="source-answer-row"
              key={number}
              disabled={action.busy || (!isAnswering && !isChecking)}
            >
              <legend>
                Câu {number}
                {isChecking ? ` · bạn đã chọn ${item.selected ?? 'bỏ trống'}` : ''}
              </legend>
              {result || sheet.status === 'abandoned' ? (
                <p>
                  {item.selected ?? 'Bỏ trống'}
                  {result && (
                    <>
                      {' '}
                      · đáp án nhập: {item.key} ·{' '}
                      <strong className={correct ? 'success-text' : 'brass-text'}>
                        {correct ? 'Đúng' : item.selected === null ? 'Bỏ trống' : 'Sai'}
                      </strong>
                    </>
                  )}
                </p>
              ) : (
                <div className="source-answer-choices">
                  {sourceChoices(item.part).map((option) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name={`source-${sheet.id}-${number}`}
                        value={option}
                        checked={(isChecking ? item.key : item.selected) === option}
                        onChange={() =>
                          change({ kind: isChecking ? 'key' : 'select', number, option })
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {(isChecking ? item.key : item.selected) !== null && (
                    <button
                      className="text-link"
                      type="button"
                      onClick={() =>
                        change({ kind: isChecking ? 'key' : 'select', number, option: null })
                      }
                    >
                      Xóa chọn
                    </button>
                  )}
                </div>
              )}
            </fieldset>
          )
        })}
        <nav className="source-sheet-navigation" aria-label="Di chuyển giữa nhóm câu">
          <button
            className="button secondary"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ArrowLeft size={16} />
            Trước
          </button>
          <span className="small muted">
            {page + 1}/{pages.length}
          </span>
          <button
            className="button secondary"
            disabled={page === pages.length - 1}
            onClick={() => setPage(page + 1)}
          >
            Tiếp
            <ArrowRight size={16} />
          </button>
        </nav>
        {isAnswering && (
          <button
            className="button primary"
            disabled={action.busy}
            onClick={() => change({ kind: 'lock' })}
          >
            Nộp & khóa lựa chọn{omitted > 0 ? ` · ${omitted} câu bỏ trống` : ''}
          </button>
        )}
        {isChecking && (
          <button
            className="button primary"
            disabled={action.busy || keyed !== sheet.items.length || Boolean(keyText.trim())}
            onClick={() => change({ kind: 'complete' })}
          >
            Lưu kết quả đối chiếu
          </button>
        )}
        {(isAnswering || isChecking) && (
          <details className="source-stop">
            <summary>Dừng phiếu này</summary>
            <p className="small muted">Giữ lựa chọn đã lưu, không tính thành kết quả hoàn thành.</p>
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => change({ kind: 'abandon' })}
            >
              Kết thúc lượt đang làm
            </button>
          </details>
        )}
      </section>
      {result && (
        <section className="panel source-review">
          <h2>Ôn bằng chứng, không học thuộc chữ cái</h2>
          <p>
            {source?.focus ??
              'Với từng câu sai, chỉ ra bằng chứng trong tài liệu gốc và lý do phương án bạn chọn không thỏa yêu cầu.'}
          </p>
          <ol>
            <li>Tìm điều kiện quyết định: cấu trúc, nghĩa hay quan hệ giữa nhiều dữ kiện?</li>
            <li>
              Giải thích phương án nhiễu: sai vai trò, sai thời điểm, thêm giả định hay chỉ trùng
              từ?
            </li>
            <li>Làm một câu mới cùng kỹ năng; lượt làm lại không thay thế lần đầu.</li>
          </ol>
          {source?.grammarIds.map((id) => (
            <button key={id} className="text-link" onClick={() => navigate('grammar', id)}>
              {grammarById.get(id)?.title}
              <ArrowRight size={14} />
            </button>
          ))}
        </section>
      )}
      <p className="small muted source-footnote">
        Khóa đáp án do bạn nhập từ nguồn; app không xác minh đó là khóa ETS. Thời gian mở phiếu
        không được coi là thời gian thi chuẩn. Phiếu không tạo điểm TOEIC hoặc chứng nhận thành
        thạo.
      </p>
    </>
  )
}
