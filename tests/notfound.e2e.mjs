/** The 404 page. Vercel serves dist/404.html for any missing path; preview only serves it by name. */

export default async function ({ browser, URL, check, watchErrors }) {
  const url = `${URL}404.html`
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const errors = watchErrors(page)
    const res = await page.goto(url)
    check('404: built into dist', res.ok())
    check('404: says out', await page.getByRole('heading', { name: 'Out.' }).isVisible())
    check('404: kept out of search', (await page.getAttribute('meta[name="robots"]', 'content')) === 'noindex')
    check('404: names the missing path', (await page.textContent('#path')) === '/404.html')
    const back = page.getByRole('link', { name: 'Serve again' })
    check('404: links home', (await back.getAttribute('href')) === '/')
    check('404: ball in flight', (await page.locator('.ball-live').isVisible()) && !(await page.locator('.ball-rest').isVisible()))
    await back.click()
    await page.waitForURL(URL)
    check('404: serve again goes home', await page.getByRole('heading', { level: 1 }).isVisible())
    check('404: no console errors', errors.length === 0, errors.join(' | '))
    await ctx.close()
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    await page.goto(url)
    check('404 reduced motion: ball lies still', !(await page.locator('.ball-live').isVisible()) && (await page.locator('.ball-rest').isVisible()))
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    check('404 phone: no sideways scroll', !overflow)
    await ctx.close()
  }
}
