# Task 09 — Premium learning experience

22 October 2026. Implemented in the existing application; no deployment, account, API service, new dependency or content-bank regeneration. This is an implementation and Node/static validation report, **not browser acceptance**.

## Findings and changes

| Before, inspected in source | After |
| --- | --- |
| Initial question autofocus also called `scrollIntoView`, competing with page-level scroll reset. | Autofocus retains the viewport. Explicit return-to-question and deliberate group navigation control scrolling. This repairs the source conflict; the owner's original clipping symptom still needs browser confirmation. |
| Practice had Part cards, counters and configuration but no direct entry to contextual workspaces. | Compact Listening Lab / Reading Studio entries open Study Mode, preserve an existing active session, and keep the same Part, skill and group architecture. Selected Parts have a stronger border as well as their selection marker. Configuration reports matching groups/questions separately from actual session size. |
| Passages were read-only text with contextual lookup. | Parts 6–7 have persistent highlights, editable notes, a reading bookmark, a return-to-bookmark control and a native paragraph picker for keyboard users. Multi-passage groups stay intact. |
| Detailed explanations appeared immediately after answering every reading question. | Five explicitly supported questions offer Evidence Check before the detailed explanation. Exact authored quotations are revealed only on request. Other questions retain normal feedback without invented evidence. |
| Audio offered full replay, speed, transcript and Exam restrictions. | Study/review also offers text-unit replay for synthetic speech, transcript vocabulary marks, dictation and optional shadowing recording. Exam retains its existing restrictions and receives none of these aids. |
| Mistake rows exposed the correct answer before retry. | The initial answer is retained but the answer key is withheld in the collapsed list. Mistake Lab offers retry → explanation → original reasoning/distractors → related references/Tutor → an available transfer question → save for review. |
| Grammar consisted of reference pages and mini exercises. | Ten reusable six-stage micro-lessons now accompany the relevant reference pages. Thirty original teaching prompts are separate from TOEIC-bank counts. |
| Saved vocabulary retained the word but discarded its source sentence. | Saving from contextual lookup atomically retains the sentence with the review card. Saving another context does not reschedule an existing card. Recall reveals up to three recent saved contexts after retrieval. |
| Today already computed real adaptive plans. | It now states the next action and its reason, distinguishes a starter plan from evidence-based recommendations, retains 10/20/40-minute choices, and offers free practice. |

The count audit remains unchanged: **234 available practice questions, 200 reserved mock questions, 18 Tutor questions**. The earlier 34 was the original starter bank, not a loader defect. No TOEIC questions, IDs, answer keys, mock distribution or `bank2026-r8` registry were changed for Task 09. See [the bank expansion report](../QUESTION_BANK_EXPANSION_REPORT.md).

## Coverage and limits

**Reading Studio:** available on Study/review passages in Parts 6–7 and in Mistake Lab. Select text or choose a paragraph, then save a highlight/note; selecting alone does not create a record. Notes allow 1,000 characters, selections 3,000, and each passage has at most 100 marks. Bookmarks are explicit, not automatic scroll tracking. Reference navigation preserves the practice session; “Về vị trí đã lưu” returns to the saved passage offset. Marks use stable passage IDs, UTF-16 offsets, exact quotes and a content fingerprint of canonical display text (Part 6 blank tokens display as `[1]`, consistently in the UI and repository). A changed passage version leaves old notes intact and read-only instead of applying old offsets to new text. Export remains available; automatic note rebasing/archive editing is not implemented.

**Evidence Check:** authored mappings for `p7-return`, `p7-fees`, `p7-venue`, `p7-bring`, `p7-optional`. A counter checks whether stored highlights contain exact reference quotations; it does not semantically grade evidence or reject useful shorter selections. The learner can proceed to the reference guidance without satisfying that literal check. The rest of the bank, including Part 6, has no fabricated evidence mappings. Incorrect/correct answer status can already be visible after submission; detailed reasoning is gated.

**Listening Lab:** full playback remains in the existing reusable MediaPlayer. Synthetic speech can replay a selected text unit with speed controls; no timestamps are inferred. A recording without verified segment timings can replay only its full file. The current bank primarily has synthetic scripts, not TOEIC-quality human recordings. Browser/OS voice availability and errors remain explicit. The ordinary transcript and local dictionary stay available in Study Mode.

