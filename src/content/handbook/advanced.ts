import { entry, type LessonDraft } from './model'

const drafts: LessonDraft[] = [
  {
    id: 'adjectives-adverbs',
    title: 'Tính từ, trạng từ & trật tự bổ nghĩa',
    en: 'Adjectives, adverbs and modifier position',
    chapter: 'modifiers',
    level: 'intermediate',
    aliases: ['adjective adverb', 'linking verbs', 'hard hardly', 'enough too'],
    related: ['word-forms', 'comparisons', 'participial-adjectives'],
    skills: ['word-form'],
    vocabulary: ['efficient', 'reliable'],
    plain:
      'Hãy vẽ mũi tên: từ này đang mô tả danh từ, trạng thái của chủ ngữ hay cách thực hiện hành động? Mũi tên giúp chọn tính từ hoặc trạng từ.',
    why: 'Trong “The plan seems practical”, practical mô tả plan qua động từ nối seems. Trong “They planned carefully”, carefully mô tả cách lên kế hoạch, không mô tả họ là người thế nào.',
    prompt:
      'Dùng “The machine is efficient” và “The machine works efficiently” để giải thích vì sao đổi một từ nhưng không phải cứ sau động từ là trạng từ.',
    checks: [
      'Tôi chỉ ra từ được bổ nghĩa.',
      'Tôi nhận ra be/seem/become có thể là động từ nối.',
      'Tôi không đoán nghĩa từ có -ly chỉ bằng cách bỏ -ly.',
    ],
    rules: [
      [
        'Tính từ và động từ nối',
        'Tính từ bổ nghĩa danh từ hoặc mô tả chủ ngữ sau linking verbs như seem, remain, become.',
        'a reliable supplier / The supplier seems reliable.',
      ],
      [
        'Trạng từ và phạm vi',
        'Trạng từ có thể bổ nghĩa động từ, tính từ, trạng từ khác hoặc cả câu. Vị trí có thể đổi phạm vi của only.',
        'works efficiently / extremely efficient / Fortunately, nobody was hurt.',
      ],
      [
        'Các cặp không đồng nghĩa',
        'Hard là chăm chỉ/mạnh; hardly thường nghĩa hầu như không. Enough đứng sau tính từ/trạng từ nhưng trước danh từ.',
        'works hard / hardly works / clear enough / enough time',
      ],
    ],
    examples: [
      [
        'The instructions seem clear.',
        'The instructions seem clearly.',
        'Clear mô tả instructions sau seem, không mô tả cách seem.',
      ],
      [
        'She explained the procedure clearly.',
        'She explained the procedure clear.',
        'Clearly mô tả cách explained được thực hiện.',
      ],
    ],
    traps: [
      'Friendly thường là tính từ dù có -ly; fast có thể là tính từ hoặc trạng từ.',
      'He works hard và He hardly works gần như đối lập nghĩa.',
    ],
    prediction: [
      'In “The revised plan seems practical”, what does practical describe?',
      [
        ['The speed of seeming', 'Không diễn tả cách seem xảy ra.'],
        ['The plan', 'Tính từ quay về chủ ngữ plan.'],
        ['An omitted action verb', 'Không có động từ hành động bị lược bỏ.'],
      ],
      'B',
      'Động từ nối nối plan với một đặc điểm.',
    ],
    drills: [
      [
        'The new process works more ------- than the old one.',
        [
          ['efficient', 'Ở đây bổ nghĩa cho works.'],
          ['efficiency', 'Danh từ không bổ nghĩa cách works.'],
          ['efficiently', 'Trạng từ mô tả cách hệ thống hoạt động.'],
        ],
        'C',
        'Works efficiently.',
      ],
      [
        'The meeting room is large ------- for twelve people.',
        [
          ['enough', 'Enough đứng sau tính từ large.'],
          ['very', 'Very phải đứng trước tính từ được bổ nghĩa.'],
          ['too', 'Too cũng đứng trước tính từ và còn thay đổi ý nghĩa.'],
        ],
        'A',
        'Large enough: đủ lớn.',
      ],
    ],
  },
  {
    id: 'participial-adjectives',
    title: 'Tính từ -ed/-ing: tác động & trải nghiệm',
    en: 'Participial adjectives',
    chapter: 'modifiers',
    level: 'intermediate',
    aliases: ['interested interesting', 'bored boring', 'tính từ phân từ', 'V-ed V-ing'],
    related: ['adjectives-adverbs', 'passive', 'reduced-relatives'],
    skills: ['word-form', 'passive'],
    vocabulary: ['feedback', 'workshop'],
    plain:
      'Với nhiều cặp cảm xúc, -ing mô tả điều gây ra trải nghiệm; -ed mô tả người có trải nghiệm đó. Nhưng không phải mọi V-ing và V3 đều tuân theo mẹo “vật/người”.',
    why: 'Một người vẫn có thể là interesting vì họ gây hứng thú; một đồ vật có thể là damaged vì nó nhận tác động. Cần xét vai trò nghĩa, không xét người hay vật một cách máy móc.',
    prompt:
      'Giải thích vì sao “an interesting speaker” và “an interested listener” đều nói về người mà dùng hai đuôi khác nhau.',
    checks: [
      'Tôi xác định bên gây tác động và bên trải nghiệm.',
      'Tôi không dùng mẹo “người -ed, vật -ing”.',
      'Tôi phân biệt tính từ với một thì tiếp diễn hoặc cấu trúc bị động.',
    ],
    rules: [
      [
        'Cặp cảm xúc',
        'Interesting/boring/confusing mô tả thứ gây cảm xúc; interested/bored/confused mô tả trạng thái trải nghiệm.',
        'a confusing notice / a confused visitor',
      ],
      [
        'Không phải quy tắc người–vật',
        'Người cũng có thể gây cảm xúc. Phân từ quá khứ của các động từ khác có thể mô tả vật chịu tác động.',
        'an inspiring manager / damaged equipment',
      ],
      [
        'Giới từ đi kèm',
        'Một số tính từ đi cùng giới từ quen dùng; học cả cụm thay vì tự gắn một giới từ cho mọi từ -ed.',
        'interested in / satisfied with / worried about',
      ],
    ],
    examples: [
      [
        'The visitors were confused by the notice.',
        'The visitors were confusing by the notice.',
        'Khách trải nghiệm sự bối rối; dùng confused trong câu này.',
      ],
      [
        'We heard an inspiring speaker.',
        'We heard an inspire speaker.',
        'Cần tính từ inspiring để mô tả người nói truyền cảm hứng; inspire nguyên mẫu không bổ nghĩa speaker như vậy.',
      ],
    ],
    traps: [
      'Hai dạng đôi khi đều đúng ngữ pháp nhưng khác nghĩa; câu hỏi phải chỉ rõ ý định.',
      'Không phải tính từ -ed nào cũng kể chuyện quá khứ: I am interested nói trạng thái hiện tại.',
    ],
    prediction: [
      'Which rule is more reliable for interested/interesting?',
      [
        ['People always take -ed.', 'Một người có thể là interesting.'],
        ['Objects always take -ing.', 'Một vật có thể là damaged.'],
        [
          'Distinguish experiencing interest from causing interest.',
          'Phân biệt vai trò gây và trải nghiệm.',
        ],
      ],
      'C',
      'Vai trò nghĩa đáng tin hơn mẹo người/vật.',
    ],
    drills: [
      [
        'The instructions were -------, so several readers asked for clarification.',
        [
          ['confusing', 'Hướng dẫn gây bối rối.'],
          ['confusedly', 'Trạng từ không phù hợp bổ ngữ này.'],
          ['confuse', 'Nguyên mẫu không đứng sau were như mẫu này.'],
        ],
        'A',
        'Instructions were confusing nói đặc điểm gây khó hiểu.',
      ],
      [
        'We are interested ------- the training course.',
        [
          ['with', 'Cụm chuẩn ở đây là interested in.'],
          ['in', 'Interested in + danh từ/V-ing.'],
          ['at', 'Không phải giới từ của cụm này.'],
        ],
        'B',
        'Interested in the course.',
      ],
    ],
  },
  {
    id: 'inversion',
    title: 'Đảo ngữ: phủ định & giới hạn ở đầu câu',
    en: 'Negative and restrictive inversion',
    chapter: 'advanced',
    level: 'advanced',
    aliases: [
      'never rarely seldom',
      'not until',
      'only after',
      'no sooner than',
      'hardly when',
      'đảo ngữ',
    ],
    related: ['mixed-conditionals', 'questions', 'emphasis-clefts'],
    skills: ['inversion'],
    vocabulary: ['approve', 'invoice'],
    plain:
      'Đưa một cụm phủ định hoặc giới hạn lên đầu có thể làm câu nhấn mạnh hơn. Khi đó trợ động từ thường chuyển lên trước chủ ngữ ở mệnh đề chính.',
    why: 'Hãy giữ nguyên chủ ngữ một lần. “Only after approval did we begin” đảo did và we ở câu chính; after approval không tự trở thành một câu hỏi.',
    prompt:
      'Biến “We did not begin until the manager approved” thành câu bắt đầu bằng “Not until…”. Chỉ đúng mệnh đề nào được đảo và giải thích vì sao không lặp we.',
    checks: [
      'Tôi xác định cụm nào kích hoạt đảo ngữ.',
      'Tôi đảo ở mệnh đề chính sau toàn bộ cụm/mệnh đề giới hạn.',
      'Nếu thêm do/does/did, tôi đưa động từ chính về nguyên mẫu.',
    ],
    rules: [
      [
        'Trợ động từ trước chủ ngữ',
        'Khi never/rarely/seldom… ở đầu để nhấn, đảo trợ động từ/modal với chủ ngữ; nếu chưa có, thêm do/does/did.',
        'Never have we received such clear feedback. / Rarely does she arrive late.',
      ],
      [
        'Not until, only after',
        'Sau cả cụm hoặc mệnh đề đầu, đảo ở mệnh đề chính. Không đảo bên trong mệnh đề until chỉ vì not đứng trước nó.',
        'Not until the audit ended did we approve payment.',
      ],
      [
        'Hai sự việc nối nhau',
        'No sooner…than và hardly/scarcely…when là các mẫu thường gặp. Khi đưa cụm lên đầu, trợ động từ đứng trước chủ ngữ.',
        'No sooner had we arrived than the doors opened.',
      ],
    ],
    examples: [
      [
        'Only after the inspection did we reopen.',
        'Only after the inspection did we reopened.',
        'Did mang thì quá khứ; reopen giữ nguyên mẫu.',
      ],
      [
        'Not until she arrived did the meeting begin.',
        'Not until did she arrive the meeting began.',
        'Đảo did the meeting begin ở câu chính, không đảo she arrived sau until.',
      ],
    ],
    traps: [
      'Only the manager approved không đảo: only đang bổ nghĩa chủ ngữ, không phải trạng ngữ đầu câu.',
      'Không đảo mọi câu có never: We have never… giữ trật tự thông thường.',
    ],
    prediction: [
      'Where does inversion occur in “Not until the audit ended did we pay”?',
      [
        ['Inside the until-clause', 'The audit ended không đảo.'],
        ['In the main clause: did we pay', 'Đảo sau khi đã kết thúc mệnh đề đầu.'],
        ['In both clauses', 'Không đảo cả hai mệnh đề.'],
      ],
      'B',
      'Phạm vi của cấu trúc đầu câu rất quan trọng.',
    ],
    drills: [
      [
        'Only after approval ------- we begin the work.',
        [
          ['did', 'Did we begin là đảo quá khứ đúng.'],
          ['we did', 'Sẽ lặp chủ ngữ we đã có sau chỗ trống.'],
          ['had we', 'Lặp we và sau had phải là begun.'],
        ],
        'A',
        'Did được đặt trước we; begin nguyên mẫu.',
      ],
      [
        'Never ------- such a detailed invoice before.',
        [
          ['we have seen', 'Không đảo sau never đầu câu.'],
          ['have we saw', 'Sau have cần V3 seen.'],
          ['have we seen', 'Have đứng trước we; seen là V3.'],
        ],
        'C',
        'Never have we seen… đúng cấu trúc đảo.',
      ],
    ],
  },
  {
    id: 'reduced-relatives',
    title: 'Rút gọn mệnh đề quan hệ',
    en: 'Reduced relative clauses',
    chapter: 'advanced',
    level: 'advanced',
    aliases: ['reduced relative', 'V-ing V3', 'rút gọn who which that'],
    related: ['relatives', 'passive', 'participle-clauses'],
    skills: ['relative-clauses', 'passive'],
    vocabulary: ['employee', 'equipment'],
    plain:
      'Một cụm ngay sau danh từ có thể là bản gọn của một mệnh đề mô tả. Hãy mở rộng nó ra trước khi chọn V-ing hay V3.',
    why: '“People working here” mô tả người thực hiện công việc. “Equipment stored here” mô tả thiết bị được cất ở đây. Dạng phân từ phản ánh quan hệ chủ động/bị động, không tự xác định thì chính của câu.',
    prompt:
      'Mở rộng “the forms attached to this email” thành mệnh đề đầy đủ. Những forms ấy tự attach hay được attach?',
    checks: [
      'Tôi xác định danh từ mà cụm đang bổ nghĩa.',
      'Tôi mở rộng được thành who/which + động từ.',
      'Tôi không xóa đại từ quan hệ và giữ động từ hữu hạn một cách tùy tiện.',
    ],
    rules: [
      [
        'Người/vật thực hiện',
        'Cụm V-ing có thể thay mệnh đề quan hệ chủ ngữ mang nghĩa chủ động phù hợp.',
        'employees working remotely ≈ employees who are working remotely',
      ],
      [
        'Người/vật nhận tác động',
        'Cụm V3 có thể mô tả nghĩa bị động; thì của mệnh đề được suy từ ngữ cảnh.',
        'the documents attached ≈ the documents that are attached',
      ],
      [
        'Phạm vi rút gọn',
        'Không áp dụng như phép xóa who/which cho mọi câu; cần giữ nghĩa, quan hệ và cấu trúc. Danh từ vẫn cần vị ngữ chính nếu làm chủ ngữ.',
        'The documents attached to the email are confidential.',
      ],
    ],
    examples: [
      [
        'The items listed below are available.',
        'The items list below are available.',
        'Items được liệt kê nên dùng listed, không phải list hữu hạn trong cụm bổ nghĩa.',
      ],
      [
        'The employee handling this request is away.',
        'The employee handle this request is away.',
        'Handling tạo cụm mô tả; is mới là động từ chính.',
      ],
    ],
    traps: [
      'Không nhầm V3 trong cụm bổ nghĩa với động từ quá khứ chính; hãy tìm vị ngữ của cả câu.',
      'Phân từ không giữ mọi sắc thái của mệnh đề đầy đủ; khi dễ hiểu nhầm, giữ câu đầy đủ.',
    ],
    prediction: [
      'In “the forms attached to the email”, how do the forms relate to attaching?',
      [
        ['They receive the action.', 'Forms là thứ được đính kèm.'],
        ['They attach another object.', 'Không phải nghĩa chủ động này.'],
        ['They are the sender.', 'Sender không được nêu ở đây.'],
      ],
      'A',
      'Nghĩa bị động giúp giải thích attached.',
    ],
    drills: [
      [
        'The equipment ------- in this room belongs to the laboratory.',
        [
          ['storing', 'Thiết bị là thứ được cất, không tự cất thứ khác.'],
          ['stored', 'V3 mô tả equipment được cất.'],
          ['store', 'Không tạo cụm bổ nghĩa đúng ở vị trí này.'],
        ],
        'B',
        'Equipment stored in this room tương đương equipment that is stored here.',
      ],
      [
        'The technician ------- the lift has a valid permit.',
        [
          ['repair', 'Thiếu dạng tạo cụm quan hệ rút gọn.'],
          ['repaired', 'Technician là người thực hiện sửa, không phải người được sửa.'],
          ['repairing', 'V-ing mô tả technician thực hiện hành động.'],
        ],
        'C',
        'Repairing the lift mô tả technician; has là động từ chính.',
      ],
    ],
  },
  {
    id: 'participle-clauses',
    title: 'Mệnh đề phân từ & chủ ngữ bị treo',
    en: 'Participle clauses and dangling modifiers',
    chapter: 'advanced',
    level: 'advanced',
    aliases: ['having done', 'dangling modifier', 'mệnh đề phân từ', 'chủ ngữ ngầm'],
    related: ['reduced-relatives', 'passive', 'adverb-clauses'],
    skills: ['sentence-structure', 'passive'],
    vocabulary: ['proposal'],
    plain:
      'Cụm phân từ đầu câu thường mượn chủ ngữ của mệnh đề chính. Nếu hai phần vô tình nói hai người/vật khác nhau, câu có thể thành vô lý.',
    why: 'Trong “Checking the order, Mai noticed an error”, người kiểm và người nhận ra đều là Mai. Nếu viết “Checking the order, an error appeared”, lỗi bỗng thành người đang kiểm theo cấu trúc thông thường.',
    prompt:
      'Giải thích vì sao “Walking into the office, the phone rang” có chủ ngữ bị treo. Viết lại để người đi vào và điện thoại reo đều rõ.',
    checks: [
      'Tôi tìm chủ ngữ ngầm của cụm phân từ.',
      'Tôi kiểm tra nó có trùng chủ ngữ câu chính không.',
      'Tôi giữ mệnh đề đầy đủ nếu hai hành động có chủ thể khác nhau.',
    ],
    rules: [
      [
        'Cùng một chủ thể',
        'Cụm phân từ đầu câu thường dùng cùng chủ ngữ với mệnh đề chính; một số cấu trúc cố định có quy ước riêng.',
        'Reviewing the figures, Mai found an error.',
      ],
      [
        'Chủ động, bị động và trước–sau',
        'V-ing thường chủ động; V3 có thể bị động; having + V3 làm rõ việc đã hoàn tất trước việc ở câu chính.',
        'Having checked the invoice, she approved payment.',
      ],
      [
        'Sửa chủ ngữ bị treo',
        'Nêu người thực hiện trong câu chính hoặc đổi cụm thành mệnh đề đầy đủ có chủ ngữ riêng.',
        'When I entered the office, the phone rang.',
      ],
    ],
    examples: [
      [
        'After checking the order, Mai found a missing item.',
        'After checking the order, a missing item was found.',
        'Câu sai trong cách đọc chuẩn của bài không nêu người kiểm làm chủ ngữ; Mai giúp gắn đúng chủ thể.',
      ],
      [
        'Having finished the audit, they sent the report.',
        'Having finish the audit, they sent the report.',
        'Having cần V3 finished.',
      ],
    ],
    traps: [
      'Đừng rút gọn mệnh đề chỉ vì muốn câu ngắn hơn; giữ rõ người thực hiện.',
      'Nhiều cụm cố định như generally speaking được dùng linh hoạt; không suy ra mọi ví dụ thiếu cùng chủ ngữ đều sai tuyệt đối.',
    ],
    prediction: [
      'Who is understood to be checking in “Checking the invoice, Lan noticed an error”?',
      [
        ['The invoice', 'Invoice nhận hành động kiểm tra.'],
        ['The error', 'Error là thứ được nhận ra.'],
        ['Lan', 'Lan là chủ ngữ được cụm đầu mượn.'],
      ],
      'C',
      'Hai hành động cùng có Lan là người thực hiện.',
    ],
    drills: [
      [
        'Having ------- the application, she requested an interview.',
        [
          ['reviewed', 'Having + V3.'],
          ['review', 'Thiếu dạng phân từ.'],
          ['reviewing', 'Không phải mẫu having + V3.'],
        ],
        'A',
        'Having reviewed làm rõ việc xem hồ sơ xảy ra trước yêu cầu phỏng vấn.',
      ],
      [
        'Choose the clear sentence with the intended meaning “I entered; the phone rang”.',
        [
          ['Entering the office, the phone rang.', 'Dễ hiểu phone là thứ đang đi vào.'],
          [
            'When I entered the office, the phone rang.',
            'Hai chủ thể được nói rõ trong hai mệnh đề.',
          ],
          [
            'Entered the office, the phone rang.',
            'Không tạo đúng mệnh đề thời gian hoặc cụm phân từ theo nghĩa cần.',
          ],
        ],
        'B',
        'Mệnh đề when đầy đủ loại bỏ chủ ngữ bị treo.',
      ],
    ],
  },
  {
    id: 'emphasis-clefts',
    title: 'Câu chẻ & cách nhấn mạnh thông tin',
    en: 'Cleft sentences and emphasis',
    chapter: 'advanced',
    level: 'advanced',
    aliases: ['it is that who', 'what clause', 'cleft', 'câu chẻ', 'do for emphasis'],
    related: ['noun-clauses', 'inversion', 'sentence-structure'],
    skills: ['emphasis', 'sentence-structure'],
    vocabulary: ['approve'],
    plain:
      'Câu chẻ đặt một mẩu thông tin dưới ánh đèn: chính người này, chính thời điểm này, hoặc chính điều này. Nó tổ chức trọng tâm, không tự làm sự việc chắc chắn hơn.',
    why: '“Lan approved it” kể sự việc. “It was Lan who approved it” tách Lan ra để trả lời hoặc sửa hiểu nhầm về người phê duyệt.',
    prompt:
      'Có người nghĩ Minh ký hợp đồng nhưng thực ra Lan ký. Dùng câu chẻ để sửa thông tin và giải thích phần nào được nhấn.',
    checks: [
      'Tôi biết thông tin nào đang được nhấn.',
      'Tôi không lặp một chủ ngữ không cần thiết trong mệnh đề sau.',
      'Tôi phân biệt what-clause với một câu hỏi trực tiếp.',
    ],
    rules: [
      [
        'It-cleft',
        'Dùng it + be + phần nhấn + who/that…; chọn dạng còn lại đủ cấu trúc và phù hợp ý định.',
        'It was Lan who approved the request.',
      ],
      [
        'What-cleft',
        'What-clause có thể đứng như một cụm danh từ; be giới thiệu điều cần nhấn.',
        'What we need is a clear deadline.',
      ],
      [
        'Nhấn bằng do',
        'Do/does/did có thể nhấn khẳng định của động từ thường; động từ sau nó giữ nguyên mẫu.',
        'We did send the invoice.',
      ],
    ],
    examples: [
      [
        'It was Mai who called the supplier.',
        'It was Mai who she called the supplier.',
        'Who đã là chủ ngữ của called; không thêm she.',
      ],
      [
        'We did receive the payment.',
        'We did received the payment.',
        'Did mang thì, receive nguyên mẫu.',
      ],
    ],
    traps: [
      'Không thêm câu chẻ vào mọi câu; dùng khi cần hướng sự chú ý hoặc đối chiếu thông tin.',
      'What we need không phải một câu hỏi có đảo trợ động từ.',
    ],
    prediction: [
      'What is emphasized in “It was Tuesday that we met the auditor”?',
      [
        ['The time of the meeting', 'Tuesday được tách ra làm phần nhấn.'],
        ['The auditor’s identity', 'Auditor không nằm ở vị trí phần nhấn.'],
        ['A new obligation', 'Cấu trúc không tạo nghĩa vụ.'],
      ],
      'A',
      'Phần ngay sau be là trọng tâm của it-cleft.',
    ],
    drills: [
      [
        'It was Hana ------- approved the final version.',
        [
          ['which', 'Which không dùng thay người làm chủ ngữ trong mẫu này.'],
          ['who she', 'Lặp chủ ngữ.'],
          ['who', 'Who làm chủ ngữ của approved và quy chiếu Hana.'],
        ],
        'C',
        'Who approved giữ đủ một chủ ngữ.',
      ],
      [
        'We did ------- your request yesterday.',
        [
          ['receive', 'Động từ nguyên mẫu sau did nhấn mạnh.'],
          ['received', 'Không chia quá khứ lần nữa.'],
          ['receiving', 'Did không theo trực tiếp bởi V-ing.'],
        ],
        'A',
        'Did receive nhấn rằng việc nhận đã xảy ra.',
      ],
    ],
  },
  {
    id: 'ellipsis-substitution',
    title: 'Tỉnh lược & thay thế để tránh lặp',
    en: 'Ellipsis and substitution',
    chapter: 'advanced',
    level: 'advanced',
    aliases: ['ellipsis substitution', 'so do I', 'neither do I', 'one ones', 'do so'],
    related: ['agreement', 'modals', 'pronouns'],
    skills: ['emphasis', 'sentence-structure'],
    vocabulary: ['available', 'equipment'],
    plain:
      'Ta có thể không nhắc lại điều người nghe đã hiểu, nhưng vẫn cần giữ dấu hiệu để phục hồi phần bị bỏ. “I can too” mượn hành động đã nhắc trước đó.',
    why: 'Tỉnh lược không phải xóa từ ngẫu nhiên. Trợ động từ cần khớp với cấu trúc, và one/ones thường thay cho danh từ đếm được chứ không thay mọi cụm danh từ.',
    prompt:
      'Một người nói “I can attend”. Bạn đáp “So can I”. Hãy mở rộng phần bị lược và giải thích vì sao không nói “So do I” ở đây.',
    checks: [
      'Tôi phục hồi được phần đã lược từ ngữ cảnh.',
      'Tôi chọn đúng trợ động từ và chủ ngữ.',
      'Tôi không dùng one để thay một lượng danh từ không đếm được tùy ý.',
    ],
    rules: [
      [
        'Lược sau trợ động từ',
        'Có thể giữ trợ động từ/modal và bỏ phần động từ đã rõ từ ngữ cảnh.',
        'Can you attend? — Yes, I can.',
      ],
      [
        'So/neither + trợ động từ + S',
        'So đồng tình với khẳng định; neither/nor đồng tình với phủ định, dùng trợ động từ thích hợp.',
        'She has finished. — So have I. / He can’t attend. — Neither can I.',
      ],
      [
        'One/ones và do so',
        'One/ones thay danh từ đếm được trong ngữ cảnh phù hợp. Do so thay một hành động, thường dùng trong văn phong trang trọng.',
        'The red folder is full; use the blue one.',
      ],
    ],
    examples: [
      [
        'She can attend, and so can I.',
        'She can attend, and so do I.',
        'Can của khả năng cần được giữ trong lời đồng tình.',
      ],
      [
        'I prefer the smaller ones.',
        'I prefer the smaller one ones.',
        'Không lặp hai từ thay thế cho cùng một vị trí danh từ số nhiều.',
      ],
    ],
    traps: [
      'So do I khác So I do: cái sau có thể xác nhận/nhận ra điều vừa nói với trật tự khác.',
      'I think so/I hope so là các cụm có quy ước; không thay so vào mọi mệnh đề.',
    ],
    prediction: [
      'What is omitted in “I can too” after “She can attend”?',
      [
        ['The subject I', 'I vẫn được nêu.'],
        ['The action attend', 'Attend được hiểu từ câu trước.'],
        ['The modal can', 'Can vẫn có mặt.'],
      ],
      'B',
      'Người nghe phục hồi can attend từ ngữ cảnh.',
    ],
    drills: [
      [
        'He has completed the form, and so ------- I.',
        [
          ['do', 'Câu gốc dùng has completed, cần have.'],
          ['am', 'Am không khớp thể hoàn thành này.'],
          ['have', 'I have completed → so have I.'],
        ],
        'C',
        'Trợ động từ have mang thể hoàn thành.',
      ],
      [
        'I cannot attend. — Neither ------- I.',
        [
          ['can', 'Can khớp modal trong câu trước.'],
          ['do', 'Do không thay can ở đây.'],
          ['am', 'Am không là trợ động từ của khả năng này.'],
        ],
        'A',
        'Neither can I: tôi cũng không thể tham dự.',
      ],
    ],
  },
  {
    id: 'parallelism',
    title: 'Cấu trúc song song & liên từ cặp',
    en: 'Parallel structures and paired conjunctions',
    chapter: 'advanced',
    level: 'advanced',
    aliases: ['parallelism', 'not only but also', 'both and', 'either or', 'neither nor'],
    related: ['connectors', 'agreement', 'verb-patterns'],
    skills: ['sentence-structure', 'connectors'],
    vocabulary: ['submit'],
    plain:
      'Các ý cùng vai trò nên mặc cùng một kiểu cấu trúc. Một danh sách việc làm sẽ dễ hiểu hơn khi các mục đều bắt đầu bằng dạng động từ tương ứng.',
    why: 'Both…and, either…or, not only…but also đặt hai thành phần lên cùng một bàn cân. Chúng cần nối các đơn vị có thể làm cùng công việc trong câu.',
    prompt:
      'Sửa “The role involves reviewing orders, to contact suppliers and preparing reports”. Hãy giải thích vì sao sửa theo vai trò của involves chứ không chỉ nhìn đuôi từ.',
    checks: [
      'Tôi xác định hai thành phần đang làm cùng chức năng.',
      'Tôi đặt liên từ cặp sát hai đơn vị cần nối.',
      'Tôi không nhầm yêu cầu song song với việc mọi từ phải có cùng đuôi.',
    ],
    rules: [
      [
        'Song song sau một từ chi phối',
        'Các mục cùng phụ thuộc vào involves nên cùng mang dạng V-ing; sau can có thể là nhiều động từ nguyên mẫu.',
        'involves checking, filing and reporting / can check, file and report',
      ],
      [
        'Liên từ cặp',
        'Đặt both/either/not only sao cho hai phía có cùng phạm vi ngữ pháp và nghĩa.',
        'both accurate and concise / either email us or call reception',
      ],
      [
        'Cân bằng vẫn phải đúng nghĩa',
        'Hai phía không cần giống hệt độ dài hay đuôi từ, nhưng phải phù hợp vai trò. Hòa hợp của neither/either cần xét toàn bộ cấu trúc và phương ngữ.',
        'The report is both useful and easy to read.',
      ],
    ],
    examples: [
      [
        'The job involves filing reports and checking invoices.',
        'The job involves filing reports and to check invoices.',
        'Cả hai mục là bổ ngữ của involves nên dùng V-ing.',
      ],
      [
        'The guide is both clear and useful.',
        'The guide is both clearly and useful.',
        'Hai tính từ cùng mô tả guide; clearly là trạng từ nên không phù hợp.',
      ],
    ],
    traps: [
      'Not only ở đầu câu có thể kích hoạt đảo ngữ; not only giữa câu không tự động đảo.',
      'Không sửa một cụm đúng nghĩa chỉ để mọi mục có cùng số từ.',
    ],
    prediction: [
      'What should be parallel in a coordinated list?',
      [
        ['Only the number of letters', 'Độ dài từ không quyết định song song.'],
        ['The grammatical role and compatible structure', 'Cùng chức năng và cấu trúc tương ứng.'],
        ['Every suffix, even when the roles differ', 'Cùng đuôi không đảm bảo câu đúng.'],
      ],
      'B',
      'Xét chức năng trước, hình thức sau.',
    ],
    drills: [
      [
        'The role involves checking stock and ------- deliveries.',
        [
          ['to arrange', 'Involves cần các mục V-ing ở danh sách này.'],
          ['arrange', 'Không song song với checking dưới involves.'],
          ['arranging', 'Checking và arranging cùng làm bổ ngữ V-ing.'],
        ],
        'C',
        'Involves checking ... and arranging ...',
      ],
      [
        'The new system is both reliable and -------.',
        [
          ['efficiency', 'Danh từ không song song với reliable tính từ.'],
          ['efficient', 'Cùng là tính từ mô tả system.'],
          ['efficiently', 'Trạng từ không phù hợp bổ ngữ chủ ngữ này.'],
        ],
        'B',
        'Both reliable and efficient.',
      ],
    ],
  },
]
export const advancedEntries = drafts.map(entry)
