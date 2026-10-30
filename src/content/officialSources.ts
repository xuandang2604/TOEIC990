import type { PracticeSource } from '../domain/sourcePractice'
import { validPracticeSource } from '../domain/sourcePractice'

/** Link metadata checked against the publisher on 2026-10-29. No licensed items are redistributed. */
const base = 'https://www.iibc-global.org/toeic/test/lr/about/format/'
const range = (from: number, through: number) =>
  Array.from({ length: through - from + 1 }, (_, i) => from + i)
const groups = (part: PracticeSource['groups'][number]['part'], numbers: number[][]) =>
  numbers.map((numbers) => ({ part, numbers }))
export const officialSources: (PracticeSource & { focus: string; grammarIds: string[] })[] = [
  {
    id: 'iibc-lr-p1',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 1 · Photographs',
    url: base + 'sample01.html',
    groups: groups(1, [[1], [2]]),
    focus: 'Đối chiếu điều thực sự nhìn thấy với hành động và trạng thái được nghe.',
    grammarIds: [],
  },
  {
    id: 'iibc-lr-p2',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 2 · Question–Response',
    url: base + 'sample02.html',
    groups: groups(2, [[7], [8], [9], [10]]),
    focus: 'Nhận ra mục đích giao tiếp; lời đáp phù hợp có thể gián tiếp.',
    grammarIds: [],
  },
  {
    id: 'iibc-lr-p3',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 3 · Conversations',
    url: base + 'sample03.html',
    groups: groups(3, [range(32, 34), range(35, 37), range(38, 40), range(41, 43)]),
    focus:
      'Giữ nguyên nhóm ba câu. Phân biệt chi tiết, ý định, suy luận và câu cần đối chiếu hình.',
    grammarIds: [],
  },
  {
    id: 'iibc-lr-p4',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 4 · Short Talks',
    url: base + 'sample04.html',
    groups: groups(4, [range(71, 73), range(74, 76), range(77, 79), range(80, 82)]),
    focus:
      'Phân biệt thông tin nền, hành động được yêu cầu và ý nghĩa của phát ngôn trong ngữ cảnh.',
    grammarIds: [],
  },
  {
    id: 'iibc-lr-p5',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 5 · Incomplete Sentences',
    url: base + 'sample05.html',
    groups: groups(
      5,
      range(101, 105).map((n) => [n]),
    ),
    focus:
      'Tách câu kiểm tra từ loại/cấu trúc khỏi câu nhiều lựa chọn cùng từ loại nhưng khác nghĩa.',
    grammarIds: ['word-forms', 'tenses'],
  },
  {
    id: 'iibc-lr-p6',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 6 · Text Completion',
    url: base + 'sample06.html',
    groups: groups(6, [range(131, 134)]),
    focus: 'Đọc đủ văn bản; chỗ trống cả câu cần liên kết được hai phía và mục đích người viết.',
    grammarIds: ['connectors'],
  },
  {
    id: 'iibc-lr-p7-single-a',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 7 · Single passages I',
    url: base + 'sample07_01.html',
    groups: groups(7, [range(147, 148), range(149, 151)]),
    focus:
      'Phân biệt thông tin nêu trực tiếp với kết luận có bằng chứng; giữ đúng vai trò người và tổ chức.',
    grammarIds: [],
  },
  {
    id: 'iibc-lr-p7-single-b',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 7 · Messages & sentence insertion',
    url: base + 'sample07_02.html',
    groups: groups(7, [range(152, 153), range(161, 164)]),
    focus:
      'Đọc lời đáp theo lượt hội thoại; với chèn câu, kiểm tra đối tượng quy chiếu và mạch hai bên.',
    grammarIds: ['connectors'],
  },
  {
    id: 'iibc-lr-p7-double',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 7 · Double passages',
    url: base + 'sample07_03.html',
    groups: groups(7, [range(176, 180)]),
    focus: 'Xác định mỗi dữ kiện thuộc nguồn nào trước khi nối thông tin giữa hai văn bản.',
    grammarIds: [],
  },
  {
    id: 'iibc-lr-p7-triple',
    revision: 'checked-2026-10-29',
    kind: 'official-sample',
    title: 'Part 7 · Triple passages',
    url: base + 'sample07_04.html',
    groups: groups(7, [range(196, 200)]),
    focus: 'Ghép điều kiện trong nhiều văn bản, đồng thời phân biệt nghĩa của từ theo ngữ cảnh.',
    grammarIds: [],
  },
]
export const officialSampleCount = officialSources.reduce(
  (n, source) => n + source.groups.reduce((n, group) => n + group.numbers.length, 0),
  0,
)
export function officialSourceIssues(grammarIds: string[]) {
  const ids = new Set<string>()
  return officialSources.flatMap((source) => {
    const bad =
      !validPracticeSource(source) ||
      ids.has(source.id) ||
      source.grammarIds.some((id) => !grammarIds.includes(id)) ||
      source.groups.some((g) =>
        g.part === 3 || g.part === 4
          ? g.numbers.length !== 3
          : g.part === 6
            ? g.numbers.length !== 4
            : false,
      )
    ids.add(source.id)
    return bad
      ? [
          {
            path: `officialSources.${source.id}`,
            message: 'Invalid source metadata, group structure or reference.',
          },
        ]
      : []
  })
}
