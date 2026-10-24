import { readFile, realpath, stat } from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'
import { createHash } from 'node:crypto'
export async function inspectMediaFiles(
  media: { path: string; sha256?: string }[],
  publicFolder: string,
) {
  const root = await realpath(publicFolder)
  const issues: { path: string; message: string }[] = []
  for (const item of media) {
    if (
      !/^\/media\/[a-z0-9._/-]+$/i.test(item.path) ||
      item.path.split('/').some((p) => p === '..')
    ) {
      issues.push({ path: item.path, message: 'Unsafe media path.' })
      continue
    }
    try {
      const path = await realpath(resolve(root, `.${item.path}`))
      const rel = relative(root, path)
      if (rel.startsWith('..') || isAbsolute(rel)) {
        issues.push({ path: item.path, message: 'Media escapes public root.' })
        continue
      }
      const info = await stat(path)
      if (!info.isFile() || !info.size || info.size > 24 * 1024 * 1024) {
        issues.push({ path: item.path, message: 'Empty, invalid or oversized media file.' })
        continue
      }
      if (
        item.sha256 &&
        createHash('sha256')
          .update(await readFile(path))
          .digest('hex') !== item.sha256
      )
        issues.push({ path: item.path, message: 'Media SHA-256 mismatch.' })
    } catch (error) {
      issues.push({
        path: item.path,
        message:
          error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
            ? 'Media file not found.'
            : 'Cannot read media file.',
      })
    }
  }
  return issues
}
export function referencedMedia(value: unknown): string[] {
  if (Array.isArray(value)) return [...new Set(value.flatMap(referencedMedia))]
  if (value && typeof value === 'object')
    return [
      ...new Set(
        Object.entries(value).flatMap(([key, v]) =>
          key === 'src' && typeof v === 'string' ? [v] : referencedMedia(v),
        ),
      ),
    ]
  return []
}
