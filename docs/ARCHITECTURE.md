# Kiến trúc STUDY 990

## Ranh giới trách nhiệm

```text
src/
  content/       Schema + nội dung gốc; không có trạng thái học
  domain/        Taxonomy/evidence, FSRS adapter, adaptive plan, analytics, assessment
  persistence/   Dexie database, schema version 7, migrations giữ dữ liệu các Task trước
  application/   Use cases/giao dịch, snapshot dữ liệu, điều hướng, lỗi thao tác
  providers/     DictionaryProvider, TutorProvider, browser speech boundary
  components/    Shell, primitives, thiết lập, phát âm
  features/      Today, Practice, Dictionary, Vocabulary, Grammar, Review, Progress, Tutor
  styles.css     Design tokens, theme, component styles, breakpoints
```

Dependency: feature UI → application → domain/content + persistence. Domain không import React, Dexie hay browser APIs. `App.tsx` chỉ ghép provider, shell và route; các trang ngoài Today tải bằng dynamic import. Không có backend/auth SDK.

Dexie là chủ sở hữu trạng thái bền vững. `StudyProvider` đăng ký `liveQuery` và xuất snapshot nhất quán tới UI. Nháp lựa chọn/confidence của Study ở `studyDrafts`; lựa chọn Exam ở `responses`. View chỉ giữ bản nháp thiết lập, từ khóa tìm kiếm, trạng thái thẻ đang lật và mini practice ngữ pháp chưa lưu. Không sao chép lịch ôn/đáp án vào localStorage hay một kho khác.

Các lỗi thao tác được xử lý ở UI boundary qua `useAction`: khóa thao tác lặp, chờ commit, báo lỗi có thể hiểu được. Lỗi bất ngờ ghi category vào console và được trình bày dưới dạng lỗi lưu; không log phần giải thích của người học. Render boundary và storage subscription có màn lỗi riêng; không tự reset dữ liệu.

## Nội dung

`Question` có `schemaVersion`, ID ổn định, Part 1–7, options A–D, đáp án, giải thích chung/từng lựa chọn, takeaway, skill tags, độ khó, grammar/vocabulary references, passage/group ID, metadata audio/image. Các Part chưa có nội dung chỉ là khả năng của schema, không được quảng cáo là bài thực hành đã có.

`questions.ts` giữ 20 câu/ID Task 01 và ghép thêm 14 câu từ `expandedBank.ts`. `transfers.ts` cùng bank mở rộng giữ 18 câu vận dụng Tutor; tổng 52 câu, trong đó 34 câu luyện thường. `allQuestions` dùng cho lookup/thống kê. Stimulus có discriminant theo Part, audio/photo/exhibit/passage references, provenance và topic. `catalog.ts` kiểm tra bank một lần; dữ liệu lỗi có màn dừng nhận bài mới, không reset tiến độ. Xem [PRACTICE_ENGINE.md](PRACTICE_ENGINE.md) cho contract và chính sách Task 02.

Từ điển local có chỉ mục headword/forms và chỉ mục văn bản chung với grammar/câu tham chiếu. Chuẩn hóa một lần khi tạo index; query Việt không dấu; lookup cụm và dạng từ tường minh, không giả làm lemmatizer/translation service. `DictionaryProvider` UI chỉ sở hữu ý định mở overlay; selection, search, WordDetails tách riêng. Interface provider dữ liệu sync/async, translation và pronunciation là các boundary độc lập. Chưa có adapter mạng; implementation tương lai cần licensing, server-side secrets, validation và cancellation. Xem [DICTIONARY_GRAMMAR.md](DICTIONARY_GRAMMAR.md).

## Giao dịch và lifecycle

