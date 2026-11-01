/** Core page: hero, flip, contact, reveals, reduced motion, no-JS, phones and touch play. */

export default async function ({ browser, URL, check, watchErrors }) {
  // --- core page, flip, contact ---------------------------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const errors = watchErrors(page)
    await page.goto(URL)
    await page.waitForSelector('.stage-canvas[data-ready="true"]', { timeout: 20000 })
    check('3D stage mounts', true)
    check('red hero visible, black hidden', (await page.isVisible('.stage-side.only-red')) && !(await page.isVisible('.stage-side.only-black')))

    await page.click('.flip')
    await page.waitForFunction(() => document.documentElement.dataset.side === 'black' && document.querySelector('.flip-wipe').hidden)
    check('click flips to black and sets ?side=black', page.url().includes('side=black') && (await page.isVisible('#record')))
    check('flip label updates', (await page.textContent('.flip-persona')) === 'The Engineer')
    await page.keyboard.press('f')
    await page.waitForFunction(() => document.documentElement.dataset.side === 'red' && document.querySelector('.flip-wipe').hidden)
    check('F key flips back', !page.url().includes('side=black'))

    await page.fill('input[name="name"]', 'Fred')
    check('typing F in a field does not flip', await page.evaluate(() => document.documentElement.dataset.side === 'red'))
    await page.fill('input[name="email"]', 'fred@example.com')
    await page.fill('textarea[name="message"]', 'Hello')
    await page.click('.serve')
    await page.waitForTimeout(400)
    const status = await page.textContent('.form-status')
    check('contact never claims "sent" without delivery', !/Served/.test(status) || !!process.env.VITE_WEB3FORMS_KEY, status.slice(0, 50))

    await page.click('.sound-toggle')
    check('sound toggle', (await page.getAttribute('.sound-toggle', 'aria-pressed')) === 'true')

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(600)
    const box = await page.locator('.stage-canvas').boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8)
    await page.waitForTimeout(300)
    check('hovering the table makes you the player', (await page.textContent('.hint-pointer')).includes('the player.'))
    await page.mouse.move(5, 5)

    for (let i = 0; i < 40; i++) {
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(80)
    }
    await page.waitForTimeout(1200)
    const hidden = await page.evaluate(
      () => [...document.querySelectorAll('[data-reveal]')].filter((e) => e.offsetParent && !e.classList.contains('in')).length,
    )
    check('every reveal fires by the bottom of the page', hidden === 0, `${hidden} left`)
    check('no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // --- deep link, reduced motion, no JS -------------------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(URL + '?side=black')
    check('?side=black opens on the player side', await page.isVisible('#record'))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(URL)
    await page.waitForTimeout(800)
    check('reduced motion: nothing hidden for reveals', !(await page.evaluate(() => document.documentElement.classList.contains('motion'))))
    const t = () => page.evaluate(() => getComputedStyle(document.querySelector('.ticker-track')).transform)
    const a = await t()
    await page.waitForTimeout(600)
    check('reduced motion: ticker still', a === (await t()))
    await page.click('.flip')
    await page.waitForTimeout(100)
    check('reduced motion: flip is instant', await page.evaluate(() => document.documentElement.dataset.side === 'black'))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(URL)
    check('no JS: name, matches and player side all readable', (await page.textContent('h1')).includes('Rudhar') && (await page.isVisible('#matches')) && (await page.isVisible('#record')))
    check('no JS: flip button hidden', !(await page.isVisible('.flip')))
    await ctx.close()
  }

  // --- phones: layout and touch play ------------------------------------------------------------
  for (const side of ['', '?side=black']) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto(URL + side)
    await page.waitForTimeout(600)
    const sw = await page.evaluate(() => document.documentElement.scrollWidth)
    check(`375px ${side || 'red'}: no horizontal scroll`, sw <= 375, `scrollWidth ${sw}`)
    check(`375px ${side || 'red'}: flip button visible`, await page.isVisible('.flip'))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    const errors = watchErrors(page)
    await page.goto(URL)
    await page.waitForSelector('.stage-canvas[data-ready="true"]', { timeout: 20000 })
    const hint = () => page.textContent('.hint-touch')
    const box = await page.locator('.stage-canvas').boundingBox()
    const cdp = await ctx.newCDPSession(page)
    const touch = (type, x, y) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
    const cx = box.x + box.width / 2
    const cy = box.y + box.height * 0.75

    const y0 = await page.evaluate(() => scrollY)
    await touch('touchStart', cx, cy)
    for (let i = 1; i <= 10; i++) {
      await touch('touchMove', cx - i * 12, cy)
      await page.waitForTimeout(16)
    }
    await page.waitForTimeout(150)
    check('touch: drag takes the paddle', /Rally \d\d/.test(await hint()))
    check('touch: sideways drag does not scroll', (await page.evaluate(() => scrollY)) === y0)
    await touch('touchEnd')
    await page.waitForTimeout(3300)
    check('touch: paddle hands back after the grace period', /Drag across the table/.test(await hint()))

    await touch('touchStart', cx, cy)
    for (let i = 1; i <= 12; i++) {
      await touch('touchMove', cx, cy - i * 25)
      await page.waitForTimeout(16)
    }
    await touch('touchEnd')
    await page.waitForTimeout(600)
    check('touch: vertical swipe on the table still scrolls', (await page.evaluate(() => scrollY)) > y0 + 50)
    check('touch: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }
}
