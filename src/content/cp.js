/**
 * Competitive programming. `fallback` is what ships if the stats fetch fails at build time;
 * scripts/prerender.mjs refreshes LeetCode and Codeforces numbers on every build.
 */

export const cp = {
  total: '700+',
  totalNote: 'problems across Codeforces, LeetCode and GeeksforGeeks',
  strengths: ['Dynamic programming', 'Graphs', 'Trees', 'Binary search', 'Recursion'],
  leetcode: 'rudhar07',
  codeforces: 'rudhar07',
  // The Codeforces rating is fetched either way; flip this when you want it on the page.
  showCodeforcesRating: false,
  fallback: {
    leetcode: { all: 387, easy: 182, medium: 166, hard: 39 },
    codeforces: { rating: 1110, maxRating: 1110, rank: 'newbie' },
  },
}

/** Grouped tool list. No ratings: a bar or a number next to a language means nothing. */
export const kit = [
  { group: 'Languages', items: ['Python', 'TypeScript / JavaScript', 'Java', 'C++', 'Go', 'Swift'] },
  { group: 'Agents & evals', items: ['RL environments', 'Evaluation harnesses', 'Playwright', 'LLM APIs'] },
  { group: 'Web', items: ['React', 'Next.js', 'Node / Express', 'FastAPI', 'Spring Boot'] },
  { group: 'Data', items: ['PostgreSQL', 'MongoDB', 'MySQL', 'SQLite', 'pgvector'] },
  { group: 'Infra', items: ['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Linux'] },
]
