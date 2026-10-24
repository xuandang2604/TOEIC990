import { Check } from 'lucide-react'
import { useStudy } from '../application/StudyContext'
import { learningMilestones } from '../domain/milestones'

export function LearningMilestones() {
  const data = useStudy()
  const milestones = learningMilestones(data.attempts, data.reviewEvents, data.sessions)
  const achieved = milestones.filter((m) => m.achieved)
  if (!achieved.length) return null
  return (
    <section className="milestone-strip" aria-label="Những dấu mốc đã đạt">
      <p className="eyebrow">NHỮNG BƯỚC ĐÃ ĐI</p>
      <ul>
        {achieved.map((m) => (
          <li key={m.id}>
            <Check size={17} />
            <div>
              <strong>{m.title}</strong>
              <span>{m.note}</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="small muted">Ghi nhận việc học thực tế, không phải chứng nhận đã thành thạo.</p>
    </section>
  )
}