**Dictation:** lowercases NFKC text, normalizes curly apostrophes, ignores punctuation and repeated whitespace, and preserves internal apostrophes. It does not expand contractions or equate digits with written numbers. Word-level Levenshtein alignment labels missing, extra and mismatched words, with text labels as well as colors. Each side is limited to 250 tokens and 3,000 characters; oversized UI input is not silently accepted. Saved results retain the actual reference/input and recomputed match counts. New entries must reference the current stimulus transcript or a synthetic text unit. This is text matching, not a validated proficiency, listening-ability or pronunciation score. Unsubmitted input is temporary.

**Shadowing:** optional `getUserMedia`/MediaRecorder capture starts only after an explicit action. Permission denial, unsupported APIs, cancellation and recorder errors have fallback messages. Capture stops on navigation/unmount, after 60 seconds or above 5 MB. A late permission result from a canceled/unmounted request closes its tracks; a pending permission request is not multiplied. Blob URLs are revoked. Playback is local to the tab, not uploaded or exported, and is intentionally temporary. There is no pronunciation grading. These browser/hardware paths have not been executed in this audit.

**Mistake Lab:** supports original TOEIC question attempts, including omissions. Original attempts, snapshots, score denominators, skill evidence and FSRS state are not rewritten. The learner provides a reason before seeing detailed reasoning; arbitrary writing is not semantically assessed. Existing categories remain compatible, with sentence-structure, vocabulary, mishearing and distractor confusion added as optional self-reports. Transfer candidates come from available practice content sharing a skill, excluding prior attempts/follow-up transfers at the time the Lab opens. A candidate is not guaranteed for every question or equivalent in difficulty. Grammar-mini-exercise mistakes keep their reference workflow rather than pretending to be TOEIC questions. Existing authored Tutor links continue for supported situations. Follow-ups are saved in a separate journal; explicit saved-question/knowledge cards use the existing review workflow.

**Micro-lessons:** Although/despite; because/because of; whereas/while; in order to/so that; word forms; agreement; verb patterns; passive; relatives; subjunctive. Each uses Observe → Predict → Explain → Practice → Transfer → Review, with a small progressive hint and corrective feedback. Completion requires interactions, not correct performance, and never claims mastery. Writing and progress save when the learner presses the next action. A revision check protects against stale-tab overwrites; unsaved writing remains visible on a failed write. These authored drafts are not certified or independently human-reviewed. Topic aliases participate in global grammar search without indexing learner writing or answer keys.

**Dictionary:** the curated local dataset remains 106 entries, including only supported phrases/forms and authored relationships. A selected sentence supplies context, not an automatic translation or sense-disambiguation service. Missing words/phrases retain an honest empty state. Selection → explicit lookup / Alt+Enter and existing touch bottom sheets are preserved.

## Architecture and storage

- `domain/studio.ts`: pure text alignment, transcript units, paragraph offsets, content identity and typed learning records.
- `content/microLessons.ts` and `readingEvidence.ts`: original teaching material and explicit, exact evidence references. Generic question renderers do not embed lesson content.
- `StimulusView` keeps a presentation-only passage-render slot. Practice and Mistake Lab supply ReadingDocument; static/default rendering remains independent of storage.
- `application/studioRepository.ts`: validates references, serialized writes, original-attempt identity, idempotent follow-ups, active Exam restrictions and stale revisions.
- IndexedDB **v8**, additive from v1–v7, adds `readingWorkspaces`, `learningActivities`, `vocabularyContexts`. No destructive migration or reseeding. Existing attempt and FSRS schemas/parameters are retained.
- Backup remains `study990.backup`, format 1, now databaseVersion 8 and 20 learning tables. Checksums are verified against the original payload before adding missing Studio tables for schema 6/7 backups. Legacy flat v1–v5 adapters remain. Studio tables participate in validation, export, preview, atomic replace/reset/recovery and conservative merge conflict checks. Divergent same-ID notes/progress block merging instead of silently losing one version.
- Dictation/retries/micro-lesson progress do not enter Part accuracy, skill evidence or FSRS ratings. Cards are only rated through the existing actual retrieval/review controls. This deliberately prevents engagement actions from inflating proficiency metrics.

The implementation preserves existing tokens, sidebar, light/dark/system themes, reduced-motion rules and responsive breakpoints. New controls use native buttons, radios, selects, labels and visible focus styles; feedback has text labels and live statuses. Responsive CSS and semantic markup have been inspected, but WCAG conformance is not certified by static inspection.

## Product references

