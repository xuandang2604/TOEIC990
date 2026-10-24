import type { LucideIcon } from 'lucide-react'
import { AlertCircle, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede">{description}</p>
      </div>
      {action}
    </header>
  )
}
export function InlineError({ message }: { message: string | null }) {
  return message ? (
    <p className="inline-error" role="alert">
      <AlertCircle size={17} />
      <span>{message}</span>
    </p>
  ) : null
}
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={27} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  )
}
export function SectionTitle({
  title,
  note,
  action,
}: {
  title: string
  note?: string
  action?: ReactNode
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
      {action}
    </div>
  )
}
export function ProgressRing({
  value,
  max,
  size = 100,
  children,
}: {
  value: number
  max: number
  size?: number
  children: ReactNode
}) {
  const percent = Math.max(0, Math.min(1, value / Math.max(1, max)))
  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} trên ${max}`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r="43" />
        <circle
          style={{ strokeDasharray: `${percent * 270.18} 270.18` }}
          className="ring-value"
          cx="50"
          cy="50"
          r="43"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div>{children}</div>
    </div>
  )
}
export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={15} />
    </button>
  )
}
export function Tag({ children, tone = '' }: { children: ReactNode; tone?: string }) {
  return <span className={`tag ${tone}`}>{children}</span>
}
