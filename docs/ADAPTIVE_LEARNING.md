# Adaptive learning — Task 04

Cập nhật 2026-10-27: lộ trình theo trình độ đầu vào, mục tiêu, thời hạn và lịch học tự chọn được mô tả tại [LEARNING_PATH_AND_VOCABULARY.md](LEARNING_PATH_AND_VOCABULARY.md). Lộ trình bổ sung trọng số cho engine hiện có, giữ lịch FSRS và phiên đang học; các số lượng/v4-v5 bên dưới là lịch sử Task 04/05.

Task 05 giữ scheduler/policy của Task 04, mở bank TOEIC/transfer từ 42 lên 52 câu và thêm Tutor turns/drafts trong database/export v5. Phần viết không tạo skill evidence hoặc rating; transfer thực tế vẫn đi qua pipeline bên dưới. Chi tiết: [FEYNMAN_TUTOR.md](FEYNMAN_TUTOR.md). Các mô tả v4 bên dưới ghi lại migration đã có, không phải phiên bản export hiện tại.

## Ranh giới khoa học và sản phẩm

Hệ thống dùng các cơ chế học có cơ sở nghiên cứu; điều đó **không có nghĩa thuật toán gợi ý của STUDY 990 đã được thử nghiệm hiệu quả hoặc hiệu chỉnh riêng cho TOEIC**. Scheduler là FSRS; xếp hạng câu, ngưỡng dữ liệu và thời lượng kế hoạch là heuristic sản phẩm được công khai bên dưới. Không có AI tạo kế hoạch, dự đoán điểm TOEIC, xác suất thành thạo, hoặc tuyên bố đo được tâm lý người học.

