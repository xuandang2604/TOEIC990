import type { GrammarBase } from './schema'
import { additionalGrammar, enrichGrammar } from './grammarExpansion'
import { handbookEntries } from './handbook'

const starterGrammar: GrammarBase[] = [
  {
    id: 'word-forms',
    title: 'Từ loại & vị trí trong câu',
    englishTitle: 'Parts of speech',
    summary:
      'Đọc cấu trúc trước, chọn nghĩa sau. Vị trí trống thường cho biết bạn cần danh từ, tính từ hay trạng từ.',
    rules: [
      {
        title: 'Danh từ trung tâm và động từ chính',
        description:
          'Danh từ gọi tên người, vật hoặc sự việc; động từ hữu hạn diễn tả hành động/trạng thái và mang thì. Trước khi điền từ, xác định câu đã có chủ ngữ và động từ chính chưa. Hậu tố là gợi ý, không phải quy tắc tuyệt đối.',
        formula: 'The employee (noun) submits (verb) a proposal (noun).',
      },
      {
        title: 'Tính từ bổ nghĩa cho danh từ',
        description: 'Sau mạo từ và trước danh từ, dùng tính từ để mô tả danh từ đó.',
        formula: 'a / an / the + (adjective) + noun',
      },
      {
        title: 'Trạng từ bổ nghĩa cho động từ',
        description:
          'Trạng từ mô tả cách một hành động được thực hiện. Không phải mọi từ đuôi -ly đều là trạng từ.',
        formula: 'verb + adverb · adverb + adjective',
      },
    ],
    examples: [
      {
        correct: 'The team completed the task efficiently.',
        incorrect: 'The team completed the task efficient.',
        explanation: 'Efficiently bổ nghĩa cho hành động completed, nên cần trạng từ.',
      },
    ],
    traps: [
      'Sau be có thể là tính từ: The system is efficient. Không tự động chọn trạng từ.',
      'Equipment là danh từ không đếm được; không dùng equipments.',
    ],
    skills: ['word-form'],
  },
  {
    id: 'agreement',
    title: 'Hòa hợp chủ ngữ & động từ',
    englishTitle: 'Subject–verb agreement',
    summary:
      'Tìm danh từ trung tâm của chủ ngữ. Cụm giới từ chen giữa không quyết định số của động từ.',
    rules: [
      {
        title: 'Danh từ trung tâm quyết định',
        description:
          'Trong “the list of candidates”, chủ ngữ trung tâm là list (số ít), không phải candidates.',
        formula: 'The list of + plural noun + singular verb',
      },
      {
        title: 'Each / every đi với số ít',
        description: 'Each employee được xem là từng cá nhân, vì vậy dùng động từ số ít.',
        formula: 'Each / Every + singular noun + singular verb',
      },
    ],
    examples: [
      {
        correct: 'Each employee receives a badge.',
        incorrect: 'Each employee receive a badge.',
        explanation: 'Each employee là chủ ngữ số ít ở hiện tại đơn: receives.',
      },
    ],
    traps: [
      'Đừng để danh từ gần chỗ trống nhất đánh lạc hướng.',
      'A number of + danh từ số nhiều dùng động từ số nhiều; the number of dùng số ít.',
    ],
    skills: ['agreement'],
  },
  {
    id: 'tenses',
    title: 'Thì động từ',
    englishTitle: 'Verb tenses',
    summary: 'Xác định mốc thời gian và quan hệ giữa các hành động, thay vì chỉ tìm một từ khóa.',
    rules: [
      {
        title: 'Thói quen và việc đang diễn ra',
        description:
          'Hiện tại đơn mô tả thói quen/lịch trình; hiện tại tiếp diễn mô tả việc đang diễn ra hoặc sắp xếp cụ thể. Các động từ trạng thái như know thường không dùng tiếp diễn trong nghĩa thông thường.',
        formula: 'We process invoices daily. · We are processing your invoice now.',
      },
      {
        title: 'Hiện tại hoàn thành',
        description:
          'Diễn tả hành động bắt đầu trong quá khứ và còn liên quan đến hiện tại; thường gặp với since và for.',
        formula: 'has / have + past participle',
      },
      {
        title: 'Quá khứ hoàn thành',
        description: 'Diễn tả hành động xảy ra trước một hành động hay mốc khác trong quá khứ.',
        formula: 'had + past participle',
      },
    ],
    examples: [
      {
        correct: 'She has worked here since 2021.',
        incorrect: 'She works here since 2021.',
        explanation:
          'Since 2021 gắn mốc quá khứ với thời điểm hiện tại, cần hiện tại hoàn thành trong ngữ cảnh này.',
      },
    ],
    traps: [
      'Yesterday thường xác định một thời điểm quá khứ đã kết thúc.',
      'Không dùng will trong mệnh đề thời gian tương lai sau when hoặc once.',
    ],
    skills: ['tenses'],
  },
  {
    id: 'passive',
    title: 'Câu bị động',
    englishTitle: 'Passive voice',
    summary: 'Khi chủ ngữ nhận hành động, hãy kiểm tra dạng bị động và thì của động từ be.',
    rules: [
      {
        title: 'Bị động cơ bản',
        description:
          'Tân ngữ của câu chủ động trở thành chủ ngữ của câu bị động. Tác nhân có thể được lược bỏ.',
        formula: 'subject + be + past participle (+ by agent)',
      },
      {
        title: 'Bị động với động từ khuyết thiếu',
        description: 'Sau must, should hoặc can, dùng be nguyên mẫu trước phân từ quá khứ.',
        formula: 'must / should / can + be + past participle',
      },
    ],
    examples: [
      {
        correct: 'The equipment must be inspected.',
        incorrect: 'The equipment must inspected.',
        explanation: 'Thiết bị được kiểm tra, không tự kiểm tra. Cần must be + V3.',
      },
    ],
    traps: [
      'Không phải mọi phân từ đuôi -ed đều tạo câu bị động; chúng cũng có thể là tính từ.',
      'Chọn thì theo ngữ cảnh trước khi chia be.',
    ],
    skills: ['passive'],
  },
  {
    id: 'verb-patterns',
    title: 'Danh động từ & động từ nguyên mẫu',
    englishTitle: 'Gerunds & infinitives',
    summary: 'Động từ hoặc giới từ đứng trước quyết định dạng của động từ theo sau.',
    rules: [
      {
        title: 'Sau giới từ dùng V-ing',
        description:
          'To trong look forward to là giới từ, không phải dấu hiệu của động từ nguyên mẫu.',
        formula: 'preposition + V-ing · look forward to + V-ing',
      },
      {
        title: 'Học theo cụm',
        description:
          'Enjoy, avoid, postpone theo sau bởi V-ing. Decide, plan, agree theo sau bởi to V.',
        formula: 'postpone + V-ing · plan + to V',
      },
    ],
    examples: [
      {
        correct: 'They postponed opening the branch.',
        incorrect: 'They postponed to open the branch.',
        explanation: 'Postpone đi với danh động từ opening.',
      },
    ],
    traps: [
      'Stop doing: dừng việc đang làm; stop to do: dừng lại để làm việc khác.',
      'Recommend doing hoặc recommend that + chủ ngữ + động từ nguyên mẫu.',
    ],
    skills: ['verb-patterns'],
  },
  {
    id: 'connectors',
    title: 'Liên từ & giới từ',
    englishTitle: 'Conjunctions vs. prepositions',
    summary: 'Cùng diễn tả nhượng bộ hay nguyên nhân nhưng cấu trúc đi sau có thể khác nhau.',
    rules: [
      {
        title: 'Mệnh đề có chủ ngữ và động từ',
        description: 'Although và because nối một mệnh đề đầy đủ.',
        formula: 'although / because + subject + verb',
      },
      {
        title: 'Danh từ hoặc danh động từ',
        description: 'Despite, in spite of và because of đứng trước cụm danh từ hoặc V-ing.',
        formula: 'despite / because of + noun phrase / V-ing',
      },
    ],
    examples: [
      {
        correct: 'Despite the heavy rain, the shop opened.',
        incorrect: 'Although the heavy rain, the shop opened.',
        explanation: 'The heavy rain là cụm danh từ, nên dùng despite.',
      },
    ],
    traps: [
      'Không dùng despite of.',
      'However thường là trạng từ nối; không ghép hai mệnh đề độc lập chỉ bằng dấu phẩy.',
    ],
    skills: ['connectors'],
  },
  {
    id: 'conditionals',
    title: 'Câu điều kiện',
    englishTitle: 'Conditionals',
    summary: 'Phân biệt điều kiện có thể xảy ra với tình huống giả định để chọn đúng cặp thì.',
    rules: [
      {
        title: 'Điều kiện loại 1',
        description: 'Dùng cho điều kiện có thể xảy ra ở hiện tại hoặc tương lai.',
        formula: 'If + present simple, will + V',
      },
      {
        title: 'Điều kiện loại 2',
        description: 'Dùng cho tình huống giả định ít thực tế hoặc trái với hiện tại.',
        formula: 'If + past simple, would + V',
      },
    ],
    examples: [
      {
        correct: 'If the payment arrives today, we will ship the order.',
        incorrect: 'If the payment will arrive today, we will ship the order.',
        explanation: 'Mệnh đề if của điều kiện loại 1 dùng hiện tại đơn.',
      },
    ],
    traps: [
      'Unless mang nghĩa if … not; tránh phủ định kép ngoài ý muốn.',
      'Không chọn loại câu điều kiện chỉ dựa vào will ở một lựa chọn.',
    ],
    skills: ['conditionals'],
  },
  {
    id: 'relatives',
    title: 'Mệnh đề quan hệ',
    englishTitle: 'Relative clauses',
    summary: 'Xác định danh từ được bổ nghĩa và vai trò còn thiếu trong mệnh đề quan hệ.',
    rules: [
      {
        title: 'Người, vật và sở hữu',
        description:
          'Who dùng cho người; which cho vật; whose diễn tả quan hệ sở hữu và đứng trước danh từ.',
        formula: 'person + who + verb · noun + whose + noun',
      },
      {
        title: 'Mệnh đề không xác định',
        description:
          'Thông tin bổ sung được đặt giữa dấu phẩy. Không dùng that trong loại mệnh đề này.',
        formula: 'noun, which / who + clause, …',
      },
    ],
    examples: [
      {
        correct: 'The supplier whose warehouse is nearby offers quick delivery.',
        incorrect: 'The supplier who warehouse is nearby offers quick delivery.',
        explanation: 'Warehouse thuộc về supplier, nên cần whose đứng trước danh từ warehouse.',
      },
    ],
    traps: [
      'Whose dùng được cho cả người lẫn tổ chức, vật.',
      'Chỉ lược bỏ đại từ quan hệ khi nó làm tân ngữ trong mệnh đề xác định.',
    ],
    skills: ['relative-clauses'],
  },
  {
    id: 'subjunctive',
    title: 'Thức giả định sau đề nghị',
    englishTitle: 'Subjunctive constructions',
    summary:
      'Sau một số động từ đề nghị hoặc yêu cầu, mệnh đề that có thể dùng động từ nguyên mẫu không to.',
    rules: [
      {
        title: 'Recommend / suggest / request',
        description: 'Trong cấu trúc giả định, không thêm -s dù chủ ngữ là ngôi thứ ba số ít.',
        formula: 'recommend / request + that + subject + V (base form)',
      },
      {
        title: 'Giả định bị động',
        description:
          'Dùng be nguyên mẫu cùng phân từ quá khứ. Should + V cũng là một cấu trúc được dùng, đặc biệt trong Anh-Anh.',
        formula: 'It is essential that + subject + be + V3',
      },
    ],
    examples: [
      {
        correct: 'The manager requests that each visitor wear a badge.',
        incorrect: 'The manager requests that each visitor to wear a badge.',
        explanation:
          'Requests that thể hiện yêu cầu, nên wear ở dạng nguyên mẫu trong cấu trúc giả định này.',
      },
    ],
    traps: [
      'Phân biệt đề nghị thực hiện hành động với tường thuật một sự thật.',
      'Không tự động áp dụng cấu trúc này cho mọi động từ đi trước that.',
      'Bài tự kiểm tra yêu cầu dạng giả định nguyên mẫu; không kết luận mọi cấu trúc khác đều sai trong mọi văn cảnh.',
    ],
    skills: ['subjunctive'],
  },
]
export const grammar = [
  ...[...starterGrammar, ...additionalGrammar].map(enrichGrammar),
  ...handbookEntries.map((e) => e.lesson),
]
export const grammarById = new Map(grammar.map((lesson) => [lesson.id, lesson]))
