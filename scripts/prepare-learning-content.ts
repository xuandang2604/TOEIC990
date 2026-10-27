import { readFile, writeFile } from 'node:fs/promises'
import { contentBank } from '../src/content/catalog'
import { validateContentPackage, type ContentPackage } from '../src/content/ingestion'
import { draftEditorial, advanceEditorial, packageFingerprint } from '../src/content/editorial'
import { findNearDuplicates } from '../src/content/similarity'
import type { Question, QuestionOption, Stimulus, Passage, Skill } from '../src/content/schema'

/** Authored source batch, never a generator of interchangeable stems or an activation script. */
const id = 'learning-path-2026',
  revision = '2026-10-27-r1'
const key = (name: string) => `${id}:${name}`
const provenance = {
  kind: 'original' as const,
  author: 'STUDY 990 · AI-assisted authoring',
  revision,
  editorialStatus: 'ai-draft' as const,
  note: 'Tình huống và lời giải gốc. Chưa thẩm định thủ công; không phải đề ETS.',
}
const options = (rows: [string, string][]): QuestionOption[] =>
  rows.map(([text, reasoning], i) => ({ id: (['A', 'B', 'C', 'D'] as const)[i], text, reasoning }))
const questions: Question[] = [],
  stimuli: Stimulus[] = [],
  passages: Passage[] = []
function q(
  name: string,
  fields: Omit<Question, 'id' | 'schemaVersion' | 'provenance' | 'grammarIds' | 'vocabularyIds'> &
    Partial<Pick<Question, 'grammarIds' | 'vocabularyIds'>>,
) {
  questions.push({
    schemaVersion: 1,
    id: key(name),
    provenance,
    grammarIds: [],
    vocabularyIds: [],
    ...fields,
  })
}
const adaptations: Record<
  string,
  {
    explanation: string
    takeaway: string
    reasons: [string, string, string]
    skills: Skill[]
    vocabularyIds: string[]
    topic: Question['topic']
    difficulty: Question['difficulty']
  }
> = {
  'P2-088': {
    explanation:
      'Why chưa tới hỏi nguyên nhân. Đường cao tốc đóng để sửa chữa giải thích trực tiếp việc người chuyển phát bị chậm.',
    takeaway: 'Nghe loại thông tin được hỏi trước khi đối chiếu từ khóa.',
    reasons: [
      'At the reception desk chỉ nơi chốn, không giải thích chậm trễ.',
      'Two large envelopes nói số lượng bưu phẩm.',
      'Đường đóng giải thích vì sao người giao chưa đến.',
    ],
    skills: ['listening-detail'],
    vocabularyIds: ['delivery', 'repair'],
    topic: 'office',
    difficulty: 'foundation',
  },
  'P2-089': {
    explanation:
      'Where should I store hỏi chỗ cất bộ lọc thay thế. Kệ cạnh văn phòng bảo trì là vị trí cụ thể.',
    takeaway: 'Phân biệt nơi cất với thời gian thay thiết bị.',
    reasons: [
      'On the shelf… trả lời đúng địa điểm.',
      'Yesterday cho thời gian thay, không phải nơi cất.',
      'Thiết bị chạy êm hơn là kết quả, không phải địa điểm.',
    ],
    skills: ['listening-detail'],
    vocabularyIds: ['maintenance', 'equipment'],
    topic: 'facilities',
    difficulty: 'foundation',
  },
  'P2-090': {
    explanation:
      'Could you send… là yêu cầu gửi sơ đồ chỗ ngồi. Người đáp đồng ý thực hiện bằng cách đính kèm email ngay.',
    takeaway: 'Could you + động từ thường là lời nhờ, không hỏi khả năng theo nghĩa đen.',
    reasons: [
      'Sức chứa của hội trường không trả lời việc gửi sơ đồ.',
      'Đính kèm vào email là hành động đáp ứng yêu cầu.',
      'Giờ bắt đầu không liên quan đến việc gửi tài liệu.',
    ],
    skills: ['listening-intent'],
    vocabularyIds: ['request', 'conference'],
    topic: 'office',
    difficulty: 'foundation',
  },
  'P2-091': {
    explanation:
      'Người hỏi đang xác nhận bảo hành còn hiệu lực. No, it expired last month sửa lại giả định đó: bảo hành đã hết tháng trước.',
    takeaway: 'Với câu hỏi phủ định, hiểu mệnh đề theo sau yes/no để xác định thực trạng.',
    reasons: [
      'Copies lặp âm copier nhưng nói vị trí bản sao.',
      'Sửa máy quét không xác nhận thời hạn bảo hành máy photocopy.',
      'Expired last month cho biết bảo hành không còn hiệu lực.',
    ],
    skills: ['listening-intent'],
    vocabularyIds: ['warranty', 'repair'],
    topic: 'facilities',
    difficulty: 'intermediate',
  },
  'P2-092': {
    explanation:
      'How often hỏi chu kỳ hiệu chuẩn cân. Every six months nghĩa là sáu tháng một lần.',
    takeaway: 'How often hỏi tần suất; how long hỏi khoảng thời gian kéo dài.',
    reasons: [
      'Every six months đưa ra chu kỳ.',
      'By a technician nói người thực hiện.',
      'In the cabinet nói nơi cất.',
    ],
    skills: ['listening-detail'],
    vocabularyIds: ['equipment', 'maintenance'],
    topic: 'facilities',
    difficulty: 'foundation',
  },
  'P2-094': {
    explanation:
      'When hỏi thời điểm kiểm toán viên gặp nhóm tài chính. Right after lunch trả lời mốc thời gian.',
    takeaway: 'Không chọn một thông tin công sở hợp chủ đề nhưng sai loại thông tin.',
    reasons: [
      'Văn phòng giám đốc là địa điểm, không phải lúc gặp.',
      'Việc đã xem báo cáo không cho thời điểm cuộc gặp.',
      'Ngay sau bữa trưa trả lời đúng when.',
    ],
    skills: ['listening-detail'],
    vocabularyIds: ['appointment', 'schedule'],
    topic: 'office',
    difficulty: 'foundation',
  },
  'P2-095': {
    explanation:
      'Lối vào phía đông đóng trong đợt sửa chữa. Phản hồi dùng lối từ bãi xe là quyết định hợp lý từ thông tin vừa nghe.',
    takeaway: 'Một phát biểu có thể được đáp bằng hành động tiếp theo, không cần lặp lại nó.',
    reasons: [
      'Đổi sang lối bãi xe giải quyết việc lối đông bị đóng.',
      'Dự toán của nhà thầu không giải quyết nhu cầu đi vào.',
      'Giờ đóng thường ngày không xử lý việc đóng vì sửa chữa.',
    ],
    skills: ['listening-intent'],
    vocabularyIds: ['renovation', 'temporary'],
    topic: 'facilities',
    difficulty: 'intermediate',
  },
  'P2-097': {
    explanation:
      'Should we postpone…? đề nghị quyết định có hoãn hay không. Chờ phản hồi khách trước là câu trả lời trì hoãn quyết định một cách phù hợp.',
    takeaway: 'Câu trả lời gián tiếp vẫn đúng nếu giải quyết ý định giao tiếp.',
    reasons: [
      'Khả năng gia hạn giấy phép không quyết định lịch trình diễn.',
      'Việc từng trình diễn ở sảnh không trả lời đề nghị hoãn.',
      'Đợi khách phản hồi là bước cần làm trước khi quyết định hoãn.',
    ],
    skills: ['listening-intent'],
    vocabularyIds: ['postpone', 'customer'],
    topic: 'office',
    difficulty: 'advanced',
  },
  'P2-101': {
    explanation:
      'Why don’t we…? là lời đề xuất chuyển buổi đào tạo lên mạng. That would solve… đồng tình vì giải quyết thiếu phòng.',
    takeaway: 'Why don’t we khác câu hỏi Why thông thường: đây là đề nghị.',
    reasons: [
      'Giải quyết thiếu phòng là lý do ủng hộ phương án online.',
      'Vị trí sổ tay không phản hồi phương án chuyển buổi học.',
      'Because khiến câu có vẻ trả lời why nhưng bỏ qua chức năng đề xuất.',
    ],
    skills: ['listening-intent'],
    vocabularyIds: ['training', 'workshop'].filter((v) => contentBank.vocabularyIds.includes(v)),
    topic: 'training',
    difficulty: 'intermediate',
  },
  'P2-102': {
    explanation:
      'Câu hỏi kiểm tra hóa đơn đã gửi chưa. Chúng còn chờ chữ ký giám đốc ngụ ý chưa thể gửi, đồng thời nêu việc đang chờ.',
    takeaway: 'Tìm phản hồi về trạng thái hoàn thành, không chỉ từ invoice hay client.',
    reasons: [
      'Khách yêu cầu hóa đơn chi tiết không nói chúng đã gửi chưa.',
      'Còn chờ chữ ký cho biết công việc chưa hoàn tất.',
      'Gửi đại diện kinh doanh khác với gửi hóa đơn.',
    ],
    skills: ['listening-inference'],
    vocabularyIds: ['invoice', 'approve'],
    topic: 'office',
    difficulty: 'advanced',
  },
  'P2-104': {
    explanation:
      'Can I borrow…? xin mượn máy quét. As soon as I finish… cho phép mượn sau khi người nói kiểm kho xong.',
    takeaway: 'Mệnh đề thời gian có thể thay cho câu đồng ý trực tiếp.',
    reasons: [
      'Nêu điều kiện thời gian để người hỏi có thể mượn.',
      'Ngày in mã vạch không trả lời việc cho mượn máy.',
      'Thời gian thao tác ngắn không xác nhận có thể cho mượn.',
    ],
    skills: ['listening-intent'],
    vocabularyIds: ['equipment', 'request'],
    topic: 'shopping',
    difficulty: 'intermediate',
  },
  'P2-106': {
    explanation:
      'How many candidates hỏi số ứng viên đã xác nhận. Six have confirmed so far trả lời hiện đã có sáu người.',
    takeaway: 'Tách câu hỏi số lượng khỏi lịch hoặc địa điểm phỏng vấn.',
    reasons: [
      'Monday là ngày bắt đầu, không phải số ứng viên.',
      'Six đưa ra đúng số người đã xác nhận.',
      'Văn phòng nhân sự là nơi chốn, không phải số lượng.',
    ],
    skills: ['listening-detail'],
    vocabularyIds: ['candidate', 'confirm'],
    topic: 'office',
    difficulty: 'foundation',
  },
}

