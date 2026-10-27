# Dictionary & Grammar — Task 03

Cập nhật 2026-10-27: [Sổ tay ngữ pháp & Feynman](GRAMMAR_HANDBOOK.md) có 42 chủ điểm trong 7 chương, 84 bài tự kiểm tra và bố cục riêng cho iPhone. Các con số 12 bài dưới đây mô tả phiên bản Task 03 ban đầu.

## Phạm vi nội dung

88 mục: **84 từ đơn + 4 cụm**, giữ nguyên 36 ID cũ. 12 bài ngữ pháp, **24 câu mini practice** có đáp án và phân tích từng lựa chọn. Bộ câu luyện Task 02 vẫn là 34 câu; Task 05 mở transfer pool từ 8 lên 18 câu. Các mục tham chiếu được biên soạn trực tiếp trong repo; không dùng Ddict, không scrape, không gọi dịch vụ từ điển/translation và không có API key trong client.

Mỗi từ chỉ thể hiện nghĩa/từ loại được chọn cho ngữ cảnh công việc, không phải mọi nghĩa có thể có. IPA là phiên âm của headword trong nghĩa đó, chủ yếu Anh-Mỹ; một số mục có thêm IPA Anh-Anh. Không tự suy ra từ đồng/trái nghĩa từ họ từ hoặc hậu tố. Mục không có quan hệ được biên soạn thì ẩn phần đó. Ngữ nghĩa/IPA đã được rà trong quá trình biên soạn nhưng chưa có thẩm định ngôn ngữ độc lập.

## Contract và validation

`content/schema.ts` định nghĩa:

| Model               | Các trường chính                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `VocabularyBase`    | ID, headword, IPA, từ loại, nghĩa Việt, định nghĩa Anh tự viết, ví dụ/dịch, họ từ, collocations, chủ đề                  |
| `VocabularyEntry`   | Base + forms, IPA theo locale, usageNote, grammarIds, synonyms/antonyms tùy chọn, pronunciationText tùy chọn, provenance |
| `GrammarBase`       | ID, tên Việt/Anh, summary, rules/formula, cặp ví dụ đúng/sai/giải thích, traps, skills                                   |
| `GrammarLesson`     | Base + vocabularyIds, questionIds, practice, provenance                                                                  |
| `GrammarExercise`   | ID ổn định trong bài, prompt, 3–4 lựa chọn A–D, một answer, explanation và phân tích từng lựa chọn                       |
| `LexicalProvenance` | Original editorial provenance hoặc licensed provider + author/revision/note/attribution/license URL                      |

`lexicalNotes.ts` bổ sung metadata cho 36 từ cũ. `vocabularyExpansion.ts` có các hàng dữ liệu được kiểm kiểu bằng named tuple; không phát sinh từ/quan hệ bằng heuristic. `grammarExpansion.ts` bổ sung bài và hoạt động cho các ID ngữ pháp cũ. Nếu metadata bị thiếu, validator trả issue để ứng dụng hiện màn content error thay vì reset kho học.

`referenceValidation.ts` kiểm shape, ID trùng, ít nhất 80 từ đơn, ít nhất 12 bài, trường bắt buộc, IPA/locale, provenance, đáp án/lựa chọn và sự tồn tại của các tham chiếu giữa bộ từ/bài ngữ pháp/câu hỏi. Tối thiểu mỗi bài có ba rules, hai cặp ví dụ, hai traps và hai mini exercises. `catalog.ts` chạy cả validator câu hỏi lẫn validator tham chiếu trước khi cung cấp workspace. Validator không chứng minh tính đúng về ngôn ngữ hoặc chất lượng giọng đọc.

## Tìm kiếm và lookup

