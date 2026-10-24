# Local content authoring and review

Current schema: content package **v3**, learner database/backup **v9**. Learner-backup JSON and content-package JSON are different formats and are never interchangeable. See [CONTENT_AUDIT.md](../CONTENT_AUDIT.md) for measured coverage and validation boundaries.

## Open the workspace

```powershell
npm run studio
```

Visit `http://127.0.0.1:5173/__studio`. This explicit Vite serve mode registers the local middleware and a separate editor entry. `npm run dev`, `npm run preview` and the production learner build do not register the Studio API or link the editor. The normal learner app remains at `/` in Studio mode.

Use the same host, port and browser profile as normal learning to inspect that profile's feedback. `localhost`, `127.0.0.1`, another port or another profile has different IndexedDB data. If a server you own occupies 5173, stop it with Ctrl+C before switching modes. A different port is allowed deliberately, but does not inherit feedback/progress. Save/export work and close old tabs before a real schema-9 upgrade. This implementation run never opened the owner browser database.

Studio's filesystem operations accept loopback requests, matching Origin/Host for writes, JSON bodies and an explicit Studio header. No arbitrary filesystem paths or commands are accepted. Keep this development server local; it is not an authenticated hosted admin product.

## Author a batch

1. Choose **New original package**, open a structured package JSON file, or make a draft from an installed source package. Opening source/imported review claims resets approval; saved local drafts can resume their recorded lifecycle.
2. Assign a stable lowercase package ID and content revision. IDs for questions, passages and stimuli use `package-id:local-id`. Do not rename installed identities or regenerate their IDs to hide duplicates.
3. Fill the responsible author, origin/license metadata and each question's English stem/options, single answer key, Vietnamese explanation, takeaway and distractor reasoning. Use known skills, difficulty, grammar and vocabulary references. The complete JSON panel edits provenance/rights metadata; the name entered for a lifecycle action is a reviewer identity claim, not an automatic replacement of every author's attribution.
4. Use the form fields for question/answer/reasoning/tags, passages/transcripts and explicit evidence quotes. Add/remove whole grouped structures and edit photographs, exhibit tables/images, recording associations/credit and media manifests in the complete JSON panel. Part 2 needs three choices; other Parts need four. Part 3/4 groups need three questions, Part 6 four mapped blanks including sentence completion, and Part 7 one to three related passages.
5. Put independently authored or properly licensed assets under `public/media`. Declare author, source, license and license URL for every referenced asset; optional SHA-256 binds its bytes. No tool here downloads remote media or manufactures timestamps. Synthetic scripts remain explicitly synthetic.
6. Evidence items contain `passageId`, an exact `quote`, and a Vietnamese `explanation`. The passage must belong to the question's actual stimulus. Multiple references may support cross-text reasoning. Exact-reference validation cannot prove that the quoted text justifies the key; the human must check that inference.
7. Apply JSON edits explicitly. An unapplied or invalid buffer is retained and can be exported; form writes are disabled while the buffer owns uncommitted edits. Preview uses the production QuestionRenderer/StimulusView only after the bank's structural checks succeed. Preview answers and audio do not write learner attempts or FSRS.
8. Validate against active content, relationships, duplicate warnings, physical files and rights declarations. For an installed revision, choose a new revision and explicitly apply it to question/stimulus provenance in the draft. The v3 package and question/stimulus provenance revisions must agree.

The new blank template is intentionally invalid until authored. It is never counted in the active catalog. Do not duplicate a commercial problem or merely replace names/numbers. A draft cloned for correction is not automatically a new original question.

## Save and review

**Save draft** writes `content/studio-drafts/<draft-id>.json`, containing file revision, update time and package. It uses optimistic revision checks, a bounded JSON payload, a writer lock and a temporary file followed by rename. A conflicting save leaves existing bytes intact and the editor buffer available. Save before leaving; the unload guard cannot guarantee recovery after a browser/process crash. Unpublished draft files keep the latest saved draft, not an unlimited history. Back them up with source files.

Lifecycle transitions are deliberate:

| State | Meaning |
| --- | --- |
| DRAFT | Authoring; incomplete/invalid fields may remain in a saved draft. |
| VALIDATED | Current machine checks succeeded; no semantic certification. |
| NEEDS_REVIEW | Queued for human educational/rights review. |
| APPROVED | A named human explicitly attested to this revision's answer key, distractors, language, evidence and rights. |
| PUBLISHED | The approved revision is prepared for explicit source activation. This state alone does not install it. |

Use **Advance one editorial stage**. To approve, enter the actual responsible person's name, check all five items and type `TÔI ĐÃ THẨM ĐỊNH`. Automation must not fill the human checklist on behalf of an unperformed review. This records a local self-attestation, not a verified identity, ETS approval, independent certification or a plagiarism clearance.

