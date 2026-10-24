import 'fake-indexeddb/auto'
import { after, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import Dexie from 'dexie'
import { db, StudyDatabase } from '../src/persistence/database'
import {
  canonical,
  commitImport,
  createBackup,
  exportBackup,
  inspectStorage,
  parseBackup,
  previewImport,
  repairStorage,
  resetData,
} from '../src/persistence/backup'
import { emptyLearningData, inspectLearningData } from '../src/persistence/records'
import {
  advanceSession,
  readStudyData,
  saveStudyDraft,
  startSession,
  submitAnswer,
} from '../src/application/studyRepository'
import {
  saveTutorDraft,
  submitTutorExplanation,
  submitTutorRevision,
} from '../src/application/tutorRepository'
import { questionById } from '../src/content/questions'
import { DEFAULT_PREFERENCES } from '../src/domain/models'
import { makeReviewEvent, newCard, scheduleReview } from '../src/domain/scheduler'

const databases: StudyDatabase[] = []
function isolated() {
  const database = new StudyDatabase(`test-${crypto.randomUUID()}`)
  databases.push(database)
  return database
}
beforeEach(async () => {
  await db.delete()
  await db.open()
})
after(async () => {
  await db.delete()
  for (const database of databases) await database.delete()
})
async function completedFixture() {
  const q = questionById.get('p5-efficiently')!
  const session = await startSession('practice', [q.id])
  await submitAnswer(session.id, q.id, q.options.find((o) => o.id !== q.answer)!.id, 3)
  await advanceSession(session.id, q.id)
  const attemptId = `${session.id}:${q.id}`
  await submitTutorExplanation(
    {
      attemptId,
      text: 'Mình nhìn nghĩa trước khi xét chức năng từ.',
      reasonId: 'meaning-only',
      expectedRevision: 0,
      operationId: crypto.randomUUID(),
    },
    new AbortController().signal,
  )
  await submitTutorRevision({
    reflectionId: attemptId,
    text: 'Trạng từ mô tả cách hành động diễn ra.',
    stance: 'changed',
    expectedRevision: 1,
    operationId: crypto.randomUUID(),
  })
  await saveTutorDraft(
    {
      id: `${attemptId}:revision`,
      reflectionId: attemptId,
      phase: 'revision',
      text: 'Nháp riêng đang đối chiếu.',
      reasonId: null,
      stance: 'uncertain',
      baseRevision: 2,
      ownerId: crypto.randomUUID(),
    },
    0,
  )
  const now = Date.now(),
    before = newCard('vocabulary', 'agenda', now)
  const after = scheduleReview(before, 4, now)
  await db.cards.put(after)
  await db.reviewEvents.add(
    makeReviewEvent(crypto.randomUUID(), before, after, 4, now, 'vocabulary-recall', 'self-report'),
  )
  await db.preferences.put(DEFAULT_PREFERENCES)
  return session
}
describe('versioned backups and atomic recovery (fake IndexedDB)', () => {
  it('round trips scheduler state, Tutor history/drafts and an unfinished question without changing values', async () => {
    await completedFixture()
    const next = await startSession('practice', ['p5-reliable'])
    await saveStudyDraft(next.id, 'p5-reliable', { selected: 'B', confidence: 1 })
    const json = await exportBackup(db),
      candidate = await parseBackup(json)
    assert.equal(candidate.invalid, 0, JSON.stringify(candidate.warnings))
    const target = isolated()
    await commitImport(target, await previewImport(target, candidate, 'replace'))
    target.close()
    await target.open()
    assert.equal(canonical((await createBackup(target)).data), canonical(candidate.backup.data))
    assert.equal((await target.sessions.get(next.id))?.status, 'active')
    assert.equal((await target.studyDrafts.get(`${next.id}:p5-reliable`))?.selected, 'B')
    assert.equal((await target.recoveryPoints.get('last-change'))?.reason, 'import')
  })
  it('rejects modified checksums, unsupported versions, malformed JSON and unsafe keys without writes', async () => {
    const backup = await createBackup(db)
    backup.data.preferences.push(DEFAULT_PREFERENCES)
    await assert.rejects(parseBackup(JSON.stringify(backup)), /không khớp/)
    await assert.rejects(parseBackup('{'), /JSON/)
    await assert.rejects(parseBackup('{"schemaVersion":99}'), /phiên bản/)
    await assert.rejects(parseBackup('{"schemaVersion":5,"__proto__":{}}'), /khóa/)
    assert.equal(await db.preferences.count(), 0)
  })
  it('supports each legacy export version, preserving due dates, confidence provenance and unknown questions', async () => {
    for (const version of [1, 2, 3, 4, 5]) {
      const raw = emptyLearningData()
      raw.preferences.push(DEFAULT_PREFERENCES)
      raw.sessions.push({
        id: 'legacy',
        kind: 'practice',
        mode: 'study',
        questionIds: ['removed-question'],
        cursor: 0,
        status: 'completed',
        startedAt: 1000,
        completedAt: 2000,
      })
      raw.attempts.push({
        id: 'legacy:removed-question',
        sessionId: 'legacy',
        questionId: 'removed-question',
        selected: 'B',
        correct: false,
        confidence: 2,
        occurredAt: 1500,
        source: 'practice',
      })
      raw.cards.push(newCard('vocabulary', 'agenda', 1000))
      raw.cards[0].dueAt = 900_000
      const candidate = await parseBackup(JSON.stringify({ schemaVersion: version, ...raw }))
      assert.equal(candidate.invalid, 0)
      assert.equal(candidate.backup.data.cards[0].dueAt, 900_000)
      assert.equal(candidate.backup.data.attempts[0].correct, false)
      if (version < 4)
        assert.equal(candidate.backup.data.attempts[0].confidenceSource, 'legacy-unspecified')
      assert.ok(candidate.warnings.some((w) => w.includes('không có')))
    }
  })
  it('previews duplicates, merges idempotently and blocks divergent learning state instead of choosing a fake FSRS state', async () => {
    await completedFixture()
    const candidate = await parseBackup(await exportBackup(db)),
      target = isolated()
    await commitImport(target, await previewImport(target, candidate, 'merge'))
    const repeat = await previewImport(target, candidate, 'merge')
    assert.equal(
      repeat.counts.reduce((n, r) => n + r.added, 0),
      0,
    )
    await commitImport(target, repeat)
    assert.equal(await target.attempts.count(), 1)
    await target.cards.update('vocabulary:agenda', { dueAt: 999_999 })
    const conflict = await previewImport(target, candidate, 'merge')
    assert.ok(conflict.blocked)
    await assert.rejects(commitImport(target, conflict), /khác nhau/)
    assert.equal((await target.cards.get('vocabulary:agenda'))?.dueAt, 999_999)
  })
  it('invalidates a preview after a concurrent write and refuses to erase an active session', async () => {
    const candidate = await parseBackup(await exportBackup(db)),
      target = isolated()
    const preview = await previewImport(target, candidate, 'replace')
    await target.preferences.put(DEFAULT_PREFERENCES)
    await assert.rejects(commitImport(target, preview), /thay đổi/)
    await target.sessions.put({
      id: 'active',
      kind: 'practice',
      mode: 'study',
      questionIds: ['p5-reliable'],
      cursor: 0,
      status: 'active',
      startedAt: 1000,
    })
    await assert.rejects(
      commitImport(target, await previewImport(target, candidate, 'replace')),
      /Kết thúc/,
    )
  })
  it('keeps invalid originals, filters them from live state and requires explicit quarantine acknowledgement on import', async () => {
    await db.cards.put({ ...newCard('vocabulary', 'agenda', 1000), dueAt: -1 })
    assert.equal((await readStudyData()).cards.length, 0)
    assert.equal((await readStudyData()).invalidRecordCount, 1)
    assert.equal(await db.cards.count(), 1)
    const candidate = await parseBackup(await exportBackup(db)),
      target = isolated()
    assert.equal(candidate.invalid, 1)
    const preview = await previewImport(target, candidate, 'replace')
    await assert.rejects(commitImport(target, preview), /xác nhận/)
    await commitImport(target, preview, true)
    assert.equal(await target.quarantine.count(), 1)
    assert.equal(
      (await target.quarantine.toArray())[0].record &&
        ((await target.quarantine.toArray())[0].record as { dueAt: number }).dueAt,
      -1,
    )
    const inspected = await inspectStorage(db)
    await repairStorage(db, inspected.fingerprint)
    assert.equal(await db.cards.count(), 0)
    assert.equal(await db.quarantine.count(), 1)
    assert.equal((await db.recoveryPoints.get('last-change'))?.data.cards[0].dueAt, -1)
  })
  it('quarantines orphan chains after rejecting their parent rather than retaining dangling Tutor records', () => {
    const raw = emptyLearningData()
    raw.attempts.push({
      id: 'missing:q',
      sessionId: 'missing',
      questionId: 'q',
      selected: 'A',
      correct: true,
      confidence: null,
      occurredAt: 1000,
      source: 'practice',
    })
    raw.reflections.push({
      id: 'missing:q',
      attemptId: 'missing:q',
      questionId: 'q',
      reasoning: 'Text',
      createdAt: 1000,
    })
    raw.tutorDrafts.push({
      id: 'missing:q:explanation',
      reflectionId: 'missing:q',
      phase: 'explanation',
      text: '',
      reasonId: null,
      stance: 'uncertain',
      baseRevision: 0,
      version: 1,
      updatedAt: 1000,
    })
    const inspected = inspectLearningData(raw)
    assert.equal(inspected.invalid.length, 3)
    assert.equal(inspected.data.reflections.length, 0)
    assert.equal(inspected.data.tutorDrafts.length, 0)
  })
  it('repairs non-finite storage values and exports a tagged original without JSON silently converting NaN to null', async () => {
    await db.cards.put({ ...newCard('vocabulary', 'agenda', 1000), dueAt: NaN })
    const inspected = await inspectStorage(db)
    assert.equal(inspected.invalid.length, 1)
    const rawExport = await parseBackup(await exportBackup(db))
    assert.equal(rawExport.backup.data.cards.length, 0)
    assert.equal(rawExport.backup.quarantine[0].encoding, 'study990.structured.v1')
    assert.match(JSON.stringify(rawExport.backup.quarantine[0].record), /NaN/)
    await repairStorage(db, inspected.fingerprint)
    assert.equal(await db.cards.count(), 0)
    assert.ok(Number.isNaN(((await db.quarantine.toArray())[0].record as { dueAt: number }).dueAt))
    const portable = await parseBackup(await exportBackup(db))
    assert.equal(portable.backup.quarantine[0].encoding, 'study990.structured.v1')
  })
  it('invalidates previews when another operation replaces the single recovery point, even with identical live data', async () => {
    const candidate = await parseBackup(await exportBackup(db)),
      target = isolated()
    const preview = await previewImport(target, candidate, 'replace')
    await commitImport(target, await previewImport(target, candidate, 'replace'))
    await assert.rejects(commitImport(target, preview), /thay đổi/)
  })
  it('rolls back replacement and its checkpoint when a required write fails', async () => {
    await completedFixture()
    const candidate = await parseBackup(await exportBackup(db)),
      target = isolated()
    await target.preferences.put({ ...DEFAULT_PREFERENCES, dailyGoal: 3 })
    const preview = await previewImport(target, candidate, 'replace')
    target.cards.hook('creating', () => {
      throw new Error('simulated write failure')
    })
    await assert.rejects(commitImport(target, preview), /simulated write failure/)
    assert.equal((await target.preferences.get('preferences'))?.dailyGoal, 3)
    assert.equal(await target.attempts.count(), 0)
    assert.equal(await target.recoveryPoints.count(), 0)
  })
  it('reset preserves one exportable checkpoint and rejects stale confirmation', async () => {
    await completedFixture()
    const before = await inspectStorage(db)
    await db.recentSearches.put({ id: 'query', query: 'agenda', lastUsedAt: Date.now() })
    await assert.rejects(resetData(db, before.fingerprint), /thay đổi/)
    await resetData(db, (await inspectStorage(db)).fingerprint)
    assert.equal(await db.attempts.count(), 0)
    const recovery = (await db.recoveryPoints.get('last-change'))!
    assert.equal(recovery.reason, 'reset')
    const candidate = await parseBackup(await exportBackup(db, recovery))
    await commitImport(db, await previewImport(db, candidate, 'replace'))
    assert.equal(await db.attempts.count(), 1)
    assert.equal(await db.tutorTurns.count(), 2)
  })
})

describe('additive IndexedDB schema upgrades', () => {
  for (const version of [1, 2, 3, 4, 5, 6, 7, 8])
    it(`opens a v${version} store as v9 without replacing saved records`, async () => {
      const name = `migration-${crypto.randomUUID()}`
      const legacy = new Dexie(name)
      const stores: Record<string, string> = {
        preferences: 'id',
        attempts: 'id, sessionId, questionId, occurredAt',
        sessions: 'id, status, startedAt',
        cards: 'id, kind, dueAt, contentId',
        reviewEvents: 'id, cardId, occurredAt',
        reflections: 'id, attemptId, createdAt',
      }
      if (version >= 2)
        Object.assign(stores, {
          responses: 'id, sessionId, questionId',
          playbacks: 'id, sessionId, stimulusId',
        })
      if (version >= 3)
        Object.assign(stores, {
          recentSearches: 'id, lastUsedAt',
          studyDrafts: 'id, sessionId, questionId',
        })
      if (version >= 4)
        Object.assign(stores, {
          skillEvidence: 'id, attemptId, questionId, skillId, occurredAt, [skillId+occurredAt]',
          mistakes: 'id, questionId, occurredAt, sessionId',
          mistakeAnnotations: 'id, category',
          questionTimings: 'id, sessionId, questionId',
          timingLeases: 'id',
          dailyPlans: 'id, status, createdAt',
        })
      if (version >= 5)
        Object.assign(stores, {
          tutorTurns: 'id, reflectionId, createdAt',
          tutorDrafts: 'id, reflectionId',
        })
      if (version >= 6)
        Object.assign(stores, {
          quarantine: 'id, table, quarantinedAt',
          recoveryPoints: 'id, createdAt',
        })
      if (version >= 8)
        Object.assign(stores, {
          readingWorkspaces: 'id, updatedAt',
          learningActivities: 'id, kind, contentId, occurredAt',
          vocabularyContexts: 'id, vocabularyId, createdAt',
        })
      legacy.version(version).stores(stores)
      await legacy.table('preferences').put({
        id: 'preferences',
        dailyGoal: 3,
        targetScore: 990,
        theme: 'dark',
        ...(version >= 4 ? { studyMinutes: 40 } : {}),
      })
      await legacy.table('cards').put({ ...newCard('vocabulary', 'agenda', 1000), dueAt: 987_654 })
      legacy.close()
      const upgraded = new StudyDatabase(name)
      databases.push(upgraded)
      await upgraded.open()
      assert.equal(upgraded.verno, 9)
      assert.equal((await upgraded.cards.get('vocabulary:agenda'))?.dueAt, 987_654)
      assert.equal((await upgraded.preferences.get('preferences'))?.dailyGoal, 3)
      assert.equal(
        (await upgraded.preferences.get('preferences'))?.studyMinutes,
        version >= 4 ? 40 : 20,
      )
      assert.equal(await upgraded.quarantine.count(), 0)
      assert.equal(await upgraded.readingWorkspaces.count(), 0)
      assert.equal(await upgraded.learningActivities.count(), 0)
    })
})
