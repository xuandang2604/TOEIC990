import { db } from '../persistence/database'
import { DEFAULT_PREFERENCES } from '../domain/models'
import { validVocabularyReminder, type VocabularyReminder } from '../domain/roadmap'
import { localDayKey } from '../domain/learning'
import { schedulableCard } from '../domain/scheduler'
import { vocabularyById } from '../content/vocabulary'
import { StudyOperationError } from './errors'

export async function saveVocabularyReminder(enabled: boolean, time: string) {
  const next: VocabularyReminder = { version: 1, enabled, time }
  if (!validVocabularyReminder(next)) throw new StudyOperationError('Giờ nhắc cần có dạng HH:mm.')
  await db.transaction('rw', db.preferences, async () => {
    const current = (await db.preferences.get('preferences')) ?? DEFAULT_PREFERENCES
    await db.preferences.put({
      ...current,
      vocabularyReminder: { ...current.vocabularyReminder, ...next },
    })
  })
}
export async function dismissVocabularyReminder() {
  await db.transaction('rw', db.preferences, async () => {
    const current = await db.preferences.get('preferences')
    if (current?.vocabularyReminder)
      await db.preferences.put({
        ...current,
        vocabularyReminder: { ...current.vocabularyReminder, dismissedOn: localDayKey(Date.now()) },
      })
  })
}
/** Atomic daily claim across tabs, only when due words and no active practice exist. */
export async function claimVocabularyNotification() {
  return db.transaction('rw', [db.preferences, db.cards, db.sessions], async () => {
    const current = await db.preferences.get('preferences'),
      reminder = current?.vocabularyReminder
    const now = Date.now(),
      day = localDayKey(now),
      date = new Date(now)
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    if (
      !current ||
      !reminder ||
      !validVocabularyReminder(reminder) ||
      !reminder.enabled ||
      reminder.lastNotifiedOn === day ||
      reminder.dismissedOn === day ||
      time < reminder.time ||
      (await db.sessions.where('status').equals('active').first())
    )
      return 0
    const count = await db.cards
      .where('kind')
      .equals('vocabulary')
      .filter(
        (card) => vocabularyById.has(card.contentId) && schedulableCard(card) && card.dueAt <= now,
      )
      .count()
    if (!count) return 0
    await db.preferences.put({
      ...current,
      vocabularyReminder: { ...reminder, lastNotifiedOn: day },
    })
    return count
  })
}
