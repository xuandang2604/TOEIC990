import type { Plugin, ViteDevServer } from 'vite'
import { StudioStore, StudioFailure } from './studioStore'
import { inspectMediaFiles, referencedMedia } from './contentFiles'
import { auditContent } from '../src/content/quality'
import { validateContentPackage, type ContentPackage } from '../src/content/ingestion'
import { findNearDuplicates } from '../src/content/similarity'
import type { ContentBank } from '../src/content/validation'
import type { MockExam } from '../src/domain/contentInventory'
import type { IncomingMessage } from 'node:http'
import { miniExamQuestions } from '../src/domain/assessment'
import { resolve } from 'node:path'

export function studioRequestAllowed(
  host: string | undefined,
  origin: string | undefined,
  remote: string | undefined,
  write = false,
) {
  return Boolean(
    host &&
    /^(?:127\.0\.0\.1|localhost):\d+$/.test(host) &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote ?? '') &&
    (!origin || origin === `http://${host}`) &&
    (!write || origin === `http://${host}`),
  )
}
async function body(req: IncomingMessage) {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk)
    size += bytes.length
    if (size > 5 * 1024 * 1024) throw new StudioFailure(413, 'Request exceeds 5 MiB.')
    chunks.push(bytes)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
  } catch {
    throw new StudioFailure(400, 'Expected JSON body.')
  }
}
async function catalog(server: ViteDevServer) {
  const { contentBank } = (await server.ssrLoadModule('/src/content/catalog.ts')) as {
    contentBank: ContentBank
  }
  const { installedPackages } = (await server.ssrLoadModule('/src/content/generated/index.ts')) as {
    installedPackages: ContentPackage[]
  }
  const { mockExams } = (await server.ssrLoadModule('/src/content/mockExams.ts')) as {
    mockExams: MockExam[]
  }
  const { practiceQuestions, mockQuestions, allQuestions, starterQuestions, stimuli } =
    (await server.ssrLoadModule('/src/content/questions.ts')) as {
      practiceQuestions: ContentBank['questions']
      mockQuestions: ContentBank['questions']
      allQuestions: ContentBank['questions']
      starterQuestions: ContentBank['questions']
      stimuli: ContentBank['stimuli']
    }
  const mediaFailures = await inspectMediaFiles(
    referencedMedia(contentBank).map((path) => ({ path })),
    resolve(server.config.root, 'public'),
  )
  return {
    bank: contentBank,
    packages: installedPackages,
    audit: auditContent(
      contentBank,
      installedPackages,
      mockExams,
      allQuestions.map((q) => q.id),
      mediaFailures,
      [{ id: 'starter-mini-sample', questionIds: miniExamQuestions(starterQuestions, stimuli) }],
    ),
    counts: { practice: practiceQuestions.length, mock: mockQuestions.length },
  }
}
/** Only registered by serve + explicit content-studio mode. No application entry or build output. */
export function contentStudio(): Plugin {
  return {
    name: 'study990-local-content-studio',
    apply: 'serve',
    configureServer(server) {
      const store = new StudioStore(server.config.root)
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1')
        if (url.pathname !== '/__studio' && !url.pathname.startsWith('/__content-studio/'))
          return next()
        const json = (status: number, value: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(value))
        }
        try {
          if (
            !studioRequestAllowed(
              req.headers.host,
              req.headers.origin,
              req.socket.remoteAddress,
              req.method === 'POST',
            )
          )
            throw new StudioFailure(
              403,
              'Content Studio accepts same-origin loopback requests only.',
            )
          if (url.pathname === '/__studio' && req.method === 'GET') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(
              await server.transformIndexHtml(
                '/__studio',
                '<!doctype html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Content Studio · STUDY 990</title></head><body><div id="root"></div><script type="module" src="/src/dev/contentStudio/entry.tsx"></script></body></html>',
              ),
            )
            return
          }
          if (req.headers['x-study990-studio'] !== '1')
            throw new StudioFailure(403, 'Explicit Studio request header required.')
          if (req.method === 'GET' && url.pathname.endsWith('/catalog')) {
            json(200, await catalog(server))
            return
          }
          if (req.method === 'GET' && url.pathname.endsWith('/drafts')) {
            json(200, await store.list())
            return
          }
          if (req.method === 'GET' && url.pathname.endsWith('/draft')) {
            const row = await store.load(url.searchParams.get('id') ?? '')
            json(row ? 200 : 404, row ?? { error: 'Draft not found.' })
            return
          }
          if (req.method === 'POST') {
            if (!req.headers['content-type']?.startsWith('application/json'))
              throw new StudioFailure(415, 'JSON requests only.')
            const input = await body(req)
            if (url.pathname.endsWith('/draft')) {
              json(
                200,
                await store.save(
                  String(input.id ?? ''),
                  input.package,
                  Number(input.expectedRevision),
                ),
              )
              return
            }
            if (url.pathname.endsWith('/validate')) {
              const current = await catalog(server)
              const pkg = input.package as ContentPackage
              const previous = current.packages.find((p) => p.id === pkg?.id)
              const excluded = new Set(
                previous
                  ? [
                      ...previous.bank.questions,
                      ...previous.bank.stimuli,
                      ...previous.bank.passages,
                    ].map((r) => r.id)
                  : [],
              )
              const base: ContentBank = {
                ...current.bank,
                questions: current.bank.questions.filter((r) => !excluded.has(r.id)),
                stimuli: current.bank.stimuli.filter((r) => !excluded.has(r.id)),
                passages: current.bank.passages.filter((r) => !excluded.has(r.id)),
              }
              const issues = validateContentPackage(pkg, base, true)
              if (!issues.length) {
                issues.push(
                  ...(await inspectMediaFiles(pkg.media, resolve(server.config.root, 'public'))),
                )
                if (
                  previous &&
                  previous.bank.questions.some(
                    (q) => !pkg.bank.questions.some((n) => n.id === q.id),
                  )
                )
                  issues.push({
                    path: 'bank.questions',
                    message: 'An installed revision cannot remove historical question IDs.',
                  })
                if (
                  previous &&
                  previous.revision === pkg.revision &&
                  JSON.stringify(previous.bank) !== JSON.stringify(pkg.bank)
                )
                  issues.push({
                    path: 'revision',
                    message:
                      'Changed installed content needs a new revision, not an in-place rewrite.',
                  })
              }
              const near = issues.length
                ? []
                : findNearDuplicates({
                    ...base,
                    questions: [...base.questions, ...pkg.bank.questions],
                    stimuli: [...base.stimuli, ...pkg.bank.stimuli],
                    passages: [...base.passages, ...pkg.bank.passages],
                  })
              json(200, {
                issues,
                near,
                valid: !issues.length && !near.length,
                note: 'Machine validation is not semantic accuracy or human review.',
              })
              return
            }
          }
          json(404, { error: 'Unknown Studio operation.' })
        } catch (error) {
          if (!(error instanceof StudioFailure))
            console.error(
              'study990: content-studio boundary failed',
              error instanceof Error ? error.name : 'Unknown',
            )
          json(error instanceof StudioFailure ? error.status : 500, {
            error:
              error instanceof StudioFailure
                ? error.message
                : 'Content Studio could not complete this operation. Draft files are retained.',
          })
        }
      })
    },
  }
}