| Thao tác             | Ranh giới ghi                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Bắt đầu phiên        | Kiểm tra phiên active trong transaction; trả phiên cũ hoặc tạo một phiên mới                                           |
| Nộp đáp án           | Kiểm tra session/cursor, khóa ID `sessionId:questionId`, ghi attempt + thẻ sai hoặc lịch ôn + event cùng transaction   |
| Lưu nháp Study       | Kiểm tra active/mode/question/attempt; cập nhật phần thay đổi; nộp đáp án xóa nháp trong cùng transaction              |
| Sang câu             | Yêu cầu attempt tồn tại; so sánh question ID trước khi tăng cursor; câu cuối mới chuyển completed                      |
| Lưu thẻ              | Stable key `question:ID`, `vocabulary:ID` hoặc `knowledge:ID`; không đặt lại lịch của thẻ đã có                        |
| Ôn từ/kiến thức      | Operation ID + expected due timestamp, cập nhật card/event nguyên tử; tab khác không ghi chồng lịch cũ; kiểm Exam gate |
| Tự kiểm tra ngữ pháp | Evidence và lỗi sai cùng transaction, có snapshot và operation ID; không tạo TOEIC session hoặc tự rating thẻ          |
| Tutor                | Reflection theo attempt ID; tạo transfer session và gắn reflection cùng transaction                                    |
| Thiết lập            | Bản nháp cục bộ; chỉ Apply/Lưu mới ghi                                                                                 |

Session active giữ lại qua reload. Study lưu nháp lựa chọn/confidence vào `studyDrafts`, tách khỏi attempt; nháp Tutor autosave vào query riêng, có CAS/recovery branches và memory-only emergency copy khi ghi thất bại; phần chưa commit không được coi là bền vững. Exam lưu lựa chọn ngay vào `responses`, không chấm cho tới submit/timeout. Chấm và ghi snapshot/evidence/mistake/card/review event/timing cùng transaction. Phần time-on-task có checkpoint 5 giây, lease một owner và flush khi blur/hidden/unmount; không bù thời gian vắng hoặc tự điền số đo cũ. URL tài liệu mang `from`/`question`; return kiểm tra membership trước khi chuyển cursor, rồi focus câu gốc.

Các subscription, clock intervals, selection/keyboard/media-query listeners đều có cleanup. Speech adapter quản lý một playback hiện hành; nút cũ unmount không dừng phát âm do nút mới sở hữu. Có cancel, error callback, transcript fallback và timeout khi browser không phản hồi. Không có promise/timer sống vô hạn cố ý.

Không tự đóng database ở cleanup của React StrictMode vì đây là singleton app và live queries còn dùng. Khi browser đóng origin, IndexedDB tự kết thúc transaction; transaction chưa commit không được UI coi là thành công.

## Cơ chế học

### Active recall

Câu hỏi yêu cầu chọn/nộp trước khi hiện lời giải. Flashcard hiện từ trước, người học thử nhớ nghĩa/ví dụ, rồi mới lật và đánh giá. Transcript nghe là gợi ý mở theo yêu cầu; bản đầu chưa theo dõi việc dùng gợi ý, nên không dùng số liệu để kết luận về khả năng nghe độc lập.

### Spaced repetition

`domain/scheduler.ts` dùng `ts-fsrs@5.4.2`, fuzz tắt, fixed versioned policy và clock tường minh. Sai → Again; đúng dùng optional confidence để chọn Hard/Good/Easy. Thẻ vocabulary/knowledge tự đánh giá sau reveal. ReviewEvent giữ state trước/sau, nguồn rating và due. Không hiển thị retrievability mặc định như xác suất nhớ cá nhân.

Migration giữ due/history SM-2; rating mới bắt đầu FSRS state thận trọng, không bịa phép đổi ease→stability. Câu sai có lựa chọn lập lịch Again, thường bước 10 phút; omission chỉ vào queue, không giả failed recall. Các lượt truy hồi thật cho thẻ câu đã tồn tại cập nhật FSRS kể cả trong Practice/Tutor. Lưu thẻ lặp không reset. Policy, mapping, trạng thái và cơ sở nghiên cứu đầy đủ ở [ADAPTIVE_LEARNING.md](ADAPTIVE_LEARNING.md).

