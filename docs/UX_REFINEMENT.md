# Task 06 product refinements and verification boundary

The existing editorial layout, learning workflow and architecture were retained. No dedicated UI/UX or frontend-design skill was available in the session catalog; none is claimed as applied.

## Implemented changes

- Warm ivory/sage/brass surfaces now use ink navy for reading; dark mode uses restrained navy surfaces. Muted/faint text tokens were strengthened. Shared spacing, reading/note size, radius and motion tokens document the existing system.
- Practice has an explicit **Tập trung / Hiện điều hướng** toggle. It hides the persistent rail/footer while retaining the toolbar, accessible navigation and an obvious exit. It does not alter session state, timers or grading.
- Mobile/tablet question groups include a sticky return-to-audio control. It returns focus to the **same** reusable media player; it does not create a second playback owner or bypass Exam replay rules.
- Page-entry, answer selection, answer reveal, completion and progress use short CSS transitions. Page animation is keyed to the route, not each answer/clock tick. Reduced-motion preferences disable these effects. Removing the only motion-library rendering path avoids loading that runtime for a progress ring.
- Recall cards focus the new card title, keep answers out of the accessible tree until reveal, expose expanded/controlled relationships and focus the revealed answer region. Native buttons/radios keep keyboard operation. The reveal animation does not delay the rating controls.
- Real milestones recognize a completed session, ten distinct attempted questions, ten self-rated recall reviews and five nonconsecutive learning days. Repeats/omissions/automatic mistake scheduling cannot inflate these counts. Milestones never alter skill evidence, accuracy or FSRS state and are explicitly not mastery certification.
- Saved review lists reveal 40 records per page, with an explicit “more” action. Existing session/plan/Tutor pagination remains. Dictionary overlays and management UI load in separate chunks; contextual lookup retains its explicit selection trigger.
- Existing semantic controls, feedback icons/text, dialog/popover focus behavior, return-to-question links and Exam assistance gating remain. Shared interactive targets have a 28 px minimum, with 44 px coarse-pointer targets for key learning controls; mobile inputs use 16 px text to avoid automatic zoom.
- Data management has labeled file selection, a scrollable preview table, actionable errors, explicit destructive confirmation, visible recovery, and useful unsupported/empty/loading states. No placeholder save/import/install actions were introduced.

## Static accessibility checks

Automated checks cover selected light/dark token pairs at 4.5:1 for normal reading, muted text, errors, primary buttons and brass text. Reduced motion, forced-colors rules, keyboard-native controls and local manifest icon dimensions were inspected. These checks do not establish every composited contrast pair, focus order, touch target, high-contrast layout or WCAG 2.2 AA conformance.

[WCAG 2.2 target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) describes a 24 CSS px minimum with exceptions; the product's 44 px coarse-pointer policy is a design target, not a claim that every element has been measured in a browser.

## Performance evidence, 21 October 2026

The pre-change production log reported 348.92 kB for the entry chunk plus 482.02 kB for its shared UI chunk (830.94 kB combined, 263.03 kB gzip). Its complete import closure was not recorded. Current exact initial static dependency sizes and packaged assets are reported by `npm run audit:build`; they must be regenerated after source changes.

Local WOFF2 subsets now explicitly include Vietnamese/Latin/Latin-ext and unicode ranges, retaining IPA coverage and original OFL licenses. WOFF fallback duplicates are no longer packaged. No font or media CDN is required. UI import splitting does not split or mutate the domain question bank.

`npm run profile:local` measures warm lookup/search algorithms and a 2,000-session/attempt/evidence snapshot in **Node 24 with fake IndexedDB**. A separate uncontended run measured approximately 0.0002 ms median lookup, 0.0076 ms median quick search and 36.0 ms median full read/validation (43.5 ms p95). A run concurrent with other gates measured 104 ms; the difference is not attributed to a code optimization. The 70.6 MiB heap sample is not a memory-leak profile.

These numbers do not measure page paint, browser disk storage, frames, real audio, mobile interaction or production loading. Full history reads still scale with retained records; very long histories should move to indexed incremental aggregates/query pages before making performance claims at that scale. Frequent timing/Tutor draft writes remain outside the global history subscription. Synthetic audio is not eagerly fetched as an unbounded resource set.

## Browser audit remains pending

Opening the isolated local browser was rejected by automatic approval review because its usage limit was reached. No bypass was attempted. **No desktop/mobile screenshot, real-browser walkthrough, real offline installation, screen-reader session or responsive overflow measurement is claimed.**

The owner checklist in `OWNER_REVIEW.md` covers Today → selection → Study/Exam → explanation → reference → Tutor → transfer → recall → progress → export/import → offline/update. The code/static audit and Node tests prepare that journey for manual acceptance; they do not close the browser audit.
