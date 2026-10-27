import { entry, type LessonDraft } from './model'

const drafts: LessonDraft[] = [
  {
    id: 'sentence-structure',
    title: 'Bộ khung câu & mệnh đề',
    en: 'Sentence structure',
    chapter: 'foundations',
    level: 'foundation',
    aliases: ['S V O', 'câu đơn', 'câu ghép', 'câu phức', 'phủ định', 'run-on'],
    related: ['word-forms', 'connectors', 'noun-clauses'],
    skills: ['sentence-structure'],
    vocabulary: ['employee', 'submit'],
    plain:
      'Một câu giống một thông báo: cần biết ai/cái gì và điều gì xảy ra. Một cụm dài chưa chắc đã là một câu hoàn chỉnh.',
    why: 'Động từ hữu hạn mang thì và nối với chủ ngữ. Cụm “after the meeting” chỉ bối cảnh; “after the meeting ended” có mệnh đề nhưng vẫn cần ý chính nếu đứng riêng.',
    prompt:
      'Giải thích cho người mới học vì sao “Because the office closed early” chưa đủ làm một câu độc lập. Thêm một ý chính của bạn.',
    checks: [
      'Tôi chỉ ra chủ ngữ và động từ hữu hạn.',
      'Tôi phân biệt cụm từ với mệnh đề.',
      'Tôi biết hai câu độc lập không nối chỉ bằng một dấu phẩy.',
    ],
    rules: [
      [
        'Bắt đầu từ S + V',
        'Động từ quyết định có cần tân ngữ hay bổ ngữ hay không. Be nối với thông tin mô tả chủ ngữ.',
        'The team arrived. / The team submitted a proposal. / The team is ready.',
      ],
      [
        'Câu ghép và câu phức',
        'And/but/so có thể nối hai mệnh đề độc lập. Because/although tạo mệnh đề phụ đi với mệnh đề chính.',
        'S + V, but S + V. / Because S + V, S + V.',
      ],
      [
        'Phủ định đúng vị trí',
        'Với hiện tại/quá khứ đơn của động từ thường, dùng do/does/did not và đưa động từ về nguyên mẫu. Với be hoặc modal, đặt not sau chúng.',
        'She does not work here. / He is not available.',
      ],
    ],
    examples: [
      [
        'The office was closed, so we worked remotely.',
        'The office was closed, we worked remotely.',
        'Hai câu độc lập cần liên từ hoặc dấu chấm/chấm phẩy; dấu phẩy riêng gây nối câu sai.',
      ],
      [
        'The assistant did not submit the form.',
        'The assistant did not submitted the form.',
        'Did mang thì quá khứ; submit giữ nguyên mẫu.',
      ],
    ],
    traps: [
      'Không đếm động từ bằng cách tìm mọi từ đuôi -ing: reviewing có thể chỉ là một phần cụm.',
      'Câu mệnh lệnh như “Please wait” có chủ ngữ you được hiểu ngầm.',
    ],
    prediction: [
      'Which is a complete independent sentence?',
      [
        ['Because the meeting ended.', 'Because mở mệnh đề phụ, chưa có ý chính.'],
        ['The meeting ended early.', 'Có chủ ngữ meeting và động từ hữu hạn ended.'],
        ['After the meeting.', 'Chỉ là cụm giới từ.'],
      ],
      'B',
      'The meeting ended early tự truyền đạt một ý hoàn chỉnh.',
    ],
    drills: [
      [
        'The branch ------- open on Sundays.',
        [
          ['does not', 'Open ở đây là tính từ; cần be.'],
          ['is not', 'Is nối chủ ngữ với tính từ open.'],
          ['not', 'Thiếu động từ hữu hạn.'],
        ],
        'B',
        'The branch is not open: không mở cửa.',
      ],
      [
        'Choose the correctly joined sentence.',
        [
          ['It rained, the event moved indoors.', 'Dấu phẩy không đủ nối hai câu độc lập.'],
          ['Because it rained.', 'Mệnh đề phụ chưa có ý chính.'],
          [
            'Because it rained, the event moved indoors.',
            'Có mệnh đề nguyên nhân và mệnh đề chính.',
          ],
        ],
        'C',
        'Because nối nguyên nhân với một kết quả được diễn đạt bằng câu chính.',
      ],
    ],
  },
  {
    id: 'nouns-countability',
    title: 'Danh từ đếm được & không đếm được',
    en: 'Countability and noun phrases',
    chapter: 'foundations',
    level: 'foundation',
    aliases: ['countable', 'uncountable', 'số ít', 'số nhiều', 'information', 'advice'],
    related: ['articles', 'determiners-quantifiers', 'agreement'],
    skills: ['noun-phrases', 'agreement'],
    vocabulary: ['equipment', 'luggage', 'feedback'],
    plain:
      'Có thứ ta đếm từng món, có thứ tiếng Anh xem như một lượng chung. Muốn đếm lượng chung, thêm đơn vị như piece hoặc item.',
    why: 'Cách ngôn ngữ chia sự vật không luôn giống tiếng Việt. Advice và equipment thường không nhận a/an hoặc -s trong nghĩa thông dụng; đếm bằng pieces of advice/equipment.',
    prompt:
      'Hãy dạy một người bạn cách nói “hai lời khuyên” và giải thích vì sao không dùng “two advices”.',
    checks: [
      'Tôi xác định danh từ theo nghĩa đang dùng.',
      'Tôi chọn được đơn vị nếu cần đếm.',
      'Tôi chia động từ theo danh từ trung tâm, không theo of equipment.',
    ],
    rules: [
      [
        'Đếm từng đơn vị',
        'Danh từ đếm được số ít thường cần từ hạn định; số nhiều có thể đứng không mạo từ khi nói chung.',
        'a report / two reports / Reports need clear titles.',
      ],
      [
        'Lượng chung',
        'Information, advice, luggage và equipment thường là không đếm được; dùng some hoặc một đơn vị đo.',
        'some information / two pieces of equipment',
      ],
      [
        'Nghĩa có thể đổi',
        'Coffee có thể là đồ uống nói chung hoặc một suất cà phê. Đừng gắn một nhãn tuyệt đối cho mọi nghĩa của một từ.',
        'Coffee is popular. / Two coffees, please.',
      ],
    ],
    examples: [
      [
        'We need some new equipment.',
        'We need a new equipment.',
        'Equipment trong nghĩa này không đi với a; có thể nói a new piece of equipment.',
      ],
      [
        'Two pieces of luggage are missing.',
        'Two pieces of luggage is missing.',
        'Trung tâm là pieces số nhiều, nên dùng are.',
      ],
    ],
    traps: [
      'Không dịch từng chữ từ cấu trúc đếm của tiếng Việt.',
      'News có -s nhưng thường đi với động từ số ít: The news is good.',
    ],
    prediction: [
      'How can you count individual suggestions described as advice?',
      [
        ['Two advices', 'Advice không dùng số nhiều này trong nghĩa lời khuyên thông thường.'],
        ['Two pieces of advice', 'Piece cung cấp đơn vị đếm.'],
        ['An advice', 'A/an không đi trực tiếp với advice.'],
      ],
      'B',
      'Đếm pieces, giữ advice ở dạng không đếm được.',
    ],
    drills: [
      [
        'The new equipment ------- ready for delivery.',
        [
          ['is', 'Equipment là danh từ không đếm được số ít về ngữ pháp.'],
          ['are', 'Không chia số nhiều chỉ vì gồm nhiều món.'],
          ['be', 'Câu cần động từ hữu hạn hiện tại.'],
        ],
        'A',
        'Equipment is ready.',
      ],
      [
        'Please send us two ------- of information about the venue.',
        [
          ['informations', 'Không dùng informations ở nghĩa này.'],
          ['an information', 'Không thể đứng sau two và information không đếm trực tiếp.'],
          ['pieces', 'Two pieces of information là cách đếm phù hợp.'],
        ],
        'C',
        'Two bổ nghĩa cho pieces, không biến information thành danh từ đếm được.',
      ],
    ],
  },
  {
    id: 'articles',
    title: 'Mạo từ a, an, the & không mạo từ',
    en: 'Articles and zero article',
    chapter: 'foundations',
    level: 'intermediate',
    aliases: ['mạo từ', 'a an the', 'zero article'],
    related: ['nouns-countability', 'determiners-quantifiers'],
    skills: ['noun-phrases'],
    vocabulary: ['invoice', 'employee'],
    plain:
      'A/an giới thiệu một thành viên chưa xác định. The giúp người nghe nhận ra đúng đối tượng. Không mạo từ thường dùng khi nói chung bằng số nhiều hoặc danh từ không đếm được.',
    why: 'Mạo từ là dấu hiệu “bạn đã biết tôi đang nói cái nào chưa?”. Nó phụ thuộc vào kiến thức chung và ngữ cảnh, không chỉ việc từ đó xuất hiện lần đầu hay lần hai.',
    prompt:
      'Dùng một chiếc hóa đơn để kể hai câu: lần đầu giới thiệu nó, lần sau chỉ đúng nó. Giải thích lựa chọn mạo từ.',
    checks: [
      'Tôi xét người nghe có xác định được đối tượng không.',
      'Tôi chọn a/an theo âm đầu, không theo chữ viết.',
      'Tôi phân biệt nói chung với chỉ một nhóm cụ thể.',
    ],
    rules: [
      [
        'A/an: một đối tượng',
        'Dùng với danh từ đếm được số ít. Chọn an trước âm nguyên âm, a trước âm phụ âm.',
        'an hour / a university / an invoice',
      ],
      [
        'The: đối tượng nhận diện được',
        'Có thể nhận diện từ lần nhắc trước, ngữ cảnh chung hoặc cụm mô tả xác định.',
        'I received an invoice. The invoice is incorrect.',
      ],
      [
        'Không mạo từ khi khái quát',
        'Danh từ số nhiều hoặc không đếm được có thể nói chung; thêm the khi nói đúng nhóm/lượng cụ thể.',
        'Employees need feedback. / The employees in this room are new.',
      ],
    ],
    examples: [
      [
        'We need an hour to finish.',
        'We need a hour to finish.',
        'Hour mở đầu bằng âm nguyên âm vì h câm.',
      ],
      [
        'She is a university employee.',
        'She is an university employee.',
        'University bắt đầu bằng âm /j/, một phụ âm.',
      ],
    ],
    traps: [
      'Không chọn the chỉ vì “nghe trang trọng”; phải có tính xác định.',
      'Tên riêng và các cụm cố định có quy ước riêng; quy tắc khái quát không thay thế mọi ngoại lệ.',
    ],
    prediction: [
      'What determines a versus an?',
      [
        ['The first written letter only', 'Chữ viết không phản ánh đầy đủ âm đầu.'],
        ['The length of the noun', 'Độ dài không quyết định mạo từ.'],
        ['The first pronounced sound', 'Âm đầu quyết định a/an.'],
      ],
      'C',
      'An hour nhưng a university cho thấy cần nghe âm.',
    ],
    drills: [
      [
        'An auditor arrived this morning. ------- auditor is waiting in reception.',
        [
          ['An', 'Ở câu sau người nghe đã nhận diện auditor vừa nhắc.'],
          ['The', 'The chỉ đúng người đã giới thiệu.'],
          ['No article', 'Danh từ đếm được số ít auditor cần từ hạn định ở đây.'],
        ],
        'B',
        'Lần nhắc sau chỉ đúng auditor ấy, nên dùng the.',
      ],
      [
        'Choose the general statement.',
        [
          ['The employees in Room 2 need badges.', 'Chỉ một nhóm nhân viên cụ thể.'],
          ['An employee at the desk needs a badge.', 'Nói một cá nhân.'],
          [
            'Employees need clear instructions.',
            'Employees số nhiều không mạo từ khái quát về nhân viên.',
          ],
        ],
        'C',
        'Không mạo từ trước danh từ số nhiều có thể diễn tả ý khái quát.',
      ],
    ],
  },
  {
    id: 'determiners-quantifiers',
    title: 'Từ hạn định & lượng từ',
    en: 'Determiners and quantifiers',
    chapter: 'foundations',
    level: 'intermediate',
    aliases: ['some any', 'few little', 'much many', 'each every', 'all both neither'],
    related: ['nouns-countability', 'agreement', 'articles'],
    skills: ['noun-phrases', 'agreement'],
    vocabulary: ['applicant', 'feedback'],
    plain:
      'Lượng từ trả lời “bao nhiêu?” hoặc “những ai?”. Chọn từ theo loại danh từ và xem người nói muốn nhấn vào có đủ hay gần như không có.',
    why: 'A few/a little thừa nhận vẫn có một ít; few/little thường nhấn vào lượng ít hơn mong muốn. Sự khác biệt là ý nghĩa, không chỉ thêm một chữ a.',
    prompt:
      'Giải thích cho bạn tuyển dụng khác nhau giữa “a few applicants” và “few applicants”. Đừng chỉ dịch cả hai là “ít”.',
    checks: [
      'Tôi kiểm tra danh từ đếm được hay không.',
      'Tôi giải thích được sắc thái của a few và few.',
      'Tôi biết each/every không làm động từ thành số nhiều.',
    ],
    rules: [
      [
        'Ghép lượng từ với danh từ',
        'Many/few đi với số nhiều đếm được; much/little đi với danh từ không đếm được. A lot of dùng được với cả hai.',
        'many applicants / little feedback / a lot of equipment',
      ],
      [
        'Một ít và gần như không',
        'A few/a little có sắc thái còn một ít; few/little thường hàm ý thiếu. Đọc ngữ cảnh để chọn.',
        'We have a few seats left. / We have few options.',
      ],
      [
        'Phạm vi của nhóm',
        'All/both có thể xác định cả nhóm; each/every phân bố từng thành viên. Each of + nhóm số nhiều vẫn thường dùng động từ số ít.',
        'Both rooms are open. / Each of the rooms is clean.',
      ],
    ],
    examples: [
      [
        'We received very little feedback.',
        'We received very few feedback.',
        'Feedback không đếm được trong nghĩa ý kiến phản hồi.',
      ],
      [
        'Each applicant has a reference number.',
        'Each applicant have a reference number.',
        'Each applicant là chủ ngữ số ít.',
      ],
    ],
    traps: [
      'Some thường gặp trong đề nghị/lời mời: Would you like some coffee? Không máy móc chọn any cho mọi câu hỏi.',
      'Neither of + số nhiều có biến thể hòa hợp trong dùng thực tế; trong văn phong trang trọng thường ưu tiên số ít.',
    ],
    prediction: [
      'Which phrase suggests that some seats remain available?',
      [
        ['A few seats', 'A few xác nhận vẫn còn vài chỗ.'],
        ['Very little seats', 'Little không đi với seats số nhiều đếm được.'],
        ['Much seats', 'Much không đi với seats trong nghĩa này.'],
      ],
      'A',
      'A few + danh từ đếm được số nhiều.',
    ],
    drills: [
      [
        'There is very ------- time left, so please finish now.',
        [
          ['few', 'Time là lượng không đếm được ở đây.'],
          ['many', 'Many cần danh từ đếm được số nhiều.'],
          ['little', 'Very little time nhấn mạnh gần hết thời gian.'],
        ],
        'C',
        'Little ghép với time và phù hợp ngữ cảnh gấp.',
      ],
      [
        '------- of the two entrances are accessible.',
        [
          ['Both', 'Both nói cả hai và đi với are.'],
          ['Each', 'Each thường đi với is, không phải are.'],
          ['Every', 'Không dùng every of theo cấu trúc này.'],
        ],
        'A',
        'Both of the two entrances are accessible.',
      ],
    ],
  },
  {
    id: 'pronouns',
    title: 'Đại từ & cách quy chiếu',
    en: 'Pronouns and reference',
    chapter: 'foundations',
    level: 'foundation',
    aliases: ['he him his', 'they them', 'it this that', 'reflexive', 'đại từ phản thân'],
    related: ['possessives', 'relatives', 'sentence-structure'],
    skills: ['pronoun-reference'],
    vocabulary: ['colleague', 'customer'],
    plain:
      'Đại từ là cách nhắc lại mà không lặp tên. Muốn chọn đúng, xác định nó thay cho ai/cái gì và đang làm nhiệm vụ nào trong câu.',
    why: 'She là người thực hiện trong vai trò chủ ngữ; her có thể là tân ngữ hoặc từ sở hữu trước danh từ. Myself chỉ quay về chính chủ ngữ I, không phải phiên bản lịch sự hơn của me.',
    prompt:
      'Giải thích vì sao “Please email me” thường đúng hơn “Please email myself”. Chủ ngữ ngầm của lời yêu cầu là ai?',
    checks: [
      'Tôi chỉ ra được đối tượng mà đại từ thay thế.',
      'Tôi phân biệt chủ ngữ, tân ngữ và sở hữu.',
      'Tôi chỉ dùng phản thân khi quay lại chính chủ ngữ hoặc để nhấn mạnh.',
    ],
    rules: [
      [
        'Chọn theo vai trò',
        'I/he/she/we/they làm chủ ngữ; me/him/her/us/them làm tân ngữ, kể cả sau giới từ.',
        'She called him. / Please reply to us.',
      ],
      [
        'Phản thân có điểm quay về',
        'Dùng myself/yourself… khi chủ ngữ tác động lên chính mình hoặc nhấn mạnh chính người ấy làm.',
        'I introduced myself. / The manager checked it herself.',
      ],
      [
        'Quy chiếu phải rõ',
        'It/they thường thay danh từ đã xác định; this/that có thể thay cả ý. Nếu có hai đối tượng cùng phù hợp, lặp danh từ sẽ rõ hơn.',
        'The invoice was incomplete. This delayed payment.',
      ],
    ],
    examples: [
      [
        'Please send the figures to Maria and me.',
        'Please send the figures to Maria and I.',
        'Sau giới từ to cần tân ngữ me, dù nằm trong cụm có and.',
      ],
      [
        'She prepared the report herself.',
        'She prepared the report himself.',
        'Đại từ nhấn mạnh quay về she nên là herself.',
      ],
    ],
    traps: [
      'Đại từ số ít they dùng cho người không xác định giới là cách dùng được chấp nhận; không tự xem là sai.',
      'Myself không thay me chỉ vì câu mang tính công việc.',
    ],
    prediction: [
      'In “I introduced myself”, what does myself refer to?',
      [
        ['The listener', 'Myself quay về I, không phải người nghe.'],
        [
          'The speaker, who is also the subject',
          'Người giới thiệu và người được giới thiệu là cùng một người.',
        ],
        ['An unnamed colleague', 'Không có đồng nghiệp nào được nhắc.'],
      ],
      'B',
      'Đó là quan hệ phản thân, không phải phép lịch sự.',
    ],
    drills: [
      [
        'Please contact Hana or ------- if you need assistance.',
        [
          ['I', 'Đây là tân ngữ của contact.'],
          ['my', 'My cần danh từ đi sau.'],
          ['me', 'Me là đại từ tân ngữ.'],
        ],
        'C',
        'Contact cần tân ngữ; Hana or me.',
      ],
      [
        'The directors introduced ------- at the beginning of the workshop.',
        [
          ['themselves', 'Directors là chủ ngữ số nhiều và tự giới thiệu.'],
          ['itself', 'Itself không quay về một nhóm người.'],
          ['their', 'Their phải bổ nghĩa cho danh từ.'],
        ],
        'A',
        'They introduced themselves: chính họ tự giới thiệu.',
      ],
    ],
  },
  {
    id: 'possessives',
    title: 'Sở hữu & cụm danh từ ghép',
    en: 'Possession and noun modifiers',
    chapter: 'foundations',
    level: 'intermediate',
    aliases: ['apostrophe', "'s", "s'", 'my mine', 'noun noun'],
    related: ['pronouns', 'articles', 'nouns-countability'],
    skills: ['noun-phrases', 'pronoun-reference'],
    vocabulary: ['customer', 'employee'],
    plain:
      'Sở hữu cho biết cái gì gắn với ai. Danh từ đứng trước một danh từ khác cũng có thể chỉ loại, như “training room”, chứ không phải lúc nào cũng là sở hữu.',
    why: 'My là nhãn cần gắn lên một danh từ; mine đã thay cả cụm danh từ. Dấu nháy phân biệt một người sở hữu với nhiều người sở hữu, không dùng để tạo số nhiều thông thường.',
    prompt:
      'Dùng một chiếc laptop để dạy sự khác nhau giữa “my laptop”, “mine” và “the manager’s laptop”.',
    checks: [
      'Tôi biết sau my/their cần danh từ.',
      'Tôi xác định có một hay nhiều người sở hữu.',
      'Tôi không dùng dấu nháy để viết số nhiều thường.',
    ],
    rules: [
      [
        'Một người, nhiều người',
        'Thêm ’s cho danh từ số ít và số nhiều bất quy tắc; với số nhiều đã có s, thường đặt dấu nháy sau s.',
        'the employee’s badge / the employees’ badges / the children’s books',
      ],
      [
        'Từ sở hữu và đại từ sở hữu',
        'My/your/her/their đi trước danh từ; mine/yours/hers/theirs đứng thay cả cụm.',
        'This is my desk. / This desk is mine.',
      ],
      [
        'Danh từ bổ nghĩa danh từ',
        'Danh từ đầu thường chỉ loại và ở dạng số ít, nhưng có những cụm cố định dùng số nhiều. Tra cụm thay vì đặt quy tắc tuyệt đối.',
        'a training room / a customer survey / a sales report',
      ],
    ],
    examples: [
      [
        'The blue folder is hers.',
        'The blue folder is her.',
        'Hers thay cả cụm sở hữu; her cần một danh từ nếu dùng làm từ sở hữu.',
      ],
      [
        'The employees work upstairs.',
        'The employee’s work upstairs.',
        'Ở đây chỉ cần danh từ số nhiều employees làm chủ ngữ; không phải sở hữu.',
      ],
    ],
    traps: [
      'Its là sở hữu; it’s là it is/it has. Không hoán đổi theo cảm giác.',
      'Dấu nháy trong một tên riêng có thể theo quy ước của tên đó; không sửa tên tổ chức tùy ý.',
    ],
    prediction: [
      'Which word can replace “my desk” without another noun?',
      [
        ['My', 'My cần danh từ theo sau.'],
        ['Mine', 'Mine thay cả cụm my desk.'],
        ['Me', 'Me là tân ngữ, không thể hiện sở hữu.'],
      ],
      'B',
      'Mine là đại từ sở hữu.',
    ],
    drills: [
      [
        'This access card is -------, not yours.',
        [
          ['my', 'My cần danh từ theo sau.'],
          ['me', 'Me không là bổ ngữ sở hữu.'],
          ['mine', 'Mine đứng độc lập chỉ thẻ của tôi.'],
        ],
        'C',
        'Mine thay cho my access card.',
      ],
      [
        'Choose the phrase meaning “the office used by several managers”.',
        [
          ['the managers’ office', 'Managers đã là số nhiều, dấu nháy ở sau s.'],
          ['the manager’s office', 'Chỉ một manager sở hữu/dùng văn phòng.'],
          ['the managers office’s', 'Đặt dấu nháy sau office làm sai quan hệ đang diễn đạt.'],
        ],
        'A',
        'Managers’ chỉ sở hữu của nhiều managers.',
      ],
    ],
  },
]
export const foundationEntries = drafts.map(entry)
