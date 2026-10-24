# FINAL AUDIT — STUDY 990

**Historical Task 08 snapshot.** The question-bank expansion supersedes the counts, test totals, bundle sizes and full-mock status below. Current evidence: [QUESTION_BANK_EXPANSION_REPORT.md](QUESTION_BANK_EXPANSION_REPORT.md).

**Task 08 · 21 October 2026 · localhost release candidate**

The existing React/TypeScript application, content IDs and learning architecture were retained. This pass repaired data/recovery and integration defects, added focused regression coverage, removed an unused dependency and updated the operating documentation. No deployment, cloud service, owner-profile reset or real-user migration was performed.

**Decision:** the source and production artifact pass the available automated gates. Core learning workflows are verified at the domain/application/provider boundary. This is a **localhost candidate awaiting browser acceptance**, not a claim of fully verified UI, accessibility, installation or production readiness. No P0 was observed within the executed scope; unexecuted browser scenarios remain unknown.

## Status vocabulary

- **IMPLEMENTED** — code and connected UI exist; this alone does not establish runtime correctness.
- **VERIFIED** — directly exercised by the named check, within its stated environment.
- **PARTIAL** — intentionally limited coverage, data scale or capability.
- **NOT TESTED** — no direct runtime evidence for that behavior.
- **BLOCKED** — a named environment/approval restriction prevented a requested check.

## 1. Implemented features and functional coverage

| Area | Implementation / verification | Partial or unverified boundary |
| --- | --- | --- |
| First use / Daily Focus | IMPLEMENTED: preferences, real activity, goal and resumable 10/20/40-minute plans. VERIFIED: default state, preference persistence, plan/practice transactions and progress calculations. | First paint, settings dialog and complete browser onboarding NOT TESTED. Recommendations use documented heuristics, not calibrated AI. |
| TOEIC practice | IMPLEMENTED: seven Parts, filters, shared stimuli, question navigation, answer submission, explanations, transcript, reusable audio, saved questions, mistakes, results and resume. VERIFIED: all 52 question/stimulus renderings in static HTML, answer validation, grouped questions, feedback gating and persistence. | PARTIAL sample bank. Browser media playback, image-error rendering and touch/keyboard interaction NOT TESTED. |
| Exam / mini mock | IMPLEMENTED: 19 questions / 20 minutes, absolute saved deadline, one-pass listening policy, assisted recovery, reading revisit, final submission and detailed review. VERIFIED: mode restrictions, omissions in denominator, deadline/reopen, idempotent transactional scoring and per-Part totals. | No official TOEIC score or 200-question exam. Speech synthesis cannot recreate a standardized recorded exam. |
| Dictionary / search | IMPLEMENTED: 88 curated entries, detail pages, local word/forms index, explicit contextual lookup, Ctrl/Cmd+K, keyboard search, highlighting/recent searches and save/review. VERIFIED: lookup/search/save and subsequent FSRS recall through application/provider tests. | PARTIAL lexical coverage; no network dictionary/translation. Real selection, sheet/popover focus, detail-page interaction, pronunciation and passage-position return NOT TESTED. |
| Grammar | IMPLEMENTED: 12 lessons, Vietnamese guidance, structures, examples, traps, 24 mini questions and cross-links. VERIFIED: content references and transactional grammar evidence/mistakes without losing the active TOEIC session. | Real search-to-lesson/navigation/readability journey NOT TESTED. Content still needs independent specialist review. |
| Adaptive review / analytics | IMPLEMENTED: hierarchical skills, evidence, optional confidence, mistake annotations, deterministic FSRS, due reviews and real progress. VERIFIED: review deduplication, exact scheduler/history round trip, plan integration and no achievement for omitted/repeated items. | Default FSRS parameters; no personal retention calibration, semantic diagnosis or predicted TOEIC score. Very long histories still need indexed aggregates. |
| Feynman Tutor | IMPLEMENTED: attempt → explanation → authored guidance → revision → transfer → result; five teaching modes and reference links. VERIFIED: the application sequence, supported guidance, revision gate, transfer scoring and no mastery/evidence gain merely from writing. | PARTIAL: 9 profiles, 27 self-selected reason branches, 28 targeted questions. No arbitrary-text semantic understanding, live AI or paid API. |
| Data management | IMPLEMENTED: IndexedDB v7, validation, quarantine, format-1/schema-7 backup, compatible schema-6 input, legacy adapters, merge/replace/reset, one recovery checkpoint and emergency Tutor copy. VERIFIED on fake IndexedDB: upgrades v1–v6, atomic rollback, stale previews, duplicate/conflict behavior and restore integrity. | Owner browser database, actual file downloads, browser quota/eviction and real multi-tab timing NOT TESTED. Backups are unencrypted. |
| Editorial UX / accessibility | IMPLEMENTED: retained ivory/navy/sage/brass design, local fonts, themes, focus mode, native controls, focus/reveal handling, responsive CSS and reduced motion. VERIFIED: selected theme contrast pairs, motion/coarse-pointer rules and icon dimensions by static tests. | Desktop/tablet/mobile visual audit, screen readers, all composited colors, real target measurements and WCAG 2.2 AA conformance NOT TESTED. |
| PWA / updates | IMPLEMENTED: manifest/icons, bounded packaged cache, explicit update, dirty/active guards and previous-cache chunk fallback. VERIFIED: generated output and worker policy in Node VM. | Real service-worker registration, installation, offline navigation/audio, update across tabs and browser install prompt NOT TESTED. |