const booths = key('conversation-booths')
stimuli.push({
  id: booths,
  kind: 'conversation',
  part: 3,
  title: 'Private interview room',
  topic: 'office',
  provenance,
  audio: {
    kind: 'synthetic',
    transcript:
      'Member: I booked the open lounge for tomorrow’s interviews, but the candidates will be discussing confidential information. Can we move to an enclosed room?\nCoordinator: Certainly. You said there would be three people at a time, correct?\nMember: Yes, and we need the room from two until four.\nCoordinator: Look at the room list. Elm is occupied all afternoon. Pine is free during those hours and has enough seats.\nMember: That works. Does the reservation include a monitor?\nCoordinator: It does. I’ll email you an updated booking and the door access code.',
  },
  exhibit: {
    kind: 'table',
    title: 'Room list',
    columns: ['Room', 'Seats', 'Layout'],
    rows: [
      ['Elm', '4', 'Enclosed'],
      ['Pine', '6', 'Enclosed'],
      ['Lounge', '10', 'Open'],
      ['Oak', '2', 'Enclosed'],
    ],
  },
})
q('booths-purpose', {
  part: 3,
  topic: 'office',
  stimulusId: booths,
  prompt: 'Why does the member want to change the reservation?',
  difficulty: 'intermediate',
  skills: ['listening-main-idea'],
  vocabularyIds: ['reservation', 'candidate'],
  answer: 'C',
  options: options([
    [
      'More interviewers will attend.',
      'Ba người mỗi lượt vẫn là số đã nêu; không có tăng số người.',
    ],
    [
      'The lounge has no available seats.',
      'Vấn đề được nêu là thông tin mật, không phải thiếu ghế.',
    ],
    [
      'The interviews require a private setting.',
      'Confidential information giải thích yêu cầu phòng kín.',
    ],
    ['The interviews will finish later than planned.', 'Không có thay đổi giờ kết thúc.'],
  ]),
  explanation:
    'Người đặt nói các ứng viên sẽ trao đổi thông tin mật, nên xin đổi từ lounge mở sang phòng kín. Đây là nhu cầu riêng tư, không phải thay đổi số người hay giờ.',
  takeaway: 'Xác định nguyên nhân thay đổi trước khi nghe giải pháp.',
})
q('booths-exhibit', {
  part: 3,
  topic: 'office',
  stimulusId: booths,
  prompt: 'Look at the room list. Which room meets the needs and is available?',
  difficulty: 'intermediate',
  skills: ['visual-integration', 'listening-detail'],
  vocabularyIds: ['available', 'capacity'],
  answer: 'B',
  options: options([
    ['Elm', 'Đủ ghế và kín nhưng đã được đặt cả chiều.'],
    ['Pine', 'Kín, có sáu ghế và được xác nhận trống từ hai đến bốn giờ.'],
    ['Lounge', 'Có ghế nhưng không kín.'],
    ['Oak', 'Chỉ có hai ghế, không đủ ba người.'],
  ]),
  explanation:
    'Cần đồng thời phòng kín, ít nhất ba ghế và trống hai–bốn giờ. Elm bận, Oak thiếu ghế, Lounge mở; Pine đáp ứng cả ba điều kiện.',
  takeaway: 'Ghép bảng biểu với điều kiện nghe được; một điều kiện đúng chưa đủ.',
})
q('booths-next', {
  part: 3,
  topic: 'office',
  stimulusId: booths,
  prompt: 'What will the coordinator send to the member?',
  difficulty: 'foundation',
  skills: ['listening-detail'],
  vocabularyIds: ['confirm', 'reservation'],
  answer: 'D',
  options: options([
    ['A list of interview candidates', 'Danh sách ứng viên không được yêu cầu.'],
    ['A request to rent a monitor', 'Monitor đã nằm trong đặt phòng, không cần thuê thêm.'],
    ['A revised interview schedule', 'Giờ phỏng vấn không thay đổi.'],
    ['An updated booking and an access code', 'Câu cuối hứa gửi đặt phòng cập nhật và mã cửa.'],
  ]),
  explanation:
    'I’ll email you an updated booking and the door access code nêu hai thứ sẽ gửi. Monitor được bao gồm nhưng không phải tài liệu sẽ email.',
  takeaway: 'Nghe trọn cụm danh từ sau động từ hành động ở cuối hội thoại.',
})

