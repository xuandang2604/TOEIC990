> Task 11 current contract: content v3 adds editorial lifecycle, explicit manual approval, frozen sample eligibility and acknowledgment for installed revisions. Read [CONTENT_STUDIO.md](CONTENT_STUDIO.md) and [CONTENT_AUDIT.md](../CONTENT_AUDIT.md) first. The v1/v2 details below remain compatibility/history guidance; new v3 activation requires PUBLISHED. Source importer never edits learner IndexedDB.

# Original question-bank authoring and import

Current contract: **22 October 2026**. This is a source/build-time pipeline. It does not write the learner's IndexedDB, install arbitrary code, scrape question banks or call paid generation services. App startup uses the checked-in active registry; Python is not required to run STUDY 990.

## Authoring and generation

`content/author_bank2026.py` contains individually authored question rows and scenarios, not a paraphrase multiplication loop. Each row/call produces one question; option rotation changes placement only. `content/editorial-revisions.json` holds the agent's Vietnamese prose corrections. `content/topic-tags.json` holds reviewed-in-source topic assignments. `content/reference-index.json` captures local headwords/forms and grammar IDs for exact lexical linking; regenerate it intentionally after reference additions. Live ingestion still verifies references against the actual catalog.

```powershell
npm run content:generate
```

Optional authoring requirement: Python 3, standard library only. The command emits four packages under `content/packages/` and `content/mock-exams.json`; it asserts exactly 200 mock items with 6/25/39/30/30/16/54 and 200 additional practice items. It does not activate a package or mark material human-reviewed. Additional authors can create other conforming JSON batches without Python.

Every question needs stable IDs, Part, choices/correct key, Vietnamese explanation and distractor analysis, difficulty, skills, knowledge reference arrays, topic and provenance. Parts 3/4 have three questions per audio; Part 6 has four mapped blanks including a sentence; Part 7 supports one to three passages. A full mock manifest additionally requires the 200-question distribution and Part 7's 10 singles/29 questions plus 5 multiple sets/25 questions.

## Package versions and editorial status

```ts
interface ContentPackage {
  format: 'study990.content'
  formatVersion: 1 | 2
  id: string
  revision: string
  purpose?: 'practice' | 'mock' // required for v2
  bank: ContentBank
  media: {
    path: string
    author: string
    sourceUrl: string
    license: string
    licenseUrl: string
    sha256?: string
  }[]
  review:
    | { reviewer: string; date: string; verdict: 'approved' }
    | { status: 'ai-draft'; author: string; date: string; note: string } // v2 only
}
```

V1 retains its previous declared human-approval contract. V2 explicitly permits **AI drafts**; it does not invent a reviewer. Draft questions must carry `provenance.editorialStatus: 'ai-draft'`, and UI discloses the limitation. A supplied human approval field is an accountable declaration, not software proof of independent review.

All new question/stimulus/passage IDs use the package namespace, such as `bank-name:q001`, and are unique across kinds. Grammar/vocabulary references resolve to real local entries. Unsupported links are rejected rather than silently generating dictionary facts. There are 18 new original supporting lexical entries, bringing the dictionary to 106; every one of the 400 new questions has a vocabulary link. Grammar links are supplied where appropriate (114 new questions), not fabricated for pure comprehension items.

## Preflight and activation

```powershell
npm run content:import -- content/packages/mock-listening.json content/packages/mock-reading.json content/packages/practice-listening.json content/packages/practice-reading.json
npm run content:import -- --install content/packages/mock-listening.json content/packages/mock-reading.json content/packages/practice-listening.json content/packages/practice-reading.json
npm run validate:content
```

The first command reports without activation. `--install` stages immutable package JSON before replacing **one registry file** by atomic rename. Runtime imports only `src/content/generated/index.ts`; old unreferenced package versions are archives, not additional available questions. The importer can consume any number of supplied batch files, subject to per-file/overall build budgets; it does not have a four-package or 400-question limit.

Checks include:

