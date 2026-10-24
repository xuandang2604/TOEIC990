# Chủ dự án tự kiểm tra runtime & UX/UI

Checklist runtime cho chủ dự án. Các mục dưới đây chưa được xác nhận trên browser thực. Task 08 đã chạy automated gates và khởi động/dừng production preview, nhưng HTTP probe bị môi trường chặn; browser opening vẫn bị automatic approval review từ chối vì usage limit. Không có browser UI/audio/screenshot/offline-install evidence. Xem [FINAL_AUDIT.md](../FINAL_AUDIT.md). Các mục Task 02–07 giữ bối cảnh lịch sử; dùng contract backup/schema hiện hành ở Task 08.

Chạy `npm ci`, `npm run dev`, rồi mở `http://127.0.0.1:5173` trên profile trình duyệt bạn muốn dùng lâu dài.

- [ ] Người mới: Home/Progress không có thống kê giả; bắt đầu học ngay từ Home.
- [ ] Chọn đáp án bằng chuột, Tab/phím mũi tên hoặc phím số; chọn confidence; submit; xem giải thích từng lựa chọn.
- [ ] Part 2: phát/dừng giọng tổng hợp; khi đã chọn đáp án, phát audio **không nộp bài**; thử khi không có voice; dùng transcript để tiếp tục.
- [ ] Part 7: đọc passage trên desktop/mobile; tra từ trong passage; các câu chung passage vẫn có đúng văn bản.
- [ ] Reload trước khi nộp: lựa chọn/confidence nháp được giữ nhưng không được tính vào kết quả/tiến độ. Reload sau khi nộp: kết quả đã lưu, hiện lại feedback; Tiếp theo không tăng số lượt lần nữa.
- [ ] Tạm dừng, qua từ điển/ngữ pháp rồi quay lại; bắt đầu một phiên khác phải tiếp tục phiên đang mở.
- [ ] Trả lời sai: câu xuất hiện ở bộ lọc Tất cả trong Ôn tập, có lịch FSRS và số liệu thật; hoàn thành phiên cho ra tổng kết thật.
- [ ] Chọn từ trong prompt, passage, ví dụ; popover có IPA/nghĩa/ví dụ/lưu; từ chưa có báo rõ. Thử touch selection nếu dùng điện thoại.
- [ ] Khi không có phiên Exam đang mở, Ctrl+K/Cmd+K mở search từ mọi trang; tìm Anh/Việt có dấu/không dấu; Escape đóng và focus trở lại chỗ hợp lý.
- [ ] Lưu từ; lọc Đã lưu; reload; ôn thẻ phải lật trước khi đánh giá; sau đánh giá thẻ chuyển sang lịch mới.
- [ ] Ôn câu đến hạn: trả lời đúng với confidence khác nhau hoặc sai; xem lịch đổi; không nhân đôi attempt khi nhấn liên tiếp.
- [ ] Grammar: tìm kiếm, mở đủ 12 chủ điểm, xem ví dụ/trap, mở bài liên quan; phiên cũ không bị ghi đè.
- [ ] Tutor: chọn câu đã làm, viết/lưu ≥10 ký tự, xem hướng dẫn soạn sẵn; hoàn thành phiên cũ rồi làm transfer; quay lại thấy kết quả và phần đã viết.
- [ ] Thiết lập: sửa rồi Hủy/Escape phải giữ giá trị cũ; Lưu mới áp dụng; reload vẫn giữ mục tiêu/theme.
- [ ] Xem Light, Dark, System, reduced motion và Windows High Contrast; dùng keyboard và zoom/text scaling.
- [ ] Thu nhỏ từ desktop xuống 320–520px: sidebar thành drawer; question/passages, dictionary, dialog, bảng tiến độ không tràn ngang.
- [ ] Thử hai tab cùng origin: tiếp tục cùng phiên, không ghi hai lần một đáp án; đánh giá thẻ cũ ở tab kia không ghi chồng lịch.
- [ ] Xuất JSON: kiểm tra tệp tải xuống chứa schemaVersion và tiến độ; nhớ rằng chưa có chức năng import.
- [ ] Chặn storage hoặc giả lập quota đầy bằng công cụ browser: hiển thị lỗi, không giả báo đã lưu hoặc tự xóa dữ liệu.

