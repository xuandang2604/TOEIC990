import { readFile, readdir, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { shellVersion, workerSource } from '../build/offline'

async function main() {
  const root = resolve('dist')
  const manifest = JSON.parse(
    await readFile(resolve(root, '.vite/manifest.json'), 'utf8'),
  ) as Record<string, { file: string; isEntry?: boolean; imports?: string[]; css?: string[] }>
  const initial = new Set<string>(),
    visited = new Set<string>()
  function visit(key: string) {
    if (visited.has(key)) return
    visited.add(key)
    const chunk = manifest[key]
    if (!chunk) throw new Error(`Missing manifest chunk ${key}`)
    initial.add(chunk.file)
    chunk.css?.forEach((file) => initial.add(file))
    chunk.imports?.forEach(visit)
  }
  Object.entries(manifest)
    .filter(([, entry]) => entry.isEntry)
    .forEach(([key]) => visit(key))
  let js = 0,
    gzip = 0
  for (const file of initial)
    if (file.endsWith('.js')) {
      const bytes = await readFile(resolve(root, file))
      js += bytes.length
      gzip += gzipSync(bytes).length
    }
  const sw = await readFile(resolve(root, 'sw.js'), 'utf8')
  const match = sw.match(/const FILES = (\[[^\n]+\]);/)
  if (!match) throw new Error('Missing generated precache inventory.')
  const files = JSON.parse(match[1]) as string[]
  const studioKeys = Object.keys(manifest).filter((key) =>
    /(?:src\/dev\/contentStudio|build\/studio)/i.test(key),
  )
  if (studioKeys.length)
    throw new Error('Development-only Content Studio leaked into production manifest.')
  const assets: { path: string; sha256: string }[] = []
  let packaged = 0
  for (const file of files) {
    if (file.includes('..') || file.startsWith('/')) throw new Error('Unsafe packaged asset.')
    packaged += (await stat(resolve(root, file))).size
    if (
      file.endsWith('.js') &&
      /Production renderer preview|Recorded editorial history|Content Studio accepts same-origin loopback/.test(
        await readFile(resolve(root, file), 'utf8'),
      )
    )
      throw new Error('Development-only authoring code leaked into production assets.')
    assets.push({
      path: file,
      sha256: createHash('sha256')
        .update(await readFile(resolve(root, file)))
        .digest('hex'),
    })
  }
  const expectedVersion = shellVersion(assets, workerSource(files, 'policy-version'))
  if (!sw.includes(`const CACHE = PREFIX + ${JSON.stringify(expectedVersion)};`))
    throw new Error('Shell cache identity does not cover current assets and worker policy.')
  for (const file of initial)
    if (!files.includes(file))
      throw new Error(`Initial dependency missing from offline inventory: ${file}`)
  const webmanifest = JSON.parse(await readFile(resolve(root, 'manifest.webmanifest'), 'utf8'))
  for (const icon of webmanifest.icons) {
    const iconPath = new URL(icon.src, 'https://study990.invalid/manifest.webmanifest')
    if (iconPath.origin !== 'https://study990.invalid')
      throw new Error('Manifest icons must be local.')
    const png = await readFile(resolve(root, iconPath.pathname.slice(1)))
    if (
      png.readUInt32BE(16) !== Number(icon.sizes.split('x')[0]) ||
      png.readUInt32BE(20) !== Number(icon.sizes.split('x')[1])
    )
      throw new Error('Icon dimensions do not match manifest.')
  }
  console.log(
    JSON.stringify(
      {
        initialJS: { bytes: js, gzipBytes: gzip },
        initialAssets: [...initial],
        packagedAssets: files.length,
        contentStudioExcluded: true,
        packagedBytes: packaged,
        javascriptChunks: (await readdir(resolve(root, 'assets'))).filter((f) => f.endsWith('.js'))
          .length,
        offlineInventory:
          'All packaged files exist; initial static dependency closure covered; manifest PNG dimensions match. Static audit only.',
      },
      null,
      2,
    ),
  )
}
main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
