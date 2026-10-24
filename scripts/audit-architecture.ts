import ts from 'typescript'
import { readdir, readFile } from 'node:fs/promises'
import { resolve, relative, dirname } from 'node:path'

async function main() {
  async function walk(path: string): Promise<string[]> {
    const entries = await readdir(path, { withFileTypes: true })
    return (
      await Promise.all(
        entries.map((entry) =>
          entry.isDirectory() ? walk(resolve(path, entry.name)) : [resolve(path, entry.name)],
        ),
      )
    ).flat()
  }
  const files = (await walk(resolve('src'))).filter(
    (path) => /\.tsx?$/.test(path) && !path.endsWith('.d.ts'),
  )
  const all = new Set(files),
    graph = new Map<string, string[]>(),
    issues: string[] = [],
    sizes: { file: string; lines: number }[] = []
  const label = (path: string) => relative(process.cwd(), path).replaceAll('\\', '/')
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    sizes.push({ file: label(file), lines: source.split('\n').length })
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
    const targets: string[] = []
    function add(specifier: string, typeOnly = false) {
      if (typeOnly) return
      if (
        label(file).startsWith('src/domain/') &&
        (['react', 'react-dom', 'dexie'].includes(specifier) ||
          /\/application\/|\/persistence\/|\/features\/|\/providers\//.test(specifier))
      )
        issues.push(`${label(file)}: domain imports platform/UI ${specifier}`)
      if (!specifier.startsWith('.')) return
      const base = resolve(dirname(file), specifier)
      const target = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        resolve(base, 'index.ts'),
        resolve(base, 'index.tsx'),
      ].find((path) => all.has(path))
      if (target) targets.push(target)
    }
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const clause = node.importClause
        const onlyTypes =
          !!clause?.isTypeOnly ||
          (!!clause?.namedBindings &&
            ts.isNamedImports(clause.namedBindings) &&
            !clause.name &&
            clause.namedBindings.elements.every((item) => item.isTypeOnly))
        add(node.moduleSpecifier.text, onlyTypes)
      } else if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        add(node.moduleSpecifier.text, node.isTypeOnly)
      else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        add(node.arguments[0].text)
      ts.forEachChild(node, visit)
    }
    visit(parsed)
    graph.set(file, targets)
    if (/dangerouslySetInnerHTML|\beval\s*\(|new Function\s*\(/.test(source))
      issues.push(`${label(file)}: unsafe HTML/code execution requires review`)
    if (
      /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(
        source,
      )
    )
      issues.push(`${label(file)}: potential embedded credential`)
  }
  const visiting = new Set<string>(),
    visited = new Set<string>()
  function check(file: string, path: string[]) {
    if (visiting.has(file)) {
      issues.push(
        `Runtime import cycle: ${[...path.slice(path.indexOf(file)), file].map(label).join(' -> ')}`,
      )
      return
    }
    if (visited.has(file)) return
    visiting.add(file)
    for (const target of graph.get(file) ?? []) check(target, [...path, file])
    visiting.delete(file)
    visited.add(file)
  }
  for (const file of files) check(file, [])
  console.log(
    JSON.stringify(
      {
        sourceModules: files.length,
        dependencyEdges: [...graph.values()].reduce((n, edges) => n + edges.length, 0),
        largestModules: sizes.sort((a, b) => b.lines - a.lines).slice(0, 8),
        issues,
        boundary:
          'Runtime/dynamic local imports only; type-only cycles are erased. Credential scan is heuristic and does not scan browser data.',
      },
      null,
      2,
    ),
  )
  if (issues.length) process.exitCode = 1
}
main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
