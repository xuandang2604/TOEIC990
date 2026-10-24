import { db } from '../persistence/database'
import { validRecord } from '../persistence/records'
import type { LearningActivity, ReadingWorkspace } from '../domain/studio'
import { textVersion, transcriptSegments, readingText } from '../domain/studio'
import { passageById, questionById, stimulusById, practiceQuestions } from '../content/questions'
import { StudyOperationError } from './errors'
import { microLessons } from '../content/microLessons'

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
