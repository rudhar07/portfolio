/**
 * Broadcast moments and the hidden level, played for real: a scripted player (through the
 * scene's debug handle, which only automated browsers get) rallies, misses, and meets the hacker.
 */

export default async function ({ browser, URL, check, watchErrors }) {
  const until = (page, fn, timeout = 30000) =>
    page.waitForFunction(fn, null, { timeout, polling: 50 }).then(
      () => true,
      () => false,
    )

  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const errors = watchErrors(page)
    await page.goto(URL)
    const html = await (await fetch(URL)).text()
    check('broadcast: overlay prerendered, empty', html.includes('class="bc"') && !(await page.locator('.bc-third').count()))
    check('broadcast: scene ready', await until(page, () => window.__rally, 15000))

    // the player: follows the ball perfectly, or reaches for the far corner when told to miss
    await page.evaluate(() => {
      window.__policy = 'perfect'
      const loop = () => {
        const s = window.__rally.state()
        if (window.__policy === 'perfect') window.__rally.steer(s.x)
        if (window.__policy === 'miss') window.__rally.steer(1.05)
        requestAnimationFrame(loop)
      }
      loop()
    })

    // --- milestone lower-third ---------------------------------------------------------------
    check('rally: reaches 5', await until(page, () => window.__rally.state().rally >= 5, 45000))
    const third = await until(page, () => /05.*SPIN/i.test(document.querySelector('.bc-third')?.textContent ?? ''), 2000)
    check('broadcast: lower-third at rally 5 hints at SPIN', third)

    // --- replay on a miss ----------------------------------------------------------------------
    await page.evaluate(() => (window.__policy = 'miss'))
    check('replay: a lost rally plays back', await until(page, () => window.__rally.state().replay, 15000))
    await page.waitForTimeout(700)
    const tag = await page.textContent('.bc-replay').catch(() => '')
    const bars = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.bc-bar')).transform).d)
    check('replay: tag and letterbox bars show', /replay\s*0\.4×/i.test(tag) && bars > 0.99, `${tag} / bars ${bars}`)
    check('replay: rally resets on the miss', (await page.evaluate(() => window.__rally.state().rally)) === 0)
    const box = await page.locator('.stage-canvas').boundingBox()
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    check('replay: a click skips it', await until(page, () => !window.__rally.state().replay && !document.querySelector('.bc-replay'), 1000))

    // --- the hidden level ----------------------------------------------------------------------
    await page.evaluate(() => (window.__policy = 'perfect'))
    // a field pinned on screen, so typing into it never scrolls the (paused off screen) table away
    await page.evaluate(() => {
      const f = document.createElement('input')
      f.id = 'probe'
      f.style.cssText = 'position:fixed;top:0;left:0;z-index:9999'
      document.body.append(f)
      f.focus()
    })
    await page.keyboard.type('spin')
    check('hidden level: typing in a form field does not trigger it', (await page.evaluate(() => window.__rally.state().mode)) === 'fair')
    await page.evaluate(() => document.getElementById('probe').remove())
    await page.keyboard.type('spin')
    check('hidden level: typing SPIN brings the reward hacker', (await page.evaluate(() => window.__rally.state().mode)) === 'hacker')
    check(
      'hidden level: announced, and badged while it lasts',
      (await page.isVisible('.bc-mode')) && /reward hacker/i.test((await page.textContent('.bc-third')) ?? ''),
    )

    const before = await page.evaluate(() => window.__rally.state().rally)
    check('hidden level: the hacker cheats and gets caught', await until(page, () => window.__rally.state().frozen, 45000))
    const verdict = (await page.textContent('.bc-verdict').catch(() => '')) ?? ''
    check(
      'hidden level: verifier names the cheat',
      /rejected/i.test(verdict) && /(through the net|skipped [\d.]+ m)/.test(verdict),
      verdict.replace(/\s+/g, ' '),
    )
    const after = await page.evaluate(() => window.__rally.state().rally)
    check('hidden level: the point goes to you', /point to you/i.test(verdict) && after >= before + 1, `${before} → ${after}`)
    check('hidden level: play resumes after the call', await until(page, () => window.__rally.state().live, 5000))

    await page.keyboard.press('Escape')
    check(
      'hidden level: Esc brings the fair opponent back',
      (await page.evaluate(() => window.__rally.state().mode)) === 'fair' && !(await page.isVisible('.bc-mode')),
    )
    check('broadcast: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // --- reduced motion: a still table, no hidden level ---------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(URL)
    await page.waitForSelector('.stage-canvas[data-ready="true"]', { timeout: 15000 })
    await page.keyboard.type('spin')
    await page.waitForTimeout(300)
    check('reduced motion: SPIN does nothing', !(await page.locator('.bc-mode').count()) && !(await page.locator('.bc-third').count()))
    await ctx.close()
  }
}
