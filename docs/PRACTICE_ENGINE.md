# Practice engine · Task 02

## Mô hình và validation

`Question` giữ ID Task 01, schema version 1 và bổ sung provenance, topic, stimulus ID, blank key/type. `Stimulus` là discriminated union: photograph (P1), question-response (P2), conversation (P3), talk (P4), text-completion (P6), reading (P7). Part 5 là câu độc lập. Stimulus là chủ sở hữu audio/photo/exhibit/passage references; không nhân bản audio trong mỗi câu mới.

- Audio: synthetic có transcript; recording có local source/transcript/credit. Hiện chỉ có synthetic content. `listeningAudio` xây script có lựa chọn được đọc cho P1/2; P3/4 đọc tư liệu và câu hỏi, giữ lựa chọn in sẵn.
- Photograph: `ready` cần local asset, alt, author, source URL, license và license URL; hoặc `placeholder` với lý do. Ảnh thật đang dùng là CC0 của San906. Placeholder không đủ điều kiện vào phiên thi.
- Exhibit: bảng có title/columns/rows; hoặc ảnh local có alt/credit. Hỗ trợ trên P3/4; bộ mẫu hiện dùng bảng.
- Part 6: một passage, bốn marker `{{1}}`–`{{4}}` phân biệt, mỗi marker xuất hiện đúng một lần và khớp một câu; có `blankType: sentence`.
- Part 7: 1–3 passage IDs, theo thứ tự. Hiện có single và double passages; chưa có triple mẫu.
- Mỗi câu có bốn lựa chọn, riêng Part 2 có ba. Mỗi lựa chọn có distractor reasoning; đúng một answer key trong tập lựa chọn.

`validateContentBank(unknown)` trả danh sách path/message: kiểm tra shape, enum, ID trùng, provenance, kiến thức tham chiếu, stimulus đúng Part, passage tồn tại, kích thước bảng, metadata license/local media, đủ ba câu cho P3/4 và bốn marker/câu cho P6. `catalog.ts` kiểm tra một lần trước khi mở features. Màn lỗi content không tự xóa kho học. Validator không xác nhận sự thật/độ khó/ngôn ngữ hay quyền tác giả từ một URL bất kỳ; nội dung vẫn cần duyệt thủ công.

