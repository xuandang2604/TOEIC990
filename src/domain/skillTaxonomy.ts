import type { Skill } from '../content/schema'

export interface SkillNode {
  id: string
  parentId?: string
  label: string
  leaf: boolean
}
const branches: SkillNode[] = [
  { id: 'reading', label: 'Reading', leaf: false },
  { id: 'reading.grammar', parentId: 'reading', label: 'Ngữ pháp', leaf: false },
  {
    id: 'reading.grammar.verbs',
    parentId: 'reading.grammar',
    label: 'Dạng & cấu trúc động từ',
    leaf: false,
  },
  {
    id: 'reading.grammar.syntax',
    parentId: 'reading.grammar',
    label: 'Từ loại & liên kết câu',
    leaf: false,
  },
  { id: 'reading.comprehension', parentId: 'reading', label: 'Đọc hiểu', leaf: false },
  { id: 'listening', label: 'Listening', leaf: false },
  { id: 'listening.comprehension', parentId: 'listening', label: 'Nghe hiểu', leaf: false },
  { id: 'listening.visual', parentId: 'listening', label: 'Kết hợp hình ảnh', leaf: false },
]
const leaves: Record<Skill, { label: string; parentId: string }> = {
  'word-form': { label: 'Từ loại', parentId: 'reading.grammar.syntax' },
  agreement: { label: 'Hòa hợp chủ ngữ & động từ', parentId: 'reading.grammar.verbs' },
  tenses: { label: 'Thì động từ', parentId: 'reading.grammar.verbs' },
  passive: { label: 'Câu bị động', parentId: 'reading.grammar.verbs' },
  'verb-patterns': { label: 'Danh động từ & nguyên mẫu', parentId: 'reading.grammar.verbs' },
  subjunctive: { label: 'Thức giả định', parentId: 'reading.grammar.verbs' },
  modals: { label: 'Động từ khuyết thiếu', parentId: 'reading.grammar.verbs' },
  connectors: { label: 'Liên từ & từ nối', parentId: 'reading.grammar.syntax' },
  prepositions: { label: 'Giới từ', parentId: 'reading.grammar.syntax' },
  comparisons: { label: 'So sánh', parentId: 'reading.grammar.syntax' },
  conditionals: { label: 'Câu điều kiện', parentId: 'reading.grammar.syntax' },
  'relative-clauses': { label: 'Mệnh đề quan hệ', parentId: 'reading.grammar.syntax' },
  'reading-detail': { label: 'Đọc chi tiết', parentId: 'reading.comprehension' },
  'reading-inference': { label: 'Đọc suy luận', parentId: 'reading.comprehension' },
  'text-cohesion': { label: 'Liên kết văn bản', parentId: 'reading.comprehension' },
  'cross-text': { label: 'Đối chiếu nhiều văn bản', parentId: 'reading.comprehension' },
  'listening-intent': { label: 'Ý định người nói', parentId: 'listening.comprehension' },
  'listening-detail': { label: 'Nghe chi tiết', parentId: 'listening.comprehension' },
  'listening-main-idea': { label: 'Nghe ý chính', parentId: 'listening.comprehension' },
  'listening-inference': { label: 'Nghe hàm ý & suy luận', parentId: 'listening.comprehension' },
  'photo-detail': { label: 'Mô tả hình ảnh', parentId: 'listening.visual' },
  'visual-integration': { label: 'Âm thanh & biểu đồ', parentId: 'listening.visual' },
}
export const SKILL_LABELS = Object.fromEntries(
  Object.entries(leaves).map(([id, node]) => [id, node.label]),
) as Record<Skill, string>
const nodes: SkillNode[] = [
  ...branches,
  ...Object.entries(leaves).map(([id, node]) => ({ id, ...node, leaf: true })),
]
// Preorder keeps descendants next to their parent in every consumer. Retain malformed
// or cyclic nodes as well, so validation can report them instead of hiding them.
export const skillTaxonomy: SkillNode[] = []
const orderedIds = new Set<string>()
function appendNode(node: SkillNode) {
  if (orderedIds.has(node.id)) return
  orderedIds.add(node.id)
  skillTaxonomy.push(node)
  nodes.filter((child) => child.parentId === node.id).forEach(appendNode)
}
nodes.filter((node) => !node.parentId).forEach(appendNode)
nodes.forEach(appendNode)
export const skillNodeById = new Map(skillTaxonomy.map((node) => [node.id, node]))
export function skillAncestors(id: string): string[] {
  const result: string[] = []
  let node = skillNodeById.get(id)
  while (node) {
    if (result.includes(node.id)) throw new Error('Cyclic skill taxonomy.')
    result.push(node.id)
    node = node.parentId ? skillNodeById.get(node.parentId) : undefined
  }
  return result
}
export function skillPath(id: string) {
  return skillAncestors(id)
    .reverse()
    .map((key) => skillNodeById.get(key)!.label)
    .join(' → ')
}
export function validateSkillTaxonomy(): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = []
  if (new Set(nodes.map((n) => n.id)).size !== nodes.length)
    issues.push({ path: 'taxonomy', message: 'Duplicate skill node ID.' })
  for (const node of skillTaxonomy) {
    const visited = new Set<string>()
    let current: SkillNode | undefined = node
    while (current) {
      if (visited.has(current.id)) {
        issues.push({ path: `taxonomy.${node.id}`, message: 'Cyclic skill taxonomy.' })
        break
      }
      visited.add(current.id)
      if (current.parentId && !skillNodeById.has(current.parentId))
        issues.push({ path: `taxonomy.${node.id}`, message: 'Missing skill parent.' })
      current = current.parentId ? skillNodeById.get(current.parentId) : undefined
    }
  }
  return issues
}