The working domain/service paths above are connected to existing UI. They are not substitute evidence for a browser end-to-end acceptance result.

## 2. Architecture and ownership

```text
features / components → application use cases → domain + content + persistence
providers             → explicit dictionary, Tutor and browser-speech contracts
build/offline.ts      → packaged-resource cache only; never learner IndexedDB
```

- **Content** is bundled and immutable; schema, IDs, provenance, skills, references and media are validated. Question rendering is separate from answer assessment.
- **Domain** contains assessment, taxonomy/evidence, analytics, daily recommendations and one pinned FSRS adapter. It imports neither React nor Dexie. Question prioritization and daily-plan selection are different selection policies; neither is a second repetition scheduler.
- **Application repositories** own state transitions, transaction boundaries, operation IDs, expected versions/due dates and practice/Tutor integration. React consumes the validated live snapshot; working drafts are kept separate from evidence.
- **Persistence** owns versioned Dexie stores, shared record inspection, imports and recovery. v7 is additive, retaining earlier migrations and existing values. The new interrupted state prevents an unavailable restored session from permanently monopolizing the single active-session slot.
- **Providers** keep local lookup, authored Tutor output validation and platform speech replaceable without frontend secrets. Future remote providers require a secure backend and licensing.
- **UI** retains focused feature pages and shared media/reference/recovery components. The largest modules are predominantly authored datasets or cohesive record/backup logic; ProgressPage remains a sizable presentation module. No broad architecture rewrite or arbitrary file splitting was performed.

**Executed AST audit:** 106 TypeScript modules, 377 local runtime import edges; no cycles, forbidden domain imports or flagged credential/unsafe-execution patterns. Erased type imports are not runtime edges. This is a defined static rule set, not a formal proof of architectural or security correctness.

Removed unused `motion` (and its now-unneeded packages); CSS transitions remain. No framework or unrelated dependency upgrade was introduced. No duplicate learning algorithm was added.

The directory has no Git metadata, so no clean-worktree/commit assertion is made. `docs/audit/task08-before.json` records the pre-repair source hashes; `docs/audit/task08-changes.json` records the final source-level change inventory. Generated `dist`, `node_modules` and TypeScript build caches are excluded. Work targeted this application; no sibling application/infrastructure was edited.

## 3. Executed commands and outcomes

Environment: **Windows / PowerShell, Node v24.16.0, npm 11.13.0**. Tests use Node's runner, `fake-indexeddb`, static React rendering, mocked speech and a service-worker VM. They do not attach to or reset an owner's browser store.