const ferry = key('conversation-site-visit')
stimuli.push({
  id: ferry,
  kind: 'conversation',
  part: 3,
  title: 'Site visit transport',
  topic: 'travel',
  provenance,
  audio: {
    kind: 'synthetic',
    transcript:
      'Organizer: The ferry to the island office is suspended tomorrow because of high winds. We can still hold the site visit if we take the bridge bus.\nVisitor: Will that get us there before the equipment demonstration at ten?\nOrganizer: Yes. The bus leaves the station at eight forty and arrives at nine twenty. A colleague will meet us at the terminal.\nVisitor: All right. I’ve already bought a ferry ticket.\nOrganizer: Keep the receipt. The ferry company will refund cancelled services, but we need to apply through its website.\nVisitor: I’ll do that this evening.',
  },
})
q('visit-problem', {
  part: 3,
  topic: 'travel',
  stimulusId: ferry,
  prompt: 'What problem are the speakers discussing?',
  difficulty: 'foundation',
  skills: ['listening-main-idea'],
  vocabularyIds: ['cancel', 'journey'],
  answer: 'A',
  options: options([
    ['A ferry service has been suspended.', 'Câu mở đầu nói phà tạm ngừng vì gió lớn.'],
    ['The demonstration equipment is broken.', 'Buổi trình diễn vẫn diễn ra lúc mười giờ.'],
    ['The bridge is closed to buses.', 'Xe buýt qua cầu chính là phương án thay thế.'],
    ['The island office has relocated.', 'Không có thông tin văn phòng chuyển địa điểm.'],
  ]),
  explanation:
    'Vấn đề ban đầu là ferry suspended vì gió lớn; chuyến thăm vẫn có thể thực hiện nhờ xe buýt qua cầu.',
  takeaway: 'Phân biệt trở ngại ban đầu với giải pháp được nhắc ngay sau.',
})
q('visit-arrival', {
  part: 3,
  topic: 'travel',
  stimulusId: ferry,
  prompt: 'How long before the demonstration will the bus arrive?',
  difficulty: 'intermediate',
  skills: ['listening-detail'],
  vocabularyIds: ['arrange', 'schedule'],
  answer: 'C',
  options: options([
    ['Twenty minutes', 'Nhầm mốc 9:20 thành còn 20 phút.'],
    ['One hour and twenty minutes', 'Đây là khoảng 8:40 đến 10:00, lấy nhầm giờ khởi hành.'],
    ['Forty minutes', '10:00 trừ 9:20 bằng 40 phút.'],
    ['Two hours', 'Không có khoảng chênh hai giờ.'],
  ]),
  explanation:
    'Xe đến 9:20, trình diễn bắt đầu 10:00, nên có 40 phút trước buổi trình diễn. 8:40 là giờ khởi hành.',
  takeaway: 'Ghi vai trò từng mốc thời gian trước khi tính khoảng chênh.',
})
q('visit-refund', {
  part: 3,
  topic: 'travel',
  stimulusId: ferry,
  prompt: 'What will the visitor most likely do this evening?',
  difficulty: 'intermediate',
  skills: ['listening-inference'],
  vocabularyIds: ['refund', 'receipt'],
  answer: 'B',
  options: options([
    ['Buy a replacement ferry ticket', 'Phà dừng ngày mai; kế hoạch là đi xe buýt.'],
    ['Request a refund online', 'I’ll do that nối với việc nộp yêu cầu hoàn tiền trên website.'],
    ['Meet a colleague at the terminal', 'Việc đón ở terminal diễn ra khi đến nơi ngày mai.'],
    ['Cancel the equipment demonstration', 'Buổi trình diễn vẫn được giữ nguyên.'],
  ]),
  explanation:
    'I’ll do that this evening quy chiếu về apply through its website để hoàn tiền vé phà. Không phải mua vé phà khác hay hủy buổi trình diễn.',
  takeaway: 'Theo dõi this/that bằng hành động được nhắc ngay trước.',
})

