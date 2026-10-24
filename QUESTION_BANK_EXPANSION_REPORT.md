# STUDY 990 — Question Bank Expansion Report

**22 October 2026 · active content revision `bank2026-r8`**

**The 200 + 200 quantity/structure milestone is implemented:** one original 200-question mock plus 200 additional practice questions. Existing content and user-record contracts remain. The new material is explicitly **AI-authored and not independently human-reviewed**. This report does not certify every linguistic judgment, real-browser behavior, standardized timing or official scoring.

## 1. Original count and audit

Before expansion:

- **34 normal practice questions**, all 34 available under the existing media/schema policy.
- **18 Tutor transfer questions**, intentionally separate from normal practice.
- **52 total addressable questions**; validator reported zero issues.
- Normal Part counts: **1 / 4 / 3 / 3 / 10 / 4 / 9**.

Inspected `questions.ts`, `expandedBank.ts`, transfers, catalog validation, reference indexes, assessment/filter grouping, practice counters, application repositories, IndexedDB schemas, ingestion CLI and backup contracts. No additional unique practice bank was being lost, rejected, filtered away or omitted from a database seed.

**Root cause:** this was the complete small sample bank. Questions were bundled in source; IndexedDB held learner records, not a larger hidden content database. The old ingestion command validated a candidate file but did not activate batches. Filters kept whole stimuli; the 34 count was accurate. No fictitious loading/counting bug was patched.

## 2. Newly imported content

**400 new questions** were activated in four packages:

| Package | New questions | Purpose |
| --- | ---: | --- |
| `bank2026-mock-listening` | 100 | Reserved mock listening |
| `bank2026-mock-reading` | 100 | Reserved mock reading |
| `bank2026-practice-listening` | 85 | Additional practice |
| `bank2026-practice-reading` | 115 | Additional practice |
| **Total** | **400** | **200 mock + 200 additional practice** |

There are now **234 available practice questions + 200 reserved mock questions = 434**, and **452 including the 18 preserved Tutor items**. Older unreferenced package files contain revisions of the same IDs; they are archives and do not inflate runtime counts. The active registry imports four current files only.

Evidence: [live inventory](docs/content/bank-inventory.json), [initial 400-item activation](docs/content/initial-import-report.json), [current revision activation](docs/content/revision-r8-report.json), [latest import report](docs/content/import-report.json). `installedNew: 0` on a subsequent revision/re-import means no duplicate new IDs were added, not that the initial 400 were omitted.

Every new question has Vietnamese explanation, per-choice reasoning, difficulty, topic, provenance and skill classification. All **400** have real local vocabulary references. **114** target/link applicable grammar lessons; pure comprehension questions retain empty grammar arrays instead of invented relationships. Eighteen original supporting lexical entries bring the dictionary from 88 to **106**, with IPA, meanings, examples, forms and collocations. They also carry AI/unreviewed provenance.

The generator compiles individually authored scenarios/rows; it does not create extra question counts by renaming or paraphrasing a template. Correct-option placement varies deterministically, including Part 2, whose initial authoring rotation would otherwise have produced a single-letter pattern. The regression suite guards that placement problem.

## 3. Valid active questions by Part

These counts exclude Tutor transfers:

| Part | Original | Additional practice | Reserved mock | Available practice including original | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 · Photographs | 1 | 6 | 6 | 7 | 13 |
| 2 · Question–Response | 4 | 25 | 25 | 29 | 54 |
| 3 · Conversations | 3 | 30 | 39 | 33 | 72 |
| 4 · Short Talks | 3 | 24 | 30 | 27 | 57 |
| 5 · Incomplete Sentences | 10 | 60 | 30 | 70 | 100 |
| 6 · Text Completion | 4 | 16 | 16 | 20 | 36 |
| 7 · Reading Comprehension | 9 | 39 | 54 | 48 | 102 |
| **Total** | **34** | **200** | **200** | **234** | **434** |

New grouped content includes **23 conversations / 69 questions**, **18 talks / 54 questions**, **8 completion texts / 32 questions**, and **26 reading groups / 93 questions**. All grouped cardinalities, mapped blanks, linked passages and exhibits pass structural validation.

Added **12 actual CC0 photographs** and **103 synthetic audio scripts**. Totals are 13 photographs, 110 listening scripts, 148 stimuli and 53 passages across the complete active bank. Each new photo was inspected locally and its file-level license metadata retrieved from Wikimedia Commons; a rendered office image and a near-identical construction view were rejected. [Individual source/license/hash records](public/media/bank2026/ATTRIBUTION.md) and [machine-readable metadata](content/photo-assets.json) are retained. These are not ETS photographs or official recordings.