Không đổi sang `localhost` hoặc port khác khi đánh giá reload persistence, vì sẽ mở một origin/kho dữ liệu khác.

## Bổ sung Task 02

- [ ] Luyện đủ Part 1–7 trong Study Mode; cùng bộ lọc phải giữ đủ nhóm Part 3/4/6/7, hiển thị số câu thực tế.
- [ ] Part 1 hiện photograph local và nguồn CC0, không phải ảnh minh họa; thử lỗi tải ảnh và đọc thông báo.
- [ ] Part 3/4 có audio chung và bảng exhibit; chọn/submit một câu không dừng audio đang phát.
- [ ] Study: replay, pause/resume, đổi tốc độ khi dừng, transcript, lưu câu trước/sau nộp, điều hướng lại nhóm đã làm.
- [ ] Exam: Part 1/2 chỉ hiện nhãn lựa chọn; Part 3/4 vẫn có câu hỏi in sẵn; không có transcript/lời giải/tra từ trước khi nộp.
- [ ] Khi Exam đang mở, chuyển tới Home/Grammar/Tutor/kết quả cũ phải về màn yêu cầu hoàn thành phiên thi, không lộ nội dung hỗ trợ.
- [ ] Nghe xong không replay; không quay lại nhóm nghe trước; chuyển sang đọc có xác nhận và không quay lại nghe.
- [ ] Browser chưa có English voice: chờ tải voice, báo lỗi nếu không có; có retry hoặc bỏ qua, không treo phiên. Kết quả ghi điều kiện hỗ trợ.
- [ ] Reload trong lúc đang phát: trạng thái nghe gián đoạn được giữ; phát lại phải ghi hỗ trợ. Reload khi audio đã xong không mở replay.
- [ ] Part 6 có bốn marker và câu tương ứng, gồm chỗ trống cả câu; Part 7 double passage cùng hiện hai email.
- [ ] Mini-test có 19 câu/20 phút; chọn đáp án chưa tăng tiến độ; reload/rời trang vẫn giữ deadline. Thử nộp sớm còn câu trống và để hết giờ.
- [ ] Kết quả theo Part, mẫu số, số câu trống, review, thẻ lỗi và Progress nhất quán. Câu trống không tăng mục tiêu ngày.
- [ ] Dữ liệu Task 01 thật được nâng cấp mà vẫn giữ phiên, cursor, thẻ từ, attempt và theme. Automated migration test chỉ dùng IndexedDB giả lập.

## Bổ sung Task 03 — chưa chạy runtime

