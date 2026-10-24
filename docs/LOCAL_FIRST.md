# Local-first storage, backup and PWA

Current implementation: Task 11, 22 October 2026, database v9; see [CONTENT_AUDIT.md](../CONTENT_AUDIT.md). Studio details below for v8 remain historical. Current Studio evidence: [PREMIUM_LEARNING_TASK09.md](PREMIUM_LEARNING_TASK09.md). [FINAL_AUDIT.md](../FINAL_AUDIT.md) remains historical Task 08 evidence. No hosting, accounts, cloud sync or deployment has been performed.

## Ownership and schema

Bundled questions, reference entries, Tutor guidance and licensed media remain immutable source/assets. IndexedDB database `study990` owns user records. React consumes a validated read snapshot; it does not own the authoritative learning state. Large datasets do not use localStorage.

| Boundary               | Records                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Preferences            | `preferences`                                                                                                                    |
| Practice history       | `sessions`, `attempts`, `responses`, `playbacks`, `skillEvidence`, `mistakes`, `mistakeAnnotations`, `reflections`, `tutorTurns` |
| Review scheduling      | `cards`, `reviewEvents` (including pinned FSRS state/history)                                                                    |
| Saved working state    | `studyDrafts`, `tutorDrafts`, `questionTimings`, `dailyPlans`, `recentSearches`                                                  |
| Transient coordination | `timingLeases`; not exported or restored                                                                                         |
| Recovery               | `quarantine`, one `recoveryPoints/last-change`                                                                                   |
| Contextual learning    | `readingWorkspaces`, `learningActivities`, `vocabularyContexts`; separate from original attempts/FSRS |

Database **v8** adds Studio tables without rewriting rows. The v7 upgrade remains additive: it keeps the v6 recovery stores and v1–v6 upgrade sequence, and permits the terminal `interrupted` session state. It does not rewrite existing rows. An active session whose question content is unavailable can be explicitly closed while retaining submitted attempts, ungraded responses and drafts; its active linked plan is archived. No remaining answers are scored, no completion milestone is awarded and existing review state is unchanged. Healthy active sessions cannot use this action. They never delete/reseed an existing store. v4 retains legacy due dates and stored correctness; reconstructed snapshots/evidence are explicitly marked `legacy-current-content`. No upgrade pretends to recover the original question wording from an unavailable old bank. v5 remains additive for Tutor history.

`persistence/records.ts` validates shapes and dependencies for live reads and imports. Invalid records are excluded from learning calculations, counted visibly, and left in their original table until explicit repair. Management inspection additionally checks working-state tables omitted from the global live query. Repair moves original values/reasons into quarantine and removes only those source rows in one transaction. Missing content IDs are retained; availability is separate from record validity.

The global snapshot deliberately does not read timing leases, per-question timing checkpoints or Tutor drafts. Their frequent writes should not trigger a complete history reload. Tutor drafts retain CAS versions, recovery branches and a memory-only emergency copy. The latter is never described as durable. Management and root storage/content-validation/render error screens display these emergency texts even if their source question has disappeared; after copying elsewhere, an explicit checkbox/action can discard that tab-only copy and release the update/import guard. A successful write also releases the guard.

## Backup format and restore policy

Open **Thiết lập học tập → Quản lý sổ học & khôi phục** (`#/data`). Export, inspect an import, choose merge/replace, inspect integrity, request persistent storage, or reset there.

```json
{
  "format": "study990.backup",
  "formatVersion": 1,
  "databaseVersion": 8,
  "exportedAt": 1792540800000,
  "schedulerPolicy": "<the complete pinned policy object, not this example string>",
  "data": "<an object containing all 20 named learning tables as arrays>",
  "quarantine": [],
  "integrity": { "algorithm": "SHA-256", "hash": "<lowercase hexadecimal>" }
}
```

The example abbreviates objects; use an actual exported file for import. Hash input is canonical JSON of every root field except `integrity`: object keys sorted, array order preserved, undefined object properties omitted, finite JSON values only. SHA-256 detects accidental edits/corruption; it is **not** a signature or proof of authorship. It is computed outside the IndexedDB transaction. Complete current-format tables, supported policy/version and safe JSON shape are required. Checksum-valid format-1/schema-6/7 files are accepted into v8 with a compatibility warning and unchanged learning values. Flat legacy exports v1–v5 have an explicit adapter and a visible warning that no checksum was present. Tables mandatory for that historical version must exist.

