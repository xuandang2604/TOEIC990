import { foundationEntries } from './foundations'
import { timeEntries } from './time'
import { structureEntries } from './structures'
import { advancedEntries } from './advanced'
import { legacyGuides } from './legacyGuides'

export { chapters, levelLabels } from './model'
export type { FeynmanGuide, ChapterId, HandbookLevel } from './model'
export const handbookEntries = [
  ...foundationEntries,
  ...timeEntries,
  ...structureEntries,
  ...advancedEntries,
]
export const handbookGuides = [...legacyGuides, ...handbookEntries.map((e) => e.guide)]
export const handbookGuideById = new Map(handbookGuides.map((g) => [g.lessonId, g]))
