import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bell, CalendarDays } from 'lucide-react'
import { useStudy } from '../../application/StudyContext'
import { navigate, useAction, useNow } from '../../application/hooks'
import {
  claimVocabularyNotification,
  dismissVocabularyReminder,
  saveVocabularyReminder,
} from '../../application/vocabularyReminderRepository'
import { localDayKey } from '../../domain/learning'
import { schedulableCard } from '../../domain/scheduler'
import { vocabularyById } from '../../content/vocabulary'
import { addDays } from '../../domain/roadmap'
import { InlineError } from '../../components/ui'

const notificationsSupported = () =>
  typeof window !== 'undefined' && window.isSecureContext && 'Notification' in window

/** No background timer promises: this coordinator runs only while an app document is alive. */
export function VocabularyReminderBanner() {
  const data = useStudy(),
    now = useNow(),
    action = useAction()
  const [notificationError, setNotificationError] = useState('')
  const running = useRef(false)
  const reminder = data.preferences.vocabularyReminder
  const due = data.cards.filter(
    (c) =>
      c.kind === 'vocabulary' &&
      vocabularyById.has(c.contentId) &&
      schedulableCard(c) &&
      c.dueAt <= now,
  )
  const active = data.sessions.some((s) => s.status === 'active')
  const today = localDayKey(now)
  const time = new Date(now).toTimeString().slice(0, 5)
  const visible =
    reminder?.enabled &&
    due.length > 0 &&
    !active &&
    reminder.dismissedOn !== today &&
    time >= reminder.time
  useEffect(() => {
    if (
      !visible ||
      running.current ||
      !notificationsSupported() ||
      Notification.permission !== 'granted'
    )
      return
    running.current = true
    void (async () => {
      try {
        const count = await claimVocabularyNotification()
        if (!count) return
        const options: NotificationOptions = {
          body: `${count} từ đã lưu đến hạn. Thử nhớ lại trước khi xem nghĩa.`,
          tag: 'study990-vocabulary-review',
        }
        const registration =
          'serviceWorker' in navigator
            ? await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
            : undefined
        if (
          registration?.active &&
          registration.scope === new URL(import.meta.env.BASE_URL, window.location.origin).href
        )
          await registration.showNotification('Một lượt ôn từ ngắn?', options)
        else {
          const notice = new Notification('Một lượt ôn từ ngắn?', options)
          notice.onclick = () => {
            window.focus()
            navigate('review', 'vocabulary')
            notice.close()
          }
        }
      } catch (error) {
        console.error(
          'study990: vocabulary reminder failed',
          error instanceof Error ? error.name : 'Unknown',
        )
        setNotificationError(
          'Chưa hiện được thông báo hệ thống. Bạn vẫn có thể mở hàng đợi từ vựng bên dưới.',
        )
      } finally {
        running.current = false
      }
    })()
  }, [visible, today, reminder?.lastNotifiedOn, now])
  if (!visible) return null
  return (
    <aside className="vocabulary-reminder-banner" aria-label="Nhắc ôn từ đã lưu">
      <Bell size={19} />
      <div>
        <strong>{due.length} từ đến lúc nhớ lại.</strong>
        <p>Một lượt ngắn là đủ; có thể để sau hôm nay.</p>
        {notificationError && (
          <p className="small" role="status">
            {notificationError}
          </p>
        )}
      </div>
      <button className="button secondary" onClick={() => navigate('review', 'vocabulary')}>
        Ôn từ
        <ArrowRight size={15} />
      </button>
      <button
        className="text-link"
        disabled={action.busy}
        onClick={() => void action.run(dismissVocabularyReminder)}
      >
        Để sau hôm nay
      </button>
      <InlineError message={action.error} />
    </aside>
  )
}

