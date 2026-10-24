import {
  ORIGINAL_PROVENANCE,
  type Passage,
  type Question,
  type QuestionOption,
  type Stimulus,
} from './schema'

function options(items: [string, string][]): QuestionOption[] {
  return items.map(([text, reasoning], index) => ({
    id: (['A', 'B', 'C', 'D'] as const)[index],
    text,
    reasoning,
  }))
}
function question(
  draft: Omit<Question, 'schemaVersion' | 'provenance' | 'grammarIds' | 'vocabularyIds'> &
    Partial<Pick<Question, 'grammarIds' | 'vocabularyIds'>>,
): Question {
  return {
    schemaVersion: 1,
    provenance: ORIGINAL_PROVENANCE,
    grammarIds: [],
    vocabularyIds: [],
    ...draft,
  }
}
export const additionalPassages: Passage[] = [
  {
    id: 'p6-courier',
    title: 'Email · New courier collection service',
    format: 'email',
    text: 'To: All office staff\nFrom: Facilities Team\nSubject: New courier collection service\n\nStarting next Monday, outgoing parcels will be collected from reception at 4 p.m. each weekday. Please ensure that every parcel is {{1}} labeled with the recipient’s full address.\n\nThe courier will not accept parcels without a completed shipping form. {{2}} Therefore, staff should allow extra time to prepare international deliveries.\n\nIf you need a parcel collected after 4 p.m., please contact reception {{3}} noon so that a separate collection can be arranged. This service is available only when the courier has confirmed the {{4}}.\n\nThank you for helping us keep deliveries on schedule.',
  },
  {
    id: 'p7-quote',
    title: 'Document 1 · Venue quotation',
    format: 'email',
    text: 'To: Lena Ortiz, Hillcrest Training\nFrom: Bayview Conference Centre\nSubject: Quotation for November 8\n\nThank you for your enquiry about a workshop for 24 participants. Cedar Room is available from 9 a.m. to 1 p.m. on November 8. The room fee is $320 and includes a projector. Lunch is $15 per person and is optional.\n\nTo reserve the room, please pay a $100 deposit by October 25. The deposit will be deducted from the final invoice.\n\nPlease confirm the final number of lunches by November 1.',
  },
  {
    id: 'p7-reply',
    title: 'Document 2 · Organizer’s reply',
    format: 'email',
    text: 'To: Bayview Conference Centre\nFrom: Lena Ortiz, Hillcrest Training\nSubject: Re: Quotation for November 8\n\nWe would like to reserve Cedar Room for the hours you offered. I have transferred the deposit today, October 23. Our group will bring its own lunches, so we only need the room and the included equipment.\n\nTwo additional colleagues will attend, bringing our total to 26. Please confirm that the room can accommodate this number.\n\nWe look forward to your confirmation.\nLena',
  },
]
export const additionalStimuli: Stimulus[] = [
  {
    id: 'photo-bookshelves',
    title: 'Photograph · Bookshelves',
    kind: 'photograph',
    part: 1,
    topic: 'facilities',
    provenance: ORIGINAL_PROVENANCE,
    photograph: {
      status: 'ready',
      src: '/media/bookshelves-san906.jpg',
      alt: 'A photograph of several shelves containing books.',
      author: 'San906',
      sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bookshelves_906.JPG',
      license: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    audio: {
      kind: 'synthetic',
      transcript: 'Look at the photograph. Choose the statement that best describes it.',
    },
  },
  {
    id: 'conversation-delivery',
    title: 'Conversation · Delivery arrangements',
    kind: 'conversation',
    part: 3,
    topic: 'office',
    provenance: ORIGINAL_PROVENANCE,
    audio: {
      kind: 'synthetic',
      transcript:
        'Receptionist: Good morning, Greenway Office Supplies. How can I help?\nCustomer: Our replacement chairs are due tomorrow, but the delivery schedule lists our old address. We moved to 18 Park Road last week.\nReceptionist: Thanks for letting us know. I will update the address. Your driver is on Route B, which appears on the schedule in your confirmation email.\nCustomer: I see it. Could the driver call fifteen minutes before arriving? Our loading area is shared with another company.\nReceptionist: Certainly. I will add that instruction. Please keep the entrance clear during your delivery window.',
    },
    exhibit: {
      kind: 'table',
      title: 'Tomorrow’s delivery schedule',
      columns: ['Route', 'Delivery window'],
      rows: [
        ['A', '8:00–10:00 a.m.'],
        ['B', '10:00 a.m.–noon'],
        ['C', '1:00–3:00 p.m.'],
        ['D', '3:00–5:00 p.m.'],
      ],
    },
  },
  {
    id: 'talk-workshop',
    title: 'Announcement · Workshop rooms',
    kind: 'talk',
    part: 4,
    topic: 'training',
    provenance: ORIGINAL_PROVENANCE,
    audio: {
      kind: 'synthetic',
      transcript:
        'Good morning, and welcome to the staff training day. The customer service workshop has moved from Cedar Room to Maple Room because we need more seats. Please check the room directory by the entrance if you need directions. The session still begins at nine thirty. Before going upstairs, collect your name badge from the reception desk here on the ground floor. A printed workbook is waiting at each seat, so there is no need to bring one from reception. Thank you.',
    },
    exhibit: {
      kind: 'table',
      title: 'Room directory',
      columns: ['Room', 'Floor'],
      rows: [
        ['Cedar', 'Ground floor'],
        ['Maple', 'Second floor'],
        ['Willow', 'First floor'],
        ['Birch', 'Third floor'],
      ],
    },
  },
  {
    id: 'text-courier',
    title: 'Text completion · Courier service',
    kind: 'text-completion',
    part: 6,
    topic: 'office',
    provenance: ORIGINAL_PROVENANCE,
    passageIds: ['p6-courier'],
  },
  {
    id: 'reading-venue-pair',
    title: 'Double passage · Venue booking',
    kind: 'reading',
    part: 7,
    topic: 'training',
    provenance: ORIGINAL_PROVENANCE,
    passageIds: ['p7-quote', 'p7-reply'],
  },
]

export const additionalQuestions: Question[] = [
  question({
    id: 'p1-bookshelves',
    part: 1,
    topic: 'facilities',
    stimulusId: 'photo-bookshelves',
    prompt: 'Choose the statement that best describes the photograph.',
    difficulty: 'foundation',
    skills: ['photo-detail'],
    options: options([
      [
        'Books are arranged on several shelves.',
        'Có nhiều sách xếp trên các tầng kệ, đúng với ảnh.',
      ],
      ['Several people are carrying boxes.', 'Ảnh không có người đang mang hộp.'],
      [
        'The shelves are completely empty.',
        'Các kệ chứa nhiều sách; completely empty trái với ảnh.',
      ],
      ['A worker is painting a wall.', 'Không có người hoặc hành động sơn tường trong ảnh.'],
    ]),
    answer: 'A',
    explanation:
      'Ảnh cho thấy sách được xếp trên nhiều tầng kệ. Không có người hay hành động lao động được mô tả trong các lựa chọn còn lại.',
    takeaway: 'Chỉ chọn điều nhìn thấy; không suy đoán hành động ngoài ảnh.',
  }),
  question({
    id: 'p3-address',
    part: 3,
    topic: 'office',
    stimulusId: 'conversation-delivery',
    prompt: 'Why does the customer call?',
    difficulty: 'foundation',
    skills: ['listening-main-idea'],
    options: options([
      ['To cancel an order for chairs.', 'Khách vẫn muốn nhận ghế, không hủy đơn.'],
      [
        'To correct a delivery address.',
        'Khách nói lịch vẫn ghi địa chỉ cũ và cung cấp địa chỉ mới.',
      ],
      ['To apply for a driving position.', 'Không có nội dung xin việc lái xe.'],
      ['To reserve a meeting room.', 'Cuộc gọi liên quan giao ghế, không phải đặt phòng.'],
    ]),
    answer: 'B',
    explanation:
      'Khách nói địa chỉ trong lịch giao hàng là địa chỉ cũ và cho biết đã chuyển đến 18 Park Road. Mục đích chính là sửa địa chỉ giao hàng.',
    takeaway: 'Phân biệt mục đích chính của cuộc gọi với yêu cầu phụ xuất hiện sau.',
  }),
  question({
    id: 'p3-route',
    part: 3,
    topic: 'office',
    stimulusId: 'conversation-delivery',
    prompt:
      'Look at the schedule. During which time window should the customer expect the delivery?',
    difficulty: 'intermediate',
    skills: ['visual-integration', 'listening-detail'],
    options: options([
      ['8:00–10:00 a.m.', 'Đây là Route A; cuộc gọi xác định Route B.'],
      ['1:00–3:00 p.m.', 'Đây là Route C, không phải Route B.'],
      ['10:00 a.m.–noon', 'Nghe Route B rồi đối chiếu bảng sẽ thấy khung 10 giờ đến trưa.'],
      ['3:00–5:00 p.m.', 'Khung này thuộc Route D.'],
    ]),
    answer: 'C',
    explanation:
      'Nhân viên nói người giao thuộc Route B. Bảng thể hiện Route B giao trong khoảng 10:00 a.m.–noon.',
    takeaway: 'Ghép mã nghe được với đúng hàng trong bảng, không đoán theo giờ quen thuộc.',
  }),
  question({
    id: 'p3-call-ahead',
    part: 3,
    topic: 'office',
    stimulusId: 'conversation-delivery',
    prompt: 'What does the customer ask the driver to do?',
    difficulty: 'foundation',
    skills: ['listening-detail'],
    options: options([
      ['Wait at the old address.', 'Khách đã yêu cầu sửa sang địa chỉ mới.'],
      ['Bring additional chairs.', 'Không có yêu cầu tăng số ghế.'],
      ['Deliver the order next week.', 'Hàng vẫn được giao ngày mai.'],
      [
        'Call shortly before arriving.',
        'Khách đề nghị gọi trước 15 phút vì khu vực dỡ hàng dùng chung.',
      ],
    ]),
    answer: 'D',
    explanation:
      '“Could the driver call fifteen minutes before arriving?” là yêu cầu cụ thể. Khu dỡ hàng dùng chung giải thích lý do của yêu cầu này.',
    takeaway: 'Nghe hành động được yêu cầu, rồi dùng lý do để kiểm tra cách hiểu.',
  }),
  question({
    id: 'p4-purpose',
    part: 4,
    topic: 'training',
    stimulusId: 'talk-workshop',
    prompt: 'What is the main purpose of the announcement?',
    difficulty: 'foundation',
    skills: ['listening-main-idea'],
    options: options([
      [
        'To explain a room change and arrival instructions.',
        'Thông báo đổi phòng và hướng dẫn lấy thẻ trước khi lên phòng.',
      ],
      [
        'To cancel the staff training day.',
        'Buổi đào tạo vẫn diễn ra, giờ bắt đầu không thay đổi.',
      ],
      ['To introduce a new company director.', 'Không có giới thiệu giám đốc.'],
      [
        'To ask staff to buy workbooks.',
        'Tài liệu đã được đặt tại chỗ ngồi; không có yêu cầu mua.',
      ],
    ]),
    answer: 'A',
    explanation:
      'Bài nói thông báo chuyển workshop sang Maple Room và hướng dẫn nhận thẻ tại lễ tân. Các chi tiết hỗ trợ mục đích này.',
    takeaway: 'Tóm tắt thông báo bằng thay đổi chính và việc người nghe cần làm.',
  }),
  question({
    id: 'p4-floor',
    part: 4,
    topic: 'training',
    stimulusId: 'talk-workshop',
    prompt: 'Look at the directory. On which floor will the customer service workshop take place?',
    difficulty: 'intermediate',
    skills: ['visual-integration', 'listening-detail'],
    options: options([
      ['Ground floor', 'Ground floor là Cedar Room cũ, không phải Maple Room mới.'],
      ['First floor', 'First floor là Willow Room.'],
      ['Third floor', 'Third floor là Birch Room.'],
      ['Second floor', 'Bài nói xác định Maple Room, bảng cho biết phòng này ở tầng hai.'],
    ]),
    answer: 'D',
    explanation:
      'Cần dùng địa điểm mới Maple Room, rồi tìm tầng tương ứng trong room directory: Second floor.',
    takeaway: 'Khi nghe thay đổi, dùng thông tin mới để tra bảng.',
  }),
  question({
    id: 'p4-badge',
    part: 4,
    topic: 'training',
    stimulusId: 'talk-workshop',
    prompt: 'What should participants do before going upstairs?',
    difficulty: 'foundation',
    skills: ['listening-detail'],
    options: options([
      ['Collect a workbook from reception.', 'Bài nói nêu rõ workbook đã có tại mỗi chỗ ngồi.'],
      [
        'Pick up a name badge.',
        'Người nghe được yêu cầu lấy name badge từ reception trước khi lên tầng.',
      ],
      ['Change the starting time.', 'Giờ bắt đầu vẫn là 9:30; người nghe không cần đổi giờ.'],
      ['Move chairs out of Cedar Room.', 'Không yêu cầu người tham gia di chuyển ghế.'],
    ]),
    answer: 'B',
    explanation:
      '“Before going upstairs, collect your name badge …” là chỉ dẫn trực tiếp. Workbook không cần lấy ở lễ tân.',
    takeaway: 'Chú ý từ chỉ trình tự: before, after, first.',
  }),
  question({
    id: 'p6-label',
    part: 6,
    topic: 'office',
    stimulusId: 'text-courier',
    blankKey: '1',
    blankType: 'word',
    prompt: 'Choose the best word for blank [1].',
    difficulty: 'foundation',
    skills: ['word-form'],
    grammarIds: ['word-forms'],
    options: options([
      ['clear', 'Clear là tính từ; vị trí trước labeled cần trạng từ mô tả cách ghi nhãn.'],
      ['clarity', 'Clarity là danh từ, không bổ nghĩa cho labeled.'],
      ['clearly', 'Clearly là trạng từ, tạo cụm clearly labeled.'],
      ['clears', 'Clears là động từ đã chia, không phù hợp trong is … labeled.'],
    ]),
    answer: 'C',
    explanation:
      '“Is clearly labeled” diễn tả bưu kiện được ghi nhãn rõ ràng. Cần trạng từ clearly bổ nghĩa cho labeled.',
    takeaway: 'Dùng cấu trúc trong cả câu, không chỉ nhìn từ đứng sát chỗ trống.',
  }),
  question({
    id: 'p6-sentence',
    part: 6,
    topic: 'office',
    stimulusId: 'text-courier',
    blankKey: '2',
    blankType: 'sentence',
    prompt: 'Which sentence best fits blank [2]?',
    difficulty: 'intermediate',
    skills: ['text-cohesion'],
    options: options([
      [
        'International parcels also require a customs declaration.',
        'Nối yêu cầu shipping form với việc cần thêm thời gian chuẩn bị hàng quốc tế ở câu sau.',
      ],
      [
        'The office cafeteria serves lunch until two.',
        'Thông tin nhà ăn không liên quan yêu cầu hồ sơ vận chuyển.',
      ],
      [
        'All office meetings have been canceled.',
        'Không liên quan quy trình gửi bưu kiện hoặc câu Therefore sau đó.',
      ],
      [
        'The company is purchasing new reception chairs.',
        'Việc mua ghế không giải thích tại sao cần thêm thời gian cho hàng quốc tế.',
      ],
    ]),
    answer: 'A',
    explanation:
      'Câu trước nói cần shipping form; câu sau có Therefore và nhắc international deliveries cần thêm thời gian. Việc phải bổ sung customs declaration tạo mối nối nhân quả rõ ràng.',
    takeaway: 'Với chỗ trống cả câu, kiểm tra sự liên kết với cả câu trước lẫn câu sau.',
  }),
  question({
    id: 'p6-before',
    part: 6,
    topic: 'office',
    stimulusId: 'text-courier',
    blankKey: '3',
    blankType: 'word',
    prompt: 'Choose the best word for blank [3].',
    difficulty: 'foundation',
    skills: ['connectors'],
    grammarIds: ['connectors'],
    options: options([
      ['during', 'During noon không phải cách diễn đạt tự nhiên cho một hạn chót tại đây.'],
      ['between', 'Between cần hai mốc hoặc một khoảng gồm hai đầu.'],
      [
        'until',
        'Contact … until noon gợi hành động tiếp diễn đến trưa, không phải yêu cầu liên hệ trước hạn để sắp xếp.',
      ],
      ['before', 'Before noon cho hạn liên hệ sớm hơn trưa để sắp xếp một chuyến lấy hàng riêng.'],
    ]),
    answer: 'D',
    explanation:
      'Nhân viên cần liên hệ trước trưa để lễ tân kịp sắp xếp. Before noon diễn tả đúng hạn này.',
    takeaway: 'Giới từ thời gian phải phù hợp cả cấu trúc lẫn mục đích của hành động.',
  }),
  question({
    id: 'p6-collection',
    part: 6,
    topic: 'office',
    stimulusId: 'text-courier',
    blankKey: '4',
    blankType: 'word',
    prompt: 'Choose the best word for blank [4].',
    difficulty: 'foundation',
    skills: ['reading-detail'],
    vocabularyIds: ['confirm'],
    options: options([
      ['decoration', 'Decoration là trang trí, không liên quan dịch vụ lấy bưu kiện.'],
      ['collection', 'Collection quay lại việc separate collection được nhắc ở câu trước.'],
      ['interview', 'Interview là phỏng vấn, không phù hợp ngữ cảnh.'],
      ['promotion', 'Promotion không chỉ chuyến lấy hàng cần xác nhận.'],
    ]),
    answer: 'B',
    explanation:
      'This service ám chỉ separate collection ở câu trước. Courier cần xác nhận chuyến collection đó.',
    takeaway: 'Lần theo từ/cụm từ được nhắc lại để chọn nghĩa trong văn bản.',
  }),
  question({
    id: 'p7-double-cost',
    part: 7,
    topic: 'training',
    stimulusId: 'reading-venue-pair',
    prompt: 'Based on both emails, how much remains to be paid for the room?',
    difficulty: 'intermediate',
    skills: ['cross-text', 'reading-inference'],
    vocabularyIds: ['invoice'],
    options: options([
      ['$100', 'Đây là tiền đặt cọc đã trả, không phải số còn lại.'],
      ['$220', 'Phí phòng $320 trừ $100 đặt cọc; email trả lời cho biết không đặt bữa trưa.'],
      ['$320', 'Đây là toàn bộ phí phòng trước khi trừ tiền cọc.'],
      ['$610', 'Không có khoản phí $610; nhóm tự mang bữa trưa.'],
    ]),
    answer: 'B',
    explanation:
      'Báo giá phòng là $320 và tiền cọc $100 được trừ vào hóa đơn. Email trả lời xác nhận đã chuyển tiền cọc và tự mang bữa trưa: còn $220 tiền phòng.',
    takeaway: 'Đối chiếu điều kiện trong báo giá với lựa chọn thực tế trong thư trả lời.',
  }),
  question({
    id: 'p7-double-confirm',
    part: 7,
    topic: 'training',
    stimulusId: 'reading-venue-pair',
    prompt: 'What does Lena still need the conference centre to confirm?',
    difficulty: 'foundation',
    skills: ['cross-text', 'reading-detail'],
    options: options([
      [
        'Whether a projector is included.',
        'Báo giá đã nói có projector; Lena không hỏi lại điều này.',
      ],
      [
        'Whether lunch can be served at noon.',
        'Nhóm sẽ tự mang bữa trưa, không yêu cầu dịch vụ ăn uống.',
      ],
      [
        'Whether the room can hold 26 people.',
        'Thư trả lời tăng số người từ 24 lên 26 và đề nghị xác nhận sức chứa.',
      ],
      [
        'Whether the deposit deadline can be extended.',
        'Tiền cọc đã được trả ngày 23, trước hạn 25.',
      ],
    ]),
    answer: 'C',
    explanation:
      'Email đầu tính cho 24 người. Lena cho biết có thêm hai đồng nghiệp và đề nghị xác nhận phòng đủ cho 26 người.',
    takeaway: 'Nhận ra thông tin thay đổi giữa các văn bản.',
  }),
  question({
    id: 'p7-double-deposit',
    part: 7,
    topic: 'training',
    stimulusId: 'reading-venue-pair',
    prompt: 'What is indicated about the deposit?',
    difficulty: 'foundation',
    skills: ['cross-text', 'reading-detail'],
    options: options([
      ['It was paid before the deadline.', 'Hạn 25/10 và Lena đã chuyển ngày 23/10.'],
      ['It covers the entire room fee.', '$100 không đủ thanh toán phí phòng $320.'],
      ['It will pay for 26 lunches.', 'Đặt cọc được trừ phí phòng; nhóm không đặt bữa trưa.'],
      ['It must be paid on November 8.', 'Hạn đặt cọc là October 25, không phải ngày tổ chức.'],
    ]),
    answer: 'A',
    explanation:
      'Báo giá yêu cầu trả đặt cọc trước hoặc vào October 25. Lena đã chuyển vào October 23, tức trước hạn.',
    takeaway: 'Đọc đúng vai trò từng mốc thời gian khi đối chiếu thư.',
  }),
]
