import { useAction } from '../application/hooks'
import { exportStudyData } from '../application/studyRepository'
import { downloadJson } from './downloadJson'
import { InlineError } from './ui'

/** Still available when the global live-query fails. Does not attempt an automatic reset. */
export function RecoveryExport() {
  const action = useAction()
  return (
    <div>
      <button
        className="button secondary"
        disabled={action.busy}
        onClick={() =>
          void action.run(async () =>
            downloadJson(await exportStudyData(), 'study990-recovery-read'),
          )
        }
      >
        Thử xuất dữ liệu đang đọc được
      </button>
      <InlineError message={action.error} />
    </div>
  )
}
