import { vocabulary, vocabularyById } from '../content/vocabulary'
import type { VocabularyEntry } from '../content/schema'
import { createReferenceIndex, lookupKey } from '../domain/referenceSearch'

/** External implementations must return validated, licensed entries through a server boundary. */
export interface DictionaryProvider {
  search(query: string, signal?: AbortSignal): VocabularyEntry[] | Promise<VocabularyEntry[]>
  lookup(
    text: string,
    signal?: AbortSignal,
  ): VocabularyEntry | undefined | Promise<VocabularyEntry | undefined>
}
export interface TranslationProvider {
  translate(
    request: { text: string; source: 'en'; target: 'vi' },
    signal?: AbortSignal,
  ): Promise<{
    text: string
    provider: string
    attribution: string
  }>
}
export const vocabularyDocuments = vocabulary.map((entry) => ({
  key: `vocabulary:${entry.id}`,
  kind: 'vocabulary' as const,
  id: entry.id,
  title: entry.word,
  description: entry.meaning,
  label: entry.partOfSpeech,
  aliases: entry.forms,
  keywords: `${entry.topic} ${entry.family.join(' ')} ${entry.collocations.join(' ')} ${entry.definition}`,
}))
const searchVocabulary = createReferenceIndex(vocabularyDocuments)
const headwords = new Map(vocabulary.map((entry) => [lookupKey(entry.word), entry]))
const forms = new Map<string, VocabularyEntry>()
for (const entry of vocabulary) for (const form of entry.forms) forms.set(lookupKey(form), entry)
// Explicit derivations retained from Task 01. Results identify the actual headword and POS.
const relatedForms: Record<string, string> = {
  approval: 'approve',
  efficiently: 'efficient',
  efficiency: 'efficient',
  registration: 'register',
  recommendations: 'recommend',
  recommendation: 'recommend',
}
export const localDictionary = {
  search(query: string) {
    return searchVocabulary(query, 'vocabulary', undefined, vocabulary.length).map((hit) =>
      vocabularyById.get(hit.id)!,
    )
  },
  lookup(text: string) {
    const key = lookupKey(text)
    return headwords.get(key) ?? forms.get(key) ?? vocabularyById.get(relatedForms[key])
  },
} satisfies DictionaryProvider