const returns = key('talk-tool-return')
stimuli.push({
  id: returns,
  kind: 'talk',
  part: 4,
  title: 'After-hours equipment returns',
  topic: 'shopping',
  provenance,
  audio: {
    kind: 'synthetic',
    transcript:
      'Thank you for renting from Craftway Tools. Our desk closes at six this evening. If you return equipment after six, leave the tools in the secure return cage beside the rear entrance. Put the rental agreement in the envelope provided and post the envelope through the slot in the cage. Do not leave keys in the envelope; place them in the separate red key box. A staff member will inspect your equipment tomorrow morning. Your deposit will be refunded after that inspection, provided nothing is missing or damaged. Please keep the emailed return confirmation until the refund appears in your account.',
  },
})
q('returns-purpose', {
  part: 4,
  topic: 'shopping',
  stimulusId: returns,
  prompt: 'Who is the message intended for?',
  difficulty: 'foundation',
  skills: ['listening-main-idea'],
  vocabularyIds: ['equipment', 'customer'],
  answer: 'D',
  options: options([
    [
      'New employees learning to repair tools',
      'Hướng dẫn dành cho khách trả đồ thuê, không đào tạo sửa chữa.',
    ],
    ['Drivers delivering new rental equipment', 'Không nói nhận lô thiết bị mới.'],
    ['People applying for a store account', 'Không có quy trình đăng ký tài khoản.'],
    ['Customers returning rented tools', 'Toàn bài hướng dẫn khách trả thiết bị thuê.'],
  ]),
  explanation:
    'Mở đầu cảm ơn thuê dụng cụ, sau đó hướng dẫn trả đồ và hoàn cọc. Đối tượng là khách trả dụng cụ thuê.',
  takeaway: 'Dùng mục đích và hành động được yêu cầu để nhận diện người nghe.',
})
q('returns-keys', {
  part: 4,
  topic: 'shopping',
  stimulusId: returns,
  prompt: 'Where should customers leave the keys?',
  difficulty: 'foundation',
  skills: ['listening-detail'],
  vocabularyIds: ['equipment', 'return'].filter((v) => contentBank.vocabularyIds.includes(v)),
  answer: 'A',
  options: options([
    ['In a separate red box', 'Separate red key box là vị trí dành riêng cho chìa khóa.'],
    ['Inside the rental agreement envelope', 'Người nói nêu rõ không để chìa trong phong bì.'],
    ['On the closed service desk', 'Không yêu cầu để ở quầy đã đóng.'],
    ['Beside the tools in an open bag', 'Thiết bị vào lồng khóa; không có túi mở.'],
  ]),
  explanation:
    'Hợp đồng vào phong bì, còn chìa khóa vào hộp đỏ riêng. Do not đánh dấu thông tin cần phân biệt.',
  takeaway: 'Khi có phủ định, ghép đúng từng đồ vật với đúng nơi đặt.',
})
q('returns-deposit', {
  part: 4,
  topic: 'shopping',
  stimulusId: returns,
  prompt: 'When will a customer’s deposit be refunded?',
  difficulty: 'intermediate',
  skills: ['listening-detail'],
  vocabularyIds: ['deposit', 'refund'],
  answer: 'C',
  options: options([
    ['As soon as an envelope is posted', 'Bỏ phong bì chưa đáp ứng điều kiện kiểm tra.'],
    ['Before the store closes this evening', 'Kiểm tra chỉ diễn ra sáng mai.'],
    ['After the equipment passes the inspection', 'Hoàn cọc sau kiểm tra nếu không mất hoặc hỏng.'],
    ['When the customer rents another tool', 'Không có điều kiện phải thuê tiếp.'],
  ]),
  explanation:
    'Tiền cọc hoàn sau kiểm tra sáng mai, với điều kiện không thiếu hoặc hư hại. Chỉ để đồ lại chưa tự động đủ điều kiện hoàn cọc.',
  takeaway: 'Nghe cả mốc thời gian và điều kiện provided.',
})