## 4. Complete mock availability and UX

**One complete 200-question practice mock is available:** `bank2026-mock-01`, shown on the Practice page. It has the requested **6/25/39/30/30/16/54** distribution, aligned with the paper-format structure in the [ETS examinee handbook](https://www.es.ets.org/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf).

- Parts 3 and 4 contain 13 and 10 complete three-question sets respectively.
- Part 6 contains four complete four-question texts, including sentence completion.
- Part 7 contains **10 single-text groups / 29 questions**, **two double-text and three triple-text groups / 25 questions**.
- A manifest with missing IDs, incorrect counts/order, unavailable stimuli or incomplete groups cannot be offered as a complete mock.
- The timer uses a **120-minute total practice budget**. Synthetic speech does **not** reproduce official recorded timing or separately enforce 45 minutes listening / 75 minutes reading. This limitation is displayed before starting.
- Results show correct/total, raw accuracy, omissions, assistance and performance by Part. No official score conversion or prediction is introduced.

Practice UI distinguishes available practice, distinct attempted practice, the reserved complete mock and the existing **19-question / 20-minute mini sample**. Daily plans and quick search use practice inventory rather than exposing the reserved mock. Repeating Mock 01 reuses its questions; it is not another newly generated exam.

The existing editorial design remains. Long exam navigation uses a native disclosure and bounded scroll area, preserving the original buttons and Exam/Study gates. Correct answers remain hidden before submission. Original active-session ownership still applies: starting a mock resumes an existing active session instead of overwriting it.

A session stores an optional `mockExamId`; exact membership is checked before the UI labels a restored session as a complete mock. DB schema remains **v7**. The original 34 question IDs/options, 18 Tutor items, progress/FSRS/draft/preferences contracts and old passages were not replaced or reseeded. No owner's browser data was opened or reset. Tests use process-local fake IndexedDB.

## 5. Pipeline and integration repairs

Implemented a reusable source pipeline with v1 compatibility and a v2 AI-draft editorial contract:

```powershell
npm run content:generate
npm run content:import -- file1.json file2.json
npm run content:import -- --install file1.json file2.json
npm run content:import -- --install --revise revised-package.json
npm run validate:content
```

Generation requires Python only for authoring; normal application use requires Node/npm. The shipped active packages are checked in. [Pipeline documentation](docs/CONTENT_INGESTION.md) describes schema, budgets, trust boundaries and versioning.

Import validates a whole batch before activation: shapes, IDs, choices/keys, difficulty/skills, references, group completeness, licensing declarations, local physical assets and optional SHA-256. Exact duplicate signatures and indexed lexical near-duplicate screening run across active and incoming items. Current results contain **zero exact/near-duplicate issues** at the documented threshold. This is not a guarantee against every semantic paraphrase.

Source writers are serialized by a lock; immutable package files precede one atomic registry replacement. Duplicate input package IDs are rejected. Unchanged re-imports are idempotent; revisions require a changed version and explicit flag, retain historical question IDs and do not regrade learner history. Staged identical orphan files can be reused after interrupted activation. Content import and learner backup import are separate formats and boundaries.

Repairs made during integration:

- Part 1/2 authoring initially embedded choices in base scripts while the playback composer also added them. Base scripts now contain only the stimulus; choices are composed **once** in the current option order.
- Part 2 Exam rendering could expose a newly authored question stem. Exam rendering now keeps it spoken-only, as well as hiding choices until submission.
- New mock/practice counters were separated from attempted/Tutor counts. All Part groups remain intact under filters.
- Old tests assumed all Part 3 content was one group and every mini constructor received the tiny starter bank. Those fixtures now explicitly use the original sample; additional tests cover the expanded bank and complete mock.
- Vietnamese prose was revised, topic/reference tags checked, conditional items given explicit past-consequence context, and subjunctive distractors adjusted to avoid relying on legitimate regional indicative variants being universally wrong.

No framework/dependency upgrade, new backend, paid API, commercial dictionary scraping or deployment was added. Assessment, renderer and FSRS ownership remain separate. Static architecture audit: **112 modules / 390 runtime edges**, no reported cycles or forbidden domain dependencies.

## 6. Exact verification results

Evidence files: [verification](docs/content/verification.json), [active package hashes](docs/content/active-packages.json).

Environment: Windows/PowerShell, **Node 24.16.0 / npm 11.13.0**. The final executed gates after content repairs:

| Command / check | Outcome |
| --- | --- |
| `npm run content:generate` | PASS; asserts 200 mock + 200 extra practice |
| `npm run content:import -- --install ...` | PASS; initial activation adds 400; identical re-import adds 0 |
| `npm run content:import -- --install --revise ...` | PASS; current revision activated without duplicate IDs |
| Duplicate-package negative CLI check | Expected rejection (exit 1); registry SHA-256 unchanged and writer lock released |
| `npm run check` | PASS, exit 0 |
| `npm run check:tests` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0; Prettier + architecture rules, not ESLint |
| `npm run validate:content` | PASS; 452 including Tutor, 234 practice, 200 reserved, one complete mock, zero issues/near warnings |
| `npm test` | **78 passed, 0 failed, 0 skipped; 12 suites**, exit 0 |
| `npm run build` | **PASS, exit 0**, with the retained chunk-size warning below |
| `npm run audit:build` | PASS; actual assets/cache identity/import closure/icon dimensions checked |
| Browser UI, real audio, mobile screenshots, installed/offline PWA | **NOT TESTED** in this pass |

Tests render all **452** question/stimulus combinations to static HTML, exercise all answer letters, validate complete groups and mock totals, verify photograph JPEG bytes/hashes and spoken-choice composition, and distinguish available vs distinct attempted questions. The full-mock integration test answers all **200**, injects an audio failure, crosses listening/reading groups, reopens the simulated database mid-session, preserves the absolute deadline, scores once and checks backup records including mock identity. Existing migration, FSRS, Tutor, rollback, recovery and mode-policy tests still pass. These are Node/fake-IDB/mocked speech/worker-VM checks, not browser E2E or human semantic certification.

Earlier fixture/API/format failures were repaired and affected/full gates rerun; no failed assertion was disabled or silently skipped.

Actual final production artifact:

| Metric | Value |
| --- | ---: |
| Initial static JS closure | **1,459,504 bytes; 318,121 bytes gzip** |
| Largest JS chunk | **861.89 kB** (Vite report) |
| Packaged offline resources | **79 files; 6,373,934 bytes** |
| JavaScript chunks | **31** |
| Shell identity | `79470cf51ab5b9ac0ad9` |

**Build warning remains:** a content/shared chunk exceeds Vite's 500 kB warning threshold. The threshold was not raised or the warning hidden. Package/schema ingestion can accept thousands of questions, but current runtime startup eagerly consumes the bundled active catalog and still scales with it. Browser startup/memory have not been measured here; progressive bank delivery/indexing remains a performance milestone before promising very large active banks. Offline inventory remains below its 1,000-file / 30 MiB budget.

Browser opening was rejected in the earlier audit by automatic approval review because of usage limits. No new browser attempt or bypass was made in this expansion; that is historical restriction evidence, not a fresh claim about today's quota. Real UX/audio/PWA acceptance remains on the [owner checklist](docs/OWNER_REVIEW.md).

## 7. Remaining content and release gaps

The requested **quantity and structural distribution** are met. The following are intentionally not claimed complete:

- Independent English/Vietnamese editorial review and listening review. All 400 new questions and 18 supporting lexical entries remain explicitly AI-authored/unreviewed. Structural tests cannot prove distractor quality, naturalness, rights authenticity or answer uniqueness across every linguistic interpretation.
- Recorded multi-speaker/accent production and exact official section pacing. Speech availability/quality depends on browser/OS; missing voices use the existing explicit recovery paths and assisted results.
- Multiple fresh full mocks, broader calibrated difficulty and any defensible score estimate. There is one fixed complete mock and a separate mini sample.
- Browser/device acceptance of the new long exam, responsive disclosure, photo loading, pronunciation, touch/keyboard/screen-reader behavior and production offline update.
- Indexed/progressive delivery for thousands of active questions. The current chunk warning is a real remaining limitation, not evidence of measured browser slowness.
- Historical archived-stimulus selection for future substantive source revisions. Existing captured question/answer snapshots preserve grading history; the UI still resolves shared passages/media from the current catalog. Preserve meaning/IDs during corrections and implement explicit archive selection before making stronger future update guarantees.

Run locally from the repository root with `npm ci`, `npm run dev` at `127.0.0.1:5173`, or `npm run build` then `npm run preview` at `127.0.0.1:4173`. Origins have separate progress stores; retain backups and save unfinished work before intentional production updates. No hosting or deployment was performed.
