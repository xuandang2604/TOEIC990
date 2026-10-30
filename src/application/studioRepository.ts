import { db } from '../persistence/database'
import { validRecord } from '../persistence/records'
import type { LearningActivity, ReadingWorkspace } from '../domain/studio'
import { textVersion, transcriptSegments, readingText } from '../domain/studio'
import { passageById, questionById, stimulusById, practiceQuestions } from '../content/questions'
import { StudyOperationError } from './errors'
import { microLessons } from '../content/microLessons'
import { officialSources } from '../content/officialSources'
import {
  sourceItems,
  sourceChoices,
  validPracticeSource,
  validSourcePractice,
  parseSourceKey,
  type PracticeSource,
  type SourcePracticeActivity,
} from '../domain/sourcePractice'
import type { OptionId } from '../content/schema'

async function requireStudyAccess() {
  if (
    await db.sessions
      .where('status')
      .equals('active')
      .filter((s) => s.mode === 'exam')
      .first()
  )
    throw new StudyOperationError('Hoàn thành lượt thi trước khi mở công cụ học có gợi ý.')
}
export async function saveReadingWorkspace(row: ReadingWorkspace, expectedRevision: number) {
  const passage = passageById.get(row.id)
  const text = passage ? readingText(passage.text) : ''
  if (
    !passage ||
    row.contentVersion !== textVersion(text) ||
    !validRecord('readingWorkspaces', row) ||
    row.position > text.length ||
    row.marks.some((m) => text.slice(m.start, m.end) !== m.quote)
  )
    throw new StudyOperationError('Ghi chú không khớp văn bản hiện tại. Nội dung cũ vẫn được giữ.')
  return db.transaction('rw', [db.readingWorkspaces, db.sessions], async () => {
    await requireStudyAccess()
    const current = await db.readingWorkspaces.get(row.id)
    if ((current?.revision ?? 0) !== expectedRevision)
      throw new StudyOperationError(
        'Văn bản vừa được cập nhật ở tab khác. Mở lại trước khi lưu ghi chú.',
      )
    await db.readingWorkspaces.put({
      ...row,
      revision: expectedRevision + 1,
      updatedAt: Date.now(),
    })
  })
}
/** Follow-ups have their own journal; they never mutate attempts, skill evidence or FSRS ratings. */
export async function saveLearningActivity(row: LearningActivity) {
  if (row.kind === 'source-practice')
    throw new StudyOperationError('Phiếu đối chiếu cần dùng luồng lưu và khóa đáp án riêng.')
  if (!validRecord('learningActivities', row))
    throw new StudyOperationError('Lượt học bổ sung không hợp lệ.')
  return db.transaction('rw', [db.learningActivities, db.attempts, db.sessions], async () => {
    await requireStudyAccess()
    if (row.kind === 'dictation') {
      const stimulus = stimulusById.get(row.contentId)
      if (
        !stimulus ||
        !('audio' in stimulus) ||
        ![
          stimulus.audio.transcript,
          ...(stimulus.audio.kind === 'synthetic'
            ? transcriptSegments(stimulus.audio.transcript)
            : []),
        ].includes(row.reference)
      )
        throw new StudyOperationError('Bản chép không khớp tư liệu nghe hiện tại.')
    }
    if (row.kind === 'correction') {
      const original = await db.attempts.get(row.contentId)
      const question =
        original?.questionSnapshot?.content ?? questionById.get(original?.questionId ?? '')
      if (
        !original ||
        original.correct ||
        !question ||
        !question.options.some((o) => o.id === row.selected) ||
        row.correct !== (question.answer === row.selected)
      )
        throw new StudyOperationError('Không khớp lượt sai gốc.')
      if (row.transferId) {
        const transfer = questionById.get(row.transferId)
        if (
          !transfer ||
          !practiceQuestions.some((q) => q.id === transfer.id) ||
          transfer.id === question.id ||
          !transfer.skills.some((s) => question.skills.includes(s)) ||
          !transfer.options.some((o) => o.id === row.transferSelected) ||
          row.transferCorrect !== (transfer.answer === row.transferSelected)
        )
          throw new StudyOperationError('Lượt chuyển giao không hợp lệ.')
      }
    }
    const existing = await db.learningActivities.get(row.id)
    if (existing && (existing.contentId !== row.contentId || existing.kind !== row.kind))
      throw new StudyOperationError('ID lượt học đã thuộc nội dung khác.')
    if (existing && row.kind !== 'micro-lesson') {
      if (JSON.stringify(existing) !== JSON.stringify(row))
        throw new StudyOperationError('Lượt học đã lưu. Bắt đầu lượt mới để thử lại.')
      return
    }
    if (row.kind === 'micro-lesson') {
      const lesson = microLessons.find((l) => l.id === row.contentId)
      const practice = lesson?.practice
      if (
        !lesson ||
        !practice ||
        row.id !== `micro:${lesson.id}` ||
        (row.prediction !== null &&
          !lesson.prediction.options.some((o) => o.id === row.prediction)) ||
        (row.practiceSelected !== null &&
          !practice.options.some((o) => o.id === row.practiceSelected)) ||
        (row.transferSelected !== null &&
          !lesson.transfer.options.some((o) => o.id === row.transferSelected))
      )
        throw new StudyOperationError('Bài học ngắn không khớp nội dung.')
      if ((existing?.kind === 'micro-lesson' ? existing.revision : 0) !== row.revision)
        throw new StudyOperationError('Bài học đã thay đổi ở tab khác. Mở lại để tiếp tục.')
      const next: LearningActivity = { ...row, revision: row.revision + 1 }
      await db.learningActivities.put(next)
      return
    }
    await db.learningActivities.put(row)
  })
}

