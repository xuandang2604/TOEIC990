import type { StudyDatabase } from './database'
import {
  emptyLearningData,
  inspectLearningData,
  isObject,
  LEARNING_TABLES,
  type LearningData,
  type QuarantinedRecord,
  type RecoveryPoint,
} from './records'
import { schedulerPolicy } from '../domain/scheduler'
import { questionById } from '../content/questions'
import { captureEvidence } from '../domain/evidence'
import { StudyOperationError } from '../application/errors'

export const BACKUP_LIMIT = 25 * 1024 * 1024
export class DataError extends StudyOperationError {}
export interface Backup {
  format: 'study990.backup'
  formatVersion: 1
  databaseVersion: 9
  exportedAt: number
  schedulerPolicy: unknown
  data: LearningData
  quarantine: QuarantinedRecord[]
  integrity?: { algorithm: 'SHA-256'; hash: string }
}
export interface ImportCandidate {
  backup: Backup
  warnings: string[]
  invalid: number
}
export type ImportMode = 'merge' | 'replace'
export interface ImportPreview {
  candidate: ImportCandidate
  mode: ImportMode
  fingerprint: string
  counts: { table: string; current: number; incoming: number; added: number; conflicts: number }[]
  blocked: string | null
}

/** Canonical JSON, with bounded depth and no prototype-bearing keys. Undefined object properties follow JSON semantics. */
export function canonical(value: unknown, depth = 0): string {
  if (depth > 32) throw new DataError('Dữ liệu lồng quá sâu.')
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return JSON.stringify(value)
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((v) => canonical(v, depth + 1)).join(',')}]`
  if (isObject(value) && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => {
        if (['__proto__', 'prototype', 'constructor'].includes(key))
          throw new DataError('Tệp chứa khóa không an toàn.')
        return `${JSON.stringify(key)}:${canonical(value[key], depth + 1)}`
      })
      .join(',')}}`
  }
  throw new DataError('Bản ghi chứa giá trị không thể xuất JSON. Không thay đổi dữ liệu gốc.')
}
async function digest(value: unknown) {
  const bytes = new TextEncoder().encode(canonical(value))
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (n) => n.toString(16).padStart(2, '0')).join('')
}
/** Tagged representation for corrupt values that JSON would silently coerce (NaN, Date, etc.). Never restored into live learning tables. */
function structuredValue(value: unknown, depth = 0, ancestors = new Set<object>()): unknown {
  if (depth > 32) throw new DataError('Bản ghi lỗi lồng quá sâu; dữ liệu gốc được giữ nguyên.')
  if (value === null) return { type: 'null' }
  if (typeof value === 'number')
    return { type: 'number', value: Object.is(value, -0) ? '-0' : String(value) }
  if (typeof value === 'bigint') return { type: 'bigint', value: String(value) }
  if (typeof value === 'undefined') return { type: 'undefined' }
  if (typeof value === 'string' || typeof value === 'boolean') return { type: typeof value, value }
  if (typeof value !== 'object')
    throw new DataError('Kiểu bản ghi lỗi không được hỗ trợ. Dữ liệu gốc chưa bị thay đổi.')
  if (ancestors.has(value))
    throw new DataError(
      'Bản ghi chứa vòng tham chiếu; cần công cụ phục hồi chuyên biệt. Dữ liệu gốc được giữ nguyên.',
    )
  ancestors.add(value)
  const encode = (v: unknown) => structuredValue(v, depth + 1, ancestors)
  let result: unknown
  if (value instanceof Date) result = { type: 'date', value: String(value.getTime()) }
  else if (Array.isArray(value)) result = { type: 'array', values: value.map(encode) }
  else if (value instanceof Map)
    result = { type: 'map', entries: [...value.entries()].map(([k, v]) => [encode(k), encode(v)]) }
  else if (value instanceof Set) result = { type: 'set', values: [...value].map(encode) }
  else if (ArrayBuffer.isView(value))
    result = {
      type: value.constructor.name,
      bytes: [...new Uint8Array(value.buffer, value.byteOffset, value.byteLength)],
    }
  else if (value instanceof ArrayBuffer)
    result = { type: 'ArrayBuffer', bytes: [...new Uint8Array(value)] }
  else if (
    Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null
  )
    result = {
      type: 'object',
      entries: Object.keys(value)
        .sort()
        .map((key) => [key, encode((value as Record<string, unknown>)[key])]),
    }
  else throw new DataError('Bản ghi lỗi có kiểu không hỗ trợ. Dữ liệu gốc chưa bị thay đổi.')
  ancestors.delete(value)
  return result
}
function storageFingerprint(value: unknown): string {
  try {
    return `json:${canonical(value)}`
  } catch (error) {
    if (!(error instanceof DataError)) throw error
    return `structured:${canonical(structuredValue(value))}`
  }
}
function portable(source: { data: LearningData; quarantine: QuarantinedRecord[] }) {
  const data = emptyLearningData(),
    quarantine = [...source.quarantine]
  for (const table of LEARNING_TABLES)
    for (const [index, record] of source.data[table].entries()) {
      try {
        canonical(record)
        ;(data[table] as unknown[]).push(record)
      } catch (error) {
        if (!(error instanceof DataError)) throw error
        quarantine.push({
          id: crypto.randomUUID(),
          table,
          key: isObject(record) ? String(record.id) : `row-${index}`,
          record: structuredValue(record),
          encoding: 'study990.structured.v1',
          quarantinedAt: Date.now(),
          reasons: [
            'Bản ghi không thể biểu diễn nguyên vẹn bằng JSON; được giữ dưới dạng có nhãn kiểu, không nhập vào sổ học đang dùng.',
          ],
        })
      }
    }
  return {
    data,
    quarantine: quarantine.map((row) => {
      try {
        canonical(row.record)
        return row
      } catch (error) {
        if (!(error instanceof DataError)) throw error
        return {
          ...row,
          record: structuredValue(row.record),
          encoding: 'study990.structured.v1' as const,
        }
      }
    }),
  }
}
export async function readRawData(database: StudyDatabase) {
  const data = emptyLearningData()
  await Promise.all(
    LEARNING_TABLES.map(async (table) => {
      data[table] = (await database.table(table).toArray()) as never
    }),
  )
  return data
}
async function snapshot(database: StudyDatabase) {
  const recovery = await database.recoveryPoints.get('last-change')
  return {
    data: await readRawData(database),
    quarantine: await database.quarantine.toArray(),
    recoveryToken: recovery?.token ?? recovery?.createdAt ?? null,
  }
}
export async function createBackup(
  database: StudyDatabase,
  recovery?: RecoveryPoint,
): Promise<Backup> {
  const source =
    recovery ?? (await database.transaction('r', database.tables, () => snapshot(database)))
  const backup: Backup = {
    format: 'study990.backup',
    formatVersion: 1,
    databaseVersion: 9,
    exportedAt: Date.now(),
    schedulerPolicy,
    ...portable(source),
  }
  backup.integrity = { algorithm: 'SHA-256', hash: await digest(backup) }
  return backup
}
export async function exportBackup(database: StudyDatabase, recovery?: RecoveryPoint) {
  const backup = await createBackup(database, recovery)
  const json = JSON.stringify(backup)
  if (
    new TextEncoder().encode(json).length > BACKUP_LIMIT ||
    LEARNING_TABLES.reduce((n, table) => n + backup.data[table].length, backup.quarantine.length) >
      100_000
  )
    throw new DataError(
      'Sổ học vượt giới hạn tệp 25 MB hoặc 100.000 bản ghi của phiên bản này. Chưa tạo tệp vì sẽ không nhập lại được. Giữ nguyên dữ liệu trình duyệt và yêu cầu công cụ xuất phân đoạn từ người bảo trì.',
    )
  return json
}

