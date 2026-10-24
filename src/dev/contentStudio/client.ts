import type { ContentBank } from '../../content/validation'
import type { ContentPackage } from '../../content/ingestion'
import type { ContentQualityAudit } from '../../content/quality'
import type { StudioDraft } from '../../../build/studioStore'
import { StudyOperationError } from '../../application/errors'
export type { StudioDraft }
export interface StudioCatalog {
  bank: ContentBank
  packages: ContentPackage[]
  audit: ContentQualityAudit
  counts: { practice: number; mock: number }
}
export async function studioApi<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/__content-studio/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'X-Study990-Studio': '1',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    signal,
  })
  const data = await response.json()
  if (!response.ok)
    throw new StudyOperationError(
      typeof data.error === 'string' ? data.error : 'Studio request failed.',
    )
  return data as T
}
export function newPackage(id = 'original-batch'): ContentPackage {
  return {
    format: 'study990.content',
    formatVersion: 3,
    id,
    revision: 'r1',
    purpose: 'practice',
    review: {
      status: 'unreviewed',
      author: 'Local author',
      date: new Date().toISOString().slice(0, 10),
      note: 'Original draft; no human review completed.',
    },
    media: [],
    bank: {
      questions: [
        {
          schemaVersion: 1,
          id: `${id}:q001`,
          part: 5,
          prompt: '',
          options: (['A', 'B', 'C', 'D'] as const).map((id) => ({ id, text: '', reasoning: '' })),
          answer: '' as 'A',
          explanation: '',
          takeaway: '',
          skills: [],
          difficulty: 'intermediate',
          grammarIds: [],
          vocabularyIds: [],
          topic: 'office',
          provenance: {
            kind: 'original',
            author: 'Local author',
            revision: 'r1',
            note: 'Original draft; not ETS content or independently reviewed.',
          },
        },
      ],
      stimuli: [],
      passages: [],
      grammarIds: [],
      vocabularyIds: [],
    },
  }
}
