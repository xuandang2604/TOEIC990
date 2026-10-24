# Feynman-inspired Tutor — Task 05

## Mục đích và giới hạn

Tutor là một sổ học theo câu đã làm, không phải chatbot. Người học nêu bằng chứng, đối chiếu hướng dẫn, viết lại cách hiểu và thử một câu khác. Tên Feynman là cảm hứng thiết kế cho việc giải thích đơn giản; không phải tuyên bố một phương pháp độc quyền đã được chứng minh hiệu quả riêng cho STUDY 990. Cơ sở và giới hạn của self-explanation/retrieval/transfer được nối với [ADAPTIVE_LEARNING.md](ADAPTIVE_LEARNING.md).

Provider offline **không đọc hiểu, chấm ngữ nghĩa, tìm từ khóa hoặc đánh giá chất lượng bài viết**. Nó chỉ dùng câu/đáp án đã nộp và lý do do người học chủ động chọn. Độ dài 10–2.000 ký tự là giới hạn nhập liệu, không phải rubric. “Biết quy tắc”, “đoán”, “tự tin” hoặc một bài viết dài không được đổi thành mastery.

Lý do chọn là self-report. Phản hồi nói “bạn tự chọn…” thay vì khẳng định đã phát hiện một suy nghĩ ẩn. Nếu không chọn lý do, hoặc câu không thuộc coverage, Tutor nói rõ đang trình bày hướng dẫn tham chiếu. Không có live AI, cloud request, API key hoặc nút AI giả.

## Nội dung có thật

34 câu luyện thông thường được giữ nguyên. Có **18 câu vận dụng**: giữ 8 câu cũ và thêm 10 câu gốc trong `content/tutorTransfers.ts`. Tổng bank là **52 câu**, ngoài 24 câu tự kiểm tra trong Grammar Library. Mini mock vẫn 19 câu / 20 phút, không thay thành đề TOEIC đầy đủ.

9 lesson profiles trong `content/tutorLessons.ts`, **27 nhánh lý do tự chọn**, hỗ trợ **28 câu** gồm 10 câu Part 5 ban đầu và 18 transfer items:

| Chủ điểm           | Nhầm lẫn được đối chiếu qua self-report                          | Hai câu vận dụng                                   |
| ------------------ | ---------------------------------------------------------------- | -------------------------------------------------- |
| Từ loại            | Chỉ dịch nghĩa; chỉ nhìn hậu tố; chưa xác định từ được bổ nghĩa  | `transfer-word-forms`, `transfer-word-forms-2`     |
| Hòa hợp            | Chia theo danh từ gần nhất; coi each là số nhiều                 | `transfer-agreement`, `transfer-agreement-2`       |
| Thì                | Chọn theo năm quá khứ; chỉ dùng từ khóa thay vì khoảng thời gian | `transfer-tenses`, `transfer-tenses-2`             |
| Bị động            | Bỏ be sau modal; coi V3 đứng riêng là đủ                         | `transfer-passive`, `transfer-passive-2`           |
| Verb patterns      | Mọi to đều + V; mọi động từ thứ hai đều + V-ing                  | `transfer-gerund`, `transfer-gerund-2`             |
| Từ nối             | Chỉ dịch nghĩa; despite + mệnh đề hữu hạn trực tiếp              | `transfer-connectors`, `transfer-connectors-2`     |
| Điều kiện          | Will ở cả hai vế; bỏ qua nghĩa phủ định của unless               | `transfer-conditionals`, `transfer-conditionals-2` |
| Mệnh đề quan hệ    | Thấy người là chọn who; coi whose chỉ dùng cho người             | `transfer-relative`, `transfer-relative-2`         |
| Giả định kiến nghị | Thêm -s theo chủ ngữ; áp dụng nguyên mẫu cho mọi that-clause     | `transfer-subjunctive`, `transfer-subjunctive-2`   |

Mỗi profile có một nhánh đối chiếu chiến lược phù hợp, không chỉ nhánh sai. Bộ chọn còn có “Cách nghĩ khác / chưa muốn chọn”; không ép bài viết tự do vào một loại ngộ nhận. Các câu còn lại dùng lời giải/takeaway/grammar reference, không được gắn nhãn đã phân tích ngộ nhận riêng. Chưa có targeted tutoring cho các Parts nghe/đọc hiểu.

