import 'fake-indexeddb/auto'
import { after, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { db, StudyDatabase } from '../src/persistence/database'
import { validRecord } from '../src/persistence/records'
import {
  canonical,
  createBackup,
  parseBackup,
  previewImport,
  commitImport,
} from '../src/persistence/backup'
import {
  compareDictation,
  normalizeDictation,
  readingBlocks,
  readingText,
  textVersion,
  transcriptSegments,
  type LearningActivity,
  type ReadingWorkspace,
} from '../src/domain/studio'
import { saveLearningActivity, saveReadingWorkspace } from '../src/application/studioRepository'
import { saveCard, startSession, submitAnswer } from '../src/application/studyRepository'
import { questionById, passageById, stimuli } from '../src/content/questions'
import { grammarById } from '../src/content/grammar'
import { microLessons } from '../src/content/microLessons'
import { readingEvidence } from '../src/content/readingEvidence'
import { ChoiceChallenge } from '../src/features/grammar/ChoiceChallenge'

beforeEach(async () => {
  await db.delete()
  await db.open()
})
after(async () => {
  await db.delete()
})
const workspace = (): ReadingWorkspace => {
  const p = passageById.get('library-notice')!
  const quote = 'Readers may return books at the service desk or renew them online.'
  const start = p.text.indexOf(quote)
  return {
    id: p.id,
    contentVersion: textVersion(p.text),
    revision: 0,
    position: start,
    marks: [
      { id: 'mark-1', start, end: start + quote.length, quote, note: 'Phân biệt return và renew.' },
    ],
    updatedAt: 0,
  }
}
describe('premium learning contracts and isolated persistence', () => {
  it('normalizes transparently and identifies missing, extra and substituted words', () => {
    assert.deepEqual(normalizeDictation('DON’T  send, 21 invoices!'), [
      "don't",
      'send',
      '21',
      'invoices',
    ])
    assert.equal(
      compareDictation('Please send the invoice.', 'please SEND the invoice!').matched,
      4,
    )
    assert.equal(
      compareDictation('Please send the invoice.', 'please send invoice').words.filter(
        (w) => w.kind === 'missing',
      ).length,
      1,
    )
    assert.equal(
      compareDictation('Send the invoice.', 'Please send the invoice.').words.filter(
        (w) => w.kind === 'extra',
      ).length,
      1,
    )
    assert.equal(
      compareDictation('Send the invoice.', 'Send the receipt.').words.filter(
        (w) => w.kind === 'mismatch',
      ).length,
      1,
    )
    assert.notDeepEqual(normalizeDictation('21'), normalizeDictation('twenty one'))
    assert.notDeepEqual(normalizeDictation("don't"), normalizeDictation('do not'))
    assert.equal(readingText('Please {{1}} the form.\n\n{{2}}'), 'Please [1] the form.\n\n[2]')
    assert.deepEqual(transcriptSegments('Bring a laptop.\nPlease register!'), [
      'Bring a laptop.',
      'Please register!',
    ])
    for (const block of readingBlocks('A title\nA subtitle\n\nRead this paragraph.\n\nEnd.'))
      assert.equal(
        'A title\nA subtitle\n\nRead this paragraph.\n\nEnd.'.slice(block.start, block.end),
        block.quote,
      )
  })
  it('has exact evidence references and complete, unambiguous micro-lesson structures', () => {
    for (const [id, refs] of Object.entries(readingEvidence)) {
      assert.equal(questionById.get(id)?.part, 7)
      for (const ref of refs)
        assert.ok(passageById.get(ref.passageId)?.text.includes(ref.quote), id)
    }
    assert.equal(microLessons.length, 10)
    assert.equal(new Set(microLessons.map((l) => l.id)).size, 10)
    for (const lesson of microLessons) {
      assert.ok(grammarById.get(lesson.lessonId)?.practice[0])
      for (const exercise of [lesson.prediction, lesson.practice, lesson.transfer]) {
        assert.equal(exercise.options.filter((o) => o.id === exercise.answer).length, 1)
        assert.ok(exercise.options.every((o) => o.explanation.length > 12))
        assert.equal(new Set(exercise.options.map((o) => o.text)).size, exercise.options.length)
        const hidden = renderToStaticMarkup(
          <ChoiceChallenge exercise={exercise} answer={null} busy={false} onSubmit={() => {}} />,
        )
        assert.ok(!hidden.includes(exercise.explanation))
        const shown = renderToStaticMarkup(
          <ChoiceChallenge
            exercise={exercise}
            answer={exercise.answer}
            busy={false}
            onSubmit={() => {}}
          />,
        )
        assert.ok(shown.includes(exercise.explanation))
      }
    }
  })
  it('preserves passage notes and position on reopen and rejects stale or invalid offsets', async () => {
    const row = workspace()
    await saveReadingWorkspace(row, 0)
    db.close()
    await db.open()
    assert.deepEqual((await db.readingWorkspaces.get(row.id))?.marks, row.marks)
    assert.equal((await db.readingWorkspaces.get(row.id))?.position, row.position)
    await assert.rejects(saveReadingWorkspace({ ...row, position: 0 }, 0), /tab khác/)
    await assert.rejects(saveReadingWorkspace({ ...row, contentVersion: '1-ff' }, 1), /không khớp/)
    await assert.rejects(
      saveReadingWorkspace({ ...row, marks: [{ ...row.marks[0], quote: 'wrong' }] }, 1),
    )
    assert.equal(validRecord('readingWorkspaces', { ...row, position: 1_000_000 }), false)
    const part6 = [...passageById.values()].find((p) => p.text.includes('{{'))!
    const displayed = readingText(part6.text)
    await saveReadingWorkspace(
      {
        id: part6.id,
        contentVersion: textVersion(displayed),
        revision: 0,
        position: 0,
        marks: [
          {
            id: 'completion-mark',
            start: 0,
            end: 20,
            quote: displayed.slice(0, 20),
            note: 'Ghi chú phần đọc điền từ.',
          },
        ],
        updatedAt: 0,
      },
      0,
    )
    assert.equal((await db.readingWorkspaces.get(part6.id))?.marks[0].quote, displayed.slice(0, 20))
  })
  it('saves contextual vocabulary atomically without rescheduling an existing card', async () => {
    await saveCard('vocabulary', 'renew')
    const original = await db.cards.get('vocabulary:renew')
    const context = {
      sentence: 'Readers may renew books online.',
      source: '#/session/reading-fixture',
    }
    await saveCard('vocabulary', 'renew', context)
    await saveCard('vocabulary', 'renew', context)
    assert.deepEqual(await db.cards.get('vocabulary:renew'), original)
    assert.equal(await db.vocabularyContexts.count(), 1)
    assert.equal((await db.vocabularyContexts.toArray())[0].sentence, context.sentence)
    await assert.rejects(saveCard('vocabulary', 'renew', { sentence: '', source: 'test' }))
  })
  it('records retry and transfer separately while preserving the first result and FSRS', async () => {
    const q = questionById.get('p5-efficiently')!
    const session = await startSession('practice', [q.id])
    await submitAnswer(session.id, q.id, 'A', 3)
    const before = await createBackup(db)
    const activity: LearningActivity = {
      id: 'retry-1',
      kind: 'correction',
      contentId: `${session.id}:${q.id}`,
      occurredAt: Date.now(),
      selected: q.answer,
      correct: true,
      reason: 'Mình đã chọn tính từ thay cho trạng từ.',
    }
    await saveLearningActivity(activity)
    await saveLearningActivity(activity)
    await assert.rejects(saveLearningActivity({ ...activity, correct: false }))
    const transfer = questionById.get('p5-reliable')!
    await saveLearningActivity({
      ...activity,
      id: 'transfer-1',
      transferId: transfer.id,
      transferSelected: transfer.answer,
      transferCorrect: true,
    })
    const after = await createBackup(db)
    for (const table of ['attempts', 'reviewEvents', 'cards', 'skillEvidence'] as const)
      assert.equal(canonical(after.data[table]), canonical(before.data[table]))
    assert.equal(await db.learningActivities.count(), 2)
  })
  it('saves dictation comparisons and rejects inflated match counts', async () => {
    const stimulus = stimuli.find((s) => s.part === 3)!
    assert.ok('audio' in stimulus)
    const reference = transcriptSegments(stimulus.audio.transcript)[0]
    const result = compareDictation(reference, reference)
    const row: LearningActivity = {
      id: 'dictation-1',
      kind: 'dictation',
      contentId: stimulus.id,
      occurredAt: Date.now(),
      reference,
      input: reference,
      matched: result.matched,
      total: result.total,
    }
    await saveLearningActivity(row)
    await saveLearningActivity(row)
    await assert.rejects(saveLearningActivity({ ...row, id: 'invalid', matched: 99 }))
    assert.equal(await db.learningActivities.count(), 1)
    assert.equal(await db.attempts.count(), 0)
  })
  it('resumes micro-lessons and rejects a stale tab or premature completion', async () => {
    const lesson = microLessons[0]
    const row: LearningActivity = {
      id: `micro:${lesson.id}`,
      kind: 'micro-lesson',
      contentId: lesson.id,
      occurredAt: Date.now(),
      step: 1,
      prediction: null,
      practiceSelected: null,
      transferSelected: null,
      explanation: '',
      completed: false,
      revision: 0,
    }
    await saveLearningActivity(row)
    await assert.rejects(saveLearningActivity(row), /tab khác/)
    await assert.rejects(saveLearningActivity({ ...row, revision: 1, step: 5, completed: true }))
    await saveLearningActivity({
      ...row,
      revision: 1,
      step: 2,
      prediction: lesson.prediction.answer,
    })
    db.close()
    await db.open()
    const saved = await db.learningActivities.get(row.id)
    assert.equal(saved?.kind === 'micro-lesson' && saved.step, 2)
    assert.ok(saved?.kind === 'micro-lesson')
    await saveLearningActivity({
      ...saved,
      step: 3,
      explanation: 'Xác định cụm danh từ hay mệnh đề trước khi chọn.',
    })
    await saveLearningActivity({
      ...saved,
      revision: 3,
      step: 3,
      practiceSelected: lesson.practice.answer,
      explanation: 'Xác định cụm danh từ hay mệnh đề trước khi chọn.',
    })
    await saveLearningActivity({
      ...saved,
      revision: 4,
      step: 4,
      practiceSelected: lesson.practice.answer,
      transferSelected: lesson.transfer.answer,
      explanation: 'Xác định cụm danh từ hay mệnh đề trước khi chọn.',
    })
    await saveLearningActivity({
      ...saved,
      revision: 5,
      step: 5,
      completed: true,
      practiceSelected: lesson.practice.answer,
      transferSelected: lesson.transfer.answer,
      explanation: 'Xác định cụm danh từ hay mệnh đề trước khi chọn.',
    })
    await saveCard('knowledge', lesson.lessonId)
    assert.equal((await db.learningActivities.get(row.id))?.kind === 'micro-lesson', true)
    assert.equal(await db.cards.count(), 1)
    assert.equal(await db.reviewEvents.count(), 0)
    assert.equal(await db.skillEvidence.count(), 0)
  })
  it('blocks Studio writes during an unfinished exam', async () => {
    const q = questionById.get('p5-efficiently')!
    await startSession('practice', [q.id], { mode: 'exam', durationMinutes: 20 })
    await assert.rejects(saveReadingWorkspace(workspace(), 0), /lượt thi/)
    const lesson = microLessons[0]
    await assert.rejects(
      saveLearningActivity({
        id: `micro:${lesson.id}`,
        kind: 'micro-lesson',
        contentId: lesson.id,
        occurredAt: Date.now(),
        step: 1,
        prediction: null,
        practiceSelected: null,
        transferSelected: null,
        explanation: '',
        completed: false,
        revision: 0,
      }),
      /lượt thi/,
    )
    assert.equal(await db.readingWorkspaces.count(), 0)
  })
  it('round trips Studio data through a versioned backup and supports a genuine v7 table layout', async () => {
    await saveReadingWorkspace(workspace(), 0)
    await saveCard('vocabulary', 'renew', {
      sentence: 'Readers may renew books online.',
      source: 'library-notice',
    })
    const stimulus = stimuli.find((s) => s.part === 3)!
    assert.ok('audio' in stimulus)
    const reference = transcriptSegments(stimulus.audio.transcript)[0]
    const comparison = compareDictation(reference, reference)
    await saveLearningActivity({
      id: 'round-trip-dictation',
      kind: 'dictation',
      contentId: stimulus.id,
      occurredAt: Date.now(),
      input: reference,
      reference,
      matched: comparison.matched,
      total: comparison.total,
    })
    const backup = await createBackup(db)
    const candidate = await parseBackup(JSON.stringify(backup))
    assert.equal(candidate.invalid, 0)
    const target = new StudyDatabase(`studio-backup-${crypto.randomUUID()}`)
    try {
      await commitImport(target, await previewImport(target, candidate, 'replace'))
      assert.equal(canonical((await createBackup(target)).data), canonical(backup.data))
    } finally {
      await target.delete()
    }
    const { integrity: _, ...body } = backup
    const legacyData = { ...body.data } as Record<string, unknown>
    for (const table of ['readingWorkspaces', 'learningActivities', 'vocabularyContexts'])
      delete legacyData[table]
    const payload = { ...body, databaseVersion: 7, data: legacyData }
    const bytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonical(payload)),
    )
    const integrity = {
      algorithm: 'SHA-256',
      hash: [...new Uint8Array(bytes)].map((n) => n.toString(16).padStart(2, '0')).join(''),
    }
    const old = await parseBackup(JSON.stringify({ ...payload, integrity }))
    assert.equal(old.backup.databaseVersion, 9)
    assert.equal(old.backup.data.readingWorkspaces.length, 0)
    assert.equal(old.backup.data.cards.length, 1)
  })
})
