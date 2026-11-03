/** Feel: topspin title reveals, paddle-tilt match cards, magnetic buttons. */

export default async function ({ browser, URL, check, watchErrors }) {
  const opacityOf = (page, sel) =>
    page.evaluate((s) => Number(getComputedStyle(document.querySelector(s)).opacity), sel)
  const matrixOf = (page, sel) =>
    page.evaluate((s) => {
      const m = new DOMMatrix(getComputedStyle(document.querySelector(s)).transform)
      // a flat card still carries its perspective, so "flat" means no rotation terms
      return { isIdentity: m.isIdentity, flat: Math.abs(m.m13) < 1e-3 && Math.abs(m.m23) < 1e-3, m13: m.m13, m41: m.m41 }
    }, sel)

  // --- titles -----------------------------------------------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const errors = watchErrors(page)
    await page.goto(URL)
    await page.waitForFunction(() => document.documentElement.classList.contains('motion'))
    await page.waitForTimeout(300)

    check('titles keep their accessible name', await page.getByRole('heading', { name: 'Matches played.' }).isVisible())
    const letters = await page.locator('#matches .section-title .spin-ch').count()
    check('title split into letters', letters === 'Matchesplayed.'.length, `${letters} letters`)

    const first = '#matches .section-title .spin-ch'
    // they fade dark as motion switches on (0.35s), then wait there until the section arrives
    const hidden = await page
      .waitForFunction((s) => getComputedStyle(document.querySelector(s)).opacity === '0', first, { timeout: 3000 })
      .then(() => true, () => false)
    check('letters wait below the fold', hidden)
    await page.evaluate(() => document.querySelector('#matches').scrollIntoView())
    await page.waitForTimeout(2200)
    const m = await matrixOf(page, first)
    check('letters roll into place on arrival', (await opacityOf(page, first)) === 1 && m.isIdentity)
    check('no console errors', errors.length === 0, errors.join(' | '))

    // --- tilt -------------------------------------------------------------------------------
    const card = page.locator('.match').first()
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1200)
    const box = await card.boundingBox()
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await page.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.2, { steps: 6 })
    await page.waitForTimeout(300)
    const tilted = await matrixOf(page, '.match')
    check('card tilts toward the cursor', !tilted.isIdentity && tilted.m13 < 0, `m13 ${tilted.m13.toFixed(3)}`)
    check('card glare shows', await page.evaluate(() => document.querySelector('.match').classList.contains('tilting')))
    await page.mouse.move(5, 5)
    await page.waitForTimeout(900)
    check('card settles flat on leave', (await matrixOf(page, '.match')).flat)

    // --- magnetic buttons -----------------------------------------------------------------------
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(800)
    const resume = '.hero-links a[href="/resume.pdf"]'
    const btn = await page.locator(resume).boundingBox()
    await page.mouse.move(btn.x + btn.width * 0.95, btn.y + btn.height * 0.5, { steps: 4 })
    await page.waitForTimeout(500)
    const pulled = await matrixOf(page, resume)
    check('buttons lean toward the cursor', pulled.m41 > 2, `${pulled.m41.toFixed(1)}px`)
    await ctx.close()
  }

  // --- no motion, no mouse, no JS: plain and visible ----------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(URL)
    await page.waitForTimeout(600)
    const sel = '#matches .section-title .spin-ch'
    check('reduced motion: letters visible and still', (await opacityOf(page, sel)) === 1 && (await matrixOf(page, sel)).isIdentity)
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto(URL)
    const card = page.locator('.match').first()
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)
    await card.tap()
    await page.waitForTimeout(300)
    check('phones: cards never tilt', (await matrixOf(page, '.match')).flat)
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(URL)
    check('no JS: title letters visible', (await opacityOf(page, '#matches .section-title .spin-ch')) === 1)
    await ctx.close()
  }
}
