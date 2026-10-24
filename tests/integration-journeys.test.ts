import 'fake-indexeddb/auto'
import { after, beforeEach, describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { db } from '../src/persistence/database'
import {
  advanceSession,
  readStudyData,
  saveCard,
  savePreferences,
  saveStudyDraft,
  startSession,
  submitAnswer,
  rateRecallCard,
} from '../src/application/studyRepository'
import { closeUnavailableSession } from '../src/application/sessionRepository'
import { finishExam, navigateExam, saveExamResponse } from '../src/application/examRepository'
import {
  finishDailyPlan,
  planProgress,
  startAdaptivePlan,
  startPlanPractice,
} from '../src/application/plansRepository'
import { submitGrammarPractice } from '../src/application/grammarPracticeRepository'
import {
  beginTutorTransfer,
  submitTutorExplanation,
  submitTutorRevision,
} from '../src/application/tutorRepository'
import {
  canonical,
  commitImport,
  createBackup,
  exportBackup,
  inspectStorage,
  parseBackup,
  previewImport,
  resetData,
} from '../src/persistence/backup'
import { inspectLearningData } from '../src/persistence/records'
import { searchReferences } from '../src/application/referenceCatalog'
import { localDictionary } from '../src/providers/dictionary'
import { questionById, allQuestions } from '../src/content/questions'
import { grammarById } from '../src/content/grammar'
import { sessionUnits, resultByPart } from '../src/domain/assessment'
import { DEFAULT_PREFERENCES, type StudySession } from '../src/domain/models'
import { learningMilestones } from '../src/domain/milestones'
import {
  clearTutorDraftMemory,
  hasUnsavedTutorWork,
  readTutorDraftMemory,
  retainTutorDraftMemory,
  setTutorDraftPending,
} from '../src/application/tutorDraftRecovery'

let now = Date.UTC(2026, 9, 21, 10)
beforeEach(async () => {
  mock.restoreAll()
  now = Date.UTC(2026, 9, 21, 10)
  mock.method(Date, 'now', () => now)
  await db.delete()
  await db.open()
})
after(async () => {
  mock.restoreAll()
  await db.delete()
})
async function complete(session: StudySession, wrong = false) {
  for (const unit of sessionUnits(session, allQuestions)) {
    await db.sessions.update(session.id, {
      cursor: session.questionIds.indexOf(unit.questionIds[0]),
    })
    for (const id of unit.questionIds) {
      const q = questionById.get(id)!
      await submitAnswer(
        session.id,
        id,
        wrong ? q.options.find((o) => o.id !== q.answer)!.id : q.answer,
        null,
      )
    }
    await advanceSession(session.id, unit.questionIds[0])
  }
}
async function explanationFixture() {
  const session = await startSession('practice', ['p5-efficiently'])
  await complete(session, true)
  const attemptId = `${session.id}:p5-efficiently`
  await submitTutorExplanation(
    {
      attemptId,
      text: 'Mình đã chọn theo nghĩa trước khi xem chức năng.',
      reasonId: 'meaning-only',
      expectedRevision: 0,
      operationId: crypto.randomUUID(),
    },
    new AbortController().signal,
  )
  return attemptId
}
describe('journeys A–H at the application/provider boundary (no browser)', () => {
  it('A/B: first launch, preferences, daily plan, grouped practice, real progress and resume share one durable session', async () => {
    const first = await readStudyData()
    assert.deepEqual(first.preferences, DEFAULT_PREFERENCES)
    assert.equal(first.attempts.length, 0)
    await savePreferences({
      ...first.preferences,
      dailyGoal: 3,
      studyMinutes: 10,
      targetScore: 650,
    })
    const destination = await startAdaptivePlan(10)
    assert.equal(destination.page, 'plan')
    const plan = (await db.dailyPlans.get(destination.id))!
    assert.ok(plan.questionIds.length > 0)
    const session = await startPlanPractice(plan.id)
    const firstId = session.questionIds[0]
    await saveStudyDraft(session.id, firstId, { selected: questionById.get(firstId)!.answer })
    db.close()
    await db.open()
    const resumed = await startSession('practice', ['p5-reliable'])
    assert.equal(resumed.id, session.id)
    assert.equal(
      (await db.studyDrafts.get(`${session.id}:${firstId}`))?.selected,
      questionById.get(firstId)!.answer,
    )
    await complete(resumed)
    const data = await readStudyData()
    assert.equal(data.attempts.length, session.questionIds.length)
    assert.ok(data.skillEvidence.length >= data.attempts.length)
    assert.equal(data.invalidRecordCount, 0)
    assert.equal(planProgress((await db.dailyPlans.get(plan.id))!, data).done, true)
    await finishDailyPlan(plan.id)
    assert.equal((await db.dailyPlans.get(plan.id))?.status, 'completed')
  })
  it('B: wrong answer, explanation snapshot and saved question survive completion without duplicate scoring', async () => {
    const session = await startSession('practice', ['p5-reliable'])
    const q = questionById.get('p5-reliable')!,
      wrong = q.options.find((o) => o.id !== q.answer)!.id
    await submitAnswer(session.id, q.id, wrong, 3)
    await submitAnswer(session.id, q.id, q.answer, null)
    await saveCard('question', q.id)
    await advanceSession(session.id, q.id)
    const data = await readStudyData()
    assert.equal(data.attempts.length, 1)
    assert.equal(data.attempts[0].correct, false)
    assert.equal(data.attempts[0].questionSnapshot?.content?.explanation, q.explanation)
    assert.equal(data.mistakes[0].selected, wrong)
    assert.equal(data.cards.length, 1)
    assert.equal(resultByPart(session, allQuestions, data.attempts)[0].correct, 0)
  })
  it('C/F/H: local lookup/search, save, due recall, restart and backup/reset/restore preserve exact FSRS history', async () => {
    const word = localDictionary.lookup('recommendations')!
    assert.equal(word.id, 'recommend')
    assert.ok(searchReferences('khuyen nghi').some((hit) => hit.id === word.id))
    await saveCard('vocabulary', word.id)
    await saveCard('vocabulary', word.id)
    const card = (await db.cards.get(`vocabulary:${word.id}`))!,
      operationId = crypto.randomUUID()
    await rateRecallCard(card.id, 4, operationId, card.dueAt)
    await rateRecallCard(card.id, 4, operationId, card.dueAt)
    let next = (await db.cards.get(card.id))!
    now = next.dueAt
    await rateRecallCard(card.id, 1, crypto.randomUUID(), next.dueAt)
    next = (await db.cards.get(card.id))!
    db.close()
    await db.open()
    assert.deepEqual(await db.cards.get(card.id), next)
    assert.equal(await db.reviewEvents.count(), 2)
    const before = await createBackup(db),
      file = await exportBackup(db)
    await resetData(db, (await inspectStorage(db)).fingerprint)
    assert.equal(await db.cards.count(), 0)
    const candidate = await parseBackup(file)
    await commitImport(db, await previewImport(db, candidate, 'replace'))
    assert.equal(canonical((await createBackup(db)).data), canonical(before.data))
  })
  it('E: a grammar misconception records evidence/mistake once and preserves an unfinished TOEIC session', async () => {
    const session = await startSession('practice', ['p5-reliable']),
      lesson = grammarById.get('agreement')!,
      exercise = lesson.practice[0]
    const choice = exercise.options.find((o) => o.id !== exercise.answer)!.id,
      operation = crypto.randomUUID()
    const result = await submitGrammarPractice(lesson.id, exercise.id, choice, operation, 5000)
    await submitGrammarPractice(lesson.id, exercise.id, choice, operation, 5000)
    assert.equal(result.correct, false)
    const data = await readStudyData()
    assert.equal(data.sessions[0].id, session.id)
    assert.equal(data.sessions[0].status, 'active')
    assert.equal(data.attempts.length, 0)
    assert.equal(data.mistakes.length, 1)
    assert.equal(data.mistakes[0].reference?.explanation, exercise.explanation)
    assert.equal(data.invalidRecordCount, 0)
    assert.equal(await db.cards.count(), 0)
  })
  it('G: incorrect answer → authored guidance in five modes → revision → transfer → results/review, with no mastery for writing', async () => {
    const id = await explanationFixture()
    const turn = (await db.tutorTurns.toArray())[0]
    assert.equal(turn.kind, 'explanation')
    if (turn.kind !== 'explanation') return
    assert.deepEqual(Object.keys(turn.guidance.sections).sort(), [
      'check',
      'distractors',
      'example',
      'simple',
      'steps',
    ])
    await assert.rejects(beginTutorTransfer(id, 1), /viết lại/)
    const eventsBefore = await db.reviewEvents.count(),
      evidenceBefore = await db.skillEvidence.count()
    await submitTutorRevision({
      reflectionId: id,
      text: 'Trạng từ bổ nghĩa cho động từ, cần đọc chức năng trước.',
      stance: 'changed',
      expectedRevision: 1,
      operationId: crypto.randomUUID(),
    })
    assert.equal(await db.reviewEvents.count(), eventsBefore)
    assert.equal(await db.skillEvidence.count(), evidenceBefore)
    const transfer = await beginTutorTransfer(id, 2)
    await complete(transfer)
    const data = await readStudyData()
    assert.equal(data.reflections.find((r) => r.id === id)?.transferSessionId, transfer.id)
    assert.equal(data.sessions.find((s) => s.id === transfer.id)?.status, 'completed')
    assert.equal(data.invalidRecordCount, 0)
    assert.ok(data.attempts.some((a) => a.sessionId === transfer.id && a.correct))
  })
})

describe('Task 08 regression repairs', () => {
  it('closes unavailable restored exam content, preserves ungraded responses and drafts, and releases the active-session lock without fake completion', async () => {
    const session: StudySession = {
      id: 'retired-bank',
      kind: 'mini-exam',
      mode: 'exam',
      status: 'active',
      questionIds: ['p5-reliable', 'removed-content'],
      cursor: 0,
      startedAt: now,
      deadlineAt: now + 60000,
    }
    await db.sessions.add(session)
    await db.responses.add({
      id: `${session.id}:p5-reliable`,
      sessionId: session.id,
      questionId: 'p5-reliable',
      selected: 'B',
      updatedAt: now,
    })
    await db.dailyPlans.add({
      id: 'linked-plan',
      version: 1,
      status: 'active',
      createdAt: now,
      minutes: 10,
      goal: 3,
      estimatedSeconds: 100,
      questionIds: session.questionIds,
      cardIds: [],
      reasons: [],
      summary: [],
      timingBasis: 'content-estimate',
      practiceSessionId: session.id,
    })
    assert.equal((await startSession('practice', ['p5-reliable'])).id, session.id)
    await closeUnavailableSession(session.id)
    assert.equal((await db.sessions.get(session.id))?.status, 'interrupted')
    assert.equal((await db.dailyPlans.get('linked-plan'))?.status, 'archived')
    assert.equal(await db.responses.count(), 1)
    await finishExam(session.id)
    await saveExamResponse(session.id, 'p5-reliable', 'A')
    await navigateExam(session.id, 'p5-reliable')
    assert.equal(await db.attempts.count(), 0)
    assert.equal((await db.responses.toArray())[0].selected, 'B')
    const data = await readStudyData()
    assert.equal(data.invalidRecordCount, 0)
    assert.equal(
      learningMilestones(data.attempts, data.reviewEvents, data.sessions)[0].achieved,
      false,
    )
    assert.notEqual((await startSession('practice', ['p5-reliable'])).id, session.id)
  })
  it('cannot use the unavailable-content recovery action to discard a healthy active session', async () => {
    const session = await startSession('practice', ['p5-reliable'])
    await assert.rejects(closeUnavailableSession(session.id), /vẫn sẵn sàng/)
    assert.equal((await db.sessions.get(session.id))?.status, 'active')
  })
  it('quarantines contradictory modern correctness, duplicate snapshot choices and wrong Tutor bindings instead of treating them as evidence', async () => {
    const id = await explanationFixture()
    const backup = await createBackup(db),
      raw = structuredClone(backup.data)
    raw.attempts[0].correct = true
    let inspected = inspectLearningData(raw)
    assert.equal(inspected.data.attempts.length, 0)
    assert.ok(inspected.invalid.some((r) => r.table === 'skillEvidence'))
    const duplicate = structuredClone(backup.data)
    duplicate.attempts[0].questionSnapshot!.content!.options[1].id = 'A'
    assert.equal(inspectLearningData(duplicate).data.attempts.length, 0)
    const turns = structuredClone(backup.data)
    if (turns.tutorTurns[0].kind === 'explanation')
      turns.tutorTurns[0].guidance.questionId = 'different-question'
    inspected = inspectLearningData(turns)
    assert.equal(inspected.data.tutorTurns.length, 0)
    assert.equal(inspected.data.reflections.length, 0)
    assert.equal((await db.attempts.get(id))?.correct, false)
  })
  it('keeps a legacy-current-content outcome without regrading it against a reconstructed newer answer', async () => {
    await explanationFixture()
    const raw = (await createBackup(db)).data
    raw.attempts[0].questionSnapshot!.origin = 'legacy-current-content'
    raw.attempts[0].correct = true
    assert.equal(inspectLearningData(raw).data.attempts[0].correct, true)
  })
  it('reads a checksum-valid Task 07 schema-6 backup into schema 8 without changing learning values', async () => {
    await explanationFixture()
    const { integrity: _old, ...body } = await createBackup(db)
    const previous = { ...body, databaseVersion: 6 }
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(canonical(previous)),
    )
    const json = JSON.stringify({
      ...previous,
      integrity: {
        algorithm: 'SHA-256',
        hash: [...new Uint8Array(hash)].map((n) => n.toString(16).padStart(2, '0')).join(''),
      },
    })
    const parsed = await parseBackup(json)
    assert.equal(parsed.backup.databaseVersion, 9)
    assert.equal(parsed.invalid, 0)
    assert.equal(canonical(parsed.backup.data), canonical(body.data))
  })
  it('keeps an emergency Tutor copy observable across recovery views until explicit acknowledgement, independently of IndexedDB', async () => {
    const id = 'memory-only-recovery'
    setTutorDraftPending(id, true)
    retainTutorDraftMemory(id, {
      reflectionId: 'unavailable-attempt',
      phase: 'revision',
      text: 'Nội dung phải sao chép trước khi rời trang.',
    })
    assert.equal(hasUnsavedTutorWork(), true)
    assert.equal(
      readTutorDraftMemory().find((d) => d.id === id)?.text,
      'Nội dung phải sao chép trước khi rời trang.',
    )
    clearTutorDraftMemory(id)
    assert.equal(hasUnsavedTutorWork(), true)
    setTutorDraftPending(id, false)
    assert.equal(hasUnsavedTutorWork(), false)
  })
})
