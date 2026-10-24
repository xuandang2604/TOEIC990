import { db } from '../persistence/database'
import { normalizeReference } from '../domain/referenceSearch'

export async function rememberSearch(query: string) {
  const display = query.trim().replace(/\s+/g, ' ').slice(0, 120)
  const id = normalizeReference(display)
  if (!id) return
  await db.transaction('rw', db.recentSearches, async () => {
    await db.recentSearches.put({ id, query: display, lastUsedAt: Date.now() })
    const older = await db.recentSearches.orderBy('lastUsedAt').reverse().offset(8).primaryKeys()
    await db.recentSearches.bulkDelete(older)
  })
}
export async function clearSearchHistory() {
  await db.recentSearches.clear()
}
