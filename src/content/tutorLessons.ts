import type { TutorLesson } from '../domain/tutorModels'

const provenance: TutorLesson['provenance'] = {
  kind: 'original',
  author: 'STUDY 990',
  revision: '2026-10-task05',
  note: 'Hướng dẫn ngữ pháp tự biên soạn cho Tutor offline. Phản hồi nhắm vào lý do người học tự chọn, không phân tích ngữ nghĩa bài viết.',
}
type LessonDraft = Omit<TutorLesson, 'id' | 'provenance'>
const lessons: LessonDraft[] = [
  {
    grammarId: 'word-forms',
    skills: ['word-form'],
    questionIds: ['p5-efficiently', 'p5-reliable'],
    transferIds: ['transfer-word-forms', 'transfer-word-forms-2'],
    cue: 'Từ nào được chỗ trống bổ nghĩa: danh từ hay hành động?',
    simple:
      'Chọn từ như chọn đúng dụng cụ. Mô tả một danh từ thường cần tính từ; mô tả cách một hành động diễn ra thường cần trạng từ. Đọc chức năng trước khi nhìn đuôi từ.',
    steps: [
      'Tìm động từ chính và danh từ trung tâm.',
      'Xác định chỗ trống bổ nghĩa cho từ nào.',
      'Đối chiếu tính từ, trạng từ, danh từ và động từ trong các lựa chọn.',
      'Đọc lại cả cụm để kiểm tra nghĩa và cấu trúc.',
    ],
    reasons: [
      {
        id: 'meaning-only',
        label: 'Mình chọn vì nghĩa có vẻ hợp.',
        response:
          'Bạn tự chọn lý do dựa vào nghĩa. Các từ cùng họ có thể gần nghĩa nhưng khác chức năng; hãy chỉ ra từ mà chỗ trống bổ nghĩa trước.',
        followUp:
          'Nếu giữ nghĩa nhưng đổi danh từ được bổ nghĩa thành một hành động, từ loại cần đổi thế nào?',
      },
      {
        id: 'suffix',
        label: 'Mình chủ yếu nhìn đuôi từ.',
        response:
          'Đuôi từ là một dấu hiệu hữu ích, chưa phải bằng chứng đủ. Friendly là tính từ; vì vậy cần kiểm tra vị trí và chức năng thay vì coi mọi -ly là trạng từ.',
        followUp:
          'Bạn có thể giải thích vì sao a friendly colleague không dùng friendly như một trạng từ không?',
      },
      {
        id: 'function',
        label: 'Mình xác định từ được bổ nghĩa trước.',
        response:
          'Đây là chiến lược bạn tự báo cáo. Hãy kiểm chứng nó bằng cách gọi tên từ được bổ nghĩa trong chính câu đã làm, rồi thử đổi cấu trúc.',
        followUp: 'Hãy viết lại câu mà tính từ được đổi thành trạng từ, hoặc ngược lại.',
      },
    ],
    example: {
      sentence: 'The team gave a careful response. / The team responded carefully.',
      explanation: 'Careful bổ nghĩa cho response; carefully bổ nghĩa cho responded.',
      changed: 'The response was careful.',
      contrast: 'Sau linking verb was, careful mô tả chủ ngữ; không tự động thêm -ly sau be.',
    },
    prompts: {
      why: 'Bạn chọn vì nghĩa, hậu tố hay từ đang được bổ nghĩa?',
      rule: 'Chỗ trống cần chức năng gì trong câu đã làm?',
      simplify: 'Giải thích “tính từ và trạng từ” bằng hai câu có careful/carefully.',
      change: 'Nếu chuyển cụm danh từ thành động từ hành động, dạng từ thay đổi ra sao?',
      exception: 'Vì sao friendly có -ly nhưng không phải trạng từ trong a friendly colleague?',
      apply: 'Trong câu mới, hãy nêu từ được bổ nghĩa trước khi chọn đáp án.',
    },
  },
  {
    grammarId: 'agreement',
    skills: ['agreement'],
    questionIds: ['p5-agreement'],
    transferIds: ['transfer-agreement', 'transfer-agreement-2'],
    cue: 'Danh từ trung tâm của chủ ngữ, không phải danh từ đứng gần động từ nhất.',
    simple:
      'Động từ “đi theo” chủ ngữ trung tâm. Phần chen giữa chỉ bổ sung thông tin. Each employee vẫn là từng người, dù phía sau có offices số nhiều.',
    steps: [
      'Khoanh toàn bộ cụm chủ ngữ.',
      'Tạm gạch cụm giới từ như in the offices hoặc of rooms.',
      'Xác định danh từ trung tâm là số ít hay số nhiều.',
      'Chọn động từ hữu hạn đúng thì và đúng số.',
    ],
    reasons: [
      {
        id: 'nearest-noun',
        label: 'Mình chia theo danh từ gần chỗ trống nhất.',
        response:
          'Bạn đang tự chỉ ra cách dựa vào khoảng cách. Danh từ trong cụm giới từ không quyết định hòa hợp; hãy bỏ cụm đó và đọc câu còn lại.',
        followUp: 'Khi bỏ cụm giới từ, chủ ngữ thực sự của câu đã làm còn từ nào?',
      },
      {
        id: 'each-plural',
        label: 'Each nói đến nhiều người nên mình chọn số nhiều.',
        response:
          'Each xét từng cá thể, nên each + danh từ số ít thường đi với động từ số ít. “Nhiều người trong nhóm” không đồng nghĩa với chủ ngữ ngữ pháp số nhiều.',
        followUp: 'Each employee receives và Employees receive khác nhau ở đâu?',
      },
      {
        id: 'head-noun',
        label: 'Mình tìm danh từ trung tâm của chủ ngữ.',
        response:
          'Hãy kiểm lại chiến lược bạn vừa chọn: nêu danh từ trung tâm, số của nó và phần chỉ bổ sung thông tin. Một câu đúng chưa chứng minh quy tắc đã bền.',
        followUp:
          'Nếu đổi chủ ngữ thành the boxes beside the printer, động từ sẽ theo boxes hay printer?',
      },
    ],
    example: {
      sentence: 'The number of late deliveries is decreasing.',
      explanation: 'The number là chủ ngữ trung tâm số ít; of late deliveries không đổi số.',
      changed: 'A number of deliveries are late.',
      contrast:
        'A number of có nghĩa là một số và đi với động từ số nhiều; đừng áp dụng máy móc cùng một mẫu cho cả hai cụm.',
    },
    prompts: {
      why: 'Từ nào khiến bạn chọn dạng động từ đó?',
      rule: 'Bạn đang chia theo danh từ trung tâm hay danh từ trong cụm giới từ?',
      simplify: 'Nếu tạm bỏ phần chen giữa, hãy nói lại câu bằng cấu trúc ngắn nhất.',
      change: 'Đổi chủ ngữ từ each employee thành the employees: động từ đổi thế nào?',
      exception: 'So sánh a number of và the number of: cụm nào dùng động từ số ít?',
      apply: 'Ở câu mới, tìm chủ ngữ trước rồi mới nhìn đáp án.',
    },
  },
  {
    grammarId: 'tenses',
    skills: ['tenses'],
    questionIds: ['p5-tense'],
    transferIds: ['transfer-tenses', 'transfer-tenses-2'],
    cue: 'Khoảng thời gian còn nối đến hiện tại hay đã kết thúc?',
    simple:
      'Đừng chọn thì chỉ vì câu có một năm trong quá khứ. Hãy xem hành động nằm hoàn toàn trong quá khứ hay khoảng thời gian còn kéo đến bây giờ.',
    steps: [
      'Tìm dấu hiệu thời gian và ranh giới của nó.',
      'Xác định hành động đã kết thúc hay còn liên hệ hiện tại trong ngữ cảnh.',
      'Đối chiếu cấu trúc của từng thì.',
      'Kiểm tra trợ động từ và chủ ngữ.',
    ],
    reasons: [
      {
        id: 'past-year',
        label: 'Thấy năm quá khứ nên mình chọn thì quá khứ.',
        response:
          'Bạn tự cho biết đang dựa vào năm quá khứ. Since có thể lấy mốc đó làm điểm bắt đầu cho khoảng nối đến hiện tại; cần đọc cả cụm thời gian.',
        followUp:
          'Trong since she joined, mốc quá khứ thuộc mệnh đề nào và hành động nào còn nối đến nay?',
      },
      {
        id: 'keyword',
        label: 'Mình áp dụng một từ khóa mà chưa xét khoảng thời gian.',
        response:
          'Dấu hiệu như since/so far giúp định hướng, nhưng nghĩa toàn câu vẫn quyết định. Hãy vẽ điểm bắt đầu và điểm kết thúc thay vì chỉ ghi tên một từ khóa.',
        followUp: 'Nếu thay dấu hiệu đó bằng two days ago, lựa chọn thì sẽ đổi ra sao?',
      },
      {
        id: 'timeline',
        label: 'Mình xác định khoảng thời gian của hành động.',
        response:
          'Hãy nói rõ hai đầu mốc thời gian để kiểm chứng điều bạn tự báo cáo. Nêu vì sao một thì khác không mô tả đúng khoảng đó.',
        followUp: 'So sánh một câu có so far this month với một câu có last month.',
      },
    ],
    example: {
      sentence: 'We have received five applications so far this week.',
      explanation:
        'So far this week tính từ đầu tuần đến hiện tại, phù hợp với hiện tại hoàn thành.',
      changed: 'We received five applications last week.',
      contrast:
        'Last week đã kết thúc nên dùng quá khứ đơn trong câu này. Since cũng có thể chỉ nguyên nhân ở ngữ cảnh khác; không coi nó luôn là dấu hiệu thời gian.',
    },
    prompts: {
      why: 'Bạn dựa vào mốc hay khoảng thời gian nào?',
      rule: 'Hành động có nối đến hiện tại trong câu này không?',
      simplify: 'Nói lại bằng “bắt đầu lúc… và tính đến…” hoặc “đã xảy ra vào…”.',
      change: 'Đổi so far this week thành last week thì động từ đổi ra sao?',
      exception: 'Since trong Since it was raining, we stayed inside có chỉ thời gian không?',
      apply: 'Dựng trục thời gian cho câu mới trước khi chọn thì.',
    },
  },
  {
    grammarId: 'passive',
    skills: ['passive'],
    questionIds: ['p5-passive'],
    transferIds: ['transfer-passive', 'transfer-passive-2'],
    cue: 'Chủ ngữ thực hiện hay nhận hành động?',
    simple:
      'Nếu chủ ngữ được ai đó làm gì, hãy xét bị động. Với must/should, giữ modal rồi dùng be + V3. Không chỉ thêm một từ đuôi -ed và bỏ mất be.',
    steps: [
      'Đọc nghĩa của chủ ngữ với động từ.',
      'Xác định bên thực hiện và bên nhận hành động.',
      'Nếu bị động, tạo be + V3.',
      'Chia be theo thì hoặc giữ nguyên sau modal.',
    ],
    reasons: [
      {
        id: 'modal-base',
        label: 'Sau modal dùng nguyên mẫu nên mình bỏ be.',
        response:
          'Bạn nhớ yêu cầu nguyên mẫu sau modal nhưng cần giữ cả cụm bị động. Trong must be approved, be là nguyên mẫu và approved là V3.',
        followUp:
          'Từ nào mang dạng nguyên mẫu và từ nào mang dấu hiệu bị động trong must be approved?',
      },
      {
        id: 'ed-only',
        label: 'Mình thấy V3/đuôi -ed là đủ cho bị động.',
        response:
          'V3 chưa đủ để tạo vị ngữ bị động hữu hạn trong mẫu câu này. Cần be được chia phù hợp hoặc be nguyên mẫu sau modal.',
        followUp:
          'Forms processed every month và Forms are processed every month khác nhau về vị ngữ ra sao?',
      },
      {
        id: 'receiver',
        label: 'Mình xác định chủ ngữ là bên nhận hành động.',
        response:
          'Hãy làm rõ điều bạn vừa chọn bằng câu chủ động tương ứng. Sau đó chỉ ra be và V3 trong câu bị động.',
        followUp: 'Chuyển The manager approves the claim thành câu bắt đầu bằng The claim.',
      },
    ],
    example: {
      sentence: 'The entrance must be inspected before opening.',
      explanation: 'Entrance nhận hành động inspect; sau must dùng be inspected.',
      changed: 'The engineer must inspect the entrance.',
      contrast:
        'Engineer thực hiện hành động nên dùng must inspect. Không phải mọi câu có be đều bị động: The entrance is narrow dùng tính từ.',
    },
    prompts: {
      why: 'Chủ ngữ trong câu có tự thực hiện hành động không?',
      rule: 'Bạn cần cấu trúc chủ động hay be + V3?',
      simplify: 'Nói bằng tiếng Việt ai làm gì cho ai, rồi đặt lại chủ ngữ.',
      change: 'Nếu đổi chủ ngữ từ entrance sang engineer, cụm động từ đổi thế nào?',
      exception: 'The entrance is narrow có phải bị động chỉ vì có is không?',
      apply: 'Ở câu vận dụng, kiểm tra cả vai trò chủ ngữ và dạng của be.',
    },
  },
  {
    grammarId: 'verb-patterns',
    skills: ['verb-patterns'],
    questionIds: ['p5-gerund'],
    transferIds: ['transfer-gerund', 'transfer-gerund-2'],
    cue: 'Mẫu đi sau động từ hoặc cụm cố định nào đang chi phối chỗ trống?',
    simple:
      'Động từ thường đi theo những “khung” riêng. Postpone + V-ing; agree + to V. To trong look forward to là giới từ nên sau nó dùng V-ing.',
    steps: [
      'Tìm động từ/cụm cố định ngay trước phần còn thiếu.',
      'Đối chiếu mẫu của chính cụm đó.',
      'Phân biệt to giới từ với to của nguyên mẫu.',
      'Kiểm tra nghĩa chủ động/bị động và tân ngữ.',
    ],
    reasons: [
      {
        id: 'all-to',
        label: 'Mình nghĩ sau mọi to đều là động từ nguyên mẫu.',
        response:
          'Bạn tự chọn một khái quát quá rộng. Trong look forward to, to là giới từ; nhưng trong agree to do, to thuộc nguyên mẫu.',
        followUp:
          'Vì sao look forward to meeting và agree to meet cùng có to nhưng dùng dạng khác nhau?',
      },
      {
        id: 'all-ing',
        label: 'Mình dùng V-ing cho mọi động từ thứ hai.',
        response:
          'V-ing không phải mẫu chung cho mọi động từ. Hãy ghi một cặp tương phản: postpone doing và agree to do.',
        followUp: 'Nếu thay postponed bằng agreed, bạn cần đổi phần theo sau thế nào?',
      },
      {
        id: 'pattern',
        label: 'Mình tra mẫu của động từ hoặc cụm đứng trước.',
        response:
          'Hãy gọi tên chính cụm chi phối lựa chọn, thay vì chỉ nói “sau động từ”. Đối chiếu với một cụm có mẫu khác.',
        followUp: 'Nêu hai cụm cùng chủ đề công việc nhưng dùng V-ing và to V khác nhau.',
      },
    ],
    example: {
      sentence: 'We look forward to discussing the proposal.',
      explanation: 'To trong look forward to là giới từ: discussing.',
      changed: 'We agreed to discuss the proposal.',
      contrast:
        'Agree dùng to-infinitive. Mẫu bổ ngữ phụ thuộc động từ/cụm, không phụ thuộc việc đây là động từ “thứ hai”.',
    },
    prompts: {
      why: 'Cụm nào ngay trước chỗ trống đã dẫn bạn đến lựa chọn?',
      rule: 'Bạn áp dụng mẫu của postpone, agree hay look forward to?',
      simplify: 'Giải thích “to có hai vai trò” bằng hai ví dụ ngắn.',
      change: 'Thay postponed bằng agreed thì dạng theo sau đổi thế nào?',
      exception: 'Vì sao look forward to meeting không dùng meet sau to?',
      apply: 'Gọi tên khung của động từ đầu trong câu mới.',
    },
  },
  {
    grammarId: 'connectors',
    skills: ['connectors'],
    questionIds: ['p5-connectors'],
    transferIds: ['transfer-connectors', 'transfer-connectors-2'],
    cue: 'Sau từ nối là mệnh đề hay cụm danh từ, và quan hệ ý nghĩa là gì?',
    simple:
      'Although và despite đều có thể diễn tả “mặc dù”, nhưng đi với phần theo sau khác nhau. Although + mệnh đề; despite + cụm danh từ hoặc V-ing.',
    steps: [
      'Đọc quan hệ giữa hai ý: nguyên nhân, nhượng bộ hay điều kiện.',
      'Kiểm tra phần theo sau có chủ ngữ và động từ hữu hạn không.',
      'Chọn từ nối phù hợp cả nghĩa và cấu trúc.',
      'Đọc lại toàn câu, tránh thêm of sau despite.',
    ],
    reasons: [
      {
        id: 'translation',
        label: 'Mình dịch nghĩa từ nối nhưng chưa xét cấu trúc.',
        response:
          'Bạn tự báo cáo đang dựa vào bản dịch. Hai từ cùng nghĩa gần nhau vẫn có khung khác nhau; hãy kiểm tra phần sau chỗ trống.',
        followUp: 'Phần sau chỗ trống trong câu đã làm là cụm danh từ hay có chủ ngữ và động từ?',
      },
      {
        id: 'despite-clause',
        label: 'Mình nghĩ despite đi trực tiếp với một mệnh đề.',
        response:
          'Despite không nối trực tiếp một mệnh đề hữu hạn trong mẫu này. Có thể dùng despite the fact that + mệnh đề, hoặc đổi sang although.',
        followUp: 'Hãy biến despite the delay thành một cụm bắt đầu bằng although.',
      },
      {
        id: 'form-and-meaning',
        label: 'Mình kiểm tra cả quan hệ ý nghĩa và dạng theo sau.',
        response:
          'Hãy kiểm chứng lựa chọn chiến lược đó bằng việc nêu cả hai: vì sao là nhượng bộ và vì sao dạng theo sau phù hợp.',
        followUp: 'Giữ nguyên ý nhưng đổi mệnh đề thành cụm danh từ: từ nối phải đổi không?',
      },
    ],
    example: {
      sentence: 'Although the delivery was late, the store opened on time.',
      explanation: 'The delivery was late là mệnh đề có chủ ngữ và động từ.',
      changed: 'Despite the late delivery, the store opened on time.',
      contrast:
        'The late delivery là cụm danh từ. Despite the fact that the delivery was late cũng được; đó không phải despite đứng trực tiếp trước một mệnh đề.',
    },
    prompts: {
      why: 'Bạn đang diễn đạt quan hệ gì giữa hai ý?',
      rule: 'Phần sau chỗ trống là mệnh đề hay cụm danh từ?',
      simplify: 'Giải thích khác biệt although/despite bằng một cặp cùng nghĩa.',
      change: 'Đổi the delivery was late thành the late delivery thì dùng từ nối nào?',
      exception: 'Tại sao despite the fact that + mệnh đề vẫn hợp lệ?',
      apply: 'Kiểm tra cả nghĩa và cấu trúc trong câu mới.',
    },
  },
  {
    grammarId: 'conditionals',
    skills: ['conditionals'],
    questionIds: ['p5-conditionals'],
    transferIds: ['transfer-conditionals', 'transfer-conditionals-2'],
    cue: 'Điều kiện tương lai thông thường: if/unless + hiện tại đơn, kết quả will + V.',
    simple:
      'Hai vế có vai trò khác nhau. Một vế đặt điều kiện, vế kia nêu kết quả. Có tomorrow không có nghĩa là cả hai vế đều cần will.',
    steps: [
      'Xác định vế điều kiện và vế kết quả.',
      'Đọc nghĩa tương lai có thể xảy ra trong ngữ cảnh.',
      'Dùng hiện tại đơn ở vế if/unless trong mẫu này.',
      'Dùng will + V ở vế kết quả; kiểm tra hòa hợp ở vế điều kiện.',
    ],
    reasons: [
      {
        id: 'future-both',
        label: 'Có thời gian tương lai nên mình dùng will ở cả hai vế.',
        response:
          'Bạn tự chỉ ra việc chọn theo thời gian chung. Với điều kiện tương lai thông thường, hiện tại đơn ở vế if/unless vẫn diễn tả điều kiện tương lai.',
        followUp: 'Trong câu đã làm, vế nào đặt điều kiện và vế nào nêu kết quả?',
      },
      {
        id: 'unless-negative',
        label: 'Mình hiểu unless như if nên bỏ qua nghĩa phủ định.',
        response:
          'Unless thường tương đương if ... not trong mẫu điều kiện này. Đừng thêm một phủ định nữa nếu nó làm đảo ý muốn diễn đạt.',
        followUp: 'Nói lại Unless the customer confirms ... bằng If the customer does not ...',
      },
      {
        id: 'clause-role',
        label: 'Mình phân biệt rõ vế điều kiện và kết quả.',
        response:
          'Hãy kiểm lại bằng cách nói vai trò từng vế và chỉ ra chủ ngữ của động từ trong vế điều kiện.',
        followUp: 'Nếu thay if bằng unless, nghĩa điều kiện phải đổi ra sao để giữ nguyên ý?',
      },
    ],
    example: {
      sentence: 'If the supplier confirms today, we will place the order.',
      explanation: 'Confirms là hiện tại đơn trong vế điều kiện tương lai.',
      changed: 'We will not place the order unless the supplier confirms today.',
      contrast:
        'Unless mang nghĩa “trừ khi / nếu không”. Will có thể xuất hiện sau if để nói sự sẵn lòng trong ngữ cảnh khác; không suy ra một lệnh cấm tuyệt đối cho mọi if.',
    },
    prompts: {
      why: 'Bạn đặt will theo dấu hiệu thời gian hay theo vai trò mệnh đề?',
      rule: 'Vế điều kiện tương lai thông thường dùng thì nào?',
      simplify: 'Nói lại bằng “nếu điều này xảy ra, kết quả sẽ là…”.',
      change: 'Thay if bằng unless thì bạn cần chú ý điều gì về nghĩa?',
      exception: 'Quy tắc mẫu này có chứng minh will bị cấm trong mọi mệnh đề if không?',
      apply: 'Trong câu mới, đánh dấu hai vế trước khi chọn.',
    },
  },
  {
    grammarId: 'relatives',
    skills: ['relative-clauses'],
    questionIds: ['p5-relative'],
    transferIds: ['transfer-relative', 'transfer-relative-2'],
    cue: 'Trong mệnh đề quan hệ thiếu chủ ngữ, tân ngữ hay quan hệ sở hữu?',
    simple:
      'Đừng chỉ hỏi danh từ trước là người hay vật. Hãy đọc phần sau để biết đang thiếu vai trò gì. Whose + danh từ chỉ sở hữu; who có thể làm chủ ngữ chỉ người.',
    steps: [
      'Tìm danh từ được mệnh đề quan hệ mô tả.',
      'Đọc mệnh đề sau chỗ trống và tìm vai trò còn thiếu.',
      'Phân biệt who/whom với whose + danh từ.',
      'Kiểm tra câu sau khi nối lại.',
    ],
    reasons: [
      {
        id: 'person-only',
        label: 'Thấy danh từ chỉ người nên mình chọn who ngay.',
        response:
          'Bạn đang tự báo cáo chỉ dùng một nửa dấu hiệu. Với người vẫn có thể cần whose hoặc whom, tùy vai trò còn thiếu.',
        followUp: 'Danh từ sau chỗ trống thuộc về người đó hay là chủ ngữ riêng của một động từ?',
      },
      {
        id: 'whose-person',
        label: 'Mình nghĩ whose chỉ dùng với người.',
        response:
          'Whose chỉ sở hữu và cũng dùng được cho tổ chức hoặc vật. Trọng tâm là quan hệ sở hữu, không phải một lệnh cấm về vật.',
        followUp: 'Trong the company whose policy changed, whose nối quan hệ gì?',
      },
      {
        id: 'missing-role',
        label: 'Mình xác định vai trò còn thiếu trong mệnh đề.',
        response:
          'Hãy kiểm chứng điều bạn chọn bằng cách tách mệnh đề thành một câu độc lập, rồi chỉ ra phần được thay bằng đại từ quan hệ.',
        followUp: 'So sánh the candidate whose application arrived với the candidate who arrived.',
      },
    ],
    example: {
      sentence: 'The company whose policy changed contacted its suppliers.',
      explanation: 'Whose policy nói đến chính sách của công ty.',
      changed: 'The engineer who designed the system contacted the supplier.',
      contrast:
        'Who làm chủ ngữ của designed; không dùng whose trực tiếp trước động từ designed. Whose không bị giới hạn chỉ cho người.',
    },
    prompts: {
      why: 'Bạn dựa vào danh từ đứng trước hay vai trò còn thiếu ở phía sau?',
      rule: 'Bạn cần chủ ngữ, tân ngữ hay whose + danh từ?',
      simplify: 'Tách mệnh đề quan hệ thành một câu độc lập để thấy phần bị thay thế.',
      change: 'Đổi whose application arrived thành who arrived thì quan hệ thay đổi ra sao?',
      exception: 'The company whose policy changed có dùng whose hợp lệ không?',
      apply: 'Trong câu mới, tìm chỗ thiếu vai trò trước khi chọn đại từ.',
    },
  },
  {
    grammarId: 'subjunctive',
    skills: ['subjunctive'],
    questionIds: ['p5-subjunctive'],
    transferIds: ['transfer-subjunctive', 'transfer-subjunctive-2'],
    cue: 'Đây là kiến nghị/yêu cầu, hay một thông báo sự thật?',
    simple:
      'Khi that-clause diễn đạt kiến nghị hoặc điều cần thiết, tiếng Anh có mẫu giả định dùng động từ nguyên mẫu không to. Với bị động, dùng be + V3. Không áp dụng mẫu đó cho mọi mệnh đề that.',
    steps: [
      'Xác định nghĩa kiến nghị, yêu cầu hoặc cần thiết.',
      'Tìm that + chủ ngữ của mệnh đề.',
      'Dùng động từ nguyên mẫu không to trong mẫu giả định này.',
      'Nếu chủ ngữ nhận hành động, dùng be + V3.',
    ],
    reasons: [
      {
        id: 'singular-s',
        label: 'Chủ ngữ số ít nên mình thêm -s như hiện tại đơn.',
        response:
          'Bạn tự chọn quy tắc hòa hợp thông thường. Trong mẫu kiến nghị giả định đang xét, động từ giữ nguyên mẫu dù chủ ngữ số ít.',
        followUp:
          'So sánh She attends với They recommended that she attend: vai trò hai câu khác gì?',
      },
      {
        id: 'all-that',
        label: 'Mình áp dụng nguyên mẫu cho mọi mệnh đề that.',
        response:
          'Đó là phạm vi quá rộng bạn tự nêu. That tự nó không tạo giả định; cần nghĩa kiến nghị/yêu cầu/cần thiết của cấu trúc.',
        followUp: 'Vì sao She said that he works here không bắt buộc đổi works thành work?',
      },
      {
        id: 'mandative',
        label: 'Mình nhận ra nghĩa kiến nghị/cần thiết trước.',
        response:
          'Hãy kiểm chứng chiến lược đó: nêu từ/cụm kích hoạt nghĩa kiến nghị, rồi phân biệt chủ động và bị động trong mệnh đề.',
        followUp: 'Nếu đối tượng cần được kiểm tra, bạn sẽ dùng inspect hay be inspected?',
      },
    ],
    example: {
      sentence: 'They requested that the report be revised.',
      explanation: 'Requested that diễn tả yêu cầu; report nhận hành động nên dùng be revised.',
      changed: 'They confirmed that the report was revised.',
      contrast:
        'Confirmed thông báo một sự việc, không tự tạo mẫu kiến nghị. Should + V cũng là cách dùng được trong nhiều cấu trúc kiến nghị, đặc biệt trong Anh-Anh.',
    },
    prompts: {
      why: 'Bạn dựa vào chủ ngữ hay nghĩa kiến nghị của cấu trúc?',
      rule: 'Từ/cụm nào làm that-clause mang nghĩa yêu cầu hoặc cần thiết?',
      simplify: 'Giải thích vì sao chủ ngữ số ít vẫn có thể đi với attend trong mẫu này.',
      change: 'Đổi requested thành confirmed có còn bắt buộc dùng mẫu giả định không?',
      exception: 'Có phải mọi câu có that đều dùng nguyên mẫu không?',
      apply: 'Ở câu mới, kiểm tra nghĩa kích hoạt và chủ động/bị động.',
    },
  },
]
export const tutorLessons: TutorLesson[] = lessons.map((lesson) => ({
  ...lesson,
  id: `tutor-${lesson.grammarId}`,
  questionIds: [...lesson.questionIds, ...lesson.transferIds],
  provenance,
}))
export const tutorLessonByQuestion = new Map(
  tutorLessons.flatMap((lesson) => lesson.questionIds.map((id) => [id, lesson] as const)),
)