Các ví dụ thay cấu trúc và câu transfer được viết riêng; không lấy câu ETS hay sao chép ví dụ từ từ điển. `provenance` ghi tác giả, revision và giới hạn chưa thẩm định độc lập. Validator kiểm ID, quan hệ skill/grammar/question, các prompt, ví dụ đối chiếu, ít nhất hai transfer items và tính duy nhất của coverage; không thay thế thẩm định ngôn ngữ.

Các điểm dễ khái quát quá mức đã được đối chiếu với nguồn giảng dạy gốc: [Cambridge: conditionals và will chỉ sự sẵn lòng](https://dictionary.cambridge.org/us/grammar/british-grammar/conditionals-if), [whose cho người/vật](https://dictionary.cambridge.org/us/grammar/british-grammar/whose), [despite và the fact that](https://dictionary.cambridge.org/us/grammar/british-grammar/despite-in-spite-of), [British Council: reporting verbs và giả định kiến nghị](https://learnenglish.britishcouncil.org/free-resources/grammar/c1/patterns-reporting-verbs). Đây là nguồn kiểm tra quy tắc; không phải nguồn phân phối câu hỏi hoặc dữ liệu từ điển trong app.

## Luồng và trạng thái

1. Bắt đầu từ `Attempt` đã nộp và có lựa chọn. Câu bỏ trống chưa được coi là một lập luận cần chấm. Exam chưa nộp vẫn khóa Tutor toàn app và repository cũng kiểm gate.
2. Viết cách nghĩ ban đầu; tùy chọn một lý do có sẵn. Chỉ khi Lưu mới tạo turn đã nộp. Nháp không tăng kết quả học.
3. Provider trả guidance; adapter kiểm cấu trúc/context binding trước khi lưu. Guidance được lưu cùng explanation turn để reload không tạo phản hồi khác hoặc cần gọi lại provider.
4. Người học chọn cần sửa/làm rõ/còn băn khoăn và viết lại. Prompt thay đổi theo lựa chọn này. Không bắt buộc tự tuyên bố “đã hiểu” để được thử bài.
5. Mở transfer khi đã có revision turn. Không chấm semantic phần revision. Cả explanation và revision trước transfer đều còn trong history.
6. Transfer dùng practice engine hiện tại: câu/stimulus độc lập với renderer; nộp đáp án mới tạo attempt/evidence/mistake/FSRS event theo policy Task 04. Kết quả có đường về sổ Tutor.

State derive từ một root `TutorReflection` và các turn được tham chiếu. `tutor.revision` là optimistic version, không phải điểm. Explanation ban đầu được giữ làm mốc; sửa hiểu biết bằng revision turn mới. Revision có thể cập nhật trước khi transfer bắt đầu, các bản cũ không bị xóa. Sau khi transfer liên kết, phần trước đó được giữ như bản lưu của lượt này.

Nếu một session khác đang active, Tutor đưa về session đó và không gán nó giả làm transfer. Transfer selection ưu tiên một unit liên quan chưa có attempt, tie-break bằng ID; giữ toàn bộ nhóm dùng chung tư liệu và không chọn unit chứa câu gốc. Với profile hỗ trợ, chỉ chọn các transfer IDs đã biên soạn. Nếu bộ câu liên quan đã từng làm, UI ghi rõ đây là **luyện lại**, không gọi là câu mới. Nếu không có unit khác phù hợp, UI báo thiếu coverage thay vì tạo bài giả.

## Năm chế độ giảng

| Control                       | Hành vi                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Nói đơn giản / Explain Simply | Giải thích quy tắc bằng tiếng Việt đơn giản và prompt nói lại                                                              |
| Từng bước / Step by Step      | Cue và các bước suy luận của profile; fallback dùng explanation/takeaway                                                   |
| Vì sao đáp án khác sai?       | Đặt mọi lựa chọn của câu đã nộp cạnh reasoning đã biên soạn; đánh dấu đáp án                                               |
| Một ví dụ khác                | Cặp câu thay cấu trúc, giải thích và một giới hạn/ngoại lệ; fallback dùng ví dụ grammar đã có hoặc báo chưa có ví dụ riêng |
| Kiểm tra cách hiểu            | Prompt đổi cấu trúc/áp dụng; đưa tới ô viết lại, sau đó mở transfer thật. Không trả một điểm hiểu biết giả từ văn bản      |

Không hỏi lặp tuần tự tất cả prompt. Lý do tự chọn quyết định observation/follow-up; mode do người học điều khiển; stance quyết định lời mời viết lại. Keyboard tablist hỗ trợ mũi tên/Home/End, dùng radio/fieldset thật, có loading/save/error states và theme/responsive styles. Các kết quả UX cần owner xác nhận trên browser.

## Liên kết học tập

- Question feedback và sổ lỗi mở Tutor đúng attempt, không trộn nhiều lần trả lời cùng một câu.
- Grammar và Vocabulary giữ `from`, `question`, `tutor` trong URL; có Trở lại Tutor và Trở lại câu hỏi/kết quả. Bản nháp Study và Tutor có owner riêng.
- Tutor dùng question snapshot của attempt khi có; profile targeted chỉ áp dụng khi content revision còn khớp bank. Reference assets/grammar chưa có snapshot version đầy đủ như đã nêu ở Task 04.
- Lưu knowledge card là hành động rõ ràng của người học. Lưu explanation/revision không thay cards, skill evidence, accuracy hoặc lịch FSRS.
- Transfer đúng/sai mới đi qua assessment engine; một câu đúng chỉ là một quan sát. Không suy ra giải thích tốt, hiểu bền hoặc mastery. Điểm thô/kết quả vẫn thuộc practice engine, không tạo thêm bản sao score trong Tutor.

## Persistence và lỗi

IndexedDB **v5** thêm `tutorTurns` và `tutorDrafts`. Các version cũ và root reflections vẫn được giữ. Không backfill một bài sửa hiểu biết hoặc guidance chưa từng tồn tại. Reflection legacy có thể xem lại; khi chủ động mở hướng dẫn mới, nội dung legacy được giữ thêm thành turn `legacy-explanation`. Transfer legacy vẫn dùng link/kết quả cũ, có lời giải thích rằng luồng cũ chưa ghi bước revision.

`tutorRepository` sở hữu use cases; `domain/tutoring.ts` sở hữu selection/context bindings; `providers/tutor.ts` sở hữu provider boundary. `sessionRepository` tách use case start/resume đang có, giữ export cũ qua `studyRepository`, tránh dependency vòng giữa Tutor và repository tổng hợp. `reflections` là root duy nhất, turn là lịch sử bất biến, drafts là dữ liệu chưa nộp. Không tạo một God chatbot state.

Submit explanation làm provider work **ngoài transaction**, rồi kiểm lại Exam gate, expected revision, operation ownership và cancellation trước transaction commit. Turn/root/draft transition commit cùng nhau. Submit lặp cùng operation và payload là idempotent; dùng lại token cho nội dung khác bị từ chối. Revision và transfer cũng kiểm phiên bản. Một link transfer bị thiếu không bị lặng lẽ thay bằng session mới.

Draft được mở xong trước khi cho sửa, autosave sau 700ms và flush khi blur/pagehide/unmount. Write được serialize và dùng draft version để chống tab cũ ghi chồng. Khi owner đổi hoặc root/version đã thay, nội dung cần bảo toàn được giữ thành nhánh riêng trong cùng bảng; **Nháp cần đối chiếu** cho phép đọc/chọn/sao chép lại. Không tự merge các cách nghĩ. Nếu storage không nhận cả bản chính và bản đối chiếu, UI yêu cầu giữ trang mở/sao chép, không báo lưu thành công.

Khi ghi kho thất bại, một bản tạm trong bộ nhớ giữ text để có thể quay lại Tutor và sao chép, kể cả đã đổi route; bản này không được gọi là đã lưu và không có trong export IndexedDB. Browser được yêu cầu cảnh báo khi đóng tab còn thay đổi chưa commit. Browser/mobile có thể không cho chạy unload handler; process bị kill vẫn mất bản tạm. Bản bộ nhớ được bỏ khi payload đã lưu hoặc submit thành công.

Draft read/subscription chỉ query sổ liên quan, không nằm trong live snapshot toàn app để tránh đọc lại toàn bộ học sử mỗi lần autosave. Export **JSON schema 5** đọc learning state, tutor turns và mọi drafts/recovery branches trong cùng readonly transaction, cùng scheduler policy/weights. Chưa có import/recovery từ tệp.

Đóng browser đột ngột vẫn có thể mất phần đuôi chưa commit; không có bảo đảm flush khi process bị kill. Source có concurrency guards, nhưng migration, focus, multi-tab, storage quota và shutdown chưa được runtime-test trong Task 05. Bản viết và nháp còn là dữ liệu local; xóa site data có thể làm mất chúng.

## Provider và backend tương lai

`TutorProvider` có id/mode/capability và `generate(context, signal)`. Context gồm:

- Question snapshot, lựa chọn/correctness và confidence rõ nguồn.
- Grammar knowledge và lesson profile phù hợp.
- Explanation chưa tin cậy, reason ID người học tự chọn.
- Conversation state có giới hạn tám lượt gần nhất, tách learner/guide roles.
- Privacy boundary: hiện tại `device-only`, `networkConsent=false`.

`requestTutorGuidance` từ chối backend khi chưa có consent, timeout 10 giây, hỗ trợ AbortSignal và trả failure rõ ràng. Output contract ràng buộc question/revision/lesson/reason/provider, đủ năm mode, các field text có giới hạn và tổng kích thước. UI render text qua React, không chạy HTML/Markdown tùy ý, tool call hoặc URL do provider phát sinh. Validator là kiểm cấu trúc và binding, **không chứng minh sự thật của giải thích LLM**. Provider fail/invalid/cancel không commit guidance giả; nháp còn để thử lại hoặc mở reference.

Trước khi có provider LLM thật cần thực hiện ở backend:

1. Giữ secret ở server/secret store; không dùng `VITE_*`, localStorage hoặc ô nhập frontend để phân phối API key. Client chỉ gọi endpoint ứng dụng đã xác thực qua TLS; có rate limit, giới hạn payload/token/thời gian và chống lạm dụng.
2. Xin opt-in rõ dữ liệu nào được gửi. Mặc định không upload database, search history, các bài viết khác hoặc định danh không cần thiết. Cho phép học offline, rút consent, xóa dữ liệu và có chính sách retention; không log raw reasoning theo mặc định.
3. Server xác thực content IDs/version/attempt ownership và dựng answer key/knowledge từ kho tin cậy, không tin correctness/role/answer key client gửi. Free text luôn là learner data, không phải system instructions. Không cấp tool/action quyền ghi dữ liệu cho model.
4. Dùng structured output theo versioned schema, kiểm context bindings, grounding theo grammar/content đã duyệt, uncertainty/refusal, cancellation và stale response trước khi commit. Sai ngữ pháp/hallucination cần reviewer/evaluation riêng; validator shape không đủ.
5. Thông báo đúng provider đang dùng. Khi fallback offline phải gắn nhãn soạn sẵn, không giả phản hồi live AI. Xử lý timeout, quota, offline, response invalid và dịch vụ không sẵn sàng mà không mất bài viết.

Không có endpoint/backend/paid API được triển khai trong Task 05. Cloud service không cần để build hoặc dùng offline Tutor.

## Kiểm chứng

Thực hiện kiểm TypeScript, validators của bank/reference/taxonomy/Tutor và development build. Không tạo, sửa, thiết kế hoặc chạy automated tests cho Task 05 theo Validation Policy. Không khởi chạy dev server, browser, UI automation hoặc audio; build không chứng minh runtime. Tests Task 02 được giữ, nhưng chưa được chạy lại và không xác nhận contract Tutor mới. Owner kiểm theo [OWNER_REVIEW.md](OWNER_REVIEW.md).
