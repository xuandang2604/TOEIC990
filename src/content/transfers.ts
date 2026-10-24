import {
  ORIGINAL_PROVENANCE,
  type Question,
  type LegacyQuestion,
  type QuestionOption,
} from './schema'
import { tutorTransferQuestions } from './tutorTransfers'

function options(items: [string, string][]): QuestionOption[] {
  return items.map(([text, reasoning], index) => ({
    id: (['A', 'B', 'C', 'D'] as const)[index],
    text,
    reasoning,
  }))
}
// Separate transfer items are not included in the ordinary daily question pool.
const drafts: LegacyQuestion[] = [
  {
    schemaVersion: 1,
    id: 'transfer-agreement',
    part: 5,
    difficulty: 'foundation',
    prompt: 'The list of available meeting rooms ------- on the reception desk.',
    options: options([
      ['are', 'Are đi với chủ ngữ số nhiều, nhưng danh từ trung tâm list là số ít.'],
      ['is', 'List là số ít, nên dùng is; of available meeting rooms chỉ bổ nghĩa cho list.'],
      ['be', 'Be nguyên mẫu không thể đứng độc lập làm vị ngữ ở đây.'],
      ['were', 'Were không hòa hợp với list số ít.'],
    ]),
    answer: 'B',
    explanation:
      'Chủ ngữ trung tâm là the list. Bỏ cụm of available meeting rooms, ta có The list is on the reception desk.',
    takeaway: 'Tìm danh từ trung tâm thay vì danh từ gần động từ nhất.',
    skills: ['agreement'],
    grammarIds: ['agreement'],
    vocabularyIds: ['available'],
  },
  {
    schemaVersion: 1,
    id: 'transfer-tenses',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'Our supplier ------- three shipments so far this month.',
    options: options([
      [
        'delivers',
        'Hiện tại đơn nói về thói quen, không diễn tả số chuyến đã giao đến thời điểm hiện tại.',
      ],
      ['delivering', 'Delivering thiếu trợ động từ để làm vị ngữ.'],
      ['will deliver', 'So far nói về thời gian tính đến nay, không phải việc sẽ diễn ra.'],
      [
        'has delivered',
        'Hiện tại hoàn thành diễn tả kết quả tính đến hiện tại, phù hợp với so far this month.',
      ],
    ]),
    answer: 'D',
    explanation:
      'So far this month nêu khoảng thời gian từ đầu tháng đến nay. Has delivered diễn tả ba lô hàng đã được giao trong khoảng đó.',
    takeaway: 'Xác định khoảng thời gian còn tiếp diễn đến hiện tại.',
    skills: ['tenses'],
    grammarIds: ['tenses'],
    vocabularyIds: ['supplier', 'shipment', 'delivery'],
  },
  {
    schemaVersion: 1,
    id: 'transfer-passive',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'All visitors should ------- of the temporary entrance change before they arrive.',
    options: options([
      ['be notified', 'Khách là người nhận thông báo: should be + V3.'],
      [
        'notify',
        'Khách không phải người chủ động thông báo trong cấu trúc notify someone of something.',
      ],
      ['notified', 'Thiếu be sau should để tạo bị động.'],
      ['be notifying', 'Đây là dạng chủ động tiếp diễn, không diễn tả việc khách được thông báo.'],
    ]),
    answer: 'A',
    explanation:
      'Visitors nhận hành động notify. Cấu trúc should be notified of nghĩa là nên được thông báo về điều gì.',
    takeaway: 'Nhận hành động: modal + be + V3.',
    skills: ['passive'],
    grammarIds: ['passive'],
    vocabularyIds: ['notify'],
  },
  {
    schemaVersion: 1,
    id: 'transfer-gerund',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'We look forward to ------- you at the training workshop.',
    options: options([
      ['meet', 'To trong look forward to là giới từ; không theo sau bởi động từ nguyên mẫu.'],
      ['met', 'Met không phải danh động từ cần có sau giới từ to.'],
      ['meeting', 'Giới từ to trong cụm look forward to theo sau bởi V-ing.'],
      ['be met', 'Cụm này không đúng cấu trúc sau giới từ và không đúng nghĩa chủ động gặp bạn.'],
    ]),
    answer: 'C',
    explanation:
      'Look forward to + V-ing. To ở đây là giới từ, nên dùng meeting chứ không phải meet.',
    takeaway: 'Không phải mọi to đều đi với động từ nguyên mẫu.',
    skills: ['verb-patterns'],
    grammarIds: ['verb-patterns'],
    vocabularyIds: ['workshop'],
  },
  {
    schemaVersion: 1,
    id: 'transfer-connectors',
    part: 5,
    difficulty: 'intermediate',
    prompt: '------- the venue was small, it accommodated all registered participants.',
    options: options([
      [
        'Despite',
        'Sau despite cần cụm danh từ hoặc V-ing, không phải mệnh đề the venue was small.',
      ],
      ['Although', 'Although mở đầu mệnh đề đầy đủ và thể hiện sự nhượng bộ.'],
      ['Because of', 'Because of cần cụm danh từ; nghĩa nguyên nhân cũng không phù hợp ở đây.'],
      ['In spite of', 'In spite of không đi trực tiếp với mệnh đề đầy đủ.'],
    ]),
    answer: 'B',
    explanation:
      'The venue was small có chủ ngữ và động từ. Although nối mệnh đề nhượng bộ với kết quả vẫn đủ chỗ cho mọi người.',
    takeaway: 'Nhượng bộ + mệnh đề: although; + cụm danh từ: despite.',
    skills: ['connectors'],
    grammarIds: ['connectors'],
    vocabularyIds: ['venue', 'register', 'despite'],
  },
  {
    schemaVersion: 1,
    id: 'transfer-conditionals',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'Unless the customer ------- the reservation by noon, the room will be released.',
    options: options([
      ['will confirm', 'Unless tương đương if not; mệnh đề điều kiện loại 1 dùng hiện tại đơn.'],
      ['confirming', 'Confirming thiếu động từ hữu hạn cho mệnh đề.'],
      [
        'had confirmed',
        'Quá khứ hoàn thành không phù hợp với điều kiện tương lai will be released.',
      ],
      [
        'confirms',
        'Hiện tại đơn sau unless diễn tả điều kiện tương lai; customer số ít nên thêm -s.',
      ],
    ]),
    answer: 'D',
    explanation:
      'Unless the customer confirms … nghĩa là nếu khách không xác nhận … Trong mệnh đề điều kiện loại 1 dùng hiện tại đơn.',
    takeaway: 'Unless = if … not; dùng hiện tại đơn cho điều kiện tương lai.',
    skills: ['conditionals'],
    grammarIds: ['conditionals'],
    vocabularyIds: ['unless', 'confirm', 'reservation'],
  },
  {
    schemaVersion: 1,
    id: 'transfer-relative',
    part: 5,
    difficulty: 'intermediate',
    prompt: 'The candidate ------- application arrived first will be interviewed on Monday.',
    options: options([
      ['whose', 'Whose application diễn tả hồ sơ thuộc về ứng viên.'],
      ['who', 'Who không diễn tả sở hữu trước danh từ application.'],
      ['whom', 'Whom làm tân ngữ, không thể đứng trước application để chỉ sở hữu.'],
      ['which', 'Which không biểu thị quan hệ sở hữu giữa candidate và application.'],
    ]),
    answer: 'A',
    explanation:
      'Application là hồ sơ của candidate. Ta cần whose + danh từ để diễn tả quan hệ sở hữu.',
    takeaway: 'Whose + danh từ: danh từ đó thuộc về đối tượng đứng trước.',
    skills: ['relative-clauses'],
    grammarIds: ['relatives'],
    vocabularyIds: ['candidate'],
  },
  {
    schemaVersion: 1,
    id: 'transfer-subjunctive',
    part: 5,
    difficulty: 'advanced',
    prompt: 'It is essential that the equipment ------- inspected before use.',
    options: options([
      ['to be', 'To be không đứng trực tiếp sau chủ ngữ trong mệnh đề that ở đây.'],
      ['been', 'Been là phân từ quá khứ, không thể đứng độc lập ở vị trí này.'],
      ['be', 'Be nguyên mẫu tạo dạng giả định bị động be inspected.'],
      ['being', 'Being không thể làm động từ hữu hạn cho mệnh đề that ở đây.'],
    ]),
    answer: 'C',
    explanation:
      'It is essential that + chủ ngữ + V nguyên mẫu. Với bị động, ta dùng be inspected.',
    takeaway: 'Thức giả định bị động: that + chủ ngữ + be + V3.',
    skills: ['subjunctive'],
    grammarIds: ['subjunctive'],
    vocabularyIds: ['equipment'],
  },
]
export const transferQuestions: Question[] = [
  ...drafts.map((q) => ({
    ...q,
    provenance: ORIGINAL_PROVENANCE,
    topic: 'grammar' as const,
  })),
  ...tutorTransferQuestions,
]
