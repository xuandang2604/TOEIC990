import { highlightedSegments } from '../../domain/referenceSearch'

export function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightedSegments(text, query).map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>,
      )}
    </>
  )
}
