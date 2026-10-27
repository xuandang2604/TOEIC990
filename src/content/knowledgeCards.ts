/** Authored retrieval prompts. Answers come from the corresponding validated grammar lesson. */
import { handbookEntries } from './handbook'
export const knowledgePrompts: Record<string, string> = {
  ...Object.fromEntries(handbookEntries.map(({ guide }) => [guide.lessonId, guide.prompt])),
  'word-forms':
    'Làm sao xác định cần danh từ, tính từ hay trạng từ trong một chỗ trống? Hãy nêu một ví dụ với efficient.',
  agreement:
    'Với “Each employee” và “The list of applicants”, động từ chia theo từ nào? Giải thích trước khi xem lại.',
  tenses:
    'So sánh cách dùng “since 2022” với “yesterday”. Khi nào dùng hiện tại hoàn thành, khi nào dùng quá khứ đơn?',
  passive:
    'Tự viết cấu trúc bị động sau must và trong hiện tại hoàn thành. Vì sao không được bỏ be/been?',
  'verb-patterns':
    'Sau postpone, decide và look forward to, động từ theo sau ở dạng nào? To có vai trò gì trong từng trường hợp?',
  connectors:
    'Nêu điểm khác nhau giữa although/despite và because/because of, rồi tự đặt hai câu về việc giao hàng.',
  conditionals:
    'Tự viết mẫu điều kiện loại 1, 2, 3. Kết quả của mỗi mẫu nói về thời điểm hoặc mức độ thực tế nào?',
  relatives:
    'Phân biệt who, which, whose. Khi nào có thể lược bỏ đại từ quan hệ? Hãy nêu một ví dụ sở hữu.',
  subjunctive:
    'Sau recommend that và it is essential that, động từ có thể dùng dạng nào? Viết thêm một mẫu bị động và một mẫu phủ định.',
  prepositions:
    'Phân biệt by và until khi nói hạn nộp/giờ mở cửa. Comply và participate thường đi với giới từ nào?',
  comparisons:
    'Phân biệt more reliable, more efficiently và as convenient as. Vì sao “more cheaper” không phù hợp?',
  modals:
    'Must not và do not have to khác nhau thế nào? Sau can/must động từ có thêm s hoặc to không?',
}
