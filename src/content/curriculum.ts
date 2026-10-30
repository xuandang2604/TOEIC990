import type { Question, Skill, ToeicPart } from './schema'
import type { RoadmapPhaseId } from '../domain/roadmap'
import type { ContentIssue } from './validation'
import { SKILL_LABELS } from '../domain/skillTaxonomy'

export interface CurriculumUnit {
  id: string
  phase: RoadmapPhaseId
  title: string
  outcome: string
  parts: ToeicPart[]
  skills: Skill[]
  grammarIds: string[]
  focusGrammarIds?: string[]
  passages?: 1 | 2 | 3
  exhibitOnly?: boolean
  sentenceInsertion?: boolean
  requireAllParts?: boolean
  minimumQuestions: number
  explainSimply: string
  routine: [string, string, string]
  contrast: { example: string; explanation: string }
  selfCheck: string
}

/** Authored learning sequence. Benchmarks are study heuristics, never ETS score cutoffs. */
export const curriculum: CurriculumUnit[] = [
  {
    id: 'diagnostic',
    phase: 'foundation',
    title: 'Lấy mẫu cả 7 Parts',
    outcome: 'Tách phần chưa biết, phần nghe/đọc nhầm và phần thiếu thời gian.',
    parts: [1, 2, 3, 4, 5, 6, 7],
    skills: [],
    grammarIds: ['sentence-structure'],
    requireAllParts: true,
    minimumQuestions: 14,
    explainSimply:
      'Bài đầu giống kiểm tra các mắt xích: chưa thử một Part thì chưa biết mắt xích đó vững đến đâu.',
    routine: [
      'Làm nhóm nhỏ ở các Part chưa có kết quả; chưa mở bản chép lời hay từ điển trước khi chọn.',
      'Sau khi trả lời, tự nêu bằng chứng rồi mới mở giải thích.',
      'Ghi nguyên nhân sai theo điều bạn quan sát; một lần sai chưa đủ kết luận điểm yếu.',
    ],
    contrast: {
      example: 'You recognize every word but cannot explain why B fits the situation.',
      explanation: 'Nhận ra từ chưa bằng hiểu ý. Ghi lại chỗ đứt mạch thay vì chỉ học chữ B.',
    },
    selfCheck: 'Mình đã có lượt trả lời ở cả bảy Parts, hay mới chỉ làm dạng quen?',
  },
  {
    id: 'photo-actions',
    phase: 'foundation',
    title: 'P1 · Hành động, trạng thái & vị trí',
    outcome: 'Đối chiếu từng mô tả với đúng chi tiết nhìn thấy trong ảnh.',
    parts: [1],
    skills: ['photo-detail'],
    grammarIds: ['tenses', 'passive', 'prepositions'],
    minimumQuestions: 6,
    explainSimply:
      'Ảnh cho thấy điều đang có, không cho biết câu chuyện trước hoặc sau ảnh. Mỗi lựa chọn phải khớp chủ thể, hành động và vị trí.',
    routine: [
      'Quan sát chủ thể và vị trí trước khi phát audio; không tự kể câu chuyện cho ảnh.',
      'Nghe đủ bốn lựa chọn rồi chọn; chú ý hành động đang xảy ra và trạng thái đã hoàn thành.',
      'Mở bản chép lời để tìm chính xác từ làm mỗi lựa chọn sai; lưu cụm mô tả nếu cần.',
    ],
    contrast: {
      example: 'The chairs are stacked. / The chairs are being stacked.',
      explanation:
        'Câu đầu mô tả trạng thái xếp chồng; câu sau nói việc xếp đang diễn ra. Ảnh phải có dấu hiệu phù hợp.',
    },
    selfCheck: 'Mình có đang chọn một hành động chỉ có thể tưởng tượng, chứ không nhìn thấy?',
  },
  {
    id: 'response-direct',
    phase: 'foundation',
    title: 'P2 · Nghe đúng điều được hỏi',
    outcome: 'Phân biệt người, nơi, thời gian, lý do và lời đề nghị.',
    parts: [2],
    skills: ['listening-detail', 'listening-intent'],
    grammarIds: ['questions', 'modals'],
    minimumQuestions: 12,
    explainSimply:
      'Câu hỏi tạo một nhu cầu thông tin. Lời đáp phải giải quyết nhu cầu đó, không chỉ lặp một từ vừa nghe.',
    routine: [
      'Nghe từ hỏi, trợ động từ và hành động chính.',
      'Loại lời đáp đúng chủ đề nhưng sai loại thông tin.',
      'Chép lại cụm mình nghe nhầm; sau khoảng nghỉ thử nghe lại trước khi đọc.',
    ],
    contrast: {
      example: 'Where is the briefing? — At ten. / In Room Four.',
      explanation:
        'At ten trả lời thời gian. In Room Four mới trả lời địa điểm, dù cả hai đều có thể thuộc cùng sự kiện.',
    },
    selfCheck: 'Mình đang trả lời câu được hỏi hay chỉ bắt được một từ quen?',
  },
  {
    id: 'grammar-core',
    phase: 'foundation',
    title: 'P5 · Cấu trúc trước, đáp án sau',
    outcome: 'Tìm được chủ ngữ, động từ chính và vị trí từ loại trước khi điền.',
    parts: [5],
    skills: ['word-form', 'agreement', 'tenses', 'passive'],
    grammarIds: [
      'word-forms',
      'agreement',
      'tenses',
      'passive',
      'nouns-countability',
      'articles',
      'determiners-quantifiers',
      'possessives',
    ],
    minimumQuestions: 12,
    explainSimply:
      'Câu là một khung có các vị trí. Hãy xác định vị trí trống cần làm nhiệm vụ gì trước khi xét nghĩa của từ.',
    routine: [
      'Khoanh chủ ngữ và động từ chính, tạm bỏ cụm bổ nghĩa chen giữa.',
      'Dự đoán loại từ hoặc dạng động từ trước khi nhìn lựa chọn.',
      'Giải thích bằng một câu ngắn vì sao dạng gần giống không thể đứng ở đó.',
    ],
    contrast: {
      example: 'Each of the invoices is correct.',
      explanation: 'Chủ ngữ là each, không phải invoices đứng gần động từ. Vì vậy dùng is.',
    },
    selfCheck: 'Nếu che các lựa chọn, mình vẫn nói được chỗ trống cần loại từ gì không?',
  },
  {
    id: 'single-text',
    phase: 'foundation',
    title: 'P7 · Đọc một văn bản có bằng chứng',
    outcome: 'Tìm được dòng hỗ trợ đáp án và giữ đúng người, thời điểm, điều kiện.',
    parts: [7],
    skills: ['reading-detail', 'reading-inference'],
    grammarIds: ['prepositions', 'modals'],
    passages: 1,
    minimumQuestions: 10,
    explainSimply:
      'Mỗi đáp án là một lời khẳng định cần bằng chứng. Cùng chủ đề chưa đủ: thời gian, điều kiện và đối tượng cũng phải khớp.',
    routine: [
      'Nhận diện loại văn bản, người viết và mục đích.',
      'Tìm câu bằng chứng; đọc cả điều kiện hoặc ngoại lệ quanh câu đó.',
      'Loại đáp án có một phần đúng nhưng thêm chi tiết văn bản không nói.',
    ],
    contrast: {
      example: 'Members may request a refund within seven days.',
      explanation:
        'May là có thể yêu cầu, không bảo đảm mọi người tự động được hoàn tiền. Within seven days là điều kiện thời gian.',
    },
    selfCheck: 'Mình chỉ được đúng câu bằng chứng hay đang suy diễn thêm?',
  },
  {
    id: 'response-indirect',
    phase: 'application',
    title: 'P2 · Lời đáp gián tiếp & hàm ý',
    outcome: 'Hiểu lời từ chối, gợi ý và cách trả lời không theo mẫu yes/no.',
    parts: [2],
    skills: ['listening-intent', 'listening-inference'],
    grammarIds: ['questions', 'modals'],
    minimumQuestions: 12,
    explainSimply:
      'Trong giao tiếp, người nói có thể đưa lý do hoặc chỉ đường tìm câu trả lời thay vì nói thẳng yes hay no.',
    routine: [
      'Xác định người nói đang hỏi thông tin, nhờ giúp hay gợi ý hành động.',
      'Thử nối từng lời đáp thành hội thoại có ý nghĩa.',
      'Đối chiếu âm gần giống, lặp từ và câu đúng ngữ pháp nhưng lạc chức năng.',
    ],
    contrast: {
      example: 'Can you cover my shift? — I have an appointment then.',
      explanation: 'Đây có thể là lời từ chối có lý do, dù không có từ no.',
    },
    selfCheck: 'Nếu thay lời đáp bằng ý ngắn bằng tiếng Việt, cuộc hội thoại có hợp lý không?',
  },
  {
    id: 'conversation',
    phase: 'application',
    title: 'P3 · Theo dõi vai trò & thay đổi',
    outcome: 'Giữ được ai nói gì, vấn đề hiện tại và hành động tiếp theo.',
    parts: [3],
    skills: ['listening-detail', 'listening-main-idea', 'listening-intent'],
    grammarIds: ['reported-speech', 'future-forms'],
    minimumQuestions: 12,
    explainSimply:
      'Hội thoại thường đi từ vấn đề đến đề xuất rồi quyết định. Đừng lấy đề xuất bị thay đổi làm kết quả cuối.',
    routine: [
      'Đọc câu hỏi và lựa chọn trước; ghi nhớ vai trò thay vì cố nhớ mọi từ.',
      'Nghe tín hiệu sửa thông tin như actually, instead, however.',
      'Tự kể lại vấn đề → thay đổi → việc sẽ làm; kiểm tra bằng bản chép lời sau khi chọn.',
    ],
    contrast: {
      example: 'I planned to send it today, but I need your approval first.',
      explanation:
        'Today là dự định; approval first mới là điều kiện cản trở. Không suy ra hàng chắc chắn đã gửi.',
    },
    selfCheck: 'Mình có tách được dự định ban đầu với quyết định sau cùng?',
  },
  {
    id: 'talk-purpose',
    phase: 'application',
    title: 'P4 · Mục đích, điều kiện & việc cần làm',
    outcome: 'Nghe được thông báo dành cho ai và cần làm gì sau đó.',
    parts: [4],
    skills: ['listening-main-idea', 'listening-detail', 'listening-intent'],
    grammarIds: ['conditionals', 'modals'],
    minimumQuestions: 12,
    explainSimply:
      'Một thông báo giống hướng dẫn hành động: lý do, thay đổi, đối tượng áp dụng và bước tiếp theo.',
    routine: [
      'Xác định thể loại: tin nhắn, thông báo, hướng dẫn hay giới thiệu.',
      'Giữ các điều kiện if, unless, only và các mốc thời gian gắn với hành động.',
      'Sau khi trả lời, nói lại thông báo trong ba ý; kiểm tra ý mình đã bỏ mất.',
    ],
    contrast: {
      example: 'Call before two if you want to change your order.',
      explanation: 'Before two là hạn để gọi đổi đơn, không nhất thiết là giờ giao hàng.',
    },
    selfCheck: 'Mỗi mốc giờ mình nghe được gắn với hành động nào?',
  },
  {
    id: 'verb-control',
    phase: 'application',
    title: 'P5 · Dạng động từ & sắc thái thời gian',
    outcome: 'Phân biệt cấu trúc động từ, thời điểm, bị động và thức giả định.',
    parts: [5],
    skills: ['verb-patterns', 'subjunctive', 'tenses', 'passive', 'modals'],
    grammarIds: [
      'verb-patterns',
      'subjunctive',
      'perfect-continuous',
      'modal-perfects',
      'causatives',
      'present-simple-continuous',
      'present-perfect-past',
      'past-continuous-perfect',
      'future-perfect',
      'used-to',
    ],
    minimumQuestions: 12,
    explainSimply:
      'Cùng một gốc động từ nhưng cấu trúc phía trước và thời điểm trong câu quyết định dạng cần dùng.',
    routine: [
      'Tìm động từ hoặc cụm chi phối chỗ trống.',
      'Xác định chủ động/bị động và thứ tự thời gian, không chỉ tìm từ khóa thì.',
      'Đổi một chi tiết thời gian hoặc chủ thể rồi tự giải thích vì sao đáp án đổi.',
    ],
    contrast: {
      example: 'They recommended that the report be revised.',
      explanation:
        'Trong cấu trúc giả định trang trọng này, be giữ nguyên dạng, không chia theo the report.',
    },
    selfCheck: 'Quy tắc mình nêu có giải thích cả cấu trúc và nghĩa thời gian không?',
  },
  {
    id: 'linking-clauses',
    phase: 'application',
    title: 'P5 · Mệnh đề, liên từ & giới từ',
    outcome: 'Phân biệt quan hệ nghĩa với loại cấu trúc theo sau từ nối.',
    parts: [5],
    skills: ['connectors', 'prepositions', 'relative-clauses', 'conditionals'],
    grammarIds: [
      'connectors',
      'prepositions',
      'relatives',
      'noun-clauses',
      'adverb-clauses',
      'mixed-conditionals',
      'wish-if-only',
    ],
    minimumQuestions: 12,
    explainSimply: 'Từ nối có hai chiếc khóa: đúng quan hệ ý và đúng dạng cụm hoặc mệnh đề đi sau.',
    routine: [
      'Đếm các mệnh đề có chủ ngữ và động từ hữu hạn.',
      'Xác định quan hệ nguyên nhân, tương phản, điều kiện hoặc thời gian.',
      'Giải thích vì sao một từ gần nghĩa lại sai về cấu trúc trong chính câu này.',
    ],
    contrast: {
      example:
        'Although sales increased, costs remained high. / Despite the increase in sales, costs remained high.',
      explanation:
        'Although đi với mệnh đề; despite đi với cụm danh từ hoặc V-ing. Không đổi từ mà giữ nguyên toàn bộ phần sau.',
    },
    selfCheck: 'Mình đã kiểm tra thứ đứng sau từ nối hay mới chỉ dịch nghĩa?',
  },
  {
    id: 'text-completion',
    phase: 'application',
    title: 'P6 · Mạch đoạn & quy chiếu',
    outcome: 'Giải thích lựa chọn bằng cả câu trước, câu sau và mục đích đoạn.',
    parts: [6],
    skills: ['text-cohesion', 'connectors', 'tenses', 'word-form'],
    grammarIds: ['connectors', 'pronouns', 'tenses'],
    minimumQuestions: 8,
    explainSimply:
      'Chỗ trống không sống một mình. Đáp án cần vừa đúng câu, vừa nối được với phần văn bản xung quanh.',
    routine: [
      'Đọc nhanh văn bản để biết ai gửi, gửi cho ai và để làm gì.',
      'Với câu chèn, tìm danh từ được quy chiếu và quan hệ với hai câu cạnh nó.',
      'Đọc lại cả đoạn sau khi điền để kiểm tra mạch thời gian và thông tin.',
    ],
    contrast: {
      example: 'The office will be closed on Friday. Normal service will resume on Monday.',
      explanation:
        'Resume cần một hoạt động đã có và tạm dừng; câu trước tạo bối cảnh cho việc tiếp tục vào thứ Hai.',
    },
    selfCheck: 'Mình có giải thích được liên kết với hai bên chỗ trống không?',
  },
  {
    id: 'listening-exhibits',
    phase: 'integration',
    title: 'P3/4 · Nghe kết hợp bảng biểu',
    outcome: 'Ghép đúng điều kiện trong audio với hàng hoặc cột của tư liệu.',
    parts: [3, 4],
    skills: ['visual-integration'],
    grammarIds: ['comparisons', 'prepositions'],
    exhibitOnly: true,
    minimumQuestions: 8,
    explainSimply:
      'Audio cho điều kiện chọn; bảng cho dữ liệu. Chỉ đọc bảng hoặc chỉ nghe thường chưa đủ để quyết định.',
    routine: [
      'Nhìn tiêu đề, đơn vị và tên hàng/cột trước khi phát.',
      'Nghe điều kiện loại trừ, khoảng giá, sức chứa hoặc sự thay đổi.',
      'Chỉ ra chuỗi điều kiện → ô dữ liệu → đáp án, thay vì chọn số nghe thấy đầu tiên.',
    ],
    contrast: {
      example: 'We need a room for eight, and it must have a camera.',
      explanation: 'Cần thỏa cả sức chứa lẫn camera. Phòng tám chỗ không có camera vẫn sai.',
    },
    selfCheck: 'Đáp án có thỏa mọi điều kiện được nghe không?',
  },
  {
    id: 'listening-inference',
    phase: 'integration',
    title: 'P3/4 · Hàm ý trong ngữ cảnh',
    outcome: 'Suy ra ý định từ toàn lượt nói mà không thêm giả định ngoài bài.',
    parts: [3, 4],
    skills: ['listening-inference', 'listening-intent'],
    grammarIds: ['modals', 'reported-speech'],
    minimumQuestions: 12,
    explainSimply:
      'Hàm ý là kết luận được ngữ cảnh hỗ trợ. Nó không phải mọi điều có thể xảy ra trong đời thực.',
    routine: [
      'Xác định vấn đề và vai trò của người nói trước câu được hỏi.',
      'Diễn đạt ý định ngắn gọn bằng lời của mình.',
      'Đối chiếu từng lựa chọn với thông tin thật; loại suy diễn cần thêm dữ kiện.',
    ],
    contrast: {
      example: 'The printer queue is already quite long.',
      explanation:
        'Câu này có thể giải thích việc đề nghị in sau trong một ngữ cảnh cụ thể; riêng nó chưa chứng minh máy in bị hỏng.',
    },
    selfCheck: 'Kết luận của mình có cần thêm một điều mà bài không cung cấp?',
  },
  {
    id: 'reading-paraphrase',
    phase: 'integration',
    title: 'P7 · Paraphrase & suy luận có giới hạn',
    outcome: 'Nhận ra cùng ý qua cách diễn đạt khác và phân biệt điều chắc với điều có thể.',
    parts: [7],
    skills: ['reading-inference', 'reading-detail'],
    grammarIds: ['modals', 'comparisons', 'conditionals'],
    minimumQuestions: 12,
    explainSimply:
      'Đáp án đúng có thể dùng từ khác hoàn toàn; đáp án sai có thể lặp rất nhiều từ trong bài nhưng đổi điều kiện.',
    routine: [
      'Tóm tắt câu bằng chứng thành ý nhỏ gồm người, hành động và điều kiện.',
      'So ý thay vì so từ; chú ý only, all, may, must và not yet.',
      'Nêu chi tiết làm mỗi phương án còn lại vượt quá bằng chứng.',
    ],
    contrast: {
      example: 'Bookings can be changed without a fee until Thursday.',
      explanation:
        'Ý này không nói việc thay đổi sau thứ Năm là không thể; có thể chỉ là không còn miễn phí.',
    },
    selfCheck: 'Đáp án có biến một khả năng thành điều chắc chắn không?',
  },
  {
    id: 'double-passages',
    phase: 'integration',
    title: 'P7 · Hai văn bản, một chuỗi thông tin',
    outcome: 'Ghép thông tin giữa hai nguồn, giữ đúng phiên bản và trình tự.',
    parts: [7],
    skills: ['cross-text'],
    grammarIds: ['tenses', 'pronouns'],
    passages: 2,
    minimumQuestions: 10,
    explainSimply:
      'Hai văn bản là hai mảnh ghép. Mỗi mảnh có thể cung cấp một nửa điều kiện hoặc sửa thông tin ở mảnh trước.',
    routine: [
      'Gắn nhãn người gửi, ngày và chức năng mỗi văn bản.',
      'Với câu hỏi liên kết, chỉ rõ thông tin lấy từ nguồn nào.',
      'Lập một chuỗi ngắn từ yêu cầu đến phản hồi; kiểm tra thay đổi sau cùng.',
    ],
    contrast: {
      example: 'The advertisement lists Friday. The later email moves the event to Saturday.',
      explanation: 'Ngày trong thông báo cũ không thắng một cập nhật rõ ràng ở email sau.',
    },
    selfCheck: 'Mình có thật sự cần cả hai văn bản để hỗ trợ đáp án này?',
  },
  {
    id: 'triple-passages',
    phase: 'integration',
    title: 'P7 · Ba văn bản & điều kiện chéo',
    outcome: 'Kết hợp danh tính, mã tham chiếu, thời gian và ngoại lệ qua ba nguồn.',
    parts: [7],
    skills: ['cross-text'],
    grammarIds: ['conditionals', 'prepositions', 'comparisons'],
    passages: 3,
    minimumQuestions: 10,
    explainSimply:
      'Đừng cố nhớ mọi chi tiết. Hãy biết chi tiết nào nằm ở nguồn nào, rồi nối đúng người hoặc đơn hàng qua các nguồn.',
    routine: [
      'Xác định vai trò của từng văn bản: quy định, yêu cầu, phản hồi hoặc biên nhận.',
      'Dùng tên, mã đơn và ngày làm điểm neo để đối chiếu.',
      'Đọc lại ngoại lệ trước khi kết luận tiền phải trả hoặc hành động cần làm.',
    ],
    contrast: {
      example:
        'The policy allows a refund, but the receipt shows the purchase was outside the eligible period.',
      explanation: 'Chỉ đọc chính sách chưa đủ. Điều kiện phải khớp cả giao dịch cụ thể.',
    },
    selfCheck: 'Mình đã kiểm tra đúng giao dịch và đúng thời hạn, hay chỉ thấy một quy định chung?',
  },
  {
    id: 'sentence-insertion',
    phase: 'integration',
    title: 'P6/7 · Vị trí câu & liên kết ý',
    outcome: 'Chọn vị trí câu bằng quy chiếu và quan hệ thông tin, không chỉ bằng một từ nối.',
    parts: [6, 7],
    skills: ['text-cohesion'],
    grammarIds: ['pronouns', 'connectors', 'parallelism'],
    sentenceInsertion: true,
    requireAllParts: true,
    minimumQuestions: 8,
    explainSimply:
      'Một câu phải có điểm bám phía trước và chuẩn bị được ý phía sau. Hai phía cùng quan trọng.',
    routine: [
      'Tìm this, these, such, also và các đối tượng chúng cần quy chiếu.',
      'Thử đọc câu với cả câu trước và câu sau ở từng vị trí.',
      'Giải thích ít nhất một vị trí bị loại vì đứt mạch, không chỉ vì cảm giác không tự nhiên.',
    ],
    contrast: {
      example: 'These changes will take effect next month.',
      explanation:
        'These changes thường cần các thay đổi được nêu trước đó; một chỗ chưa giới thiệu thay đổi khó làm điểm bám.',
    },
    selfCheck: 'Từ quy chiếu trong câu đang trỏ vào điều gì?',
  },
  {
    id: 'complex-grammar',
    phase: 'integration',
    title: 'Ngữ pháp nâng cao · Không học mẹo rời',
    outcome: 'Phân tích được đảo ngữ, rút gọn, phân từ và nhấn mạnh trong câu có nghĩa.',
    parts: [5, 6],
    skills: [],
    grammarIds: [
      'inversion',
      'reduced-relatives',
      'participle-clauses',
      'emphasis-clefts',
      'ellipsis-substitution',
      'parallelism',
    ],
    focusGrammarIds: [
      'inversion',
      'reduced-relatives',
      'participle-clauses',
      'emphasis-clefts',
      'ellipsis-substitution',
      'parallelism',
    ],
    minimumQuestions: 12,
    explainSimply:
      'Cấu trúc lạ thường là biến thể của một câu quen. Khôi phục câu đầy đủ giúp nhìn chủ ngữ, động từ và quan hệ ý.',
    routine: [
      'Viết lại câu ở dạng bình thường hoặc khôi phục thành phần bị rút gọn.',
      'Nêu điều kiện cho phép đổi cấu trúc; kiểm tra chủ thể thực hiện hành động.',
      'Làm mini practice của bài ngữ pháp rồi chuyển sang câu chưa gặp khi có nội dung phù hợp.',
    ],
    contrast: {
      example: 'Only after the inspection did the team reopen the room.',
      explanation:
        'Cụm hạn định đứng đầu kéo theo đảo trợ động từ trong mệnh đề chính. Ý thời gian vẫn phải được giữ khi viết lại.',
    },
    selfCheck: 'Mình có viết lại được câu ở dạng đầy đủ mà giữ nguyên nghĩa không?',
  },
  {
    id: 'lexical-precision',
    phase: 'consolidation',
    title: 'P5/6/7 · Từ quen, nghĩa và cụm chưa quen',
    outcome: 'Phân biệt từ loại, collocation và nghĩa theo ngữ cảnh công việc.',
    parts: [5, 6, 7],
    skills: ['word-form', 'reading-inference'],
    grammarIds: [
      'word-forms',
      'nouns-countability',
      'adjectives-adverbs',
      'participial-adjectives',
      'phrasal-verbs',
    ],
    minimumQuestions: 12,
    explainSimply:
      'Biết một bản dịch chưa đủ. Hãy biết từ đứng với từ nào, nhận cấu trúc gì và đổi nghĩa thế nào trong ngữ cảnh.',
    routine: [
      'Đoán nghĩa từ câu trước khi mở từ điển; sau đó lưu cả câu nguồn.',
      'Ôn thẻ bằng tự nhớ, không chỉ đọc lại danh sách.',
      'Đặt một câu mới dùng cùng cụm; kiểm tra nghĩa và từ loại bằng mục từ tham khảo.',
    ],
    contrast: {
      example: 'an outstanding invoice / an outstanding performance',
      explanation:
        'Outstanding có thể là chưa thanh toán hoặc xuất sắc. Một nghĩa tiếng Việt không dùng được cho cả hai cụm.',
    },
    selfCheck: 'Mình dùng được từ trong một câu mới hay chỉ nhận ra nghĩa trên thẻ?',
  },
  {
    id: 'mixed-retrieval',
    phase: 'consolidation',
    title: 'Xen kẽ & kiểm tra lại sau khoảng nghỉ',
    outcome:
      'Chọn được quy tắc phù hợp khi đề không báo trước dạng, rồi kiểm tra độ bền của việc nhớ.',
    parts: [1, 2, 3, 4, 5, 6, 7],
    skills: [],
    grammarIds: ['word-forms', 'connectors', 'conditionals', 'subjunctive'],
    requireAllParts: true,
    minimumQuestions: 21,
    explainSimply:
      'Trong bài thi, đề không ghi tên quy tắc cần dùng. Trộn dạng giúp luyện nhận diện vấn đề; khoảng nghỉ giúp kiểm tra việc nhớ có bền không.',
    routine: [
      'Xen kẽ nhóm Nghe và Đọc; giữ nguyên nhóm câu chung tư liệu.',
      'Làm lại câu sai sau ít nhất hai ngày mà chưa mở giải thích.',
      'Dùng thêm đề mới có nguồn hợp pháp để kiểm tra sức bền; không lấy điểm cao trên câu thuộc đáp án làm thước đo sẵn sàng thi.',
    ],
    contrast: {
      example:
        'You answer a familiar question correctly but miss a new question using the same rule.',
      explanation:
        'Đó là lý do phải tách kết quả câu mới với kết quả ôn lại. Làm lại đúng có ích nhưng chưa chứng minh chuyển giao.',
    },
    selfCheck: 'Kết quả tốt lên trên câu mới, hay chủ yếu trên những câu đã nhớ?',
  },
]

