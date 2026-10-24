import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { shellVersion, workerSource } from '../build/offline'

/** Service-worker policy simulation, not proof of installability or browser lifecycle behavior. */
function harness(failInstall = false) {
  const listeners = new Map<string, (event: unknown) => void>()
  const stores = new Map<string, Map<string, Response>>()
  let skipped = 0,
    claimed = 0,
    network = 0
  const caches = {
    async open(key: string) {
      const store = stores.get(key) ?? new Map<string, Response>()
      stores.set(key, store)
      return {
        async addAll(requests: Request[]) {
          for (const req of requests) {
            if (failInstall && req.url.endsWith('assets/page.js')) throw new Error('offline')
            store.set(req.url, new Response(`packaged:${req.url}`))
          }
        },
        async match(request: Request | string) {
          return store.get(typeof request === 'string' ? request : request.url)?.clone()
        },
      }
    },
    async keys() {
      return [...stores.keys()]
    },
    async delete(key: string) {
      return stores.delete(key)
    },
  }
  const source = workerSource(['index.html', 'assets/page.js', 'manifest.webmanifest'], 'current')
  runInNewContext(source, {
    URL,
    Request,
    caches,
    fetch: async () => {
      network++
      throw new Error('network unavailable')
    },
    self: {
      registration: { scope: 'https://study.test/' },
      addEventListener: (name: string, fn: (e: unknown) => void) => listeners.set(name, fn),
      skipWaiting: async () => {
        skipped++
      },
      clients: {
        claim: async () => {
          claimed++
        },
      },
    },
  })
  async function event(name: string, fields = {}) {
    let work: Promise<unknown> = Promise.resolve()
    listeners.get(name)!({
      ...fields,
      waitUntil: (promise: Promise<unknown>) => {
        work = promise
      },
    })
    await work
  }
  function request(url: string, mode = 'cors', method = 'GET') {
    let response: Promise<Response> | undefined
    listeners.get('fetch')!({
      request: { url, mode, method },
      respondWith: (promise: Promise<Response>) => {
        response = promise
      },
    })
    return response
  }
  return {
    event,
    request,
    stores,
    get skipped() {
      return skipped
    },
    get claimed() {
      return claimed
    },
    get network() {
      return network
    },
  }
}
describe('bounded packaged offline policy (Node VM)', () => {
  it('changes cache identity for worker-only repairs and keeps identical resource orderings stable', () => {
    const assets = [
      { path: 'index.html', sha256: 'abc' },
      { path: 'assets/page.js', sha256: 'def' },
    ]
    const policy = workerSource(
      assets.map((a) => a.path),
      'policy-version',
    )
    assert.equal(shellVersion(assets, policy), shellVersion([...assets].reverse(), policy))
    assert.notEqual(
      shellVersion(assets, policy),
      shellVersion(assets, policy + '\n// repaired lifecycle'),
    )
    assert.notEqual(
      shellVersion(assets, policy),
      shellVersion([{ ...assets[0], sha256: 'changed' }, assets[1]], policy),
    )
  })
  it('serves navigation and lazy packaged assets offline without growing the cache for arbitrary URLs', async () => {
    const worker = harness()
    await worker.event('install')
    assert.equal(worker.skipped, 0)
    const navigation = await worker.request('https://study.test/review?x=1', 'navigate')
    assert.match(await navigation!.text(), /index.html/)
    assert.match(
      await (await worker.request('https://study.test/assets/page.js'))!.text(),
      /page.js/,
    )
    assert.equal(worker.request('https://other.test/audio.mp3'), undefined)
    assert.equal(worker.request('https://study.test/api/history'), undefined)
    await assert.rejects(
      worker.request('https://study.test/assets/page.js?unbounded=1')!,
      /network/,
    )
    assert.equal(worker.request('https://study.test/api/history', 'cors', 'POST'), undefined)
    assert.equal(worker.stores.get('study990-shell-current')?.size, 3)
    assert.equal(worker.network, 1)
  })
  it('keeps the old shell and removes a partial new cache if installation fails', async () => {
    const worker = harness(true)
    worker.stores.set('study990-shell-previous', new Map())
    await assert.rejects(worker.event('install'), /offline/)
    assert.ok(worker.stores.has('study990-shell-previous'))
    assert.ok(!worker.stores.has('study990-shell-current'))
    assert.equal(worker.skipped, 0)
  })
  it('waits for an explicit update message and only cleans this app’s old caches', async () => {
    const worker = harness()
    worker.stores.set('other-app', new Map())
    for (const key of ['oldest', 'older', 'previous'])
      worker.stores.set(`study990-shell-${key}`, new Map())
    await worker.event('install')
    await worker.event('message', { data: { type: 'OTHER' } })
    assert.equal(worker.skipped, 0)
    await worker.event('message', { data: { type: 'ACTIVATE_UPDATE' } })
    assert.equal(worker.skipped, 1)
    await worker.event('activate')
    assert.deepEqual(
      [...worker.stores.keys()],
      ['other-app', 'study990-shell-previous', 'study990-shell-current'],
    )
    assert.equal(worker.claimed, 1)
  })
  it('can serve a previous tab’s hashed lazy chunk after another tab activates the new worker', async () => {
    const worker = harness()
    worker.stores.set(
      'study990-shell-previous',
      new Map([['https://study.test/assets/old-hash.js', new Response('previous-tab-chunk')]]),
    )
    await worker.event('install')
    await worker.event('activate')
    const response = await worker.request('https://study.test/assets/old-hash.js')
    assert.equal(await response!.text(), 'previous-tab-chunk')
    assert.equal(worker.network, 0)
  })
})