### Mistakes và thích ứng

Attempt mới có question snapshot, optional confidence/source, thời gian tương tác/unknown và metadata. Evidence theo leaf, aggregate parent dedup attempt. Mistake categories do người học tự ghi; repeated distractor và confidence mismatch là tín hiệu thận trọng. Legacy confidence mặc định 2 không bị coi là đánh giá chủ ý.

`recommendDailyPlan` dùng due, evidence 14 ngày, goal còn lại, previous-session performance, content/observed timing và difficulty policy; output là snapshot có lý do và item IDs. `plansRepository` sở hữu start/resume/finish transaction; UI không tự thay lịch hoặc giả completed. Kế hoạch 10/20/40 phút giữ unit, xen kẽ khi vừa budget, có thể ngắn hơn khung vì bank còn nhỏ.

### Tiến độ

Part accuracy gồm omissions và chỉ dùng câu TOEIC; skill accuracy gồm lựa chọn TOEIC và tự kiểm tra ngữ pháp, báo nguồn ngữ pháp và trống riêng. Parent không cộng trùng. Activity gồm câu có lựa chọn, tự kiểm tra ngữ pháp và từ/kiến thức đã tự ôn, không cộng lại review event cùng câu hoặc nhiều leaf cùng lượt. Goal ngày vẫn là lượt trả lời TOEIC. So tuần yêu cầu ≥5 lượt/≥3 câu khác nhau ở mỗi tuần, không kết luận thay đổi năng lực từ delta. Không có predicted TOEIC score.

### Tutor

Task 05 dùng `TutorProvider.generate(context, signal)` và schema/binding validation. Provider authored dùng câu/đáp án và reason ID người học tự chọn, **không đọc/chấm ngữ nghĩa reasoning**. 9 profiles/27 nhánh có năm mode. UI có bước viết lại và transfer thật, không phải chatbot. `tutorRepository` sở hữu root reflection, immutable turns và chuyển trạng thái; `sessionRepository` sở hữu start/resume, giữ API cũ qua re-export. Transfer dùng attempt/evidence/FSRS hiện có, không sao chép score hoặc tự gán mastery.

Draft autosave query riêng theo sổ, tách khỏi live snapshot toàn lịch sử. CAS version/root guards chặn stale writes; nháp xung đột có bản riêng để đối chiếu. Guidance/provider work ở ngoài transaction; commit kiểm lại version/Exam/cancel và lưu nguyên tử. Reflection legacy không bị giả tạo bước revision. Chi tiết luồng, failure/privacy contracts và backend tương lai: [FEYNMAN_TUTOR.md](FEYNMAN_TUTOR.md).

## Mở rộng có chủ đích

- Database version 2 bổ sung `responses` và `playbacks`; migration gán Study Mode cho phiên version 1, giữ các bảng và khóa cũ. Thay đổi tiếp theo cần migration mới, không xóa/reseed kho.
- Version 3 thêm `studyDrafts` và `recentSearches`, không biến đổi bản ghi v2. Search history chỉ ghi khi mở kết quả, tối đa tám query; có xóa chủ động. Export version 3 bao gồm cả hai bảng mới.
- Version 4 thêm evidence, mistakes/annotations, questionTimings/lease và dailyPlans; backfill có provenance, giữ dữ liệu gốc. Export v4 gồm scheduler policy/weights; lease tạm không xuất. Không thực thi migration trên dữ liệu browser trong lượt phát triển này.
- Version 5 thêm `tutorTurns`/`tutorDrafts`, giữ reflections/transfer links cũ. Optional root state chỉ xuất hiện khi có thao tác Tutor mới; không backfill guidance/revision giả. Định dạng export v5 cũ được adapter Task 07 hỗ trợ; định dạng hiện tại mô tả bên dưới.
- ID ổn định dùng được làm cơ sở sync; chưa có outbox/conflict policy hay tuyên bố đã sẵn sàng sync.
- Muốn mở rộng lịch sử: thay snapshot toàn bộ bằng query có index, aggregate theo ngày/skill và pagination; không làm một God Service chứa cả UI, I/O và mô hình học.
- Task 07 thêm service worker sản sinh từ production output, bounded precache, explicit activation và cache phiên bản trước cho tab cũ. Chưa xác nhận installation/offline trên browser thật.
- Task 07 thêm DB v6 (quarantine/recoveryPoints), shared record validation, backup format v1/schema 6, legacy adapters, stale-preview guards và atomic import/reset/repair. Merge chặn các lịch sử hoặc FSRS state cùng ID đã khác nhau. Một điểm khôi phục gần nhất, không recursive backup.