| Command / check | Actual outcome | Evidence boundary |
| --- | --- | --- |
| `npm ci --offline --ignore-scripts --no-audit --no-fund` | FAILED: `ENOTCACHED` for Vite tarball | Offline package cache was incomplete; recovered below. |
| `npm ci --ignore-scripts --no-audit --no-fund` | Initial restricted attempt stalled and was stopped; approved retry PASSED, 91 packages installed | Lockfile restore, lifecycle scripts disabled. No claim that offline installation succeeded. |
| `npm uninstall motion --offline --ignore-scripts --no-audit --no-fund` | PASSED; removed 4 unused packages | Manifest and lockfile updated together. |
| `npm ls --depth=0` | PASSED | Current direct dependency graph resolves. |
| `npm audit --json` | PASSED; 0 known vulnerabilities across all severities | Registry advisory snapshot at audit time, not a complete security assessment. |
| `npm run check` | PASSED | App/build TypeScript project validation. |
| `npm run check:tests` | PASSED | Application, tests, build helpers and scripts type-check. |
| `npm run lint` | PASSED after formatting fixes | Prettier check plus explicit architecture/security rules; **not ESLint**. |
| `npm test` | **PASSED: 66 tests, 0 failures, 0 skipped; 10 suites** | Includes 11 new application/provider journey/regression tests. No browser E2E. |
| `npm run validate:content` | PASSED; 52 questions, no structural issues | Schema/reference/duplicate checks; not independent educational certification. |
| `npm run build` | PASSED, no reported build warnings | Full production TypeScript + Vite bundle after functional repairs. |
| `npm run audit:build` | PASSED | Actual assets, complete initial static dependency closure, cache identity including worker policy, offline inventory and PNG dimensions. |
| `npm run profile:local` | COMPLETED | Warm Node algorithms and simulated storage, not browser startup or mobile performance. |
| `npm run preview` | CLI launch VERIFIED at `127.0.0.1:4173`; owned session then stopped | Not evidence that an HTTP client/browser could load the app. No listener on 4173 was reported by the subsequent local port inspection. |
| HTTP asset smoke probe | **BLOCKED**: restricted fetch `EACCES`; approved HTTP-only probe `ETIMEDOUT` | No successful HTTP asset/MIME assertions. This was not browser control or application-JavaScript execution. |
| Browser E2E / screenshots / live accessibility / installed offline app | **BLOCKED / NOT TESTED** | The prior isolated-browser opening was rejected by automatic approval review because its usage limit was reached. No bypass or alternate browser control was attempted. |

Initial formatting mismatches in the pre-existing test/index files were fixed rather than suppressing the lint gate. All completed test assertions passed after repairs. Installation and HTTP environment failures are explicitly retained above instead of being presented as successful gates.

### Actual production output

| Measurement | Value |
| --- | ---: |
| Initial static JavaScript dependency closure | 677,713 bytes; 213,394 bytes gzip |
| Main CSS | 110.24 kB; 21.47 kB gzip (Vite report) |
| Packaged offline inventory | 66 files; 1,398,501 bytes |
| JavaScript chunks | 31, including lazy practice/reference/Tutor/data/dictionary routes |
| Shell cache identity | `f9092444fe8fc3d049e5` |

The initial closure is still substantial because bundled content, React, storage and validation participate in startup. Route splitting does not imply a tiny initial application. No size reduction is attributed to removing an already-unused rendering dependency.

Current Node profile: 10,000 warm lookups median **0.0002 ms**, p95 **0.0004 ms**; 1,000 searches median **0.0072 ms**, p95 **0.0113 ms**; 10 full read/validation runs with 2,000 sessions + 2,000 attempts + 2,000 evidence rows median **39.13 ms**, p95 **44.76 ms**. One heap sample was **152.13 MiB**. These are synthetic process measurements, not cold load, real IDB disk cost, a browser memory profile or a leak conclusion. Historical Task 06–07 numbers are not treated as a controlled performance comparison.

## 4. Functional journeys A–H

