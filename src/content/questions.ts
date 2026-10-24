import {
  ORIGINAL_PROVENANCE,
  type Passage,
  type Question,
  type LegacyQuestion,
  type Stimulus,
} from './schema'
import { transferQuestions } from './transfers'
import { additionalPassages, additionalQuestions, additionalStimuli } from './expandedBank'
import { installedPackages } from './generated'

const legacyPassages: Passage[] = [
  {
    id: 'library-notice',
    title: 'Riverside Library · Service notice',
    format: 'notice',
    text: 'RIVERSIDE LIBRARY\nTemporary entrance change\n\nFrom June 3 to June 14, the main entrance will be closed for renovation. Please use the garden entrance on Oak Street. The library will remain open during its usual hours.\n\nThe book-return box beside the main entrance will also be unavailable. Readers may return books at the service desk or renew them online. No late fees will be charged for books due during this period.\n\nFor accessibility assistance, call the service desk before your visit.',
  },
  {
    id: 'workshop-email',
    title: 'Email · Customer service workshop',
    format: 'email',
    text: 'To: All customer service employees\nFrom: Maya Tran, Training Coordinator\nSubject: Thursday workshop — updated venue\n\nOur customer service workshop will take place on Thursday, September 18, from 9 a.m. to noon. Because more employees registered than expected, we have moved the workshop from Room 204 to the conference hall on the ground floor.\n\nPlease bring a laptop. Printed materials and light refreshments will be provided. Employees working at our branch offices can join through the video link in their confirmation email.\n\nIf you have not registered, please do so by Tuesday at 5 p.m. Participation is optional, but new team members are encouraged to attend.\n\nMaya',
  },
]
export const passages = [
  ...legacyPassages,
  ...additionalPassages,
  ...installedPackages.flatMap((p) => p.bank.passages),
]
export const passageById = new Map(passages.map((p) => [p.id, p]))

