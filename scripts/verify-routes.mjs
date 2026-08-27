/**
 * Navigation audit.
 *
 * "No broken primary navigation routes" is an acceptance criterion, so it is
 * checked mechanically rather than by clicking: every internal link target in
 * the source is normalised and matched against the routes declared in App.tsx.
 *
 * Run with: npm run verify:routes
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = 'src'

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(SRC).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'))

const app = readFileSync(join(SRC, 'App.tsx'), 'utf8')
const declared = new Set([...app.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*'))

/** Template holes become :id so dynamic links match parameterised routes. */
const normalise = (path) => path.replace(/\$\{[^}]*\}/g, ':id').split('?')[0].split('#')[0]

const targets = new Map()

for (const file of files) {
  if (file.endsWith(join(SRC, 'App.tsx'))) continue
  const text = readFileSync(file, 'utf8')

  const absolute = [
    ...[...text.matchAll(/to="(\/[^"]*)"/g)].map((m) => m[1]),
    ...[...text.matchAll(/to=\{`(\/[^`]*)`\}/g)].map((m) => m[1]),
    ...[...text.matchAll(/navigate\(\s*[`'](\/[^`']*)[`']/g)].map((m) => m[1]),
    ...[...text.matchAll(/(?:backTo|to):\s*[`'](\/[^`']*)[`']/g)].map((m) => m[1]),
  ]

  // path('/x') resolves against whichever role root is active, so both count.
  const roleRelative = [...text.matchAll(/path\(\s*[`'](\/[^`']*)[`']\s*\)/g)].map((m) => m[1])

  for (const raw of absolute) {
    const key = normalise(raw)
    if (!targets.has(key)) targets.set(key, relative('.', file))
  }

  for (const raw of roleRelative) {
    for (const base of ['/customer', '/admin']) {
      const key = base + normalise(raw)
      if (!targets.has(key)) targets.set(key, relative('.', file))
    }
  }
}

const broken = [...targets].filter(([target]) => !declared.has(target))

console.log(`declared routes:   ${declared.size}`)
console.log(`link targets found: ${targets.size}`)

if (broken.length) {
  console.log('\nBROKEN LINK TARGETS:')
  for (const [target, file] of broken.sort()) console.log(`  ${target.padEnd(45)} <- ${file}`)
  process.exit(1)
}

console.log('\nevery internal link target resolves to a declared route')

const neverLinked = [...declared].filter((route) => !route.includes(':') && !targets.has(route))
if (neverLinked.length) {
  // Sidebar entries and redirects live in data, not in link expressions, so this
  // is reported for information rather than treated as a failure.
  console.log(`\nnot linked by a literal expression (nav config / redirects): ${neverLinked.sort().join(', ')}`)
}