- [ ] Từ điển có 88 mục (84 từ đơn/4 cụm). Mở trực tiếp ID, từ chưa có và ID sai: không tự hiển thị một headword khác như thể đã tìm đúng.
- [ ] Tìm `phe duyet`, `approval`, `look forward to`, `passive`, `gioi tu`; bộ lọc All/Vocabulary/Grammar/Saved/Questions cho kết quả hợp lý, highlight đúng chữ có dấu.
- [ ] Ctrl/Cmd + K từ Home, Study, Review, Tutor, Grammar, Vocabulary. ↑/↓ cuộn kết quả được chọn; Enter mở; Escape trả focus; IME tiếng Việt không mở kết quả lúc đang composition. Scope/history/close dùng được bằng Tab.
- [ ] Mở kết quả mới: query xuất hiện ở tìm gần đây sau reload; giữ tối đa tám mục, không trùng có/không dấu; xóa lịch sử. Giả lập lỗi ghi để dùng “Mở tài liệu mà không lưu lịch sử”.
- [ ] Bôi đen để copy trong prompt/lựa chọn/passage/exhibit/transcript/ví dụ: chỉ có nút Tra, không tự mở nghĩa hoặc chọn radio đáp án. Tra bằng chuột, Alt + Enter và touch selection; chọn cụm dài/từ chưa có có trạng thái rõ.
- [ ] Popover desktop không che mất nút đóng/lưu; Escape và click ngoài đóng hợp lý. Trên ≤600px dùng bottom sheet, focus nằm trong sheet, đóng trở về nguồn. Khi trang từ vựng/ngữ pháp xếp thành một cột, chọn mục phải cuộn tới bài vừa mở; thanh trở lại câu hỏi vẫn dễ tiếp cận khi cuộn.
- [ ] Phát US/UK khi có đúng voice; khi thiếu một hoặc cả hai voice có thông báo/nút kiểm tra lại. Không dùng giọng Mỹ dưới nhãn UK; đổi voice hệ điều hành khi trang đang mở; thử giọng cần mạng ở offline. Estimate/refund/contract nghe cụm danh từ, đối chiếu IPA với audio thiết bị.
- [ ] Lưu từ từ popover/trang chi tiết, nhấn liên tiếp không nhân đôi thẻ, trạng thái đã lưu cập nhật ở trang Vocabulary/quick search/Review. Ôn thẻ vẫn theo lịch cũ, lưu lại không reset.
- [ ] Cả 12 bài có công thức, ví dụ đúng/sai, traps, từ và câu liên quan. 24 mini exercises không lộ đáp án trước Kiểm tra, phân tích đúng lựa chọn, Làm lại reset. Rời bài sẽ đặt lại UI mini practice; Task 04 giữ lịch sử đã submit, không làm tăng accuracy Part hoặc tự thay lịch FSRS.
- [ ] Study nhóm nhiều câu: chọn đáp án/confidence ở câu 2/3 rồi tra từ, mở Grammar → Vocabulary → Review. Trở lại câu hỏi phải giữ nháp, cursor/nhóm và focus đúng câu; reload ở trang tham chiếu vẫn trở lại được. Nháp chưa nộp không tăng tiến độ.
- [ ] Từ review của phiên đã hoàn thành, mở tài liệu rồi Trở lại kết quả: mở lại đúng nhóm/câu review, không tạo phiên mới. Query `from/question` sai không chuyển cursor vào câu ngoài session.
- [ ] Phiên Exam active: Ctrl/Cmd+K, Alt+Enter, chọn từ, URL Vocabulary/Grammar/Reference/Review đều không lộ tra cứu. Rời trang không dừng deadline.
- [ ] Kho v1/v2 thật nâng lên v3 giữ tất cả dữ liệu; close/reopen và hai tab cùng origin không ghi đè nháp cũ vào câu đã nộp. Export JSON v3 chứa cả drafts/history; chưa có import.
- [ ] Light/Dark/System/High Contrast, zoom/text scaling, 320px, touch và screen reader: kiểm combobox active option, radio groups, nội dung IPA, nút lưu và return focus. Đây vẫn là owner acceptance, chưa được Codex xác nhận.

## Bổ sung Task 04 — owner tự kiểm tra

- [ ] Tự kiểm tra ngữ pháp ghi đúng một lượt activity dù bài gắn nhiều skill. Submit lặp không nhân đôi; Làm lại là lượt mới. Lượt sai có prompt/selected/correct option/time/skill trong Sổ lỗi; reload giữ dữ liệu. Part, daily goal và độ chính xác TOEIC không tăng; bản đồ kỹ năng ghi rõ số lượt ngữ pháp. Lỗi nối được về bài và lịch ôn knowledge liên quan. Khi Exam bắt đầu ở tab khác, submit tham khảo/ôn thẻ bị chặn trong repository.

Task 04 không thêm/sửa/chạy automated tests, không mở browser/runtime. Checklist này dành cho kiểm tra thủ công; TypeScript/build không chứng minh migration, timing hoặc tương tác đa tab đã đúng trên browser.