function legacyData(value: Record<string, unknown>, version: number) {
  const data = emptyLearningData()
  const introduced = {
    contentFeedback: 9,
    readingWorkspaces: 8,
    learningActivities: 8,
    vocabularyContexts: 8,
    preferences: 1,
    attempts: 1,
    sessions: 1,
    cards: 1,
    reviewEvents: 1,
    reflections: 1,
    responses: 2,
    playbacks: 2,
    recentSearches: 3,
    studyDrafts: 3,
    skillEvidence: 4,
    mistakes: 4,
    mistakeAnnotations: 4,
    questionTimings: 4,
    dailyPlans: 4,
    tutorTurns: 5,
    tutorDrafts: 5,
  }
  for (const table of LEARNING_TABLES) {
    if (introduced[table] <= version && value[table] === undefined)
      throw new DataError(`Bản sao v${version} thiếu bảng bắt buộc ${table}.`)
    const rows =
      table === 'preferences' && isObject(value.preferences)
        ? [value.preferences]
        : (value[table] ?? [])
    if (!Array.isArray(rows)) throw new DataError(`Bảng ${table} không hợp lệ.`)
    data[table] = structuredClone(rows) as never
  }
  if (version < 2)
    for (const session of data.sessions) {
      if (isObject(session)) session.mode ??= 'study'
    }
  if (version < 4) {
    for (const p of data.preferences) {
      if (isObject(p)) p.studyMinutes ??= 20
    }
    for (const a of data.attempts) {
      if (!isObject(a)) continue
      a.mode ??= data.sessions.find((s) => isObject(s) && s.id === a.sessionId)?.mode ?? 'study'
      a.timeSpentMs ??= null
      a.confidenceSource ??=
        a.mode !== 'exam' && [1, 3].includes(a.confidence ?? 0) ? 'explicit' : 'legacy-unspecified'
      const q = questionById.get(a.questionId)
      if (q && typeof a.id === 'string' && typeof a.correct === 'boolean' && !a.questionSnapshot) {
        const captured = captureEvidence(a, q, true)
        Object.assign(a, captured.attempt)
        data.skillEvidence.push(...captured.evidence)
        if (captured.mistake) data.mistakes.push(captured.mistake)
      }
    }
    for (const c of data.cards) {
      if (isObject(c)) c.firstEncounterAt ??= c.createdAt
    }
    for (const e of data.reviewEvents) {
      if (!isObject(e)) continue
      e.algorithm ??= 'legacy-sm2'
      e.source ??= 'legacy'
      e.ratingSource ??= 'legacy'
    }
    for (const d of data.studyDrafts) {
      if (isObject(d))
        d.confidenceSource ??= [1, 3].includes(d.confidence ?? 0)
          ? 'explicit'
          : 'legacy-unspecified'
    }
  }
  return data
}
export async function parseBackup(json: string): Promise<ImportCandidate> {
  if (new TextEncoder().encode(json).length > BACKUP_LIMIT)
    throw new DataError('Tệp vượt giới hạn 25 MB.')
  let root: unknown
  try {
    root = JSON.parse(json)
  } catch {
    throw new DataError('Tệp không phải JSON hợp lệ.')
  }
  canonical(root)
  if (!isObject(root)) throw new DataError('Không tìm thấy cấu trúc bản sao.')
  if (root.format !== undefined && root.format !== 'study990.backup')
    throw new DataError('Định dạng bản sao chưa được hỗ trợ.')
  const warnings: string[] = []
  let raw: LearningData,
    quarantine: QuarantinedRecord[] = []
  if (root.format === 'study990.backup') {
    if (root.formatVersion !== 1 || ![6, 7, 8, 9].includes(root.databaseVersion as number))
      throw new DataError(
        'Phiên bản bản sao chưa được hỗ trợ. Hãy mở bằng phiên bản ứng dụng tương ứng.',
      )
    if (
      !Number.isSafeInteger(root.exportedAt) ||
      (root.exportedAt as number) < 0 ||
      !isObject(root.schedulerPolicy) ||
      canonical(root.schedulerPolicy) !== canonical(schedulerPolicy)
    )
      throw new DataError('Thời điểm xuất hoặc policy lịch ôn không tương thích với phiên bản này.')
    if (
      !isObject(root.data) ||
      !LEARNING_TABLES.every((key) => {
        const value = (root.data as Record<string, unknown>)[key]
        return (
          Array.isArray(value) ||
          ((root.databaseVersion as number) < 8 &&
            ['readingWorkspaces', 'learningActivities', 'vocabularyContexts'].includes(key) &&
            value === undefined) ||
          ((root.databaseVersion as number) < 9 && key === 'contentFeedback' && value === undefined)
        )
      })
    )
      throw new DataError('Bản sao thiếu bảng dữ liệu bắt buộc.')
    if (
      !isObject(root.integrity) ||
      root.integrity.algorithm !== 'SHA-256' ||
      typeof root.integrity.hash !== 'string'
    )
      throw new DataError('Bản sao thiếu mã kiểm tra toàn vẹn.')
    const { integrity, ...payload } = root
    if ((await digest(payload)) !== integrity.hash)
      throw new DataError('Mã kiểm tra không khớp. Tệp có thể đã bị sửa hoặc hỏng.')
    raw = { ...emptyLearningData(), ...root.data } as unknown as LearningData
    if (
      !Array.isArray(root.quarantine) ||
      root.quarantine.some(
        (r) =>
          !isObject(r) ||
          typeof r.id !== 'string' ||
          !LEARNING_TABLES.includes(r.table as never) ||
          typeof r.key !== 'string' ||
          !Array.isArray(r.reasons) ||
          !r.reasons.every((s: unknown) => typeof s === 'string') ||
          !Number.isSafeInteger(r.quarantinedAt) ||
          (r.encoding !== undefined && r.encoding !== 'study990.structured.v1') ||
          !Object.hasOwn(r, 'record'),
      )
    )
      throw new DataError('Kho bản ghi cách ly không hợp lệ.')
    quarantine = root.quarantine as QuarantinedRecord[]
    if (root.databaseVersion !== 9)
      warnings.push(
        `Bản sao schema ${root.databaseVersion} được đọc bằng schema 9; bổ sung bảng mới trống khi thiếu, lịch sử và lịch ôn không được chấm lại.`,
      )
    if (new Set(quarantine.map((r) => r.id)).size !== quarantine.length)
      throw new DataError('Kho cách ly có ID trùng; hãy đối chiếu bản nguồn.')
  } else {
    if (
      root.schemaVersion !== undefined &&
      root.databaseVersion !== undefined &&
      root.schemaVersion !== root.databaseVersion
    )
      throw new DataError('Phiên bản schema và database trong tệp không khớp.')
    const version = root.databaseVersion ?? root.schemaVersion
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 5)
      throw new DataError('Không nhận diện được định dạng hoặc phiên bản bản sao.')
    raw = legacyData(root, version)
    warnings.push(
      `Bản sao cũ v${version}: đã chuyển đổi trong bộ nhớ; không chấm lại lịch sử hoặc thay đổi lịch ôn. Tệp cũ không có mã toàn vẹn.`,
    )
  }
  if (LEARNING_TABLES.reduce((n, table) => n + raw[table].length, quarantine.length) > 100_000)
    throw new DataError('Bản sao vượt giới hạn 100.000 bản ghi.')
  const inspected = inspectLearningData(raw)
  const invalid = inspected.invalid.length
  quarantine = [
    ...quarantine,
    ...inspected.invalid.map((r) => ({ ...r, id: crypto.randomUUID(), quarantinedAt: Date.now() })),
  ]
  if (invalid)
    warnings.push(
      `${invalid} bản ghi lỗi sẽ được giữ nguyên trong kho cách ly, không dùng để chấm hoặc lập lịch.`,
    )
  if (quarantine.length)
    warnings.push(
      `${quarantine.length} bản ghi cách ly đi cùng bản sao; chúng không được dùng để chấm hoặc lập lịch.`,
    )
  const unavailable = inspected.data.attempts.filter((a) => !questionById.has(a.questionId)).length
  if (unavailable)
    warnings.push(
      `${unavailable} lượt trả lời tham chiếu nội dung không có trong bộ bài hiện tại. Lịch sử vẫn được giữ.`,
    )
  return {
    backup: {
      format: 'study990.backup',
      formatVersion: 1,
      databaseVersion: 9,
      exportedAt: Date.now(),
      schedulerPolicy,
      data: inspected.data,
      quarantine,
    },
    warnings,
    invalid,
  }
}

