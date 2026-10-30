import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import ts from 'typescript'
import { collectQuestionOcean } from './collect-question-ocean'

/** One documented, pinned, openly licensed source adapter. Never executes downloaded JavaScript. */
const commit = 'a940bb8b479ef4d06af468015d757041c3d2e457'
const base = `https://raw.githubusercontent.com/kdeppaei/toeic-question-ocean/${commit}/`
const root = resolve('content/sources/toeic-question-ocean')
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
async function download(name: 'LICENSE' | 'question-bank-v40.js') {
  const response = await fetch(base + name, {
    signal: AbortSignal.timeout(20_000),
    redirect: 'error',
  })
  if (!response.ok) throw new Error(`Public source request failed for ${name}: ${response.status}`)
  if (Number(response.headers.get('content-length') ?? 0) > 256_000)
    throw new Error('Source exceeds size limit.')
  const reader = response.body!.getReader(),
    chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > 256_000) throw new Error('Source exceeds size limit.')
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
    reader.releaseLock()
  }
  return Buffer.concat(chunks).toString('utf8')
}
function literal(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((child) => literal(child))
  if (ts.isObjectLiteralExpression(node)) {
    const object: Record<string, unknown> = {}
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
        throw new Error('Non-literal source property.')
      if (
        ['constructor', 'prototype', '__proto__'].includes(property.name.text) ||
        Object.hasOwn(object, property.name.text)
      )
        throw new Error('Unsafe or duplicate source key.')
      object[property.name.text] = literal(property.initializer)
    }
    return object
  }
  throw new Error(
    'Downloaded code contains a non-literal data value; manual adapter update required.',
  )
}
async function main() {
  const [license, source] = await Promise.all([
    download('LICENSE'),
    download('question-bank-v40.js'),
  ])
  if (
    !license.startsWith('MIT License') ||
    !license.includes('Copyright (c) 2026 Chun-Hsiung Luo') ||
    !license.includes('Permission is hereby granted, free of charge')
  )
    throw new Error('Expected license not found; no content saved.')
  const file = ts.createSourceFile(
    'public-source.js',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  )
  const candidates: unknown[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'items' &&
      node.initializer
    )
      candidates.push(literal(node.initializer))
    ts.forEachChild(node, visit)
  }
  visit(file)
  if (candidates.length !== 1 || !Array.isArray(candidates[0]) || candidates[0].length !== 20)
    throw new Error('Unexpected source shape/count.')
  const items = candidates[0] as Record<string, unknown>[]
  const ids = new Set<string>()
  for (const row of items) {
    if (
      typeof row.id !== 'string' ||
      ids.has(row.id) ||
      typeof row.audioText !== 'string' ||
      !Array.isArray(row.choices) ||
      row.choices.length !== 3 ||
      !row.choices.every((c) => typeof c === 'string') ||
      !Number.isInteger(row.answer) ||
      Number(row.answer) < 0 ||
      Number(row.answer) > 2
    )
      throw new Error('Invalid source item.')
    ids.add(row.id)
  }
  const data = {
    format: 'study990.collected-source',
    version: 1,
    commit,
    sourceUrl: base + 'question-bank-v40.js',
    licenseUrl: base + 'LICENSE',
    license: 'MIT',
    attribution: 'Copyright (c) 2026 Chun-Hsiung Luo',
    sourceSha256: hash(source),
    licenseSha256: hash(license),
    status: 'unreviewed-source-candidates',
    note: 'Collected source data only, not active questions. Requires Vietnamese adaptation, independent key check and the existing human editorial gate.',
    items: items.map(({ id, audioText, choices, answer, tags }) => ({
      id,
      audioText,
      choices,
      answer,
      tags,
    })),
  }
  await mkdir(root, { recursive: true })
  for (const [name, value] of [
    ['source.json', JSON.stringify(data, null, 2) + '\n'],
    ['LICENSE.txt', license],
    ['question-bank-v40.js.txt', source],
  ] as const) {
    const path = resolve(root, name)
    let previous: string | undefined
    try {
      previous = await readFile(path, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    if (previous !== undefined && previous !== value)
      throw new Error(
        `Source archive already differs: ${name}. Preserve it and use a new source revision.`,
      )
    if (previous === undefined) await writeFile(path, value, { flag: 'wx' })
  }
  // Keep the full permission notice available in future learner builds, as well as the source archive.
  const notices = resolve('public/licenses')
  await mkdir(notices, { recursive: true })
  const noticePath = resolve(notices, 'toeic-question-ocean-MIT.txt')
  try {
    await writeFile(noticePath, license, { flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    if ((await readFile(noticePath, 'utf8')) !== license)
      throw new Error('Existing public license notice differs; manual reconciliation required.')
  }
  console.log(
    JSON.stringify(
      {
        collected: items.length,
        commit,
        sourceSha256: data.sourceSha256,
        activated: 0,
        path: root,
      },
      null,
      2,
    ),
  )
}
const args = process.argv.slice(2)
const run = async () => {
  if (args.some((arg) => !['--all', '--offline'].includes(arg)))
    throw new Error('Unknown collector flag. Use --all for the pinned complete source archive.')
  if (args.includes('--offline') && !args.includes('--all'))
    throw new Error('--offline requires --all.')
  if (args.includes('--all')) await collectQuestionOcean(args.includes('--offline'))
  else await main()
}
run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Collection failed.')
  process.exitCode = 1
})
