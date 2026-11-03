/** The serve intro: once per visit, skippable, gone on its own, and never under reduced motion. */

export default async function ({ browser, URL, check, watchErrors }) {
  const showing = (page) => page.evaluate(() => !!document.getElementById('intro') && document.documentElement.classList.contains('intro'))
  const gone = (page, timeout) =>
    page
      .waitForFunction(() => !document.getElementById('intro') && !document.documentElement.classList.contains('intro'), null, {
        timeout,
      })
      .then(
        () => true,
        () => false,
      )

  // automated browsers skip it unless asked, which keeps every other test free of it
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(URL)
    check('intro: skipped for automated browsers', !(await showing(page)) && !(await page.locator('#intro').count()))
    await ctx.close()
  }

  // a real first visit: plays once, then not again in the same session
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
    const page = await ctx.newPage()
    const errors = watchErrors(page)
    await page.goto(URL)
    check('intro: plays on the first visit', await showing(page))
    const covered = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#intro') !== null)
    check('intro: covers the page while it plays', covered)
    // the number is the one main-thread part, so only its end value is checked, not its pace
    const counted = await page
      .waitForFunction(() => getComputedStyle(document.querySelector('.intro-count')).getPropertyValue('--toss').trim() === '16', null, {
        timeout: 1500,
      })
      .then(
        () => true,
        () => false,
      )
    check('intro: toss counter climbs to 16', counted)
    check('intro: wipes away on its own, under 2s', await gone(page, 1600))
    const free = await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('#intro') === null)
    check('intro: page is usable afterwards', free)
    await page.reload()
    check('intro: not again in the same visit', !(await showing(page)))
    check('intro: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // ?intro replays it; a click skips it
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${URL}?intro`)
    check('intro: ?intro replays it', await showing(page))
    await page.mouse.click(700, 450)
    check('intro: a click skips it', await gone(page, 500))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${URL}?intro`)
    await page.keyboard.press('Space')
    check('intro: a key skips it', await gone(page, 500))
    await ctx.close()
  }

  // never under reduced motion, never without JS
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(`${URL}?intro`)
    check('reduced motion: no intro, even with ?intro', !(await showing(page)))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(`${URL}?intro`)
    check('no JS: no intro', !(await page.locator('#intro').isVisible()))
    await ctx.close()
  }
}
