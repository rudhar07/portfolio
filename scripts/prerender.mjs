/**
 * Runs after the client and SSR builds:
 *   1. fetch live CP stats (falling back per source),
 *   2. render the page to HTML and inject it, plus the stats, into dist/index.html,
 *   3. fail if anything the HTML points at in /public is missing,
 *   4. list every TODO left in src/content as a warning.
 */

import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

const { render } = await import(pathToFileURL(ssrEntry).href)
const { fetchStats } = await import(pathToFileURL(join(root, 'src/lib/stats.js')).href)

console.log('\nprerender')
const stats = await fetchStats()
console.log(`  stats: LeetCode ${stats.leetcode.all} solved, Codeforces ${stats.codeforces.rating}`)

const templatePath = join(dist, 'index.html')
const template = readFileSync(templatePath, 'utf8')
if (!template.includes('<!--app-html-->')) throw new Error('index.html is missing <!--app-html-->')

const state = `<script>window.__STATS__=${JSON.stringify(stats).replace(/</g, '\\u003c')}</script>`
const html = template.replace('<!--app-html-->', render(stats)).replace('<!--app-state-->', state)
writeFileSync(templatePath, html)
rmSync(join(root, 'dist-ssr'), { recursive: true, force: true })
console.log(`  wrote dist/index.html (${(html.length / 1024).toFixed(1)} KB)`)

// --- every local asset referenced by the page must exist ------------------------------------
const refs = new Set()
for (const m of html.matchAll(/(?:href|src|content)="(\/[^"#?]+)"/g)) refs.add(m[1])
for (const m of html.matchAll(/"(https:\/\/rudharbajaj\.vercel\.app(\/[^"#?]+))"/g)) refs.add(m[2])
const missing = [...refs].filter((p) => p !== '/' && !existsSync(join(dist, p)))
if (missing.length) {
  console.error(`\n  missing assets:\n${missing.map((p) => `    ${p}`).join('\n')}\n`)
  process.exit(1)
}
console.log(`  assets: ${refs.size} local references, all present`)

// --- TODOs left in the content ------------------------------------------------------------
const contentDir = join(root, 'src/content')
const todos = []
for (const file of readdirSync(contentDir)) {
  readFileSync(join(contentDir, file), 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (/TODO/.test(line)) todos.push(`    src/content/${file}:${i + 1}  ${line.trim()}`)
    })
}
if (todos.length) console.warn(`\n  ${todos.length} TODO(s) in content (not rendered, but worth filling):\n${todos.join('\n')}`)
console.log('')
