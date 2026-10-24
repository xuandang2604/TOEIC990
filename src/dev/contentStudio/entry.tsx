import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { studioApi, type StudioCatalog } from './client'
import { Dashboard } from './Dashboard'
import { PackageEditor } from './PackageEditor'
import { FeedbackReview } from './FeedbackReview'
import '../../fonts.css'
import '../../styles.css'
import './studio.css'
function Studio() {
  const [catalog, setCatalog] = useState<StudioCatalog>(),
    [error, setError] = useState(''),
    [tab, setTab] = useState('audit')
  useEffect(() => {
    const controller = new AbortController()
    void studioApi<StudioCatalog>('catalog', undefined, controller.signal)
      .then(setCatalog)
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Studio load failed.')
      })
    return () => controller.abort()
  }, [])
  return (
    <main className="content-studio">
      <header>
        <p className="eyebrow">LOCAL DEVELOPMENT ONLY</p>
        <h1>Question Bank Studio</h1>
        <p>STUDY 990 · original content, explicit review, safe source activation.</p>
        <a className="text-link" href="/">
          Return to learner application
        </a>
      </header>
      <nav aria-label="Content Studio sections">
        {[
          ['audit', 'Quality dashboard'],
          ['author', 'Authoring'],
          ['feedback', 'Learner reports'],
        ].map(([id, label]) => (
          <button
            key={id}
            className="button secondary"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {!catalog && !error && <p role="status">Reading source catalog and checking media…</p>}
      {catalog && (
        <>
          <div hidden={tab !== 'audit'}>
            <Dashboard catalog={catalog} />
          </div>
          <div hidden={tab !== 'author'}>
            <PackageEditor catalog={catalog} />
          </div>
          <div hidden={tab !== 'feedback'}>
            <FeedbackReview />
          </div>
        </>
      )}
    </main>
  )
}
createRoot(document.getElementById('root')!).render(<Studio />)