The input cap is **25 MiB / 100,000 total records / depth 32**. Export refuses to produce a file beyond the same import limits. For a larger archive, keep the browser store intact and add a reviewed streaming/partitioned format before migration; do not delete history to make a backup fit. Maximum-size imports have not been profiled on low-memory phones.

JSON cannot preserve NaN, Infinity, Date, BigInt, Map, Set or typed-array values in an accidentally corrupt record. Export isolates such a record into quarantine with `encoding: study990.structured.v1`. Its `record` uses explicit type tags: objects store sorted `[key, encodedValue]` entries; arrays/sets store values; maps store encoded key/value pairs; numeric/bigint/date values use strings; binary values store type and byte arrays. These values remain diagnostic originals, never automatically decoded into live learning tables. Cyclic/deeper/unsupported objects cause an actionable failure; the database remains untouched. Repair checkpoints keep the original structured IndexedDB values.

Import always has a preview of current/incoming/new/conflicting IDs, including quarantine. New invalid rows require explicit permission to keep the valid portion and quarantine the originals. Existing quarantined records travel with the file and appear in warnings. Unsupported future versions and checksum mismatches are rejected.

- **Merge** adds new IDs and keeps identical existing records. Local preferences/recent searches win ID collisions. Divergent session, attempt, Tutor, review/card or other linked learning state blocks merging; two FSRS histories are not combined into an invented state. Divergent quarantine records with the same ID also block merging.
- **Replace** requires typing `THAY THẾ`. It replaces the current working record set with the validated file, retaining quarantined originals. It does not replace bundled content.
- **Reset** requires typing `ĐẶT LẠI`. It clears learning records/preferences/quarantine and transient leases, leaving bundled learning content and the pre-reset checkpoint.

Finish an active session (or explicitly close one whose content is unavailable) and save Tutor edits before import/reset. Checkpoint, table changes, quarantine and lease cleanup commit in **one transaction**. Quota/write failures roll back the entire change, including its new checkpoint. The preview fingerprint covers all backed-up records and the current recovery-point token; any concurrent relevant write requires another preview. This is local import safety, not a multi-device conflict-resolution protocol.

Before import/reset/repair, one checkpoint replaces the previous checkpoint. Export it separately and feed the exported file through the normal preview/replace flow to restore. Checkpoints are not recursively included in a normal backup. Keep a downloaded copy before the next management operation. A download-start message is not proof the OS saved the file.

## Errors and retention

Before the first real v8 upgrade, export/copy outstanding work and close old tabs: already-running older JavaScript cannot retroactively receive schema-8 behavior. The owner browser profile has not been migrated during this audit.

Storage failures surface through actionable application errors; programming/external failures are logged by category without learner text. There is no automatic reset. A failed boot/live read offers Retry and an independent raw-backup attempt; a completely blocked/unopenable IndexedDB cannot be exported by the app. Invalid cards do not get silently rescheduled. Import/export/checkpoint work stays outside learning UI renderers.

Storage estimate/persistent-storage requests are explicit user actions. Persistence grants are browser-dependent, do not create a backup, and do not prevent deliberate site-data deletion. Private browsing/profile deletion remains a data-loss boundary. Browser tabs/profiles/origins do not share a learning store.

## PWA and update lifecycle

`public/manifest.webmanifest` contains local 192/512 PNG icons, a maskable icon and standalone metadata; the SVG/book and Apple touch icon are local. The project currently assumes deployment at **origin root `/`**, including the manifest/icon/start URLs. A future subpath host must update these contracts together.

`build/offline.ts` generates `dist/sw.js` from the actual production output. Only bounded same-origin packaged resources are precached (HTML, lazy chunks, CSS, WOFF2, icons, licenses and licensed media). The inventory excludes build metadata/source maps and is capped at 1,000 files / 30 MiB. Cache identity hashes sorted asset paths/bytes and the generated worker policy, so a worker-only repair cannot reuse or delete the active cache after a failed install. Installation must complete the whole precache; failure deletes the partial new cache and retains the old shell. No remote API, dictionary or audio responses are runtime-cached.

Navigation uses the cached shell for a consistent application version. Listed assets are cache-first. Previously packaged hashed chunks can also be read from the one previous cache for an older open tab. Unknown assets use the network without being added to cache; non-GET/cross-origin/API requests are not intercepted. The worker never reads/writes IndexedDB.