- [ ] Trước nâng kho thật: xuất JSON cũ. Mở bản mới ở cùng origin/profile; kiểm migration v1/v2/v3 → v4 giữ attempts, cards, dueAt, streak/lapses, preferences, drafts, lịch sử tìm kiếm và transcript/playback state; không reset/reseed.
- [ ] Với dữ liệu cũ: confidence 2 vẫn có trong dữ liệu nhưng được đánh dấu chưa rõ, không cộng vào tín hiệu tự tin; thời gian cũ hiện chưa có đo. Câu không còn trong bank vẫn nằm trong export, không bị tự gán kỹ năng.
- [ ] Study mặc định “Bỏ qua” confidence. Thử từng mức, đổi về bỏ qua, reload bản nháp rồi nộp; correctness độc lập với confidence. Exam không tự ghi confidence 2.
- [ ] Sai câu hỏi: đủ snapshot prompt/options/answer/tags, mistake/evidence và card/review event trong cùng lần commit. Đúng confidence thấp và sai confidence cao có lời nhắc thận trọng; không khẳng định đã đoán hoặc có tâm lý nào.
- [ ] Trong feedback/Review, tự ghi nguyên nhân knowledge gap / áp dụng nhầm / đoán / áp lực thời gian / chưa rõ; reload, lọc và sửa ghi nhận. Hai session cùng distractor sai mới có tín hiệu lặp, một session không bị đếm hai lần.
- [ ] Kỹ năng cha dedup một câu gắn nhiều leaf. Skill accuracy loại omissions khỏi mẫu số và báo riêng; Part raw accuracy vẫn gồm omission. Ít dữ liệu không có nhãn thành thạo hoặc dự đoán điểm.
- [ ] Khi đọc/nhập đáp án, focus câu 2/3 trong group phải chuyển time-on-task về câu đó. Background/blur/dialog lookup/Settings tạm ngừng; refresh/đóng tab không tự bù thời gian vắng. Hai tab chỉ có một lease cộng thời gian. Thử sleep/wake và thay đổi đồng hồ.
- [ ] Legacy card chưa được rating phải giữ nguyên due. Lật từ/knowledge rồi thử các mức rating: due/state và history trước/sau commit; reload khớp label lịch. Đừng dùng kỳ vọng 1 ngày/6 ngày của scheduler cũ để đánh giá FSRS.
- [ ] Từ Grammar lưu thẻ knowledge không reset thẻ đã có. Mặt trước yêu cầu tự giải thích, mặt sau có cấu trúc/ví dụ; chỉ rating sau reveal. Review history/first encounter/lapses/next due có thật và xem thêm được.
- [ ] Câu sai ban đầu được lập bước Again, không tăng “lượt ôn đã hoàn thành”. Bỏ trống có card để củng cố nhưng không sinh rating quên giả. Luyện lại một thẻ câu đã tồn tại cập nhật FSRS kể cả Practice/Tutor.
- [ ] Nhấp/rating lặp, submit lặp và hai tab cùng một thẻ không nhân đôi attempt/evidence/event hoặc đẩy lịch hai lần. Cửa sổ đang giữ expected due cũ phải báo mở lại thẻ.
- [ ] Kế hoạch cold start 10/20/40 có lý do và thời lượng ước tính, không giả biết khả năng. Sau lượt sai/review due/phiên gần nhất, gợi ý phản ánh dữ liệu local mới; đổi duration có preview và được lưu khi bắt đầu.
- [ ] Plan giữ group audio/text nguyên vẹn, không vượt estimated time budget; số câu có thể vượt mục tiêu đếm nhỏ để giữ group. Bộ mẫu ít thì hiện kế hoạch ngắn hơn, không fake nội dung cho đủ 40 phút.
- [ ] Bắt đầu plan, ôn thẻ, sang phiên câu hỏi, rời trang/reload rồi tiếp tục. Sau kết quả có đường về plan; chỉ khi có review events/session completed thật mới hoàn thành. Khép lượt sớm giữ lịch sử; session khác không bị ghi đè. Plan/session cũ mở được từ Progress.
- [ ] Progress filter 7/28/all khớp dữ liệu ngày local; activity không cộng trùng question review, có thêm từ/knowledge thật. Part/skill/queue/frequently missed dùng đúng mẫu số. Trend tuần không có dữ liệu là gap; delta tuần chỉ khi đủ mẫu và không được gọi là thay đổi năng lực.
- [ ] Thử storage denied/quota/record card sai shape/clock lùi: lỗi rõ, không giả commit hoặc reset dữ liệu. Lỗi transaction không được để attempt đã lưu nhưng card/evidence chưa lưu. Export JSON v4 có full learning history, confidence provenance, timing, plan và scheduler policy/weights; chưa có import.
- [ ] Exam active tiếp tục khóa Dictionary/Grammar/Review/Progress/Plan từ URL và shortcuts, timer không bị reset. Snapshot/lời giải chỉ được dùng ở review sau nộp.
- [ ] Light/Dark/System/High Contrast, keyboard, zoom/text scale, 320px: duration controls, taxonomy expand buttons, trend, card ratings, history details và return-to-plan dùng được; không bị bảng/cây rộng che nút chính.