- Bounded JSON (10 MiB per input), package metadata, schemas and explicit editorial status.
- Unique IDs, known skills, difficulty, answer keys/options, duplicate option text and explanation/provenance presence.
- Shared-group cardinality, Part 6 markers, passage ownership, exhibits and mock completeness.
- Normalized exact duplicates across existing and incoming content.
- Near duplicates through an inverted index of word bigrams, normalizing numerical values, across question text/options, audio scripts and passages. Default Jaccard threshold: 0.78; short texts below eight distinct bigrams are excluded from near matching. Shared-stimulus question siblings are not mistaken for copied passages. Part 1 comparison includes actual choices, not shared instructions alone.
- Near-duplicate candidates block activation pending source revision. This lexical heuristic can miss semantic paraphrases and can flag legitimate similarities; it never certifies originality.
- Every local media reference must appear in the licensing manifest, which rejects unused/escaping paths. Physical files must resolve inside this repository's `public` directory, including junction/symlink checks, and stay below 24 MiB each. Supplied SHA-256 values are verified, including on unchanged re-imports.

Reports are written to `docs/content/import-report.json`; `initial-import-report.json` preserves the first 400-item activation, revision reports preserve subsequent fixes. `bank-inventory.json` distinguishes normal practice, reserved mock and Tutor totals. A rejected batch does not partially activate. Identical re-imports are idempotent. Duplicate package IDs supplied twice in one invocation are rejected with unchanged registry.

Only one importer owns `.content-import.lock`. The registry is read after acquiring the lock. After an interrupted process, inspect whether any importer is still active before removing a stale empty lock; do not break another writer's lock. Identical orphan package files can be reused after failed activation. Old files are retained rather than overwritten.

## Deliberate content revision

Use a changed revision and explicit `--revise` with `--install` to correct an already installed package. All historical question IDs must remain; do not repurpose an ID for an unrelated question. A revised file gets a new hash-qualified filename, while prior files remain recoverable. Atomic activation points the registry at the new revision without adding duplicate active questions. The existing practice engine retains captured question/answer snapshots and does not regrade past attempts.

Stimulus/history caution: current UI resolves shared media/passages from the current catalog; keeping an old package file is not the same as selecting archived stimulus revisions during historical review. Preserve stimulus meaning/IDs during corrections; a future licensed-update service must add explicit archived-stimulus resolution before making stronger historical-context guarantees. No existing Task 01–08 passage or answer was changed in this expansion.

## Media and exam limits

Synthetic scripts are clearly labeled and played through the existing reusable speech boundary; missing English voices/errors have explicit recovery and assisted-skip behavior. Part 1/2 base scripts do not embed choices a second time; the playback composer adds the current ordered options exactly once. Exam Mode keeps Part 2 wording and choices spoken only before submission.

Part 1 uses actual local CC0 photographs, individually inspected, with source/hash records in `content/photo-assets.json` and [media attribution](../public/media/bank2026/ATTRIBUTION.md). A rendered office candidate and a near-identical construction image were rejected. A filename/license field alone does not prove an image is photographic or rights metadata is correct; editorial verification remains required.

The 200-question mock is an original **AI-draft practice set**, not an ETS exam or a human-certified bank. It uses a 120-minute total budget; synthetic speech does not implement standardized 45-minute recording timing plus a separately enforced 75-minute reading timer. Only raw accuracy and Part performance are reported.

Current inventory: **234 practice + 200 reserved mock + 18 Tutor = 452**. One fixed complete mock; original 19-question mini sample retained. No official scoring, paid API, commercial scraping or deployment. Future thousands-sized banks fit the same package/schema boundaries, but bundled startup and validation still scale with active content. The current production bundle emits a >500 kB chunk warning; measure browser loading and split bank delivery before promising unlimited scale. Offline precache remains capped at 1,000 files / 30 MiB.

Schema/file checks and the agent editorial pass do not replace independent English/Vietnamese educational review, listening review or licensing review. Current exact checks/results: [QUESTION_BANK_EXPANSION_REPORT.md](../QUESTION_BANK_EXPANSION_REPORT.md).
