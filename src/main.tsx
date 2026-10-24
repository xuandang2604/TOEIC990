import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { MemoryDraftRecovery } from './components/MemoryDraftRecovery'
import './fonts.css'
import './styles.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('study990: UI failure', error.name, info.componentStack)
  }
  render() {
    return this.state.failed ? (
      <div className="boot-state" role="alert">
        <span className="eyebrow">STUDY 990</span>
        <h1>Không gian học cần được mở lại.</h1>
        <p>
          Đã xảy ra lỗi hiển thị. Những câu đã nộp thành công vẫn nằm trên thiết bị. Tải lại để tiếp
          tục.
        </p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Tải lại trang
        </button>
        <MemoryDraftRecovery />
      </div>
    ) : (
      this.props.children
    )
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