const legacyQuestions: LegacyQuestion[] = [
  {
    schemaVersion: 1,
    id: 'p5-efficiently',
    part: 5,
    difficulty: 'foundation',
    prompt:
      'The new booking system processes customer requests more ------- than the previous one.',
    options: [
      {
        id: 'A',
        text: 'efficient',
        reasoning: 'Efficient là tính từ; vị trí này mô tả hành động processes nên cần trạng từ.',
      },
      {
        id: 'B',
        text: 'efficiency',
        reasoning:
          'Efficiency là danh từ, không bổ nghĩa trực tiếp cho processes theo cấu trúc này.',
      },
      {
        id: 'C',
        text: 'efficiently',
        reasoning:
          'Efficiently là trạng từ bổ nghĩa cho processes; more efficiently tạo dạng so sánh hơn.',
      },
      {
        id: 'D',
        text: 'efficiencies',
        reasoning: 'Efficiencies là danh từ số nhiều, không phù hợp với vị trí trạng từ.',
      },
    ],
    answer: 'C',
    explanation:
      'Ta cần mô tả hệ thống xử lý yêu cầu như thế nào. Processes là động từ, vì vậy dùng trạng từ efficiently. More … than tạo phép so sánh với hệ thống trước.',
    takeaway: 'Xác định từ được bổ nghĩa trước khi chọn từ loại.',
    skills: ['word-form', 'comparisons'],
    grammarIds: ['word-forms'],
    vocabularyIds: ['efficient'],
  },
  {
    schemaVersion: 1,
    id: 'p5-reliable',
    part: 5,
    difficulty: 'foundation',
    prompt: 'The purchasing team is looking for a ------- supplier of office equipment.',
    options: [
      {
        id: 'A',
        text: 'reliably',
        reasoning: 'Trạng từ reliably không bổ nghĩa trực tiếp cho danh từ supplier.',
      },
      {
        id: 'B',
        text: 'reliable',
        reasoning: 'Tính từ reliable đứng trước danh từ supplier để mô tả nhà cung cấp.',
      },
      {
        id: 'C',
        text: 'reliability',
        reasoning: 'Reliability là danh từ. Cụm a reliability supplier không có nghĩa phù hợp.',
      },
      { id: 'D', text: 'rely', reasoning: 'Rely là động từ nguyên mẫu; chỗ trống cần tính từ.' },
    ],
    answer: 'B',
    explanation:
      'Giữa mạo từ a và danh từ supplier cần tính từ reliable: một nhà cung cấp đáng tin cậy.',
    takeaway: 'Mạo từ + tính từ + danh từ là một khung hữu ích.',
    skills: ['word-form'],
    grammarIds: ['word-forms'],
    vocabularyIds: ['reliable', 'supplier', 'equipment', 'purchase'],
  },
  {
    schemaVersion: 1,
    id: 'p5-agreement',
    part: 5,
    difficulty: 'foundation',
    prompt: 'Each employee in the regional offices ------- a security badge on arrival.',
    options: [
      {
        id: 'A',
        text: 'receive',
        reasoning: 'Receive không hòa hợp với chủ ngữ số ít each employee ở hiện tại đơn.',
      },
      {
        id: 'B',
        text: 'receiving',
        reasoning: 'Receiving đứng một mình không tạo thành vị ngữ hữu hạn trong câu này.',
      },
      {
        id: 'C',
        text: 'to receive',
        reasoning: 'To receive không thể làm động từ chính của câu theo cấu trúc này.',
      },
      {
        id: 'D',
        text: 'receives',
        reasoning: 'Each employee là chủ ngữ số ít; receives diễn tả quy trình thông thường.',
      },
    ],
    answer: 'D',
    explanation:
      'Chủ ngữ là Each employee. Cụm in the regional offices chỉ bổ sung vị trí, không biến chủ ngữ thành số nhiều.',
    takeaway: 'Bỏ qua cụm giới từ để tìm danh từ trung tâm.',
    skills: ['agreement'],
    grammarIds: ['agreement'],
    vocabularyIds: ['employee'],
  },
  {
    schemaVersion: 1,
    id: 'p5-tense',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'Ms. Patel ------- the maintenance department since she joined the company in 2021.',
    options: [
      {
        id: 'A',
        text: 'has managed',
        reasoning:
          'Has managed nối thời điểm bắt đầu trong quá khứ với hiện tại, phù hợp với since.',
      },
      {
        id: 'B',
        text: 'manages',
        reasoning:
          'Hiện tại đơn không diễn tả đầy đủ khoảng thời gian kéo dài từ 2021 đến hiện tại ở đây.',
      },
      {
        id: 'C',
        text: 'will manage',
        reasoning: 'Tương lai đơn không phù hợp với mốc bắt đầu she joined … in 2021.',
      },
      {
        id: 'D',
        text: 'is managing',
        reasoning:
          'Hiện tại tiếp diễn không phù hợp để diễn tả quãng thời gian since 2021 theo cấu trúc này.',
      },
    ],
    answer: 'A',
    explanation:
      'Since she joined … in 2021 xác định điểm bắt đầu. Công việc quản lý kéo dài đến hiện tại nên dùng hiện tại hoàn thành has managed.',
    takeaway: 'Since + mốc quá khứ thường gắn với hiện tại hoàn thành.',
    skills: ['tenses'],
    grammarIds: ['tenses'],
    vocabularyIds: ['maintenance'],
  },
  {
    schemaVersion: 1,
    id: 'p5-passive',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'All expense claims must ------- by a department manager before payment.',
    options: [
      {
        id: 'A',
        text: 'approve',
        reasoning: 'Các yêu cầu thanh toán không tự phê duyệt; cần dạng bị động.',
      },
      {
        id: 'B',
        text: 'approved',
        reasoning: 'Sau must cần động từ nguyên mẫu; bị động ở đây cần be approved.',
      },
      {
        id: 'C',
        text: 'be approved',
        reasoning: 'Must be approved là cấu trúc khuyết thiếu bị động chính xác.',
      },
      {
        id: 'D',
        text: 'be approving',
        reasoning: 'Be approving là chủ động tiếp diễn, sai vai trò nhận hành động của claims.',
      },
    ],
    answer: 'C',
    explanation:
      'Expense claims là đối tượng được quản lý phê duyệt. Sau must dùng be + phân từ quá khứ: must be approved.',
    takeaway: 'Modal + be + V3 diễn tả nghĩa bị động.',
    skills: ['passive', 'modals'],
    grammarIds: ['passive'],
    vocabularyIds: ['approve'],
  },
  {
    schemaVersion: 1,
    id: 'p5-gerund',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'The company postponed ------- its new branch until the renovation was complete.',
    options: [
      {
        id: 'A',
        text: 'open',
        reasoning: 'Postpone không đi trực tiếp với động từ nguyên mẫu không to.',
      },
      {
        id: 'B',
        text: 'opening',
        reasoning: 'Postpone được theo sau bởi danh động từ V-ing: postponed opening.',
      },
      {
        id: 'C',
        text: 'to open',
        reasoning: 'To open thường đi với plan hoặc decide, không phù hợp sau postpone.',
      },
      {
        id: 'D',
        text: 'opened',
        reasoning: 'Phân từ opened không làm bổ ngữ đúng cho postponed ở đây.',
      },
    ],
    answer: 'B',
    explanation:
      'Cấu trúc postpone doing something nghĩa là hoãn làm việc gì. Opening là danh động từ làm tân ngữ cho postponed.',
    takeaway: 'Ghi nhớ động từ theo cấu trúc: postpone + V-ing.',
    skills: ['verb-patterns'],
    grammarIds: ['verb-patterns'],
    vocabularyIds: ['postpone', 'renovation'],
  },
  {
    schemaVersion: 1,
    id: 'p5-connectors',
    part: 5,
    difficulty: 'intermediate',
    prompt: '------- the unexpected delivery delay, the installation team finished on time.',
    options: [
      {
        id: 'A',
        text: 'Although',
        reasoning:
          'Although cần một mệnh đề có chủ ngữ và động từ, trong khi phần sau là cụm danh từ.',
      },
      {
        id: 'B',
        text: 'Because',
        reasoning:
          'Because cần mệnh đề. Ngoài ra quan hệ ở đây là nhượng bộ, không phải nguyên nhân.',
      },
      {
        id: 'C',
        text: 'However',
        reasoning: 'However không làm giới từ trước cụm danh từ như trong câu này.',
      },
      {
        id: 'D',
        text: 'Despite',
        reasoning: 'Despite đi với cụm danh từ và diễn tả quan hệ nhượng bộ đúng nghĩa.',
      },
    ],
    answer: 'D',
    explanation:
      'The unexpected delivery delay là cụm danh từ. Despite + cụm danh từ diễn tả “mặc dù giao hàng chậm ngoài dự kiến”.',
    takeaway: 'Nhìn cấu trúc sau chỗ trống: mệnh đề hay cụm danh từ?',
    skills: ['connectors', 'prepositions'],
    grammarIds: ['connectors'],
    vocabularyIds: ['despite', 'delivery'],
  },
  {
    schemaVersion: 1,
    id: 'p5-conditionals',
    part: 5,
    difficulty: 'intermediate',
    prompt:
      'If the automated dispatch system ------- the shipment today, we will receive it by Friday.',
    options: [
      {
        id: 'A',
        text: 'dispatches',
        reasoning: 'Điều kiện loại 1 dùng hiện tại đơn trong mệnh đề if: dispatches.',
      },
      {
        id: 'B',
        text: 'will dispatch',
        reasoning: 'Trong điều kiện loại 1 thông thường, không dùng will trong mệnh đề if.',
      },
      {
        id: 'C',
        text: 'had dispatched',
        reasoning: 'Quá khứ hoàn thành thuộc một cấu trúc điều kiện khác, không khớp will receive.',
      },
      {
        id: 'D',
        text: 'dispatching',
        reasoning:
          'Dispatching không tạo được động từ hữu hạn đứng sau chủ ngữ the automated dispatch system.',
      },
    ],
    answer: 'A',
    explanation:
      'Câu nói về khả năng trong tương lai. If + hiện tại đơn, will + V: If the system dispatches …, we will receive … Đây là điều kiện vận hành, không phải lời đề nghị về sự sẵn lòng.',
    takeaway: 'Điều kiện có thể xảy ra: if + hiện tại đơn.',
    skills: ['conditionals'],
    grammarIds: ['conditionals'],
    vocabularyIds: ['supplier', 'shipment'],
  },
  {
    schemaVersion: 1,
    id: 'p5-relative',
    part: 5,
    difficulty: 'advanced',
    prompt: 'The supplier ------- warehouse is near our office offers same-day delivery.',
    options: [
      {
        id: 'A',
        text: 'who',
        reasoning: 'Who có thể làm chủ ngữ nhưng không diễn tả sở hữu trước warehouse.',
      },
      {
        id: 'B',
        text: 'which',
        reasoning: 'Which không diễn tả quan hệ sở hữu trước danh từ warehouse.',
      },
      {
        id: 'C',
        text: 'whose',
        reasoning: 'Whose warehouse diễn tả kho hàng thuộc về nhà cung cấp.',
      },
      {
        id: 'D',
        text: 'whom',
        reasoning: 'Whom làm tân ngữ chỉ người; vị trí này cần từ chỉ sở hữu.',
      },
    ],
    answer: 'C',
    explanation:
      'Warehouse thuộc về supplier. Whose đứng trước danh từ để tạo quan hệ sở hữu; whose cũng dùng được với tổ chức.',
    takeaway: 'Whose + danh từ diễn tả quan hệ sở hữu.',
    skills: ['relative-clauses'],
    grammarIds: ['relatives'],
    vocabularyIds: ['supplier', 'delivery'],
  },
  {
    schemaVersion: 1,
    id: 'p5-subjunctive',
    part: 5,
    difficulty: 'advanced',
    prompt:
      'The safety officer recommends that every visitor ------- accompanied by a staff member.',
    options: [
      {
        id: 'A',
        text: 'been',
        reasoning: 'Been là phân từ quá khứ, không đứng độc lập làm động từ của mệnh đề that.',
      },
      {
        id: 'B',
        text: 'be',
        reasoning: 'Dùng be nguyên mẫu trong cấu trúc giả định bị động be accompanied.',
      },
      {
        id: 'C',
        text: 'being',
        reasoning: 'Being không tạo được vị ngữ hữu hạn cho mệnh đề that ở đây.',
      },
      {
        id: 'D',
        text: 'to be',
        reasoning: 'To be không đứng trực tiếp sau chủ ngữ every visitor trong mệnh đề that.',
      },
    ],
    answer: 'B',
    explanation:
      'Recommends that giới thiệu đề nghị. Khách được nhân viên đi cùng nên dùng giả định bị động be accompanied, với be ở dạng nguyên mẫu.',
    takeaway: 'Recommend that + chủ ngữ + V nguyên mẫu.',
    skills: ['subjunctive'],
    grammarIds: ['subjunctive'],
    vocabularyIds: ['recommend'],
  },
  {
    schemaVersion: 1,
    id: 'p2-location',
    part: 2,
    difficulty: 'foundation',
    prompt: 'Choose the best response to the question you hear.',
    media: {
      audio: { kind: 'synthetic', transcript: 'Where will the training workshop be held?' },
    },
    options: [
      {
        id: 'A',
        text: 'In the conference room on the second floor.',
        reasoning: 'Câu trả lời nêu địa điểm, đúng với câu hỏi Where.',
      },
      {
        id: 'B',
        text: 'It starts at nine tomorrow.',
        reasoning: 'Nêu thời gian, trong khi câu hỏi yêu cầu địa điểm.',
      },
      {
        id: 'C',
        text: 'Yes, I have attended it before.',
        reasoning: 'Where không phải câu hỏi yes/no; câu này không nêu địa điểm.',
      },
    ],
    answer: 'A',
    explanation:
      'Where hỏi địa điểm. In the conference room … trực tiếp trả lời nơi tổ chức workshop.',
    takeaway: 'Nghe từ hỏi trước: Where → địa điểm.',
    skills: ['listening-intent'],
    grammarIds: [],
    vocabularyIds: ['workshop'],
  },
  {
    schemaVersion: 1,
    id: 'p2-time',
    part: 2,
    difficulty: 'foundation',
    prompt: 'Choose the best response to the question you hear.',
    media: {
      audio: { kind: 'synthetic', transcript: 'When is the deadline for submitting the proposal?' },
    },
    options: [
      {
        id: 'A',
        text: 'You can email it to the director.',
        reasoning: 'Nêu cách hoặc người nhận, không trả lời hạn nộp.',
      },
      {
        id: 'B',
        text: 'By five o’clock on Friday.',
        reasoning: 'Nêu mốc thời gian cuối cùng, phù hợp với When và deadline.',
      },
      {
        id: 'C',
        text: 'The proposal was very detailed.',
        reasoning: 'Nhận xét về đề xuất, không nêu thời gian.',
      },
    ],
    answer: 'B',
    explanation:
      'When is the deadline … hỏi hạn cuối. By five o’clock on Friday nghĩa là chậm nhất lúc 5 giờ thứ Sáu.',
    takeaway: 'By + thời gian thể hiện hạn chót.',
    skills: ['listening-detail'],
    grammarIds: [],
    vocabularyIds: ['deadline', 'submit', 'proposal'],
  },
  {
    schemaVersion: 1,
    id: 'p2-request',
    part: 2,
    difficulty: 'intermediate',
    prompt: 'Choose the best response to the question you hear.',
    media: {
      audio: {
        kind: 'synthetic',
        transcript: 'Could you send me the updated invoice this afternoon?',
      },
    },
    options: [
      {
        id: 'A',
        text: 'The office is on the left.',
        reasoning: 'Đây là chỉ dẫn địa điểm, không liên quan đến yêu cầu gửi hóa đơn.',
      },
      {
        id: 'B',
        text: 'I bought it last month.',
        reasoning: 'Bought không trả lời việc gửi invoice. Không chọn chỉ vì liên quan mua bán.',
      },
      {
        id: 'C',
        text: 'Certainly, I’ll email it after lunch.',
        reasoning: 'Chấp nhận yêu cầu và nêu cách, thời gian thực hiện phù hợp.',
      },
    ],
    answer: 'C',
    explanation:
      'Could you … là lời yêu cầu lịch sự. Certainly, I’ll email it after lunch đáp lại đúng hành động được yêu cầu.',
    takeaway: 'Nhận diện chức năng: Could you … thường là lời nhờ.',
    skills: ['listening-intent'],
    grammarIds: [],
    vocabularyIds: ['invoice'],
  },
  {
    schemaVersion: 1,
    id: 'p2-indirect',
    part: 2,
    difficulty: 'intermediate',
    prompt: 'Choose the best response to the question you hear.',
    media: {
      audio: { kind: 'synthetic', transcript: 'Who should I contact to change my reservation?' },
    },
    options: [
      {
        id: 'A',
        text: 'The number for the booking desk is on your confirmation email.',
        reasoning: 'Gián tiếp chỉ đúng nơi liên hệ để đổi đặt chỗ.',
      },
      {
        id: 'B',
        text: 'For three nights, please.',
        reasoning: 'Nêu độ dài lưu trú, không chỉ người hoặc bộ phận cần liên hệ.',
      },
      {
        id: 'C',
        text: 'I changed trains downtown.',
        reasoning: 'Lặp ý change nhưng nói về đổi tàu, sai ngữ cảnh đặt chỗ.',
      },
    ],
    answer: 'A',
    explanation:
      'Câu trả lời có thể gián tiếp: cung cấp số của bộ phận đặt chỗ chính là hướng dẫn liên hệ phù hợp. Không bắt buộc phải nêu tên một người.',
    takeaway: 'Câu đáp đúng có thể cung cấp bước tiếp theo thay vì lặp từ hỏi.',
    skills: ['listening-intent', 'listening-detail'],
    grammarIds: [],
    vocabularyIds: ['reservation', 'confirm'],
  },
  {
    schemaVersion: 1,
    id: 'p7-entrance',
    part: 7,
    difficulty: 'foundation',
    passageId: 'library-notice',
    groupId: 'library',
    prompt: 'Why is the library’s main entrance closed?',
    options: [
      {
        id: 'A',
        text: 'The library is moving to Oak Street.',
        reasoning: 'Oak Street là vị trí lối vào tạm, không phải nơi thư viện chuyển đến.',
      },
      {
        id: 'B',
        text: 'The opening hours are being reduced.',
        reasoning: 'Thông báo nói thư viện vẫn mở theo giờ thông thường.',
      },
      {
        id: 'C',
        text: 'Renovation work is taking place.',
        reasoning: 'Đoạn đầu nêu rõ main entrance … closed for renovation.',
      },
      {
        id: 'D',
        text: 'The service desk is being relocated.',
        reasoning: 'Không có thông tin di dời quầy dịch vụ.',
      },
    ],
    answer: 'C',
    explanation:
      'Câu “the main entrance will be closed for renovation” nêu nguyên nhân trực tiếp. Oak Street chỉ hướng dẫn sử dụng lối vào khác.',
    takeaway: 'Tìm câu bằng chứng và phân biệt nguyên nhân với thông tin chỉ dẫn.',
    skills: ['reading-detail'],
    grammarIds: [],
    vocabularyIds: ['renovation', 'available'],
  },
  {
    schemaVersion: 1,
    id: 'p7-return',
    part: 7,
    difficulty: 'foundation',
    passageId: 'library-notice',
    groupId: 'library',
    prompt: 'Where can readers return books during the renovation?',
    options: [
      {
        id: 'A',
        text: 'In the box beside the main entrance.',
        reasoning: 'Hộp trả sách cạnh lối vào chính tạm ngưng sử dụng.',
      },
      {
        id: 'B',
        text: 'At the service desk.',
        reasoning: 'Thông báo viết Readers may return books at the service desk.',
      },
      {
        id: 'C',
        text: 'At a branch on Oak Street.',
        reasoning: 'Oak Street là lối vào vườn; không có chi nhánh nào được nhắc tới.',
      },
      {
        id: 'D',
        text: 'At the station.',
        reasoning: 'Thông báo không nhắc nhà ga hoặc điểm trả sách tại đó.',
      },
    ],
    answer: 'B',
    explanation:
      'Người đọc có thể trả sách tại service desk. Renew online là gia hạn trực tuyến, không phải trả sách trực tuyến.',
    takeaway: 'Phân biệt return (trả) và renew (gia hạn).',
    skills: ['reading-detail'],
    grammarIds: [],
    vocabularyIds: ['renovation'],
  },
  {
    schemaVersion: 1,
    id: 'p7-fees',
    part: 7,
    difficulty: 'intermediate',
    passageId: 'library-notice',
    groupId: 'library',
    prompt: 'What is indicated about books due on June 10?',
    options: [
      {
        id: 'A',
        text: 'They must be purchased by the reader.',
        reasoning: 'Không có yêu cầu mua sách trong thông báo.',
      },
      {
        id: 'B',
        text: 'They can only be returned after June 14.',
        reasoning: 'Có thể trả sách tại quầy trong suốt thời gian cải tạo.',
      },
      {
        id: 'C',
        text: 'They must be returned through the outdoor box.',
        reasoning: 'Hộp trả sách ngoài lối vào chính không dùng được.',
      },
      {
        id: 'D',
        text: 'They will not incur a late fee during the stated period.',
        reasoning:
          'June 10 nằm trong June 3–14, và sách đến hạn trong giai đoạn này không bị tính phí trễ.',
      },
    ],
    answer: 'D',
    explanation:
      'Thông báo miễn phí trễ cho sách đến hạn trong giai đoạn June 3–14. June 10 nằm trong khoảng đó.',
    takeaway: 'Kết hợp điều kiện ngày tháng với chính sách được nêu.',
    skills: ['reading-inference'],
    grammarIds: [],
    vocabularyIds: ['purchase'],
  },
  {
    schemaVersion: 1,
    id: 'p7-venue',
    part: 7,
    difficulty: 'foundation',
    passageId: 'workshop-email',
    groupId: 'workshop',
    prompt: 'Why was the workshop moved to the conference hall?',
    options: [
      {
        id: 'A',
        text: 'More people registered than expected.',
        reasoning: 'Email nêu rõ Because more employees registered than expected.',
      },
      {
        id: 'B',
        text: 'Room 204 was being renovated.',
        reasoning: 'Không có thông tin sửa phòng 204 trong email này.',
      },
      {
        id: 'C',
        text: 'The video equipment was unavailable.',
        reasoning: 'Email vẫn cung cấp video link, không nói thiết bị hỏng hoặc thiếu.',
      },
      {
        id: 'D',
        text: 'The workshop was extended to a full day.',
        reasoning: 'Thời gian vẫn là 9 a.m. đến noon, không phải cả ngày.',
      },
    ],
    answer: 'A',
    explanation:
      'Số nhân viên đăng ký cao hơn dự kiến là lý do đổi địa điểm. Không có thông tin cho thấy phòng cũ đang sửa chữa.',
    takeaway: 'Đọc bằng chứng trong đúng văn bản, tránh mang thông tin từ bài khác sang.',
    skills: ['reading-detail'],
    grammarIds: ['connectors'],
    vocabularyIds: ['workshop', 'register', 'venue', 'employee'],
  },
  {
    schemaVersion: 1,
    id: 'p7-bring',
    part: 7,
    difficulty: 'foundation',
    passageId: 'workshop-email',
    groupId: 'workshop',
    prompt: 'What are participants asked to bring?',
    options: [
      { id: 'A', text: 'Printed training materials.', reasoning: 'Tài liệu in sẽ được cung cấp.' },
      {
        id: 'B',
        text: 'Light refreshments.',
        reasoning: 'Đồ ăn nhẹ sẽ được cung cấp, không yêu cầu người học mang.',
      },
      { id: 'C', text: 'A laptop.', reasoning: 'Email yêu cầu trực tiếp Please bring a laptop.' },
      { id: 'D', text: 'A printed invoice.', reasoning: 'Email không đề cập hóa đơn.' },
    ],
    answer: 'C',
    explanation:
      'Please bring a laptop là yêu cầu trực tiếp. Tài liệu và đồ ăn nhẹ thuộc phần ban tổ chức cung cấp.',
    takeaway: 'Phân biệt thứ cần mang và thứ được cung cấp.',
    skills: ['reading-detail'],
    grammarIds: [],
    vocabularyIds: ['workshop', 'invoice'],
  },
  {
    schemaVersion: 1,
    id: 'p7-optional',
    part: 7,
    difficulty: 'intermediate',
    passageId: 'workshop-email',
    groupId: 'workshop',
    prompt: 'What can be concluded about employees at branch offices?',
    options: [
      {
        id: 'A',
        text: 'They must travel to the main office.',
        reasoning:
          'Email cho phép tham gia qua video link, nên không bắt buộc đi tới văn phòng chính.',
      },
      {
        id: 'B',
        text: 'They can participate remotely.',
        reasoning: 'Join through the video link cho phép suy ra có thể tham gia từ xa.',
      },
      {
        id: 'C',
        text: 'They are not allowed to register.',
        reasoning: 'Email không loại trừ nhân viên chi nhánh; có hướng dẫn riêng để họ tham gia.',
      },
      {
        id: 'D',
        text: 'They must pay for printed materials.',
        reasoning: 'Không có khoản phí tài liệu nào được nêu.',
      },
    ],
    answer: 'B',
    explanation:
      'Video link trong email xác nhận cho phép nhân viên chi nhánh tham gia từ xa. Không cần suy đoán thêm về chi phí hay nghĩa vụ tham gia.',
    takeaway: 'Suy luận ở mức bằng chứng hỗ trợ, không thêm giả định.',
    skills: ['reading-inference'],
    grammarIds: [],
    vocabularyIds: ['employee', 'confirm', 'register'],
  },
]
export const starterQuestions: Question[] = [
  ...legacyQuestions.map((q) => ({
    ...q,
    provenance:
      q.id === 'p5-conditionals'
        ? { ...ORIGINAL_PROVENANCE, revision: '2026-10-task08' }
        : ORIGINAL_PROVENANCE,
    topic: q.part === 5 ? ('grammar' as const) : ('office' as const),
    stimulusId: q.part === 2 ? `audio:${q.id}` : q.passageId ? `passage:${q.passageId}` : undefined,
  })),
  ...additionalQuestions,
]
/** Practice and reserved mock items are distinct inventories; all are addressable by stable ID. */
export const practiceQuestions: Question[] = [
  ...starterQuestions,
  ...installedPackages.filter((p) => p.purpose !== 'mock').flatMap((p) => p.bank.questions),
]
export const mockQuestions: Question[] = installedPackages
  .filter((p) => p.purpose === 'mock')
  .flatMap((p) => p.bank.questions)