function p5(
  name: string,
  prompt: string,
  answer: Question['answer'],
  rows: [string, string][],
  explanation: string,
  takeaway: string,
  skills: Skill[],
  grammarIds: string[],
  vocabularyIds: string[],
  difficulty: Question['difficulty'] = 'intermediate',
) {
  q(name, {
    part: 5,
    topic: 'grammar',
    prompt,
    answer,
    options: options(rows),
    explanation,
    takeaway,
    skills,
    grammarIds,
    vocabularyIds,
    difficulty,
  })
}
p5(
  'each-supplier',
  'Each of the suppliers ------- a separate invoice for the shipment.',
  'B',
  [
    ['issue', 'Issue không hòa hợp với chủ ngữ số ít each.'],
    ['issues', 'Each là trung tâm chủ ngữ số ít, nên dùng issues.'],
    ['issuing', 'Phân từ không tự làm vị ngữ hữu hạn.'],
    ['have issued', 'Have là dạng số nhiều; each cần has nếu dùng hoàn thành.'],
  ],
  'Each of + danh từ số nhiều vẫn có chủ ngữ số ít là each. Động từ hiện tại đơn là issues; suppliers không quyết định số của động từ.',
  'Tìm từ trung tâm của chủ ngữ, không lấy danh từ gần động từ nhất.',
  ['agreement'],
  ['agreement'],
  ['supplier', 'invoice'],
  'foundation',
)
p5(
  'report-passive',
  'The revised safety report must ------- by the site manager before it is circulated.',
  'D',
  [
    ['approve', 'Báo cáo không tự phê duyệt; cần bị động.'],
    ['approving', 'Must không đi trực tiếp với V-ing.'],
    ['approved', 'Thiếu be sau must trong cấu trúc bị động.'],
    ['be approved', 'Must + be + V3, chủ thể phê duyệt là site manager.'],
  ],
  'Báo cáo là đối tượng được phê duyệt; by the site manager chỉ tác nhân. Dùng must be approved.',
  'Sau modal ở bị động cần be + phân từ quá khứ.',
  ['passive', 'modals'],
  ['passive', 'modals'],
  ['approve', 'require'],
)
p5(
  'careful-estimate',
  'Please check the measurements ------- before sending the estimate to the customer.',
  'C',
  [
    ['careful', 'Tính từ không mô tả trực tiếp cách thực hiện check ở đây.'],
    ['care', 'Danh từ care không phù hợp vị trí bổ nghĩa check.'],
    ['carefully', 'Trạng từ mô tả cách kiểm tra.'],
    ['carefulness', 'Danh từ trừu tượng không bổ nghĩa trực tiếp động từ.'],
  ],
  'Vị trí này diễn tả cách kiểm tra các số đo, nên dùng trạng từ carefully bổ nghĩa check.',
  'Xác định từ cần được bổ nghĩa rồi chọn từ loại.',
  ['word-form'],
  ['word-forms'],
  ['estimate', 'customer'],
  'foundation',
)
p5(
  'avoid-delaying',
  'To avoid ------- the inspection, please submit the completed forms by noon.',
  'A',
  [
    ['delaying', 'Avoid đi với V-ing: tránh làm chậm.'],
    ['delay', 'Avoid không theo sau bởi động từ nguyên mẫu trần.'],
    ['to delay', 'Không dùng avoid to do.'],
    ['delayed', 'Phân từ quá khứ không phù hợp sau avoid trong cấu trúc này.'],
  ],
  'Avoid + V-ing là cấu trúc đúng, nên chọn delaying. To avoid mở cụm chỉ mục đích, không làm thay đổi bổ ngữ của avoid.',
  'Phân biệt to của cụm mục đích với dạng động từ sau avoid.',
  ['verb-patterns'],
  ['verb-patterns'],
  ['submit', 'deadline'],
)
p5(
  'despite-renovation',
  '------- the ongoing renovation, the ground-floor reception desk will remain open.',
  'D',
  [
    ['Although', 'Although cần mệnh đề hữu hạn; the ongoing renovation chỉ là cụm danh từ.'],
    ['Even though', 'Even though cũng cần mệnh đề, không phải cụm danh từ này.'],
    ['Because', 'Because cần mệnh đề và không thể hiện tương phản.'],
    ['Despite', 'Despite + cụm danh từ, diễn tả dù đang sửa chữa.'],
  ],
  'The ongoing renovation là cụm danh từ, nên giới từ despite phù hợp để diễn tả tương phản với remain open.',
  'Despite + danh từ/V-ing; although + mệnh đề.',
  ['prepositions', 'connectors'],
  ['prepositions', 'connectors'],
  ['despite', 'renovation'],
)
p5(
  'unless-confirmed',
  'The venue will release our provisional booking tomorrow ------- we pay the deposit today.',
  'B',
  [
    ['because', 'Because đổi thành quan hệ nguyên nhân trái ý: trả tiền lại khiến mất chỗ.'],
    ['unless', 'Unless nghĩa là nếu không; trả cọc hôm nay là điều kiện giữ đặt chỗ.'],
    ['although', 'Although không thiết lập điều kiện để tránh mất chỗ.'],
    ['whereas', 'Whereas đối chiếu hai sự thật, không diễn tả điều kiện ngoại lệ.'],
  ],
  'Nơi tổ chức sẽ bỏ đặt chỗ tạm nếu hôm nay không trả cọc. Unless tương đương if we do not pay the deposit today.',
  'Đọc quan hệ nghĩa cả câu, không chỉ kiểm tra cấu trúc mệnh đề.',
  ['connectors', 'conditionals'],
  ['connectors', 'conditionals'],
  ['venue', 'deposit', 'unless'],
)
p5(
  'whose-application',
  'Candidates ------- applications are incomplete will receive an email requesting the missing documents.',
  'C',
  [
    ['who', 'Who làm chủ ngữ/tân ngữ; không bổ nghĩa sở hữu trực tiếp applications.'],
    ['whom', 'Whom là đại từ tân ngữ, không phải từ hạn định sở hữu.'],
    ['whose', 'Whose applications nghĩa là đơn của các ứng viên.'],
    ['which', 'Which không thể hiện quan hệ sở hữu người–đơn ở đây.'],
  ],
  'Cần quan hệ sở hữu giữa candidates và applications, nên dùng whose trước danh từ applications.',
  'Whose có thể đứng trước danh từ làm chủ ngữ của mệnh đề quan hệ.',
  ['relative-clauses'],
  ['relatives'],
  ['candidate', 'applicant'],
)
p5(
  'counterfactual-shipment',
  'If the supplier had notified us earlier, we ------- the shipment to our new address.',
  'A',
  [
    ['would have redirected', 'If + had V3, mệnh đề chính would have V3 cho giả định quá khứ.'],
    ['will redirect', 'Tương lai đơn không phù hợp điều kiện trái quá khứ đã cho.'],
    ['are redirecting', 'Hiện tại tiếp diễn không phù hợp tình huống giả định quá khứ.'],
    ['had redirected', 'Past perfect ở đây không tạo mệnh đề kết quả giả định cần thiết.'],
  ],
  'Had notified là điều kiện trái quá khứ. Kết quả giả định cần would have redirected: nếu được báo sớm thì đã chuyển hướng hàng.',
  'Phân biệt điều kiện giả định quá khứ với kế hoạch tương lai.',
  ['conditionals'],
  ['conditionals'],
  ['notify', 'shipment'],
  'advanced',
)
p5(
  'fewer-errors',
  'The automated process produces ------- errors than the manual procedure did.',
  'D',
  [
    ['little', 'Little dùng với danh từ không đếm được và không là dạng so sánh này.'],
    ['few', 'Có than nên cần dạng so sánh fewer.'],
    ['least', 'Least là so sánh nhất, không phù hợp cấu trúc than.'],
    ['fewer', 'Errors đếm được số nhiều; fewer ... than.'],
  ],
  'Errors là danh từ đếm được số nhiều. Cấu trúc so sánh với than cần fewer.',
  'Fewer đi với danh từ đếm được số nhiều; less thường đi với lượng không đếm được.',
  ['comparisons'],
  ['comparisons'],
  ['process', 'efficient'],
  'foundation',
)
p5(
  'may-reschedule',
  'Employees may ------- their appointments online until 24 hours before the scheduled time.',
  'B',
  [
    ['rescheduled', 'May không đi trực tiếp với phân từ quá khứ chủ động.'],
    ['reschedule', 'Động từ nguyên mẫu không to sau modal may.'],
    ['rescheduling', 'May không đi trực tiếp với V-ing.'],
    ['to reschedule', 'Không dùng to sau modal may.'],
  ],
  'May chỉ sự cho phép và được theo sau bởi động từ nguyên mẫu trần reschedule.',
  'Modal + động từ nguyên mẫu không to.',
  ['modals'],
  ['modals'],
  ['employee', 'appointment'],
  'foundation',
)
p5(
  'recommend-be',
  'The auditor recommended that the outstanding invoices ------- reviewed before any payment was authorized.',
  'C',
  [
    ['are', 'Are là hiện tại chỉ định; không phù hợp cấu trúc đề nghị trang trọng trong câu này.'],
    ['were', 'Were không phải dạng giả định nguyên mẫu sau đề nghị này.'],
    ['be', 'Recommend that + chủ ngữ + động từ nguyên mẫu; bị động là be reviewed.'],
    ['being', 'Being không tạo vị ngữ hữu hạn trong mệnh đề that ở đây.'],
  ],
  'Recommended that diễn tả đề nghị. Dùng giả định nguyên mẫu be reviewed, không thêm s hay chia theo số nhiều; invoices là đối tượng được xem xét.',
  'Trong mẫu đề nghị trang trọng, that + S + be/V nguyên mẫu.',
  ['subjunctive', 'passive'],
  ['subjunctive', 'passive'],
  ['invoice', 'authorize'],
  'advanced',
)
p5(
  'past-launch',
  'The branch manager ------- the revised opening hours at yesterday’s staff meeting.',
  'A',
  [
    ['announced', 'Yesterday’s staff meeting là mốc quá khứ đã kết thúc.'],
    [
      'has announced',
      'Hiện tại hoàn thành không đi với mốc quá khứ xác định yesterday trong câu này.',
    ],
    ['will announce', 'Tương lai không phù hợp yesterday.'],
    ['is announcing', 'Hiện tại tiếp diễn không phù hợp mốc hôm qua.'],
  ],
  'At yesterday’s staff meeting xác định sự kiện đã kết thúc trong quá khứ, nên dùng announced.',
  'Dùng mốc thời gian làm bằng chứng chọn thì, rồi kiểm tra cấu trúc.',
  ['tenses'],
  ['tenses'],
  ['branch', 'employee'],
  'foundation',
)