/** Same journal and backup boundary as other follow-ups; original assessment history is untouched. */
export async function startSourcePractice(
  input: PracticeSource,
  conditions: Pick<SourcePracticeActivity, 'assistance' | 'seenBefore'>,
) {
  const source =
    input.kind === 'official-sample'
      ? officialSources.find(
          (source) => source.id === input.id && source.revision === input.revision,
        )
      : input
  if (
    !validPracticeSource(source) ||
    (source.kind === 'personal' && !source.id.startsWith('personal:'))
  )
    throw new StudyOperationError('Nguồn đề không hợp lệ. Chọn lại nguồn hoặc tên sách và mã đề.')
  return db.transaction('rw', [db.learningActivities, db.sessions], async () => {
    await requireStudyAccess()
    const history = (
      await db.learningActivities.where('kind').equals('source-practice').toArray()
    ).filter((row): row is SourcePracticeActivity => validSourcePractice(row))
    const active = history.find((row) => row.status === 'answering' || row.status === 'checking')
    if (active) return active
    const items = sourceItems(source)
    const now = Date.now()
    const row: SourcePracticeActivity = {
      id: crypto.randomUUID(),
      contentId: source.id,
      kind: 'source-practice',
      occurredAt: now,
      updatedAt: now,
      revision: 1,
      source: {
        id: source.id,
        revision: source.revision,
        title: source.title,
        kind: source.kind,
        url: source.url,
        groups: structuredClone(source.groups),
      },
      assistance: conditions.assistance,
      seenBefore:
        conditions.seenBefore ||
        history.some(
          (old) =>
            old.contentId === source.id &&
            old.source.revision === source.revision &&
            old.items.some((item) => items.some((next) => next.number === item.number)),
        ),
      status: 'answering',
      items,
    }
    if (!validSourcePractice(row)) throw new StudyOperationError('Điều kiện làm bài không hợp lệ.')
    await db.learningActivities.add(row)
    return row
  })
}
export type SourcePracticeChange =
  | { kind: 'select' | 'key'; number: number; option: OptionId | null }
  | { kind: 'keys'; text: string }
  | { kind: 'lock' | 'complete' | 'abandon' }
export async function changeSourcePractice(
  id: string,
  revision: number,
  change: SourcePracticeChange,
) {
  return db.transaction('rw', [db.learningActivities, db.sessions], async () => {
    await requireStudyAccess()
    const current = await db.learningActivities.get(id)
    if (!validSourcePractice(current) || current.revision !== revision)
      throw new StudyOperationError(
        'Phiếu vừa thay đổi ở tab khác. Đối chiếu phiên bản đang hiển thị rồi thử lại.',
      )
    if (current.status === 'completed' || current.status === 'abandoned')
      throw new StudyOperationError(
        'Lượt đã kết thúc được giữ nguyên. Tạo lượt mới nếu muốn làm lại.',
      )
    const row = structuredClone(current)
    row.revision++
    row.updatedAt = Math.max(Date.now(), current.updatedAt)
    if (change.kind === 'select' || change.kind === 'key') {
      if (row.status !== (change.kind === 'select' ? 'answering' : 'checking'))
        throw new StudyOperationError(
          'Đáp án làm bài đã khóa; chỉ đối chiếu khóa đáp án sau khi nộp.',
        )
      const item = row.items.find((item) => item.number === change.number)
      if (!item || (change.option !== null && !sourceChoices(item.part).includes(change.option)))
        throw new StudyOperationError('Lựa chọn không thuộc câu này. Part 2 chỉ có A/B/C.')
      if (change.kind === 'select') item.selected = change.option
      else item.key = change.option
    } else if (change.kind === 'keys') {
      if (row.status !== 'checking')
        throw new StudyOperationError('Chỉ nhập khóa sau khi đã nộp và khóa lựa chọn.')
      const parsed = parseSourceKey(change.text, row.items)
      if ('error' in parsed) throw new StudyOperationError(parsed.error)
      row.items.forEach((item, i) => {
        item.key = parsed.keys[i]
      })
    } else if (change.kind === 'lock') {
      if (row.status !== 'answering') throw new StudyOperationError('Phiếu đã khóa lựa chọn.')
      row.status = 'checking'
      row.lockedAt = row.updatedAt
    } else if (change.kind === 'complete') {
      if (row.status !== 'checking' || row.items.some((item) => item.key === null))
        throw new StudyOperationError('Nhập đủ khóa đáp án từ tài liệu gốc trước khi tính kết quả.')
      row.status = 'completed'
      row.completedAt = row.updatedAt
    } else row.status = 'abandoned'
    if (!validSourcePractice(row))
      throw new StudyOperationError('Phiếu chưa hợp lệ; bản đã lưu được giữ nguyên.')
    await db.learningActivities.put(row)
    return row
  })
}
