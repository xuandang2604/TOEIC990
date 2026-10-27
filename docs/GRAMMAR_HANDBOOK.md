# Grammar handbook and guided self-explanation

Implemented locally on 2026-10-27, preserving the existing practice, reference, Tutor, roadmap, vocabulary and learning-record architecture. Browser UX/UI and actual iOS acceptance remain owner-run.

## Coverage

The grammar library grows from **12 to 42 topics** in seven chapters. The existing twelve lesson IDs, original exercises and provenance revisions remain unchanged. Each of the thirty new reference lessons has at least three rules, two correct/revise example pairs, two misconception notes and two original three-choice exercises.

| Chapter               | Topics | Scope                                                                                                                                                                     |
| --------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Câu & cụm danh từ     |      7 | Parts of speech, sentence/negation structure, countability, articles, determiners/quantifiers, pronouns, possession                                                       |
| Thì & thể của động từ |      7 | Overview and six comparison lessons covering the familiar twelve simple/continuous/perfect/perfect-continuous time-reference forms, plus future arrangements/time clauses |
| Cấu trúc động từ      |      8 | Agreement, passive, verb patterns, modals, modal perfects, causatives, phrasal verbs, used to                                                                             |
| Mệnh đề & liên kết    |      7 | Connectors, relatives, prepositions, noun/adverbial clauses, reporting, direct/embedded/tag questions                                                                     |
| Điều kiện & giả định  |      4 | Conditionals, mandative subjunctive, mixed/inverted conditions, wishes/preferences                                                                                        |
| Bổ nghĩa & so sánh    |      3 | Comparisons, adjective/adverb roles, participial adjectives                                                                                                               |
| Cấu trúc nâng cao     |      6 | Negative inversion, reduced relatives, participle clauses/dangling modifiers, clefts, ellipsis/substitution, parallelism                                                  |

This is a broad practical handbook, not a claim to exhaust every dialect or specialist construction. The “twelve tenses” teaching convention groups time reference and aspect; future meaning also uses present forms. Rules qualify shortcuts: _while_ has multiple functions, _staff_ varies by dialect, _was_ after _wish_ is not universally wrong, mandative clauses have _should_ variants, and not every initial _only_ triggers inversion.

New content is marked AI-assisted, unreviewed reference material. All examples/drills are independently authored, not copied from commercial exercises or certified as human-reviewed. Difficult constructions were checked against primary reference guidance:

