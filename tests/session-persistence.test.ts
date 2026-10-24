import 'fake-indexeddb/auto'
import { after, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Dexie from 'dexie'
import { db, StudyDatabase } from '../src/persistence/database'
import {
  advanceSession,
  navigateStudyQuestion,
  readStudyData,
  startSession,
  submitAnswer,
} from '../src/application/studyRepository'
import {
  beginExamPlayback,
  endExamPlayback,
  finishExam,
  navigateExam,
  saveExamResponse,
  skipExamAudio,
} from '../src/application/examRepository'
import { questions, starterQuestions, questionById, stimuli } from '../src/content/questions'
import { miniExamQuestions } from '../src/domain/assessment'
import type { OptionId } from '../src/content/schema'

beforeEach(async () => {
  await db.delete()
  await db.open()
})
after(async () => {
  await db.delete()
})

describe('transactional study and exam persistence (fake IndexedDB, no browser)', () => {
  it('refuses incomplete shared-stimulus groups in Exam Mode', async () => {
    const question = questions.find((q) => q.part === 3)!
    await assert.rejects(startSession('practice', [question.id], { mode: 'exam' }))
    assert.equal(await db.sessions.count(), 0)
  })
  it('preserves a shared group, prevents duplicate study attempts, and allows study navigation', async () => {
    const ids = starterQuestions.filter((q) => q.part === 3).map((q) => q.id)
    const session = await startSession('practice', ids)
    await submitAnswer(session.id, ids[1], questionById.get(ids[1])!.answer, 2)
    await assert.rejects(advanceSession(session.id, ids[0]))
    for (const id of ids) await submitAnswer(session.id, id, questionById.get(id)!.answer, 2)
    await submitAnswer(
      session.id,
      ids[0],
      questionById.get(ids[0])!.options.find((o) => o.id !== questionById.get(ids[0])!.answer)!.id,
      1,
    )
    assert.equal(await db.attempts.count(), 3)
    await navigateStudyQuestion(session.id, ids[2])
    assert.equal((await db.sessions.get(session.id))!.cursor, 2)
    await advanceSession(session.id, ids[2])
    assert.equal((await db.sessions.get(session.id))!.status, 'completed')
  })
  it('keeps exam choices ungraded until final submission, counts blanks and commits only once', async () => {
    const ids = miniExamQuestions(starterQuestions, stimuli)
    const session = await startSession('mini-exam', ids)
    const first = questionById.get(ids[0])!
    await saveExamResponse(session.id, first.id, first.answer)
    assert.equal(await db.attempts.count(), 0)
    assert.equal(await db.cards.count(), 0)
    await assert.rejects(submitAnswer(session.id, first.id, first.answer, 2))
    await Promise.all([finishExam(session.id), finishExam(session.id)])
    const data = await readStudyData()
    assert.equal(data.attempts.length, 19)
    assert.equal(data.attempts.filter((a) => a.correct).length, 1)
    assert.equal(data.attempts.filter((a) => a.selected === null).length, 18)
    assert.equal(data.cards.length, 18)
    assert.equal(data.sessions[0].finishReason, 'submitted')
    await saveExamResponse(
      session.id,
      first.id,
      first.options.find((o) => o.id !== first.answer)!.id,
    )
    assert.equal((await db.attempts.get(`${session.id}:${first.id}`))!.correct, true)
  })
  it('reopens stored selections, cursor and the same deadline without resetting the exam clock', async () => {
    const q = questions.find((q) => q.part === 5)!
    const session = await startSession('practice', [q.id], { mode: 'exam', durationMinutes: 20 })
    await saveExamResponse(session.id, q.id, q.answer)
    db.close()
    const reopened = new StudyDatabase()
    await reopened.open()
    assert.equal((await reopened.sessions.get(session.id))!.deadlineAt, session.deadlineAt)
    assert.equal((await reopened.responses.get(`${session.id}:${q.id}`))!.selected, q.answer)
    assert.equal(await reopened.attempts.count(), 0)
    reopened.close()
    await db.open()
  })
  it('finalizes an expired session from saved answers and refuses to accept a late change', async () => {
    const q = questions.find((q) => q.part === 5)!
    const session = await startSession('practice', [q.id], { mode: 'exam' })
    await saveExamResponse(session.id, q.id, q.answer)
    const deadline = Date.now() - 10
    await db.sessions.update(session.id, { deadlineAt: deadline })
    const wrong = q.options.find((o) => o.id !== q.answer)!.id
    await saveExamResponse(session.id, q.id, wrong)
    const completed = (await db.sessions.get(session.id))!
    assert.equal(completed.status, 'completed')
    assert.equal(completed.finishReason, 'timeout')
    assert.equal(completed.completedAt, deadline)
    assert.equal((await db.attempts.get(`${session.id}:${q.id}`))!.selected, q.answer)
  })
  it('records audio failure/recovery, allows proceeding, and ignores completion from an old playback token', async () => {
    const ids = miniExamQuestions(starterQuestions, stimuli)
    const session = await startSession('mini-exam', ids)
    const stimulus = questionById.get(ids[0])!.stimulusId!
    await assert.rejects(navigateExam(session.id, ids[1]))
    const first = await beginExamPlayback(session.id, stimulus)
    await assert.rejects(beginExamPlayback(session.id, stimulus))
    await endExamPlayback(first, 'failed')
    const retried = await beginExamPlayback(session.id, stimulus)
    assert.equal(retried.assisted, true)
    assert.equal(retried.playCount, 2)
    await endExamPlayback(first, 'completed')
    assert.equal((await db.playbacks.get(first.id))!.status, 'started')
    await skipExamAudio(session.id, stimulus)
    await endExamPlayback(retried, 'completed')
    assert.equal((await db.playbacks.get(first.id))!.error, 'skipped')
    await navigateExam(session.id, ids[1])
    await assert.rejects(navigateExam(session.id, ids[0]))
    await finishExam(session.id)
    assert.equal((await db.sessions.get(session.id))!.status, 'completed')
  })
  it('rejects invalid answer letters and does not persist an answer to a different active unit', async () => {
    const ids = miniExamQuestions(starterQuestions, stimuli)
    const session = await startSession('mini-exam', ids)
    await assert.rejects(saveExamResponse(session.id, ids[0], 'Z' as OptionId))
    await assert.rejects(saveExamResponse(session.id, ids.at(-1)!, 'A'))
    assert.equal(await db.responses.count(), 0)
    const same = await startSession('practice', [questions.find((q) => q.part === 5)!.id])
    assert.equal(same.id, session.id)
  })
  it('rolls back all scoring and mistake writes when required content is missing', async () => {
    const q = questions.find((q) => q.part === 5)!
    const session = await startSession('practice', [q.id], { mode: 'exam' })
    await db.sessions.update(session.id, { questionIds: [q.id, 'content-removed'] })
    await assert.rejects(finishExam(session.id))
    assert.equal(await db.attempts.count(), 0)
    assert.equal(await db.cards.count(), 0)
    assert.equal((await db.sessions.get(session.id))!.status, 'active')
  })
  it('migrates Task 01 data to Study Mode without losing attempts, preferences or the active cursor', async () => {
    await db.delete()
    const old = new Dexie('study990')
    old.version(1).stores({
      preferences: 'id',
      attempts: 'id, sessionId, questionId, occurredAt',
      sessions: 'id, status, startedAt',
      cards: 'id, kind, dueAt, contentId',
      reviewEvents: 'id, cardId, occurredAt',
      reflections: 'id, attemptId, createdAt',
    })
    await old.open()
    const q = questions.find((q) => q.part === 5)!
    await old.table('sessions').put({
      id: 'legacy',
      kind: 'practice',
      questionIds: [q.id],
      cursor: 0,
      status: 'active',
      startedAt: 1,
    })
    await old
      .table('preferences')
      .put({ id: 'preferences', dailyGoal: 9, targetScore: 900, theme: 'dark' })
    await old.table('attempts').put({
      id: `legacy:${q.id}`,
      sessionId: 'legacy',
      questionId: q.id,
      selected: q.answer,
      correct: true,
      confidence: 2,
      occurredAt: 2,
      source: 'practice',
    })
    await old.table('cards').put({
      id: 'vocabulary:approve',
      kind: 'vocabulary',
      contentId: 'approve',
      dueAt: 123456,
      intervalDays: 6,
      ease: 2.5,
      repetitions: 2,
      lapses: 0,
      createdAt: 1,
    })
    await old.table('reviewEvents').put({
      id: 'old-review',
      cardId: 'vocabulary:approve',
      grade: 4,
      occurredAt: 2,
      nextDueAt: 123456,
    })
    await old.table('reflections').put({
      id: `legacy:${q.id}`,
      attemptId: `legacy:${q.id}`,
      questionId: q.id,
      reasoning: 'A saved explanation from Task 01.',
      createdAt: 2,
    })
    old.close()
    await db.open()
    const migrated = (await db.sessions.get('legacy'))!
    assert.equal(migrated.mode, 'study')
    assert.equal(migrated.cursor, 0)
    assert.equal((await db.preferences.get('preferences'))!.dailyGoal, 9)
    assert.equal(await db.attempts.count(), 1)
    assert.equal(await db.responses.count(), 0)
    assert.equal((await db.cards.get('vocabulary:approve'))!.dueAt, 123456)
    assert.equal((await db.cards.get('vocabulary:approve'))!.repetitions, 2)
    assert.equal(await db.reviewEvents.count(), 1)
    assert.equal(
      (await db.reflections.get(`legacy:${q.id}`))!.reasoning,
      'A saved explanation from Task 01.',
    )
  })
})
