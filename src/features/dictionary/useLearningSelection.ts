import { useEffect, useState } from 'react'
import type { ReferenceOrigin } from '../../application/hooks'

export interface TextSelection {
  text: string
  rect: DOMRect
  context?: string
  origin?: ReferenceOrigin
  focus: HTMLElement | null
}
function learningElement(node: Node | null): Element | null {
  const element = node instanceof Element ? node : node?.parentElement
  return element?.closest('[data-learning]') ?? null
}
export function readLearningSelection(): TextSelection | null {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return null
  const text = selection
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[“"'(\[]+|[.,;:!?…”"')\]]+$/g, '')
  if (
    text.length > 80 ||
    !/^[A-Za-z]+(?:[-'’][A-Za-z]+)*(?:\s+[A-Za-z]+(?:[-'’][A-Za-z]+)*){0,7}$/.test(text)
  )
    return null
  const range = selection.getRangeAt(0)
  const start = learningElement(range.startContainer),
    end = learningElement(range.endContainer)
  if (
    !start ||
    start !== end ||
    start.closest(
      '[data-dictionary], [data-lookup-disabled="true"], input, textarea, [contenteditable="true"]',
    )
  )
    return null
  const rect = range.getBoundingClientRect()
  if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > window.innerHeight) return null
  const sessionId = start.closest('[data-session-id]')?.getAttribute('data-session-id')
  const questionId = start.closest('[data-question-id]')?.getAttribute('data-question-id')
  const paragraph = (
    range.startContainer instanceof Element
      ? range.startContainer
      : range.startContainer.parentElement
  )?.closest('p, blockquote, h2, h3')
  const contextElement = paragraph ?? start
  let context = contextElement.closest('[lang]')?.getAttribute('lang')?.startsWith('en')
    ? contextElement.textContent?.trim()
    : undefined
  if (context && context.length > 320) {
    const before = range.cloneRange()
    before.selectNodeContents(contextElement)
    before.setEnd(range.startContainer, range.startOffset)
    const offset = before.toString().length
    const fullText = contextElement.textContent ?? ''
    const left = Math.max(
      fullText.lastIndexOf('. ', offset),
      fullText.lastIndexOf('\n', offset),
      fullText.lastIndexOf('? ', offset),
      fullText.lastIndexOf('! ', offset),
    )
    const tail = fullText.slice(offset).search(/[.!?](?:\s|$)|\n/)
    context = fullText
      .slice(left < 0 ? 0 : left + 1, tail < 0 ? fullText.length : offset + tail + 1)
      .trim()
  }
  return {
    text,
    rect,
    context:
      context && context.length <= 1000 && context.length > text.length ? context : undefined,
    origin: sessionId && questionId ? { sessionId, questionId } : undefined,
    focus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
  }
}

export function useLearningSelection(enabled: boolean, onOpen: (selection: TextSelection) => void) {
  const [candidate, setCandidate] = useState<TextSelection | null>(null)
  useEffect(() => {
    if (!enabled) {
      setCandidate(null)
      return
    }
    let timer: number | undefined
    const update = () => setCandidate(readLearningSelection())
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(update, 180)
    }
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.altKey &&
        event.key === 'Enter' &&
        !event.isComposing &&
        !event.repeat &&
        !document.activeElement?.closest('input, textarea, [contenteditable="true"]')
      ) {
        const selected = readLearningSelection()
        if (selected) {
          event.preventDefault()
          onOpen(selected)
        }
      } else if (event.key === 'Escape') setCandidate(null)
    }
    const dismiss = () => {
      window.clearTimeout(timer)
      setCandidate(null)
    }
    document.addEventListener('selectionchange', schedule)
    document.addEventListener('pointerup', schedule)
    document.addEventListener('keydown', shortcut)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('selectionchange', schedule)
      document.removeEventListener('pointerup', schedule)
      document.removeEventListener('keydown', shortcut)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [enabled, onOpen])
  return enabled ? candidate : null
}
