import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, navigateReference } from '../../application/hooks'
import { questionById } from '../../content/questions'
import { misconceptionSignals } from '../../domain/evidence'
import { SKILL_LABELS } from '../../domain/skillTaxonomy'
import { ERROR_CATEGORIES } from '../../application/mistakesRepository'
import { SectionTitle, Tag } from '../../components/ui'
import { MistakeNote } from './MistakeNote'
import { CorrectionFlow } from './CorrectionFlow'

export function MistakeReview() {
  const { mistakes, mistakeAnnotations, reviewEvents, attempts } = useStudy()
  const [filter, setFilter] = useState('all')
  const [limit, setLimit] = useState(20)
  const [historyLimits, setHistoryLimits] = useState<Record<string, number>>({})
  const rows = [...mistakes]
    .sort((a, b) => b.occurredAt - a.occurredAt)
    .filter((m) => {
      const signals = misconceptionSignals(m, mistakes, mistakeAnnotations)
      return (
        filter === 'all' ||
        (filter === 'repeated'
          ? signals.repeated
          : filter === 'confidence'
            ? signals.highConfidenceError
            : signals.reportedCategory === filter)
      )
    })
  return (
    <section className="section-spaced">
      <SectionTitle
        title="Hiểu lại những lần chưa đúng"
        note="Phân loại nguyên nhân do bạn tự ghi nhận. Không suy ra tâm lý từ một đáp án."
      />
      <label className="mistake-filter">
        Xem theo
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setLimit(20)
          }}
        >
          <option value="all">Tất cả lượt sai / bỏ trống</option>
          <option value="repeated">Lặp cùng lựa chọn sai</option>
          <option value="confidence">Rất chắc nhưng sai</option>
          {ERROR_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      {!rows.length && <p className="small muted">Chưa có lượt phù hợp với bộ lọc này.</p>}
      {rows.slice(0, limit).map((mistake) => {
        const q =
          attempts.find((a) => a.id === mistake.id)?.questionSnapshot?.content ??
          questionById.get(mistake.questionId)
        const relatedCardId = mistake.reference
          ? `knowledge:${mistake.reference.lessonId}`
          : `question:${mistake.questionId}`
        const history = reviewEvents
          .filter((e) => e.cardId === relatedCardId && e.occurredAt >= mistake.occurredAt)
          .sort((a, b) => b.occurredAt - a.occurredAt)
        const historyLimit = historyLimits[mistake.id] ?? 8
        return (
          <article className="mistake-record panel" key={mistake.id}>
            <div className="article-kicker">
              <Tag>{mistake.omitted ? 'Bỏ trống' : `Lần đầu chọn ${mistake.selected}`}</Tag>
              <span className="small muted">
                {new Date(mistake.occurredAt).toLocaleString('vi-VN')}
              </span>
            </div>
            <h3 lang="en" data-learning>
              {mistake.reference?.prompt ?? q?.prompt ?? mistake.questionId}
            </h3>
            <p className="small muted">
              {mistake.skills.map((s) => SKILL_LABELS[s]).join(' · ')} ·{' '}
              {mistake.timeSpentMs === null
                ? 'Chưa có thời gian đo'
                : `${Math.round(mistake.timeSpentMs / 1000)} giây tương tác`}{' '}
              ·{' '}
              {mistake.confidence === null
                ? 'Không có tự tin được cung cấp'
                : `Tự tin ${mistake.confidence}/3`}
            </p>
            <MistakeNote attemptId={mistake.id} />
            {!mistake.reference && q && attempts.find((a) => a.id === mistake.id) && (
              <details className="mistake-lab-entry">
                <summary>Mở Mistake Lab · thử lại trước khi xem đáp án</summary>
                <CorrectionFlow question={q} attempt={attempts.find((a) => a.id === mistake.id)!} />
              </details>
            )}
            {!mistake.reference &&
              mistake.selected !== null &&
              attempts.some((a) => a.id === mistake.id) && (
                <button className="text-link" onClick={() => navigate('tutor', mistake.id)}>
                  Giải thích cách nghĩ với Tutor
                  <ArrowRight size={14} />
                </button>
              )}
            {mistake.reference && (
              <details>
                <summary>Đối chiếu nội dung đã trả lời</summary>
                {mistake.reference.options.map((option) => (
                  <p key={option.id}>
                    <strong lang="en" data-learning>
                      {option.id}. {option.text}
                    </strong>
                    {option.id === mistake.reference!.answer && ' · Đáp án đúng'}
                    <br />
                    {option.explanation}
                  </p>
                ))}
                <p>{mistake.reference.explanation}</p>
              </details>
            )}
            <details>
              <summary>
                {mistake.reference ? 'Lịch ôn quy tắc liên quan' : 'Lịch sử củng cố từ lần này'} (
                {history.length})
              </summary>
              {history.length ? (
                history.slice(0, historyLimit).map((e) => (
                  <p className="small muted" key={e.id}>
                    {new Date(e.occurredAt).toLocaleString('vi-VN')} ·{' '}
                    {e.grade === 1 ? 'Chưa nhớ / trả lời sai' : 'Tự nhớ / trả lời đúng'} · Hẹn{' '}
                    {new Date(e.nextDueAt).toLocaleString('vi-VN')}
                    {e.source === 'practice-error' ? ' · lần sai ban đầu' : ''}
                  </p>
                ))
              ) : (
                <p className="small muted">Chưa có lượt ôn được ghi nhận.</p>
              )}
              {history.length > historyLimit && (
                <button
                  className="text-link"
                  onClick={() =>
                    setHistoryLimits((limits) => ({ ...limits, [mistake.id]: historyLimit + 8 }))
                  }
                >
                  Xem thêm lịch sử
                </button>
              )}
            </details>
            {mistake.reference ? (
              <button
                className="text-link"
                onClick={() => navigateReference('grammar', mistake.reference!.lessonId)}
              >
                Về bài ngữ pháp
                <ArrowRight size={14} />
              </button>
            ) : (
              q && (
                <button
                  className="text-link"
                  onClick={() =>
                    navigateReference(
                      'reference',
                      q.id,
                      mistake.sessionId
                        ? { sessionId: mistake.sessionId, questionId: q.id }
                        : undefined,
                    )
                  }
                >
                  Mở câu & bài liên quan
                  <ArrowRight size={14} />
                </button>
              )
            )}
          </article>
        )
      })}
      {rows.length > limit && (
        <button className="button secondary" onClick={() => setLimit((current) => current + 20)}>
          Xem thêm lượt trước ({rows.length - limit})
        </button>
      )}
    </section>
  )
}