Public pages were fetched; no signed-in product walkthrough, code extraction or proprietary content import occurred.

| Reference | Pattern used / access boundary |
| --- | --- |
| [Brilliant](https://brilliant.org/) | Guided hints and learner action before detailed solutions; public page fetched. |
| [Readlang](https://readlang.com/) | Explicit contextual word lookup and capture into later review; public page fetched. |
| [Language Reactor](https://www.languagereactor.com/) | Transcript/media control pattern supplied in the task; public HTML was JavaScript-only. No claim of inspecting its interactive controls. |
| [Bunpro](https://bunpro.jp/) | Grammar organization linked to review; public HTML exposed reference navigation, while deeper patterns use the task's documented description. |
| [Anki](https://apps.ankiweb.net/) | Retrieval before revealing, followed by honest review ratings and scheduling; public page fetched. Existing pinned FSRS retained. |
| [STUDY4](https://study4.com/) | Dictation and detailed exam-review pattern; public material fetched, private exam UI not inspected. |
| [LingQ](https://www.lingq.com/en/) | Words saved from actual reading/listening contexts; public page fetched. |
| [Duolingo](https://www.duolingo.com/) | Short achievable interactions using the task's documented pattern; fetched HTML exposed only an iframe, not a live lesson. No streak pressure or arbitrary rewards added. |

No dedicated frontend-design/UX/React/accessibility/testing skill was installed in the supplied skill catalog. No such skill is claimed. The earlier browser approval rejection is recorded in the project audit; it was not bypassed with CDP, another browser surface or raw automation.

## Validation and manual acceptance

Task 09 explicitly requested automated tests/build. Executed gates and current counts are recorded below after the final source pass. Node tests use fake IndexedDB and static React markup, not an owner's browser profile. Logs: [unit/integration tests](audit/task09-tests.log), [production build](audit/task09-build.log).

The new tests exercise exact evidence references, the 30 micro-lesson prompts, answer withholding in static HTML, dictation normalization/alignment and validation, bookmark/note persistence after database reopen, stale-write rejection, contextual-save idempotency, original-attempt/FSRS preservation during retry/transfer, a complete persisted grammar sequence and explicit knowledge-card save, active Exam guards, schema-7 backup compatibility and Studio backup round trips. Existing tests cover all seven Parts, grouped questions, assessment, full mock submission, audio-failure records, FSRS and offline-worker policy.

**Not executed:** real desktop/mobile rendering, keyboard/selection/focus/scroll walkthroughs, theme/contrast measurement, real voice playback, microphone/permission/recording playback, browser reload, offline installation/update and screenshots. The repository has no browser-test script/dependency. A historical browser approval rejection is not a fresh measurement of today's browser availability. No attempt was made to bypass that restriction, and no real-runtime success is claimed.

Owner acceptance uses the checklist in [OWNER_REVIEW.md](OWNER_REVIEW.md). Export learning data and close old tabs before the first real schema-8 upgrade; a tab already running older JavaScript cannot receive new guards retroactively. Nothing in this run opened or migrated the owner's IndexedDB profile.

Large initial content chunks remain a performance limit. Source-level code splitting and a successful build do not prove mobile responsiveness or a latency budget. Profile the real browser before claiming performance at thousands of questions.

## Executed final gates

| Command | Result |
| --- | --- |
| `npm run check` | Exit 0 |
| `npm run check:tests` | Exit 0 |
| `npm run lint` | Exit 0; Prettier and architecture scan, 124 modules / 441 runtime dependency edges, no reported issues |
| `npm test` | Exit 0; **88 tests, 13 suites, 88 pass, 0 fail, 0 skipped, 0 canceled** |
| `npm run validate:content` | Exit 0; 452 total / 234 practice / 200 mock / 18 Tutor; 1 complete mock; no reported schema or near-duplicate issues |
| `npm run build` | Exit 0, retained warning for chunks above 500 kB |
| `npm run audit:build` | Exit 0; static asset inventory and offline initial dependency coverage |

Final artifact audit: initial JS closure **1,466,168 bytes / 320,470 gzip**; largest chunk `records-DvwSVcRT.js` **865.66 kB** (131.22 kB gzip); **32 JavaScript chunks**, **80 packaged assets / 6,432,728 bytes**. Shell identity `8a95ed27b91884a793dc`. The large-chunk warning was not suppressed. These are artifact measurements, not browser timing results. No server, deployment or browser session was started for Task 09.
