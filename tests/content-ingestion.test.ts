import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { contentBank } from '../src/content/catalog'
import { validateContentPackage, type ContentPackage } from '../src/content/ingestion'
import { ORIGINAL_PROVENANCE, type Question } from '../src/content/schema'

function sample(): ContentPackage {
  const q: Question = {
    ...structuredClone(contentBank.questions.find((q) => q.part === 5)!),
    id: 'original-bank:q1',
    prompt: 'The newly appointed coordinator explained the revised procedure ______.',
    provenance: { ...ORIGINAL_PROVENANCE, author: 'Independent author', revision: 'r1' },
  }
  return {
    format: 'study990.content',
    formatVersion: 1,
    id: 'original-bank',
    revision: 'r1',
    bank: { ...contentBank, questions: [q], stimuli: [], passages: [] },
    media: [],
    review: { reviewer: 'Owner/editor', date: '2026-10-21', verdict: 'approved' },
  }
}
describe('independently authored/licensed content ingestion', () => {
  it('accepts a namespaced original text-only package', () => {
    assert.deepEqual(validateContentPackage(sample(), contentBank), [])
  })
  it('rejects duplicate content, IDs, unknown skills, invalid answer keys and absent editorial approval', () => {
    const changes: ((pkg: ContentPackage) => void)[] = [
      (p) => {
        p.bank.questions[0].id = contentBank.questions[0].id
      },
      (p) => {
        p.bank.questions[0] = {
          ...structuredClone(contentBank.questions[0]),
          id: 'original-bank:q1',
        }
      },
      (p) => {
        p.bank.questions[0].answer = 'Z' as never
      },
      (p) => {
        p.bank.questions[0].skills = ['made-up' as never]
      },
      (p) => {
        if ('reviewer' in p.review) p.review.reviewer = ''
      },
    ]
    for (const change of changes) {
      const pkg = sample()
      change(pkg)
      assert.ok(validateContentPackage(pkg, contentBank).length > 0)
    }
  })
  it('requires explicit license metadata and disallows missing or escaping media paths', () => {
    const pkg = sample()
    pkg.bank.questions[0].provenance = {
      kind: 'licensed',
      author: 'Author',
      revision: 'r1',
      note: 'Licensed',
      provider: 'Publisher',
      sourceUrl: 'https://example.test/source',
      attribution: 'Author',
      license: 'CC-BY-4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    }
    assert.deepEqual(validateContentPackage(pkg, contentBank), [])
    pkg.bank.questions[0].provenance.licenseUrl = ''
    assert.ok(validateContentPackage(pkg, contentBank).length)
    const bad = sample()
    bad.media = [
      {
        path: '/media/../private.png',
        author: 'Author',
        sourceUrl: 'https://example.test/source',
        license: 'CC0-1.0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      },
    ]
    assert.ok(validateContentPackage(bad, contentBank).length)
  })
})
