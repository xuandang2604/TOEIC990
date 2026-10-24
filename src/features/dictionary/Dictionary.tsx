import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { BookOpen } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigateReference, useRoute, type ReferenceOrigin } from '../../application/hooks'
import { useLearningSelection, type TextSelection } from './useLearningSelection'
const QuickSearch = lazy(() => import('./QuickSearch').then((m) => ({ default: m.QuickSearch })))
const ContextLookup = lazy(() =>
  import('./ContextLookup').then((m) => ({ default: m.ContextLookup })),
)

export { SaveWordButton, WordDetails } from './WordDetails'
interface DictionaryActions {
  available: boolean
  openSearch: (query?: string) => void
}
const DictionaryContext = createContext<DictionaryActions | null>(null)
export function useDictionary() {
  const context = useContext(DictionaryContext)
  if (!context) throw new Error('DictionaryProvider is required')
  return context
}

/** Owns overlay intent only. Search, lexical presentation and selection detection stay independent. */
export function DictionaryProvider({ children }: { children: ReactNode }) {
  const { sessions } = useStudy()
  const route = useRoute()
  const available = !sessions.some((s) => s.status === 'active' && s.mode === 'exam')
  const [search, setSearch] = useState<{ query: string; origin?: ReferenceOrigin } | null>(null)
  const [lookup, setLookup] = useState<TextSelection | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const openSearch = useCallback(
    (query = '') => {
      if (!available) return
      const focus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      returnFocus.current = lookup?.focus ?? focus
      const session = route.page === 'session' ? sessions.find((s) => s.id === route.id) : undefined
      const questionId =
        focus?.closest('[data-question-id]')?.getAttribute('data-question-id') ??
        session?.questionIds[session.cursor]
      const origin =
        lookup?.origin ??
        route.returnTo ??
        (session && questionId ? { sessionId: session.id, questionId } : undefined)
      setLookup(null)
      window.getSelection()?.removeAllRanges()
      setSearch({ query, origin })
    },
    [available, sessions, route, lookup],
  )
  const openLookup = useCallback(
    (selection: TextSelection) => {
      setLookup({ ...selection, origin: selection.origin ?? route.returnTo })
      window.getSelection()?.removeAllRanges()
    },
    [route.returnTo],
  )
  const candidate = useLearningSelection(available && !search && !lookup, openLookup)
  useEffect(() => {
    setLookup(null)
    setSearch(null)
  }, [route])
  useEffect(() => {
    if (!available) {
      setSearch(null)
      setLookup(null)
    }
  }, [available])
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        if (!search && !lookup && document.querySelector('[role="dialog"]')) return
        event.preventDefault()
        if (event.repeat) return
        if (search) setSearch(null)
        else openSearch()
      }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [openSearch, search, lookup])
  return (
    <DictionaryContext.Provider value={{ available, openSearch }}>
      {children}
      {candidate && (
        <button
          type="button"
          className="selection-lookup-trigger"
          style={{
            left: Math.max(8, Math.min(candidate.rect.left, window.innerWidth - 132)),
            top: Math.max(8, Math.min(candidate.rect.bottom + 8, window.innerHeight - 52)),
          }}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => openLookup(candidate)}
          aria-label={`Tra nghĩa ${candidate.text}`}
        >
          <BookOpen size={16} />
          Tra<kbd>Alt ↵</kbd>
        </button>
      )}
      <Suspense
        fallback={
          <p className="lookup-loading" role="status">
            Đang mở từ điển…
          </p>
        }
      >
        {search && available && (
          <QuickSearch
            initialQuery={search.query}
            returnFocus={returnFocus.current}
            onClose={() => setSearch(null)}
            onSelect={(hit) => {
              navigateReference(hit.kind, hit.id, search.origin)
              setSearch(null)
            }}
          />
        )}
        {lookup && available && (
          <ContextLookup
            selection={lookup}
            onClose={() => setLookup(null)}
            onDetail={(id) => {
              navigateReference('vocabulary', id, lookup.origin)
              setLookup(null)
            }}
            onSearch={() => openSearch(lookup.text)}
          />
        )}
      </Suspense>
    </DictionaryContext.Provider>
  )
}
