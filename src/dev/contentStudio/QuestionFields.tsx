import type { Question, Skill } from '../../content/schema'
import { SKILL_LABELS } from '../../domain/skillTaxonomy'
export function QuestionFields({
  question: q,
  onChange,
}: {
  question: Question
  onChange: (q: Question) => void
}) {
  const field = (
    label: string,
    key: 'id' | 'prompt' | 'explanation' | 'takeaway' | 'stimulusId' | 'blankKey' | 'passageId',
  ) => (
    <label className="form-label" key={key}>
      {label}
      <textarea
        rows={key === 'explanation' ? 4 : 2}
        value={q[key] ?? ''}
        onChange={(e) =>
          onChange({
            ...q,
            [key]: ['stimulusId', 'blankKey', 'passageId'].includes(key)
              ? e.target.value || undefined
              : e.target.value,
          })
        }
      />
    </label>
  )
  return (
    <section>
      <h2>Question</h2>
      {field('Stable question ID', 'id')}
      <div className="studio-fields">
        <label className="form-label">
          Part
          <select
            value={q.part}
            onChange={(e) => onChange({ ...q, part: Number(e.target.value) as Question['part'] })}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Difficulty
          <select
            value={q.difficulty}
            onChange={(e) =>
              onChange({ ...q, difficulty: e.target.value as Question['difficulty'] })
            }
          >
            {['foundation', 'intermediate', 'advanced'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Topic
          <select
            value={q.topic}
            onChange={(e) => onChange({ ...q, topic: e.target.value as Question['topic'] })}
          >
            {['office', 'travel', 'training', 'shopping', 'facilities', 'grammar'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {field('English question', 'prompt')}
      {q.options.map((option, i) => (
        <div key={i} className="studio-choice">
          <label className="form-label">
            Option ID
            <input
              value={option.id}
              onChange={(e) =>
                onChange({
                  ...q,
                  options: q.options.map((o, j) =>
                    j === i ? { ...o, id: e.target.value as 'A' } : o,
                  ),
                })
              }
            />
          </label>
          <label className="form-label">
            Answer choice
            <input
              lang="en"
              value={option.text}
              onChange={(e) =>
                onChange({
                  ...q,
                  options: q.options.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                })
              }
            />
          </label>
          <label className="form-label">
            Distractor / correct reasoning
            <textarea
              value={option.reasoning}
              onChange={(e) =>
                onChange({
                  ...q,
                  options: q.options.map((o, j) =>
                    j === i ? { ...o, reasoning: e.target.value } : o,
                  ),
                })
              }
            />
          </label>
        </div>
      ))}
      <label className="form-label">
        One correct answer
        <select
          value={q.answer}
          onChange={(e) => onChange({ ...q, answer: e.target.value as 'A' })}
        >
          <option value="">Select one key</option>
          {q.options.map((o, i) => (
            <option key={i} value={o.id}>
              {o.id}
            </option>
          ))}
        </select>
      </label>
      {field('Vietnamese explanation', 'explanation')}
      {field('Transferable takeaway', 'takeaway')}
      <label className="form-label">
        Skill tags
        <select
          multiple
          size={7}
          value={q.skills}
          onChange={(e) =>
            onChange({ ...q, skills: [...e.target.selectedOptions].map((o) => o.value as Skill) })
          }
        >
          {Object.entries(SKILL_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label} ({id})
            </option>
          ))}
        </select>
      </label>
      {(['grammarIds', 'vocabularyIds'] as const).map((key) => (
        <label key={key} className="form-label">
          {key} (comma separated)
          <input
            value={q[key].join(', ')}
            onChange={(e) =>
              onChange({
                ...q,
                [key]: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>
      ))}
      <details>
        <summary>Stimulus / blanks / evidence</summary>
        {field('Shared stimulus ID', 'stimulusId')}
        {field('Passage ID (optional)', 'passageId')}
        {field('Blank key (Part 6)', 'blankKey')}
        <label className="form-label">
          Blank type
          <select
            value={q.blankType ?? ''}
            onChange={(e) =>
              onChange({
                ...q,
                blankType: e.target.value ? (e.target.value as 'word' | 'sentence') : undefined,
              })
            }
          >
            <option value="">None</option>
            <option>word</option>
            <option>sentence</option>
          </select>
        </label>
        {(q.evidence ?? []).map((ev, i) => (
          <div key={i} className="panel">
            <label className="form-label">
              Evidence passage ID
              <input
                value={ev.passageId}
                onChange={(e) =>
                  onChange({
                    ...q,
                    evidence: q.evidence!.map((x, j) =>
                      j === i ? { ...x, passageId: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
            <label className="form-label">
              Exact quote
              <textarea
                value={ev.quote}
                onChange={(e) =>
                  onChange({
                    ...q,
                    evidence: q.evidence!.map((x, j) =>
                      j === i ? { ...x, quote: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
            <label className="form-label">
              Vietnamese evidence explanation
              <textarea
                value={ev.explanation}
                onChange={(e) =>
                  onChange({
                    ...q,
                    evidence: q.evidence!.map((x, j) =>
                      j === i ? { ...x, explanation: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
            <button
              type="button"
              className="text-link"
              onClick={() =>
                onChange({
                  ...q,
                  evidence:
                    q.evidence!.length > 1 ? q.evidence!.filter((_, j) => j !== i) : undefined,
                })
              }
            >
              Remove reference
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            onChange({
              ...q,
              evidence: [
                ...(q.evidence ?? []),
                { passageId: q.passageId ?? '', quote: '', explanation: '' },
              ],
            })
          }
        >
          Add evidence reference
        </button>
      </details>
    </section>
  )
}
