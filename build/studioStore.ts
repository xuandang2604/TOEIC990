import {
  mkdir,
  readFile,
  rename,
  rm,
  rmdir,
  realpath,
  lstat,
  writeFile,
  readdir,
  stat,
} from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'
export interface StudioDraft {
  id: string
  revision: number
  updatedAt: string
  package: unknown
}
export class StudioFailure extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
function slug(id: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 100)
    throw new StudioFailure(400, 'Invalid draft ID.')
}
function inside(root: string, path: string) {
  const rel = relative(root, path)
  return !rel.startsWith('..') && !isAbsolute(rel)
}
function portable(v: unknown, depth = 0) {
  if (depth > 32) throw new StudioFailure(422, 'Draft exceeds maximum JSON depth.')
  if (Array.isArray(v)) v.forEach((x) => portable(x, depth + 1))
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      if (['__proto__', 'constructor', 'prototype'].includes(k))
        throw new StudioFailure(422, 'Unsafe JSON key.')
      portable(x, depth + 1)
    }
}
export class StudioStore {
  private readonly workspace: string
  constructor(workspace: string) {
    this.workspace = workspace
  }
  private async folder() {
    const root = await realpath(this.workspace)
    const content = await realpath(resolve(root, 'content'))
    if (!inside(root, content)) throw new StudioFailure(403, 'Content directory escapes workspace.')
    const target = resolve(content, 'studio-drafts')
    await mkdir(target, { recursive: true })
    const folder = await realpath(target)
    if (!inside(content, folder))
      throw new StudioFailure(403, 'Draft directory escapes content root.')
    return folder
  }
  async list() {
    const folder = await this.folder()
    return (await readdir(folder))
      .filter((n) => /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(n))
      .map((n) => n.slice(0, -5))
      .sort()
  }
  async load(id: string): Promise<StudioDraft | undefined> {
    slug(id)
    const folder = await this.folder(),
      path = resolve(folder, id + '.json')
    try {
      if ((await lstat(path)).isSymbolicLink() || !inside(folder, await realpath(path)))
        throw new StudioFailure(403, 'Draft links are not supported.')
      if ((await stat(path)).size > 5 * 1024 * 1024)
        throw new StudioFailure(413, 'Draft exceeds 5 MiB.')
      let row: StudioDraft
      try {
        row = JSON.parse(await readFile(path, 'utf8')) as StudioDraft
      } catch (error) {
        if (error instanceof SyntaxError)
          throw new StudioFailure(422, 'Saved draft is not valid JSON; original file retained.')
        throw error
      }
      if (row.id !== id || !Number.isSafeInteger(row.revision) || row.revision < 1)
        throw new StudioFailure(422, 'Invalid saved draft envelope; original file retained.')
      return row
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        return undefined
      throw error
    }
  }
  async save(id: string, pkg: unknown, expectedRevision: number) {
    slug(id)
    portable(pkg)
    if (
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 0 ||
      !pkg ||
      typeof pkg !== 'object' ||
      Array.isArray(pkg) ||
      Buffer.byteLength(JSON.stringify(pkg)) > 5 * 1024 * 1024
    )
      throw new StudioFailure(422, 'Invalid or oversized draft.')
    const folder = await this.folder(),
      lock = resolve(folder, '.writer-lock')
    try {
      await mkdir(lock)
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')
        throw new StudioFailure(
          409,
          'Draft writer busy. Retry; inspect a stale lock only after the writer exits.',
        )
      throw error
    }
    const temp = resolve(folder, `${id}.${crypto.randomUUID()}.tmp`)
    try {
      const current = await this.load(id)
      if ((current?.revision ?? 0) !== expectedRevision)
        throw new StudioFailure(
          409,
          'Draft changed in another editor. Your unsaved text is retained.',
        )
      const row: StudioDraft = {
        id,
        revision: expectedRevision + 1,
        updatedAt: new Date().toISOString(),
        package: pkg,
      }
      await writeFile(temp, JSON.stringify(row, null, 2) + '\n', { flag: 'wx' })
      if ((await realpath(folder)) !== folder)
        throw new StudioFailure(403, 'Draft directory changed.')
      await rename(temp, resolve(folder, id + '.json'))
      return row
    } finally {
      await rm(temp, { force: true })
      await rmdir(lock)
    }
  }
}
