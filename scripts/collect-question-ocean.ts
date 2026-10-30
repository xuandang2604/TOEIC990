import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'
import { findTextNearDuplicates } from '../src/content/similarity'

const commit = 'a940bb8b479ef4d06af468015d757041c3d2e457'
const base = `https://raw.githubusercontent.com/kdeppaei/toeic-question-ocean/${commit}/`
// Script order in the pinned upstream index.html matters: later files repair earlier items.
const files = [
  'question-bank.js',
  ...[
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '210',
    '30',
    '31',
    '32',
    '33',
    '34',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    '47',
    '50',
  ].map((version) => `question-bank-v${version}.js`),
]
const root = resolve('content/sources/toeic-question-ocean', commit)
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
type Data = null | boolean | number | string | Data[] | { [key: string]: Data }
type Row = { [key: string]: Data }
interface Candidate {
  id: string
  part: number
  source: { file: string; line: number }
  raw: Row
  amendments: { file: string; reason: string }[]
  issues: string[]
}
const object = (value: Data | undefined): value is Row =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value: Data | undefined) => (typeof value === 'string' ? value : '')
const texts = (value: Data | undefined): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

async function archive(name: string, offline: boolean) {
  const path = resolve(root, name.endsWith('.js') ? `${name}.txt` : name)
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (offline) throw new Error(`Missing archived source: ${name}`)
  const remoteName =
    name === 'LICENSE.txt' ? 'LICENSE' : name === 'index.html.txt' ? 'index.html' : name
  const response = await fetch(base + remoteName, {
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
  })
  if (!response.ok || !response.body)
    throw new Error(`Download failed: ${name} (${response.status})`)
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 512_000) throw new Error(`Source too large: ${name}`)
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
    reader.releaseLock()
  }
  const value = Buffer.concat(chunks).toString('utf8')
  await writeFile(path, value, { flag: 'wx' })
  return value
}

/** A data-only AST reader. No eval, VM, dynamic import, calls or property access from source. */
function parser(name: string, source: string) {
  if (Buffer.byteLength(source) > 512_000) throw new Error(`Source too large: ${name}`)
  const file = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const diagnostics = (file as ts.SourceFile & { parseDiagnostics?: ts.Diagnostic[] })
    .parseDiagnostics
  if (diagnostics?.length) throw new Error(`Cannot parse archived source: ${name}`)
  const constants = new Map<string, ts.Expression | null>()
  const nodes: ts.Node[] = []
  function visit(node: ts.Node) {
    if (nodes.length > 100_000) throw new Error(`Source AST too large: ${name}`)
    nodes.push(node)
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isVariableDeclarationList(node.parent) &&
      node.parent.flags & ts.NodeFlags.Const
    ) {
      constants.set(node.name.text, constants.has(node.name.text) ? null : node.initializer)
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  function literal(node: ts.Expression, depth = 0): Data {
    if (depth > 20) throw new Error('Literal nesting/cycle limit exceeded.')
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isNumericLiteral(node)) return Number(node.text)
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false
    if (node.kind === ts.SyntaxKind.NullKeyword) return null
    if (ts.isIdentifier(node)) {
      const initializer = constants.get(node.text)
      if (initializer) return literal(initializer, depth + 1)
    }
    if (ts.isArrayLiteralExpression(node))
      return node.elements.map((entry) => literal(entry, depth + 1))
    if (ts.isObjectLiteralExpression(node)) {
      const result: Row = {}
      for (const entry of node.properties) {
        if (ts.isSpreadAssignment(entry)) {
          const spread = literal(entry.expression, depth + 1)
          if (!object(spread)) throw new Error('Non-object spread.')
          Object.assign(result, spread)
          continue
        }
        if (
          !ts.isPropertyAssignment(entry) ||
          (!ts.isIdentifier(entry.name) && !ts.isStringLiteral(entry.name))
        )
          throw new Error('Non-literal property.')
        const key = entry.name.text
        if (['__proto__', 'constructor', 'prototype'].includes(key) || Object.hasOwn(result, key))
          throw new Error('Unsafe or duplicate property.')
        result[key] = literal(entry.initializer, depth + 1)
      }
      return result
    }
    throw new Error(`Unsupported source expression: ${ts.SyntaxKind[node.kind]}`)
  }
  const variable = (key: string) => {
    const node = constants.get(key)
    return node ? literal(node) : undefined
  }
  const fields = (node: ts.ObjectLiteralExpression, omitChildren = false): Row => {
    const result: Row = {}
    for (const entry of node.properties) {
      if (ts.isSpreadAssignment(entry)) {
        const spread = literal(entry.expression)
        if (!object(spread)) throw new Error('Non-literal shared context.')
        Object.assign(result, spread)
      } else if (
        ts.isPropertyAssignment(entry) &&
        (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name))
      ) {
        const key = entry.name.text
        if (omitChildren && ['questions', 'items', 'ids'].includes(key)) continue
        if (['__proto__', 'constructor', 'prototype'].includes(key) || Object.hasOwn(result, key))
          throw new Error('Unsafe or duplicate property.')
        result[key] = literal(entry.initializer)
      } else throw new Error('Non-literal question field.')
    }
    return result
  }
  return { file, nodes, variable, literal, fields }
}

