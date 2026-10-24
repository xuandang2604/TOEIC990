import 'fake-indexeddb/auto'
import { performance } from 'node:perf_hooks'
import { localDictionary } from '../src/providers/dictionary'
import { searchReferences } from '../src/application/referenceCatalog'
import { db } from '../src/persistence/database'
import { readStudyData } from '../src/application/studyRepository'
import { captureEvidence } from '../src/domain/evidence'
import { questionById } from '../src/content/questions'

const percentile = (values: number[], fraction: number) =>
  [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * fraction)]
function timed(operation: () => unknown, count: number) {
  const samples: number[] = []
  for (let i = 0; i < count; i++) {
    const start = performance.now()
    operation()
    samples.push(performance.now() - start)
  }
  return { runs: count, medianMs: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95) }
}
async function main() {
  // fake-indexeddb is process-local. This never opens or resets the owner's browser database.
  const count = 2000,
    q = questionById.get('p5-efficiently')!,
    now = Date.now()
  const sessions = Array.from({ length: count }, (_, i) => ({
    id: `profile-${i}`,
    kind: 'practice' as const,
    mode: 'study' as const,
    questionIds: [q.id],
    cursor: 0,
    status: 'completed' as const,
    startedAt: now - i * 1000,
    completedAt: now - i * 1000,
  }))
  const captured = sessions.map((s) =>
    captureEvidence(
      {
        id: `${s.id}:${q.id}`,
        sessionId: s.id,
        questionId: q.id,
        selected: q.answer,
        correct: true,
        confidence: null,
        confidenceSource: 'not-provided',
        occurredAt: s.startedAt,
        source: 'practice',
      },
      q,
    ),
  )
  try {
    await db.sessions.bulkAdd(sessions)
    await db.attempts.bulkAdd(captured.map((c) => c.attempt))
    await db.skillEvidence.bulkAdd(captured.flatMap((c) => c.evidence))
    await readStudyData()
    const reads: number[] = []
    for (let i = 0; i < 10; i++) {
      const start = performance.now()
      await readStudyData()
      reads.push(performance.now() - start)
    }
    console.log(
      JSON.stringify(
        {
          environment: `Node ${process.version}, fake IndexedDB; warm algorithms, no browser measurements`,
          records: { sessions: count, attempts: count, evidence: count },
          lookup: timed(() => localDictionary.lookup('recommendations'), 10_000),
          quickSearch: timed(() => searchReferences('quy tắc'), 1000),
          readAndValidate: {
            runs: reads.length,
            medianMs: percentile(reads, 0.5),
            p95Ms: percentile(reads, 0.95),
          },
          heapUsedMB: process.memoryUsage().heapUsed / 1024 / 1024,
          limitation:
            'Heap is a single process sample, not a leak profile. Initial paint, mobile responsiveness and audio remain browser checks.',
        },
        null,
        2,
      ),
    )
  } finally {
    await db.delete()
  }
}
main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