Changing content resets validation/approval to DRAFT. Review binds the exact package revision and content-change fingerprint. Keep provenance notes about origin/rights neutral and accurate; use the lifecycle for review status, rather than leaving obsolete “never reviewed” statements in newly approved material. A stale old question snapshot cannot inherit the current revision's reviewed label solely by ID.

## Export, dry-run and activate

Export the current buffer/package to a deliberate source path. Export does not install content or prove the browser saved the download. New v3 packages must reach PUBLISHED before `--install`, and must explicitly permit the intended practice/assessment use.

```powershell
npm run content:import -- content/packages/my-batch.json --report-name=my-batch-check
npm run content:import -- content/packages/my-batch.json --install --report-name=my-batch-install
```

Supply multiple JSON filenames for batch preflight. All must pass before the one activation. Warnings for near duplicates require resolution rather than automatically deleting either item. Source generation is optional; the editor/pipeline does not mass-generate questions. V1/v2 imports remain compatible, but legacy approval text is not a current human-review record. New legacy packages are not automatically assessment eligible.

To revise an installed package:

```powershell
npm run content:import -- content/packages/revised-batch.json --revise --report-name=revision-preview
npm run content:import -- content/packages/revised-batch.json --install --revise --acknowledge-history --report-name=revision-activation
```

Read the first report before executing the second. A new revision and preservation of historical question/stimulus/passage IDs are required. The report lists old/new revisions and digests and changed IDs. Stored attempts/score/scheduler records are not rewritten. Immutable older package files are retained; interrupted staging is reusable when identical. A failed stage before the registry rename leaves the old active source intact. Named report files are separate from the learner database.

Important history boundary: existing attempt snapshots preserve the answered question, but old sessions still resolve shared passage/audio data from current content. The acknowledgment is an explicit notice of this limitation, not automatic historical stimulus pinning. Inspect archives and impact before changing shared resources. Do not silently apply a “correction” and claim all historical rendering remains identical.

The `.content-import.lock` and draft `.writer-lock` prevent overlapping writers. After a crash, do not automatically remove a lock; verify that its writer has stopped first. Never delete immutable packages merely because a registry currently does not import them.

## Assessment assembly

Full mock manifests require exactly 200 unique IDs in Part order with distribution **6/25/39/30/30/16/54**, complete groups, valid referenced passages/media and explicit eligibility. Keep listening and reading groups intact; do not split a stimulus to meet a counter. Run `validate:content`, `audit:content` and build checks before claiming availability.

The existing legacy samples are explicitly allowlisted as **unreviewed practice** to preserve honest existing functionality. The 19-question mini remains a sample. A reviewed full assessment must draw from current approved/published eligible content; declaring `human-reviewed` in a manifest cannot certify unreviewed questions. No official ETS score or certification is generated.

## Review learner reports

The normal Study/review UI offers **Báo vấn đề nội dung** with answer/wording/explanation/media/translation categories. It saves an immutable original question snapshot, stable ID, source revision, fingerprint, message and creation time in `contentFeedback`. It does not transmit the report.

Studio's **Learner reports** reads the same-origin IndexedDB, flags a differing current question, filters/paginates records and records open/triaged/resolved/dismissed decisions with notes and a revision guard. A decision never edits question content or retroactively regrades an attempt. Create/review a source draft separately. Reports participate in normal schema-9 learner backup validation/import/recovery; use that flow deliberately to move reports across origins. Authoring draft files are separate from learner backups.

## Research and educational checklist

Use the [ETS format overview](https://www.ets.org/toeic/about/listening-reading.html) to plan workplace listening/reading skills and section structure. Do not import its copyrighted sample items into this repository. Other protected commercial banks, paywalls and undocumented APIs are not an authoring source.

- Create a fresh scenario and communicative purpose, then independently solve it before examining choices.
- Demonstrate exactly one defensible best answer. Check dialect variants, reduced clauses, context-dependent collocations and alternatives that common shortcuts miss.
- Make distractors plausible but explain their precise failure. Avoid nonsense padding or a correct option identifiable only by length/grammar mismatch.
- Verify quantities, dates, deadlines, conditions, sender roles, paraphrases and cross-text links against actual evidence. Have another human solve the set without the key where possible.
- Explain in natural Vietnamese, including important business terms in stems and choices. Do not assume a correct letter proves comprehension.
- Verify photographic origin/license, listen to real available audio and note synthetic speech/voice limitations. Confirm exhibits and answer references together.
- Keep difficulty descriptive until real pilot data supports calibration. Revise in small batches with clear version impact, never invented TOEIC score predictions.
- Run `npm run audit:content`, type checks, tests and build. Then manually accept the editor/learner journey and actual browser media. Structural checks and screenshots, if later captured, do not substitute for human educational review.

The legacy compatibility policy is sealed to exact package/question content fingerprints. Appending an item to an old package or revising an old item does not automatically inherit its old sample eligibility. The initialization/sealing scripts are one-time migration utilities with existing-file guards, not routine expansion commands. Do not regenerate that allowlist to avoid reviewing newly authored material.
