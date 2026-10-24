# Task 06–07 validation handoff

Historical evidence. Current release-candidate results and schema are in [FINAL_AUDIT.md](../FINAL_AUDIT.md); the figures below describe the earlier Task 06–07 pass.

Date: **21 October 2026**. Existing React/TypeScript/Vite/Dexie application and bundled content retained. No deployment, publishing, browser-data reset or real-user migration was performed. This directory has no Git metadata; no clean-diff/commit claim is made.

## Gates executed

| Gate                       | Result                                         | Evidence boundary                                                                        |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run check:tests`      | Pass                                           | TypeScript for application, tests, build helpers and scripts                             |
| `npm test`                 | **52 passed / 0 failed / 0 skipped**, 8 suites | Node runner; static React rendering, fake IndexedDB, mocked speech and service-worker VM |
| `npm run build`            | Pass, no reported build warnings               | `tsc -b` plus production Vite bundle, generated service worker and inventory             |
| `npm run validate:content` | Pass, 52 questions, no issues                  | Bundled structural/reference validation; not independent human editorial review          |
| `npm run audit:build`      | Pass                                           | Actual output files, initial static imports, offline inventory and PNG dimensions        |
| `npm run profile:local`    | Completed                                      | Warm algorithms/fake storage in Node, not a browser profile                              |

The old test that expected 42 total questions was stale after Task 05's expansion. It now checks **52**, while retaining the separate 34 normal-practice count and all seven Part checks. No learning question was removed to satisfy a test.

## Exercised reliability paths

- Every bundled question/stimulus renders to static HTML; answer keys, omissions, result totals, shared groups, Part 6 mapping, Part 7 passages and Study/Exam assistance policy retain existing coverage.
- Database v1, v2, v3, v4 and v5 open as v6 without replacing the saved preference/card/due values. Existing legacy-attempt migration tests also pass.
- Backup export/import/reopen round trip retains pinned FSRS state/history, initial explanation/revision, Tutor draft and unfinished question draft/cursor. Unknown content IDs remain historical data rather than being regraded or deleted.
- Integrity/version/shape/unsafe-key failures reject before writes. Identical merge is idempotent; divergent linked history/FSRS state blocks. Active sessions and stale previews block changes.
- Corrupt rows stay durable and are excluded from the learning view; explicit repair quarantines original values. Non-finite stored values export with type tags rather than JSON silently converting NaN to null. Orphan parent/child chains are excluded together.
- Injected write failure rolls back replacement and its checkpoint. Reset can be recovered through an exported prior checkpoint. Replacing a checkpoint invalidates an old preview even if current learning data is identical.
- Simulated service worker serves packaged navigation/lazy assets offline, leaves external/API/POST requests alone, avoids unbounded response caching, removes partial failed installs, waits for an explicit activation message, bounds app cache history and serves the previous version's hashed lazy chunk.
- Milestones exclude omissions/repeated question IDs/automatic mistake scheduling. Selected text/primary/error/brass token pairs meet 4.5:1 in light/dark themes. Manifest PNG dimensions match declared sizes.

No fake-IndexedDB test touched a browser profile. The local profiler also uses process-local fake IndexedDB and deletes only that simulated database at exit.

## Current production artifact

| Measurement                                  | Value                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Initial static JavaScript dependency closure | **673,192 bytes**, **211,968 bytes gzip**                          |
| Main CSS                                     | 110.08 kB, 21.45 kB gzip (Vite report)                             |
| Packaged offline inventory                   | **66 files**, **1,392,575 bytes** (~1.33 MiB)                      |
| JavaScript chunks                            | 31, including lazy practice/reference/Tutor/data/dictionary routes |
| Generated shell cache version                | `f6f9c219410c8925338a`                                             |

The audit confirms each inventory file exists and every initial static dependency is covered. Source maps/build manifest metadata are not precached. These byte counts and cache version describe this build; regenerate after source/assets change. The worker's production budget remains 1,000 packaged files / 30 MiB, current plus one previous cache.

An uncontended Node 24.16.0 profiler run with 2,000 sessions, 2,000 snapshot attempts and 2,000 evidence rows measured:

| Scenario                                  | Median    | p95       |
| ----------------------------------------- | --------- | --------- |
| Warm local word lookup (10,000 runs)      | 0.0002 ms | 0.0004 ms |
| Warm quick search (1,000 runs)            | 0.0076 ms | 0.0127 ms |
| Full fake-IDB read + validation (10 runs) | 35.97 ms  | 43.46 ms  |

Process heap at one sample was 70.6 MiB. Timings are environment-dependent; an earlier run competing with build/tests was slower. Neither these numbers nor bundle size prove initial paint, low-memory mobile behavior, memory stability or real media latency.

## Remaining owner acceptance

**The automatic approval reviewer rejected the prior request to open the browser because its usage limit was reached.** It was not bypassed. No real-browser audit, screenshots, audio playback, screen-reader pass, installation, actual offline refresh or multi-tab browser update test was completed.

Run the current manual checklist in [OWNER_REVIEW.md](OWNER_REVIEW.md) after browser access is available. Task 06's visual/accessibility audit remains open. Static colors/semantics and simulated worker policy are partial evidence, not WCAG certification or proof of production PWA installability.

Keep an exported file before upgrading the owner's actual profile. Backups are bounded to 25 MiB/100,000 records; one rolling checkpoint is not an independent backup. Unopenable storage, unsupported cyclic corrupt objects, browser eviction, very large histories and a tab older than the retained previous shell remain explicit boundaries in [LOCAL_FIRST.md](LOCAL_FIRST.md). There is no sync/backend or official-score prediction.

For local production use, the owner can run `npm run preview` after building and open **http://127.0.0.1:4173**. Development 5173 is a different storage origin. Installation behavior at future hosting requires HTTPS and its own verification; no hosting was configured.

Architecture/contracts: [LOCAL_FIRST.md](LOCAL_FIRST.md), [CONTENT_INGESTION.md](CONTENT_INGESTION.md), [UX_REFINEMENT.md](UX_REFINEMENT.md).
