import type { GrammarBase, GrammarExercise, GrammarLesson, OptionId } from './schema'
import { referenceProvenance } from './lexicalNotes'

const optionIds: OptionId[] = ['A', 'B', 'C']
function quiz(
  id: string,
  prompt: string,
  choices: [string, string][],
  answer: OptionId,
  explanation: string,
): GrammarExercise {
  return {
    id,
    prompt,
    options: choices.map(([text, reason], i) => ({ id: optionIds[i], text, explanation: reason })),
    answer,
    explanation,
  }
}
type Supplement = Pick<GrammarLesson, 'vocabularyIds' | 'questionIds' | 'practice'> & {
  rule: GrammarBase['rules'][number]
  example: GrammarBase['examples'][number]
}

export const grammarSupplements: Record<string, Supplement> = {
  'word-forms': {
    vocabularyIds: ['efficient', 'reliable', 'equipment', 'temporary'],
    questionIds: ['p5-efficiently', 'p5-reliable'],
    rule: {
      title: 'Tính từ sau động từ nối',
      description:
        'Be, seem, become có thể nối chủ ngữ với tính từ mô tả chính chủ ngữ. Đừng áp dụng máy móc quy tắc “sau động từ dùng trạng từ”.',
      formula: 'subject + be / seem / become + adjective',
    },
    example: {
      correct: 'The new system is reliable.',
      incorrect: 'The new system is reliably.',
      explanation: 'Reliable mô tả system; không bổ nghĩa cho cách thực hiện một hành động.',
    },
    practice: [
      quiz(
        'forms-1',
        'The new booking system works -------.',
        [
          ['efficient', 'Tính từ không mô tả cách works được thực hiện ở đây.'],
          ['efficiently', 'Trạng từ bổ nghĩa cho works.'],
          ['efficiency', 'Danh từ chỉ hiệu suất, không bổ nghĩa cho works.'],
        ],
        'B',
        'Cần trạng từ efficiently để mô tả cách hệ thống hoạt động.',
      ),
      quiz(
        'forms-2',
        'The office will be ------- closed on Monday.',
        [
          ['temporary', 'Tính từ thường bổ nghĩa cho danh từ.'],
          ['temporarily', 'Trạng từ bổ nghĩa cho closed.'],
          ['temporariness', 'Danh từ không bổ nghĩa cho closed trong cấu trúc này.'],
        ],
        'B',
        'Temporarily closed nghĩa là tạm thời đóng cửa.',
      ),
    ],
  },
  agreement: {
    vocabularyIds: ['employee', 'equipment', 'facility', 'agenda'],
    questionIds: ['p5-agreement'],
    rule: {
      title: 'Danh từ không đếm được',
      description:
        'Equipment, luggage và feedback thường dùng động từ số ít khi làm chủ ngữ trong nghĩa chung. Nếu đếm bằng pieces thì pieces quyết định số.',
      formula: 'The equipment is … · Two pieces of equipment are …',
    },
    example: {
      correct: 'The list of applicants is on the desk.',
      incorrect: 'The list of applicants are on the desk.',
      explanation: 'Danh từ trung tâm là list, số ít; of applicants chỉ bổ sung thông tin.',
    },
    practice: [
      quiz(
        'agreement-1',
        'Every employee ------- a security badge.',
        [
          ['wear', 'Every employee là số ít.'],
          ['wears', 'Hiện tại đơn ngôi ba số ít thêm s.'],
          ['wearing', 'Thiếu động từ hữu hạn nếu chỉ dùng phân từ.'],
        ],
        'B',
        'Every + danh từ số ít đi với động từ số ít.',
      ),
      quiz(
        'agreement-2',
        'The equipment in these rooms ------- inspected monthly.',
        [
          ['is', 'Equipment không đếm được, dùng is.'],
          ['are', 'Rooms không phải danh từ trung tâm của chủ ngữ.'],
          ['have', 'Have inspected không tạo bị động phù hợp.'],
        ],
        'A',
        'In these rooms không làm equipment thành số nhiều; cần is inspected.',
      ),
    ],
  },
  tenses: {
    vocabularyIds: ['schedule', 'submit', 'renew', 'withdraw'],
    questionIds: ['p5-tense'],
    rule: {
      title: 'Mốc đã kết thúc và lịch cố định',
      description:
        'Dùng quá khứ đơn cho sự kiện đã kết thúc ở mốc quá khứ. Hiện tại đơn có thể diễn tả lịch trình đã định; không phải mọi câu nói tương lai đều cần will.',
      formula: 'submitted yesterday · The shuttle departs at 8 tomorrow.',
    },
    example: {
      correct: 'We submitted the invoice yesterday.',
      incorrect: 'We have submitted the invoice yesterday.',
      explanation: 'Yesterday xác định một mốc quá khứ đã kết thúc nên dùng quá khứ đơn.',
    },
    practice: [
      quiz(
        'tenses-1',
        'She ------- here since 2022 and still works here.',
        [
          ['worked', 'Quá khứ đơn không phù hợp quan hệ kéo dài được nêu rõ ở đây.'],
          ['has worked', 'Hiện tại hoàn thành nối mốc 2022 với hiện tại.'],
          ['will work', 'Tương lai không phù hợp since 2022.'],
        ],
        'B',
        'Since nêu mốc bắt đầu; hành động còn tiếp diễn đến hiện tại.',
      ),
      quiz(
        'tenses-2',
        'The team ------- the report yesterday.',
        [
          ['has submitted', 'Không đi với mốc yesterday trong cách dùng đang học.'],
          ['will submit', 'Yesterday là mốc quá khứ.'],
          ['submitted', 'Quá khứ đơn diễn tả việc đã xảy ra hôm qua.'],
        ],
        'C',
        'Mốc quá khứ đã kết thúc yêu cầu quá khứ đơn submitted.',
      ),
    ],
  },
  passive: {
    vocabularyIds: ['approve', 'require', 'authorize', 'shipment'],
    questionIds: ['p5-passive'],
    rule: {
      title: 'Bị động hoàn thành và tiếp diễn',
      description:
        'Giữ đúng cấu trúc thì khi đổi sang bị động. Has been diễn tả bị động hoàn thành; is being diễn tả hành động đang tác động lên chủ ngữ.',
      formula: 'has / have been + V3 · am / is / are being + V3',
    },
    example: {
      correct: 'The invoice has been approved.',
      incorrect: 'The invoice has approved.',
      explanation: 'Invoice nhận hành động phê duyệt, cần been trong bị động hoàn thành.',
    },
    practice: [
      quiz(
        'passive-1',
        'All claims must ------- by a manager.',
        [
          ['approved', 'Thiếu be sau must.'],
          ['be approved', 'Must + be + V3 tạo bị động.'],
          ['approve', 'Claims không tự phê duyệt.'],
        ],
        'B',
        'Chủ ngữ nhận hành động nên dùng must be approved.',
      ),
      quiz(
        'passive-2',
        'The room has ------- cleaned and is ready now.',
        [
          ['being', 'Has being không tạo hiện tại hoàn thành bị động.'],
          ['be', 'Sau has cần phân từ been.'],
          ['been', 'Has been cleaned là hiện tại hoàn thành bị động.'],
        ],
        'C',
        'Has been + V3 diễn tả việc dọn phòng đã hoàn thành, liên quan hiện tại.',
      ),
    ],
  },
  'verb-patterns': {
    vocabularyIds: ['postpone', 'recommend', 'look-forward-to', 'be-responsible-for'],
    questionIds: ['p5-gerund'],
    rule: {
      title: 'Có người thực hiện hành động',
      description:
        'Một số động từ dùng tân ngữ rồi to V: require someone to do. Với arrange, cần for trước người thực hiện: arrange for someone to do.',
      formula: 'require + person + to V · arrange for + person + to V',
    },
    example: {
      correct: 'We look forward to meeting you.',
      incorrect: 'We look forward to meet you.',
      explanation: 'To trong look forward to là giới từ nên theo sau bằng danh động từ meeting.',
    },
    practice: [
      quiz(
        'patterns-1',
        'We look forward to ------- from you.',
        [
          ['hear', 'To trong cụm này là giới từ.'],
          ['heard', 'Không dùng quá khứ sau giới từ này.'],
          ['hearing', 'Giới từ to theo sau bởi V-ing.'],
        ],
        'C',
        'Học cả cụm look forward to + V-ing.',
      ),
      quiz(
        'patterns-2',
        'The team decided ------- the meeting.',
        [
          ['to postpone', 'Decide đi với to V.'],
          ['postponing', 'Không dùng decide + V-ing trong nghĩa này.'],
          ['postpone', 'Thiếu to sau decided.'],
        ],
        'A',
        'Decide to do something; postpone doing something là hai mẫu khác nhau.',
      ),
    ],
  },
  connectors: {
    vocabularyIds: ['despite', 'unless', 'delivery', 'policy'],
    questionIds: ['p5-connectors', 'p7-venue'],
    rule: {
      title: 'Nối hai mệnh đề độc lập',
      description:
        'And, but, so có thể nối hai mệnh đề độc lập. However là trạng từ nối, cần chấm câu phù hợp; không dùng however như but chỉ bằng một dấu phẩy.',
      formula: 'clause, but clause · clause; however, clause',
    },
    example: {
      correct: 'Although it rained, the delivery arrived on time.',
      incorrect: 'Despite it rained, the delivery arrived on time.',
      explanation: 'It rained là mệnh đề có chủ ngữ và động từ; cần although.',
    },
    practice: [
      quiz(
        'connectors-1',
        '------- the delay, we completed the installation.',
        [
          ['Although', 'Sau although cần mệnh đề.'],
          ['Despite', 'The delay là cụm danh từ.'],
          ['Because', 'Sau because cần mệnh đề.'],
        ],
        'B',
        'Despite đi với cụm danh từ và thể hiện quan hệ nhượng bộ.',
      ),
      quiz(
        'connectors-2',
        'The shop closed early ------- the power failed.',
        [
          ['because of', 'Không theo sau bằng mệnh đề đầy đủ.'],
          ['despite', 'Vừa sai cấu trúc vừa sai quan hệ nguyên nhân.'],
          ['because', 'The power failed là mệnh đề nguyên nhân.'],
        ],
        'C',
        'Because + S + V; because of + cụm danh từ.',
      ),
    ],
  },
  conditionals: {
    vocabularyIds: ['unless', 'supplier', 'shipment', 'cancel'],
    questionIds: ['p5-conditionals'],
    rule: {
      title: 'Điều kiện không thực trong quá khứ',
      description:
        'Loại 3 nói về một điều kiện đã không xảy ra và kết quả giả định của nó trong quá khứ. Phân biệt với loại 2 nói về hiện tại.',
      formula: 'If + had + V3, would have + V3',
    },
    example: {
      correct: 'Unless payment arrives today, we will cancel the order.',
      incorrect: 'Unless payment will arrive today, we will cancel the order.',
      explanation: 'Mệnh đề điều kiện tương lai sau unless thường dùng hiện tại đơn.',
    },
    practice: [
      quiz(
        'conditional-1',
        'If the supplier ships today, we ------- the goods tomorrow.',
        [
          ['received', 'Quá khứ không phù hợp kết quả tương lai có thể xảy ra.'],
          ['will receive', 'Kết quả loại 1 dùng will + V.'],
          ['had received', 'Quá khứ hoàn thành không phù hợp mốc tương lai.'],
        ],
        'B',
        'Điều kiện loại 1: if + hiện tại đơn, will + V.',
      ),
      quiz(
        'conditional-2',
        'If we had received approval, we ------- the order yesterday.',
        [
          ['will place', 'Không phù hợp điều kiện quá khứ không thực.'],
          ['would place', 'Thiếu have + V3 cho kết quả quá khứ.'],
          ['would have placed', 'Kết quả giả định quá khứ dùng would have + V3.'],
        ],
        'C',
        'Câu nêu điều kiện loại 3, không phải loại 2.',
      ),
    ],
  },
  relatives: {
    vocabularyIds: ['supplier', 'employee', 'venue', 'colleague'],
    questionIds: ['p5-relative'],
    rule: {
      title: 'Lược bỏ đại từ làm tân ngữ',
      description:
        'Trong mệnh đề xác định, có thể lược đại từ quan hệ làm tân ngữ. Nếu đại từ là chủ ngữ, không bỏ khi vẫn giữ mệnh đề hữu hạn.',
      formula: 'The report (that) you submitted · the employee who works here',
    },
    example: {
      correct: 'The manager, who joined in May, approved the proposal.',
      incorrect: 'The manager, that joined in May, approved the proposal.',
      explanation: 'Không dùng that trong mệnh đề quan hệ không xác định có dấu phẩy.',
    },
    practice: [
      quiz(
        'relative-1',
        'The supplier ------- office is nearby offers free delivery.',
        [
          ['who', 'Cần quan hệ sở hữu trước office.'],
          ['whose', 'Whose + danh từ chỉ sở hữu.'],
          ['which', 'Which không làm từ hạn định sở hữu.'],
        ],
        'B',
        'Whose office = văn phòng của nhà cung cấp.',
      ),
      quiz(
        'relative-2',
        'The printer, ------- was installed yesterday, is ready.',
        [
          ['that', 'Không dùng that trong mệnh đề không xác định.'],
          ['whose', 'Sau whose cần danh từ để chỉ sở hữu.'],
          ['which', 'Which thay cho printer trong mệnh đề bổ sung.'],
        ],
        'C',
        'Dấu phẩy đánh dấu mệnh đề không xác định; dùng which cho vật.',
      ),
    ],
  },
  subjunctive: {
    vocabularyIds: ['recommend', 'request', 'require', 'mandatory'],
    questionIds: ['p5-subjunctive'],
    rule: {
      title: 'Phủ định trong mệnh đề giả định',
      description:
        'Đặt not ngay trước động từ nguyên mẫu; không thêm does trong cấu trúc giả định sau yêu cầu. Cấu trúc should not + V cũng có thể dùng.',
      formula: 'request that + subject + not + V · should not + V',
    },
    example: {
      correct: 'We request that visitors not enter this area.',
      incorrect: 'We request that visitors not to enter this area.',
      explanation: 'Cấu trúc giả định dùng not + V nguyên mẫu không to.',
    },
    practice: [
      quiz(
        'subjunctive-1',
        'Use the mandative subjunctive: The director recommends that every employee ------- the session.',
        [
          ['attends', 'Trong cấu trúc giả định này không thêm s.'],
          ['attend', 'Động từ nguyên mẫu sau chủ ngữ.'],
          ['to attend', 'Không dùng to sau chủ ngữ trong mệnh đề that này.'],
        ],
        'B',
        'Recommend that S + V nguyên mẫu diễn tả đề nghị.',
      ),
      quiz(
        'subjunctive-2',
        'It is essential that all invoices ------- checked.',
        [
          ['being', 'Being một mình không tạo động từ cho mệnh đề này.'],
          ['to be', 'Không dùng to trước be trong mệnh đề này.'],
          ['be', 'Be nguyên mẫu + V3 tạo giả định bị động.'],
        ],
        'C',
        'It is essential that S + be + V3 là một mẫu giả định bị động.',
      ),
    ],
  },
  prepositions: {
    vocabularyIds: ['deadline', 'comply', 'participate', 'in-advance'],
    questionIds: ['p5-connectors', 'p7-venue'],
    rule: {
      title: 'Giới từ theo cụm, không dịch từng chữ',
      description:
        'Ghi nhớ động từ/tính từ cùng giới từ và tân ngữ: participate in, comply with, eligible for. Sau giới từ thường là danh từ hoặc V-ing.',
      formula: 'participate in + noun · responsible for + V-ing',
    },
    example: {
      correct: 'Please submit the form by Friday.',
      incorrect: 'Please submit the form until Friday.',
      explanation:
        'By đặt hạn cuối cho việc nộp; until phù hợp với trạng thái/hành động kéo dài đến một mốc.',
    },
    practice: [
      quiz(
        'preposition-1',
        'All suppliers must comply ------- the new policy.',
        [
          ['to', 'Comply không đi với to trong cụm tuân thủ này.'],
          ['with', 'Comply with là cụm đúng.'],
          ['for', 'For không nối comply với quy định.'],
        ],
        'B',
        'Học comply with + quy định/yêu cầu như một cụm.',
      ),
      quiz(
        'preposition-2',
        'The reception desk is open ------- 6 p.m.',
        [
          ['by', 'By chỉ hạn cuối, không diễn tả trạng thái kéo dài.'],
          ['during', 'During theo sau bằng giai đoạn/sự kiện, không phải giờ kết thúc đơn lẻ này.'],
          ['until', 'Open là trạng thái tiếp tục đến 6 giờ.'],
        ],
        'C',
        'Until nêu mốc kết thúc của trạng thái mở cửa.',
      ),
    ],
  },
  comparisons: {
    vocabularyIds: ['efficient', 'reliable', 'convenient', 'relocate'],
    questionIds: ['p5-efficiently'],
    rule: {
      title: 'So sánh bằng và lượng từ',
      description:
        'As … as dùng tính từ/trạng từ nguyên dạng. Với danh từ, phân biệt fewer cho đơn vị đếm được và less cho lượng không đếm được.',
      formula: 'as + adjective / adverb + as · fewer orders · less equipment',
    },
    example: {
      correct: 'The new system works more efficiently than the old one.',
      incorrect: 'The new system works more efficient than the old one.',
      explanation: 'Works cần trạng từ efficiently; so sánh hơn của trạng từ này dùng more.',
    },
    practice: [
      quiz(
        'comparison-1',
        'The new printer is ------- than the old one.',
        [
          ['more reliable', 'Tính từ dài tạo so sánh hơn bằng more.'],
          ['most reliable', 'So sánh nhất không phù hợp than ở đây.'],
          ['more reliably', 'Sau is cần tính từ mô tả printer.'],
        ],
        'A',
        'More reliable than so sánh mức độ đáng tin cậy giữa hai máy.',
      ),
      quiz(
        'comparison-2',
        'This venue is as ------- as the previous one.',
        [
          ['conveniently', 'Sau is cần tính từ.'],
          ['convenient', 'As + tính từ nguyên dạng + as.'],
          ['more convenient', 'Không dùng so sánh hơn bên trong as … as.'],
        ],
        'B',
        'So sánh bằng dùng as convenient as.',
      ),
    ],
  },
  modals: {
    vocabularyIds: ['mandatory', 'customer', 'refund', 'accommodate'],
    questionIds: ['p5-passive', 'p2-request'],
    rule: {
      title: 'Yêu cầu lịch sự và mức độ chắc chắn',
      description:
        'Could và would thường dùng trong lời yêu cầu lịch sự; may chỉ khả năng hoặc cho phép tùy ngữ cảnh. Không hiểu mọi could là quá khứ.',
      formula: 'Could you + V …? · subject + may + V',
    },
    example: {
      correct: 'You must not enter the restricted area.',
      incorrect: 'You do not have to enter the restricted area. (= prohibited)',
      explanation:
        'Must not là cấm; do not have to là không bắt buộc. Hai nghĩa không tương đương.',
    },
    practice: [
      quiz(
        'modal-1',
        'All visitors must ------- a badge.',
        [
          ['wears', 'Sau must không chia s.'],
          ['wear', 'Modal + động từ nguyên mẫu.'],
          ['to wear', 'Không dùng to sau must.'],
        ],
        'B',
        'Must + V nguyên mẫu, không phụ thuộc số của chủ ngữ.',
      ),
      quiz(
        'modal-2',
        'Parking is optional. Employees ------- use the company car park.',
        [
          ['must not', 'Diễn tả cấm, trái với optional.'],
          ['cannot', 'Diễn tả không thể/không được, không phải tùy chọn.'],
          ['do not have to', 'Không bắt buộc, phù hợp optional.'],
        ],
        'C',
        'Do not have to diễn tả không cần thiết; must not là cấm.',
      ),
    ],
  },
}