## Bổ sung Task 05 — Tutor, chưa chạy runtime

- [ ] Lượt sai từ Practice/Mistake Review mở Tutor đúng attempt; câu đúng có confidence thấp cũng mở được. URL ID không tồn tại không tự thay bằng một lượt khác. Câu chưa nộp/Exam đang mở không được lộ hướng dẫn.
- [ ] Với 9 chủ điểm hỗ trợ, chọn từng lý do và “Cách nghĩ khác”: observation/follow-up khớp lựa chọn tự báo cáo. Thay nội dung bài viết nhưng giữ reason ID không được giả tạo phản hồi semantic. Câu ngoài coverage có nhãn tham chiếu rõ ràng.
- [ ] Năm chế độ đều có nội dung: nói đơn giản, các bước, mọi distractor, ví dụ thay cấu trúc/ngoại lệ và kiểm tra cách hiểu. Tablist dùng chuột/touch, mũi tên/Home/End; bước Kiểm tra đưa tới ô viết lại hoặc transfer, không trả điểm hiểu biết giả.
- [ ] Gõ nháp rồi blur/đợi trạng thái đã lưu; rời trang/reload giữ text, lý do và stance. Loading/read failure không cho gõ đè bản nháp chưa mở. Storage denied/quota không giả lưu thành công.
- [ ] Nộp cách nghĩ ban đầu rồi sửa hiểu biết: cả hai bản còn trong history. Ba stance đổi prompt phù hợp; “còn băn khoăn” vẫn được lưu và thử transfer. Nộp giải thích không thay accuracy, skill evidence hoặc FSRS.
- [ ] Trước revision chưa mở được transfer mới. Sau revision, session khác đang active phải được tiếp tục, không bị gắn giả làm transfer. Câu mới không lộ đáp án trước khi nộp; reload tiếp tục phiên đó.
- [ ] Transfer ưu tiên câu chưa làm; hết các câu liên quan thì ghi “luyện lại”. Giữ nhóm chung stimulus trong fallback. Trường hợp bank chưa có unit khác phải hiện thiếu coverage, không tạo câu giả.
- [ ] Sau transfer, x/y và review đúng với practice history, skill evidence/mistakes/FSRS theo Task 04. Hoàn thành phiên có nút về sổ Tutor; một lần đúng không được gọi là mastery. Đáp án sai có đường về Review/Grammar.
- [ ] Mở Grammar/Vocabulary từ Tutor, đi qua liên kết khác, reload rồi Trở lại Tutor vẫn đúng attempt. Trở lại câu gốc đang active phải đổi cursor về đúng nhóm; nháp Study và Tutor không lẫn nhau.
- [ ] Hai tab: autosave/submit/revision/transfer lặp không nhân đôi hoặc ghi chồng. Tab bị stale giữ nội dung ở “Nháp cần đối chiếu”; đọc/chọn/sao chép được sau reload. Kiểm cả trường hợp một tab đang gõ khi tab kia nộp hoặc mở transfer.
- [ ] Kho v1–v4 thật lên v5 giữ attempts, cards/due/history, preferences, plans, reflections và transfer links. Tutor legacy chưa có revision phải được nói rõ; mở hướng dẫn mới giữ bản giải thích cũ, không dựng bước học lịch sử giả.
- [ ] Provider timeout/cancel/output sai bằng công cụ phát triển: không commit guidance lỗi, không mất nháp, có thông báo thử lại/reference. Rời Tutor khi đang mở guidance không được commit response stale vào luồng mới. Hiện không có backend request.
- [ ] Export JSON schema 5 có reflections, tutorTurns, drafts/recovery branches cùng dữ liệu cũ. Chưa có import. Nháp chưa commit khi đóng browser đột ngột có thể mất phần đuôi; không đánh giá bằng kỳ vọng flush khi process bị kill.
- [ ] Desktop/320px, zoom/text scale, Dark/Light/System/High Contrast và reduced motion: notebook, rail tham chiếu, lý do/stance, năm mode, editor, lỗi lưu và return links đọc/dùng được; focus hợp lý, không tràn nút chính.

Coverage và contracts: [FEYNMAN_TUTOR.md](FEYNMAN_TUTOR.md). Task 05 không chạy automated tests hoặc runtime/UX/UI.