const badges = key('text-visitor-badges'),
  badgePassage = key('passage-visitor-badges')
passages.push({
  id: badgePassage,
  title: 'Notice · Visitor badges',
  format: 'notice',
  text: 'VISITOR BADGE PROCEDURE\n\nFrom August 1, visitors must sign in at reception before entering the office floors. The receptionist will issue a temporary badge after {{1}} the visitor’s name against the appointment list.\n\nPlease return the badge to reception when leaving. {{2}} This will allow the receptionist to collect it without delaying other arrivals.\n\nEmployees expecting more than five visitors should notify reception at least one day in {{3}}. Although the badge procedure is changing, the rules for parking will remain {{4}}. Parking permits can still be requested through the staff portal.',
})
stimuli.push({
  id: badges,
  kind: 'text-completion',
  part: 6,
  title: 'Visitor check-in',
  topic: 'office',
  provenance,
  passageIds: [badgePassage],
})
q('badges-check', {
  part: 6,
  topic: 'office',
  stimulusId: badges,
  blankKey: '1',
  blankType: 'word',
  prompt: 'Choose the best word for blank [1].',
  difficulty: 'foundation',
  skills: ['verb-patterns'],
  grammarIds: ['verb-patterns'],
  vocabularyIds: ['appointment', 'temporary'],
  answer: 'B',
  options: options([
    ['check', 'Sau giới từ after cần danh từ hoặc V-ing ở cấu trúc này.'],
    ['checking', 'After checking: sau khi đối chiếu tên với danh sách.'],
    ['checked', 'Ở đây tiếp tân chủ động kiểm tra; không dùng phân từ bị động checked.'],
    ['to check', 'After không đi với to-infinitive trong cấu trúc này.'],
  ]),
  explanation:
    'After checking the visitor’s name là cụm chỉ hành động trước khi phát thẻ. Checking là dạng V-ing sau giới từ after.',
  takeaway: 'Xác định từ đứng trước là giới từ hay liên từ để chọn dạng động từ.',
})
q('badges-sentence', {
  part: 6,
  topic: 'office',
  stimulusId: badges,
  blankKey: '2',
  blankType: 'sentence',
  prompt: 'Choose the best sentence for blank [2].',
  difficulty: 'intermediate',
  skills: ['text-cohesion'],
  vocabularyIds: ['counter', 'request'],
  answer: 'D',
  options: options([
    [
      'Visitors should keep their badges for future appointments.',
      'Mâu thuẫn với yêu cầu trả thẻ khi rời đi.',
    ],
    [
      'Parking permits will no longer be available.',
      'Mâu thuẫn đoạn cuối và không nối việc thu thẻ.',
    ],
    [
      'The office floors will remain closed to all visitors.',
      'Không có việc cấm mọi khách; đoạn trước hướng dẫn cho khách vào.',
    ],
    [
      'Place it in the collection tray on the counter.',
      'It chỉ badge; khay thu giúp tiếp tân lấy thẻ mà không làm chậm khách đến.',
    ],
  ]),
  explanation:
    'Câu cần nối yêu cầu trả thẻ với This will allow the receptionist to collect it. Đặt thẻ vào khay thu là hành động tạo ra kết quả đó.',
  takeaway: 'Kiểm tra cả câu trước, câu sau và các đại từ it/this.',
})
q('badges-advance', {
  part: 6,
  topic: 'office',
  stimulusId: badges,
  blankKey: '3',
  blankType: 'word',
  prompt: 'Choose the best word for blank [3].',
  difficulty: 'foundation',
  skills: ['prepositions'],
  grammarIds: ['prepositions'],
  vocabularyIds: ['in-advance', 'notify'],
  answer: 'A',
  options: options([
    ['advance', 'In advance là cụm cố định nghĩa là trước.'],
    ['advancement', 'Advancement nghĩa là tiến bộ/thăng tiến, không dùng trong cụm thời gian này.'],
    ['advanced', 'Advanced là tính từ/phân từ, không tạo cụm in advance.'],
    ['advancing', 'Advancing không hoàn thành thành ngữ thời gian này.'],
  ]),
  explanation:
    'At least one day in advance nghĩa là báo trước ít nhất một ngày. Đây là cụm từ cố định.',
  takeaway: 'Học cụm in advance trong câu có khoảng thời gian cụ thể.',
})
q('badges-unchanged', {
  part: 6,
  topic: 'office',
  stimulusId: badges,
  blankKey: '4',
  blankType: 'word',
  prompt: 'Choose the best word for blank [4].',
  difficulty: 'intermediate',
  skills: ['reading-detail', 'word-form'],
  grammarIds: ['word-forms'],
  vocabularyIds: ['policy', 'require'],
  answer: 'C',
  options: options([
    ['unavailable', 'Câu sau nói vẫn có thể xin giấy phép đỗ xe, nên không phải unavailable.'],
    ['changing', 'Although đối lập thủ tục thẻ đổi với quy định đỗ xe giữ nguyên.'],
    ['unchanged', 'Remain unchanged phù hợp đối lập và được câu sau xác nhận.'],
    [
      'change',
      'Remain cần tính từ/phân từ bổ nghĩa chủ ngữ ở cấu trúc này; change là danh từ/động từ.',
    ],
  ]),
  explanation:
    'Although đối lập thủ tục badge thay đổi với quy định parking không đổi. Câu sau nói permits can still be requested củng cố unchanged.',
  takeaway: 'Dùng liên kết ý và thông tin câu sau để chọn nghĩa, không chỉ từ loại.',
})

const rental = key('reading-rental'),
  rates = key('rental-rates'),
  booking = key('rental-booking'),
  bill = key('rental-invoice')
