import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { contentBank } from '../src/content/catalog'
import {
  allQuestions,
  questions,
  starterQuestions,
  passages,
  stimulusFor,
  stimuli,
} from '../src/content/questions'
import { validateContentBank } from '../src/content/validation'
import { QuestionRenderer } from '../src/features/practice/QuestionRenderer'
import { StimulusView } from '../src/features/practice/StimulusView'
import {
  assess,
  assessExam,
  canNavigateExam,
  examExpired,
  filterPracticeUnits,
  miniExamQuestions,
  playbackDecision,
  resultByPart,
  sessionUnits,
} from '../src/domain/assessment'
import { listeningAudio } from '../src/domain/listening'
import type { StudySession } from '../src/domain/models'
import { isAnsweredAttempt } from '../src/domain/models'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { OptionId, ToeicPart } from '../src/content/schema'

const exam = (ids = miniExamQuestions(starterQuestions, stimuli)): StudySession => ({
  id: 'exam',
  kind: 'mini-exam',
  mode: 'exam',
  status: 'active',
  questionIds: ids,
  cursor: 0,
  startedAt: 1000,
  deadlineAt: 2000,
})
describe('validated original bank and rendered question types', () => {
  it('ships each ready photograph as a real local JPEG asset', () => {
    for (const stimulus of stimuli)
      if (stimulus.kind === 'photograph' && stimulus.photograph.status === 'ready') {
        const bytes = readFileSync(
          resolve(import.meta.dirname, '../public', `.${stimulus.photograph.src}`),
        )
        assert.equal(bytes[0], 0xff)
        assert.equal(bytes[1], 0xd8)
        assert.ok(bytes.length > 1000)
      }
  })
  it('validates every original/transfer question and preserves all seven Parts', () => {
    assert.deepEqual(validateContentBank(contentBank), [])
    assert.deepEqual([...new Set(questions.map((q) => q.part))].sort(), [1, 2, 3, 4, 5, 6, 7])
    assert.equal(starterQuestions.length, 34)
    assert.equal(questions.length, 434)
    assert.equal(allQuestions.length, 452)
  })
  it('rejects duplicate choices, duplicate questions and mismatched passage ownership without crashing on malformed fields', () => {
    const duplicate = structuredClone(contentBank)
    duplicate.questions[0].options[1].text = duplicate.questions[0].options[0].text
    assert.ok(
      validateContentBank(duplicate).some((issue) => issue.message.includes('Duplicate choice')),
    )
    const repeated = structuredClone(contentBank)
    repeated.questions.push({
      ...structuredClone(repeated.questions[0]),
      id: 'same-content-new-id',
    })
    assert.ok(
      validateContentBank(repeated).some((issue) => issue.message.includes('Duplicate normalized')),
    )
    const wrongPassage = structuredClone(contentBank)
    wrongPassage.questions.find((q) => q.part === 7)!.passageId = 'unrelated-passage'
    assert.ok(validateContentBank(wrongPassage).some((issue) => issue.path.endsWith('passageId')))
    for (const value of [null, 12, {}, [], '']) {
      const malformed = structuredClone(contentBank)
      malformed.questions[0].prompt = value as never
      assert.doesNotThrow(() => validateContentBank(malformed))
      assert.ok(validateContentBank(malformed).length)
    }
  })
  it('rejects wrong answer keys, duplicate IDs, missing stimuli, unlicensed photos and malformed exhibits', () => {
    const mutations: ((bank: typeof contentBank) => void)[] = [
      (b) => {
        b.questions[0].answer = 'Z' as OptionId
      },
      (b) => {
        b.questions[1].id = b.questions[0].id
      },
      (b) => {
        b.questions.find((q) => q.part === 3)!.stimulusId = 'missing'
      },
      (b) => {
        const photo = b.stimuli.find((s) => s.kind === 'photograph')!
        if (photo.kind === 'photograph' && photo.photograph.status === 'ready')
          photo.photograph.license = '' as 'CC0-1.0'
      },
      (b) => {
        const s = b.stimuli.find((s) => s.kind === 'conversation')!
        if (s.kind === 'conversation' && s.exhibit?.kind === 'table') s.exhibit.rows[0].pop()
      },
      (b) => {
        b.passages.find((p) => p.id === 'p6-courier')!.text = 'No mapped blanks.'
      },
    ]
    for (const mutate of mutations) {
      const bank = structuredClone(contentBank)
      mutate(bank)
      assert.ok(validateContentBank(bank).length > 0)
    }
  })
  it('rejects repeated Part 6 markers even when every marker refers to an existing question', () => {
    const bank = structuredClone(contentBank)
    const stimulus = bank.stimuli.find((s) => s.kind === 'text-completion')!
    assert.equal(stimulus.kind, 'text-completion')
    if (stimulus.kind !== 'text-completion') return
    const passage = bank.passages.find((p) => p.id === stimulus.passageIds[0])!
    passage.text = passage.text.replace('{{4}}', '{{1}}')
    assert.ok(validateContentBank(bank).some((issue) => issue.message.includes('mapped blanks')))
  })
  it('rejects a standalone Part 5 question linked to an unsupported stimulus kind', () => {
    const bank = structuredClone(contentBank)
    const question = bank.questions.find((q) => q.part === 5)!
    question.stimulusId = 'unsupported-stimulus'
    const unsupported = {
      id: question.stimulusId,
      title: 'Unsupported stimulus',
      part: 5,
      topic: question.topic,
      provenance: question.provenance,
    }
    assert.ok(
      validateContentBank({ ...bank, stimuli: [...bank.stimuli, unsupported] }).some((issue) =>
        issue.message.includes('stimulus kind'),
      ),
    )
  })
  it('renders every bundled question and stimulus without requiring a browser or revealing feedback early', () => {
    for (const question of allQuestions) {
      const markup = renderToStaticMarkup(
        <QuestionRenderer
          question={question}
          number={1}
          mode="study"
          selected={null}
          locked={false}
          feedback={false}
          busy={false}
          onSelect={() => {}}
        />,
      )
      assert.match(markup, /type="radio"/)
      assert.ok(!markup.includes('answer-option correct'))
      assert.ok(!markup.includes(question.explanation))
      const s = stimulusFor(question)
      if (s)
        assert.ok(
          renderToStaticMarkup(<StimulusView stimulus={s} passages={passages} />).length > 0,
        )
    }
  })
  it('hides spoken choices for Parts 1/2 in Exam Mode, while keeping Part 3/4 printed questions', () => {
    for (const part of [1, 2, 3, 4] as const) {
      const question = questions.find((q) => q.part === part)!
      const markup = renderToStaticMarkup(
        <QuestionRenderer
          question={question}
          number={1}
          mode="exam"
          selected={null}
          locked={false}
          feedback={false}
          busy={false}
          onSelect={() => {}}
        />,
      )
      if (part <= 2) {
        assert.match(markup, /Response A/)
        assert.ok(!markup.includes(question.options[0].text))
      } else assert.ok(!markup.includes('Response A'))
      assert.ok(!markup.includes('Kiểm tra đáp án'))
      assert.ok(!markup.includes(question.explanation))
    }
  })
  it('uses shared audio with spoken responses and preserves double passages and four mapped blanks', () => {
    const p2 = questions.find((q) => q.part === 2)!,
      p3 = starterQuestions.filter((q) => q.part === 3)
    assert.ok(listeningAudio(stimulusFor(p2)!, [p2])!.transcript.includes(p2.options[0].text))
    assert.equal(new Set(p3.map((q) => q.stimulusId)).size, 1)
    const pair = stimuli.find((s) => s.id === 'reading-venue-pair')!
    assert.ok('passageIds' in pair && pair.passageIds.length === 2)
    const markup = renderToStaticMarkup(<StimulusView stimulus={pair} passages={passages} />)
    assert.match(markup, /Document 1/)
    assert.match(markup, /Document 2/)
    const p6 = stimuli.find((s) => s.part === 6)!
    assert.equal(
      (
        renderToStaticMarkup(<StimulusView stimulus={p6} passages={passages} />).match(
          /blank-marker/g,
        ) ?? []
      ).length,
      4,
    )
  })
})
describe('assessment and mode policy', () => {
  it('validates correct, incorrect, omitted and invalid selections for every question', () => {
    for (const q of allQuestions) {
      assert.equal(assess(q, q.answer).correct, true)
      assert.equal(assess(q, q.options.find((o) => o.id !== q.answer)!.id).correct, false)
      assert.equal(assess(q, null).correct, false)
      assert.throws(() => assess(q, 'Z'))
      if (q.part === 2) assert.throws(() => assess(q, 'D'))
    }
  })
  it('keeps complete stimuli under filters and builds a seven-Part mini exam without claiming 200 questions', () => {
    assert.equal(
      filterPracticeUnits(questions, { part: 3, skill: 'visual-integration' })[0].questionIds
        .length,
      3,
    )
    assert.equal(
      filterPracticeUnits(questions, { part: 6, skill: 'text-cohesion' })[0].questionIds.length,
      4,
    )
    const ids = miniExamQuestions(starterQuestions, stimuli)
    assert.equal(ids.length, 19)
    assert.equal(new Set(ids).size, ids.length)
    assert.deepEqual(
      [...new Set(ids.map((id) => questions.find((q) => q.id === id)!.part))],
      [1, 2, 3, 4, 5, 6, 7],
    )
  })
  it('blocks backwards listening navigation and permits revisiting reading only after the section transition', () => {
    const session = exam(),
      units = sessionUnits(session, allQuestions)
    assert.equal(canNavigateExam(session, allQuestions, units[1].questionIds[0]), true)
    assert.equal(canNavigateExam(session, allQuestions, units[2].questionIds[0]), false)
    session.cursor = session.questionIds.indexOf(units[1].questionIds[0])
    assert.equal(canNavigateExam(session, allQuestions, units[0].questionIds[0]), false)
    const reading = units.find((u) => u.part === 5)!
    session.cursor = session.questionIds.indexOf(reading.questionIds[0])
    session.readingStarted = true
    assert.equal(canNavigateExam(session, allQuestions, units.at(-1)!.questionIds[0]), true)
    assert.equal(canNavigateExam(session, allQuestions, units[0].questionIds[0]), false)
  })
  it('uses absolute deadlines and flags interrupted listening recovery separately from normal one-pass playback', () => {
    assert.equal(examExpired(exam(), 1999), false)
    assert.equal(examExpired(exam(), 2000), true)
    assert.equal(examExpired({ ...exam(), lastObservedAt: 2100 }, 1500), true)
    assert.equal(playbackDecision(undefined, false), 'start')
    const record = {
      id: 'a',
      sessionId: 'exam',
      stimulusId: 's',
      token: 't',
      status: 'started' as const,
      playCount: 1,
      assisted: false,
      updatedAt: 0,
    }
    assert.equal(playbackDecision(record, false), 'blocked')
    assert.equal(playbackDecision(record, true), 'recover')
    assert.equal(playbackDecision({ ...record, status: 'failed' }, false), 'recover')
    assert.equal(playbackDecision({ ...record, status: 'completed' }, true), 'blocked')
  })
  it('scores omissions in the denominator and produces consistent per-Part totals', () => {
    const session = exam()
    const q = questions.find((q) => q.id === session.questionIds[0])!
    const attempts = assessExam(
      session,
      allQuestions,
      [
        {
          id: `exam:${q.id}`,
          sessionId: 'exam',
          questionId: q.id,
          selected: q.answer,
          updatedAt: 1200,
        },
      ],
      1500,
    )
    const results = resultByPart(session, allQuestions, attempts)
    assert.equal(attempts.length, 19)
    assert.equal(attempts.filter((a) => a.selected === null).length, 18)
    assert.equal(
      attempts.filter(isAnsweredAttempt).length,
      1,
      'omissions must not increase daily learning activity',
    )
    assert.equal(
      results.reduce((sum, r) => sum + r.total, 0),
      19,
    )
    assert.equal(
      results.reduce((sum, r) => sum + r.correct, 0),
      1,
    )
    assert.deepEqual(
      results.map((r) => r.part),
      [1, 2, 3, 4, 5, 6, 7] satisfies ToeicPart[],
    )
  })
})