| Journey | Directly exercised | Remaining acceptance |
| --- | --- | --- |
| A — First launch | VERIFIED at application boundary: defaults → saved goal/preferences → daily plan → grouped exercise → real progress → completed plan. | Actual first browser launch, loading/settings UI and rendered feedback NOT TESTED. |
| B — Practice | VERIFIED: grouped selection, correct/incorrect scoring, explanation snapshot, saved question/mistake, finish/resume/reopen and no duplicate attempt. Existing tests cover Exam/Study differences. | Real Part/skill controls, audio, route/focus and results interactions NOT TESTED. |
| C — Dictionary | VERIFIED: normalized local lookup/search → save → due recall → persistent review state. | Detail-page navigation and US/UK audio in a real browser NOT TESTED. |
| D — Contextual lookup | IMPLEMENTED and source-inspected: explicit selection trigger, local lookup, save and return context. Provider lookup/save is covered independently. | **NOT TESTED end to end:** DOM selection, popover/sheet, touch/keyboard and restoring the exact reading position. |
| E — Grammar | VERIFIED: grammar answer → correct evidence/mistake once; active TOEIC session retained. Lesson/reference structure validated and reviewed in source. | Search → lesson → visual exercise → return-to-question browser flow NOT TESTED. |
| F — Adaptive review | VERIFIED: due record → rating → exact FSRS/history update → database close/reopen → unchanged due/state. | Actual browser restart, OS eviction and real concurrent tabs NOT TESTED. |
| G — Feynman Tutor | VERIFIED: incorrect answer → initial explanation → authored guidance in all five modes → required revision → transfer → result. Writing alone leaves skill evidence and review scheduling unchanged. | Notebook interaction, editor focus and cross-page return in browser NOT TESTED. No semantic grading is claimed. |
| H — Data management | VERIFIED in isolated fake IDB: export → controlled reset → preview/replace import → exact restored learning/FSRS/Tutor/draft records; conflicts, invalid data, stale preview and rollback exercised. | Actual download/file picker, real disk/quota and owner-profile restore NOT TESTED. |

## 5. Defects found and repaired

Severity is an engineering assessment of the reproducible fixture/source path, not a claim that an incident occurred in an owner's profile.

| ID / severity | Root cause | Repair and regression evidence |
| --- | --- | --- |
| S990-01 · P1 | A valid restored active session could reference content absent from the current bank. Rendering stopped while every new-session start resumed that session; import/reset also refused active sessions. | Added explicit `interrupted/content-unavailable` terminal state, guarded recovery action, retained history/responses/drafts, archived linked plans and visible read-only history. Late commands cannot grade/reopen it. Tests prove closure releases the slot without fake completion, scoring or FSRS changes, and cannot close healthy sessions. |
| S990-02 · P1 | Imported records could have a modern correctness flag contradicting their captured answer, malformed option sets or authored guidance attached to a different question/revision/reason. This could contaminate evidence despite structurally valid JSON. | Shared inspection verifies modern answer/snapshot consistency, exact A–C/A–D options, metadata, grammar outcome and Tutor bindings. Invalid parent chains are excluded/can be quarantined with originals. Tests retain legacy-current-content outcomes rather than regrading against reconstructed newer content. |
| S990-03 · P1 | A failed Tutor write retained an emergency memory copy, but root storage/validation/render failure could unmount the only accessible recovery UI and its unload guard. | Moved recovery presentation to a shared component independent of the study context/DB; exposed it on root failure screens with unload protection and explicit copy acknowledgement before discard. Memory-store lifecycle is tested; actual failure-screen interaction remains browser acceptance. |
| S990-04 · P2 | Cache version hashed asset bytes but omitted worker policy. A worker-only repair reused the active cache key; a failed install could then delete that cache as if it were partial new state. | Cache identity now includes sorted asset paths/digests and generated worker policy. Policy-only changes produce a fresh namespace; existing failure/previous-cache tests and output audit pass. |
| S990-05 · P2 | A conditional example involving a supplier left a possible willingness reading for `will`; a subjunctive exercise did not explicitly state the intended construction. Duplicate option text/content and mismatched passage ownership were not uniformly rejected. | Made the conditional subject an automated system, clarified the mandative-subjunctive task and scope, retained answer keys/IDs and updated affected content revisions. Shared duplicate signatures and option/passage checks now protect bundled and ingested content. Malformed-field regressions do not crash validation. |
| S990-06 · P2 | README still said no service worker and mixed obsolete storage/backup contracts with newer functionality; unused dependency and formatting gaps obscured the final gate. | Rewrote current README; updated v7/local-first/architecture and owner handoff; labeled earlier validation as historical; removed motion and added the documented lint/architecture gate. New recovery actions also wrap their long labels on narrow screens. |

No existing answer history was silently re-scored, no FSRS histories were fabricated/merged, and no bundled question IDs were removed to satisfy tests.

## 6. Educational content audit and known gaps

Current bank: **34 normal-practice questions + 18 Tutor transfers = 52**, 88 vocabulary entries (84 words + 4 phrases), 12 grammar lessons and 24 mini exercises. Normal-practice Part counts are **1 / 4 / 3 / 3 / 10 / 4 / 9**. Mini mock selects 19 questions for 20 minutes, using available grouped content.

