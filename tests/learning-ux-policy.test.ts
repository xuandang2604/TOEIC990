import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { learningMilestones } from '../src/domain/milestones'
import type { Attempt, ReviewEvent } from '../src/domain/models'

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
function luminance(hex: string) {
  const rgb = hex
    .match(/[a-f\d]{2}/gi)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}
describe('observable milestones and static accessibility policies', () => {
  it('does not reward unanswered questions, repeated IDs or automatic mistake scheduling as recall', () => {
    const attempts: Attempt[] = Array.from({ length: 12 }, (_, i) => ({
      id: `session-${i}:q`,
      sessionId: `session-${i}`,
      questionId: 'q',
      selected: i < 2 ? 'A' : null,
      correct: false,
      confidence: null,
      occurredAt: 1000,
      source: 'practice',
    }))
    const events: ReviewEvent[] = Array.from({ length: 12 }, (_, i) => ({
      id: `e-${i}`,
      cardId: 'question:q',
      source: 'practice-error',
      grade: 1,
      occurredAt: 1000,
      nextDueAt: 2000,
    }))
    const milestones = learningMilestones(attempts, events, [])
    assert.equal(milestones.find((m) => m.id === 'ten-questions')?.count, 1)
    assert.equal(milestones.find((m) => m.id === 'ten-recalls')?.count, 0)
    assert.ok(milestones.every((m) => !m.achieved))
  })
  it('keeps normal reading, muted text, errors and primary button token pairs at 4.5:1 in each theme', () => {
    const themes = [
      css.match(/:root \{([\s\S]*?)\}/)![1],
      css.match(/:root\[data-theme='dark'\] \{([\s\S]*?)\}/)![1],
    ]
    for (const theme of themes) {
      const tokens = Object.fromEntries(
        [...theme.matchAll(/--([\w-]+):\s*(#[a-f\d]{6});/gi)].map((m) => [m[1], m[2]]),
      )
      for (const [foreground, background] of [
        ['ink', 'canvas'],
        ['ink', 'panel'],
        ['muted', 'canvas'],
        ['muted', 'panel'],
        ['error', 'error-soft'],
        ['button-text', 'sage'],
        ['brass-text', 'brass-soft'],
      ]) {
        const a = luminance(tokens[foreground]),
          b = luminance(tokens[background])
        assert.ok(
          (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
          `${foreground}/${background}: ${tokens[foreground]}/${tokens[background]}`,
        )
      }
    }
  })
  it('ships local manifest icons and explicitly handles reduced motion and coarse pointer targets', () => {
    const manifest = JSON.parse(
      readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
    )
    assert.equal(manifest.display, 'standalone')
    for (const icon of manifest.icons) {
      assert.ok(icon.src.startsWith('/icons/'))
      const data = readFileSync(new URL(`../public${icon.src}`, import.meta.url))
      assert.equal(`${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`, icon.sizes)
    }
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
    assert.match(css, /@media \(pointer: coarse\)/)
  })
})
