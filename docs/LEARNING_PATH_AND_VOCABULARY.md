# Personal roadmaps, vocabulary review and licensed content collection

Implemented locally on 2026-10-27. No commit, push, deployment, automated test execution or browser runtime acceptance was performed.

## Learner entry points

- **Lộ trình của tôi** (`#/roadmap`), also linked from Today and Settings: enter the current TOEIC score or leave it unknown, target score, start/deadline, daily minutes, actual weekdays and Listening/Reading preference. Scores accept 10–990 in increments of five. The quick-fill choices **700 / 60 days** and **990 / 30 days** remain editable examples.
- **Từ vựng**: saved-word and due-word filters, topic selection, next review dates, counts of distinct words reviewed today, and a dedicated **Mở hàng đợi từ** action (`#/review/vocabulary`). Existing selected-text lookup still saves source context. Question explanations now also offer a one-click save beside each linked vocabulary entry; these saves use the curated reference sense, not an invented contextual translation.
- The vocabulary page contains reminder settings and calendar export. New controls have labels, standard keyboard semantics, minimum touch sizes, responsive layouts and the existing light/dark tokens. No new animation is required.

## Planning policy

`src/domain/roadmap.ts` owns deterministic planning and validation. `Preferences.targetScore` remains the single owner of the target. `learningProfile.version = 1` stores self-reported baseline, dates, daily time, study weekdays and preference. A profile covers 7–366 inclusive calendar days, 10–240 minutes/day and at least one chosen weekday.

Four calendar stages cover foundation, contextual application, integration and consolidation. A baseline of at least 850 shortens the introductory allocation; other/unknown baselines retain a longer foundation stage. The target changes priority skills; an advanced target prioritizes inference, cross-text evidence and exhibits after the introductory stage. The chosen weekdays determine planned sessions/hours and a rotating Part focus. These thresholds and allocations are authoring heuristics, not a calibrated proficiency model.

`recommendDailyPlan` continues to own question selection, complete stimulus groups, time budgets, due reviews, previous session recovery and observed difficulty readiness. Roadmap preferences add bounded priority weights. Neither a declared baseline nor a high target bypasses the existing requirement for sufficient accurate practice before advanced difficulty is favored. Focused Listening/Reading actions use this same engine with a filtered pool, rather than a second selection algorithm. Existing active sessions/plans resume as before; saving a new profile does not mutate them.

For an unknown baseline, Parts without an answered attempt receive an explicit diagnostic priority (+48) until all seven have observations. This is coverage sampling, not a diagnostic TOEIC score. Selection still observes group/time/media constraints; completing the coverage can take multiple sessions.

The daily allocation divides available time into recall, Listening and Reading. It is a planning allocation, not measured time-on-task or a claim that content exactly fills the budget. Individual sessions use the existing 10/20/40-minute estimates; complete groups can require a longer sitting than a very small per-section allocation. Learners can spread those across sittings. A calendar day elapsed is never counted as mastery. Actual activity dates, answer counts and review events are displayed separately. Recent weakness suggestions require at least three distinct questions in a leaf skill over the preceding 21 days. Small samples are not a diagnosis.

The app does not predict TOEIC scores or promise 990 in a month. Unknown baseline, ambitious short deadlines and expired plans receive contextual guidance. Selected rest days do not accumulate obligations. Available practice remains finite; the app does not silently manufacture or repeat items to meet an advertised new-question quota.

## Reminder behavior and limits

`vocabularyReminder.version = 1` is opt-in. It stores a local HH:mm, daily notification claim and optional dismissal day in IndexedDB preferences. Due words are resolved from existing FSRS cards; no new copy of the review queue or scheduling state is created.

- In-app reminders appear after the selected time, when known words are due and no question session is active. **Để sau hôm nay** dismisses that day's reminder without modifying a card.
- System permission is requested only by a learner click. Secure context and browser support are checked; the app does not request permission on page load. A transactional claim prevents multiple tabs making more than one automatic notification attempt per local day. Permission denial/media-platform failures retain the in-app queue. A failed platform attempt is not retried repeatedly that day.
- Delivery checks run in an open document on the existing clock/focus refresh, approximately every 30 seconds while timers are serviced. Suspended/background tabs can be delayed. The service worker displays a notification and routes its click to the review queue, but it does **not** provide a reliable background clock after the app is closed. See the [MDN notification guidance](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API) and [background-operation limits](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation).
- Calendar export creates a UTF-8 `.ics` recurring local-time reminder with an alarm and the deployment-aware review URL. Its stable per-site UID helps avoid duplicate calendar events on repeated import. The learner must import/enable it in their calendar. It reminds daily, even when no words are due, and does not synchronize queue counts or observe later app preference changes. Disable/delete it in the calendar when no longer wanted. Real calendar client delivery is owner-unverified.
- No push backend, email, paid API, background-sync promise or external learning-data transmission was introduced.

## Persistence and compatibility

The two optional preference objects carry their own version, and pass the shared live-read/backup record validator. The IndexedDB table layout stays at v9: no new tables, destructive migration, reseeding or learner-profile opening was needed. Existing preferences without these objects remain valid. The current backup flow includes them in its normal integrity hash, preview, merge/replace and recovery checkpoint. Use the updated app to restore the extended preferences; an older app can reject an unfamiliar target such as 700 even though it recognizes the table version.