## Task 06–07: retained manual acceptance baseline

Task 07 explicitly authorized automated gates and production build. Their current evidence is in VALIDATION_TASK06_07.md. Earlier Task 04/05 “not runtime-tested” notes describe those development passes, not a claim that the new Node tests verify a real browser. Browser opening was rejected by automatic approval review because of usage limits; these items remain unchecked.

Use an exported backup and a disposable browser profile for destructive/restore scenarios. Do not clear the owner's production site data for acceptance testing.

- [ ] Desktop 1440×900, tablet 820×1180, mobile 390×844 and 320 px: Today → part/skill filter → shared questions → results. Check density, 200% text/zoom, long passages, no page overflow and useful empty states.
- [ ] Toggle focus in a Study/Exam session, restore navigation and leave/resume. Confirm cursor, deadline and one-pass audio policy remain unchanged. On a small screen use “Về điều khiển âm thanh”; confirm it focuses the same player without creating duplicate speech.
- [ ] Keyboard-only: skip link, menu/dialog, part/skill controls, answer/confidence radios, reveal/rate, global search ↑/↓/Enter/Escape, popover/sheet, Tutor five modes, back-to-question and management controls. Check logical focus restoration after reveal, close, next card and route change.
- [ ] Light, dark, system and Windows high contrast; reduced motion; screen reader labels/status/results. Verify visible selected/correct/incorrect text/icons independent of color. Static token contrast checks do not cover every rendered combination.
- [ ] Save a word, follow Grammar → Vocabulary → Review and return to the original question. Reveal/rate vocabulary and knowledge cards; verify their actual due dates. Complete real milestones without increasing mastery or counting omissions/repeated IDs as new questions.
- [ ] Capture desktop/mobile screenshots of Today, practice with shared media/passage, dictionary sheet, Tutor, results and import preview after the visual checks.
- [ ] Before a real upgrade, export the old file. At the same origin/profile verify migration preserves sessions/attempts, correct/omitted outcomes, confidence provenance, legacy due dates, FSRS state/history, Tutor turns/drafts/recovery branches, plans and settings.
- [ ] Export → inspect in a disposable profile → replace → reopen/refresh: exact history, review state, unfinished question/draft and Tutor turn links remain. A dev 5173 file must be intentionally imported into production-preview 4173; stores are different origins.
- [ ] Import malformed/future/missing-table/checksum-modified data: clear error and no change. For invalid rows, preview and explicitly allow quarantine; inspect/export the preserved originals, including the labeled representation of non-JSON corrupt values.
- [ ] Merge identical data twice: no duplicates. Merge divergent session/card/Tutor records: blocked rather than inventing chronology. With two active plans/sessions across sources, resolve at source or choose replacement after reviewing both backups.
- [ ] Change a preference or save a response in another tab after preview: commit must require a fresh preview. Replace/reset while a session is active or Tutor has failed/pending writes: blocked. A failed/quota transaction leaves the old store and recovery point intact.
- [ ] Type the exact confirmation for replace/reset, cancel it, and confirm nothing changed. Complete a valid operation; export the single previous checkpoint and restore it through normal preview. A second operation replaces the checkpoint; downloaded backups remain your independent copy.
- [ ] Run production build + preview at 127.0.0.1:4173. Wait for successful worker installation; revisit routes, stop network/server, refresh and open a previously unopened lazy route. Test synthetic speech with unavailable/online-only voices; do not mark successful playback when absent.
- [ ] Prepare an updated production build at the same origin. Confirm update banner, active-session/dirty-draft/operation guard and explicit reload; another tab must not reload. Test that an old tab can request its previous lazy chunk. A tab older than the single retained previous cache may need an explicit reload.
- [ ] Simulate incomplete precache/quota failure: partial new shell removed, previous shell/data retained. Inspect caches: bounded packaged responses only; no dictionary/API/remote request growth. SW must not access/delete IndexedDB.
- [ ] Installation prompt only appears when the browser offers one; verify manifest/icon/mask safe area and standalone behavior on a supported browser. Loopback is not proof of HTTPS production installation behavior. No deployment is part of this task.
- [ ] Long-history profile: inspect initial load/transition time, actual IDB query cost, heap after repeated session/reference transitions, mobile input responsiveness and real audio lifecycle. Node synthetic benchmarks are not browser-performance evidence.