- [Cambridge: inversion](https://dictionary.cambridge.org/grammar/british-grammar/inversion), [no sooner](https://dictionary.cambridge.org/grammar/british-grammar/no-sooner) and [dangling participle](https://dictionary.cambridge.org/dictionary/english/dangling-participle).
- [British Council: perfect aspect](https://learnenglish.britishcouncil.org/free-resources/grammar/english-grammar-reference/perfect-aspect) and [simple/continuous perfect](https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/present-perfect-simple-continuous).

There are **84 direct grammar exercises**, separate from the TOEIC question count. The active TOEIC/Tutor bank remains **452**: 234 practice, 200 reserved mock and 18 Tutor transfers. The previous staged 42-question package remains unactivated; it is unrelated to the 42-topic handbook.

## Feynman-inspired flow

Every topic has an authored simple explanation, rationale, teaching prompt, three self-check points, a three-choice prediction and related-topic links. It reuses the existing six-step micro-lesson engine: observe → predict → explain → practice → transfer → review.

There are **42 new handbook flows**, alongside ten existing curated flows (**52 total**). Existing unfinished flows are preferred when resuming; otherwise the handbook flow is selected. Prediction/transfer feedback follows submission. The reference/checklist is disclosed as reference guidance, not semantic analysis of the learner's writing. No arbitrary-text grading, LLM call, mastery inference or automatic FSRS rating is introduced.

The paragraph-save button uses the existing `saveLearningActivity` transaction and revision guard. Saved steps and paragraphs resume after refresh. Unsaved edits remain drafts: the UI states this and registers an unload warning, which does not guarantee crash recovery. Changing views within the same topic preserves mounted state. Choosing another topic/flow can discard unsaved writing; save it first. The existing record stores current flow state, not unlimited conversation history.

## Compact interface

- Desktop: bounded sticky chapter index with its own scroll, chapter/level filters, Vietnamese/English search and aliases. Filtering does not silently replace the open lesson.
- Three views: **Đọc nhanh / Tự giải thích / Thử sức**. Native details/summary controls disclose rules, exceptions and connections. Only one rule opens initially.
- A notation key explains S/V/O/V2/V3. Formulas/examples wrap in the reading column. Labels say “Cần sửa trong ý đang xét” rather than declaring every alternative dialect/reading universally wrong.
- Linked TOEIC references are collapsed and shown six at a time. Practice launches a short group preserving shared stimuli, using practice content only; reserved mock items are excluded. Active sessions resume without replacement.
- Thirty new topics use explicit `coverage: reference-only`: their mini-exercises work, but missing TOEIC bank links are stated rather than invented. The reference validator requires this status before accepting an empty bank-reference list.
- Knowledge-card saving, vocabulary lookup and return-to-question navigation reuse existing paths. Exercise timing pauses when its practice view is hidden while retaining answer selections.

## iOS and responsive safeguards

Below 1100 px the index opens in a Radix bottom sheet, with accessible title/description, Escape/close controls, managed focus return, one scroll area and safe-area padding. [VisualViewport height/offset events](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) adjust sheet bounds while open; listeners are removed on close. Compact keyboard-height layouts reduce header space.

CSS uses [safe-area environment variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/env), dynamic viewport height with vh fallback, `minmax(0, 1fr)`, zero minimum inline sizes for fieldsets/legends, wrapped text and bounded buttons. iPhone-size inputs/selects/textareas use 16 px to avoid focus zoom. Text zoom remains enabled. The six steps form a three-column grid and exercises stack vertically. Existing light/dark tokens, visible focus, text/icon feedback and reduced-motion behavior remain.

These are source/layout safeguards. Real Safari keyboard behavior, screen readers, touch, portrait/landscape rendering and overflow have **not** been runtime-tested by the agent.

## Persistence and validation

- Content lives in `src/content/handbook/`; authoring helpers reduce notation repetition only. Explanations, options, traps and transfer questions are authored individually.
- The catalog checks chapter/level membership, one guide per lesson, guidance/checklists, prediction keys and related links before opening learner routes. Existing reference validation checks lessons/exercises and vocabulary/question links. The future-authoring `content/reference-index.json` is updated; installed package revisions/fingerprints are untouched.
- Six additive skill leaves cover noun phrases, pronoun reference, sentence structure, reported speech, inversion and emphasis. All 22 prior leaf IDs remain (**28 total**). Grammar-practice evidence remains separate from TOEIC Part accuracy and FSRS self-ratings.
- IndexedDB stays v9. No new tables, reseeding, regrading, schedule rewrite or owner browser-database access. New knowledge cards use `knowledge:<lessonId>` and authored retrieval prompts. Restore new-topic/skill data with the updated app.

Actual checks:

- `npm run check` and `npm run check:tests`: compiler checks passed; no automated tests executed or changed.
- `npm run validate:content`: 42 lessons, 84 direct exercises, 42 Feynman guides, 52 total guided flows, 30 explicit reference-only topics; zero reported structural/reference/media/near-duplicate issues.
- `npm run build:dev`: TypeScript/Vite development build passed. The existing future native-config warning about extensionless imports/JSON attributes remains unsuppressed. Log: `docs/audit/grammar-handbook-dev-build.log`.
- Focused formatting and whitespace review performed. No production/Release build, publish, tests, browser launch, screenshots, real-profile backup round trip, commit, push or deployment.

Structural checks do not prove teaching effectiveness, semantic correctness or human editorial approval. New content still needs owner educational review; no certification is claimed.