The audit agent reviewed the source of all question stems, options, answer keys and Vietnamese explanations; five reading passages; seven audio scripts and two exhibits; 88 vocabulary entries; and the 12 lesson explanations/structures/examples/traps and 24 exercises. This is an agent editorial pass, **not independent human educational review**. No remaining answer ambiguity was identified in that review, but linguistic nuance and synthetic pronunciation still require specialist/listening review.

Automated validation checks Part classification, IDs, option keys/text duplicates, answer presence, difficulty, skills, explanation/provenance, content references, passage/stimulus ownership, Part 6 mapping, exhibits, photograph licensing metadata and normalized duplicate questions. Ingestion additionally checks namespaced unique IDs, explicit review/licensing metadata and safe local media paths. An `approved` metadata field cannot prove a real person performed the review; source review remains mandatory. The pipeline is a build-time ingestion boundary, not a runtime installer of arbitrary code/content.

The conditional revision follows the distinction between usual future-if forms and `will` meaning willingness; see [British Council grammar reference](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/verbs-time-clauses-if-clauses). No dictionary or commercial exam content was scraped or copied for these repairs.

The single Part 1 asset was visually inspected as a local content file, **not an app screenshot**: `public/media/bookshelves-san906.jpg`, 394×590, photograph of bookshelves, author San906, [source](https://commons.wikimedia.org/wiki/File:Bookshelves_906.JPG), [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/). It matches the intended answer. SHA-256: `825c0a979e8c9a0f9237d2f9b3c903840cda06e22fd426d5159df306eb63312c`. Original file and attribution were retained.

Coverage remains PARTIAL: one photograph; four Part 2 items; one Part 3 conversation and one Part 4 talk; one Part 6 email; two Part 7 singles and one double-email set. There is no triple-passage set, comprehensive accent/voice coverage or large difficulty-calibrated bank. Explanations, lexical relationships and guidance are curated samples. No official ETS endorsement/material, official score conversion, validated score prediction, 200-question full exam or independently established learning-effectiveness claim is provided.

## 7. UX, accessibility and remaining operational limitations

The existing editorial design was retained. Source inspection covered shell/routes, learning states, media ownership, dialogs/popovers, error/recovery surfaces, theme tokens, focus/reveal behavior, reduced motion and responsive rules. Task 08 focused on the blocked-session workflow, error-screen draft recovery and long recovery labels rather than redesigning working sections. No dedicated frontend-design skill was available or claimed as used.

Static tests verify selected foreground/background pairs at 4.5:1 in light/dark themes, reduced-motion/coarse-pointer rules and local icon dimensions. They do not inspect the complete rendered accessibility tree. Actual desktop/tablet/mobile screenshots, overflow at 320px/200% text, focus restoration, Windows high contrast, screen readers, all contrast combinations, audio and touch interactions remain **NOT TESTED**.

Other limits:

- Global validated learning history is still read as a snapshot; long-history scalability is bounded by retained rows. The synthetic profile is not a promise for very large stores or mobile devices.
- Backup/import limits are 25 MiB, 100,000 rows and nesting depth 32. Cyclic/unsupported corrupt values fail export actionably without deleting the source; specialized recovery may be needed. Maximum-size phone imports are not profiled.
- Only one pre-management recovery point is retained. Site-data deletion/profile loss/private browsing and browser eviction remain real data-loss boundaries. Browser persistence grants do not replace a downloaded backup.
- Emergency Tutor text is memory-only until committed/copied. It cannot survive process termination. An already-running old v6 tab cannot receive new v7 recovery UI retroactively: **export/copy outstanding work and close old tabs before the first real upgrade**.
- Real owner-profile migration was not performed. v7 upgrades were exercised on isolated v1–v6 fixtures; backups from schema 6 retain checksum verification and receive a visible compatibility warning.
- Voice availability/locale/quality is platform-dependent, and voices may need network/OS assets. Mocked speech errors and session recovery pass, but real pronunciation/listening remain untested.
- PWA requires a completed initial cache, supported secure context and eventual owner verification. One previous cache is retained; older tabs may require an explicit reload. Updates do not silently migrate/reload other tabs. Root `/` deployment is assumed.
- Local HTTP probes did not succeed in this environment. Preview startup is recorded separately from application launch. Browser approval remains blocked by the prior usage-limit rejection; no alternate browser mechanism was used.

## 8. Security and privacy

Core learning requires no backend or account. No hardcoded credentials, private keys, `eval` or raw HTML injection paths were flagged by the executed scan. There is no undocumented Ddict API, commercial dictionary scrape, client LLM key flow or fake live-AI button. This is a focused static assessment; no penetration test was performed.

Imported JSON is untrusted: versions, required tables, safe keys, bounded shapes/size, checksum and linked-record consistency are checked before writes; preview freshness and transactional replacement protect concurrent state. SHA-256 is an integrity check, **not authentication**. Backups contain private learning records and Tutor text in plaintext; store/share them accordingly. Structured corrupt values remain labeled quarantine diagnostics, not executable/live records.

Service-worker interception is limited to bounded packaged same-origin GET resources. It does not mutate IndexedDB, intercept arbitrary cross-origin/API traffic or grow a remote-response cache. Normal learning has no application backend upload. Browser/OS speech implementations have their own platform behavior; a future network provider must disclose that boundary.

Future auth/sync/AI/analytics require server-held secrets, consent/minimal context, validation/limits, explicit sync conflict handling and data lifecycle design. They are documented boundaries, not implemented services. The zero-advisory npm result only describes the registry snapshot, not all supply-chain or application risks.

## 9. Localhost startup and data-safe handoff

Requirements: Node 22.12+, npm 10+. From the project root:

```powershell
npm ci
npm run check
npm run check:tests
npm run lint
npm run validate:content
npm test
npm run build
npm run audit:build
npm run preview
```

Open **http://127.0.0.1:4173** for production/PWA acceptance. For development use `npm run dev` at **http://127.0.0.1:5173**. Both use strict ports; inspect an occupied port rather than stopping an unknown process. Stop the server you started with `Ctrl+C`. No server from this Task 08 audit is intentionally left running.

Keep a stable host/port/profile. Dev and preview have separate IndexedDB stores. Before upgrading/exporting/importing, preserve old work; use a disposable profile for destructive acceptance. Management lives at `#/data` through learning settings. Preview import impact; choose merge only when histories are compatible or confirmed replacement after preserving both backups. Do not clear site data as an upgrade strategy.

Production offline operation requires successful service-worker installation before disconnecting; dev-server use does not prove offline readiness. Future non-loopback hosting requires HTTPS, correct JavaScript MIME/revalidation/scope, atomic assets and actual installation testing. No hosting/deployment was performed.

[README](README.md) contains the complete script inventory. Contracts: [Architecture](docs/ARCHITECTURE.md), [Local-first/backup/PWA](docs/LOCAL_FIRST.md), [Content ingestion](docs/CONTENT_INGESTION.md), [Practice](docs/PRACTICE_ENGINE.md), [Dictionary/Grammar](docs/DICTIONARY_GRAMMAR.md), [Adaptive learning](docs/ADAPTIVE_LEARNING.md), [Tutor](docs/FEYNMAN_TUTOR.md). [Owner review](docs/OWNER_REVIEW.md) keeps all unexecuted browser items unchecked. This file is the single current consolidated audit; Task 06–07 validation remains historical evidence.

## 10. Recommended next milestones

1. Resolve the browser usage-limit gate or perform owner-led manual acceptance in a disposable profile: journeys A–H, especially contextual selection/reading return, audio, keyboard/screen reader, mobile/dark/high contrast and screenshots. Close the HTTP reachability gap on the actual owner's localhost.
2. Exercise real v6→v7 upgrade with prior backup, actual file restore, storage denial/quota, multiple tabs and emergency Tutor recovery; then test completed-cache offline use, worker-only updates, previous chunks and supported installation behavior. Do not use the owner's only copy as a test fixture.
3. Obtain independent English/Vietnamese educational and licensing review; grow original/licensed photos, listening groups, passage variants and transfer coverage before unlocking broader mocks. Keep 200-question/full-score claims unavailable until defensible.
4. Measure browser startup, mobile response and long-history IDB/memory behavior. Add indexed incremental aggregates/query pages when those measurements justify it; retain the current deterministic learning and transaction boundaries.
5. Design secure auth/sync/licensed updates/AI only as a later explicitly scoped phase. No hosting, paid APIs or backend infrastructure is needed for the current local learning product.
