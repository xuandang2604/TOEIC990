import 'fake-indexeddb/auto'
import { after, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  allQuestions,
  questions,
  starterQuestions,
  practiceQuestions,
  mockQuestions,
  stimuli,
  passages,
  questionById,
  stimulusFor,
} from '../src/content/questions'
import { contentBank, contentIssues } from '../src/content/catalog'
import { availableMockExams, mockForSession } from '../src/content/mockExams'
import { installedPackages } from '../src/content/generated'
import { validateContentPackage } from '../src/content/ingestion'
import { findNearDuplicates } from '../src/content/similarity'
import {
  OFFICIAL_PART_COUNTS,
  mockExamIssues,
  questionInventory,
} from '../src/domain/contentInventory'
import { assess, sessionUnits, resultByPart, questionAvailable } from '../src/domain/assessment'
import { listeningAudio } from '../src/domain/listening'
import { QuestionRenderer } from '../src/features/practice/QuestionRenderer'
import { db } from '../src/persistence/database'
import { startSession, readStudyData } from '../src/application/studyRepository'
import {
  saveExamResponse,
  skipExamAudio,
  navigateExam,
  beginExamPlayback,
  endExamPlayback,
  finishExam,
} from '../src/application/examRepository'
import { exportBackup, parseBackup } from '../src/persistence/backup'

beforeEach(async () => {
  await db.delete()
  await db.open()
})
after(async () => {
  await db.delete()
})
const expanded = questions.filter((q) => q.id.startsWith('bank2026-'))
const baseBank = {
  ...contentBank,
  questions: allQuestions.filter((q) => !q.id.startsWith('bank2026-')),
  stimuli: stimuli.filter((s) => !s.id.startsWith('bank2026-')),
  passages: passages.filter((p) => !p.id.startsWith('bank2026-')),
}