export const questions: Question[] = [...practiceQuestions, ...mockQuestions]
export const allQuestions = [...questions, ...transferQuestions]
export const questionById = new Map(allQuestions.map((q) => [q.id, q]))
export const stimuli: Stimulus[] = [
  ...questions
    .filter((q) => q.part === 2 && q.media?.audio)
    .map((q) => ({
      id: `audio:${q.id}`,
      title: 'Question–Response',
      kind: 'question-response' as const,
      part: 2 as const,
      topic: q.topic,
      provenance: q.provenance,
      audio: { kind: 'synthetic' as const, transcript: q.media!.audio!.transcript },
    })),
  ...legacyPassages.map((p) => ({
    id: `passage:${p.id}`,
    title: p.title,
    kind: 'reading' as const,
    part: 7 as const,
    topic: 'office' as const,
    provenance: ORIGINAL_PROVENANCE,
    passageIds: [p.id],
  })),
  ...additionalStimuli,
  ...installedPackages.flatMap((p) => p.bank.stimuli),
]
export const stimulusById = new Map(stimuli.map((s) => [s.id, s]))
export function stimulusFor(question: Question) {
  const id =
    question.stimulusId ??
    (question.part === 2
      ? `audio:${question.id}`
      : question.passageId
        ? `passage:${question.passageId}`
        : undefined)
  return id ? stimulusById.get(id) : undefined
}
export const PART_LABELS = {
  1: 'Photographs',
  2: 'Question–Response',
  3: 'Conversations',
  4: 'Talks',
  5: 'Incomplete Sentences',
  6: 'Text Completion',
  7: 'Reading Comprehension',
}
export const DIFFICULTY_LABELS = {
  foundation: 'Nền tảng',
  intermediate: 'Vận dụng',
  advanced: 'Nâng cao',
}
