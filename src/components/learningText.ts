import type { MouseEvent } from 'react'

/** Dragging/selecting learning text inside a choice must not also activate its radio label. */
export function protectLearningSelection(event: MouseEvent<HTMLLabelElement>) {
  if (event.target instanceof HTMLInputElement) return
  const selection = window.getSelection()
  if (
    selection &&
    !selection.isCollapsed &&
    selection.rangeCount &&
    selection.getRangeAt(0).intersectsNode(event.currentTarget)
  )
    event.preventDefault()
}