passages.push(
  {
    id: rates,
    title: 'Document 1 · Rental terms',
    format: 'notice',
    text: 'LUMA PRESENTATION RENTALS\nProjector: $45 per unit per day\nScreen: $15 per unit per day\nDelivery: $20 per booking; no delivery charge for customers who collect equipment.\nRefundable deposit: $80 per booking, regardless of the number of items.\n\nEquipment must be returned by 6 p.m. on the final rental day. Returns after 6 p.m. are charged for an additional rental day. The deposit is returned after all items have been inspected and found undamaged.',
  },
  {
    id: booking,
    title: 'Document 2 · Booking email',
    format: 'email',
    text: 'To: Luma Presentation Rentals\nFrom: Linh Tran\nSubject: Booking LR218\n\nWe need two projectors and one screen for Tuesday and Wednesday, two rental days. We will collect all three items on Tuesday morning and return them on Wednesday at 5 p.m.\n\nThe attached draft invoice includes delivery, which we do not need. Please remove that charge and send us a corrected invoice. The equipment quantities and rental dates are correct.\n\nLinh',
  },
  {
    id: bill,
    title: 'Document 3 · Draft invoice LR218',
    format: 'notice',
    text: 'DRAFT INVOICE LR218\n2 projectors × 2 days × $45 = $180\n1 screen × 2 days × $15 = $30\nDelivery = $20\nRefundable deposit = $80\nTotal due = $310\n\nPayment is required before equipment collection.',
  },
)
stimuli.push({
  id: rental,
  kind: 'reading',
  part: 7,
  title: 'Triple passage · Correct a rental invoice',
  topic: 'shopping',
  provenance,
  passageIds: [rates, booking, bill],
})
const evidence = (passageId: string, quote: string, explanation: string) => ({
  passageId,
  quote,
  explanation,
})
q('rental-total', {
  part: 7,
  topic: 'shopping',
  stimulusId: rental,
  prompt: 'What should the total due be after the requested correction?',
  difficulty: 'advanced',
  skills: ['cross-text', 'reading-inference'],
  vocabularyIds: ['invoice', 'deposit'],
  answer: 'B',
  options: options([
    ['$210', 'Chỉ gồm phí thuê, bỏ quên cọc 80 đô phải trả trước.'],
    ['$290', '310 trừ phí giao 20 bằng 290, vẫn bao gồm cọc.'],
    ['$230', 'Gồm thuê 210 và phí giao 20, vừa bỏ cọc vừa giữ phí không cần.'],
    ['$310', 'Đây là tổng hóa đơn nháp chưa bỏ phí giao.'],
  ]),
  explanation:
    'Email xác nhận tự đến lấy nên theo điều khoản không mất phí giao. Tổng nháp 310 đô trừ delivery 20 đô còn 290 đô; cọc 80 đô vẫn phải thanh toán trước, dù có thể hoàn sau.',
  takeaway: 'Phân biệt tổng phải trả trước với chi phí cuối cùng sau hoàn cọc.',
  evidence: [
    evidence(
      booking,
      'We will collect all three items on Tuesday morning',
      'Tự đến lấy, không cần giao.',
    ),
    evidence(
      rates,
      'no delivery charge for customers who collect equipment.',
      'Điều kiện miễn phí giao.',
    ),
    evidence(bill, 'Total due = $310', 'Tổng ban đầu để trừ 20 đô.'),
  ],
})
q('rental-purpose', {
  part: 7,
  topic: 'shopping',
  stimulusId: rental,
  prompt: 'Why did Linh write the email?',
  difficulty: 'foundation',
  skills: ['reading-detail'],
  vocabularyIds: ['invoice', 'request'],
  answer: 'D',
  options: options([
    ['To extend the rental period', 'Email xác nhận ngày thuê đang đúng.'],
    ['To request a second screen', 'Linh vẫn cần một màn hình.'],
    ['To arrange home delivery', 'Khách tự đến lấy và muốn bỏ phí giao.'],
    [
      'To ask for a billing correction',
      'Please remove that charge and send us a corrected invoice nêu yêu cầu.',
    ],
  ]),
  explanation:
    'Linh yêu cầu bỏ delivery và gửi hóa đơn đã sửa. Email nói số thiết bị và ngày thuê đúng nên không cần sửa chúng.',
  takeaway: 'Mục đích email thường nằm ở hành động người gửi yêu cầu người nhận thực hiện.',
  evidence: [
    evidence(
      booking,
      'Please remove that charge and send us a corrected invoice.',
      'Yêu cầu chính là sửa hóa đơn.',
    ),
  ],
})
q('rental-deposit', {
  part: 7,
  topic: 'shopping',
  stimulusId: rental,
  prompt:
    'How much can Linh recover if all rented items are returned undamaged and pass inspection?',
  difficulty: 'intermediate',
  skills: ['cross-text', 'reading-detail'],
  vocabularyIds: ['deposit', 'refund'],
  answer: 'A',
  options: options([
    ['$80', 'Cọc tính một lần cho cả booking, không nhân theo ba thiết bị.'],
    ['$20', 'Đây là phí giao được bỏ khỏi hóa đơn, không phải tiền cọc hoàn sau kiểm tra.'],
    ['$160', 'Nhân cọc theo hai máy chiếu, trái quy định per booking.'],
    ['$240', 'Nhân cọc theo cả ba thiết bị, trái quy định regardless of the number of items.'],
  ]),
  explanation:
    'Quy định cọc là 80 đô mỗi booking, không phụ thuộc số món. Cọc được hoàn sau khi đồ được kiểm tra không hư hại.',
  takeaway: 'Đọc đơn vị tính phí: per booking khác per item và per day.',
  evidence: [
    evidence(
      rates,
      'Refundable deposit: $80 per booking, regardless of the number of items.',
      'Một lần cọc cho toàn bộ đặt thuê.',
    ),
    evidence(
      rates,
      'The deposit is returned after all items have been inspected and found undamaged.',
      'Điều kiện hoàn cọc.',
    ),
  ],
})
q('rental-next-step', {
  part: 7,
  topic: 'shopping',
  stimulusId: rental,
  prompt: 'What should Luma do in response to Linh’s email?',
  difficulty: 'intermediate',
  skills: ['cross-text', 'reading-inference'],
  vocabularyIds: ['confirm', 'invoice'],
  answer: 'C',
  options: options([
    ['Reduce the projector quantity to one', 'Email xác nhận số lượng đúng.'],
    ['Refund the deposit immediately', 'Cọc chỉ hoàn sau trả và kiểm tra.'],
    [
      'Send a revised invoice without delivery',
      'Thực hiện yêu cầu sửa phí giao, giữ ngày thuê và số lượng.',
    ],
    ['Move the return time to Thursday', 'Khách dự định trả thứ Tư, không đề nghị đổi ngày.'],
  ]),
  explanation:
    'Luma cần gửi bản hóa đơn sửa, bỏ đúng dòng delivery. Các dòng số lượng và ngày thuê được khách xác nhận đúng.',
  takeaway:
    'Suy ra bước tiếp theo trong phạm vi yêu cầu thực tế, không thêm thay đổi không được đề nghị.',
  evidence: [
    evidence(
      booking,
      'The equipment quantities and rental dates are correct.',
      'Giữ nguyên các thông tin này.',
    ),
    evidence(
      booking,
      'Please remove that charge and send us a corrected invoice.',
      'Gửi hóa đơn sửa phí giao.',
    ),
  ],
})
q('rental-late', {
  part: 7,
  topic: 'shopping',
  stimulusId: rental,
  prompt:
    'According to the terms, what would happen if the equipment were returned at 6:30 p.m. on Wednesday?',
  difficulty: 'intermediate',
  skills: ['reading-detail'],
  vocabularyIds: ['require', 'expense'],
  answer: 'B',
  options: options([
    ['Only the delivery fee would be added.', 'Phí giao không liên quan đến việc trả muộn.'],
    [
      'An additional rental day would be charged.',
      '6:30 p.m. muộn hơn hạn 6 p.m., nên thêm một ngày thuê.',
    ],
    ['The deposit would automatically be doubled.', 'Không có quy định nhân đôi cọc.'],
    ['The return would qualify for a discount.', 'Không có giảm giá khi trả muộn.'],
  ]),
  explanation:
    'Hạn trả là 6 giờ tối ngày thuê cuối. 6:30 tối thứ Tư vượt hạn nên bị tính thêm một ngày; không có quy định tăng cọc hay phí giao.',
  takeaway: 'Dùng điều kiện và ngoại lệ của văn bản để xử lý tình huống giả định.',
  evidence: [
    evidence(
      rates,
      'Returns after 6 p.m. are charged for an additional rental day.',
      'Hệ quả trực tiếp khi vượt hạn trả.',
    ),
  ],
})

