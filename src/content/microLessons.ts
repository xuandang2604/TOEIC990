import type { GrammarExercise, OptionId } from './schema'

export interface MicroLesson {
  id: string
  lessonId: string
  title: string
  observe: string
  contrast: string
  principle: string
  hint: string
  prediction: GrammarExercise
  practice: GrammarExercise
  transfer: GrammarExercise
}
function exercise(
  id: string,
  prompt: string,
  choices: [string, string][],
  answer: OptionId,
  explanation: string,
): GrammarExercise {
  return {
    id,
    prompt,
    options: choices.map(([text, explanation], i) => ({
      id: (['A', 'B', 'C'] as const)[i],
      text,
      explanation,
    })),
    answer,
    explanation,
  }
}
/** Original offline teaching material, editorial draft; no semantic analysis of learners' writing. */
export const microLessons: MicroLesson[] = [
  {
    id: 'although-despite',
    practice: exercise(
      'ad-r',
      '------- the courier’s late arrival, the delivery was completed before closing.',
      [
        ['Despite', 'Despite + cụm danh từ the courier’s late arrival.'],
        ['Although', 'Cụm danh từ này không có động từ hữu hạn để tạo mệnh đề sau although.'],
      ],
      'A',
      'Late arrival là cụm danh từ chỉ việc đến muộn; dùng despite.',
    ),
    lessonId: 'connectors',
    title: 'Although hay despite?',
    observe: 'Although the shipment was delayed, the store opened on time.',
    contrast: 'Despite the delay, the store opened on time.',
    principle:
      'Although đi với mệnh đề có chủ ngữ và động từ. Despite đi với cụm danh từ hoặc V-ing. Cả hai diễn tả sự tương phản.',
    hint: 'Sau chỗ trống là một sự việc hoàn chỉnh hay một cụm danh từ?',
    prediction: exercise(
      'ad-p',
      '------- the invoice was incomplete, accounting processed the payment.',
      [
        ['Despite', 'Despite không trực tiếp nối mệnh đề the invoice was incomplete.'],
        ['Although', 'Although nối với mệnh đề có chủ ngữ và động từ.'],
      ],
      'B',
      'The invoice was incomplete là mệnh đề; chọn Although.',
    ),
    transfer: exercise(
      'ad-t',
      'The team met the deadline ------- the unexpected absence of two staff members.',
      [
        ['although', 'Sau although cần mệnh đề; ở đây là cụm danh từ.'],
        ['despite', 'Despite + cụm danh từ the unexpected absence…'],
      ],
      'B',
      'Danh từ trung tâm absence không có động từ hữu hạn trong cụm; dùng despite.',
    ),
  },
  {
    id: 'because-of',
    practice: exercise(
      'bo-r',
      'The entrance is closed ------- maintenance work.',
      [
        ['because of', 'Maintenance work là cụm danh từ.'],
        ['because', 'Because cần một mệnh đề đầy đủ.'],
      ],
      'A',
      'Maintenance work không có động từ hữu hạn; dùng because of.',
    ),
    lessonId: 'connectors',
    title: 'Because hay because of?',
    observe: 'We relocated because the office was crowded.',
    contrast: 'We relocated because of the lack of space.',
    principle:
      'Because + mệnh đề. Because of + cụm danh từ / V-ing. Kiểm tra cấu trúc sau liên từ, không chỉ dịch nghĩa “bởi vì”.',
    hint: 'Tìm chủ ngữ và động từ ngay sau chỗ trống.',
    prediction: exercise(
      'bo-p',
      'The seminar was postponed ------- the speaker was ill.',
      [
        ['because', 'The speaker was ill là mệnh đề.'],
        ['because of', 'Because of không trực tiếp đứng trước mệnh đề này.'],
      ],
      'A',
      'Có chủ ngữ speaker và động từ was, dùng because.',
    ),
    transfer: exercise(
      'bo-t',
      'Deliveries resumed late ------- a road closure.',
      [
        ['because', 'A road closure là cụm danh từ, thiếu động từ hữu hạn.'],
        ['because of', 'Because of + cụm danh từ a road closure.'],
      ],
      'B',
      'Danh từ closure mang nguyên nhân; dùng because of.',
    ),
  },
  {
    id: 'whereas-while',
    practice: exercise(
      'ww-r',
      'Which sentence explicitly describes simultaneous activities?',
      [
        [
          'While the assistant was printing, the manager was checking the figures.',
          'Hai hành động quá khứ tiếp diễn cùng xảy ra.',
        ],
        [
          'Whereas this printer is cheap, that one is fast.',
          'Câu đối chiếu hai đặc điểm, không nói hoạt động đồng thời.',
        ],
      ],
      'A',
      'While + hai hành động quá khứ tiếp diễn trong ví dụ đầu chỉ thời gian đồng thời.',
    ),
    lessonId: 'connectors',
    title: 'Whereas & while: hai vế đối chiếu',
    observe: 'Whereas the downtown branch opens at eight, the airport branch opens at six.',
    contrast: 'While the system was restarting, the staff waited.',
    principle:
      'Whereas diễn tả đối chiếu. While có thể đối chiếu hoặc nói hai việc xảy ra đồng thời. Khi không đủ ngữ cảnh, cả whereas và while có thể đúng trong câu tương phản.',
    hint: 'Đừng tạo quy tắc giả rằng while chỉ dùng cho thời gian.',
    prediction: exercise(
      'ww-p',
      'Which statement is accurate?',
      [
        ['While can express only time.', 'While còn có nghĩa đối chiếu.'],
        ['While can express time or contrast.', 'Ngữ cảnh quyết định nghĩa của while.'],
      ],
      'B',
      'While có hai cách dùng này; whereas tập trung vào đối chiếu.',
    ),
    transfer: exercise(
      'ww-t',
      'Which rewrite clearly preserves the contrast in “Whereas this plan is cheap, that one is flexible”?',
      [
        [
          'This plan is cheap, but that one is flexible.',
          'But giữ quan hệ đối chiếu hai đặc điểm.',
        ],
        [
          'This plan is cheap because that one is flexible.',
          'Because đổi quan hệ thành nguyên nhân.',
        ],
      ],
      'A',
      'But giữ đối chiếu; because thêm quan hệ nhân quả không có trong câu gốc.',
    ),
  },
  {
    id: 'purpose',
    practice: exercise(
      'pu-r',
      'We sent a map ------- guests would not get lost.',
      [
        ['so that', 'So that nối với mệnh đề guests would not get lost.'],
        ['in order to', 'Sau in order to cần động từ nguyên mẫu, không phải guests.'],
      ],
      'A',
      'Chủ thể guests khác we; so that cho phép nêu mục đích bằng một mệnh đề riêng.',
    ),
    lessonId: 'connectors',
    title: 'In order to & so that',
    observe: 'We installed signs in order to guide visitors.',
    contrast: 'We installed signs so that visitors could find the room.',
    principle:
      'In order to + động từ nguyên mẫu, thường cùng chủ thể với hành động chính. So that + mệnh đề, có thể dùng chủ thể khác và can/could.',
    hint: 'Sau chỗ trống là động từ nguyên mẫu hay một chủ ngữ mới?',
    prediction: exercise(
      'pu-p',
      'Please speak slowly ------- all attendees can follow.',
      [
        ['in order to', 'Không đứng trực tiếp trước chủ ngữ all attendees.'],
        ['so that', 'So that + chủ ngữ + can + động từ.'],
      ],
      'B',
      'All attendees can follow là mệnh đề nêu mục đích.',
    ),
    transfer: exercise(
      'pu-t',
      'The assistant called early in order to ------- the reservation.',
      [
        ['confirm', 'To + động từ nguyên mẫu.'],
        ['confirmed', 'Quá khứ không theo to trong cấu trúc chỉ mục đích.'],
      ],
      'A',
      'In order to confirm: gọi sớm nhằm xác nhận.',
    ),
  },
  {
    id: 'forms',
    practice: exercise(
      'wf-r',
      'The supervisor gave a ------- explanation.',
      [
        ['clearly', 'Trạng từ không trực tiếp bổ nghĩa cho danh từ explanation.'],
        ['clear', 'Tính từ đứng trước danh từ explanation.'],
      ],
      'B',
      'A clear explanation: tính từ clear mô tả danh từ explanation.',
    ),
    lessonId: 'word-forms',
    title: 'Từ loại: tìm từ được bổ nghĩa',
    observe: 'The report is accurate.',
    contrast: 'The analyst checked the figures accurately.',
    principle:
      'Tính từ accurate mô tả report sau be. Trạng từ accurately mô tả hành động checked. Đừng chọn chỉ bằng hậu tố.',
    hint: 'Bạn mô tả một vật hay cách hành động diễn ra?',
    prediction: exercise(
      'wf-p',
      'The coordinator explained the policy -------.',
      [
        ['clear', 'Clear là tính từ, không mô tả explained ở đây.'],
        ['clearly', 'Clearly là trạng từ mô tả explained.'],
      ],
      'B',
      'Cần trạng từ vì ta mô tả cách giải thích.',
    ),
    transfer: exercise(
      'wf-t',
      'The revised instructions seem -------.',
      [
        ['clearly', 'Seem ở đây là động từ nối, không phải hành động được mô tả bằng trạng từ.'],
        ['clear', 'Clear mô tả instructions sau seem.'],
      ],
      'B',
      'Sau động từ nối seem, tính từ mô tả chủ ngữ.',
    ),
  },
  {
    id: 'agreement',
    practice: exercise(
      'ag-r',
      'Each of the rooms ------- a projector.',
      [
        ['has', 'Each là trung tâm số ít của chủ ngữ.'],
        ['have', 'Rooms trong cụm of the rooms không quyết định số của động từ.'],
      ],
      'A',
      'Each of + danh từ số nhiều vẫn có trung tâm each số ít.',
    ),
    lessonId: 'agreement',
    title: 'Danh từ trung tâm quyết định động từ',
    observe: 'The list of suppliers is ready.',
    contrast: 'The suppliers on the list are reliable.',
    principle:
      'Tìm danh từ trung tâm, tạm bỏ cụm giới từ. Of suppliers không biến list thành số nhiều.',
    hint: 'Cụm of / in / on bổ sung cho danh từ nào?',
    prediction: exercise(
      'ag-p',
      'The collection of training videos ------- available online.',
      [
        ['is', 'Collection là danh từ trung tâm số ít.'],
        ['are', 'Videos nằm trong cụm of videos.'],
      ],
      'A',
      'The collection … is: trung tâm là collection.',
    ),
    transfer: exercise(
      'ag-t',
      'Several copies of the revised handbook ------- on the counter.',
      [
        ['is', 'Handbook không phải trung tâm của several copies.'],
        ['are', 'Copies là số nhiều.'],
      ],
      'B',
      'Chủ ngữ trung tâm là copies, dùng are.',
    ),
  },
  {
    id: 'verb-patterns',
    practice: exercise(
      'vp-r',
      'Please consider ------- the meeting to Friday.',
      [
        ['to move', 'Consider không theo sau bởi to V trong cấu trúc này.'],
        ['moving', 'Consider + V-ing.'],
      ],
      'B',
      'Consider moving: cân nhắc việc chuyển lịch cuộc họp.',
    ),
    lessonId: 'verb-patterns',
    title: 'Động từ trước quyết định dạng theo sau',
    observe: 'They agreed to extend the deadline.',
    contrast: 'They considered extending the deadline.',
    principle: 'Agree + to V; consider + V-ing. Không có một dạng theo sau đúng cho mọi động từ.',
    hint: 'Tìm động từ chi phối trước khi xét nghĩa của phần theo sau.',
    prediction: exercise(
      'vp-p',
      'The manager avoided ------- during the presentation.',
      [
        ['interrupting', 'Avoid + V-ing.'],
        ['to interrupt', 'Avoid không theo sau bằng to V trong cấu trúc này.'],
      ],
      'A',
      'Avoid interrupting: tránh việc ngắt lời.',
    ),
    transfer: exercise(
      'vp-t',
      'The supplier agreed ------- the damaged items.',
      [
        ['replacing', 'Agree dùng to V để nói đồng ý làm gì.'],
        ['to replace', 'Agree + to V.'],
      ],
      'B',
      'Agreed to replace: đồng ý thay thế.',
    ),
  },
  {
    id: 'passive',
    practice: exercise(
      'pa-r',
      'The printer was ------- by a technician yesterday.',
      [
        ['repaired', 'Was + repaired tạo bị động quá khứ.'],
        ['repair', 'Sau was cần phân từ quá khứ repaired, không phải nguyên mẫu repair.'],
      ],
      'A',
      'Printer nhận hành động sửa; dùng was repaired.',
    ),
    lessonId: 'passive',
    title: 'Ai thực hiện, ai nhận hành động?',
    observe: 'The technician repaired the printer.',
    contrast: 'The printer was repaired by the technician.',
    principle:
      'Bị động: be chia theo thì + phân từ quá khứ. Printer nhận hành động sửa, không tự sửa một vật khác.',
    hint: 'Chủ ngữ có thực hiện hành động không? Đã có be chưa?',
    prediction: exercise(
      'pa-p',
      'The invoices were ------- yesterday.',
      [
        ['send', 'Sau were cần phân từ quá khứ để tạo bị động.'],
        ['sent', 'Sent là phân từ quá khứ của send.'],
      ],
      'B',
      'Were sent tạo bị động quá khứ.',
    ),
    transfer: exercise(
      'pa-t',
      'Which sentence preserves “The committee approved the proposal”?',
      [
        [
          'The proposal was approved by the committee.',
          'Proposal chuyển thành chủ ngữ nhận hành động; giữ quá khứ.',
        ],
        ['The proposal approved the committee.', 'Đảo vai người thực hiện và đối tượng.'],
      ],
      'A',
      'Was approved giữ cả vai nghĩa và thì của câu gốc.',
    ),
  },
  {
    id: 'relatives',
    practice: exercise(
      're-r',
      'The technician ------- installed the router will return tomorrow.',
      [
        ['who', 'Who thay cho người và làm chủ ngữ của installed.'],
        ['which', 'Which không thay cho một người trong câu này.'],
      ],
      'A',
      'Who installed the router bổ sung thông tin về technician.',
    ),
    lessonId: 'relatives',
    title: 'Mệnh đề quan hệ: nối đúng vai',
    observe: 'The consultant who led the workshop is here.',
    contrast: 'The workshop that she led was useful.',
    principle:
      'Đại từ quan hệ thay cho thành phần trong mệnh đề. Trong who led…, who làm chủ ngữ; không thêm he/she lặp lại.',
    hint: 'Trong mệnh đề theo sau đã có chủ ngữ chưa?',
    prediction: exercise(
      're-p',
      'Choose the well-formed sentence.',
      [
        ['The employee who handles invoices is away.', 'Who làm chủ ngữ của handles.'],
        [
          'The employee who she handles invoices is away.',
          'She lặp chủ ngữ ở vị trí đã được who đảm nhiệm.',
        ],
      ],
      'A',
      'Who handles invoices không thêm she.',
    ),
    transfer: exercise(
      're-t',
      'The report ------- we discussed yesterday is ready.',
      [
        ['that', 'That thay cho tân ngữ của discussed; we là chủ ngữ.'],
        ['who', 'Who dùng cho người; report là vật.'],
      ],
      'A',
      'That thay cho report, là tân ngữ trong we discussed [the report].',
    ),
  },
  {
    id: 'subjunctive',
    practice: exercise(
      'su-r',
      'The director insists that every visitor ------- a badge.',
      [
        ['wear', 'Insists that trong nghĩa yêu cầu dùng dạng nguyên mẫu wear.'],
        ['wearing', 'Wearing không tạo động từ hữu hạn trong mệnh đề này.'],
      ],
      'A',
      'Yêu cầu every visitor wear a badge dùng dạng nguyên mẫu, dù chủ ngữ số ít.',
    ),
    lessonId: 'subjunctive',
    title: 'Yêu cầu: that + dạng nguyên mẫu',
    observe: 'The director requests that every visitor sign in.',
    contrast: 'Every visitor usually signs in at reception.',
    principle:
      'Trong lối giả định với request/recommend/essential, that + chủ ngữ + động từ nguyên mẫu, không thêm -s. Should + nguyên mẫu cũng có thể dùng, nhất là Anh-Anh.',
    hint: 'Đây là yêu cầu/khuyến nghị, hay một thói quen được mô tả?',
    prediction: exercise(
      'su-p',
      'It is essential that the technician ------- present.',
      [
        ['be', 'Dạng nguyên mẫu be trong lối giả định.'],
        ['being', 'Being không tạo động từ hữu hạn cho mệnh đề này.'],
      ],
      'A',
      'That the technician be present là lối giả định sau essential.',
    ),
    transfer: exercise(
      'su-t',
      'The manager recommended that the report ------- before noon.',
      [
        ['be submitted', 'Giả định bị động: be + phân từ quá khứ.'],
        ['being submitted', 'Being submitted thiếu động từ hữu hạn ở đây.'],
      ],
      'A',
      'Recommend that … be submitted kết hợp lối giả định và bị động.',
    ),
  },
]
