import { useState } from 'react'
import { ArrowDown, BookOpen, Lightbulb } from 'lucide-react'
import {
  TEACHING_MODES,
  type TeachingMode,
  type TutorGuidance as Guidance,
} from '../../domain/tutorModels'

export function TutorGuidance({ guidance }: { guidance: Guidance }) {
  const [mode, setMode] = useState<TeachingMode>('simple')
  const section = guidance.sections[mode]
  return (
    <div className="tutor-guidance-notes">
      <div className="tutor-observation">
        <Lightbulb size={20} />
        <div>
          <strong>
            {guidance.basis === 'selected-reason'
              ? 'Đối chiếu lý do bạn tự chọn'
              : 'Hướng dẫn tham chiếu theo đáp án'}
          </strong>
          <p>{guidance.observation}</p>
        </div>
      </div>
      <div className="tutor-mode-tabs" role="tablist" aria-label="Cách xem hướng dẫn">
        {TEACHING_MODES.map((item, index) => (
          <button
            key={item.id}
            id={`mode-${item.id}`}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            aria-controls="tutor-mode-panel"
            tabIndex={mode === item.id ? 0 : -1}
            onClick={() => setMode(item.id)}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % TEACHING_MODES.length
                  : event.key === 'ArrowLeft'
                    ? (index + TEACHING_MODES.length - 1) % TEACHING_MODES.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? TEACHING_MODES.length - 1
                        : undefined
              if (next !== undefined) {
                event.preventDefault()
                setMode(TEACHING_MODES[next].id)
                document.getElementById(`mode-${TEACHING_MODES[next].id}`)?.focus()
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section
        id="tutor-mode-panel"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`mode-${mode}`}
        className={`tutor-mode-panel mode-${mode}`}
      >
        <span className="eyebrow">
          <BookOpen size={14} /> MỘT CÁCH NHÌN KHÁC
        </span>
        <h3>{section.title}</h3>
        {section.paragraphs.map((paragraph, i) => (
          <p key={i} data-learning>
            {paragraph}
          </p>
        ))}
        {section.steps && (
          <ol>
            {section.steps.map((step, i) => (
              <li key={i} data-learning>
                {step}
              </li>
            ))}
          </ol>
        )}
        {mode === 'check' && (
          <button
            className="text-link"
            onClick={() => {
              const editor = document.querySelector<HTMLTextAreaElement>('[data-tutor-revision]')
              if (editor) {
                editor.focus()
                editor.scrollIntoView({ block: 'center', behavior: 'instant' })
              } else
                document
                  .getElementById('tutor-transfer')
                  ?.scrollIntoView({ block: 'center', behavior: 'instant' })
            }}
          >
            Đến bước viết lại & vận dụng
            <ArrowDown size={15} />
          </button>
        )}
      </section>
      <div className="tutor-follow-up">
        <strong>Thử trả lời bằng lời của bạn</strong>
        <p>{guidance.followUp}</p>
      </div>
    </div>
  )
}
