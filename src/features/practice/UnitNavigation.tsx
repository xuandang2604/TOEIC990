import type { ReactNode } from 'react'

/** Keep long exams readable while retaining the same native navigation buttons and mode gates. */
export function UnitNavigation({
  count,
  current,
  children,
}: {
  count: number
  current: number
  children: ReactNode
}) {
  if (count <= 18) return children
  return (
    <details className="navigation-disclosure">
      <summary>
        Chọn nhóm câu · {current + 1}/{count}
      </summary>
      {children}
    </details>
  )
}