Nội dung giữ cấu trúc bảy Parts theo [ETS](https://www.ets.org/content/ets-org/language-master/in/home/toeic/test-takers/about/listening-reading.html), gồm nghe kết hợp đồ họa và nhiều văn bản như mô tả [ETS Global](https://www.etsglobal.org/fx/en/help-center/test-content/format-questions-toeic-listening-reading). Các câu/tư liệu trong ứng dụng được viết riêng; không lấy câu hoặc audio từ bộ sample ETS.

## Assessment độc lập với UI

`domain/assessment.ts` không import React/Dexie hoặc ID riêng của một bài mẫu. Nó sở hữu:

- Gom câu thành unit bằng stimulus ID; giữ thứ tự phiên được lưu.
- Lọc nhóm theo part/skill/topic; giữ nhóm nếu một câu khớp, không cắt ngữ cảnh.
- Chọn mini-test cân bằng Part, ưu tiên multiple passages theo metadata thay vì một ID cứng.
- Kiểm tra lựa chọn, chấm câu/omission, cộng tổng theo Part.
- Quy tắc deadline, forward-only listening, reading lock và quyết định playback/recovery.

`QuestionRenderer` chỉ nhận câu, mode, lựa chọn, cờ feedback/locked và callback. `StimulusView` chỉ nhận tư liệu/passages. `UnitContent` nối chúng vào use cases; `SessionPage` sở hữu navigation/dialog/timer presentation; `SessionResults` sở hữu phần xem lại. Media player dùng lại giữa Study và post-exam review, với callback cho playback ledger của Exam.

## Study và Exam

| Hành vi                     | Study                             | Exam trước khi nộp                                      | Review sau khi nộp |
| --------------------------- | --------------------------------- | ------------------------------------------------------- | ------------------ |
| Chấm                        | Từng câu đã submit                | Chưa chấm                                               | Kết quả đã chốt    |
| Transcript                  | Mở theo yêu cầu                   | Không render                                            | Mở theo yêu cầu    |
| Audio                       | Replay, pause/resume, chọn tốc độ | Một lượt, không tua/pause/replay thông thường           | Replay             |
| P1/2 choices                | Văn bản để học                    | Chỉ nhãn A/B/C/D; câu đáp qua audio                     | Văn bản            |
| P3/4 choices                | In sẵn                            | In sẵn, dùng chung audio/exhibit                        | In sẵn             |
| Giải thích / Tutor / tra từ | Có sau submit / tra từ trong bài  | Khóa các khu vực hỗ trợ toàn app trong khi phiên active | Có                 |
| Navigation                  | Tới nhóm bất kỳ                   | Nghe theo thứ tự; đọc xem lại; không quay lại nghe      | Xem nhóm bất kỳ    |
| Persistence                 | Câu đã submit + cursor            | Mỗi lựa chọn + cursor + deadline + playback             | Immutable attempts |

Nghe bắt đầu bằng nút của người dùng vì browser chặn autoplay. Chưa có một audio track dài/timing tự chuyển câu giống bài thi thật. Khi thiếu voice, error hoặc refresh lúc đang nghe, có retry dưới điều kiện hỗ trợ hoặc bỏ qua. Trạng thái `started` không bị coi là đã nghe thành công. Playback token chặn callback cũ ghi đè lần mới. Kết quả cảnh báo nhóm nghe lỗi/gián đoạn/hỗ trợ/chưa nghe hết. Không tuyên bố điều kiện thi chuẩn cho các trường hợp này.

Giọng tiếng Anh có thể tải bất đồng bộ: adapter chờ `voiceschanged` tối đa 2,5 giây. Thiếu voice trả lỗi, không tự chọn giọng không phải tiếng Anh cho bài nghe. Voice local được ưu tiên; OS/browser có thể dùng voice cần mạng. Các listener/watchdog được cleanup; một playback mới không bị disposer của playback cũ dừng. Gián đoạn không được tính thành kết thúc audio thành công. Pause Study không tự báo timeout sau 60 giây.

## Transaction và migration

Database version 2 thêm `responses` và `playbacks`. Migration gán `mode: study` cho phiên v1, giữ nguyên các bảng cũ. Task 03 thêm version 3 với `studyDrafts` và `recentSearches`. Task 04 thêm v4 cho evidence/mistakes/timing/plans, optional confidence và scheduler state. Task 05 thêm v5 cho Tutor turns/drafts, không đổi bank luyện 34 câu hoặc mini mock 19 câu. Transfer pool hiện có 18 câu và dùng cùng assessment engine. JSON export hiện là schema version 5; chưa có import. Chi tiết: [ADAPTIVE_LEARNING.md](ADAPTIVE_LEARNING.md), [FEYNMAN_TUTOR.md](FEYNMAN_TUTOR.md).

`ExamResponse` không có correct flag hoặc lời giải. `saveExamResponse` kiểm tra mode, unit và deadline, rồi lưu lựa chọn. Nếu đã hết giờ, nó chốt bài cũ thay vì nhận thay đổi trễ. `finishExam` chạy cùng transaction trên sessions/responses/attempts/cards/reviewEvents: tạo đủ attempt (kể cả `selected: null`), lưu thẻ sai/bỏ trống và chuyển session sang completed. Gọi lặp trả kết quả cũ; lỗi giữa chừng rollback mọi ghi. Source thiếu không được chuyển thành một điểm số giả.

Deadline là timestamp tuyệt đối; `lastObservedAt` ngăn một số bước lùi đồng hồ giữa các thao tác. UI check mỗi 500 ms khi thi; rời trang vẫn có guard chốt bài khi hết giờ. Đóng browser không có worker tiếp tục chấm; mở lại sẽ nhận deadline cũ và chốt khi thấy hết giờ. Đồng hồ/IndexedDB thuộc client, không chống can thiệp và không thay thế time server/proctoring.

Mọi attempt của Exam được tạo lúc nộp/hết giờ. Omission nằm trong mẫu số accuracy và weakness signal, nhưng `isAnsweredAttempt` loại chúng khỏi số lượt trả lời, hoạt động ngày và goal. Draft Exam không góp thống kê. Confidence 2 của Exam là giá trị trung tính để tương thích record, không được trình bày là tự đánh giá của người học.

## Acceptance evidence và giới hạn

Automated checks dùng Node test runner, React **server rendering**, `fake-indexeddb` và speech contract fixtures. Không cài/mở browser, không chạy Vite server, không phát tiếng thật.

| Acceptance         | Bằng chứng tự động                                                                  | Chưa xác nhận trên thiết bị                    |
| ------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| Dạng câu / stimuli | Validate toàn bank; render HTML tĩnh từng câu/tư liệu; asset JPEG thật trong public | Layout, ảnh, focus, touch, text scaling        |
| Đáp án             | Đúng/sai/null/invalid letter; cấm key D của P2                                      | Tương tác nhập thực                            |
| Nhóm passage/audio | P3/4 chung ID, filters giữ bộ, P6 bốn marker, P7 double passage                     | Nghe/đọc trên viewport thực                    |
| Lỗi audio          | Playback ledger/recovery token và fake speech voices/errors/owner lifetime          | Voice/permission/OS/device/browser thực        |
| Reload             | Đóng/mở lại fake database, giữ lựa chọn/deadline; migration v1→v2                   | Reload/eviction/quota browser thật             |
| Kết quả            | Null denominator, per-Part totals, late change, finalize lặp, rollback              | Trình bày và hiểu số liệu của người học        |
| Study/Exam         | Navigation policy; choices ẩn P1/2; chưa có attempts trước submit                   | End-to-end keyboard/UI, cross-tab browser thật |

Bộ mẫu chỉ có 34 câu thường + 8 transfer; mini 19 câu/20 phút là cấu hình học tập của sản phẩm, không thời lượng/cấu trúc đầy đủ của kỳ thi. Không có unlock 200 câu, bảng quy đổi điểm, dự đoán điểm hay chứng nhận ETS. Audio recording, image exhibit, triple passage mới có khả năng trong contract/renderer, chưa có coverage nội dung thật hoặc runtime xác nhận.