describe('expanded original content, inventory and disclosure', () => {
  it('retains all 34 starter and 18 Tutor items, adds exactly 400 disjoint items and counts distinct attempted practice only', () => {
    assert.equal(starterQuestions.length, 34)
    assert.equal(baseBank.questions.length, 52)
    assert.equal(expanded.length, 400)
    assert.equal(practiceQuestions.length, 234)
    assert.equal(mockQuestions.length, 200)
    assert.equal(allQuestions.length, 452)
    assert.equal(new Set(allQuestions.map((q) => q.id)).size, 452)
    const q = practiceQuestions[0],
      m = mockQuestions[0]
    const count = questionInventory(practiceQuestions, mockQuestions, stimuli, [
      { questionId: q.id, selected: 'A' },
      { questionId: q.id, selected: 'B' },
      { questionId: practiceQuestions[1].id, selected: null },
      { questionId: m.id, selected: 'A' },
    ])
    assert.equal(count.availablePractice, 234)
    assert.equal(count.attemptedPractice, 1)
    assert.equal(count.reservedMock, 200)
    assert.deepEqual(
      [1, 2, 3, 4, 5, 6, 7].map((p) => questions.filter((q) => q.part === p).length),
      [13, 54, 72, 57, 100, 36, 102],
    )
  })
  it('validates the four activated packages cumulatively without inventing human approval', () => {
    assert.deepEqual(contentIssues, [])
    const bank = structuredClone(baseBank)
    for (const pkg of installedPackages) {
      assert.equal(pkg.formatVersion, 2)
      assert.ok('status' in pkg.review && pkg.review.status === 'ai-draft')
      assert.deepEqual(validateContentPackage(pkg, bank), [])
      bank.questions.push(...pkg.bank.questions)
      bank.stimuli.push(...pkg.bank.stimuli)
      bank.passages.push(...pkg.bank.passages)
    }
    assert.deepEqual(findNearDuplicates(bank), [])
  })
  it('detects near-duplicate numerical paraphrases instead of counting them as new content', () => {
    const original = structuredClone(expanded.find((q) => q.part === 5)!)
    const duplicate = {
      ...structuredClone(original),
      id: 'similar:q1',
      prompt: original.prompt + ' 2027',
    }
    assert.ok(
      findNearDuplicates(
        { ...baseBank, questions: [original, duplicate], stimuli: [], passages: [] },
        0.7,
      ).some((w) => w.kind === 'question'),
    )
  })
  it('makes one structurally complete mock with exact Parts, full groups and single/double/triple readings', () => {
    assert.equal(availableMockExams.length, 1)
    const exam = availableMockExams[0]
    assert.deepEqual(mockExamIssues(exam, questions, stimuli), [])
    assert.deepEqual(
      [1, 2, 3, 4, 5, 6, 7].map(
        (p) => exam.questionIds.filter((id) => questionById.get(id)!.part === p).length,
      ),
      [...OFFICIAL_PART_COUNTS],
    )
    assert.deepEqual(
      new Set(
        mockQuestions
          .filter((q) => q.part === 7)
          .map((q) => {
            const s = stimulusFor(q)!
            return s.kind === 'reading' ? s.passageIds.length : 0
          }),
      ),
      new Set([1, 2, 3]),
    )
    assert.ok(
      mockExamIssues({ ...exam, questionIds: exam.questionIds.slice(1) }, questions, stimuli)
        .length,
    )
  })
  it('does not promote an imported mock label without exact membership and rejects malformed manifests', () => {
    const exam = availableMockExams[0]
    const partial = {
      id: 'foreign',
      kind: 'practice' as const,
      mode: 'exam' as const,
      status: 'completed' as const,
      questionIds: exam.questionIds.slice(1),
      cursor: 0,
      startedAt: 1,
      mockExamId: exam.id,
    }
    assert.equal(mockForSession(partial), undefined)
    assert.equal(mockForSession({ ...partial, questionIds: exam.questionIds }), exam)
    assert.ok(mockExamIssues({ ...exam, questionIds: null } as never, questions, stimuli).length)
  })
  it('varies correct answer placement across the new Part 2 sets', () => {
    for (const pkg of installedPackages) {
      const items = pkg.bank.questions.filter((q) => q.part === 2)
      if (items.length)
        for (const id of ['A', 'B', 'C'])
          assert.ok(items.filter((q) => q.answer === id).length >= 7, pkg.id + ' ' + id)
    }
  })
  it('checks every new answer letter and complete stimulus availability without treating checks as semantic certification', () => {
    for (const q of expanded) {
      assert.ok(questionAvailable(q, stimuli))
      assert.equal(q.provenance.kind, 'original')
      assert.equal(q.options.filter((o) => assess(q, o.id).correct).length, 1)
      assert.ok(q.explanation.trim().length > 20)
      assert.ok(q.options.every((o) => o.reasoning.trim().length > 20))
      assert.ok(q.skills.length)
      assert.ok(q.vocabularyIds.length, q.id)
      assert.ok(q.grammarIds.every((id) => contentBank.grammarIds.includes(id)))
      assert.ok(q.vocabularyIds.every((id) => contentBank.vocabularyIds.includes(id)))
    }
  })
  it('keeps spoken choices exactly once and hides the Part 2 question in unsubmitted Exam HTML', () => {
    for (const q of expanded.filter((q) => q.part <= 2)) {
      const audio = listeningAudio(stimulusFor(q)!, [q])!
      for (const o of q.options) assert.equal(audio.transcript.split(o.id + '. ').length - 1, 1)
    }
    const original = expanded.find((q) => q.part === 2)!
    const q = { ...original, prompt: 'This private stem must remain spoken only.' }
    const html = renderToStaticMarkup(
      <QuestionRenderer
        question={q}
        number={1}
        mode="exam"
        selected={null}
        locked={false}
        feedback={false}
        busy={false}
        onSelect={() => {}}
      />,
    )
    assert.ok(!html.includes(q.prompt))
    assert.ok(html.includes('Chưa thẩm định độc lập'))
    for (const o of q.options) assert.ok(!html.includes(o.text))
  })
  it('retains 12 distinct licensed photographs with actual JPEG bytes and matching source hashes', () => {
    const assets = JSON.parse(readFileSync('content/photo-assets.json', 'utf8')) as {
      src: string
      sha256: string
      license: string
      sourceUrl: string
    }[]
    assert.equal(assets.length, 12)
    assert.equal(new Set(assets.map((a) => a.sha256)).size, 12)
    for (const a of assets) {
      const bytes = readFileSync('public' + a.src)
      assert.equal(a.license, 'CC0-1.0')
      assert.ok(a.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'))
      assert.equal(bytes[0], 0xff)
      assert.equal(bytes[1], 0xd8)
      assert.equal(createHash('sha256').update(bytes).digest('hex'), a.sha256)
    }
  })
  it('preserves explicit arithmetic answer expectations in cross-text and visual items', () => {
    const checks = [
      ['bank2026-mock-reading:q068', '$1,090'],
      ['bank2026-mock-reading:q078', '$654'],
      ['bank2026-mock-reading:q086', 'Willow'],
      ['bank2026-mock-reading:q091', '$575'],
      ['bank2026-mock-reading:q092', 'Twenty-two'],
      ['bank2026-practice-reading:q103', '$38'],
      ['bank2026-practice-reading:q112', '$27'],
    ]
    for (const [id, text] of checks) {
      const q = questionById.get(id)!
      assert.equal(q.options.find((o) => o.id === q.answer)!.text, text, id)
    }
  })
})
describe('full mock application/persistence integration (fake IndexedDB)', () => {
  it('rejects a claimed mock with incomplete or reordered membership before writing', async () => {
    const exam = availableMockExams[0]
    await assert.rejects(
      startSession('practice', exam.questionIds.slice(1), {
        mode: 'exam',
        durationMinutes: 120,
        mockExamId: exam.id,
      }),
    )
    await assert.rejects(
      startSession('practice', [...exam.questionIds].reverse(), {
        mode: 'exam',
        durationMinutes: 120,
        mockExamId: exam.id,
      }),
    )
    assert.equal(await db.sessions.count(), 0)
  })
  it('answers all 200, survives audio failure/reopen, keeps the deadline and scores exactly once with intact backup references', async () => {
    const exam = availableMockExams[0]
    let session = await startSession('practice', exam.questionIds, {
      mode: 'exam',
      durationMinutes: 120,
      mockExamId: exam.id,
    })
    const deadline = session.deadlineAt
    const units = sessionUnits(session, allQuestions)
    for (let i = 0; i < units.length; i++) {
      const unit = units[i]
      if (i) session = await navigateExam(session.id, unit.questionIds[0])
      for (const id of unit.questionIds)
        await saveExamResponse(session.id, id, questionById.get(id)!.answer)
      if (unit.part <= 4) {
        if (i === 0) {
          const record = await beginExamPlayback(session.id, unit.id)
          await endExamPlayback(record, 'failed')
        } else await skipExamAudio(session.id, unit.id)
      }
      if (i === 20) {
        db.close()
        await db.open()
        const restored = await db.sessions.get(session.id)
        assert.equal(restored?.deadlineAt, deadline)
        assert.equal(restored?.mockExamId, exam.id)
        session = restored!
      }
    }
    assert.equal(await db.attempts.count(), 0)
    const completed = await finishExam(session.id)
    await finishExam(session.id)
    const data = await readStudyData()
    assert.equal(completed.status, 'completed')
    assert.equal(data.attempts.length, 200)
    assert.equal(data.attempts.filter((a) => a.correct).length, 200)
    assert.deepEqual(
      resultByPart(completed, allQuestions, data.attempts).map((r) => r.total),
      [...OFFICIAL_PART_COUNTS],
    )
    const restored = await parseBackup(await exportBackup(db))
    assert.equal(restored.backup.data.sessions[0].mockExamId, exam.id)
    assert.deepEqual(restored.backup.data.attempts, data.attempts)
  })
})
