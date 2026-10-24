import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  House,
  Leaf,
  Menu,
  MessageSquareText,
  Monitor,
  Maximize2,
  Moon,
  RotateCcw,
  Search,
  Settings2,
  Sun,
  Target,
  X,
} from 'lucide-react'
import { useStudy } from '../application/StudyContext'
import { useAction, useNow, type Route } from '../application/hooks'
import { savePreferences } from '../application/studyRepository'
import { useDictionary } from '../features/dictionary/Dictionary'
import { InlineError } from './ui'
import { ReferenceReturn } from './ReferenceReturn'

const navigation = [
  { id: 'today', title: 'Hôm nay', icon: House },
  { id: 'practice', title: 'Luyện tập', icon: Target },
  { id: 'vocabulary', title: 'Từ vựng', icon: BookOpen },
  { id: 'grammar', title: 'Ngữ pháp', icon: BookOpen },
  { id: 'review', title: 'Ôn tập', icon: RotateCcw },
  { id: 'progress', title: 'Tiến độ', icon: BarChart3 },
  { id: 'tutor', title: 'Học cùng Tutor', icon: MessageSquareText },
]
function Brand() {
  return (
    <a className="brand" href="#/today" aria-label="STUDY 990 — Hôm nay">
      <span className="brand-mark">
        <BookOpen size={26} strokeWidth={1.3} />
      </span>
      <span>
        STUDY <strong>990</strong>
        <small>LEARN WITH INTENTION</small>
      </span>
    </a>
  )
}

export function AppShell({
  route,
  children,
  onSettings,
}: {
  route: Route
  children: ReactNode
  onSettings: () => void
}) {
  const data = useStudy()
  const now = useNow()
  const { openSearch, available: dictionaryAvailable } = useDictionary()
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    setFocused(false)
  }, [route.page])
  const [mobileOpen, setMobileOpen] = useState(false)
  const main = useRef<HTMLElement>(null)
  const action = useAction()
  const due = data.cards.filter((c) => c.dueAt <= now).length
  const currentPage =
    route.page === 'session' ? 'practice' : route.page === 'plan' ? 'today' : route.page
  const pageTitle =
    route.page === 'session'
      ? 'Phiên học'
      : route.page === 'plan'
        ? 'Kế hoạch học tập'
        : (navigation.find((item) => item.id === route.page)?.title ?? 'Không gian học')
  const ThemeIcon =
    data.preferences.theme === 'system' ? Monitor : data.preferences.theme === 'dark' ? Moon : Sun
  useEffect(() => {
    document.title = `${pageTitle} · STUDY 990`
    if (route.page !== 'session') main.current?.focus({ preventScroll: true })
    if (route.page !== 'session' || !route.focusQuestionId)
      window.scrollTo({ top: 0, behavior: 'instant' })
  }, [route.page, route.id, route.focusQuestionId, pageTitle])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark =
        data.preferences.theme === 'dark' || (data.preferences.theme === 'system' && media.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [data.preferences.theme])
  function sidebarContent(close?: () => void) {
    return (
      <>
        <Brand />
        <div className="sidebar-caption">GÓC HỌC CỦA BẠN</div>
        <nav className="primary-nav" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.id}
                href={`#/${item.id}`}
                onClick={close}
                className={currentPage === item.id ? 'active' : ''}
                aria-current={currentPage === item.id ? 'page' : undefined}
              >
                <Icon size={19} strokeWidth={1.65} />
                <span>{item.title}</span>
                {item.id === 'review' && due > 0 && <span className="nav-badge">{due}</span>}
              </a>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-philosophy">
            <Leaf size={23} strokeWidth={1.1} />
            <p>
              Học để hiểu.
              <br />
              Nhớ để dùng.
            </p>
            <span>Mỗi bước nhỏ đều có giá trị.</span>
          </div>
          <button
            className="sidebar-settings"
            onClick={() => {
              close?.()
              onSettings()
            }}
          >
            <Settings2 size={18} />
            Thiết lập học tập
          </button>
          <div className="local-label">
            <span className="sage-dot" />
            Dữ liệu trên thiết bị
          </div>
        </div>
      </>
    )
  }
  return (
    <div className={`app-shell ${focused && route.page === 'session' ? 'is-focused' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          main.current?.focus()
        }}
      >
        Đến nội dung chính
      </a>
      <aside className="sidebar">{sidebarContent()}</aside>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-breadcrumb">
            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger className="icon-button mobile-menu" aria-label="Mở điều hướng">
                <Menu size={22} />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="mobile-sidebar">
                  <Dialog.Title className="sr-only">Điều hướng STUDY 990</Dialog.Title>
                  <Dialog.Description className="sr-only">Chọn khu vực học tập.</Dialog.Description>
                  <Dialog.Close
                    className="icon-button mobile-sidebar-close"
                    aria-label="Đóng điều hướng"
                  >
                    <X size={19} />
                  </Dialog.Close>
                  {sidebarContent(() => setMobileOpen(false))}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <span>KHÔNG GIAN HỌC</span>
            <ChevronRight size={13} />
            <strong>{pageTitle}</strong>
          </div>
          <div className="topbar-actions">
            {route.page === 'session' && (
              <button
                className="focus-toggle button secondary"
                aria-pressed={focused}
                onClick={() => setFocused((v) => !v)}
              >
                <Maximize2 size={15} />
                <span>{focused ? 'Hiện điều hướng' : 'Tập trung'}</span>
              </button>
            )}
            <button
              className="global-search"
              aria-label="Tìm từ, ngữ pháp và tài liệu"
              disabled={!dictionaryAvailable}
              title={
                dictionaryAvailable
                  ? 'Tìm từ, ngữ pháp và tài liệu'
                  : 'Tra từ tạm khóa trong phiên thi đang mở'
              }
              onClick={() => openSearch()}
            >
              <Search size={17} />
              <span>Tìm kiếm nhanh</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="topbar-divider" />
            <button
              className="icon-button"
              disabled={action.busy}
              aria-label={`Đổi giao diện, hiện tại: ${data.preferences.theme === 'system' ? 'theo thiết bị' : data.preferences.theme === 'dark' ? 'tối' : 'sáng'}`}
              title="Đổi giao diện: theo thiết bị → sáng → tối"
              onClick={() =>
                void action.run(() =>
                  savePreferences({
                    ...data.preferences,
                    theme:
                      data.preferences.theme === 'system'
                        ? 'light'
                        : data.preferences.theme === 'light'
                          ? 'dark'
                          : 'system',
                  }),
                )
              }
            >
              <ThemeIcon size={19} />
            </button>
            <button
              className="user-initial"
              onClick={onSettings}
              aria-label="Mở mục tiêu và thiết lập học tập"
            >
              S
            </button>
          </div>
        </header>
        <main
          className="main-content"
          data-page={route.page}
          id="main-content"
          ref={main}
          tabIndex={-1}
        >
          <InlineError message={action.error} />
          <ReferenceReturn route={route} />
          <div className="page-entry" key={`${route.page}:${route.id ?? ''}`}>
            {children}
          </div>
        </main>
        <footer className="app-footer">
          <span>
            STUDY 990<span className="footer-dot">·</span>Học có chủ đích.
          </span>
          <span>Không liên kết hay được chứng nhận bởi ETS.</span>
        </footer>
      </div>
    </div>
  )
}
