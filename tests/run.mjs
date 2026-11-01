/**
 * Browser checks against the production build.
 *
 *   npm run build && npm run test:e2e            all features
 *   npm run test:e2e -- ticker                   only tests/ticker.e2e.mjs
 *
 * Starts `vite preview` on a spare port, drives the Chrome installed on this machine through
 * playwright-core (set CHROME_PATH to use another one), and runs every tests/*.e2e.mjs. Each file
 * covers one feature and prints PASS/FAIL per check; the run exits non-zero on any failure.
 */

import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const PORT = 4321
const URL = `http://localhost:${PORT}/`
const CHROME =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const here = dirname(fileURLToPath(import.meta.url))
const only = process.argv[2]
const files = readdirSync(here)
  .filter((f) => f.endsWith('.e2e.mjs') && (!only || f.startsWith(only)))
  .sort()

const results = []

// software GL in headless Chrome logs driver chatter that has nothing to do with the site
function watchErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (['error', 'warning'].includes(m.type()) && !/GL Driver Message/.test(m.text())) errors.push(m.text())
  })
  return errors
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(URL)).ok) break
  } catch {
    await new Promise((r) => setTimeout(r, 200))
  }
}
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})

try {
  for (const file of files) {
    const name = file.replace('.e2e.mjs', '')
    const check = (label, ok, detail = '') =>
      results.push(`${ok ? 'PASS' : 'FAIL'}  [${name}] ${label}${detail ? `  (${detail})` : ''}`)
    const { default: run } = await import(pathToFileURL(`${here}/${file}`).href)
    try {
      await run({ browser, URL, check, watchErrors })
    } catch (err) {
      check('ran to completion', false, err.message.split('\n')[0])
    }
  }
} finally {
  await browser.close()
  server.kill()
}

console.log(results.join('\n'))
const failed = results.filter((r) => r.startsWith('FAIL')).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