## Task 06–07 boundaries

`persistence/records.ts` owns record validation and dependency inspection. `persistence/backup.ts` owns file format/integrity, previews and transactional recovery use cases, separate from the question renderer and assessment domain. `features/data/DataPage` owns presentation/confirmation only. Invalid originals remain durable until explicit quarantine; even corrupt non-JSON numeric/structured values can be represented with a labeled portable encoding, never silently coerced into a learning record.

The global read view validates rows without rewriting them. High-frequency timing/lease/Tutor draft tables stay outside that live subscription. A single recovery token participates in preview freshness checks. Normal practice/review commits retain their existing authoritative transaction/CAS/idempotency boundaries.

`OfflineStatus` owns registration/update/install intent; generated worker code only owns bounded packaged cache reads. It never migrates, resets or synchronizes learner records. Active sessions, application operations and pending Tutor writes gate the initiating tab's explicit reload. Other tabs remain open; only one previous shell is retained.

Presentation refinements use CSS and native semantics; the unused motion dependency has been removed; CSS owns the remaining transitions. Content remains bundled/validated; backup files never replace application code or learning banks. Future bank ingestion is an accountable source-review workflow, not execution of imported JavaScript.

See [LOCAL_FIRST.md](LOCAL_FIRST.md), [CONTENT_INGESTION.md](CONTENT_INGESTION.md), [UX_REFINEMENT.md](UX_REFINEMENT.md) and [VALIDATION_TASK06_07.md](VALIDATION_TASK06_07.md) for contracts, current evidence and remaining browser gates.

## Task 08 integration repairs and audit

- DB v7 retains earlier migrations and adds an explicit terminal interrupted session contract. Only sessions with unavailable question content can be closed through the recovery use case. Linked active plans are archived, original attempts/responses/drafts stay intact, late commands cannot score/reopen the session, and completion metrics remain unchanged.
- Shared record inspection rejects modern correctness/snapshot contradictions, repeated answer choices, unsupported Part 2 answer D, inconsistent grammar evidence and authored Tutor bindings. Reconstructed legacy snapshots keep their historical outcomes instead of being regraded against newer content. Invalid originals remain recoverable through the existing quarantine path.
- Emergency Tutor draft recovery is a shared component that works without StudyContext/IndexedDB and remains visible on root storage, content-validation and render failures. Unload guards cover that recovery view. Memory copies are still tab-only and cannot survive a process crash.
- Backup format remains 1, current database schema is 7; checksum-valid schema 6 and explicit legacy adapters remain accepted. No real owner profile was migrated. Close old tabs and copy/export unfinished work before the first real upgrade; old resident JavaScript cannot receive these safeguards retroactively.
- Worker identity includes asset bytes and worker policy; worker-only updates receive a fresh cache namespace. It still never mutates IndexedDB.
- Runtime import graph: 106 TypeScript modules, 377 local edges, no cycles/domain-boundary violations reported by the executed AST audit. Type-only imports are erased and not counted. The heuristic credential/unsafe-code scan is not a formal security proof. No domain learning algorithm was duplicated or replaced.