## Task 08 — nghiệm thu còn lại

Dùng profile thử riêng và bản sao backup; không xóa sổ thật để nghiệm thu. Tất cả ô bên dưới vẫn chưa được kiểm chứng trong browser.

- [ ] Trước nâng v7 thật: xuất dữ liệu, sao chép Tutor chưa lưu và đóng mọi tab v6; sau nâng cùng origin kiểm tra history/FSRS/drafts/preferences. Tab cũ không có recovery UI mới cho tới khi tải code mới.
- [ ] Nhập bản schema 6 checksum hợp lệ vào profile thử; kiểm exact due/state/history và các liên kết Tutor. File schema 7 xuất lại có preview, restore/reopen đúng dữ liệu.
- [ ] Với fixture active tham chiếu câu không còn trong bank, mở recovery và đóng phiên: attempts, responses, drafts giữ nguyên, plan archived, không tạo điểm/completion/milestone giả; bắt đầu phiên khác được. Phiên có đủ nội dung không được dùng đường đóng này.
- [ ] Đóng unavailable transfer rồi về Tutor: hiển thị đã khép phiên, không báo transfer hoàn thành. Progress mở được lịch sử interrupted để đọc.
- [ ] Nhập fixture có correctness trái snapshot, duplicate options hoặc guidance gắn sai attempt: preview cảnh báo/cách ly, không tăng analytics hay tự chấm lại legacy.
- [ ] Gây lỗi ghi nháp Tutor trong profile thử rồi lỗi live-read/render: emergency text vẫn chọn/sao chép được ở màn gốc; checkbox xác nhận mới cho bỏ. Before-unload warning và update guard giữ phần chưa lưu. Không dùng kill-process để kỳ vọng memory copy tồn tại.
- [ ] 320px/200% text: recovery action dài tự xuống dòng; đọc rõ retained counts, lỗi thao tác và đường tiếp tục. Kiểm keyboard/screen reader và Light/Dark/High Contrast.
- [ ] Production cache update chỉ thay worker policy: cache namespace mới, partial failure giữ shell cũ. Test offline/lazy routes/audio, multi-tab update và bounded caches trên browser thật.
- [ ] Thực hiện đầy đủ journeys A–H, nhất là D (selection → lookup → save → đúng passage/scroll position), US/UK voice availability, touch selection, dialog/popover focus và screenshots desktop/mobile. Node integration tests không thay những bước này.

## Question-bank expansion — manual acceptance pending

- [ ] Practice inventory shows 234 available, distinct attempted count, one complete 200-question mock and the separate 19-question mini sample; refresh does not duplicate questions.
- [ ] Browse all seven Parts and topic/skill filters; keep whole groups. Verify all 13 local photographs load and 106 vocabulary entries resolve, including new supporting terms.
- [ ] New questions display AI/unreviewed status; Part 2 exam wording/options stay spoken only, and Part 1/2 choices play once. Test absent voices and speech interruption on the real device.
- [ ] Start Mock 01: 200 questions, 120-minute total timer, clear synthetic/global-budget limitation. Leave/refresh/resume; listening navigation and assisted recovery remain enforced. Long navigation disclosure works with touch, keyboard and screen reader.
- [ ] Submit/review all seven Part totals; only raw accuracy, no official TOEIC score. Grammar/vocabulary/Tutor links preserve the question context. An existing active session is resumed rather than replaced by a mock click.
- [ ] Existing old progress/FSRS/drafts/preferences remain; new mock metadata survives export/import in a disposable profile. Do not clear owner data for acceptance.
- [ ] Mobile 320px/200% text, themes/high contrast/reduced motion: inventory, long passages, three-document groups, media controls, navigation disclosure and results remain usable. Capture real screenshots after inspection.
- [ ] Rebuild production and accept its service-worker update at the same origin only after saving work; confirm the new photos/content remain available offline after completed cache installation.

## Task 09 manual learner journey (not executed)

