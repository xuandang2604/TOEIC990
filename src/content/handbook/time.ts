import { entry, type LessonDraft } from './model'

const drafts: LessonDraft[] = [
  {
    id: 'present-simple-continuous',
    title: 'Hiện tại đơn & hiện tại tiếp diễn',
    en: 'Present simple and continuous',
    chapter: 'time',
    level: 'foundation',
    aliases: [
      'present simple',
      'present continuous',
      'stative verbs',
      'hiện tại đơn',
      'hiện tại tiếp diễn',
    ],
    related: ['tenses', 'present-perfect-past', 'agreement'],
    skills: ['tenses'],
    vocabulary: ['branch', 'temporary'],
    plain:
      'Hiện tại đơn nói nếp thường lệ hoặc sự thật. Hiện tại tiếp diễn đặt ta vào hoạt động đang diễn ra hoặc tình trạng tạm thời.',
    why: 'Sự khác nhau nằm ở góc nhìn, không phải chỉ có chữ now. “I work here” mô tả công việc; “I am working here this week” giới hạn vào một tuần tạm thời.',
    prompt:
      'Giải thích cho người mới đến công ty khác nhau giữa “She works upstairs” và “She is working upstairs this week”.',
    checks: [
      'Tôi xác định đây là thói quen hay tình huống tạm thời.',
      'Tôi không bỏ be trước V-ing.',
      'Tôi kiểm tra nghĩa của động từ trạng thái trước khi dùng tiếp diễn.',
    ],
    rules: [
      [
        'Thường lệ và sự thật',
        'Dùng hiện tại đơn cho quy trình hoặc tần suất; ngôi ba số ít thêm s/es ở câu khẳng định.',
        'The branch opens at eight. / She checks invoices daily.',
      ],
      [
        'Hoạt động và sự tạm thời',
        'Dùng am/is/are + V-ing khi nhìn một hoạt động đang diễn ra hoặc tạm thời quanh hiện tại.',
        'We are using a temporary office this month.',
      ],
      [
        'Động từ trạng thái',
        'Know, own, belong thường không dùng tiếp diễn trong nghĩa trạng thái. Một số từ đổi nghĩa có thể dùng tiếp diễn: think suy nghĩ, have dùng bữa.',
        'I know the answer. / I am thinking about the proposal.',
      ],
    ],
    examples: [
      [
        'The store closes at six every day.',
        'The store close at six every day.',
        'Store là ngôi ba số ít trong hiện tại đơn.',
      ],
      [
        'They are repairing the lift today.',
        'They repairing the lift today.',
        'Tiếp diễn cần are trước repairing.',
      ],
    ],
    traps: [
      'Now không luôn bắt buộc tiếp diễn: I now understand. Đọc nghĩa động từ.',
      'Hiện tại đơn dùng cho lịch trình, còn hiện tại tiếp diễn có thể nói một sắp xếp tương lai đã định.',
    ],
    prediction: [
      'Which sentence emphasizes a temporary arrangement?',
      [
        ['We work at the main office.', 'Mô tả nơi làm việc thường lệ.'],
        ['We are working at the annex this week.', 'This week giới hạn tình trạng tạm thời.'],
        ['The company owns the annex.', 'Owns nói quyền sở hữu, không phải hoạt động tạm.'],
      ],
      'B',
      'Be working và this week đặt hoạt động trong một giai đoạn giới hạn.',
    ],
    drills: [
      [
        'The finance team ------- invoices every Friday.',
        [
          ['checks', 'Every Friday mô tả lịch thường lệ; team được dùng số ít trong câu này.'],
          ['is check', 'Sau is không dùng nguyên mẫu check theo cấu trúc này.'],
          ['checking', 'Thiếu động từ hữu hạn.'],
        ],
        'A',
        'Hiện tại đơn mô tả một quy trình định kỳ.',
      ],
      [
        'For this week only, our technicians ------- from the training room.',
        [
          ['is working', 'Technicians là số nhiều nên không đi với is.'],
          ['are work', 'Sau are cần V-ing trong thể tiếp diễn.'],
          ['are working', 'Chủ ngữ số nhiều với are working, mô tả tình trạng tạm thời.'],
        ],
        'C',
        'Are working vừa đúng hòa hợp vừa diễn tả công việc tạm thời.',
      ],
    ],
  },
  {
    id: 'present-perfect-past',
    title: 'Hiện tại hoàn thành hay quá khứ đơn?',
    en: 'Present perfect versus past simple',
    chapter: 'time',
    level: 'intermediate',
    aliases: [
      'present perfect',
      'past simple',
      'since for',
      'yesterday',
      'hiện tại hoàn thành',
      'quá khứ đơn',
    ],
    related: ['tenses', 'perfect-continuous', 'past-continuous-perfect'],
    skills: ['tenses'],
    vocabulary: ['submit', 'invoice'],
    plain:
      'Quá khứ đơn đặt sự việc vào một thời gian quá khứ đã kết thúc. Hiện tại hoàn thành nối sự việc trước đây với thời điểm hiện tại.',
    why: 'Hãy hỏi “tôi đang kể lúc nào, hay đang nói tình hình đến bây giờ?”. Một việc đã xong vẫn có thể dùng hiện tại hoàn thành khi trọng tâm là kết quả hiện tại.',
    prompt:
      'Dạy một người bạn vì sao “I submitted it yesterday” khác góc nhìn với “I have submitted it”. Hãy nêu thông tin thời gian bị bỏ đi trong câu sau.',
    checks: [
      'Tôi xác định khung thời gian còn mở hay đã khép.',
      'Tôi không ghép hiện tại hoàn thành với yesterday/last Tuesday trong mẫu thông thường.',
      'Tôi hiểu since là điểm bắt đầu và for là độ dài, không tự quyết định thì chỉ bằng một từ.',
    ],
    rules: [
      [
        'Khung quá khứ đã kết thúc',
        'Dùng V2/did với sự kiện được đặt trong yesterday, last month hoặc một thời gian đã khép.',
        'She sent the report yesterday.',
      ],
      [
        'Liên hệ với hiện tại',
        'Have/has + V3 nói trải nghiệm, kết quả hiện tại hoặc tình trạng kéo dài đến nay.',
        'We have received your request. / She has worked here since 2020.',
      ],
      [
        'Khoảng thời gian cần ngữ cảnh',
        'Today/this week có thể còn mở hoặc được nhìn như đã kết thúc. For cũng dùng được trong quá khứ đơn nếu khoảng ấy đã hết.',
        'I worked there for two years, then left.',
      ],
    ],
    examples: [
      [
        'We received the payment last Monday.',
        'We have received the payment last Monday.',
        'Last Monday xác định thời gian quá khứ đã khép trong cách dùng chuẩn này.',
      ],
      [
        'The auditor has already checked the figures.',
        'The auditor has already check the figures.',
        'Sau has cần phân từ checked.',
      ],
    ],
    traps: [
      'Already/yet không tự động loại trừ quá khứ đơn trong mọi phương ngữ.',
      'Không dịch have thành “có” khi nó là trợ động từ của hoàn thành.',
    ],
    prediction: [
      'Which sentence locates an event in a finished past period?',
      [
        ['They have completed the audit.', 'Nhấn vào kết quả hiện tại, không nêu lúc đã khép.'],
        ['They completed the audit last week.', 'Last week xác định giai đoạn đã kết thúc.'],
        ['They have been auditing all morning.', 'Nhấn tiến trình kéo đến hiện tại.'],
      ],
      'B',
      'Khung thời gian last week phù hợp quá khứ đơn.',
    ],
    drills: [
      [
        'We ------- the contract in 2021.',
        [
          ['signed', 'In 2021 là thời gian quá khứ xác định đã kết thúc.'],
          ['have signed', 'Không ghép với in 2021 trong mẫu chuẩn này.'],
          ['has signed', 'Vừa sai hòa hợp với we, vừa sai khung thời gian.'],
        ],
        'A',
        'Dùng signed cho một sự kiện trong năm đã khép.',
      ],
      [
        'Choose the standard completion: She has ------- here since January.',
        [
          ['work', 'Sau has cần phân từ.'],
          ['working', 'Nếu dùng tiếp diễn cần been trước working.'],
          ['worked', 'Has worked + since đúng cấu trúc.'],
        ],
        'C',
        'Has worked liên hệ việc bắt đầu tháng Một với hiện tại.',
      ],
    ],
  },
  {
    id: 'past-continuous-perfect',
    title: 'Đang diễn ra & xảy ra trước trong quá khứ',
    en: 'Past continuous and past perfect',
    chapter: 'time',
    level: 'intermediate',
    aliases: [
      'past continuous',
      'past perfect',
      'quá khứ tiếp diễn',
      'quá khứ hoàn thành',
      'had V3',
    ],
    related: ['present-perfect-past', 'perfect-continuous', 'reported-speech'],
    skills: ['tenses'],
    vocabulary: ['delivery'],
    plain:
      'Was/were + V-ing mở một cảnh đang diễn ra trong quá khứ. Had + V3 lùi về việc đã xảy ra trước một mốc quá khứ khác.',
    why: 'Trong câu chuyện, có lúc ta quay camera vào giữa một hoạt động, có lúc ta kể ngược về chuyện đã xong trước đó. Hai cách nhìn không thay thế nhau tùy ý.',
    prompt:
      'Kể chuyện người giao đến lúc bạn đang kiểm hàng, rồi giải thích một kiện đã đến trước đó. Chỉ ra ba vị trí trên trục thời gian.',
    checks: [
      'Tôi tìm mốc quá khứ đang làm điểm nhìn.',
      'Tôi phân biệt hoạt động đang diễn ra với việc xảy ra sớm hơn.',
      'Tôi không dùng had cho mọi câu kể quá khứ.',
    ],
    rules: [
      [
        'Cảnh đang diễn ra',
        'Was/were + V-ing mô tả hoạt động giữa chừng tại một mốc quá khứ.',
        'At nine, we were checking the delivery.',
      ],
      [
        'Việc đã xảy ra trước',
        'Had + V3 chỉ việc trước điểm nhìn quá khứ; cần ngữ cảnh cho biết điểm nhìn ấy.',
        'The courier had left before we called.',
      ],
      [
        'Không chia theo từ khóa máy móc',
        'Before/after đôi khi đã làm thứ tự rõ nên quá khứ đơn cũng phù hợp. Chọn hoàn thành khi cần làm rõ hoặc nhấn quan hệ trước–sau.',
        'After we checked the order, we signed the receipt.',
      ],
    ],
    examples: [
      [
        'We were checking stock when the driver arrived.',
        'We were check stock when the driver arrived.',
        'Were checking mới là tiếp diễn.',
      ],
      [
        'The parcel had arrived before the office opened.',
        'The parcel had arrive before the office opened.',
        'Had cần V3 arrived.',
      ],
    ],
    traps: [
      'Không đặt hai việc vào quá khứ hoàn thành chỉ vì câu chuyện có hai hành động.',
      'Was being checked là bị động tiếp diễn; was checking là chủ động tiếp diễn.',
    ],
    prediction: [
      'Which form shows an activity in progress at a past moment?',
      [
        ['Was checking', 'Was + V-ing cho hoạt động đang diễn ra.'],
        ['Had checked', 'Nhìn việc kiểm tra là đã hoàn tất trước mốc quá khứ.'],
        ['Will check', 'Chỉ tương lai, không phải cảnh quá khứ.'],
      ],
      'A',
      'Tiếp diễn đưa người đọc vào giữa hoạt động.',
    ],
    drills: [
      [
        'At 8:30 yesterday, she ------- the stock list.',
        [
          ['was updating', 'Was + V-ing phù hợp hoạt động đang diễn ra ở mốc đó.'],
          ['was update', 'Thiếu -ing sau was.'],
          ['had update', 'Sau had cần V3, không phải update.'],
        ],
        'A',
        'Was updating mô tả hoạt động giữa chừng tại 8:30.',
      ],
      [
        'When we reached the station, the last train had already -------.',
        [
          ['leave', 'Had cần phân từ.'],
          ['leaving', 'Không dùng had + V-ing nếu thiếu been.'],
          ['left', 'Left là V3 của leave.'],
        ],
        'C',
        'Had already left nói tàu rời trước lúc chúng ta đến.',
      ],
    ],
  },
  {
    id: 'perfect-continuous',
    title: 'Hoàn thành tiếp diễn: nhấn quá trình',
    en: 'Perfect continuous aspect',
    chapter: 'time',
    level: 'advanced',
    aliases: [
      'present perfect continuous',
      'past perfect continuous',
      'hiện tại hoàn thành tiếp diễn',
      'quá khứ hoàn thành tiếp diễn',
    ],
    related: ['present-perfect-past', 'past-continuous-perfect', 'future-perfect'],
    skills: ['tenses'],
    vocabulary: ['negotiate', 'contract'],
    plain:
      'Hoàn thành tiếp diễn nối một quá trình trước đó với một mốc nhìn. Mốc nhìn là bây giờ thì dùng have/has; là một lúc quá khứ thì dùng had.',
    why: 'Hoàn thành đơn thường làm nổi kết quả/số lượng; hoàn thành tiếp diễn làm nổi quá trình hoặc độ dài. Tiếp diễn không đảm bảo công việc đã xong và cũng không luôn khẳng định nó còn tiếp tục.',
    prompt:
      'Giải thích khác nhau giữa “I have written three reports” và “I have been writing all morning”. Câu nào cho biết rõ số báo cáo hoàn tất?',
    checks: [
      'Tôi xác định mốc nhìn hiện tại hay quá khứ.',
      'Tôi phân biệt kết quả với quá trình.',
      'Tôi không ép know/own vào tiếp diễn khi chúng mang nghĩa trạng thái.',
    ],
    rules: [
      [
        'Mốc nhìn hiện tại',
        'Have/has been + V-ing nói quá trình diễn ra trong khoảng trước nay, có thể vừa dừng và để lại dấu vết.',
        'We have been negotiating since Monday.',
      ],
      [
        'Mốc nhìn quá khứ',
        'Had been + V-ing nhìn độ dài hoạt động trước một mốc quá khứ khác.',
        'We had been waiting for an hour when the doors opened.',
      ],
      [
        'Kết quả và giới hạn',
        'Khi đếm các sản phẩm hoàn tất, thường dùng hoàn thành đơn. Với động từ trạng thái, hoàn thành đơn thường tự nhiên hơn.',
        'She has completed four forms. / I have known him for years.',
      ],
    ],
    examples: [
      [
        'They have been discussing the contract.',
        'They have discussing the contract.',
        'Hoàn thành tiếp diễn cần been giữa have và discussing.',
      ],
      [
        'She had been waiting when the office opened.',
        'She had been wait when the office opened.',
        'Sau been trong thể này cần V-ing.',
      ],
    ],
    traps: [
      'For/since không bắt buộc thể tiếp diễn: I have owned this shop for years.',
      'Không suy ra “đã hoàn thành” chỉ vì tên thể có chữ hoàn thành.',
    ],
    prediction: [
      'Which sentence explicitly counts completed results?',
      [
        ['She has written three reports.', 'Three reports là số sản phẩm đã hoàn thành.'],
        ['She has been writing all morning.', 'Nói quá trình, không cho số báo cáo xong.'],
        ['She is writing a report.', 'Nói hoạt động đang diễn ra.'],
      ],
      'A',
      'Kết quả đếm được được diễn tả rõ ở has written three reports.',
    ],
    drills: [
      [
        'We have been ------- with the supplier for two hours.',
        [
          ['negotiate', 'Cần V-ing sau have been ở thể này.'],
          ['negotiating', 'Have been negotiating đúng cấu trúc.'],
          ['negotiated', 'Phân từ này không diễn tả chủ động đang đàm phán với nhà cung cấp.'],
        ],
        'B',
        'Have been negotiating nhấn quá trình đàm phán kéo dài.',
      ],
      [
        'By the time the inspector arrived, we had been ------- outside for an hour.',
        [
          ['wait', 'Thiếu -ing.'],
          ['waited', 'Had been waited không diễn tả chủ động chờ.'],
          ['waiting', 'Had been waiting nối quá trình chờ với mốc inspector arrived.'],
        ],
        'C',
        'Mốc nhìn quá khứ nên dùng had been waiting.',
      ],
    ],
  },
  {
    id: 'future-forms',
    title: 'Nói về tương lai: will, going to & lịch hẹn',
    en: 'Future forms',
    chapter: 'time',
    level: 'intermediate',
    aliases: ['future simple', 'tương lai đơn', 'will going to', 'time clauses'],
    related: ['future-perfect', 'present-simple-continuous', 'conditionals'],
    skills: ['tenses', 'conditionals'],
    vocabulary: ['schedule', 'appointment'],
    plain:
      'Tiếng Anh có nhiều cách nhìn về tương lai: quyết định/lời hứa, ý định đã có, sắp xếp hoặc thời khóa biểu. Không có một công thức thay thế mọi cách nhìn.',
    why: 'Will có thể diễn tả dự đoán, lời hứa hoặc quyết định lúc nói. Going to thường nhấn ý định hoặc bằng chứng hiện tại. Nhiều tình huống chấp nhận cả hai với sắc thái khác nhau.',
    prompt:
      'Bạn vừa quyết định gọi khách và bạn đã hẹn gặp khách từ tuần trước: hãy diễn tả hai việc, rồi giải thích vì sao góc nhìn khác nhau.',
    checks: [
      'Tôi nhận ra ý định hay sắp xếp đã có.',
      'Tôi dùng will + nguyên mẫu.',
      'Tôi không đặt will máy móc sau when/as soon as chỉ thời gian tương lai.',
    ],
    rules: [
      [
        'Will và going to',
        'Will + V diễn tả nhiều sắc thái; be going to + V thường trình bày ý định hoặc dự đoán dựa bằng chứng. Ngữ cảnh mới quyết định cách phù hợp.',
        'I’ll call now. / We’re going to expand the office.',
      ],
      [
        'Sắp xếp và lịch trình',
        'Hiện tại tiếp diễn có thể nói sắp xếp đã định; hiện tại đơn thường dùng cho lịch trình.',
        'I’m meeting the auditor tomorrow. / The train leaves at six.',
      ],
      [
        'Mệnh đề thời gian',
        'Trong mệnh đề when/as soon as/until nói tương lai thông thường, dùng dạng hiện tại. Phân biệt với câu hỏi gián tiếp về tương lai.',
        'I’ll call when I arrive. / I don’t know when she will arrive.',
      ],
    ],
    examples: [
      [
        'We will send the receipt tomorrow.',
        'We will to send the receipt tomorrow.',
        'Sau will không có to.',
      ],
      [
        'I will call as soon as I arrive.',
        'I will call as soon as I will arrive.',
        'As soon as ở đây mở mệnh đề thời gian tương lai, nên dùng hiện tại đơn.',
      ],
    ],
    traps: [
      'Không kết luận going to luôn chắc chắn hơn will trong mọi câu.',
      'When she will arrive có thể đúng trong câu hỏi gián tiếp; hãy phân biệt chức năng mệnh đề.',
    ],
    prediction: [
      'In “I’ll email you when I arrive”, what does the when-clause express?',
      [
        ['A future time condition for sending the email', 'Nó xác định lúc gửi email.'],
        ['A direct question', 'Không phải câu hỏi.'],
        ['A finished past event', 'Sự việc ở tương lai.'],
      ],
      'A',
      'Vì là mệnh đề thời gian tương lai, arrive dùng hiện tại đơn.',
    ],
    drills: [
      [
        'The receptionist will ------- your booking this afternoon.',
        [
          ['confirmed', 'Sau will dùng nguyên mẫu.'],
          ['to confirm', 'Không có to sau will.'],
          ['confirm', 'Will confirm đúng cấu trúc.'],
        ],
        'C',
        'Will + confirm.',
      ],
      [
        'We will start the workshop as soon as everyone -------.',
        [
          ['will arrive', 'Không dùng will trong mệnh đề thời gian tương lai thông thường này.'],
          ['arrives', 'Everyone số ít; hiện tại đơn trong mệnh đề thời gian.'],
          ['arriving', 'Thiếu động từ hữu hạn.'],
        ],
        'B',
        'As soon as everyone arrives xác định thời điểm bắt đầu.',
      ],
    ],
  },
  {
    id: 'future-perfect',
    title: 'Tương lai: đang làm, đã xong & đã kéo dài',
    en: 'Future continuous and perfect forms',
    chapter: 'time',
    level: 'advanced',
    aliases: [
      'future continuous',
      'future perfect',
      'future perfect continuous',
      'tương lai tiếp diễn',
      'tương lai hoàn thành',
      'tương lai hoàn thành tiếp diễn',
    ],
    related: ['future-forms', 'perfect-continuous', 'prepositions'],
    skills: ['tenses'],
    vocabulary: ['deadline'],
    plain:
      'Đứng ở một mốc tương lai: đang giữa việc thì dùng will be doing; nhìn việc đã xong thì will have done; nhìn độ dài quá trình thì will have been doing.',
    why: 'Đều là nói tương lai, nhưng điểm nhìn khác nhau. By thường đặt hạn hoàn tất; at thường đặt một thời điểm quan sát. Chúng là dấu hiệu để hiểu ngữ cảnh, không phải nút chọn thì tuyệt đối.',
    prompt:
      'Hãy tưởng tượng đã tới 5 giờ chiều mai. Giải thích khác nhau giữa “will be checking”, “will have checked” và “will have been checking for two hours”.',
    checks: [
      'Tôi phân biệt đang diễn ra, kết quả và độ dài.',
      'Tôi giữ đúng chuỗi be/have/been.',
      'Tôi biết không nên dùng dạng dài chỉ để làm câu có vẻ nâng cao.',
    ],
    rules: [
      [
        'Đang diễn ra ở tương lai',
        'Will be + V-ing đặt một hoạt động vào giữa tiến trình tại mốc tương lai.',
        'At ten tomorrow, I will be interviewing applicants.',
      ],
      [
        'Hoàn tất trước mốc',
        'Will have + V3 nhìn kết quả trước hoặc không muộn hơn một mốc tương lai.',
        'By Friday, we will have finished the audit.',
      ],
      [
        'Độ dài tới mốc tương lai',
        'Will have been + V-ing nhấn quá trình kéo dài tới mốc ấy. Đây là dạng ít cần hơn trong giao tiếp thường ngày.',
        'By noon, she will have been working for four hours.',
      ],
    ],
    examples: [
      [
        'By Monday, we will have completed the move.',
        'By Monday, we will have complete the move.',
        'Sau have của hoàn thành cần V3 completed.',
      ],
      [
        'At ten, I will be meeting the supplier.',
        'At ten, I will meeting the supplier.',
        'Will be meeting cần be trước V-ing.',
      ],
    ],
    traps: [
      'Không thêm been vào will have done nếu không cần tiếp diễn hoặc bị động.',
      'Câu có by có thể dùng nhiều thì tùy thời điểm và nghĩa; phải đọc toàn cảnh.',
    ],
    prediction: [
      'Which form explicitly views a completed result from a future point?',
      [
        ['Will be checking', 'Hoạt động đang diễn ra.'],
        ['Will have checked', 'Kết quả đã hoàn tất trước mốc tương lai.'],
        ['Will have been checking', 'Nhấn độ dài/quá trình.'],
      ],
      'B',
      'Will have + V3 là hoàn thành tương lai.',
    ],
    drills: [
      [
        'By the deadline, the team will have ------- all applications.',
        [
          ['review', 'Cần V3 sau have.'],
          ['reviewing', 'Nếu tiếp diễn cần been; đề đang nhìn kết quả.'],
          ['reviewed', 'Will have reviewed đúng hoàn thành tương lai.'],
        ],
        'C',
        'Reviewed là phân từ của review.',
      ],
      [
        'At 9 a.m. tomorrow, I will be ------- the new employees.',
        [
          ['training', 'Will be training diễn tả hoạt động ở giữa tiến trình.'],
          ['train', 'Sau be trong thể tiếp diễn cần V-ing.'],
          [
            'trained',
            'Will be trained là bị động: chính tôi được đào tạo, khác nghĩa đang hướng dẫn nhân viên.',
          ],
        ],
        'A',
        'Training giữ nghĩa chủ động đào tạo new employees.',
      ],
    ],
  },
]
export const timeEntries = drafts.map(entry)