Preference forms update only their owned fields in a read/write transaction so reminder/profile changes are retained. Review card IDs, due times, FSRS state, attempts, scores and saved contexts are not rewritten. Content collection and authoring tools have no IndexedDB access.

## Content collection and editorial handoff

This work actually collected **20 source candidates** from [TOEIC Question Ocean](https://github.com/kdeppaei/toeic-question-ocean), snapshot `a940bb8b479ef4d06af468015d757041c3d2e457`. Its [MIT license](https://github.com/kdeppaei/toeic-question-ocean/blob/a940bb8b479ef4d06af468015d757041c3d2e457/LICENSE) and attribution are preserved in `content/sources/toeic-question-ocean/LICENSE.txt`. The exact downloaded source is archived beside it, with SHA-256 metadata in `source.json`.

The full permission notice is also included at `public/licenses/toeic-question-ocean-MIT.txt` for packaging in future learner builds; source attribution and license URLs remain attached to each adapted question/stimulus.

`npm run content:collect` is a narrow, pinned public-source adapter. It downloads only the declared source and license, bounds size/time, rejects redirects, checks the expected license, parses literal data with the TypeScript AST and **never executes remote JavaScript**. Existing differing archive bytes are not overwritten. To add another source, inspect its rights and shape deliberately and create a new source revision/adapter. Public availability alone is not permission to redistribute a bank. This is not a general scraper for STUDY4/ETS or commercial sites. The existing [STUDY4 terms](https://study4.com/terms/) do not supply a reusable bank license for this app.

Twelve candidates were selected for Vietnamese explanations/distractor notes and skill/vocabulary tagging. The other eight remain source candidates, not questions counted in the app. In particular, P2-087 was not selected because a past-tense question about who approved a policy is paired with a future-intent response; it needs editorial clarification. Selection does not assert a human review of the remaining items.

Thirty additional original questions provide two three-question conversations (one with a visual exhibit), a three-question talk, twelve varied grammar/usage items, one four-blank completion text and a five-question triple passage. All Part 7 items have exact evidence references. Audio is explicitly synthetic; no new photographic or recorded-audio coverage is claimed.

The resulting **42-question v3 package** is `content/packages/learning-path-2026.json`. `scripts/prepare-learning-content.ts` is the authored source and preparation tool; it validates relationships and duplicate warnings and writes with exclusive creation. It never overwrites an existing package or installs it. Its `NEEDS_REVIEW` state records machine validation only. No human approval or certification is fabricated, and the sealed assessment allowlist is untouched.

To review, run the existing local `npm run studio`, open the package JSON in Content Studio and use the normal validation/review/export flow. Opening source JSON deliberately resets review claims. The existing rule remains: **new v3 packages must reach PUBLISHED through a named human review before `--install`**. Approve the answer key, distractors, language, evidence and rights only after actually reviewing them. No new item has been activated by this change.

| Part  | Active practice before/after this change | New items awaiting review | Practice after future approval/install |
| ----- | ---------------------------------------: | ------------------------: | -------------------------------------: |
| 1     |                                        7 |                         0 |                                      7 |
| 2     |                                       29 |                        12 |                                     41 |
| 3     |                                       33 |                         6 |                                     39 |
| 4     |                                       27 |                         3 |                                     30 |
| 5     |                                       70 |                        12 |                                     82 |
| 6     |                                       20 |                         4 |                                     24 |
| 7     |                                       48 |                         5 |                                     53 |
| Total |                                  **234** |                    **42** |                                **276** |

The active catalog additionally retains 200 reserved mock items and 18 Tutor transfer items: **452 active questions total**. The original 34 are the starter subset, not today's total practice inventory. The 42 staged items are deliberately excluded from all live counters and assessment assembly. Existing complete structural mock availability remains **one unreviewed 200-question sample**. No new full mock, licensed photograph, natural recording, independently calibrated difficulty or human certification was added.

## Verification level

- `npm run check:tests`: compiler check only, passed; no tests executed.
- `npm run build:dev`: TypeScript plus Vite development-mode build, passed. The existing Vite native-config future-compatibility warning remains; it concerns extensionless imports/JSON attributes in existing build/content files. No warning suppression was added.
- `npm run validate:content`: active bundled bank/media-reference validation passed, **452 total**, **234 practice**, **200 mock**, **one complete structural mock**, **zero issues/near duplicates**.
- `npm run content:import -- content/packages/learning-path-2026.json --report-name=learning-path-2026-review`: passed in dry-run; **42 candidates**, **zero bank/exam/near-duplicate issues**, **installedNew: 0**. Report: `docs/content/learning-path-2026-review.json`.
- Changed-source formatting and whitespace were checked. These are static/build results, not semantic certification or browser behavior evidence.

Automated tests, browser UX/UI, speech/notification/calendar delivery, real-profile persistence, backup round trips, PWA installation and production deployment remain unverified in this change, under the owner's manual-runtime policy.