export const additionalGrammar: GrammarBase[] = [
  {
    id: 'prepositions',
    title: 'Giới từ trong ngữ cảnh công việc',
    englishTitle: 'Prepositions',
    summary:
      'Phân biệt mốc thời gian, khoảng kéo dài và quan hệ giữa các từ. Chọn giới từ theo cả cấu trúc lẫn ý nghĩa.',
    rules: [
      {
        title: 'At, on, in cho thời gian',
        description:
          'At thường dùng với giờ; on với ngày/ngày cụ thể; in với tháng, năm, khoảng dài. Có ngoại lệ và cụm cố định, nên không áp dụng như một quy luật tuyệt đối.',
        formula: 'at 9 a.m. · on Monday · in October · in 2026',
      },
      {
        title: 'By, until, during và for',
        description:
          'By đặt hạn cuối; until nêu điểm kết thúc trạng thái kéo dài. During + giai đoạn/sự kiện; for + độ dài thời gian.',
        formula: 'by Friday · open until 6 · during the meeting · for two hours',
      },
    ],
    examples: [
      {
        correct: 'The interview is on Monday at ten.',
        incorrect: 'The interview is in Monday at ten.',
        explanation: 'Dùng on với ngày trong tuần, at với giờ cụ thể.',
      },
    ],
    traps: [
      'Không thêm at/on/in trước every, next, last khi chúng trực tiếp xác định thời gian: next Monday.',
      'Before là trước mốc; by bao gồm cả mốc cuối được nêu. Đọc chính xác yêu cầu hạn nộp.',
    ],
    skills: ['prepositions'],
  },
  {
    id: 'comparisons',
    title: 'So sánh hơn, nhất & bằng',
    englishTitle: 'Comparisons',
    summary:
      'Xác định đang so sánh đặc điểm, cách làm hay số lượng. Giữ đúng từ loại trước khi chọn dạng so sánh.',
    rules: [
      {
        title: 'So sánh hơn',
        description:
          'Tính từ ngắn thường thêm -er; tính từ dài thường dùng more. Trạng từ đuôi -ly như efficiently dùng more. Than nối đối tượng được đem so sánh.',
        formula: 'larger than · more reliable than · more efficiently than',
      },
      {
        title: 'So sánh nhất trong một nhóm',
        description:
          'Dùng the + dạng so sánh nhất khi chọn đối tượng có mức cao nhất trong nhóm. Sau one of the most dùng danh từ số nhiều.',
        formula: 'the largest room · one of the most reliable suppliers',
      },
    ],
    examples: [
      {
        correct: 'This is one of our most reliable suppliers.',
        incorrect: 'This is one of our most reliable supplier.',
        explanation: 'One of chọn một thành viên trong nhóm nhiều suppliers.',
      },
    ],
    traps: [
      'Không kết hợp more với -er: more cheaper là sai.',
      'Better là dạng so sánh hơn bất quy tắc của good/well; không dùng more better.',
    ],
    skills: ['comparisons'],
  },
  {
    id: 'modals',
    title: 'Động từ khuyết thiếu',
    englishTitle: 'Modals',
    summary:
      'Can, could, may, must, should diễn tả khả năng, cho phép, nghĩa vụ hoặc lời khuyên. Sắc thái ảnh hưởng trực tiếp tới ý của thông báo.',
    rules: [
      {
        title: 'Động từ theo sau không chia',
        description:
          'Sau modal dùng động từ nguyên mẫu không to. Không thêm s cho chủ ngữ số ít; bị động thêm be trước phân từ quá khứ.',
        formula: 'must / can / should + V · must / can / should + be + V3',
      },
      {
        title: 'Bắt buộc, cấm và không bắt buộc',
        description:
          'Must là bắt buộc; must not là cấm; do not have to là không cần thiết. Should thường là lời khuyên, yếu hơn nghĩa vụ bắt buộc.',
        formula: 'must wear · must not enter · do not have to attend',
      },
    ],
    examples: [
      {
        correct: 'She can authorize the payment.',
        incorrect: 'She can authorizes the payment.',
        explanation: 'Sau can dùng authorize nguyên mẫu dù chủ ngữ là she.',
      },
    ],
    traps: [
      'Could you…? thường là yêu cầu lịch sự trong hội thoại hiện tại.',
      'May be + tính từ và maybe là trạng từ khác cấu trúc: It may be available / Maybe it is available.',
    ],
    skills: ['modals', 'passive', 'listening-intent'],
  },
]

export function enrichGrammar(base: GrammarBase): GrammarLesson {
  const supplement = grammarSupplements[base.id]
  if (!supplement)
    return {
      ...base,
      vocabularyIds: [],
      questionIds: [],
      practice: [],
      provenance: referenceProvenance,
    }
  const { rule, example, ...details } = supplement
  return {
    ...base,
    ...details,
    rules: [...base.rules, rule],
    examples: [...base.examples, example],
    provenance:
      base.id === 'subjunctive'
        ? { ...referenceProvenance, revision: '2026-10-task08' }
        : referenceProvenance,
  }
}
