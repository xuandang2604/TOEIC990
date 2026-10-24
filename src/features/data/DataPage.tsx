import { useEffect, useState, useSyncExternalStore } from 'react'
import { Archive, Download, FileCheck2, ShieldCheck, Upload } from 'lucide-react'
import { db } from '../../persistence/database'
import {
  BACKUP_LIMIT,
  commitImport,
  DataError,
  exportBackup,
  inspectStorage,
  parseBackup,
  previewImport,
  repairStorage,
  resetData,
  type ImportCandidate,
  type ImportMode,
  type ImportPreview,
} from '../../persistence/backup'
import {
  hasUnsavedTutorWork,
  subscribeTutorDraftMemory,
} from '../../application/tutorDraftRecovery'
import { useAction } from '../../application/hooks'
import { useStudy } from '../../application/StudyContext'
import { downloadJson as download } from '../../components/downloadJson'
import { InlineError, PageHeading } from '../../components/ui'
import { MemoryDraftRecovery } from '../../components/MemoryDraftRecovery'

export function DataPage() {
  const data = useStudy()
  const action = useAction()
  const [inspection, setInspection] = useState<Awaited<ReturnType<typeof inspectStorage>>>()
  const [candidate, setCandidate] = useState<ImportCandidate>()
  const [preview, setPreview] = useState<ImportPreview>()
  const [mode, setMode] = useState<ImportMode>('merge')
  const [confirmation, setConfirmation] = useState('')
  const [reset, setReset] = useState(false)
  const [allowInvalid, setAllowInvalid] = useState(false)
  const [message, setMessage] = useState('')
  const [storage, setStorage] = useState('')
  const unsaved = useSyncExternalStore(subscribeTutorDraftMemory, hasUnsavedTutorWork, () => false)
  const active = data.sessions.some((s) => s.status === 'active')
  const refresh = async () => setInspection(await inspectStorage(db))
  async function afterChange(success: string) {
    setMessage(success)
    try {
      await refresh()
    } catch (failure) {
      console.error(
        'study990: post-commit inspection failed',
        failure instanceof Error ? failure.name : 'Unknown',
      )
      setInspection(undefined)
      setMessage(
        `${success} Chưa đọc lại được tình trạng kho. Thay đổi đã hoàn tất; dùng “Thử kiểm tra lại” khi truy cập lưu trữ ổn định.`,
      )
    }
  }
  useEffect(() => {
    void action.run(refresh)
  }, [])
  async function inspectFile(file: File | undefined) {
    if (!file) return
    setPreview(undefined)
    setCandidate(undefined)
    setConfirmation('')
    setAllowInvalid(false)
    setMessage('')
    await action.run(async () => {
      if (file.size > BACKUP_LIMIT) throw new DataError('Tệp vượt giới hạn 25 MB.')
      const parsed = await parseBackup(await file.text())
      setCandidate(parsed)
      setPreview(await previewImport(db, parsed, mode))
    })
  }
  const unsafe = active || unsaved
  return (
    <div className="data-page">
      <PageHeading
        eyebrow="SỔ HỌC CÁ NHÂN"
        title="Giữ lại từng bước học."
        description="Dữ liệu nằm trong trình duyệt và địa chỉ trang này. Một tệp sao lưu riêng giúp bạn chủ động khi đổi thiết bị hoặc dọn bộ nhớ."
      />
      <InlineError message={action.error} />
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {unsaved && (
        <p className="notice" role="alert">
          Tutor còn nội dung chưa lưu. Hãy trở lại Tutor, lưu nháp hoặc sao chép nội dung trước khi
          thay đổi sổ học.
        </p>
      )}
      <MemoryDraftRecovery />
      <section className="data-section">
        <div className="section-title">
          <h2>
            <Download size={20} /> Bản sao của bạn
          </h2>
        </div>
        <p>
          Xuất toàn bộ lịch sử, thẻ ôn, lịch FSRS, thiết lập và nháp Tutor đã lưu. Tệp có thể chứa
          lời giải thích riêng tư của bạn; chỉ chia sẻ khi bạn muốn.
        </p>
        <button
          className="button primary"
          disabled={action.busy}
          onClick={() =>
            void action.run(async () => {
              download(await exportBackup(db))
              setMessage(
                'Đã tạo tệp để tải xuống. Kiểm tra tệp trong thư mục tải xuống của trình duyệt.',
              )
            })
          }
        >
          <Download size={16} /> Xuất bản sao JSON
        </button>
        <p className="small muted">
          Bản sao không bao gồm nội dung học đóng gói, tệp âm thanh hoặc nháp chỉ còn trong bộ nhớ.
          Tệp xuất không tự đồng bộ lên đám mây.
        </p>
      </section>
      <section className="data-section">
        <h2>
          <Upload size={20} /> Nhập và đối chiếu
        </h2>
        <label className="form-label">
          Chọn bản sao STUDY 990 (tối đa 25 MB)
          <input
            type="file"
            accept="application/json,.json"
            disabled={action.busy}
            onChange={(e) => {
              void inspectFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </label>
        <label className="form-label">
          Cách khôi phục
          <select
            value={mode}
            disabled={action.busy}
            onChange={(e) => {
              const next = e.target.value as ImportMode
              setMode(next)
              setPreview(undefined)
              setConfirmation('')
              if (candidate)
                void action.run(async () => setPreview(await previewImport(db, candidate, next)))
            }}
          >
            <option value="merge">Gộp bản ghi mới, giữ bản hiện có</option>
            <option value="replace">Thay thế sổ học bằng bản sao</option>
          </select>
        </label>
        <p className="small muted">
          Gộp không ghép hai lịch ôn hoặc lịch sử cùng ID đã khác nhau. Xung đột được chặn để bạn
          chọn bản nguồn đúng. Trước mỗi thay đổi, ứng dụng giữ một điểm khôi phục gần nhất.
        </p>
        {preview && (
          <div className="import-preview">
            <h3>
              <FileCheck2 size={18} /> Xem trước tác động
            </h3>
            {candidate?.warnings.map((w) => (
              <p className="notice" key={w}>
                {w}
              </p>
            ))}
            <div className="table-scroll">
              <table>
                <caption className="sr-only">Số lượng bản ghi trước khi nhập</caption>
                <thead>
                  <tr>
                    <th scope="col">Bảng</th>
                    <th scope="col">Đang có</th>
                    <th scope="col">Trong tệp</th>
                    <th scope="col">ID mới</th>
                    <th scope="col">Khác nhau</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.counts
                    .filter((r) => r.current || r.incoming)
                    .map((r) => (
                      <tr key={r.table}>
                        <th scope="row">{r.table}</th>
                        <td>{r.current}</td>
                        <td>{r.incoming}</td>
                        <td>{r.added}</td>
                        <td>{r.conflicts}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {preview.blocked && (
              <p className="inline-error" role="alert">
                {preview.blocked}
              </p>
            )}
            {!!candidate?.invalid && (
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={allowInvalid}
                  onChange={(e) => setAllowInvalid(e.target.checked)}
                />{' '}
                Nhập phần hợp lệ và giữ bản gốc của các dòng lỗi trong kho cách ly
              </label>
            )}
            {mode === 'replace' && (
              <label className="form-label">
                Thay thế sẽ bỏ dữ liệu hiện tại khỏi sổ đang dùng. Nhập THAY THẾ để xác nhận
                <input
                  value={confirmation}
                  autoComplete="off"
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </label>
            )}
            {unsafe && (
              <p className="small muted">
                Kết thúc phiên đang học và lưu nháp trước khi nhập dữ liệu.
              </p>
            )}
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    setPreview(await previewImport(db, preview.candidate, mode))
                    setConfirmation('')
                  })
                }
              >
                Xem trước lại
              </button>
              <button
                className="button primary"
                disabled={
                  action.busy ||
                  unsafe ||
                  !!preview.blocked ||
                  (!!candidate?.invalid && !allowInvalid) ||
                  (mode === 'replace' && confirmation !== 'THAY THẾ')
                }
                onClick={() =>
                  void action.run(async () => {
                    if (hasUnsavedTutorWork()) throw new DataError('Còn nháp Tutor chưa lưu.')
                    await commitImport(db, preview, allowInvalid)
                    setPreview(undefined)
                    setCandidate(undefined)
                    setConfirmation('')
                    await afterChange(
                      'Đã khôi phục sổ học. Bản trước thay đổi nằm ở điểm khôi phục gần nhất.',
                    )
                  })
                }
              >
                Xác nhận nhập dữ liệu
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="data-section">
        <h2>
          <ShieldCheck size={20} /> Tình trạng sổ học
        </h2>
        {inspection ? (
          <>
            <p>
              {inspection.invalid.length} bản ghi cần đối chiếu · {inspection.quarantine.length} bản
              ghi đang cách ly. Các dòng lỗi chưa sửa vẫn được giữ trong IndexedDB và tệp xuất.
            </p>
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => void action.run(refresh)}
            >
              Kiểm tra lại
            </button>
            {inspection.invalid.length > 0 && (
              <>
                <ul>
                  {inspection.invalid.slice(0, 10).map((r) => (
                    <li key={`${r.table}:${r.key}`}>
                      {r.table} / {r.key}: {r.reasons.join(' ')}
                    </li>
                  ))}
                </ul>
                <button
                  className="button secondary"
                  disabled={action.busy || unsafe}
                  onClick={() =>
                    void action.run(async () => {
                      await repairStorage(db, inspection.fingerprint)
                      await afterChange(
                        'Đã chuyển bản ghi lỗi vào kho cách ly; nội dung gốc vẫn được giữ trong bản sao.',
                      )
                    })
                  }
                >
                  Giữ riêng các bản ghi lỗi
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p role="status">Chưa có kết quả kiểm tra. Có thể thử kiểm tra lại sau lỗi lưu trữ.</p>
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() => void action.run(refresh)}
            >
              Thử kiểm tra lại
            </button>
          </>
        )}
        <div className="storage-actions">
          <button
            className="button secondary"
            disabled={action.busy}
            onClick={() =>
              void action.run(async () => {
                if (!navigator.storage?.estimate) {
                  setStorage('Trình duyệt này không cung cấp thông tin dung lượng.')
                  return
                }
                const estimate = await navigator.storage.estimate()
                const persistent = navigator.storage.persisted
                  ? await navigator.storage.persisted()
                  : false
                setStorage(
                  `Đang dùng khoảng ${((estimate.usage ?? 0) / 1024 / 1024).toFixed(1)} MB / ${((estimate.quota ?? 0) / 1024 / 1024).toFixed(0)} MB. ${persistent ? 'Đã được cấp lưu trữ bền vững.' : 'Chưa có quyền lưu trữ bền vững.'}`,
                )
              })
            }
          >
            Xem dung lượng
          </button>
          <button
            className="button secondary"
            disabled={action.busy}
            onClick={() =>
              void action.run(async () =>
                setStorage(
                  navigator.storage?.persist && (await navigator.storage.persist())
                    ? 'Trình duyệt đã cấp lưu trữ bền vững. Vẫn nên giữ tệp sao lưu riêng.'
                    : 'Trình duyệt chưa cấp quyền hoặc không hỗ trợ. Sổ học hiện có vẫn được giữ; hãy xuất bản sao.',
                ),
              )
            }
          >
            Yêu cầu giữ dữ liệu lâu dài
          </button>
        </div>
        {storage && (
          <p className="small" role="status">
            {storage}
          </p>
        )}
      </section>
      <section className="data-section">
        <h2>
          <Archive size={20} /> Điểm khôi phục gần nhất
        </h2>
        <p>
          Chỉ giữ một điểm trước lần nhập, sửa hoặc đặt lại gần nhất. Lần thay đổi tiếp theo sẽ thay
          điểm này; đây không thay thế tệp sao lưu riêng.
        </p>
        {inspection?.recovery ? (
          <>
            <p className="small muted">
              Tạo lúc {new Date(inspection.recovery.createdAt).toLocaleString('vi-VN')}.
            </p>
            <button
              className="button secondary"
              disabled={action.busy}
              onClick={() =>
                void action.run(async () =>
                  download(await exportBackup(db, inspection.recovery), 'study990-recovery'),
                )
              }
            >
              Xuất điểm khôi phục
            </button>
            <p className="small muted">
              Chọn tệp này ở phần nhập phía trên để xem trước và khôi phục.
            </p>
          </>
        ) : (
          <p className="small muted">Chưa có thay đổi cần điểm khôi phục.</p>
        )}
      </section>
      <section className="data-section danger-section">
        <h2>Bắt đầu lại</h2>
        <p>
          Xóa lịch sử, lịch ôn, phiên học và thiết lập khỏi sổ đang dùng. Hãy xuất bản sao trước.
          Cần kết thúc phiên đang học.
        </p>
        {!reset ? (
          <button
            className="button secondary"
            disabled={action.busy || unsafe}
            onClick={() => {
              setReset(true)
              setConfirmation('')
              void action.run(refresh)
            }}
          >
            Đặt lại tiến độ…
          </button>
        ) : (
          <>
            <label className="form-label">
              Nhập ĐẶT LẠI để xác nhận
              <input
                value={confirmation}
                autoComplete="off"
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <button className="button secondary" onClick={() => setReset(false)}>
                Hủy
              </button>
              <button
                className="button secondary danger"
                disabled={action.busy || unsafe || confirmation !== 'ĐẶT LẠI' || !inspection}
                onClick={() =>
                  void action.run(async () => {
                    if (!inspection || hasUnsavedTutorWork())
                      throw new DataError('Cần kiểm tra lại dữ liệu hoặc lưu nháp.')
                    await resetData(db, inspection.fingerprint)
                    setReset(false)
                    setConfirmation('')
                    await afterChange(
                      'Đã đặt lại sổ học. Có thể xuất điểm khôi phục ngay phía trên.',
                    )
                  })
                }
              >
                Xác nhận đặt lại
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