export async function collectQuestionOcean(offline: boolean) {
  await mkdir(root, { recursive: true })
  const license = await archive('LICENSE.txt', offline)
  if (
    !license.startsWith('MIT License') ||
    !license.includes('Copyright (c) 2026 Chun-Hsiung Luo') ||
    !license.includes('Permission is hereby granted, free of charge')
  )
    throw new Error('Unexpected upstream license. Collection stopped.')
  const index = await archive('index.html.txt', offline)
  const listed = [
    ...index.matchAll(/<script\b[^>]*\bsrc=["']\.\/(question-bank(?:-v\d+)?\.js)["'][^>]*>/g),
  ].map((match) => match[1])
  if (JSON.stringify(listed) !== JSON.stringify(files))
    throw new Error('Pinned upstream script list/order differs. Review the source adapter.')
  const candidates = new Map<string, Candidate>()
  const rejected: { file: string; line: number; reason: string }[] = []
  const sourceFiles: { file: string; sha256: string; bytes: number }[] = []
  const amendments: { file: string; id: string; reason: string }[] = []

  function amend(id: string, patch: Row, file: string, reason: string) {
    const candidate = candidates.get(id)
    if (!candidate) throw new Error(`Upstream amendment has no target: ${file}:${id}`)
    candidate.raw = { ...candidate.raw, ...patch }
    candidate.part = Number(candidate.raw.part)
    candidate.amendments.push({ file, reason })
    amendments.push({ file, id, reason })
  }
  for (const name of files) {
    const source = await archive(name, offline),
      p = parser(name, source)
    sourceFiles.push({ file: name, sha256: hash(source), bytes: Buffer.byteLength(source) })
    // These are pinned upstream DATA patches, applied in load order. Source callbacks never run.
    if (name === 'question-bank-v210.js') {
      const corrections = p.variable('corrections')
      if (!object(corrections)) throw new Error('Missing answer-key correction table.')
      for (const [id, patch] of Object.entries(corrections)) {
        if (!object(patch)) throw new Error('Invalid correction table.')
        amend(
          id,
          {
            ...patch,
            tags: [...new Set([...texts(candidates.get(id)?.raw.tags), ...texts(patch.tags)])],
          },
          name,
          'upstream-answer-and-rule-correction',
        )
      }
    }
    if (name === 'question-bank-v44.js')
      for (const id of ['P1-017', 'P1-022', 'P1-025'])
        amend(id, { difficulty: '800' }, name, 'upstream-editorial-difficulty-change')
    if (name === 'question-bank-v45.js') {
      for (const table of ['splitPart6Groups', 'movedReadingGroups']) {
        const corrections = p.variable(table)
        if (!object(corrections)) throw new Error('Missing group correction table.')
        for (const [group, patch] of Object.entries(corrections)) {
          if (!object(patch)) throw new Error('Invalid group correction.')
          const targets = [...candidates.values()].filter(
            (c) =>
              c.raw.groupId === group &&
              (table !== 'splitPart6Groups' || c.id.startsWith(text(patch.idPrefix))),
          )
          if (!targets.length) throw new Error(`Group correction has no target: ${group}`)
          for (const candidate of targets)
            amend(
              candidate.id,
              {
                groupId: patch.groupId,
                category: patch.category,
                ...(table === 'movedReadingGroups'
                  ? {
                      part: '7',
                      correctedFromPart: '6',
                      tags: [
                        ...texts(candidate.raw.tags).filter((t) => !/^part-?6$/i.test(t)),
                        'part7',
                        'single-passage',
                        'classification-corrected',
                      ],
                    }
                  : {}),
              },
              name,
              'upstream-group-and-part-correction',
            )
        }
      }
    }
    if (name === 'question-bank-v46.js') {
      const groups = p.variable('correctedGroups')
      if (!Array.isArray(groups)) throw new Error('Missing replacement group table.')
      for (const group of groups) {
        if (
          !object(group) ||
          !Array.isArray(group.questions) ||
          !Array.isArray(group.ids) ||
          group.questions.length !== group.ids.length
        )
          throw new Error('Invalid replacement group.')
        for (const [index, question] of group.questions.entries()) {
          if (!object(question) || typeof group.ids[index] !== 'string')
            throw new Error('Invalid replacement item.')
          amend(
            String(group.ids[index]),
            {
              ...question,
              part: '7',
              difficulty: '800',
              groupId: group.groupId,
              passage: group.passage,
              category: group.category,
              audioText: '',
              tags: ['part7', 'single-passage', 'group-size-corrected'],
            },
            name,
            'upstream-replacement-of-oversized-reading-group',
          )
        }
      }
    }

    function add(raw: Row, node: ts.Node) {
      const id = text(raw.id),
        part = Number(raw.part ?? id.match(/^P([1-7])-/)?.[1])
      if (!id || !Number.isInteger(part) || part < 1 || part > 7)
        throw new Error('Missing ID/Part.')
      if (candidates.has(id)) throw new Error(`Duplicate source ID: ${id}`)
      raw.part = String(part)
      // These Part 1 wrappers synthesize the spoken options; there is no missing script.
      // This constructs data from literals and does not execute the upstream wrapper.
      if (part === 1 && /^question-bank-v3[1-4]\.js$/.test(name)) {
        raw.audioText = texts(raw.choices)
          .map((choice, i) => `${String.fromCharCode(65 + i)}. ${choice}`)
          .join(' ')
        if (name !== 'question-bank-v31.js') raw.imageOrigin = 'ai-generated'
      }
      candidates.set(id, {
        id,
        part,
        raw,
        source: {
          file: name,
          line: p.file.getLineAndCharacterOfPosition(node.getStart(p.file)).line + 1,
        },
        amendments: [],
        issues: [],
      })
    }
    for (const node of p.nodes) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === 'p5Items'
      ) {
        const tuples = p.variable('p5Items')
        if (!Array.isArray(tuples)) throw new Error('Invalid tuple bank.')
        for (const tuple of tuples) {
          if (!Array.isArray(tuple) || tuple.length !== 7) throw new Error('Unknown tuple schema.')
          const [id, difficulty, category, prompt, choices, answer, explanation] = tuple
          add({ id, part: '5', difficulty, category, prompt, choices, answer, explanation }, node)
        }
      }
      if (!ts.isObjectLiteralExpression(node)) continue
      const keys = node.properties
        .filter(ts.isPropertyAssignment)
        .map((entry) => entry.name.getText(p.file).replace(/^['"]|['"]$/g, ''))
      if (!keys.includes('choices') || !keys.includes('answer')) continue
      // Wrapper objects derive fields dynamically; only the literal child data is collected.
      const choices = node.properties.find(
        (entry) =>
          ts.isPropertyAssignment(entry) &&
          entry.name.getText(p.file).replace(/^['"]|['"]$/g, '') === 'choices',
      ) as ts.PropertyAssignment
      if (!ts.isArrayLiteralExpression(choices.initializer)) continue
      let ancestor: ts.Node | undefined = node.parent
      const groups: ts.ObjectLiteralExpression[] = []
      let correction = false
      while (ancestor && ancestor !== p.file) {
        if (ts.isObjectLiteralExpression(ancestor)) groups.unshift(ancestor)
        if (
          ts.isVariableDeclaration(ancestor) &&
          ancestor.name.getText(p.file) === 'correctedGroups'
        )
          correction = true
        ancestor = ancestor.parent
      }
      if (correction) continue // Replacement rows amended existing IDs above; never counted again.
      try {
        let raw: Row = {}
        for (const group of groups) raw = { ...raw, ...p.fields(group, true) }
        raw = { ...raw, ...p.fields(node) }
        if (!raw.id && raw.groupId && ts.isArrayLiteralExpression(node.parent))
          raw.id = `${raw.groupId}-Q${node.parent.elements.indexOf(node) + 1}`
        add(raw, node)
      } catch (error) {
        rejected.push({
          file: name,
          line: p.file.getLineAndCharacterOfPosition(node.getStart(p.file)).line + 1,
          reason: error instanceof Error ? error.message : 'Unresolved source data.',
        })
      }
    }
  }

  const rows = [...candidates.values()]
  for (const candidate of rows) {
    const r = candidate.raw,
      choices = texts(r.choices)
    if (choices.length !== (candidate.part === 2 ? 3 : 4))
      candidate.issues.push('wrong-option-count')
    if (new Set(choices.map(normalize)).size !== choices.length)
      candidate.issues.push('duplicate-options')
    if (!Number.isInteger(r.answer) || Number(r.answer) < 0 || Number(r.answer) >= choices.length)
      candidate.issues.push('invalid-answer-index')
    if (r.answerAudit && text(r.answerAudit) !== choices[Number(r.answer)])
      candidate.issues.push('answer-audit-mismatch')
    if (candidate.part <= 4 && !text(r.audioText)) candidate.issues.push('missing-audio-script')
    if (candidate.part === 1)
      candidate.issues.push(
        text(r.image).includes('-ai-') || r.imageOrigin === 'ai-generated'
          ? 'illustration-not-photograph'
          : 'photograph-not-collected-and-verified',
      )
    if ([3, 4, 6, 7].includes(candidate.part) && !text(r.groupId))
      candidate.issues.push('missing-group-id')
    if ([6, 7].includes(candidate.part) && !text(r.passage))
      candidate.issues.push('missing-passage')
    // Upstream difficulty labels are editorial labels, not calibrated TOEIC score bands.
    candidate.issues.push('vietnamese-adaptation-required', 'independent-answer-review-required')
  }
  const grouped = new Map<string, Candidate[]>()
  for (const row of rows.filter((c) => [3, 4, 6, 7].includes(c.part))) {
    const key = `${row.part}:${text(row.raw.groupId) || row.id}`
    grouped.set(key, [...(grouped.get(key) ?? []), row])
  }
  const groupIssues: { group: string; issue: string; ids: string[] }[] = []
  for (const [group, members] of grouped) {
    const part = members[0].part,
      contexts = new Set(members.map((r) => text(part <= 4 ? r.raw.audioText : r.raw.passage)))
    if (
      ([3, 4].includes(part) && members.length !== 3) ||
      (part === 6 && members.length !== 4) ||
      (part === 7 && (members.length < 2 || members.length > 5))
    )
      groupIssues.push({ group, issue: 'wrong-group-size', ids: members.map((r) => r.id) })
    if (contexts.size !== 1)
      groupIssues.push({
        group,
        issue:
          part === 6
            ? 'per-question-blank-variants-need-unified-passage'
            : 'inconsistent-shared-context',
        ids: members.map((r) => r.id),
      })
    if (
      part === 6 &&
      !members.some((r) => texts(r.raw.choices).every((choice) => choice.split(/\s+/).length >= 5))
    )
      groupIssues.push({
        group,
        issue: 'no-sentence-insertion-detected-review-required',
        ids: members.map((r) => r.id),
      })
  }
  // Identical options for a generic cloze prompt do not make different passages duplicates.
  const questionText = (r: Candidate) =>
    `${text(r.raw.audioText)} ${text(r.raw.passage)} ${text(r.raw.prompt)} ${texts(r.raw.choices).map(normalize).sort().join(' ')}`
  const signatures = new Map<string, string[]>(),
    duplicateQuestions: string[][] = []
  for (const row of rows) {
    const key = normalize(questionText(row)),
      same = signatures.get(key) ?? []
    same.push(row.id)
    signatures.set(key, same)
  }
  for (const ids of signatures.values()) if (ids.length > 1) duplicateQuestions.push(ids)
  const byPart = Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7].map((part) => [part, rows.filter((r) => r.part === part).length]),
  )
  const nearDuplicates = findTextNearDuplicates(
    'question',
    rows.map((r) => ({
      id: r.id,
      text: questionText(r),
      group: text(r.raw.groupId) || undefined,
    })),
  )
  const report = {
    format: 'study990.source-intake-report',
    version: 1,
    commit,
    candidates: rows.length,
    byPart,
    activatedQuestions: 0,
    completeMockExamsAdded: 0,
    calibratedAgainstETS: false,
    rejected,
    amendments,
    duplicateQuestions,
    nearDuplicates,
    groupIssues,
    missingForTenDisjointTestsFromThisSourceAlone: Object.fromEntries(
      [6, 25, 39, 30, 30, 16, 54].map((count, i) => [
        i + 1,
        Math.max(0, count * 10 - byPart[i + 1]),
      ]),
    ),
    activationBlockers: [
      'Vietnamese explanations and distractor analysis not yet authored.',
      'Photographs, exhibits and synthetic audio not yet adapted and checked.',
      'Raw source groups must pass the existing canonical content schema.',
      'No independent human editorial approval or empirical score calibration.',
    ],
    note: 'Raw candidates only. Upstream human-reviewed tags remain source claims, not STUDY 990 approval. Counts do not represent validated or available practice questions.',
  }
  const outputs = {
    'manifest.json': {
      format: 'study990.source-archive',
      version: 1,
      commit,
      sourceUrl: `https://github.com/kdeppaei/toeic-question-ocean/tree/${commit}`,
      license: 'MIT',
      attribution: 'Copyright (c) 2026 Chun-Hsiung Luo',
      licenseUrl: base + 'LICENSE',
      licenseSha256: hash(license),
      indexSha256: hash(index),
      scriptsInLoadOrder: sourceFiles,
      executedSourceCode: false,
    },
    'candidates.json': {
      format: 'study990.collected-source',
      version: 2,
      commit,
      status: 'unreviewed-source-candidates',
      items: rows,
    },
    'intake-report.json': report,
  }
  for (const [name, value] of Object.entries(outputs)) {
    const serialized = JSON.stringify(value, null, 2) + '\n',
      path = resolve(root, name)
    try {
      await writeFile(path, serialized, { flag: 'wx' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      if ((await readFile(path, 'utf8')) !== serialized)
        throw new Error(
          `Existing report differs: ${name}. Preserve it and review the adapter revision.`,
        )
    }
  }
  console.log(
    JSON.stringify(
      {
        candidates: rows.length,
        byPart,
        rejected: rejected.length,
        appliedUpstreamAmendments: amendments.length,
        exactDuplicateGroups: duplicateQuestions.length,
        nearDuplicatePairs: nearDuplicates.length,
        groupIssues: groupIssues.length,
        activatedQuestions: 0,
        completeMockExamsAdded: 0,
        path: root,
      },
      null,
      2,
    ),
  )
}
