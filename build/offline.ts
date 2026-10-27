import type { Plugin } from 'vite'
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'

/** No user data, external responses or arbitrary navigation URLs are cached here. */
export function workerSource(files: string[], version: string) {
  return `/* STUDY 990 packaged assets; generated at build time. */
const scopePath = new URL(self.registration.scope).pathname;
const PREFIX = scopePath === '/' ? 'study990-shell-' : 'study990-project-shell-' + encodeURIComponent(scopePath) + '-';
const CACHE = PREFIX + ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files)};
const urls = FILES.map(path => new URL(path, self.registration.scope).href);
const allowed = new Set(urls);
self.addEventListener('install', event => event.waitUntil((async () => {
  try {
    const cache = await caches.open(CACHE);
    await cache.addAll(urls.map(url => new Request(url, { cache: 'reload' })));
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE);
  // One previous shell is retained for an already-open tab. Never touch IndexedDB.
  for (const key of keys.slice(0, -1)) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('notificationclick', event => {
  if (event.notification.tag !== 'study990-vocabulary-review') return;
  event.notification.close();
  const reviewUrl = new URL('./#/review/vocabulary', self.registration.scope).href;
  // A separate tab preserves unsaved writing and active sessions in existing tabs.
  event.waitUntil(self.clients.openWindow(reviewUrl));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== new URL(self.registration.scope).origin || !url.href.startsWith(self.registration.scope)) return;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const shell = await caches.open(CACHE);
      return (await shell.match(new URL('index.html', self.registration.scope).href)) || fetch(req);
    })());
  } else if (allowed.has(url.href) || url.pathname.startsWith(new URL('assets/', self.registration.scope).pathname)) {
    event.respondWith((async () => {
      const shell = await caches.open(CACHE);
      const current = await shell.match(req);
      if (current) return current;
      // A previous tab may request its own hashed lazy chunk after an explicit update in another tab.
      const previous = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE);
      for (const key of previous.slice(-1)) {
        const cached = await (await caches.open(key)).match(req);
        if (cached) return cached;
      }
      return fetch(req);
    })());
  }
});
`
}
export function shellVersion(assets: { path: string; sha256: string }[], workerPolicy: string) {
  const sorted = [...assets].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
  return createHash('sha256')
    .update(JSON.stringify(sorted))
    .update(workerPolicy)
    .digest('hex')
    .slice(0, 20)
}
export function offlineAssets(): Plugin {
  let output = ''
  return {
    name: 'study990-offline-assets',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      output = resolve(config.root, config.build.outDir)
    },
    async closeBundle() {
      async function walk(path: string): Promise<string[]> {
        const entries = await readdir(path, { withFileTypes: true })
        return (
          await Promise.all(
            entries.map(async (entry) => {
              if (entry.isSymbolicLink()) throw new Error('PWA assets must not be symlinks.')
              const full = resolve(path, entry.name)
              return entry.isDirectory() ? walk(full) : [full]
            }),
          )
        ).flat()
      }
      const paths = (await walk(output))
        .filter(
          (path) =>
            !path.endsWith('.map') &&
            relative(output, path) !== 'sw.js' &&
            !relative(output, path).startsWith('.vite'),
        )
        .sort()
      const sizes = await Promise.all(paths.map((path) => stat(path)))
      if (paths.length > 1000 || sizes.reduce((n, s) => n + s.size, 0) > 30 * 1024 * 1024)
        throw new Error('Packaged offline budget exceeded: 1000 files / 30 MB.')
      const assets: { path: string; sha256: string }[] = []
      for (const path of paths) {
        assets.push({
          path: relative(output, path).split(sep).join('/'),
          sha256: createHash('sha256')
            .update(await readFile(path))
            .digest('hex'),
        })
      }
      const files = paths.map((path) => relative(output, path).split(sep).join('/'))
      // Worker-only changes also need a fresh cache; failed installation must never delete the active shell.
      const version = shellVersion(assets, workerSource(files, 'policy-version'))
      await writeFile(resolve(output, 'sw.js'), workerSource(files, version))
      console.info(
        `PWA: ${files.length} packaged assets, ${(sizes.reduce((n, s) => n + s.size, 0) / 1024 / 1024).toFixed(2)} MB; shell ${version}`,
      )
    },
  }
}
