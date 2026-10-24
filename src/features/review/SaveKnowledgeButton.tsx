import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { useAction } from '../../application/hooks'
import { saveCard } from '../../application/studyRepository'
import { InlineError } from '../../components/ui'

export function SaveKnowledgeButton({ lessonId }: { lessonId: string }) {
  const { cards } = useStudy(),
    action = useAction()
  const saved = cards.some((c) => c.id === `knowledge:${lessonId}`)
  return (
    <div>
      <button
        type="button"
        className={`button ${saved ? 'saved' : 'secondary'}`}
        disabled={saved || action.busy}
        onClick={() => void action.run(() => saveCard('knowledge', lessonId))}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {saved ? 'Đã lưu thẻ kiến thức' : 'Lưu để tự nhớ lại'}
      </button>
      <InlineError message={action.error} />
    </div>
  )
}