export function curriculumMatches(unit: CurriculumUnit, question: Question) {
  return (
    unit.parts.includes(question.part) &&
    (!unit.skills.length || question.skills.some((skill) => unit.skills.includes(skill))) &&
    (!unit.focusGrammarIds ||
      question.grammarIds.some((id) => unit.focusGrammarIds!.includes(id))) &&
    (!unit.sentenceInsertion || question.blankType === 'sentence')
  )
}

export function validateCurriculum(grammarIds: string[]): ContentIssue[] {
  const issues: ContentIssue[] = []
  const knownGrammar = new Set(grammarIds),
    ids = new Set<string>()
  const linkedGrammar = new Set(curriculum.flatMap((unit) => unit.grammarIds))
  for (const id of grammarIds)
    if (!linkedGrammar.has(id))
      issues.push({
        path: `curriculum.grammar.${id}`,
        message: 'Grammar lesson is not connected to the curriculum.',
      })
  for (const unit of curriculum) {
    const fail = (message: string) => issues.push({ path: `curriculum.${unit.id}`, message })
    if (ids.has(unit.id) || !/^[a-z0-9-]+$/.test(unit.id)) fail('Invalid or duplicate unit ID.')
    ids.add(unit.id)
    if (
      !unit.title.trim() ||
      !unit.outcome.trim() ||
      !unit.explainSimply.trim() ||
      !unit.selfCheck.trim() ||
      unit.routine.length !== 3 ||
      unit.routine.some((step) => !step.trim()) ||
      !unit.contrast.example.trim() ||
      !unit.contrast.explanation.trim()
    )
      fail('Incomplete authored learning guide.')
    if (
      !unit.parts.length ||
      unit.parts.some((part) => part < 1 || part > 7) ||
      new Set(unit.parts).size !== unit.parts.length
    )
      fail('Invalid Part scope.')
    if (!Number.isInteger(unit.minimumQuestions) || unit.minimumQuestions < 6)
      fail('Invalid evidence benchmark.')
    if (unit.skills.some((skill) => !Object.hasOwn(SKILL_LABELS, skill))) fail('Unknown skill.')
    if ([...unit.grammarIds, ...(unit.focusGrammarIds ?? [])].some((id) => !knownGrammar.has(id)))
      fail('Unknown grammar reference.')
  }
  return issues
}
