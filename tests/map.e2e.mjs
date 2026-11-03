/** The table as the map of the work: tilt-in, ball flights, lit spots, and the fallbacks. */

export default async function ({ browser, URL, check, watchErrors }) {
  const centre = (page, i) =>
    page.evaluate((i) => {
      const r = document.querySelectorAll('[data-match]')[i].getBoundingClientRect()
      window.scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2)
    }, i)
  const spotState = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.map-spot')].map((s) => ({
        landed: s.classList.contains('landed'),
        active: s.classList.contains('active'),
        bg: getComputedStyle(s).backgroundColor,
      })),
    )
  const lit = (bg) => bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'

  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const errors = watchErrors(page)
    await page.goto(URL)
    await page.waitForFunction(() => document.documentElement.classList.contains('motion'))
    await page.waitForTimeout(600) // let Lenis start before the test scrolls

    const html = await (await fetch(URL)).text()
    const cards = await page.locator('[data-match]').count()
    check('map: one spot per match, prerendered', (await page.locator('.map-spot').count()) === cards && html.includes('map-spot'))
    check('map: hidden from screen readers', (await page.getAttribute('.map', 'aria-hidden')) === 'true')

    // they fade dark as motion switches on, then stay dark until their match is played
    const dark = await page
      .waitForFunction(
        () => [...document.querySelectorAll('.map-spot')].every((s) => getComputedStyle(s).backgroundColor === 'rgba(0, 0, 0, 0)'),
        null,
        { timeout: 3000 },
      )
      .then(() => true, () => false)
    let spots = await spotState(page)
    check('map: spots wait dark until played', dark && spots.every((s) => !s.landed), JSON.stringify(spots.map((s) => s.bg)))

    // tilted while it rises, flat once pinned
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.matches-wrap').getBoundingClientRect().top + scrollY - 500))
    await page.waitForTimeout(400)
    const rising = await page.evaluate(() => parseFloat(document.querySelector('.map').style.getPropertyValue('--tilt')))
    check('map: table tilted as it rises', rising > 10, `${rising}deg`)

    // note whether the ball was in the air each time the table's active match changed
    await page.evaluate(() => {
      window.__flights = []
      const map = document.querySelector('.map')
      new MutationObserver(() => window.__flights.push(map.querySelector('.map-ball').getAnimations().length)).observe(map, {
        attributeFilter: ['data-active'],
      })
    })
    const settle = async (i) => {
      await page.waitForFunction((i) => document.querySelector('.map').dataset.active === String(i), i, { timeout: 5000 })
      await page.waitForFunction(() => !document.querySelector('.map-ball').getAnimations().length)
      await page.waitForTimeout(500) // the spot's colour fades in
    }
    await centre(page, 2)
    await settle(2)
    const flights = await page.evaluate(() => window.__flights)
    check('map: ball flies when a card reaches the middle', flights.length > 0 && flights.every((n) => n > 0), `${flights}`)
    const pinned = await page.evaluate(() => parseFloat(document.querySelector('.map').style.getPropertyValue('--tilt')))
    check('map: table lies flat once pinned', pinned < 0.5, `${pinned}deg`)
    spots = await spotState(page)
    check(
      'map: played spots lit, current one active',
      spots.slice(0, 3).every((s) => s.landed && lit(s.bg)) && spots[2].active && spots.slice(3).every((s) => !s.landed),
      spots.map((s) => (s.active ? 'A' : s.landed ? 'L' : '-')).join(''),
    )
    const name = await page.locator('[data-match]').nth(2).locator('.match-name').textContent()
    check('map: caption names the match on the table', (await page.textContent('.map-caption-name')) === name, name)
    const ballAt = await page.evaluate(() => {
      const b = document.querySelector('.map-ball').getBoundingClientRect()
      const s = document.querySelectorAll('.map-spot')[2].getBoundingClientRect()
      return Math.hypot(b.x + b.width / 2 - (s.x + s.width / 2), b.y + b.height / 2 - (s.y + s.height / 2))
    })
    check('map: ball lands on the spot', ballAt < 3, `${ballAt.toFixed(1)}px off`)

    await centre(page, cards - 1)
    await settle(cards - 1)
    check('map: every spot lit by the last match', (await spotState(page)).every((s) => s.landed && lit(s.bg)))
    check('map: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }

  // --- phones, reduced motion, no JS ---------------------------------------------------------------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    await page.goto(URL)
    check('map: not drawn on phones', !(await page.locator('.map').isVisible()))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(URL)
    await page.waitForTimeout(600)
    const spots = await spotState(page)
    check('reduced motion: every spot lit, no ball', spots.every((s) => lit(s.bg)) && !(await page.locator('.map-ball').isVisible()))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto(URL)
    check('no JS: map flat with every spot lit', (await spotState(page)).every((s) => lit(s.bg)))
    await ctx.close()
  }
}
