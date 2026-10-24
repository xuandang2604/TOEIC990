# STUDY 990

Không gian tự học TOEIC Listening & Reading bằng tiếng Việt, lưu tiến độ trên thiết bị. React + TypeScript + Vite + Dexie/IndexedDB; không cần tài khoản, backend hay API trả phí.

**Task 11 — 22/10/2026.** Có Content Studio riêng khi chạy `npm run studio`, vòng đời biên tập v3, dashboard chất lượng thật, import an toàn và phản hồi nội dung gắn với phiên bản. IndexedDB **v9** giữ riêng phản hồi; **100/100 tests** qua. Không thêm/publish câu mới; 452 câu hiện tại đều chưa có hồ sơ human review hợp lệ. Báo cáo hiện hành: [CONTENT_AUDIT.md](CONTENT_AUDIT.md), hướng dẫn [Content Studio](docs/CONTENT_STUDIO.md). Chưa nghiệm thu UI/media thật, không triển khai.

**Task 09 — 22/10/2026.** Đã triển khai Reading Studio, Listening Lab với dictation/shadowing tùy trình duyệt, Mistake Lab, 10 bài ngữ pháp tương tác và lưu từ cùng câu nguồn. IndexedDB **v8** bổ sung kho Studio, giữ nguyên kết quả/FSRS. **88/88 tests** qua, type checks/lint/content validation/production build qua; cảnh báo chunk nội dung lớn vẫn còn. Coverage và ranh giới kiểm chứng: [Premium learning report](docs/PREMIUM_LEARNING_TASK09.md). Chưa nghiệm thu GUI/audio/micro thật; không có screenshot hoặc triển khai.

**Question bank expansion — 22/10/2026.** Có **234 câu luyện**, **200 câu riêng trong một mock hoàn chỉnh về số lượng/cấu trúc**, và **18 câu Tutor**. 400 câu mới do AI biên soạn, chưa thẩm định giáo dục độc lập. **78 tests**, type checks, lint, content validation và production build đã qua; build vẫn cảnh báo chunk nội dung trên 500 kB. Báo cáo nội dung: [QUESTION_BANK_EXPANSION_REPORT.md](QUESTION_BANK_EXPANSION_REPORT.md). Task 08 là báo cáo lịch sử. Browser UX/audio thật vẫn chưa xác minh; không triển khai hosting.

## Cài đặt và chạy

Yêu cầu **Node.js 22.12+**, **npm 10+**; audit dùng Node 24.16.0 / npm 11.13.0. Mở terminal tại thư mục dự án:

