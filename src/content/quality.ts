import { validateContentBank, type ContentBank } from './validation'
import { findNearDuplicates } from './similarity'
import { questionAvailable } from '../domain/assessment'
import { mockExamIssues, type MockExam } from '../domain/contentInventory'
import { editorialIssues, packageFingerprint, type EditorialRecord } from './editorial'
import { practiceReleaseIssues, type ContentPackage } from './ingestion'
import assessmentPolicy from '../../content/assessment-policy.json'
import type { Question } from './schema'
import { questionFingerprint } from './editorial'
export function legacySamplePackageEligible(pkg: ContentPackage) {
  const expected = (assessmentPolicy.legacyPackageFingerprints as Record<string, string>)[pkg.id]
  return typeof expected === 'string' && expected === packageFingerprint(pkg)
}
export function legacySampleQuestionEligible(q: Question) {
  return (
    (assessmentPolicy.legacyStarterFingerprints as Record<string, string>)[q.id] ===
    questionFingerprint(q)
  )
}

export function editorialStatus(pkg: ContentPackage | undefined) {
  const record = pkg?.editorial
  const trustworthy = Boolean(
    pkg?.formatVersion === 3 && !editorialIssues(record, packageFingerprint(pkg)).length,
  )
  return {
    state: trustworthy ? record!.state : ('NEEDS_REVIEW' as const),
    humanReviewed: trustworthy && ['APPROVED', 'PUBLISHED'].includes(record!.state),
    source: trustworthy ? 'recorded-lifecycle' : 'legacy-unverified',
  }
}
export function assessmentEligible(pkg: ContentPackage | undefined, sampleExplicit = false) {
  if (pkg?.formatVersion === 4) return !practiceReleaseIssues(pkg).length
  if (!pkg || pkg.formatVersion < 3) return sampleExplicit
  const status = editorialStatus(pkg)
  return (
    status.source === 'recorded-lifecycle' &&
    pkg.editorial?.state === 'PUBLISHED' &&
    ((pkg.editorial.eligibility.assessment === 'reviewed' && status.humanReviewed) ||
      (pkg.editorial.eligibility.assessment === 'unreviewed-practice' && sampleExplicit))
  )
}
export function auditContent(
  bank: ContentBank,
  packages: ContentPackage[],
  exams: MockExam[],
  usageIds: string[],
  mediaFailures: { path: string; message: string }[] = [],
  samples: { id: string; questionIds: string[] }[] = [],
) {
  const issues = validateContentBank(bank)
  const invalid = new Set<string>()
  for (const issue of issues) {
    const index = issue.path.match(/^(questions|stimuli|passages)\[(\d+)\]/)
    if (!index) {
      bank.questions.forEach((q) => invalid.add(q.id))
      continue
    }
    if (index[1] === 'questions') {
      const q = bank.questions[Number(index[2])]
      if (q) invalid.add(q.id)
    } else {
      const row =
        index[1] === 'stimuli' ? bank.stimuli[Number(index[2])] : bank.passages[Number(index[2])]
      for (const q of bank.questions)
        if (
          q.stimulusId === row?.id ||
          bank.stimuli.some(
            (s) => s.id === q.stimulusId && 'passageIds' in s && s.passageIds.includes(row?.id),
          )
        )
          invalid.add(q.id)
    }
  }
  const pkgByQuestion = new Map(
    packages.flatMap((p) => p.bank.questions.map((q) => [q.id, p] as const)),
  )
  const statusByPackage = new Map(packages.map((p) => [p.id, editorialStatus(p)]))
  const eligibleByPackage = new Map(
    packages.map((p) => [p.id, assessmentEligible(p, legacySamplePackageEligible(p))]),
  )
  const statuses = bank.questions.map((q) => ({
    id: q.id,
    ...(statusByPackage.get(pkgByQuestion.get(q.id)?.id ?? '') ?? editorialStatus(undefined)),
  }))
  const srcs = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.flatMap(srcs)
      : value && typeof value === 'object'
        ? Object.entries(value).flatMap(([key, v]) =>
            key === 'src' && typeof v === 'string' ? [v] : srcs(v),
          )
        : []
  const missing = bank.questions.filter(
    (q) =>
      !questionAvailable(q, bank.stimuli) ||
      mediaFailures.some((f) =>
        srcs(bank.stimuli.find((s) => s.id === q.stimulusId)).includes(f.path),
      ),
  )
  const usable = bank.questions.filter((q) => !invalid.has(q.id) && !missing.includes(q))
  const used = new Set(usageIds)
  const incompleteExplanations = bank.questions
    .filter(
      (q) =>
        !q.explanation?.trim() ||
        !q.takeaway?.trim() ||
        q.options.some((o) => !o.reasoning?.trim()),
    )
    .map((q) => q.id)
  return {
    total: bank.questions.length,
    valid: bank.questions.length - invalid.size,
    usable: usable.length,
    requiringReview: statuses.filter((s) => !s.humanReviewed).length,
    humanReviewed: statuses.filter((s) => s.humanReviewed).length,
    byPart: [1, 2, 3, 4, 5, 6, 7].map((part) => ({
      part,
      total: bank.questions.filter((q) => q.part === part).length,
      valid: bank.questions.filter((q) => q.part === part && !invalid.has(q.id)).length,
      usable: usable.filter((q) => q.part === part).length,
    })),
    bySkill: [...new Set(bank.questions.flatMap((q) => q.skills))].sort().map((skill) => ({
      skill,
      total: bank.questions.filter((q) => q.skills.includes(skill)).length,
    })),
    issues,
    nearDuplicates: findNearDuplicates(bank),
    missingMediaQuestions: missing.map((q) => q.id),
    mediaFailures,
    incompleteExplanations,
    unused: {
      questions: bank.questions.filter((q) => !used.has(q.id)).map((q) => q.id),
      stimuli: bank.stimuli
        .filter((s) => !bank.questions.some((q) => q.stimulusId === s.id))
        .map((s) => s.id),
      passages: bank.passages
        .filter((p) => !bank.stimuli.some((s) => 'passageIds' in s && s.passageIds.includes(p.id)))
        .map((p) => p.id),
    },
    assessments: exams.map((exam) => {
      const failures = mockExamIssues(exam, bank.questions, bank.stimuli)
      const eligible = exam.questionIds.every((id) => {
        const pkg = pkgByQuestion.get(id)
        return (
          Boolean(
            pkg &&
            eligibleByPackage.get(pkg.id) &&
            (exam.eligibility !== 'reviewed' ||
              (statusByPackage.get(pkg.id)?.humanReviewed &&
                pkg.editorial?.eligibility.assessment === 'reviewed')),
          ) ||
          (exam.eligibility === 'unreviewed-practice' &&
            bank.questions.some((q) => q.id === id && legacySampleQuestionEligible(q)))
        )
      })
      const mediaOk = !exam.questionIds.some((id) => missing.some((q) => q.id === id))
      const valid = !exam.questionIds.some((id) => invalid.has(id))
      return {
        id: exam.id,
        questions: exam.questionIds.length,
        structurallyComplete: !failures.length,
        eligible,
        available: !failures.length && mediaOk && eligible && valid,
        issues: [
          ...failures,
          ...(!mediaOk ? ['Physical media missing.'] : []),
          ...(!eligible ? ['Assessment eligibility not explicitly recorded.'] : []),
          ...(!valid ? ['Validation failed for assessment content.'] : []),
        ],
      }
    }),
    samples: samples.map((sample) => ({
      id: sample.id,
      questions: sample.questionIds.length,
      kind: 'sample',
      fullExam: false,
      available:
        sample.questionIds.length > 0 &&
        new Set(sample.questionIds).size === sample.questionIds.length &&
        sample.questionIds.every(
          (id) =>
            usable.some((q) => q.id === id) &&
            (bank.questions.some((q) => q.id === id && legacySampleQuestionEligible(q)) ||
              Boolean(eligibleByPackage.get(pkgByQuestion.get(id)?.id ?? ''))),
        ),
    })),
    statuses,
    limits:
      'Structural and lexical checks cannot prove semantic correctness, difficulty calibration, translation accuracy, or real browser media playback.',
  }
}
export type ContentQualityAudit = ReturnType<typeof auditContent>
export type { EditorialRecord }