async function main() {
  const source = JSON.parse(
    await readFile('content/sources/toeic-question-ocean/source.json', 'utf8'),
  ) as {
    commit: string
    sourceUrl: string
    licenseUrl: string
    attribution: string
    items: { id: string; audioText: string; choices: string[]; answer: number }[]
  }
  if (source.commit !== 'a940bb8b479ef4d06af468015d757041c3d2e457')
    throw new Error('Reconcile a changed source before adaptation.')
  for (const [sourceId, notes] of Object.entries(adaptations)) {
    const { reasons, ...metadata } = notes
    const row = source.items.find((r) => r.id === sourceId)
    if (!row || row.choices.length !== 3 || ![0, 1, 2].includes(row.answer))
      throw new Error(`Missing source item ${sourceId}`)
    const provenance = {
      kind: 'licensed' as const,
      author: 'Chun-Hsiung Luo; Vietnamese adaptation: STUDY 990 (AI-assisted)',
      revision,
      note: `Adapted from ${sourceId}. English prompt/choices retained under MIT; Vietnamese guidance and tags newly authored. No human review recorded.`,
      provider: 'TOEIC Question Ocean',
      sourceUrl: source.sourceUrl,
      attribution: source.attribution,
      license: 'MIT',
      licenseUrl: source.licenseUrl,
    }
    const stimulusId = key(`ocean-${sourceId.toLowerCase()}`)
    stimuli.push({
      id: stimulusId,
      kind: 'question-response',
      part: 2,
      title: `Question–Response · ${sourceId}`,
      topic: notes.topic,
      provenance,
      audio: { kind: 'synthetic', transcript: row.audioText },
    })
    questions.push({
      schemaVersion: 1,
      id: key(sourceId.toLowerCase()),
      part: 2,
      prompt: 'Choose the best response.',
      stimulusId,
      options: options(row.choices.map((choice, i) => [choice, reasons[i]])),
      answer: (['A', 'B', 'C'] as const)[row.answer],
      provenance,
      grammarIds: [],
      ...metadata,
    })
  }
  const pkg: ContentPackage = {
    format: 'study990.content',
    formatVersion: 3,
    id,
    revision,
    purpose: 'practice',
    media: [],
    review: {
      status: 'unreviewed',
      author: 'STUDY 990 · AI-assisted adaptation/authoring',
      date: '2026-10-27',
      note: 'Needs named human review. Source license archive is stored alongside the batch; no original attempt or score changed.',
    },
    bank: {
      questions,
      stimuli,
      passages,
      grammarIds: [...new Set(questions.flatMap((q) => q.grammarIds))],
      vocabularyIds: [...new Set(questions.flatMap((q) => q.vocabularyIds))],
    },
  }
  const issues = validateContentPackage(pkg, contentBank, true)
  const merged = {
    ...contentBank,
    questions: [...contentBank.questions, ...questions],
    stimuli: [...contentBank.stimuli, ...stimuli],
    passages: [...contentBank.passages, ...passages],
  }
  const near = findNearDuplicates(merged).filter(
    (w) => w.left.startsWith(id + ':') || w.right.startsWith(id + ':'),
  )
  if (issues.length || near.length) throw new Error(JSON.stringify({ issues, near }, null, 2))
  const fingerprint = packageFingerprint(pkg)
  pkg.editorial = draftEditorial(
    fingerprint,
    'STUDY 990 authoring tool',
    '2026-10-27T00:00:00.000Z',
  )
  pkg.editorial = advanceEditorial(
    pkg.editorial,
    fingerprint,
    'STUDY 990 structural validation',
    true,
  )
  pkg.editorial = advanceEditorial(pkg.editorial, fingerprint, 'STUDY 990 review queue', true)
  const finalIssues = validateContentPackage(pkg, contentBank)
  if (finalIssues.length) throw new Error(JSON.stringify(finalIssues))
  // Exclusive output: never overwrite a human-edited source package or silently activate drafts.
  const path = `content/packages/${id}.json`
  const json = JSON.stringify(pkg, null, 2) + '\n'
  await writeFile(path, json, { flag: 'wx' })
  console.log(
    JSON.stringify(
      {
        path,
        questions: questions.length,
        licensedAdaptations: Object.keys(adaptations).length,
        original: questions.length - Object.keys(adaptations).length,
        state: pkg.editorial.state,
        activated: 0,
        byPart: [1, 2, 3, 4, 5, 6, 7].map((part) => ({
          part,
          questions: questions.filter((q) => q.part === part).length,
        })),
        nearDuplicates: near.length,
        structuralIssues: finalIssues.length,
      },
      null,
      2,
    ),
  )
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Content preparation failed.')
  process.exitCode = 1
})
