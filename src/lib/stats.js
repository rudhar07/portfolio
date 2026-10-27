import { cp } from '../content/cp.js'

/** Stats as shipped when the build could not reach LeetCode or Codeforces. */
export function fallbackStats() {
  return {
    leetcode: { ...cp.fallback.leetcode },
    codeforces: { ...cp.fallback.codeforces },
    year: new Date().getFullYear(),
  }
}

async function getJSON(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(6000) })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

/** Build-time only (scripts/prerender.mjs). Each source falls back on its own. */
export async function fetchStats(log = console) {
  const stats = fallbackStats()

  try {
    const json = await getJSON('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
      body: JSON.stringify({
        query:
          'query($u:String!){matchedUser(username:$u){submitStats{acSubmissionNum{difficulty count}}}}',
        variables: { u: cp.leetcode },
      }),
    })
    const rows = json.data.matchedUser.submitStats.acSubmissionNum
    const by = Object.fromEntries(rows.map((r) => [r.difficulty.toLowerCase(), r.count]))
    stats.leetcode = { all: by.all, easy: by.easy, medium: by.medium, hard: by.hard }
  } catch (err) {
    log.warn(`  stats: LeetCode unavailable, using fallback (${err.message})`)
  }

  try {
    const json = await getJSON(`https://codeforces.com/api/user.info?handles=${cp.codeforces}`)
    const u = json.result[0]
    stats.codeforces = { rating: u.rating, maxRating: u.maxRating, rank: u.rank }
  } catch (err) {
    log.warn(`  stats: Codeforces unavailable, using fallback (${err.message})`)
  }

  return stats
}
