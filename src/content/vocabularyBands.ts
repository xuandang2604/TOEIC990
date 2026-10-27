import type { VocabularyEntry } from './schema'
import type { ContentIssue } from './validation'

/** Editorial learning priorities, not ETS score calibration or word difficulty estimates. */
export const vocabularyBands = [
  { id: 'foundation', label: '0–450 · Nền tảng', shortLabel: '0–450', ceiling: 450 },
  { id: 'core', label: '450–600 · Cốt lõi', shortLabel: '450–600', ceiling: 600 },
  { id: 'expansion', label: '600–750 · Mở rộng', shortLabel: '600–750', ceiling: 750 },
  { id: 'precision', label: '750–900 · Dùng chính xác', shortLabel: '750–900', ceiling: 900 },
  { id: 'nuance', label: '900–990 · Sắc thái & cụm từ', shortLabel: '900–990', ceiling: 990 },
] as const
export type VocabularyBandId = (typeof vocabularyBands)[number]['id']

const groups: Record<VocabularyBandId, string> = {
  foundation:
    'animal appointment attend available bench bicycle budget building cancel colleague confirm customer delivery discount door employee equipment journey luggage park repair request reservation schedule address airport arrival assistant baggage book borrow cafeteria client collect delay desk entrance factory fare flight guest interview meeting message passenger payment printer return room seat sign staff ticket visitor',
  core: 'agenda applicant approve arrange branch brochure candidate conference convenient deadline depart deposit efficient expense feedback invoice look-forward-to maintenance participate policy purchase receipt recommend register reliable require shipment submit supplier temporary workshop access account advertisement advice application attachment benefit board charge complaint copy courier demand department document due exchange exhibition extension form forward guarantee hire instruction insurance item manager manual order overtime packaging payroll position quotation reference replace stock survey transport quote',
  expansion:
    'accommodation be-responsible-for cap capacity contract counter crane despite distribute edge estimate expand facility in-advance mandatory notify nut obtain on-behalf-of platform postpone process promote proposal recruit refund renew renovation resolve signal soil unless vacant venue warranty accurate adjust alternative apologize assess assign audit brief certification conduct confidential consent consult defect dispatch efficiency exceed finalize flexible forecast handle implement incentive inspect install inventory issue lease merit monitor objective orientation outsource outstanding oversee perspective procurement productivity qualified shortage',
  precision:
    'accommodate authorize eligible itinerary lane negotiate pendant-light prior reimburse relocate revenue amendment allocation appraisal compatible contingency discrepancy disruption endorse expedite feasible fluctuate provisional reconcile rectify refurbish remit replenish subsidiary surplus tangible tentative turnover unanimous viable reimbursement',
  nuance:
    'complimentary comply retain waive withdraw alleviate ascertain contingent defer deterioration discretion incur indispensable liaison mitigate pertinent prerequisite stringent substantiate waiver',
}
const assignments = vocabularyBands.flatMap((band) =>
  groups[band.id].split(' ').map((id) => [id, band] as const),
)
const byWord = new Map(assignments)
export const vocabularyBandFor = (id: string) => byWord.get(id)

export function validateVocabularyBands(words: VocabularyEntry[]): ContentIssue[] {
  const ids = new Set(words.map((word) => word.id))
  const issues: ContentIssue[] = []
  const fail = (id: string, message: string) =>
    issues.push({ path: `vocabularyBands.${id}`, message })
  for (const word of words) if (!byWord.has(word.id)) fail(word.id, 'Missing learning band.')
  const seen = new Set<string>()
  for (const [id] of assignments) {
    if (!ids.has(id)) fail(id, 'Unknown vocabulary ID.')
    if (seen.has(id)) fail(id, 'Duplicate band assignment.')
    seen.add(id)
  }
  return issues
}