function mergedData(local: LearningData, incoming: LearningData, mode: ImportMode) {
  if (mode === 'replace') return structuredClone(incoming)
  const result = emptyLearningData()
  for (const table of LEARNING_TABLES) {
    const ids = new Set(local[table].map((r) => r.id))
    result[table] = [...local[table], ...incoming[table].filter((r) => !ids.has(r.id))] as never
  }
  return result
}
function conflictingHistory(local: LearningData, incoming: LearningData) {
  return LEARNING_TABLES.some((table) => {
    if (table === 'preferences' || table === 'recentSearches') return false
    const rows = new Map(local[table].map((r) => [r.id, r]))
    return incoming[table].some(
      (r) => rows.has(r.id) && storageFingerprint(rows.get(r.id)) !== storageFingerprint(r),
    )
  })
}
function conflictingQuarantine(local: QuarantinedRecord[], incoming: QuarantinedRecord[]) {
  const rows = new Map(local.map((r) => [r.id, r]))
  return incoming.filter(
    (r) => rows.has(r.id) && storageFingerprint(rows.get(r.id)) !== storageFingerprint(r),
  ).length
}
function blocked(data: LearningData) {
  if (data.sessions.filter((s) => s.status === 'active').length > 1)
    return 'Có nhiều phiên chưa kết thúc. Hoàn thành các phiên tại nguồn rồi tạo lại bản sao; không tự ý đóng phiên.'
  if (data.dailyPlans.filter((p) => p.status === 'active').length > 1)
    return 'Có nhiều kế hoạch đang hoạt động. Hoàn thành kế hoạch trước khi gộp.'
  if (inspectLearningData(data).invalid.length)
    return 'Các quan hệ dữ liệu sau gộp không nhất quán. Hãy dùng bản sao đầy đủ hoặc khôi phục thay thế.'
  return null
}
export async function previewImport(
  database: StudyDatabase,
  candidate: ImportCandidate,
  mode: ImportMode,
): Promise<ImportPreview> {
  return database.transaction('r', database.tables, async () => {
    const local = await snapshot(database)
    const result = mergedData(local.data, candidate.backup.data, mode)
    const quarantineIds = new Set(local.quarantine.map((r) => r.id))
    return {
      candidate,
      mode,
      fingerprint: storageFingerprint(local),
      blocked:
        mode === 'merge' &&
        (conflictingHistory(local.data, candidate.backup.data) ||
          conflictingQuarantine(local.quarantine, candidate.backup.quarantine))
          ? 'Lịch sử hoặc lịch ôn cùng ID đã khác nhau. Gộp bị chặn để tránh làm sai quan hệ; hãy xuất cả hai bản và chọn khôi phục thay thế nếu phù hợp.'
          : blocked(result),
      counts: [
        ...LEARNING_TABLES.map((table) => {
          const rows = new Map(local.data[table].map((r) => [r.id, r]))
          const incoming = candidate.backup.data[table]
          return {
            table,
            current: rows.size,
            incoming: incoming.length,
            added: incoming.filter((r) => !rows.has(r.id)).length,
            conflicts: incoming.filter(
              (r) => rows.has(r.id) && storageFingerprint(rows.get(r.id)) !== storageFingerprint(r),
            ).length,
          }
        }),
        {
          table: 'quarantine',
          current: local.quarantine.length,
          incoming: candidate.backup.quarantine.length,
          added: candidate.backup.quarantine.filter((r) => !quarantineIds.has(r.id)).length,
          conflicts: conflictingQuarantine(local.quarantine, candidate.backup.quarantine),
        },
      ],
    }
  })
}
async function checkpoint(
  database: StudyDatabase,
  reason: RecoveryPoint['reason'],
  local: Awaited<ReturnType<typeof snapshot>>,
) {
  await database.recoveryPoints.put({
    id: 'last-change',
    token: crypto.randomUUID(),
    createdAt: Date.now(),
    reason,
    data: local.data,
    quarantine: local.quarantine,
  })
}
/** All-or-nothing commit. A preview is invalidated by any concurrent durable write. */
export async function commitImport(
  database: StudyDatabase,
  preview: ImportPreview,
  allowInvalid = false,
) {
  if (preview.candidate.invalid && !allowInvalid)
    throw new DataError('Cần xác nhận giữ các bản ghi lỗi trong kho cách ly.')
  return database.transaction('rw', database.tables, async () => {
    const local = await snapshot(database)
    if (local.data.sessions.some((s) => s.status === 'active'))
      throw new DataError('Kết thúc phiên đang học trước khi nhập dữ liệu.')
    if (storageFingerprint(local) !== preview.fingerprint)
      throw new DataError('Dữ liệu đã thay đổi sau khi xem trước. Hãy xem trước lại.')
    if (
      preview.mode === 'merge' &&
      (conflictingHistory(local.data, preview.candidate.backup.data) ||
        conflictingQuarantine(local.quarantine, preview.candidate.backup.quarantine))
    )
      throw new DataError('Lịch sử cùng ID đã khác nhau; không thể gộp an toàn.')
    const result = mergedData(local.data, preview.candidate.backup.data, preview.mode)
    const issue = blocked(result)
    if (issue) throw new DataError(issue)
    await checkpoint(database, 'import', local)
    for (const table of LEARNING_TABLES) {
      await database.table(table).clear()
      await database.table(table).bulkAdd(result[table])
    }
    const quarantined = preview.mode === 'merge' ? [...local.quarantine] : []
    const ids = new Set(quarantined.map((r) => r.id))
    quarantined.push(...preview.candidate.backup.quarantine.filter((r) => !ids.has(r.id)))
    await database.quarantine.clear()
    await database.quarantine.bulkAdd(quarantined)
    await database.timingLeases.clear()
  })
}
export async function resetData(database: StudyDatabase, fingerprint: string) {
  return database.transaction('rw', database.tables, async () => {
    const local = await snapshot(database)
    if (storageFingerprint(local) !== fingerprint)
      throw new DataError('Dữ liệu đã thay đổi. Hãy xác nhận lại thao tác đặt lại.')
    if (local.data.sessions.some((s) => s.status === 'active'))
      throw new DataError('Hãy kết thúc phiên học trước khi đặt lại.')
    await checkpoint(database, 'reset', local)
    for (const table of LEARNING_TABLES) await database.table(table).clear()
    await database.quarantine.clear()
    await database.timingLeases.clear()
  })
}
export async function inspectStorage(database: StudyDatabase) {
  return database.transaction('r', database.tables, async () => {
    const local = await snapshot(database)
    return {
      ...inspectLearningData(local.data),
      quarantine: local.quarantine,
      recovery: await database.recoveryPoints.get('last-change'),
      fingerprint: storageFingerprint(local),
    }
  })
}
export async function repairStorage(database: StudyDatabase, fingerprint: string) {
  return database.transaction('rw', database.tables, async () => {
    const local = await snapshot(database)
    if (storageFingerprint(local) !== fingerprint)
      throw new DataError('Dữ liệu đã thay đổi. Hãy kiểm tra lại.')
    const inspected = inspectLearningData(local.data)
    if (!inspected.invalid.length) return
    await checkpoint(database, 'repair', local)
    for (const r of inspected.invalid) {
      await database.quarantine.add({ ...r, id: crypto.randomUUID(), quarantinedAt: Date.now() })
      // IndexedDB can contain a corrupt numeric/Date key even though the domain uses strings.
      const originalKey = isObject(r.record) ? r.record.id : undefined
      if (originalKey === undefined)
        throw new DataError('Không xác định được khóa gốc; dữ liệu chưa bị thay đổi.')
      await database.table(r.table).delete(originalKey as string)
    }
  })
}
