import { installedPackages } from './generated'
import {
  assessmentEligible,
  editorialStatus,
  legacySamplePackageEligible,
  legacySampleQuestionEligible,
} from './quality'
import type { Question } from './schema'
import { questionFingerprint } from './editorial'
import { starterQuestions } from './questions'
const explicitStarter = new Set<string>(
  starterQuestions.filter(legacySampleQuestionEligible).map((q) => q.id),
)
const packages = new Map(
  installedPackages.flatMap((p) => p.bank.questions.map((q) => [q.id, p] as const)),
)
const packageQuality = new Map(
  installedPackages.map((p) => [
    p.id,
    {
      reviewed: editorialStatus(p).humanReviewed,
      assessment: assessmentEligible(p, legacySamplePackageEligible(p)),
    },
  ]),
)
export function questionAssessmentEligible(id: string) {
  if (explicitStarter.has(id)) return true
  const pkg = packages.get(id)
  return Boolean(pkg && packageQuality.get(pkg.id)?.assessment)
}
export function questionQualityLabel(question: Question) {
  const pkg = packages.get(question.id)
  const current = pkg?.bank.questions.find((q) => q.id === question.id)
  return current &&
    questionFingerprint(current) === questionFingerprint(question) &&
    packageQuality.get(pkg!.id)?.reviewed
    ? 'Đã ghi nhận thẩm định thủ công cho revision này'
    : 'Chưa có hồ sơ thẩm định thủ công hợp lệ'
}
export function questionReviewedAssessmentEligible(id: string) {
  const pkg = packages.get(id)
  return Boolean(
    pkg &&
    packageQuality.get(pkg.id)?.reviewed &&
    pkg.editorial?.eligibility.assessment === 'reviewed',
  )
}
