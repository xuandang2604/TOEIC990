import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowRight, Compass } from 'lucide-react'
import { StudyProvider, useStudy } from './application/StudyContext'
import { navigate, useAction, useRoute } from './application/hooks'
import { finishExam } from './application/examRepository'
import { examExpired } from './domain/assessment'
import { hasUnsavedTutorWork } from './application/tutorDraftRecovery'
import type { StudySession } from './domain/models'
import { OfflineStatus } from './components/OfflineStatus'
import { AppShell } from './components/AppShell'
import { SettingsDialog } from './components/SettingsDialog'
import { EmptyState, InlineError } from './components/ui'
import { DictionaryProvider } from './features/dictionary/Dictionary'
import { TodayPage } from './features/today/TodayPage'
const PracticePage = lazy(() =>
  import('./features/practice/PracticePage').then((m) => ({ default: m.PracticePage })),
)
const DailyPlanPage = lazy(() =>
  import('./features/today/DailyPlanPage').then((m) => ({ default: m.DailyPlanPage })),
)
const SessionPage = lazy(() =>
  import('./features/practice/SessionPage').then((m) => ({ default: m.SessionPage })),
)
const VocabularyPage = lazy(() =>
  import('./features/vocabulary/VocabularyPage').then((m) => ({ default: m.VocabularyPage })),
)
const GrammarPage = lazy(() =>
  import('./features/grammar/GrammarPage').then((m) => ({ default: m.GrammarPage })),
)
const QuestionReferencePage = lazy(() =>
  import('./features/grammar/QuestionReferencePage').then((m) => ({
    default: m.QuestionReferencePage,
  })),
)
const ReviewPage = lazy(() =>
  import('./features/review/ReviewPage').then((m) => ({ default: m.ReviewPage })),
)
const ProgressPage = lazy(() =>
  import('./features/progress/ProgressPage').then((m) => ({ default: m.ProgressPage })),
)
const TutorPage = lazy(() =>
  import('./features/tutor/TutorPage').then((m) => ({ default: m.TutorPage })),
)

const DataPage = lazy(() =>
  import('./features/data/DataPage').then((m) => ({ default: m.DataPage })),
)

function Workspace() {
  const route = useRoute()
  const data = useStudy()
  const activeExam = data.sessions.find(
    (session) => session.status === 'active' && session.mode === 'exam',
  )
  const [settings, setSettings] = useState(false)
  const page = (() => {
    if (activeExam && (route.page !== 'session' || route.id !== activeExam.id))
      return <ExamGate session={activeExam} />
    switch (route.page) {
      case 'today':
        return <TodayPage onSettings={() => setSettings(true)} />
      case 'practice':
        return <PracticePage />
      case 'plan':
        return <DailyPlanPage key={route.id} id={route.id} />
      case 'session':
        return <SessionPage id={route.id} />
      case 'vocabulary':
        return <VocabularyPage id={route.id} />
      case 'grammar':
        return <GrammarPage id={route.id} />
      case 'reference':
        return <QuestionReferencePage id={route.id} />
      case 'review':
        return <ReviewPage />
      case 'progress':
        return <ProgressPage />
      case 'data':
        return <DataPage />
      case 'tutor':
        return <TutorPage id={route.id} />
      default:
        return (
          <EmptyState
            icon={Compass}
            title="Chọn lại một lối học."
            action={
              <button className="button primary" onClick={() => navigate('today')}>
                Về hôm nay
                <ArrowRight size={16} />
              </button>
            }
          >
            Đường dẫn này chưa có trong không gian học.
          </EmptyState>
        )
    }
  })()
  return (
    <DictionaryProvider>
      <AppShell route={route} onSettings={() => setSettings(true)}>
        <OfflineStatus />
        {data.invalidRecordCount > 0 && (
          <p className="notice" role="alert">
            {data.invalidRecordCount} bản ghi chưa dùng được. Nội dung gốc được giữ lại.{' '}
            <button className="text-link" onClick={() => navigate('data')}>
              Kiểm tra sổ học
            </button>
          </p>
        )}
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              <div className="loading-line" />
              <p>Đang mở trang học…</p>
            </div>
          }
        >
          {page}
        </Suspense>
      </AppShell>
      {settings && <SettingsDialog open onOpenChange={setSettings} />}
    </DictionaryProvider>
  )
}
function ExamGate({ session }: { session: StudySession }) {
  const action = useAction()
  useEffect(() => {
    let checking = true
    const tick = () => {
      if (checking && examExpired(session, Date.now())) {
        checking = false
        void action.run(() => finishExam(session.id))
      }
    }
    tick()
    const interval = window.setInterval(tick, 1000)
    return () => {
      checking = false
      window.clearInterval(interval)
    }
  }, [session.id, session.deadlineAt])
  return (
    <>
      <EmptyState
        icon={Compass}
        title="Phiên tự đánh giá đang diễn ra."
        action={
          <button className="button primary" onClick={() => navigate('session', session.id)}>
            Trở lại bài thi
            <ArrowRight size={16} />
          </button>
        }
      >
        Đồng hồ vẫn chạy. Hoàn thành hoặc nộp bài trước khi mở từ điển, lời giải, Tutor và các bài
        học khác. Lựa chọn đã lưu được giữ nguyên.
      </EmptyState>
      <InlineError message={action.error} />
    </>
  )
}
export default function App() {
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (hasUnsavedTutorWork()) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [])
  return (
    <StudyProvider>
      <Workspace />
    </StudyProvider>
  )
}
