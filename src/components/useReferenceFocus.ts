import { useEffect, useRef } from 'react'

/** In a stacked layout, an explicit reference link should open the article, below its index. */
export function useReferenceFocus(id: string | undefined, stackedWidth: number) {
  const target = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!id || !window.matchMedia(`(max-width: ${stackedWidth}px)`).matches) return
    // The shell restores page position first; defer article focus until that layout is committed.
    const frame = window.requestAnimationFrame(() => {
      target.current?.scrollIntoView({ block: 'start' })
      target.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [id, stackedWidth])
  return target
}