The app registers the worker **only in a production bundle**, on a secure context with service-worker support. `npm run dev` does not register or unregister it. Unsupported/failed registration/install states are visible. Browser installation is offered only after a real `beforeinstallprompt` event; browsers without that event keep their native installation workflow.

New workers wait. An explicit update button activates/reloads **the requesting tab only**, disabled during an active session, pending application action or unsaved Tutor work. Other tabs are not silently reloaded. Current plus one previous app cache are retained; a tab older than that may need an explicit reload, particularly offline. User records remain in IndexedDB. Registration handles are cleaned up; update timeout is visible.

For local production use:

```powershell
npm run build
npm run audit:build
npm run preview
```

Preview uses **http://127.0.0.1:4173**, strict port. Development remains **http://127.0.0.1:5173**. These are different origins/stores; export/import intentionally transfers data. Do not change ports/hosts expecting browser storage to follow. Stop either server with Ctrl+C. Task 08 launched preview and observed its localhost-ready CLI banner, then stopped its owned server. HTTP probes were blocked (sandbox EACCES; approved probe ETIMEDOUT), so HTTP reachability and browser execution are not verified.

Loopback is treated as a trustworthy development context by supported browsers; a future non-loopback deployment needs **HTTPS**. Serve `sw.js` with revalidation/no-cache, correct JavaScript MIME, and the correct scope; hashed assets may be immutable. Deploy all files atomically so an install never sees mixed builds. Localhost build/policy tests do not establish production installability, browser eviction behavior or real offline audio. Synthetic voices may themselves need OS/network resources.

First-party references: [MDN service worker lifecycle/offline guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [MDN persistent storage request](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist), [Vite production build](https://vite.dev/guide/build.html).

## Future backend boundary (not implemented)

| Future capability        | Required boundary before implementation                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication           | Backend-issued secure sessions, account lifecycle, data export/deletion and explicit local-to-account migration. No secret in a Vite client variable.                                                         |
| Cross-device sync        | Versioned events, stable operation IDs, durable outbox, acknowledged checkpoints, tombstones and explicit resolution of competing mutable sessions/FSRS states. Backup merge is not sync.                     |
| Licensed content updates | Signed/versioned manifests, rights verification and immutable IDs/revisions. Retain historical question snapshots; verify assets before activating a bank.                                                    |
| AI tutoring              | Server-only keys, request consent, minimal structured question/lesson context, opt-in learner text, authenticated limits, output validation, cancellation/timeout and offline fallback. See FEYNMAN_TUTOR.md. |
| Analytics                | Consent and data-minimization design before collection. Separate product metrics from private learner writing and never upload it by default.                                                                 |

Core practice, dictionary, reference, scheduling and authored Tutor remain usable without any of these services.

## Task 09 schema-8 extension

v8 adds only `readingWorkspaces`, `learningActivities` and `vocabularyContexts`; the v1–v7 upgrade chain and every existing row remain. Reading offsets refer to canonical display text, identified by passage ID and a content fingerprint. Stale passage versions stay readable in exported data and are not applied to current passages. Revision checks protect note and micro-lesson writes; immutable follow-ups have idempotency IDs. Retry/transfer/dictation/micro-lesson records are separate from original attempts, skill evidence and FSRS ratings.

Current format-1 backups use databaseVersion 8 and include all 20 learning tables. Checksum-valid schema-6/7 files are verified before missing Studio tables are added in memory. The preceding schema-6-to-v7 description is historical; current parsing targets v8. Studio rows use the same validation, atomic recovery, import preview and conservative conflict rules as other learning records. Divergent same-ID notes or progress block merge. Before a real v8 upgrade, export work and close old tabs; no owner browser profile was upgraded in Task 09.

## Task 11 schema-9 extension

v9 additively introduces `contentFeedback`: version-linked question reports with immutable original snapshots and append-only editor decision history. These records never affect attempt correctness, skill evidence or FSRS. Current format-1 backups use databaseVersion 9 and **21** named learning tables; checksum-valid schema-6/7/8 backups receive missing newer tables in memory after integrity verification. Source authoring drafts remain separate filesystem files, not learner backup tables. Same-origin/profile rules apply to feedback as to all IndexedDB records. No owner browser migration was run in Task 11. Before first use, export/save work and close older tabs. Current contracts and evidence: [Content audit](../CONTENT_AUDIT.md), [Content Studio](CONTENT_STUDIO.md).
