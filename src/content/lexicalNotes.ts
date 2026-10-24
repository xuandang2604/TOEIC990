import type { VocabularyBase, VocabularyEntry } from './schema'

export const referenceProvenance = {
  kind: 'original' as const,
  author: 'STUDY 990',
  revision: '2026-10-task03',
  note: 'Nội dung học tập tự biên soạn; nghĩa chọn lọc theo ngữ cảnh công việc, không phải từ điển toàn diện.',
}

export interface LexicalNotes {
  forms: string[]
  usageNote: string
  grammarIds: string[]
  britishIpa?: string
  synonyms?: string[]
  antonyms?: string[]
  pronunciationText?: string
}
export function enrichVocabulary(
  base: VocabularyBase,
  input: LexicalNotes | undefined,
): VocabularyEntry {
  // Missing editorial metadata becomes a validator issue, rather than a module-load crash.
  const notes = input ?? { forms: [], usageNote: '', grammarIds: [] }
  return {
    ...base,
    forms: notes.forms,
    usageNote: notes.usageNote,
    grammarIds: notes.grammarIds,
    synonyms: notes.synonyms,
    antonyms: notes.antonyms,
    pronunciationText: notes.pronunciationText,
    pronunciations: [
      { locale: 'en-US', ipa: base.ipa },
      ...(notes.britishIpa ? [{ locale: 'en-GB' as const, ipa: notes.britishIpa }] : []),
    ],
    provenance: referenceProvenance,
  }
}

