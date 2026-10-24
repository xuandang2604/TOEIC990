# STUDY 990 — Content quality and Question Bank Studio

22/10/2026 · Task 11. Inspected the current repository directly; no assumption that a Task 10 implementation or earlier expansion was complete. No new question bank was generated or published in this task. Existing architecture, IDs and learner history were retained. No deployment.

## 1. Actual coverage

The active catalog contains **452 structurally valid questions**: **234 ordinary practice**, **200 reserved mock**, **18 Tutor**. Four active installed packages contain 400 questions. Hash-qualified older package files are retained archives, not additional active questions. The original 34-question starter bank is still a distinct source collection; the low historical count is not evidence of missing IndexedDB imports.

| Part | Practice | Reserved mock | Tutor | Total valid / usable by source checks |
| --- | ---: | ---: | ---: | ---: |
| 1 | 7 | 6 | 0 | 13 |
| 2 | 29 | 25 | 0 | 54 |
| 3 | 33 | 39 | 0 | 72 |
| 4 | 27 | 30 | 0 | 57 |
| 5 | 70 | 30 | 18 | 118 |
| 6 | 20 | 16 | 0 | 36 |
| 7 | 48 | 54 | 0 | 102 |
| **Total** | **234** | **200** | **18** | **452** |

“Valid/usable” here means schema, relationships, required metadata, available local files/transcripts and declared use. It does **not** mean the answer key was independently verified, difficulty calibrated, synthetic voices available on every device, or browser playback accepted. Machine-readable evidence, including counts for all skill tags: [task11-audit.json](docs/content/task11-audit.json). Run `npm run audit:content` to recompute it.

## 2. Assessments

- **1 complete structural 200-question mock**, `bank2026-mock-01`, distribution **6/25/39/30/30/16/54**. No repeated question IDs; Part order, grouped listening/text completion, single/multiple reading passages, referenced passages and source media are checked. It remains an **explicitly allowed, unreviewed practice sample**, not an ETS examination or human-reviewed assessment.
- **1 short sample**, `starter-mini-sample`, **19 questions**. Available as a mini-test, explicitly not a complete full-length exam.
- No other configured full assessment is currently incomplete. Unconfigured combinations are not advertised as exams.
- A full manifest with missing content, invalid questions, incomplete groups, wrong distribution, missing files at the build/import boundary or missing assessment eligibility cannot qualify. Build now runs content/file validation before bundling. `availableMockExams` also checks question/passage structure and explicit eligibility.
- The existing 120-minute mock uses a total budget and synthetic speech; it does not reproduce official audio timing or implement an official score conversion.

## 3. Validation results and repair

Current active-bank results: **0 schema/reference failures**, **0 incomplete explanations**, **0 missing distractor explanations**, and **0 orphan questions/stimuli/passages** under the declared practice/mock/Tutor usage model. The last metric is not “unattempted by the learner.”

The validator checks unique IDs, choice count (three for Part 2; four otherwise), one `question.answer` key, no contradictory per-choice correctness flags, unique choice text, Vietnamese explanation/takeaway presence, known skills/reference IDs, difficulty values, stimulus Part/type, group size, Part 6 blank mappings, licensed media declarations and exact evidence quotes belonging to the correct shared passage. Version-3 provenance revisions must match the package revision. JSON import has depth/node/file-size limits and rejects unsafe keys.

Authored `question.evidence` references are now validated and consumed by Reading Studio. The five existing curated mappings remain compatible. Missing historical evidence is disclosed rather than replaced with an invented quotation. Persisted question snapshots validate evidence shapes before UI use.

Semantic ambiguity, naturalness, correct translation, fairness, difficulty and whether a distractor is genuinely indefensible remain human-review work. Validation never promotes these to verified claims.

## 4. Duplicates

**0 exact duplicate validation failures and 0 near-duplicate warnings** in the active bank. The existing lexical bigram detector normalizes numeric variants and compares questions, passages and stimuli. It is not a plagiarism detector or semantic-equivalence proof. Import reports expose warnings and refuse activation until resolved; no content is automatically deleted or rewritten to suppress a warning.

## 5. Media

**0 missing/unsafe/empty/oversized/checksum-failing referenced assets** in the current physical source audit. Existing photographic assets retain their attribution/license metadata; no photographs or external question material were downloaded or added for Task 11. Synthetic scripts count as declared listening content, not human recordings. File existence and SHA-256 checks do not establish codec compatibility, listening quality or legal clearance. Those remain listening/editorial acceptance tasks.

