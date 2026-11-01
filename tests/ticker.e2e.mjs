/** Broadcast ticker: drift, scroll speed-up, reversal and settle. */

export default async function ({ browser, URL, check }) {
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(URL)
    const tx = () =>
      page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.ticker-track')).transform).m41)
    const html = await (await fetch(URL)).text()
    check('ticker: two strips, text prerendered', (await page.locator('.ticker').count()) === 2 && html.includes('Last shipped:'))
    // it sits just under the fold and pauses while off screen, so bring it to mid-screen first
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.ticker').offsetTop - 450))
    await page.waitForTimeout(1500)
    const a = await tx()
    await page.waitForTimeout(1000)
    const idle = a - (await tx())
    check('ticker: drifts left on its own', idle > 30 && idle < 90, `${idle.toFixed(0)} px/s`)
    const wheel = async (dy) => {
      const before = await tx()
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, dy)
        await page.waitForTimeout(60)
      }
      let d = before - (await tx())
      if (Math.abs(d) > 1500) d -= Math.sign(d) * (await page.evaluate(() => document.querySelector('.ticker-row').offsetWidth))
      return d
    }
    const down = await wheel(60)
    check('ticker: speeds up while scrolling down', down > idle * 0.3 * 2, `${down.toFixed(0)} px`)
    await page.waitForTimeout(1500)
    const up = await wheel(-60)
    check('ticker: runs backwards while scrolling up', up < 0, `${up.toFixed(0)} px`)
    await page.waitForTimeout(1500)
    const b = await tx()
    await page.waitForTimeout(500)
    check('ticker: returns to normal after scrolling stops', b - (await tx()) > 10)
    await ctx.close()
  }
}