/** Inflections are explicit. A family member is not automatically a synonym or a lookup alias. */
export const starterNotes: Record<string, LexicalNotes> = {
  approve: {
    forms: ['approves', 'approved', 'approving'],
    usageNote:
      'Approve a budget là phê duyệt ngân sách; approve of a decision là tán thành quyết định. Chú ý giới từ khi đổi nghĩa.',
    grammarIds: ['verb-patterns'],
    britishIpa: '/əˈpruːv/',
  },
  appointment: {
    forms: ['appointments'],
    usageNote:
      'Make an appointment là đặt lịch hẹn; không dùng do an appointment. Appointment còn có nghĩa sự bổ nhiệm, khác nghĩa đang học ở đây.',
    grammarIds: ['word-forms'],
  },
  available: {
    forms: [],
    usageNote:
      'Available for a meeting: có thể tham dự; available to customers: khách hàng có thể dùng. Không dùng available như động từ.',
    grammarIds: ['word-forms', 'prepositions'],
    antonyms: ['unavailable'],
  },
  budget: {
    forms: ['budgets'],
    usageNote:
      'Within budget là trong phạm vi ngân sách; on a tight budget là có ngân sách hạn chế. Budget cũng có thể là động từ.',
    grammarIds: ['prepositions'],
    britishIpa: '/ˈbʌdʒɪt/',
  },
  candidate: {
    forms: ['candidates'],
    usageNote:
      'Candidate for a position là ứng viên cho vị trí; một candidate chưa nhất thiết đã là employee.',
    grammarIds: ['word-forms', 'prepositions'],
  },
  confirm: {
    forms: ['confirms', 'confirmed', 'confirming'],
    usageNote:
      'Confirm a booking hoặc confirm that + mệnh đề. Confirmation là danh từ, không điền vào vị trí động từ.',
    grammarIds: ['word-forms', 'tenses'],
  },
  deadline: {
    forms: ['deadlines'],
    usageNote:
      'By the deadline nghĩa là không muộn hơn hạn chót. Until mô tả một trạng thái kéo dài, không thay by khi nói hạn nộp.',
    grammarIds: ['prepositions'],
    britishIpa: '/ˈdedlaɪn/',
  },
  delivery: {
    forms: ['deliveries'],
    usageNote:
      'Delivery nói về việc giao hàng; shipment thường chỉ lô hàng được gửi. Delivery date là ngày giao, không nhất thiết là ngày xuất kho.',
    grammarIds: ['word-forms'],
  },
  despite: {
    forms: [],
    usageNote:
      'Despite + cụm danh từ/V-ing; không có of. Although cần mệnh đề, nên không đổi hai từ mà giữ nguyên phần sau.',
    grammarIds: ['connectors', 'prepositions'],
  },
  efficient: {
    forms: ['more efficient', 'most efficient'],
    usageNote:
      'Efficient nhấn mạnh ít lãng phí; effective nhấn mạnh đạt kết quả. Sau work thường cần efficiently để diễn tả cách làm.',
    grammarIds: ['word-forms', 'comparisons'],
    antonyms: ['inefficient'],
  },
  employee: {
    forms: ['employees'],
    usageNote:
      'Employee nhận lương từ employer. Mỗi employee là một người; employment nói về việc làm nói chung.',
    grammarIds: ['agreement', 'word-forms'],
  },
  equipment: {
    forms: [],
    usageNote:
      'Equipment không đếm được: some equipment, a piece of equipment. Không dùng an equipment hoặc equipments trong nghĩa thiết bị chung.',
    grammarIds: ['agreement', 'word-forms'],
  },
  estimate: {
    forms: ['estimates'],
    usageNote:
      'Danh từ estimate có âm cuối /mət/; động từ có /meɪt/. Bản dự toán chưa phải invoice yêu cầu thanh toán.',
    grammarIds: ['word-forms'],
    pronunciationText: 'an estimate',
  },
  expand: {
    forms: ['expands', 'expanded', 'expanding'],
    usageNote:
      'Expand operations là mở rộng hoạt động; expand into a market là tiến vào thị trường mới. Expansion là danh từ.',
    grammarIds: ['word-forms', 'verb-patterns'],
  },
  invoice: {
    forms: ['invoices'],
    usageNote:
      'Invoice ghi số tiền cần thanh toán; receipt xác nhận đã nhận tiền. Không suy ra đã thanh toán chỉ vì có invoice.',
    grammarIds: ['word-forms'],
  },
  maintenance: {
    forms: [],
    usageNote:
      'Maintenance thường không đếm được trong nghĩa bảo trì; động từ là maintain. Closed for maintenance là đóng để bảo trì.',
    grammarIds: ['word-forms', 'prepositions'],
  },
  mandatory: {
    forms: [],
    usageNote:
      'Mandatory có nghĩa bắt buộc theo quy định; optional là tùy chọn. Mandatory training không chỉ là khóa học được khuyến nghị.',
    grammarIds: ['word-forms', 'modals'],
    synonyms: ['compulsory'],
    antonyms: ['optional'],
  },
  notify: {
    forms: ['notifies', 'notified', 'notifying'],
    usageNote:
      'Notify someone of/about something hoặc notify someone that + mệnh đề. Người nhận đứng ngay sau notify.',
    grammarIds: ['verb-patterns', 'prepositions'],
  },
  postpone: {
    forms: ['postpones', 'postponed', 'postponing'],
    usageNote:
      'Postpone + danh từ/V-ing, không phải postpone to V. Postpone vẫn dự định làm sau; cancel hủy sự kiện.',
    grammarIds: ['verb-patterns'],
  },
  proposal: {
    forms: ['proposals'],
    usageNote:
      'Submit a proposal là trình đề xuất; approval mới là sự chấp thuận. Một proposal được gửi chưa đồng nghĩa được duyệt.',
    grammarIds: ['word-forms', 'passive'],
  },
  purchase: {
    forms: ['purchases', 'purchased', 'purchasing'],
    usageNote:
      'Purchase vừa là động từ vừa là danh từ. Proof of purchase là bằng chứng mua hàng, thường dùng trong chính sách hoàn tiền.',
    grammarIds: ['word-forms', 'prepositions'],
    synonyms: ['buy (verb)'],
  },
  receipt: {
    forms: ['receipts'],
    usageNote:
      'Chữ p trong receipt không phát âm. Giữ receipt sau thanh toán; invoice có thể được gửi trước khi trả tiền.',
    grammarIds: ['word-forms'],
  },
  recommend: {
    forms: ['recommends', 'recommended', 'recommending'],
    usageNote:
      'Recommend doing hoặc recommend that S + V nguyên mẫu. Tránh recommend someone to do trong cấu trúc khuyên ai làm đang học ở đây.',
    grammarIds: ['verb-patterns', 'subjunctive'],
  },
  refund: {
    forms: ['refunds'],
    usageNote:
      'Danh từ nhấn âm đầu /ˈriːfʌnd/; động từ nhấn âm sau /rɪˈfʌnd/. Refundable nghĩa là có thể hoàn tiền, không phải đã hoàn.',
    grammarIds: ['word-forms', 'modals'],
    pronunciationText: 'a refund',
  },
  register: {
    forms: ['registers', 'registered', 'registering'],
    usageNote:
      'Register for a course: đăng ký khóa học; register with an organization: đăng ký với tổ chức. Registration là danh từ.',
    grammarIds: ['prepositions', 'word-forms'],
  },
  reliable: {
    forms: ['more reliable', 'most reliable'],
    usageNote:
      'Reliable mô tả người/vật đáng tin cậy. Reliably là trạng từ, reliability là danh từ; chọn theo vị trí trong câu.',
    grammarIds: ['word-forms', 'comparisons'],
    antonyms: ['unreliable'],
  },
  renovation: {
    forms: ['renovations'],
    usageNote:
      'Under renovation là đang được cải tạo. Renovation thường cải thiện tòa nhà; maintenance duy trì tình trạng hoạt động.',
    grammarIds: ['prepositions', 'passive'],
  },
  require: {
    forms: ['requires', 'required', 'requiring'],
    usageNote:
      'Require someone to do; be required to do. Không nhầm requirement là động từ chỉ vì cùng gốc.',
    grammarIds: ['passive', 'verb-patterns', 'subjunctive'],
  },
  reservation: {
    forms: ['reservations'],
    usageNote:
      'Make a reservation là đặt chỗ; confirm a reservation là xác nhận chỗ đã đặt. Reserve có thể là động từ tương ứng.',
    grammarIds: ['word-forms'],
  },
  schedule: {
    forms: ['schedules', 'scheduled', 'scheduling'],
    usageNote:
      'Be scheduled for + thời gian, be scheduled to + V. Ahead of schedule là sớm hơn kế hoạch; on schedule là đúng tiến độ.',
    grammarIds: ['passive', 'prepositions'],
    britishIpa: '/ˈʃedjuːl/',
  },
  shipment: {
    forms: ['shipments'],
    usageNote:
      'Track a shipment là theo dõi lô hàng; shipping là hoạt động vận chuyển. Shipment dispatched chưa có nghĩa người mua đã nhận.',
    grammarIds: ['word-forms', 'passive'],
  },
  submit: {
    forms: ['submits', 'submitted', 'submitting'],
    usageNote:
      'Gấp đôi t trong submitted/submitting. Submit a report to someone; submit by Friday nghĩa là nộp muộn nhất thứ Sáu.',
    grammarIds: ['tenses', 'prepositions'],
  },
  supplier: {
    forms: ['suppliers'],
    usageNote:
      'Supplier cung cấp hàng/dịch vụ; customer mua hoặc sử dụng. Supply là động từ/danh từ, không chỉ người cung cấp.',
    grammarIds: ['relatives', 'word-forms'],
  },
  unless: {
    forms: [],
    usageNote:
      'Unless ≈ if not trong điều kiện thích hợp. Không thêm not máy móc vì có thể đảo nghĩa điều kiện.',
    grammarIds: ['conditionals', 'connectors'],
  },
  venue: {
    forms: ['venues'],
    usageNote:
      'Venue là nơi tổ chức sự kiện; event là chính sự kiện. The venue for a workshop là địa điểm của buổi học.',
    grammarIds: ['prepositions', 'relatives'],
  },
  workshop: {
    forms: ['workshops'],
    usageNote:
      'Attend a workshop là tham dự; conduct a workshop là tổ chức/hướng dẫn. Trong ngữ cảnh khác workshop còn là xưởng.',
    grammarIds: ['word-forms', 'tenses'],
  },
}