- [ ] Export work, close old tabs, then open schema 8 at the same origin/profile. Existing answers, preferences, FSRS and active sessions remain. Use a disposable profile for restore/reset checks.
- [ ] Practice counters show 234 available questions and a separate 200-question mock. Part selection/configuration and heading/scroll position remain clear on initial entry and intentional navigation.
- [ ] Open Reading Studio with Parts 6 and 7, including multi-passage groups. Select text or use the keyboard paragraph picker, write/edit a note, save a bookmark, leave for a reference and return. Reload and use the saved bookmark; marks/notes survive.
- [ ] Try two tabs editing one passage/micro-lesson. The stale write is rejected, existing saved data is preserved and the unsaved text remains available to copy/retry.
- [ ] Answer one of the five supported evidence questions. Identify passage evidence before opening detailed reasoning. Other reading questions do not claim to have structured evidence.
- [ ] Select a supported word/phrase in passages, transcripts, grammar, explanations and Tutor. Use explicit lookup or Alt+Enter, save its sentence, return to the question, and reveal the context during later vocabulary review. Missing phrases have an honest empty state.
- [ ] Listening Parts 1–4 retain full replay/speed controls. In Lab, synthetic units are clearly labeled; dictation reports case/punctuation normalization and missing/extra/mismatched words. Missing voices/errors allow continuing. Exam shows none of these study aids.
- [ ] Shadowing: test unsupported APIs, permission denial/cancellation, late permission, stop, 60-second limit, replay and deletion. Leaving/unmounting closes microphone tracks; recordings stay local and are temporary. No pronunciation grade appears.
- [ ] Mistake Lab: retry without seeing the answer key, explain the previous choice, choose/correct the error category, inspect original reasoning and attempt a transfer where available. First-attempt/exam results and existing FSRS remain unchanged. Follow-up history survives reload.
- [ ] Complete all ten micro-lessons, including incorrect predictions and transfer answers. Feedback follows submission. Progress resumes at saved steps, completion is not labeled mastery, and explicit knowledge-card saving leads to later retrieval review.
- [ ] Today explains the recommendation using actual due/history data, offers 10/20/40 minutes and free practice. A fresh profile gets starter wording instead of a claimed diagnosis.
- [ ] Desktop/tablet/320px mobile, keyboard/screen reader, 200% text, Light/Dark/System, forced colors and reduced motion: no clipped headings, lost focus, inaccessible selection controls or horizontal overflow. Capture actual browser screenshots.
- [ ] Export/import includes all three Studio tables. Preview conflicting notes/progress rather than silently merging. Accept a production PWA update only after saving work; verify actual offline behavior separately.

## Task 11 manual acceptance (not executed)

- [ ] Save/export work, close old tabs, start npm run studio at the same 127.0.0.1:5173 origin/profile and open /__studio. Existing learner history/FSRS/drafts remain after schema 9.
- [ ] Dashboard reports 452 valid questions (234 practice / 200 mock / 18 Tutor), 0 recorded human-reviewed, 1 full structural unreviewed sample and one 19-question mini sample. No fake score or human-review claim appears.
- [ ] Create/open a package draft. Edit choices/key, distractor reasoning, Vietnamese explanation, skill/difficulty, passage, transcript, media/rights JSON and exact evidence. Invalid references/choices block validation and unsafe previews.
- [ ] Save/reopen a local draft; edit the same draft in two tabs and verify the stale save is rejected with buffer retained. Export unapplied/invalid JSON before leaving when needed.
- [ ] Advance DRAFT/VALIDATED/NEEDS_REVIEW only after actual checks. Human approval requires a named reviewer, five deliberate checklist items and the typed attestation. Content edits invalidate prior validation/review; nothing is auto-published.
- [ ] Preview all Parts/groups using the actual production renderer, play available media and check mobile/keyboard/labels. Preview does not write learner attempts or FSRS.
- [ ] Submit a learner report, then triage/resolve/dismiss it in the same-origin Studio. Original question revision/snapshot and report message remain; original points do not change. A stale decision is rejected.
- [ ] In a disposable checkout/profile, exercise valid dry-run/activation, invalid multi-package preflight, missing media, duplicate warnings and explicit revision impact/acknowledgment. Preserve real progress and immutable archives.
- [ ] Export/import a schema-9 learner backup with reports and a genuine older backup without the new table. Review preview/conflicts before commit; do not reset the owner's data for acceptance.
- [ ] Regular dev mode and production build have no authoring navigation/API/editor entry. Verify production PWA update and runtime media separately; no hosting is part of this task.
