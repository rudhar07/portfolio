/**
 * Projects, framed as matches.
 *
 *   opponent  the hard problem the project had to beat
 *   scoreline the result, as a fact you can check in the repo (tests, guarantees, numbers)
 *   keyPoint  the one decision that won it
 *
 * Only put a number in `scoreline` if it is measured or counted in the repo. Adding a project is
 * one appended object; the cards and their numbering count off this array.
 */

/**
 * @typedef {object} Match
 * @property {string} name
 * @property {string} opponent
 * @property {string} scoreline
 * @property {string} keyPoint
 * @property {string[]} stack
 * @property {string} [repo]
 * @property {string} [live]
 */

/** @type {Match[]} */
export const matches = [
  {
    name: 'BookMyShow, the booking core',
    opponent: 'A thousand people clicking the last seat at the same instant.',
    // TODO: run a concurrent-booking load test and replace this with the measured result
    scoreline: 'Exactly one winner, guaranteed by the database, not by hope.',
    keyPoint:
      'Defence in depth: an optimistic check for UX, a 10-minute LOCKED state for fairness, and a ' +
      'UNIQUE(show_id, seat_id) constraint the application cannot bypass.',
    stack: ['Next.js', 'FastAPI', 'SQLite'],
    repo: 'https://github.com/rudhar07/BookMyShow-clone',
  },
  {
    name: 'MockForge',
    opponent: 'Running untrusted code, and keeping the answer key off the client.',
    scoreline: 'Correct answers and hidden tests never leave the server.',
    keyPoint:
      'A sanitisation layer strips answers and hidden tests from every response, over a service ' +
      'layer that runs Judge0 test cases in parallel with partial credit.',
    stack: ['React', 'Express', 'MongoDB', 'Judge0 CE'],
    repo: 'https://github.com/rudhar07/mockforge',
    live: 'https://mockforge-h8jw.onrender.com/',
  },
  {
    name: 'Typeahead',
    opponent: 'A suggestion on every keystroke, with popularity changing underneath it.',
    scoreline: 'O(len(prefix)) lookups; adding a cache node moves ~1/N of the keys.',
    keyPoint:
      'Split read and write paths: a consistent-hash ring of LRU+TTL cache nodes in front of a trie ' +
      'with top-10 completions precomputed at every node.',
    stack: ['Python', 'FastAPI', 'SQLite', 'Next.js'],
    repo: 'https://github.com/rudhar07/typeahead-search-engine',
  },
  {
    name: 'BHTTP/1',
    opponent: 'HTTP, redesigned as a binary protocol from a blank spec.',
    scoreline: '32 tests over real sockets. Standard library only.',
    keyPoint:
      'A written spec with length-prefixed frames, a file server and a client that never opens a ' +
      'second connection, plus an annotated hexdump of one exchange.',
    stack: ['Python', 'Sockets', 'Protocol design'],
    repo: 'https://github.com/rudhar07/binary-http-protocol',
  },
  {
    name: 'AgentFlow',
    opponent: 'A browser agent filling a form whose labels it is not told.',
    scoreline: 'Finds fields by role and structure, with zero hard-coded labels.',
    keyPoint:
      'Two interchangeable brains, rule-based or Claude computer-use, driving the same ' +
      'coordinate-based tool belt with real mouse clicks.',
    stack: ['Python', 'Playwright', 'Claude'],
    repo: 'https://github.com/rudhar07/AgentFlow',
    live: 'https://rudhar07-agentflow.hf.space/',
  },
  {
    name: 'CareQueue',
    opponent: 'Taking a clinic queue app from laptop to an autoscaled cluster.',
    scoreline: 'Git → CI → Trivy gate → GHCR → Terraform/EKS → Helm → HPA → Grafana.',
    keyPoint:
      'Every image tagged by commit SHA and blocked on a security scan before it can ship, with ' +
      'double bookings rejected by both the API and the database.',
    stack: ['FastAPI', 'Kubernetes', 'Terraform', 'GitHub Actions'],
    repo: 'https://github.com/rudhar07/carequeue-clinic',
  },
]

/** Smaller games, listed in one line each. */
export const alsoPlayed = [
  {
    name: 'DocuMind',
    line: 'RAG over PDFs that cites page numbers and refuses when the source is silent.',
    href: 'https://docu-mind-ai-rag.vercel.app/',
  },
  {
    name: 'Mimeo CLI',
    line: 'Terminal coding agent on a START → THINK → TOOL → OBSERVE loop, provider-agnostic.',
    href: 'https://github.com/rudhar07/Mimeo-CLI',
  },
  {
    name: 'Keep-alive calculator',
    line: 'HTTP/1.1 on raw sockets: one TCP handshake, nine responses.',
    href: 'https://github.com/rudhar07/http11-keepalive-calc',
  },
]