## 6. Editorial review status

**0 questions have a current, verifiable-in-this-workflow human-review record; all 452 require review.** Older `approved`/`ai-draft` metadata is treated as legacy or unverified, not retroactively upgraded to a human review.

New version-3 packages use **DRAFT → VALIDATED → NEEDS_REVIEW → APPROVED → PUBLISHED**. Validation only advances the machine stage. APPROVED requires a named human and explicit checks for answer key, distractors, language, evidence and rights, plus a typed attestation in Studio. Editing content resets the draft lifecycle. Review records bind the exact revision/content fingerprint; learner labels also compare the actual question snapshot, not only its ID. A content-change fingerprint is not a cryptographic signature, identity verification or certification.

Practice eligibility and assessment eligibility are separate from editorial state. `content/assessment-policy.json` explicitly preserves the existing unreviewed starter/installed samples for self-assessment, with honest labels. It is a frozen compatibility allowlist, not automatically extended on import. New unlisted legacy packages can be practiced without claiming review, but cannot silently enter Exam Mode. New v3 activation requires PUBLISHED and eligibility for its intended use; reviewed assessment eligibility requires the human-review lifecycle. Old sample eligibility is not a human approval.

## 7. Working tools and pipeline

Start the explicit development mode:

```powershell
npm run studio
```

Open **http://127.0.0.1:5173/__studio**. Stop an owned regular dev server first if it uses that strict port; do not stop an unrelated process. The learner application remains at `/`. Studio is absent from normal navigation and from the production client graph. Production artifact audit checks its exclusion.

Studio provides computed coverage/quality tables, package and draft loading, question/answer/reasoning/tag editing, passage/transcript editing, evidence references, complete JSON editing for groups/media/licensing, validation and exact production QuestionRenderer/StimulusView preview. Invalid shapes cannot be previewed as valid questions. Source package forms and JSON buffer have explicit ownership; unapplied JSON is retained and can be exported. Saved drafts use separate `content/studio-drafts` files, revision checks, a writer lock and atomic replacement. They do not activate the content registry or touch attempts.

Only same-origin loopback Studio requests can use its local filesystem API; no authentication/cloud service was added. This is a local development boundary, not an internet admin service. The development entry imports the editor directly; the production learner entry does not.

Dry-run and activation:

```powershell
npm run content:import -- content/packages/my-original-batch.json --report-name=my-batch-dry-run
npm run content:import -- content/packages/my-original-batch.json --install --report-name=my-batch-install
```

Multiple package filenames form one preflight batch. Unknown flags fail. Named reports are written under `docs/content`. V1/v2 compatibility remains, without treating declared approval as verified review. For a changed installed package, preserve all historical question/stimulus/passage IDs, change the revision, inspect the dry-run impact report, then explicitly add **`--revise --acknowledge-history`** when installing. No revision was activated in this task.

The importer stages immutable hash-named package files and commits one registry rename only after complete preflight. An interrupted activation leaves the old registry intact; identical orphan staging can be reused. Existing archives remain. Learner records are never opened by the source importer and stored attempts are not regraded. A lock left after process termination is not automatically broken.

Learners can report answer, wording, explanation, media or translation problems. **IndexedDB v9** adds `contentFeedback`, with stable ID, content revision, fingerprint, original question snapshot, category/detail and editor decision history. The editor filters open/triaged/resolved/dismissed reports; stale reviews fail instead of overwriting another editor. Review decisions do not automatically change source or points. Feedback is included in format-1/schema-9 backups and existing preview/merge/replace/recovery behavior; checksum-valid schema 6/7/8 and legacy v1–v5 inputs remain supported. This is local data, not a message sent to an external team.

Full instructions and the content-research checklist: [CONTENT_STUDIO.md](docs/CONTENT_STUDIO.md).

## 8. Future expansion workflow

