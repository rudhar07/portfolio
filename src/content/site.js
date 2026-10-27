/**
 * Identity, links and the copy that frames both sides of the page.
 *
 * Every value here ships as static HTML at build time. A field set to null is simply not
 * rendered, so a missing fact never turns into placeholder text on the live site. The build
 * lists every to-do marker left in src/content as a warning.
 */

export const site = {
  name: 'Rudhar Bajaj',
  url: 'https://rudharbajaj.vercel.app',
  title: 'Rudhar Bajaj',
  description:
    'I build the environments coding agents are trained and graded in. ' +
    'State-level table tennis player. CS at Scaler School of Technology and BITS Pilani.',

  email: 'rudharbajaj@gmail.com', // TODO: switch to a personal address before the college one expires (2028)
  resume: '/resume.pdf',

  socials: [
    { label: 'GitHub', href: 'https://github.com/rudhar07' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/rudhar-bajaj/' },
    { label: 'LeetCode', href: 'https://leetcode.com/u/rudhar07/' },
    { label: 'Codeforces', href: 'https://codeforces.com/profile/rudhar07' },
  ],
}

/** The two rubbers. The page flips between these; the paddle in the corner is the switch. */
export const sides = {
  red: {
    label: 'Red',
    persona: 'The Engineer',
    hero: {
      kicker: 'Red rubber · The Engineer',
      lines: ['I build the', 'arenas AI', 'agents train in.'],
      body:
        'Member of Technical Staff Intern at Scaler AI Labs, building repository-scale ' +
        'reinforcement learning environments for autonomous coding agents, and the verifiers ' +
        'that grade them.',
    },
    about:
      'Table tennis taught me to read spin before the ball crosses the net. Now I write the ' +
      'test suites that read an agent’s shot, and call it out when it fakes one.',
  },
  black: {
    label: 'Black',
    persona: 'The Player',
    hero: {
      kicker: 'Black rubber · The Player',
      lines: ['State-level.', 'Multiple-time', 'champion.'],
      body:
        'Competitive table tennis player, and the person at Scaler School of Technology who ' +
        'runs the tournaments when I am not playing in them.',
    },
    about:
      'Every engineering habit I trust came from the table first: watch the opponent, not the ' +
      'ball; the point is decided two shots before it ends; and you cannot fake footwork.',
  },
}
