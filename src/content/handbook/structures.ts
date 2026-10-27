import { entry, type LessonDraft } from './model'

const drafts: LessonDraft[] = [
  {
    id: 'modal-perfects',
    title: 'Modal + have: suy đoán & nhìn lại',
    en: 'Modal perfects',
    chapter: 'verbs',
    level: 'advanced',
    aliases: ['must have', 'should have', 'could have', 'might have', 'suy đoán quá khứ'],
    related: ['modals', 'present-perfect-past', 'conditionals'],
    skills: ['modals'],
    vocabulary: ['delivery', 'deadline'],
    plain:
      'Modal + have + V3 giúp nhìn lại một việc trước đó: đoán nó đã xảy ra, nói điều đáng lẽ nên làm hoặc một khả năng đã không được thực hiện.',
    why: 'Must have diễn tả suy luận mạnh của người nói, không phải sự thật đã xác minh. Should have thường diễn tả mong đợi hoặc lời trách về điều đáng lẽ nên làm; ngữ cảnh quyết định sắc thái.',
    prompt:
      'Bưu kiện biến mất và bạn nói “The courier must have collected it”. Vì sao câu này là suy luận chứ chưa phải bằng chứng? Đổi sang “might have” thì sắc thái gì thay đổi?',
    checks: [
      'Tôi phân biệt suy đoán với bằng chứng.',
      'Tôi không dịch must have thành nghĩa vụ quá khứ.',
      'Tôi giữ modal + have + phân từ, không chia has.',
    ],
    rules: [
      [
        'Suy đoán quá khứ',
        'Must have gợi suy luận mạnh; might/may/could have nêu khả năng, không khẳng định chắc chắn.',
        'She must have left. / She might have left.',
      ],
      [
        'Lời nhìn lại',
        'Should have + V3 có thể nói điều đáng lẽ nên làm hoặc điều được kỳ vọng đã xảy ra; xem ngữ cảnh.',
        'We should have checked the address.',
      ],
      [
        'Phủ định đúng nghĩa',
        'Can’t/couldn’t have có thể bác bỏ khả năng quá khứ; didn’t have to chỉ không có nghĩa vụ.',
        'He can’t have signed it; he was abroad.',
      ],
    ],
    examples: [
      [
        'She may have missed the train.',
        'She may has missed the train.',
        'Sau modal dùng have nguyên mẫu.',
      ],
      [
        'We should have notified the customer.',
        'We should have notify the customer.',
        'Have trong chuỗi này cần V3 notified.',
      ],
    ],
    traps: [
      'Could have không luôn có nghĩa “đã làm”; có thể chỉ khả năng chưa thực hiện.',
      'Needn’t have done thường hàm ý đã làm nhưng không cần; didn’t need to do không tự xác nhận đã làm hay chưa.',
    ],
    prediction: [
      'What does “The courier must have left” primarily express?',
      [
        ['A strong inference about an earlier event', 'Đây là suy luận về quá khứ.'],
        ['A future obligation', 'Must have left không diễn tả nghĩa vụ tương lai.'],
        ['A verified tracking record', 'Cấu trúc không tự cung cấp chứng cứ xác minh.'],
      ],
      'A',
      'Must have diễn tả góc đánh giá của người nói.',
    ],
    drills: [
      [
        'They should have ------- the revised address.',
        [
          ['checking', 'Không dùng have + V-ing trong chuỗi này.'],
          ['checked', 'Should have + V3.'],
          ['check', 'Thiếu dạng phân từ.'],
        ],
        'B',
        'Should have checked nói việc đáng lẽ cần kiểm tra.',
      ],
      [
        'The office may have ------- early yesterday.',
        [
          ['close', 'Cần V3.'],
          ['closing', 'Thiếu been nếu muốn tiếp diễn.'],
          ['closed', 'May have closed là suy đoán quá khứ.'],
        ],
        'C',
        'Closed là phân từ trong may have closed.',
      ],
    ],
  },
  {
    id: 'causatives',
    title: 'Nhờ, thuê & khiến ai làm việc',
    en: 'Causative have, get, make and let',
    chapter: 'verbs',
    level: 'advanced',
    aliases: ['have something done', 'get something done', 'make let', 'causative'],
    related: ['passive', 'verb-patterns'],
    skills: ['verb-patterns', 'passive'],
    vocabulary: ['repair', 'equipment'],
    plain:
      'Đôi khi chủ ngữ sắp xếp để việc được làm, chứ không tự tay làm. “Have the printer repaired” nói máy in được sửa theo sự thu xếp của mình.',
    why: 'Sau have, nếu nêu người thực hiện thì dùng người + nguyên mẫu; nếu nêu vật chịu tác động thì dùng vật + V3. Cấu trúc thay đổi theo vai trò, không phải vì repair có nghĩa khác.',
    prompt:
      'Giải thích cho đồng nghiệp khác nhau giữa “I repaired the printer” và “I had the printer repaired”. Ai trực tiếp sửa trong mỗi câu?',
    checks: [
      'Tôi phân biệt người thực hiện và vật chịu tác động.',
      'Tôi biết get someone to do khác have someone do.',
      'Tôi không tự suy ra mọi have + vật + V3 đều là dịch vụ được chủ ý thuê.',
    ],
    rules: [
      [
        'Thu xếp cho vật được xử lý',
        'Have/get + vật + V3 diễn tả thu xếp hoặc trải nghiệm một việc tác động lên vật; đọc ngữ cảnh.',
        'We had the lift inspected.',
      ],
      [
        'Nêu người làm',
        'Have someone do; get someone to do. Động từ sau have trong mẫu chủ động không có to.',
        'We had a technician inspect it. / We got a technician to inspect it.',
      ],
      [
        'Make và let',
        'Make/let + người + nguyên mẫu; bị động của make thường lấy lại to.',
        'They made us wait. / We were made to wait.',
      ],
    ],
    examples: [
      [
        'We had the air conditioner repaired.',
        'We had the air conditioner repair.',
        'Máy là vật được sửa, nên dùng repaired.',
      ],
      [
        'She got the supplier to send a replacement.',
        'She got the supplier send a replacement.',
        'Get + người + to-infinitive.',
      ],
    ],
    traps: [
      'I had my bag stolen thường là trải nghiệm bị mất cắp, không phải thuê người lấy túi.',
      'Không dùng cùng một mẫu cho tất cả have/get/make/let.',
    ],
    prediction: [
      'In “We had the printer repaired”, what is the printer’s role?',
      [
        ['The person arranging the service', 'Printer không phải người sắp xếp.'],
        ['The thing receiving the action', 'Máy là thứ được sửa.'],
        ['The technician doing the repair', 'Kỹ thuật viên có thể không được nêu.'],
      ],
      'B',
      'Vai trò bị tác động giải thích repaired.',
    ],
    drills: [
      [
        'We will have the windows ------- tomorrow.',
        [
          ['cleaning', 'Cửa sổ nhận hành động, không tự lau.'],
          ['clean', 'Cần V3 ở mẫu have + vật.'],
          ['cleaned', 'Have the windows cleaned: thu xếp lau cửa.'],
        ],
        'C',
        'Cleaned là phân từ chỉ hành động tác động lên windows.',
      ],
      [
        'The manager got a technician ------- the scanner.',
        [
          ['to inspect', 'Get + người + to do.'],
          ['inspect', 'Đây là mẫu của have/make, không phải get trong câu này.'],
          ['inspected', 'Technician là người thực hiện, không là vật được kiểm tra.'],
        ],
        'A',
        'Got a technician to inspect nêu rõ người được nhờ.',
      ],
    ],
  },
  {
    id: 'phrasal-verbs',
    title: 'Cụm động từ & vị trí tân ngữ',
    en: 'Phrasal and prepositional verbs',
    chapter: 'verbs',
    level: 'intermediate',
    aliases: ['phrasal verb', 'turn off', 'look after', 'cụm động từ'],
    related: ['prepositions', 'pronouns', 'verb-patterns'],
    skills: ['verb-patterns', 'prepositions'],
    vocabulary: ['equipment', 'colleague'],
    plain:
      'Một động từ đi cùng tiểu từ hoặc giới từ có thể tạo thành một đơn vị nghĩa. Nhưng không phải cụm nào cũng cho phép chuyển tân ngữ vào giữa.',
    why: 'Turn off thuộc mẫu tách được; look after không thuộc mẫu ấy. Với cụm tách được, đại từ ngắn như it thường phải chen giữa: turn it off.',
    prompt:
      'Dạy người mới cách tắt máy bằng “turn it off”. Vì sao không thể đổi “look after them” thành “look them after”?',
    checks: [
      'Tôi tra nghĩa của cả cụm.',
      'Tôi kiểm tra cụm có tách được không.',
      'Tôi biết vị trí đại từ trong cụm tách được.',
    ],
    rules: [
      [
        'Học theo đơn vị nghĩa',
        'Không suy nghĩa mọi cụm từ nghĩa từng thành tố; put off có nghĩa hoãn trong ngữ cảnh lịch hẹn.',
        'put off a meeting / look after a visitor',
      ],
      [
        'Cụm tách được',
        'Một số cụm cho danh từ ở giữa hoặc sau tiểu từ; đại từ tân ngữ thường nằm giữa.',
        'turn off the printer / turn the printer off / turn it off',
      ],
      [
        'Cụm không tách',
        'Với look after, depend on… tân ngữ đi sau toàn bộ cụm; không chuyển tùy ý.',
        'look after them / depend on it',
      ],
    ],
    examples: [
      [
        'Please turn it off.',
        'Please turn off it.',
        'It phải đứng giữa trong mẫu turn off tách được.',
      ],
      [
        'Please look after the visitors.',
        'Please look the visitors after.',
        'Look after không tách theo cách này.',
      ],
    ],
    traps: [
      'Không quy mọi từ sau động từ thành cùng một loại tiểu từ.',
      'Một cụm có thể có nhiều nghĩa; lưu cả câu nguồn để nhớ đúng nghĩa.',
    ],
    prediction: [
      'Which placement is standard with the pronoun it and turn off?',
      [
        ['Turn off it.', 'Không đặt it sau tiểu từ của mẫu tách được này.'],
        ['Turn it off.', 'It chen giữa.'],
        ['Turn it off it.', 'Lặp tân ngữ không cần thiết.'],
      ],
      'B',
      'Đại từ đi giữa động từ và off.',
    ],
    drills: [
      [
        'Please ------- before leaving.',
        [
          ['turn off it', 'Sai vị trí đại từ.'],
          ['turn it off', 'Đại từ ở giữa turn và off.'],
          ['it turn off', 'It không làm chủ ngữ của mệnh lệnh này.'],
        ],
        'B',
        'Turn it off giữ đúng trật tự của mẫu tách được.',
      ],
      [
        'Our assistant will look ------- the visitors.',
        [
          ['after', 'Look after là chăm sóc/hỗ trợ theo ngữ cảnh.'],
          ['it after', 'Không chèn it vào giữa look after ở đây.'],
          ['after them', 'Đã có tân ngữ the visitors, không lặp them.'],
        ],
        'A',
        'Look after + tân ngữ.',
      ],
    ],
  },
  {
    id: 'used-to',
    title: 'Used to, be used to & get used to',
    en: 'Past habits and familiarity',
    chapter: 'verbs',
    level: 'intermediate',
    aliases: ['used to', 'be used to', 'get used to', 'thói quen quá khứ'],
    related: ['verb-patterns', 'present-perfect-past'],
    skills: ['verb-patterns', 'tenses'],
    vocabulary: ['relocate'],
    plain:
      'Used to do kể điều từng có trong quá khứ. Be used to doing nói đã quen; get used to doing nói quá trình làm quen.',
    why: 'Trong used to work, to thuộc mẫu chỉ thói quen cũ. Trong be used to working, to là giới từ nên nhận danh từ hoặc V-ing.',
    prompt:
      'Dùng việc làm ca đêm để giải thích ba câu “used to work”, “am used to working”, “am getting used to working”.',
    checks: [
      'Tôi phân biệt chuyện cũ với sự quen thuộc.',
      'Tôi dùng V-ing sau be/get used to.',
      'Tôi dùng nguyên mẫu sau didn’t use to trong mẫu chuẩn đang học.',
    ],
    rules: [
      [
        'Từng có trong quá khứ',
        'Used to + nguyên mẫu kể thói quen hoặc trạng thái cũ, thường đối lập hiện tại.',
        'We used to work downtown.',
      ],
      [
        'Đã quen',
        'Be used to + danh từ/V-ing nói một việc quen thuộc, không nhất thiết thuộc quá khứ.',
        'She is used to working late.',
      ],
      [
        'Đang làm quen',
        'Get used to + danh từ/V-ing nói sự thay đổi từ chưa quen sang quen.',
        'They are getting used to the new system.',
      ],
    ],
    examples: [
      [
        'We are used to checking every order.',
        'We are used to check every order.',
        'To là giới từ trong be used to; dùng checking.',
      ],
      [
        'He didn’t use to work here.',
        'He didn’t used to work here.',
        'Trong mẫu chuẩn này did mang thì quá khứ nên use giữ nguyên.',
      ],
    ],
    traps: [
      'A scanner is used to check labels là bị động của use với mục đích, khác cấu trúc “quen với”.',
      'Would kể thói quen quá khứ cần bối cảnh; không thay used to với mọi trạng thái như own.',
    ],
    prediction: [
      'Which phrase describes familiarity rather than a past habit?',
      [
        ['Used to commute', 'Kể việc đi làm từng xảy ra trong quá khứ.'],
        ['Is used to commuting', 'Đã quen với việc đi làm.'],
        ['Didn’t use to commute', 'Phủ định thói quen quá khứ.'],
      ],
      'B',
      'Be used to + V-ing diễn tả sự quen thuộc.',
    ],
    drills: [
      [
        'She is getting used to ------- the new software.',
        [
          ['use', 'To là giới từ sau get used to.'],
          ['used', 'Không phù hợp bổ ngữ ở đây.'],
          ['using', 'V-ing sau to là giới từ.'],
        ],
        'C',
        'Getting used to using: đang quen dần với việc dùng.',
      ],
      [
        'Before the relocation, we used to ------- near the station.',
        [
          ['work', 'Used to + nguyên mẫu.'],
          ['working', 'Đây không phải be/get used to.'],
          ['worked', 'Used to đã mang ý quá khứ.'],
        ],
        'A',
        'Used to work kể thói quen cũ.',
      ],
    ],
  },
  {
    id: 'noun-clauses',
    title: 'Mệnh đề danh từ & câu hỏi gián tiếp',
    en: 'Noun clauses and embedded questions',
    chapter: 'clauses',
    level: 'advanced',
    aliases: ['that clause', 'whether if', 'embedded question', 'mệnh đề danh ngữ'],
    related: ['questions', 'reported-speech', 'sentence-structure'],
    skills: ['sentence-structure'],
    vocabulary: ['confirm', 'request'],
    plain:
      'Cả một ý có thể nằm ở vị trí của một danh từ: điều ta biết, muốn hỏi hoặc cần xác nhận. Khi nhúng câu hỏi vào câu khác, trật tự thường trở lại chủ ngữ rồi động từ.',
    why: '“Where is the office?” là câu hỏi trực tiếp. Trong “Do you know where the office is?”, phần where… là nội dung cần biết, không tự đảo ngữ một lần nữa.',
    prompt:
      'Biến “When does the office close?” thành một câu hỏi lịch sự bắt đầu bằng “Could you tell me…”. Giải thích vì sao bỏ does.',
    checks: [
      'Tôi xác định mệnh đề đang làm chủ ngữ hay tân ngữ.',
      'Tôi giữ trật tự S + V trong câu hỏi nhúng.',
      'Tôi phân biệt that không có vai trò danh từ với what có nghĩa điều mà.',
    ],
    rules: [
      [
        'Một mệnh đề làm danh từ',
        'Mệnh đề that/what/whether có thể làm chủ ngữ hoặc tân ngữ của một động từ.',
        'We know that the office is closed. / What she said was helpful.',
      ],
      [
        'Câu hỏi nhúng',
        'Dùng wh-word + S + V, không giữ đảo trợ động từ của câu hỏi trực tiếp. Với câu hỏi về chính chủ ngữ, hình thức có thể không đổi.',
        'Can you tell me where the meeting is?',
      ],
      [
        'Whether và if',
        'Cả hai có thể mở nhiều câu hỏi yes/no gián tiếp. Dùng whether trong whether to… và sau giới từ.',
        'We discussed whether to postpone. / It depends on whether she agrees.',
      ],
    ],
    examples: [
      [
        'Could you tell me where the exit is?',
        'Could you tell me where is the exit?',
        'Câu hỏi nhúng theo trật tự the exit is.',
      ],
      [
        'We discussed whether to extend the contract.',
        'We discussed if to extend the contract.',
        'Trước to-infinitive dùng whether, không dùng if trong mẫu này.',
      ],
    ],
    traps: [
      'Không bỏ that trong mọi vị trí; mệnh đề that làm chủ ngữ thường cần that.',
      'What có thể tự mang nghĩa “điều mà”; không thêm một tiền ngữ không cần thiết như the thing what trong văn viết chuẩn.',
    ],
    prediction: [
      'Which order is standard inside an embedded question?',
      [
        ['Question word + auxiliary + subject in every case', 'Không giữ đảo ngữ máy móc.'],
        ['Question word + subject + verb', 'Đây là trật tự thông thường của câu hỏi nhúng.'],
        ['Subject + question word + verb', 'Không phải mẫu câu hỏi nhúng này.'],
      ],
      'B',
      'Where the office is, không phải where is the office.',
    ],
    drills: [
      [
        'Do you know when the workshop -------?',
        [
          ['does start', 'Không giữ đảo does start trong mệnh đề nhúng này.'],
          ['start', 'Workshop số ít hiện tại đơn cần starts.'],
          ['starts', 'When the workshop starts đúng trật tự.'],
        ],
        'C',
        'Do you know là phần hỏi; when the workshop starts là nội dung.',
      ],
      [
        'The decision depends on ------- the venue is available.',
        [
          ['whether', 'Sau giới từ on có thể dùng whether.'],
          ['if', 'Không dùng if sau giới từ trong mẫu này.'],
          ['that if', 'Ghép hai từ mở mệnh đề không phù hợp.'],
        ],
        'A',
        'On whether diễn tả phụ thuộc vào việc có hay không.',
      ],
    ],
  },
  {
    id: 'adverb-clauses',
    title: 'Mệnh đề thời gian, nguyên nhân & nhượng bộ',
    en: 'Adverbial clauses',
    chapter: 'clauses',
    level: 'intermediate',
    aliases: ['although because while until', 'mệnh đề trạng ngữ', 'dấu phẩy', 'because of'],
    related: ['connectors', 'prepositions', 'future-forms'],
    skills: ['connectors', 'sentence-structure'],
    vocabulary: ['shipment'],
    plain:
      'Mệnh đề trạng ngữ thêm lời giải thích: việc xảy ra khi nào, vì sao, với điều kiện gì hoặc dù có trở ngại nào.',
    why: 'Cùng một sự việc nhưng because cho nguyên nhân, although cho tương phản. Chọn liên từ là quyết định quan hệ giữa các ý, không chỉ xem phía sau có một mệnh đề.',
    prompt:
      'Dùng hai ý “trời mưa” và “sự kiện vẫn diễn ra” để giải thích vì sao although phù hợp hơn because nếu muốn nhấn sự vượt trở ngại.',
    checks: [
      'Tôi diễn đạt được quan hệ nghĩa trước khi chọn từ nối.',
      'Tôi phân biệt because + mệnh đề với because of + cụm.',
      'Tôi không ghép although và but để nối cùng hai vế trong mẫu chuẩn này.',
    ],
    rules: [
      [
        'Chọn quan hệ nghĩa',
        'Because/since có thể chỉ nguyên nhân; although/even though chỉ nhượng bộ; while có thể chỉ thời gian hoặc đối chiếu.',
        'Although it rained, the event continued.',
      ],
      [
        'Mệnh đề và cụm từ',
        'Liên từ như because/although mở mệnh đề. Because of/despite thường nhận danh từ hoặc V-ing.',
        'because the road was closed / because of the closure',
      ],
      [
        'Vị trí và dấu câu',
        'Mệnh đề phụ đặt đầu thường có dấu phẩy sau nó. Không để nó đứng một mình như một câu hoàn chỉnh trong văn viết thông thường.',
        'When the doors open, please enter quietly.',
      ],
    ],
    examples: [
      [
        'Although the train was late, we arrived on time.',
        'Although the train was late, but we arrived on time.',
        'Không dùng cặp although…but để nối cùng hai mệnh đề theo mẫu chuẩn đang học.',
      ],
      [
        'The delivery was delayed because of snow.',
        'The delivery was delayed because snow.',
        'Snow là danh từ, cần because of; hoặc because it was snowing.',
      ],
    ],
    traps: [
      'Since còn chỉ thời gian; while còn đối chiếu. Xem ngữ cảnh.',
      'Không dùng danh sách “từ đồng nghĩa” để thay liên từ bất chấp cấu trúc theo sau.',
    ],
    prediction: [
      'Which connector highlights an outcome despite an obstacle?',
      [
        ['Although', 'Mở sự nhượng bộ/tương phản.'],
        ['Because', 'Nêu nguyên nhân.'],
        ['So that', 'Thường nêu mục đích/kết quả dự định.'],
      ],
      'A',
      'Although đặt trở ngại cạnh kết quả vẫn xảy ra.',
    ],
    drills: [
      [
        '------- the room was small, everyone found a seat.',
        [
          ['Despite', 'Despite không trực tiếp nhận mệnh đề room was small.'],
          ['Although', 'Nhận mệnh đề và nêu tương phản.'],
          ['Because of', 'Because of cần cụm danh từ/V-ing.'],
        ],
        'B',
        'Although + mệnh đề, kết quả everyone found a seat.',
      ],
      [
        'The office closed early ------- the storm.',
        [
          ['because', 'The storm là cụm danh từ.'],
          ['although', 'Vừa sai cấu trúc theo sau, vừa không nêu nguyên nhân phù hợp.'],
          ['because of', 'Because of + danh từ the storm.'],
        ],
        'C',
        'Because of the storm nêu nguyên nhân bằng một cụm danh từ.',
      ],
    ],
  },
  {
    id: 'reported-speech',
    title: 'Câu tường thuật: giữ đúng góc nhìn',
    en: 'Reported speech',
    chapter: 'clauses',
    level: 'advanced',
    aliases: ['reported speech', 'say tell', 'lùi thì', 'câu gián tiếp'],
    related: ['noun-clauses', 'tenses', 'questions'],
    skills: ['reported-speech', 'tenses'],
    vocabulary: ['notify', 'confirm'],
    plain:
      'Tường thuật là kể lại lời người khác từ vị trí của mình. Đại từ, mốc thời gian và thì có thể thay đổi để người nghe hiểu đúng ai nói, lúc nào.',
    why: 'Lùi thì thường xảy ra khi nhìn lời nói từ một mốc quá khứ. Nhưng nếu thông tin vẫn đúng hoặc người nói giữ nó ở hiện tại, không phải cứ saw/said là mọi động từ bắt buộc lùi.',
    prompt:
      'Hôm qua Lan nói “I will send it tomorrow”. Hôm nay bạn kể lại: “Lan said she would send it today”. Giải thích từng thay đổi theo thời điểm kể.',
    checks: [
      'Tôi đổi đại từ theo đúng người được nói đến.',
      'Tôi xét thời điểm kể trước khi đổi tomorrow/then.',
      'Tôi phân biệt tell someone với say something.',
    ],
    rules: [
      [
        'Lùi thì có ngữ cảnh',
        'Trong tường thuật từ quá khứ, hiện tại thường chuyển quá khứ, will thành would, quá khứ có thể thành hoàn thành quá khứ. Không áp dụng như phép thay chữ bắt buộc.',
        'She said, “I am ready.” → She said she was ready.',
      ],
      [
        'Tường thuật câu hỏi',
        'Use asked + wh-clause hoặc if/whether-clause, giữ trật tự câu trần thuật.',
        'He asked whether the room was available.',
      ],
      [
        'Mệnh lệnh và yêu cầu',
        'Tell/ask + người + (not) to do. Tell thường cần người nghe; say không trực tiếp nhận người theo cùng mẫu.',
        'She told us not to wait. / She said that she was busy.',
      ],
    ],
    examples: [
      [
        'He told me that the office was closed.',
        'He said me that the office was closed.',
        'Tell me hoặc say to me; không dùng said me.',
      ],
      [
        'She asked where the meeting was.',
        'She asked where was the meeting.',
        'Trong câu hỏi gián tiếp không đảo was lên trước chủ ngữ.',
      ],
    ],
    traps: [
      'Không tự thêm thông tin về thời gian nếu lời gốc không cho biết.',
      'Một sự thật còn đúng có thể giữ hiện tại; đừng chấm sai mọi trường hợp không lùi thì.',
    ],
    prediction: [
      'What must remain accurate when reporting someone’s words?',
      [
        ['Only the original pronouns', 'Đại từ thường phải đổi theo người kể.'],
        ['Who, when and what was meant', 'Vai trò người nói và mốc nhìn phải được giữ đúng.'],
        ['Exactly the original word order', 'Câu hỏi gián tiếp thường đổi trật tự.'],
      ],
      'B',
      'Mục tiêu là bảo toàn ý nghĩa, không sao chép nguyên hình thức.',
    ],
    drills: [
      [
        'The receptionist told us ------- in the lobby.',
        [
          ['wait', 'Told us cần to-infinitive ở mẫu yêu cầu này.'],
          ['waiting', 'Không dùng told us waiting.'],
          ['to wait', 'Tell + người + to do.'],
        ],
        'C',
        'Told us to wait tường thuật một chỉ dẫn.',
      ],
      [
        'She asked whether the supplier ------- ready.',
        [
          ['was', 'Whether + chủ ngữ + động từ.'],
          ['was he', 'Lặp thêm chủ ngữ và sai cấu trúc.'],
          ['be', 'Câu tường thuật này không dùng be nguyên mẫu.'],
        ],
        'A',
        'The supplier was ready theo trật tự câu trần thuật.',
      ],
    ],
  },
  {
    id: 'questions',
    title: 'Câu hỏi, phủ định & câu hỏi đuôi',
    en: 'Questions, negation and question tags',
    chapter: 'clauses',
    level: 'intermediate',
    aliases: ['do does did', 'question tags', 'who called', 'câu hỏi đuôi', 'phủ định kép'],
    related: ['noun-clauses', 'sentence-structure', 'modals'],
    skills: ['sentence-structure'],
    vocabulary: ['schedule', 'confirm'],
    plain:
      'Muốn hỏi, thường đưa trợ động từ ra trước chủ ngữ. Nhưng nếu hỏi chính người làm hành động bằng who/what, không cần tự thêm do.',
    why: '“Who called?” đã có who làm chủ ngữ. “Who did you call?” hỏi tân ngữ nên giữ you làm chủ ngữ và dùng did để tạo câu hỏi.',
    prompt:
      'Dùng hai câu “Who called you?” và “Who did you call?” để giải thích ai là người gọi trong từng câu.',
    checks: [
      'Tôi tìm trợ động từ sẵn có trước khi thêm do.',
      'Tôi biết câu hỏi chủ ngữ khác câu hỏi tân ngữ.',
      'Tôi đối chiếu chủ ngữ và trợ động từ khi đặt câu hỏi đuôi.',
    ],
    rules: [
      [
        'Hỏi với trợ động từ',
        'Đảo be/modal/have trợ động từ. Với động từ thường hiện tại/quá khứ đơn, dùng do/does/did + nguyên mẫu.',
        'Is she ready? / Did they confirm?',
      ],
      [
        'Hỏi chủ ngữ',
        'Who/what làm chủ ngữ thì thường dùng trật tự trực tiếp, không tự thêm do; do có thể xuất hiện để nhấn mạnh trong ngữ cảnh khác.',
        'Who sent the invoice? / Who did you notify?',
      ],
      [
        'Câu hỏi đuôi và phủ định',
        'Mẫu đuôi đối cực thường dùng cùng trợ động từ và đại từ tương ứng. Never/nobody đã có nghĩa phủ định trong văn viết chuẩn.',
        'She is ready, isn’t she? / Nobody called, did they?',
      ],
    ],
    examples: [
      ['Did you submit the form?', 'Did you submitted the form?', 'Did đã mang thì quá khứ.'],
      [
        'Who approved the request?',
        'Who did approved the request?',
        'Who là chủ ngữ; không dùng did approved.',
      ],
    ],
    traps: [
      'Câu hỏi phủ định cần nghe nội dung theo sau yes/no để hiểu đúng ý người nói.',
      'Câu hỏi đuôi có biến thể theo ý định giao tiếp; bài này dạy mẫu xác nhận thông thường.',
    ],
    prediction: [
      'In “Who sent the invoice?”, what role does who have?',
      [
        ['Subject', 'Who là người thực hiện sent.'],
        ['Direct object', 'Invoice mới là tân ngữ của sent.'],
        ['A preposition', 'Who không là giới từ.'],
      ],
      'A',
      'Câu hỏi chủ ngữ không cần thêm did ở mẫu trung tính này.',
    ],
    drills: [
      [
        'The workshop starts at nine, ------- it?',
        [
          ['isn’t', 'Starts là hiện tại đơn động từ thường, không dùng is cho đuôi này.'],
          ['doesn’t', 'Chủ ngữ it, hiện tại đơn: doesn’t it?'],
          ['didn’t', 'Không khớp thì hiện tại starts.'],
        ],
        'B',
        'Starts tạo đuôi với does.',
      ],
      [
        'Choose the neutral subject question.',
        [
          ['Who did signed the contract?', 'Did + signed sai.'],
          ['Who signed the contract?', 'Who làm chủ ngữ.'],
          ['Who did the contract signed?', 'Sai trật tự và dạng động từ.'],
        ],
        'B',
        'Who signed the contract? hỏi người ký.',
      ],
    ],
  },
  {
    id: 'mixed-conditionals',
    title: 'Điều kiện hỗn hợp & đảo điều kiện',
    en: 'Mixed and inverted conditionals',
    chapter: 'hypothesis',
    level: 'advanced',
    aliases: ['mixed conditionals', 'had I', 'were I', 'should you', 'đảo điều kiện'],
    related: ['conditionals', 'inversion', 'perfect-continuous'],
    skills: ['conditionals', 'inversion'],
    vocabulary: ['deadline', 'notify'],
    plain:
      'Hai nửa câu điều kiện không nhất thiết nói cùng thời điểm. Một lựa chọn khác trong quá khứ có thể tạo một tình trạng khác ngay bây giờ.',
    why: 'Chọn hình thức theo hai trục riêng: điều kiện xảy ra lúc nào, kết quả ở lúc nào. Nếu chỉ học “loại mấy” mà bỏ mốc thời gian, bạn dễ chọn sai would have cho kết quả hiện tại.',
    prompt:
      'Giải thích “If I had accepted that role, I would live abroad now”. Điều kiện thuộc quá khứ, nhưng kết quả thuộc lúc nào?',
    checks: [
      'Tôi đặt điều kiện và kết quả lên hai mốc riêng.',
      'Tôi không dùng would have cho mọi kết quả có if had.',
      'Tôi giữ một chủ ngữ khi đảo had/were/should.',
    ],
    rules: [
      [
        'Quá khứ khác, hiện tại khác',
        'If + had V3 có thể nối với would + nguyên mẫu khi kết quả là trạng thái hiện tại.',
        'If I had accepted, I would work abroad now.',
      ],
      [
        'Hiện tại khác, quá khứ khác',
        'Điều kiện trạng thái giả định hiện tại có thể giải thích kết quả quá khứ khác.',
        'If I were more organized, I would not have missed yesterday’s deadline.',
      ],
      [
        'Đảo điều kiện trang trọng',
        'Có thể thay if bằng đảo had/were/should ở các mẫu phù hợp. Không tạo đảo bằng mọi động từ.',
        'Had I known, I would have called. / Should you need help, contact us.',
      ],
    ],
    examples: [
      [
        'Had we known the address, we would have sent a driver.',
        'Had we had known the address, we would have sent a driver.',
        'Đảo had ra đầu, không nhân đôi had.',
      ],
      [
        'If she had taken that job, she would live in Osaka now.',
        'If she had taken that job, she would lives in Osaka now.',
        'Sau would là nguyên mẫu live.',
      ],
    ],
    traps: [
      'Should you need không khẳng định nhu cầu chắc chắn xảy ra; đây là điều kiện lịch sự.',
      'Were it not for… là cấu trúc giả định trang trọng; không ghép were với động từ nguyên mẫu tùy ý.',
    ],
    prediction: [
      'In “If I had moved, I would live closer now”, when is the result viewed?',
      [
        ['Only in the past', 'Now xác định trạng thái hiện tại.'],
        ['In the present', 'Would live ... now là kết quả hiện tại giả định.'],
        ['As a confirmed fact', 'Đây là giả định, không phải xác nhận.'],
      ],
      'B',
      'Điều kiện quá khứ kết nối với kết quả hiện tại.',
    ],
    drills: [
      [
        'If we had accepted the offer, we ------- in a larger office now.',
        [
          ['would have be', 'Sai chuỗi: would have cần V3 been, nhưng còn phải xét kết quả now.'],
          ['would are', 'Sau would dùng nguyên mẫu.'],
          ['would be', 'Kết quả giả định là trạng thái hiện tại now.'],
        ],
        'C',
        'Would be nói tình trạng hiện tại khác.',
      ],
      [
        '------- you require assistance, please call reception.',
        [
          ['Should', 'Should you require tương đương if you should require trong mẫu trang trọng.'],
          ['Had', 'Had you require thiếu V3 và không đúng mẫu.'],
          ['Were', 'Were you require không đúng cấu trúc.'],
        ],
        'A',
        'Should + S + nguyên mẫu là mẫu đảo điều kiện phù hợp.',
      ],
    ],
  },
  {
    id: 'wish-if-only',
    title: 'Wish, if only & would rather',
    en: 'Wishes and preferences',
    chapter: 'hypothesis',
    level: 'advanced',
    aliases: ['wish if only', 'would rather', 'ước muốn', 'tiếc nuối'],
    related: ['conditionals', 'mixed-conditionals', 'subjunctive'],
    skills: ['conditionals', 'subjunctive'],
    vocabulary: ['schedule', 'postpone'],
    plain:
      'Wish/if only cho phép nói một thực tại khác điều đang có. Dạng quá khứ sau wish có thể nói hiện tại trái ý, còn had + V3 nhìn lại điều đã không thể thay đổi.',
    why: 'Trong giả định, hình thức quá khứ có thể tạo khoảng cách với thực tế chứ không chỉ chỉ thời gian cũ. Vì thế “I wish I knew” nói điều tôi không biết lúc này.',
    prompt:
      'Giải thích vì sao “I wish I knew the answer” không nhất thiết nói chuyện hôm qua. Đổi thành một điều tiếc về cuộc họp hôm qua.',
    checks: [
      'Tôi xác định đang ước hiện tại hay tiếc quá khứ.',
      'Tôi không thay wish bằng hope nếu ý là điều trái thực tế.',
      'Tôi phân biệt cùng chủ ngữ và khác chủ ngữ sau would rather.',
    ],
    rules: [
      [
        'Ước hiện tại khác đi',
        'Wish/if only + dạng quá khứ nói điều khác thực tại hiện tại. Were thường dùng trang trọng; was cũng xuất hiện trong dùng thực tế.',
        'I wish the office were closer.',
      ],
      [
        'Tiếc quá khứ',
        'Wish + had V3 nói điều tiếc về việc trước đây. Wish + would thường mong một thay đổi, không thay được mọi kiểu wish.',
        'I wish I had checked the time. / I wish the noise would stop.',
      ],
      [
        'Would rather',
        'Cùng chủ ngữ: would rather + V. Khác chủ ngữ: thường dùng dạng quá khứ cho điều muốn ở hiện tại/tương lai.',
        'I would rather wait. / I would rather you waited here.',
      ],
    ],
    examples: [
      [
        'I wish I had booked earlier.',
        'I wish I have booked earlier.',
        'Tiếc về việc đặt chỗ đã xảy ra cần had booked.',
      ],
      [
        'I would rather leave now.',
        'I would rather to leave now.',
        'Sau would rather không dùng to ở mẫu cùng chủ ngữ.',
      ],
    ],
    traps: [
      'Hope phù hợp mong điều vẫn có thể xảy ra; wish thường nêu sự không hài lòng/khác thực tế ở các mẫu này.',
      'Không xem was sau I wish là luôn sai trong mọi phương ngữ; bài tập chọn cấu trúc có tiêu chí rõ.',
    ],
    prediction: [
      'What does “I wish I had called earlier” express?',
      [
        ['A regret about the past', 'Had called nhìn lại hành động trước đây.'],
        ['A confirmed future call', 'Wish không xác nhận việc tương lai.'],
        ['A present habit', 'Không nói thói quen.'],
      ],
      'A',
      'Wish + past perfect diễn tả tiếc quá khứ.',
    ],
    drills: [
      [
        'I would rather ------- until the manager returns.',
        [
          ['to wait', 'Không có to trong mẫu would rather cùng chủ ngữ.'],
          ['wait', 'Would rather + nguyên mẫu.'],
          ['waiting', 'Không dùng V-ing trong mẫu này.'],
        ],
        'B',
        'Would rather wait: thích chờ hơn.',
      ],
      [
        'If only we had ------- the deadline sooner.',
        [
          ['notice', 'Had cần V3.'],
          ['noticing', 'Không đúng chuỗi giả định này.'],
          ['noticed', 'Had noticed diễn tả điều tiếc trong quá khứ.'],
        ],
        'C',
        'If only + had noticed.',
      ],
    ],
  },
]
export const structureEntries = drafts.map(entry)