```powershell
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173**. Port cố định; nếu bận, kiểm tra ứng dụng đang dùng port trước khi quyết định dừng nó. Dừng server của dự án bằng `Ctrl+C`.

Bản production có service worker:

```powershell
npm run build
npm run audit:build
npm run preview
```

Mở **http://127.0.0.1:4173**. Dev và preview là **hai origin, hai kho dữ liệu khác nhau**. `localhost`, `127.0.0.1`, port và profile trình duyệt khác cũng có kho riêng; chuyển tiến độ bằng export/import có chủ ý. Giữ ổn định origin/profile cho việc học lâu dài.

Cài lần đầu cần Internet. Audit cài theo lockfile bằng `npm ci --ignore-scripts --no-audit --no-fund`, sau đó build thành công. Font, ảnh và nội dung đóng gói local. Server in URL chỉ chứng minh đã khởi động, chưa chứng minh UI đã tải trên máy người học.

## Tính năng và trạng thái

| Tính năng | Hiện trạng |
| --- | --- |
| Practice 7 Parts; Part/skill/topic filters; shared stimuli; saved/mistake review; resume | IMPLEMENTED; assessment, render HTML tĩnh và giao dịch VERIFIED bằng Node tests |
| Study / Exam; mini mẫu 19 câu / 20 phút; mock 200 câu / 120 phút tổng; review theo Part | IMPLEMENTED; deadline, chấm một lần và hạn chế hỗ trợ VERIFIED ở tầng logic |
| Từ điển, Ctrl/Cmd+K, contextual lookup, trang từ và lưu ôn | IMPLEMENTED; lookup/search/save VERIFIED; selection, popover, touch và giọng thật NOT TESTED |
| 12 bài ngữ pháp, mini practice, liên kết về câu gốc | IMPLEMENTED; evidence/idempotency VERIFIED; browser focus/navigation NOT TESTED |
| FSRS, optional confidence, plan 10/20/40 phút, analytics thật | IMPLEMENTED; giao dịch review/plan/history VERIFIED; heuristic chưa hiệu chỉnh theo kết quả TOEIC |
| Tutor giải thích → hướng dẫn → viết lại → vận dụng | IMPLEMENTED; luồng application VERIFIED; PARTIAL về coverage, không phân tích bài viết như live AI |
| IndexedDB v9, migration, backup/import/merge/reset/quarantine | IMPLEMENTED; migrations v1–v8 và round trip VERIFIED trên fake IndexedDB; profile thật NOT TESTED |
| Reading/Listening/Mistake Labs, 10 micro-lessons, câu nguồn từ vựng | IMPLEMENTED; storage/text/learning contracts VERIFIED bằng Node; evidence coverage PARTIAL; GUI/micro/giọng thật NOT TESTED |
| Responsive, Light/Dark/System, keyboard, reduced motion, focus mode | IMPLEMENTED; kiểm tra tĩnh một phần; browser/a11y acceptance BLOCKED trong audit |
| Manifest, icon, bounded offline cache, explicit update | IMPLEMENTED; worker policy/output VERIFIED trong Node; installation/offline thật NOT TESTED |

### Bộ nội dung

| Part | Luyện sẵn sàng | Câu riêng trong mock | Tổng ngoài Tutor |
| --- | ---: | ---: | ---: |
| 1 · Photographs | 7 | 6 | 13 |
| 2 · Question–Response | 29 | 25 | 54 |
| 3 · Conversations | 33 | 39 | 72 |
| 4 · Short Talks | 27 | 30 | 57 |
| 5 · Incomplete Sentences | 70 | 30 | 100 |
| 6 · Text Completion | 20 | 16 | 36 |
| 7 · Reading Comprehension | 48 | 54 | 102 |
| **Tổng** | **234** | **200** | **434** |

Ban đầu có đúng 34 câu luyện và 18 câu Tutor, không có câu bị thất lạc trong IndexedDB. Đã nhập thêm **400 câu gốc**: 200 cho mock và 200 luyện thêm. Tổng catalog kể cả Tutor là **452**. Mock giữ riêng khỏi daily plan, bộ luyện và quick search; làm lại sẽ gặp cùng đề. Bộ mini cũ 19 câu vẫn là bài mẫu ngắn.

Có **13 ảnh CC0 thật**, **110 audio scripts tổng hợp** (103 mới), đọc đơn/đôi/ba văn bản, **106 mục từ** (thêm 18 mục phục vụ tagging), 12 bài ngữ pháp / 24 mini exercises. Mỗi câu mới có lời giải Việt, distractor reasoning, kỹ năng, độ khó, provenance và ít nhất một liên kết từ vựng; ngữ pháp được gắn khi là mục tiêu phù hợp. Không giả gắn bài ngữ pháp cho mọi câu hiểu ý.

Một mock 200 câu có đúng 6/25/39/30/30/16/54; Part 7 có 10 văn bản đơn / 29 câu và 5 nhóm nhiều văn bản / 25 câu. **120 phút là ngân sách tổng của lượt luyện**, không tái tạo lịch phát ghi âm hoặc chia giờ 45/75 của bài thi chuẩn. Nội dung AI chưa được người biên tập độc lập duyệt; chưa hiệu chỉnh độ khó/điểm số. Không có đề ETS sao chép hoặc quy đổi điểm TOEIC. Validator không thay thẩm định giáo dục.

Ảnh [Bookshelves — San906](https://commons.wikimedia.org/wiki/File:Bookshelves_906.JPG) dùng CC0, giữ nguyên file; 12 ảnh mới dùng thumbnail CC0 đã kiểm tra, xem [attribution mới](public/media/bank2026/ATTRIBUTION.md); [attribution gốc](public/media/ATTRIBUTION.md). Listening/pronunciation dùng **giọng máy**, phụ thuộc voice browser/OS, có thể cần mạng hoặc gói ngôn ngữ. Không có đúng locale thì nút tương ứng không giả phát thành công. Thiếu media có trạng thái rõ, không giả làm ảnh đề chính thức.

Study cho replay/tốc độ/transcript, tra cứu và feedback sau nộp. Exam lưu lựa chọn trước khi chấm, khóa lời giải/transcript/tra cứu, nghe theo thứ tự, phần đọc được quay lại; audio recovery được ghi nhận là hỗ trợ. Deadline giữ qua reload. Câu trống nằm trong mẫu số accuracy nhưng không tính là lượt trả lời hoặc failed recall giả. Nhóm chung tư liệu được giữ nguyên nên số câu có thể vượt mục tiêu đếm nhỏ.

### Tra cứu, ôn tập và Tutor

Chọn từ/cụm rồi nhấn **Tra** hoặc **Alt+Enter**; bôi đen để sao chép không tự mở popover. **Ctrl/Cmd+K** tìm từ, ngữ pháp, từ đã lưu và tham chiếu; ↑/↓/Enter/Escape, tìm Việt không dấu, tám tìm kiếm gần nhất. Search không lập chỉ mục đáp án/transcript/lời giải hay bài tự viết. Nguồn câu được giữ trong URL khi chuyển tài liệu. Exam đang mở khóa tra cứu.

FSRS qua `ts-fsrs@5.4.2`, fuzz tắt, policy có phiên bản; giữ rating/state history, due và lapses. Tham số mặc định chung, không tuyên bố xác suất nhớ cá nhân hay mastery từ một câu đúng. Plan dùng due, lỗi kỹ năng, goal, budget và phiên trước; bank nhỏ có thể cho plan ngắn hơn khung. Confidence là tín hiệu bổ sung; phân loại lỗi không phải chẩn đoán tâm lý.

Tutor offline có **9 chủ điểm / 27 nhánh lý do tự chọn / 28 câu có hướng dẫn riêng**, năm chế độ và transfer thật. Ngoài coverage dùng reference guidance có nhãn. Provider **không hiểu/chấm ngữ nghĩa bài viết tùy ý**; viết/sửa giải thích không tự tăng mastery/accuracy hoặc đổi FSRS. Chưa có live AI, API key hay translation mạng.

## Dữ liệu và khôi phục

IndexedDB `study990` **schema v9** tách content, history, review, preferences và working state. Một phiên active duy nhất; bắt đầu nơi khác tiếp tục phiên đó. Study giữ lựa chọn/confidence nháp; Exam giữ lựa chọn/cursor/deadline/playback. Không khôi phục chính xác vị trí tua audio. Transaction/operation IDs ngăn chấm/rating lặp.

V7 giữ migrations v1–v6, thêm trạng thái terminal `interrupted`. Phiên nhập có câu không còn trong bank có thể **đóng và giữ lịch sử**, không chấm phần còn lại hoặc tạo hoàn thành giả; plan liên quan được khép lại. Phiên khỏe không dùng được đường đóng này.

**Trước lần nâng cấp thật đầu tiên:** xuất backup, sao chép Tutor chưa lưu, đóng các tab phiên bản cũ. Tab v6 đang chạy chưa thể có giao diện phục hồi mới của v7. Audit không mở/xóa/migrate profile thật của chủ dự án.

Trong **Thiết lập học tập → Quản lý sổ học & khôi phục**:

- Backup **formatVersion 1 / databaseVersion 7**, 17 bảng học tập, FSRS policy và quarantine; nhận checksum-valid schema 6 và legacy flat v1–v5 qua adapter.
- Preview merge/replace; checksum SHA-256 phát hiện sửa/hỏng tình cờ, không phải chữ ký. Cùng giới hạn export/import **25 MiB / 100.000 bản ghi / depth 32**.
- Merge identical IDs không nhân đôi; linked history/FSRS/Tutor xung đột bị chặn. Không tự chọn lịch ôn hoặc chấm lại kết quả legacy.
- Replace/reset yêu cầu nhập chữ xác nhận, chặn phiên active/Tutor chưa lưu; một transaction giữ checkpoint trước thay đổi. Chỉ có **một** checkpoint gần nhất, hãy tải bản riêng trước thao tác tiếp theo.
- Bản ghi lỗi được giữ để cách ly/phục hồi. Giá trị corrupt không biểu diễn JSON có encoding gắn nhãn, không tự giải mã vào learning history.

Nháp Tutor autosave/CAS, có bản tạm trong bộ nhớ khi ghi thất bại. Bản tạm sao chép được từ màn lỗi kho/validation/render; chỉ bỏ sau xác nhận. **Bộ nhớ tab không bền vững**: crash/kill/đóng tab có thể mất phần chưa commit. Kho bị chặn hoàn toàn có thể không xuất được. Backup không mã hóa; xóa site data/profile, private browsing hoặc eviction có thể làm mất dữ liệu. Không dùng localStorage cho lịch sử lớn; không upload câu trả lời hay bài viết tới backend ứng dụng.

## Offline và cập nhật

Production có manifest/icon local và service worker. Chỉ sau khi cache cài hoàn tất, browser hỗ trợ mới có thể tải shell/content đóng gói khi mất mạng/server. Dev không đăng ký worker. Không cache API/remote responses tùy ý; giới hạn 1.000 file / 30 MiB, giữ shell hiện tại và một bản trước. Cache identity bao gồm asset bytes và worker policy.

Worker mới chờ cập nhật có chủ ý. Reload bị chặn khi phiên active, action đang chạy hoặc Tutor chưa lưu; chỉ tab yêu cầu được reload. Worker không sửa IndexedDB. Tab cũ hơn một cache có thể cần reload chủ động. Cache không thay thế backup; voice có thể không hoạt động offline.

Hosting tương lai cần HTTPS, đúng MIME/scope/cache headers cho `sw.js`, asset triển khai nguyên tử và nghiệm thu cài đặt thực. Hiện giả định origin root `/`; subpath phải sửa đồng bộ manifest/worker/URLs. Auth/sync/licensed updates/AI cần backend an toàn, consent và conflict policy; không có frontend API-key flow.

## Kiến trúc và scripts

`content/` giữ bank/schema; `domain/` giữ assessment, taxonomy, FSRS, recommendation và analytics thuần; `persistence/` giữ Dexie/migration/validation/backup; `application/` sở hữu use cases/giao dịch; `providers/` là dictionary/Tutor/speech boundaries; `features/`/`components/` trình bày. Route/reference UI lớn được lazy load. Global history snapshot vẫn đọc toàn bộ; cần indexed aggregates/pagination trước cam kết quy mô rất lớn.

| Script | Mục đích |
| --- | --- |
| `npm run dev` / `npm run preview` | Dev 5173 / production preview 4173, strict port |
| `npm run check` / `npm run check:tests` | TypeScript app / app + tests + scripts |
| `npm test` | Node tests: static React, fake IndexedDB, speech mock, worker VM; không browser E2E |
| `npm run lint` | Prettier + architecture/security rule scan; không phải ESLint |
| `npm run audit:architecture` | Runtime import cycles, domain boundaries, heuristic credential/unsafe execution scan |
| `npm run content:generate` | Biên dịch 400 bản ghi biên soạn riêng thành batch JSON; chỉ authoring cần Python 3 |
| `npm run content:import -- file1.json file2.json` | Preflight batch; thêm `--install` để kích hoạt, `--revise` cho revision mới có chủ ý |
| `npm run validate:content` | Schema, references, IDs, options, provenance, duplicates |
| `npm run build` / `npm run build:dev` | Production / development-mode bundle không minify |
| `npm run audit:build` | Asset inventory, worker identity, initial dependency closure, icon dimensions |
| `npm run profile:local` | Warm algorithms và fake storage trong Node; không đo browser/mobile |
| `npm run format` | Format app/config được khai báo trong script |

Tài liệu: [Architecture](docs/ARCHITECTURE.md), [Practice](docs/PRACTICE_ENGINE.md), [Dictionary/Grammar](docs/DICTIONARY_GRAMMAR.md), [Adaptive learning](docs/ADAPTIVE_LEARNING.md), [Tutor](docs/FEYNMAN_TUTOR.md), [Local-first/backup/PWA](docs/LOCAL_FIRST.md), [Content ingestion](docs/CONTENT_INGESTION.md), [Manual acceptance](docs/OWNER_REVIEW.md). Báo cáo nội dung: [QUESTION_BANK_EXPANSION_REPORT.md](QUESTION_BANK_EXPANSION_REPORT.md). [Task 08 audit](FINAL_AUDIT.md) và Task 06–07 là bằng chứng lịch sử.