Current commands, defects, educational review and exact browser/HTTP blockers are consolidated in [FINAL_AUDIT.md](../FINAL_AUDIT.md). Earlier Task 06–07 numbers are historical.

## Question-bank expansion, 22 October 2026

`src/content/generated/index.ts` is the active source-package registry. Four current packages add 400 questions; older unreferenced versions are archives, not extra runtime rows. `practiceQuestions` contains 234 items, `mockQuestions` reserves 200, and `allQuestions` adds 18 Tutor transfers. The question renderer, assessment and FSRS interfaces are unchanged. Daily recommendations and quick search consume practice inventory; stable-ID lookup can resolve every active question.

`domain/contentInventory.ts` validates mock membership/distribution/groups and counts distinct answered practice IDs separately from available inventory. `content/mockExams.ts` exposes only structurally complete sets. Session `mockExamId` is optional; an imported label alone cannot promote mismatched membership to a complete mock. DB schema remains v7 and no existing rows are migrated/reseeded.

`content:import` preflights complete batches, validates local media and optional hashes, screens exact/near duplicates, serializes source writers with a lock and activates immutable package revisions through one atomic registry rename. It never writes IndexedDB. V2 editorial metadata explicitly supports AI drafts. The authoring generator compiles individually authored records; it does not multiply template paraphrases. See [CONTENT_INGESTION.md](CONTENT_INGESTION.md).

Long exam navigation uses a native bounded disclosure while retaining existing keyboard buttons and Study/Exam gates. Current evidence and bundle warning are in [QUESTION_BANK_EXPANSION_REPORT.md](../QUESTION_BANK_EXPANSION_REPORT.md). Browser acceptance is still pending.

## Task 09 contextual learning boundary

Reading annotations/bookmarks, contextual vocabulary sentences and follow-up activities use additive schema 8. `domain/studio.ts` provides deterministic text/offset contracts. `application/studioRepository.ts` validates and commits the learning use cases; `persistence/studioRecords.ts` validates portable record shapes. StimulusView accepts a passage presentation slot, so the shared content renderer does not import storage or StudyContext. Study/review owners inject ReadingDocument; Exam retains the ordinary stimulus renderer and hides Lab aids. New grammar interactions share ChoiceChallenge and authored content rather than separate topic pages.

`learningActivities` deliberately does not mutate first-attempt assessment, Part analytics, skill evidence or FSRS. Self-explanation/completion is not mastery. Atomic contextual word saving adds a card only when absent and retains sentence context independently; an existing card's schedule remains unchanged. Schema-8 notes/activity/context rows participate in normal validated snapshots, versioned backups, preview and conservative merge conflicts. Current evidence and partial coverage: [Task 09 report](PREMIUM_LEARNING_TASK09.md).

## Task 11 content quality boundary

Content v3 adds an ordered, fingerprint-bound editorial lifecycle, explicit manual review and separate practice/assessment eligibility. Machine validation is never human approval. Existing unreviewed sample eligibility is frozen by question/package fingerprints; added or revised items do not inherit eligibility merely by using an allowlisted package ID. Status/eligibility for immutable installed packages is computed once per package; question labels compare the actual displayed snapshot.

The local editor is a separate Vite serve-mode entry at /__studio, with same-origin loopback-only filesystem middleware. No learner route imports src/dev/contentStudio and production artifacts are checked for exclusion. Production renderers are reused in preview. StudioStore owns separate draft-file CAS/atomic writes; contentActivation owns immutable staging and one registry commit. The CLI retains the source-writer lock and whole-batch preflight. The learner UI only creates contentFeedback records; development-only reviewRepository appends decisions without editing content/attempts. IndexedDB v9 and all normal backup/recovery paths include those reports. See [CONTENT_AUDIT.md](../CONTENT_AUDIT.md).