- `domain/referenceSearch.ts`: chuẩn hóa Việt có/không dấu, token matching, xếp hạng exact → form/alias → prefix → substring → nội dung; giới hạn 30 kết quả ở quick search. Nội dung được chuẩn hóa khi dựng index, không chuẩn hóa lại toàn bộ bộ từ theo mỗi phím gõ. Không tìm qua mạng, debounce hoặc giả loading cho dữ liệu local nhỏ.
- `providers/dictionary.ts`: Map headword và forms cho lookup từ/cụm. Bảng derivation tường minh giữ các alias Task 01. Khi dạng được chọn khác headword, popover ghi rõ đang hiển thị mục liên quan, với đúng từ loại/IPA của headword đó. Không tự cắt s hoặc dịch một cụm không có dữ liệu.
- `application/referenceCatalog.ts`: index từ vựng, ngữ pháp và 34 câu luyện công khai. Không index đáp án, lựa chọn, lời giải, transcript, câu transfer Tutor hoặc phần tự viết của người dùng. Câu tham chiếu mở trang preview không lộ đáp án; start/resume qua repository hiện có.
- Highlight tách các đoạn chuỗi và render React, không dùng HTML injection. Recent search chỉ ghi khi người dùng mở một kết quả, tối đa tám query, chống trùng theo query chuẩn hóa; xóa được trong dialog. Lỗi lưu lịch sử có retry và đường mở tài liệu không lưu lịch sử.
- Quick search giữ focus ở input; `aria-activedescendant` trỏ tới option đang chọn, ↑/↓ và Enter dùng cùng hành động như chuột/touch. Escape đóng và trả focus nếu không chuyển trang. Cách quản lý focus dựa trên [W3C APG Combobox](https://w3c.github.io/wai-website/ARIA/apg/patterns/combobox/); chưa kiểm chứng bằng screen reader thực.

Lookup chỉ nhận selection tiếng Anh 1–8 từ, tối đa 80 ký tự, trong cùng vùng `data-learning`. Không nhận selection từ input, vùng từ điển hoặc vùng đang khóa tra cứu. Selection chỉ hiện nút **Tra**, không tự mở nghĩa; **Alt + Enter** cũng mở. Scroll/resize ẩn nút để tránh dùng tọa độ cũ. Khi người dùng kéo bôi đen chữ trong nhãn lựa chọn, label không đồng thời chọn đáp án. Touch dùng cùng selection API, rồi mở bottom sheet có modal focus scope ở viewport ≤600px.

## Provider boundary

| Interface               | Implementation hiện tại  | Mở rộng tương lai                                                                                            |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `DictionaryProvider`    | Local sync search/lookup | Adapter async có `AbortSignal`, hợp đồng cấp phép và validation dữ liệu trả về                               |
| `TranslationProvider`   | Chưa cấu hình            | `translate({text, source, target}, signal)` trả text/provider/attribution; chỉ nối qua backend có giữ secret |
| `PronunciationProvider` | `browserPronunciation`   | Capabilities theo locale, subscription thay đổi voice, play có stop callback và error callback               |

`getVoices()` là danh sách voice của thiết bị và có thể cập nhật qua `voiceschanged`: [MDN getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices), [MDN voiceschanged](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event). UI chỉ bật US/UK nếu có đúng locale; adapter không dùng giọng khác để giả accent. Ưu tiên giọng local nếu có; voice không local có thể cần dịch vụ mạng của browser/OS. Tất cả nút phát âm ghi rõ giọng máy. Homograph như estimate/refund/contract có cụm ngắn bổ sung để giúp giọng máy chọn nghĩa; không hứa giọng tổng hợp luôn khớp IPA.

Speech boundary vẫn chỉ sở hữu một playback toàn app, với stop/error/timeout và cleanup subscription/timer. Unmount nút cũ không hủy utterance của nút mới. Lỗi phát âm không thay đáp án hay khóa phiên. Không có file thu âm giọng người hoặc dịch toàn văn tự động trong Task 03.

Adapter ngoài chưa triển khai. Trước khi tích hợp phải có quyền lưu/hiển thị/phân phối nội dung, attribution theo hợp đồng, validation licensed provenance và orchestration cho cancellation/stale responses. Không đặt key trong biến `VITE_*`, source, URL hoặc bundle; cần server boundary riêng. Chưa có backend trong checkout này.

## Điều hướng và dữ liệu

Tài liệu mang URL `#/grammar/<id>?from=<sessionId>&question=<questionId>`; liên kết Vocabulary/Grammar/Review/Reference tiếp tục giữ nguồn này. `ReferenceReturn` kiểm tra session/membership, gọi repository chuyển cursor khi Study còn active và trở lại `#/session/<id>?focus=<questionId>`. Với phiên đã hoàn thành, kết quả mở lại đúng nhóm review. Nếu nguồn không còn hợp lệ, dùng phiên Study active nếu có, không tạo hoặc ghi đè phiên.

Database **v3** chỉ thêm `studyDrafts` và `recentSearches`; giữ các bảng/khóa v1/v2. Study draft có ID `sessionId:questionId`, selected, confidence và updatedAt. Ghi patch trong transaction với session/attempt để tránh ghi nháp cho câu đã nộp; submit xóa nháp cùng lúc ghi attempt. Nháp không tạo điểm, activity, thẻ sai hay review event. UI disable lựa chọn khi đang lưu và báo lỗi nếu commit không thành công. Mọi màn hình lấy state từ snapshot Dexie, không có kho localStorage thứ hai.

Task 04 tiếp tục nâng kho lên **v4**, giữ nháp/history, thêm evidence, mistakes, timing và plans. Confidence mới mặc định bỏ qua, không tự gán mức giữa. Bài ngữ pháp có thêm thẻ knowledge recall dùng lịch FSRS, tách khỏi inline mini practice. Xem [ADAPTIVE_LEARNING.md](ADAPTIVE_LEARNING.md).

Task 05 nâng kho lên **v5** cho Tutor turns/drafts. URL tham chiếu còn có `tutor=<attemptId>`; cross-navigation trong Reference/Grammar/Vocabulary/Review tiếp tục giữ trail, có nút về Tutor đúng lượt đã giải thích. Nháp Tutor tự lưu theo sổ và phiên bản; không dùng chung owner với Study drafts. Xem [FEYNMAN_TUTOR.md](FEYNMAN_TUTOR.md).

Exam gate của Task 02 vẫn chặn tra cứu toàn app trong khi phiên Exam active; deadline tiếp tục chạy khi rời trang. Từ Task 04, inline grammar practice lưu kết quả lựa chọn, evidence kỹ năng, lỗi sai và thời gian foreground khi submit. Kết quả hiển thị đặt lại khi rời bài, lịch sử vẫn giữ. Không tạo phiên TOEIC, tăng accuracy theo Part hoặc tự rating FSRS; nguồn `grammar-practice` được trình bày riêng trong Progress. Submit kiểm Exam gate trong transaction để tránh race giữa các tab.

## Mức kiểm chứng

Task 03: TypeScript, validator cho nội dung đóng gói (88 mục/12 bài/24 mini exercises, không có issue), rà caller/lifecycle/transaction và development bundle. Không thêm/sửa/chạy automated tests trong Task 03 theo Validation Policy. Các tests Task 02 được giữ nguyên, kết quả pass của Task 02 không được coi là xác nhận cho thay đổi mới.

Chưa chạy dev server, browser, UI automation, audio thật, thiết bị touch, screen reader hoặc kiểm tra migration với dữ liệu browser thật. Không deploy/hosting. Owner tiếp tục kiểm tra tại [OWNER_REVIEW.md](OWNER_REVIEW.md).