function downloadCalendar(time: string) {
  const day = localDayKey(Date.now()),
    date = new Date()
  const stamp = date.toTimeString().slice(0, 5) > time ? addDays(day, 1) : day
  const start = stamp.replaceAll('-', '') + 'T' + time.replace(':', '') + '00'
  const url = new URL(import.meta.env.BASE_URL + '#/review/vocabulary', window.location.origin).href
  const escape = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//STUDY990//Vocabulary review//VI',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:study990-vocabulary-${encodeURIComponent(new URL(import.meta.env.BASE_URL, window.location.origin).href)}@study990.local`,
    `DTSTAMP:${date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')}`,
    `DTSTART:${start}`,
    'DURATION:PT10M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:STUDY 990 - On tu da luu',
    `DESCRIPTION:${escape('Mở sổ từ và tự nhớ trước khi lật. Lịch này nhắc hằng ngày; số từ đến hạn được tính trong ứng dụng.\n' + url)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:On tu cung STUDY 990',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]
  // Fold UTF-8 lines at <= 75 octets for calendar clients (RFC 5545).
  const fold = (line: string) => {
    let result = '',
      part = '',
      bytes = 0
    for (const char of line) {
      const size = new TextEncoder().encode(char).length
      if (bytes + size > 74) {
        result += part + '\r\n '
        part = ''
        bytes = 1
      }
      part += char
      bytes += size
    }
    return result + part
  }
  const blobUrl = URL.createObjectURL(
    new Blob([lines.map(fold).join('\r\n')], { type: 'text/calendar;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = 'study990-on-tu.ics'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000)
}

export function VocabularyReminderSettings() {
  const { preferences } = useStudy(),
    action = useAction()
  const current = preferences.vocabularyReminder
  const [enabled, setEnabled] = useState(current?.enabled ?? false)
  const [time, setTime] = useState(current?.time ?? '20:00')
  const [status, setStatus] = useState('')
  const [permission, setPermission] = useState(
    notificationsSupported() ? Notification.permission : 'unsupported',
  )
  useEffect(() => {
    const update = () =>
      setPermission(notificationsSupported() ? Notification.permission : 'unsupported')
    window.addEventListener('focus', update)
    return () => window.removeEventListener('focus', update)
  }, [])
  return (
    <section className="panel vocabulary-reminder-settings" aria-label="Thiết lập nhắc ôn từ">
      <div>
        <span className="eyebrow">NHỚ TỪ, ĐÚNG LÚC</span>
        <h2>Một lời nhắc vừa đủ.</h2>
        <p>Nhắc khi có từ đến hạn sau giờ bạn chọn. Hàng đợi dùng lịch FSRS hiện có.</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void action.run(async () => {
            await saveVocabularyReminder(enabled, time)
            setStatus('Đã lưu giờ nhắc trên thiết bị này.')
          })
        }}
      >
        <label className="reminder-checkbox">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Bật nhắc ôn trong ứng dụng
        </label>
        <label className="form-label">
          Giờ nhắc theo thiết bị
          <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <button className="button primary" disabled={action.busy}>
          Lưu giờ nhắc
        </button>
      </form>
      <p className="small muted">
        Thông báo hệ thống chỉ kiểm tra khi app còn mở, tối đa một lần/ngày và tạm hoãn trong phiên
        luyện. Khi đóng app, bạn có thể dùng lời nhắc trong lịch cá nhân.
      </p>
      <div className="studio-actions">
        <button
          className="button secondary"
          disabled={
            action.busy ||
            permission === 'unsupported' ||
            permission === 'denied' ||
            permission === 'granted'
          }
          onClick={() =>
            void action.run(async () => {
              // Permission is requested only from this explicit user gesture.
              const result = await Notification.requestPermission()
              setPermission(result)
              setStatus(
                result === 'granted'
                  ? 'Đã cho phép thông báo. Bật và lưu giờ nhắc để sử dụng.'
                  : 'Chưa được cấp quyền; lời nhắc trong app vẫn hoạt động.',
              )
            })
          }
        >
          <Bell size={16} />
          {permission === 'granted'
            ? 'Đã cho phép thông báo'
            : permission === 'denied'
              ? 'Thông báo bị chặn trong trình duyệt'
              : permission === 'unsupported'
                ? 'Trình duyệt chưa hỗ trợ thông báo'
                : 'Cho phép thông báo hệ thống'}
        </button>
        <button
          className="button secondary"
          disabled={!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)}
          onClick={() => {
            downloadCalendar(time)
            setStatus(
              'Đã tạo tệp lịch. Nhập tệp vào ứng dụng lịch và bật cảnh báo ở đó; lịch nhắc hằng ngày, không đồng bộ số từ.',
            )
          }}
        >
          <CalendarDays size={16} />
          Tải lời nhắc cho lịch cá nhân
        </button>
      </div>
      <InlineError message={action.error} />
      {status && (
        <p className="small" role="status">
          {status}
        </p>
      )}
    </section>
  )
}