Use publicly available format information to define a skill/Part blueprint, then independently author a new workplace scenario from a blank page. The [ETS overview](https://www.ets.org/toeic/about/listening-reading.html) describes workplace English and the Listening/Reading structure; use it as format guidance, not a source of redistributed questions. Public availability of sample questions does not grant reuse rights.

Work in small, coherent batches. For each item, write the answer key and explain why every distractor fails; independently solve it, verify dates/amounts/conditions and shared text evidence, fill Vietnamese explanations and tags, and record provenance and media rights. Test all group members together. Resolve duplicate warnings and listen to actual media. A named human must perform the review checklist before approval/publication. Only then deliberately assign assessment eligibility and assemble manifests. Pilot difficulty with genuine learner data; do not invent calibration, mastery or TOEIC score predictions. Do not lightly paraphrase commercial items or claim ETS endorsement.

## 9. Verification

Final commands, exit codes, test counts and artifact measurements are recorded below after the final source pass. Logs: [tests](docs/audit/task11-tests.log), [build](docs/audit/task11-build.log), [lint](docs/audit/task11-lint.log), [content audit](docs/audit/task11-content.log).

New checks cover editorial transitions and stale review, assessment eligibility, suspicious answer metadata/evidence, computed coverage, all seven editor previews using production renderers, separate authoring draft persistence/CAS, loopback/origin checks, physical media failures, failure before registry activation, safe staging reuse, a rejected real importer batch with unchanged active registry, version-linked learner feedback, review conflict handling and feedback backup restoration. Existing renderer, group, answer, full mock, scheduler, migration and learner-data tests remain enabled.

Initial test runs exposed restricted rename behavior in the sandbox's system-temp directory and comparisons that incorrectly treated optional `undefined` keys as JSON data. Filesystem tests now use verified disposable directories inside this repository, and JSON round trips compare canonical persisted values. Atomic replacement was retained, not replaced by delete-then-write. Final tests are neither skipped nor silently converted to success.

## 10. Unresolved limits

- No human editorial review of the existing 452 questions was performed or claimed. No new bank content was installed.
- No browser walkthrough of Studio, live HTTP acceptance, keyboard/mobile/theme acceptance or real media playback was run. Editor preview was tested through static React rendering; filesystem/API guards through Node. There are no fresh screenshots.
- Human review is a local named attestation, not authenticated identity or independent certification. Source files remain editable by their owner.
- Existing attempt snapshots preserve the original question and grading. Older sessions still resolve shared passages/audio from the current catalog. An acknowledged source revision can change those shared resources; automatic historical stimulus selection/rebasing is not implemented. Review the impact report and immutable archive before revision; do not claim old shared media is pinned.
- The form editor targets new packages and the four installed JSON packages. Legacy starter/Tutor TypeScript sources remain normal repository source work; they are not silently migrated to a new ID namespace. The full JSON panel handles group/asset/rights structures, not a visual media uploader.
- Authoring files are not learner-backup records; keep them in source backups. Saved draft files retain the latest draft, with concurrency protection; there is no unlimited revision archive/recovery UI for unpublished authoring edits.
- Batches are bounded (5 MiB editor, 10 MiB CLI package, 24 MiB media). Thousands of items should use multiple packages. Question selectors/report lists are bounded; full catalog/source and learner snapshots still require real profiling before large-scale performance promises.
- The large content chunk warning remains. A successful build and asset inventory are not mobile performance or production PWA proof.

## Executed final gates

| Command | Final result |
| --- | --- |
| `npm run check:tests` | Exit 0, application/tests/scripts/dev tools type checks |
| `npm test` | Exit 0; **100 tests, 14 suites; 100 pass, 0 fail, 0 skipped, 0 canceled** |
| `npm run lint` | Exit 0; Prettier + architecture scan; **139 source modules / 502 runtime edges**, no reported cycle/boundary issues |
| `npm run audit:content` | Exit 0; 452 total/valid/usable by source checks; no schema, media or near-duplicate failures; 0 recorded human-reviewed |
| `npm run build` | Exit 0; app TypeScript + full content/file validation + production bundle; retained large-chunk warning |
| `npm run audit:build` | Exit 0; `contentStudioExcluded: true`; packaged inventory and initial offline dependencies verified statically |

Final artifact evidence: **80 packaged assets / 6,444,978 bytes**, **32 JavaScript chunks**. Initial JS closure **1,474,878 bytes / 324,325 gzip**. Largest chunk `records-CnXQgDy-.js`: **868.88 kB / 132.40 kB gzip**. Shell identity `efdb1ae1f11d5835d902`. [Artifact log](docs/audit/task11-artifacts.log). The chunk warning was retained, not hidden. These measurements are file/build evidence, not browser latency.

No development/preview server or browser session was started for Task 11. Test filesystem fixtures were created in verified disposable repository directories and cleaned; rejected import tests left the actual active registry unchanged and released the writer lock. No owner IndexedDB profile was opened, reset or migrated.