Retrieval practice có bằng chứng về lợi ích cho kiểm tra trì hoãn trong nghiên cứu của [Roediger & Karpicke (2006)](https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/). Tổng quan [Dunlosky et al. (2013)](https://www.psychologicalscience.org/journals/pspi/1529100612453266/) đánh giá practice testing/distributed practice có tính ứng dụng rộng, còn self-explanation/interleaving phụ thuộc điều kiện và bằng chứng hẹp hơn. Các phát hiện đó không cung cấp ngưỡng chính xác cho một learner TOEIC hay chứng minh mọi giao diện gamification đều có lợi.

| Cơ chế                             | Cách dùng trong ứng dụng                                                                            | Mục đích và giới hạn                                                       |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Active recall / retrieval practice | Trả lời trước feedback; thẻ chỉ đánh giá sau khi lật                                                | Yêu cầu tự gợi lại, không đồng nhất đọc lại với đã nhớ                     |
| Distributed practice               | FSRS đặt lịch theo lịch sử rating, giữ lần quên và trạng thái nhớ                                   | Phân phối lần ôn; chưa có huấn luyện tham số cá nhân                       |
| Self-explanation                   | Tutor giữ phần người học tự giải thích; thẻ kiến thức yêu cầu nêu quy tắc/ví dụ trước khi đối chiếu | Làm rõ lập luận; Tutor không tự chấm phần viết bằng AI                     |
| Interleaving                       | Luân phiên Part khi hợp lý, giữ nguyên nhóm chung audio/văn bản                                     | Đổi ngữ cảnh, tránh tách stimulus; không ngẫu nhiên hóa để giả cá nhân hóa |
| Immediate corrective feedback      | Study có giải thích/từng distractor ngay sau submit                                                 | Đối chiếu sai lệch; Exam vẫn giữ feedback đến sau nộp                      |
| Small achievable sessions          | 10/20/40 phút là khung ước tính, có pause/resume và kết thúc lượt giữ dữ liệu                       | Giảm chi phí bắt đầu; không ép học đủ phút hoặc phạt mất streak            |

## Mô hình kỹ năng

`domain/skillTaxonomy.ts` là nguồn nhãn và quan hệ cha/con duy nhất. Có **22 leaf skills**, nhóm Reading → Grammar → Verb forms/Syntax/Reading comprehension và Listening → Comprehension/Visual integration. ID 19 kỹ năng cũ được giữ; bổ sung prepositions/comparisons/modals và gắn vào các câu mẫu có cấu trúc tương ứng. `catalog.ts` kiểm cây không trùng/chu trình, parent tồn tại, question skills hợp lệ và đủ recall prompt cho từng bài ngữ pháp.

`SkillEvidence` có stable ID `attemptId:skillId`, question/session, Part, difficulty, outcome, timestamp, confidence được cung cấp, timeSpentMs hoặc unknown và nguồn snapshot. Mỗi lượt đóng góp vào mọi leaf liên quan. Khi tổng hợp cha, dùng Map theo **attemptId**, nên câu gắn hai leaf không bị đếm hai lần ở Grammar/Reading. Tỷ lệ kỹ năng dùng các câu có lựa chọn; omissions được đếm riêng. Không gọi một câu bỏ trống là thiếu kiến thức.

42 câu TOEIC/transfer và 24 câu tự kiểm tra trong 12 bài ngữ pháp đều gắn skill. Lượt tự kiểm tra lưu evidence và lỗi sai cùng snapshot prompt/options/answer/explanation; Part, difficulty, session và confidence để null vì bài tham khảo chưa có các metadata đó. Dữ liệu này được phân biệt bằng `source=grammar-practice`, không tạo TOEIC Attempt hay session, không tăng accuracy theo Part, mục tiêu câu TOEIC hoặc tự rating FSRS. Kết quả trên UI đặt lại khi rời bài nhưng lịch sử đã submit vẫn giữ. Nộp lại cùng operation ID không nhân đôi; Làm lại tạo lượt retrieval mới.

Attempt mới lưu snapshot cả nội dung câu hỏi (prompt/options/explanations/tags) và metadata tại lúc chấm. Review ưu tiên snapshot, tránh diễn giải đáp án cũ bằng nội dung câu đã thay đổi. Stimulus/passage/audio vẫn được tham chiếu theo bank hiện tại; chưa có versioned asset/passage snapshots hoàn chỉnh. Khi nâng dữ liệu cũ không có snapshot, chỉ có thể chụp nội dung đang có và gắn `legacy-current-content`, không giả đó là nội dung lịch sử đã được xác nhận. ID không còn trong bank vẫn được giữ trong bảng attempts, không được dựng evidence từ dữ liệu đoán.

## Scheduler FSRS

Dependency **`ts-fsrs@5.4.2`**, ghim chính xác trong lockfile. Đây là implementation TypeScript của FSRS-6, MIT, không có dependency runtime; Node yêu cầu ≥20, thấp hơn mức dự án hiện có. Dùng API của package đã cài thay vì API v6 beta ở nhánh main. Nguồn dự án: [Open Spaced Repetition / ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), [release history](https://github.com/open-spaced-repetition/ts-fsrs/releases). Giấy phép được đóng gói ở `public/FSRS_LICENSE.txt`.

`domain/scheduler.ts` là boundary duy nhất:

- `scheduleReview(card, grade, now)` nhận clock tường minh, không sửa input; trả một card mới.
- Policy ID `study990-fsrs-v1`, implementation `ts-fsrs-5.4.2`.
- `enable_fuzz=false`; short term bật; learning/relearning step `10m`; maximum interval 36.500 ngày; `request_retention=0.9`; dùng default weights của đúng package version.
- `request_retention` là **mục tiêu tính lịch**, không phải tỷ lệ nhớ quan sát được. Không gọi `get_retrievability` để trình bày xác suất cá nhân.
- Input grade cũ 1/3/4/5 ánh xạ Again/Hard/Good/Easy. Incorrect luôn Again; correct với confidence thấp → Hard, cao → Easy, không có confidence hoặc mức giữa → Good. Không dùng confidence thay đúng/sai.
- Vocabulary/knowledge rating là self-report sau reveal. Câu hỏi dùng kết quả objective, kèm confidence nếu được cung cấp. Không trộn hai nguồn thành accuracy hay mastery.
- Card giữ firstEncounterAt, lastReviewedAt, dueAt, stability/difficulty, state, elapsed/scheduled days, learning steps, FSRS reps/lapses và version. `repetitions` ngoài state vẫn là chuỗi lần trả lời/nhớ thành công để tương thích UI; `ease` cũ chỉ được giữ, không điều khiển FSRS.
- Lapse FSRS là lần quên theo trạng thái của FSRS, không phải mọi đáp án sai ban đầu. Số sai ban đầu nằm trong mistake/attempt history; lapse cũ được giữ làm baseline khi chuyển.

ReviewEvent có ID thao tác, grade, occurredAt, previousDueAt/nextDueAt, source, ratingSource, algorithm và state trước/sau. Export JSON còn có policy/configuration/weights để truy nguyên lịch. Cùng input, thời điểm, version và policy cho lịch xác định; không có fuzz hoặc tham số cá nhân ẩn. Chưa chạy kiểm chứng runtime hay automated tests cho thay đổi này.

Thẻ từ/câu/kiến thức có chung contract scheduler. Bài ngữ pháp có nút lưu thẻ knowledge và recall prompt tự biên soạn; phần sau thẻ lấy rules/examples đã được validator kiểm. Inline grammar mini practice ghi kết quả lựa chọn riêng với self-report của thẻ; không thay lịch ôn tự động.

### Chuyển từ lịch cũ

Migration **không thay dueAt, interval, ease, streak, lapses, timestamps hoặc review events cũ**. Không có phép chuyển đúng từ SM-2 ease sang FSRS stability, nên không chế tạo memory state từ lịch sử thiếu dữ liệu. Chỉ khi có rating mới, thẻ legacy bắt đầu một FSRS state mới thận trọng từ defaults; lần đầu có thể đổi độ dài khoảng ôn. Lịch sự kiện cũ vẫn gắn `legacy-sm2`.

Câu sai có lựa chọn tạo/đánh giá thẻ Again theo FSRS, thường vào bước 10 phút; các lượt retrieval thực tế của thẻ câu đã tồn tại cũng cập nhật FSRS, kể cả gặp trong Practice/Tutor trước hạn. Đây là thay đổi có chủ đích so với policy SM-2 cũ chỉ giãn lịch ở Review/Daily. Lượt sai đầu tiên được ghi `practice-error`, không cộng vào “lượt ôn hoàn thành”. Bỏ trống chỉ đưa câu vào queue hiện tại, không chế tạo rating Again hoặc trạng thái quên. Lưu thẻ lặp không reset lịch.

## Tự tin, lỗi và thời gian

Confidence là `1 | 2 | 3 | null`, mặc định bỏ qua trong Study. Bấm một mức mới gắn `explicit`; bấm Bỏ qua gắn `not-provided`. Exam không tự gán mức tự tin. Dữ liệu cũ từng mặc định 2 được giữ nguyên giá trị nhưng đánh dấu `legacy-unspecified`, không dùng cho tín hiệu confidence; mức 1/3 cũ ở Study là lựa chọn có chủ ý vì default cũ là 2.

`MistakeRecord` chụp question/skills, selected/correct option, time spent/unknown, confidence/unknown, content revision và omission. `MistakeAnnotation` là self-report có thể sửa, không thay attempt. Các phân loại:

| Nhóm                          | Bằng chứng sử dụng                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Knowledge gap                 | Người học chọn “Mình chưa biết kiến thức này”                                                                                                    |
| Misapplied rule               | Người học tự cho biết biết quy tắc nhưng áp dụng nhầm                                                                                            |
| Possible guess                | Người học tự cho biết đã đoán; correct + confidence thấp chỉ là tín hiệu thận trọng, không tự phân loại là đoán                                  |
| Time-pressure difficulty      | Người học tự báo áp lực thời gian; không suy ra chỉ từ tốc độ hoặc omission                                                                      |
| Repeated misconception signal | Cùng question/revision và cùng distractor sai ở ít nhất hai session trong 90 ngày; UI chỉ nói lựa chọn sai lặp lại, không khẳng định nguyên nhân |
| Unclassified                  | Không đủ bằng chứng hoặc chưa tự ghi nhận                                                                                                        |

History của lỗi nối với ReviewEvents cùng card từ thời điểm sai; lỗi tự kiểm tra ngữ pháp nối với thẻ knowledge của bài liên quan và ghi rõ đó là ôn quy tắc. Repeated signal chỉ dùng các phiên TOEIC khác nhau, không suy ra từ việc bấm Làm lại liên tiếp trong bài tham khảo. Có lọc nguyên nhân/tín hiệu và tải thêm lịch sử. Correct confidence thấp và incorrect confidence cao được diễn đạt như lời mời tự giải thích, không phải phán đoán tâm lý.

### Đo thời gian

`useQuestionTiming` chỉ hoạt động ở phiên active. Trong nhóm nhiều câu, câu nhận pointer/focus là câu đang đo; đọc stimulus/audio chung được quy cho câu đang hoạt động, không chia giả thành thời gian chuẩn của từng câu. Mở dialog tra cứu/thiết lập tạm ngừng đo; background/blur/pagehide yêu cầu flush.

`questionTimings` ghi checkpoint mỗi 5 giây. Một lease toàn origin, owner UUID riêng, hết hạn 12 giây, giới hạn một checkpoint tối đa 10 giây; lease hết hạn không được bù thời gian vắng. Hai tab không cùng cộng thời gian. Submit chốt thời gian cùng transaction, Exam không cộng sau deadline. Dừng browser đột ngột có thể mất phần đuôi chưa commit; thời gian là số đo tương tác có giới hạn, không phải thời gian thi chuẩn hay chỉ báo nguyên nhân tâm lý. Dữ liệu cũ/đo lỗi là unknown, không phải 0 hoặc số ước lượng lấp vào.

Live StudyData không query timings/lease, nên checkpoint định kỳ không buộc đọc lại toàn bộ lịch sử và render toàn app. Submit mới chụp thời gian vào attempt. Export đọc cả timings trong cùng transaction với snapshot học; lease tạm không xuất.

Tự kiểm tra ngữ pháp dùng thời gian foreground tạm theo câu đang nhận tương tác, checkpoint nội bộ 1 giây, tối đa 2 giây mỗi nhịp, không có periodic DB writes. Chỉ submit mới lưu thời gian; rời bài làm mất phần chưa nộp. Không dùng số đo này để giả lập thời lượng TOEIC chuẩn.

## Kế hoạch 10/20/40 phút

`recommendDailyPlan(input, minutes, now)` thuần, nhận bank/stimuli, attempts, cards, skillEvidence, sessions, preferences và clock. `plansRepository` chỉ thêm transaction và lưu snapshot kế hoạch khi người học bắt đầu. Kế hoạch active được tiếp tục thay vì tạo trùng; không ghi đè một session khác.

Policy v1 (heuristic sản phẩm, chưa hiệu chỉnh hiệu quả):

1. Chỉ dùng nội dung sẵn sàng; giữ cả unit chung stimulus.
2. Xếp thẻ due theo dueAt rồi ID. Thẻ vocabulary/knowledge chiếm tối đa 40% khung và 16 thẻ, 35 giây/từ và 90 giây/kiến thức. Thẻ câu due đi qua phần câu hỏi.
3. Q score: due +100; chưa có câu trả lời +20; đúng nhưng confidence thấp trong 14 ngày, chưa làm hôm nay +10; mỗi skill có lượt sai trong 14 ngày thêm `min(12, missed*3)`; điều chỉnh difficulty theo phần dưới. Khi chọn unit, xen kẽ Part khác +12. Tie-break bằng stable ID. Các trọng số này không phải hằng số khoa học.
4. Phiên gần nhất ≥3 câu có lựa chọn và accuracy <60% ưu tiên foundation. Chỉ cho thêm advanced khi 20 lượt gần nhất có ≥12 lượt, ≥8 câu khác nhau, accuracy ≥85%, không đang recovery. Đây là quy tắc chọn bài, không phải level/ability estimate. Hints/transcripts chưa được ghi đủ để xác nhận làm độc lập.
5. Ước tính thời gian mặc định theo Part 1→7: 60/50/70/70/65/90/100 giây mỗi câu, gồm dự trù đọc/nghe và đối chiếu. Nếu có ≥3 số đo hợp lý ở Part đó, dùng median, giới hạn 0,65–2 lần mặc định. Không dùng thời gian cũ unknown. Kế hoạch ghi rõ có dùng số đo hay chỉ content estimates.
6. Dừng trước khi vượt time budget; số câu mục tiêu tham chiếu phần còn lại của dailyGoal, thêm 0/3/9 ở khung 10/20/40 phút. Giữ cả unit có thể vượt ngưỡng số câu, nhưng không vượt ước tính budget. Không lặp lại nguyên unit đã trả lời hết trong ngày trừ khi due; một group còn câu mới có thể gồm câu đã làm để giữ stimulus.
7. Nếu nội dung phù hợp còn ít, hiển thị kế hoạch ngắn hơn; không bịa nhiệm vụ để đủ thời lượng. Thời gian không phải deadline và không bị trừ khi pause.

DailyPlan lưu IDs/reasons/summary, goal, duration, estimate/basis, timestamp, status và liên kết session. Mỗi card hoàn thành khi có ReviewEvent thực sau khi lập kế hoạch, không chỉ do mở thẻ; lần Again vẫn là một lượt truy hồi đã thực hiện, lịch sau được giữ riêng. Câu hỏi hoàn thành qua session liên kết. Nút hoàn thành chỉ commit khi cả hai phần có bằng chứng; khép lượt sớm giữ toàn bộ tiến độ, không giả đã làm xong. Có lịch sử kế hoạch và session trong Progress.

## Analytics và dữ liệu

- Part accuracy: correct/assessed, **bao gồm omission** trong mẫu số; hiển thị riêng số trống.
- Skill accuracy: correct/answered, gồm câu TOEIC và tự kiểm tra ngữ pháp; hiển thị số lượt ngữ pháp riêng. Omissions riêng; số câu khác nhau giúp thấy ảnh hưởng việc lặp lại. Thẻ tự đánh giá không tạo accuracy.
- Activity: câu TOEIC có lựa chọn + tự kiểm tra ngữ pháp (deduplicate theo attemptId) + vocabulary/knowledge recall; không cộng thêm review event của cùng lượt câu hỏi. Practice-error đầu tiên không là review đã hoàn thành. Calendar không phạt ngày nghỉ; mục tiêu ngày chỉ tính lượt TOEIC.
- Queue: due now / 24h / 1–7d / >7d từ dueAt thật. Lịch lỗi được báo, không tự reset.
- Trend: bốn tuần, khoảng không có dữ liệu là gap, không vẽ 0%. So tuần chỉ có delta nếu mỗi tuần ≥5 lượt và ≥3 câu khác nhau; bộ câu/difficulty khác vẫn không chứng minh thay đổi năng lực.
- Most missed: các leaf theo số sai có lựa chọn, có mẫu số và distinct-question count. Confidence chỉ dùng explicit; self-rated cards không được đổi thành accuracy.

Schema IndexedDB **v4** thêm `skillEvidence`, `mistakes`, `mistakeAnnotations`, `questionTimings`, `timingLeases`, `dailyPlans`. V1→V2→V3 được giữ; upgrade v4 chạy backfill trong một transaction, không regrade hoặc xóa dữ liệu gốc. Unknown content giữ attempt, không dựng skill evidence. Dữ liệu ambiguity được gắn nguồn. Export JSON v4 gồm learning data và scheduler policy; lease tạm không xuất. Chưa có import/recovery UI hoàn chỉnh.

Submit Study và finalize Exam cùng transaction cho attempt, snapshot, evidence, mistake, card, review event và timing. Tự kiểm tra ngữ pháp commit evidence/mistake cùng transaction, kiểm Exam gate ngay ở repository; ôn thẻ cũng kiểm gate trước khi thay lịch. Stable attempt/event/evidence keys chống nhân đôi; đánh giá thẻ có operation ID, expected due và kiểm ownership. Rating trùng đúng thao tác là idempotent; token dùng cho card/grade khác bị từ chối. Annotation chỉ đổi phân loại tự báo cáo. Failures rollback, không giả lưu thành công. Card sai shape/clock đi lùi bị từ chối khi lập lịch, không bị ghi đè bằng defaults.

## Mức kiểm chứng và giới hạn

Task 04: kiểm TypeScript, validator nội dung/taxonomy và development build; rà transaction/caller/lifecycle từ source. **Không thêm, sửa, thiết kế hoặc chạy automated tests cho Task 04** vì Validation Policy chưa có yêu cầu tests mới. “Testable” ở đây là boundary thuần, input/clock/version/config tường minh; không phải tuyên bố tests hoặc runtime đã qua. Các tests Task 02 vẫn được giữ nguyên, không được dùng làm bằng chứng cho scheduler/policy mới.

Không chạy dev server/browser/audio/UI, migration trên kho người dùng, hoặc kiểm đa tab thực. Owner thực hiện [OWNER_REVIEW.md](OWNER_REVIEW.md). Chưa tối ưu FSRS theo người học, chưa có nghiên cứu hiệu quả TOEIC cho app, chưa có score calibration, đồng hồ chuẩn server, asset history đầy đủ hay phân trang DB lịch sử lớn. Không deploy/hosting.
