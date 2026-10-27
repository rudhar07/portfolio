# Rudhar Bajaj, portfolio

**Two Rubbers.** A table tennis paddle has a red rubber and a black rubber, and so does this site.

- **Red, the Engineer:** RL environments at Scaler AI Labs, projects written up as match cards, competitive programming, tools, education.
- **Black, the Player:** state-level table tennis, the sports club, and RallyTrack.

The paddle in the corner (or the <kbd>F</kbd> key) flips the whole page. The hero is a real 3D table: hover it and your mouse becomes the near paddle, and the scoreboard counts your rally.

Live: https://rudharbajaj.vercel.app

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (client-rendered, for development)
npm run build      # client build + SSR build + prerender into dist/
npm run preview    # serve dist/ exactly as Vercel will
npm run lint
```

`npm run build` does four things:

1. Builds the client bundle and a server bundle of the same React tree.
2. Fetches live LeetCode and Codeforces numbers. Each source falls back to `src/content/cp.js` if it can't be reached.
3. Renders the page to static HTML and injects it into `dist/index.html`, so the content works without JavaScript.
4. **Fails** if the HTML points at a file in `/public` that doesn't exist, and lists every `TODO` left in `src/content` as a warning.

## Editing content

All copy is plain data in [`src/content/`](src/content/). Components never hold copy.

| File | What it holds |
|---|---|
| `site.js` | name, email, links, résumé path, the hero and about copy for both sides |
| `experience.js` | work and education |
| `matches.js` | projects as match cards: `opponent` (the problem), `scoreline` (a checkable result), `keyPoint` (the decision that won it) |
| `cp.js` | competitive programming handles, fallback stats, the tools list |
| `tt.js` | table tennis: headline, style, results, club work, RallyTrack bounce data |

Empty arrays and `null` fields are not rendered, so a missing fact never turns into placeholder text on the live site.

## Contact form

Set `VITE_WEB3FORMS_KEY` (a free key from [web3forms.com](https://web3forms.com), tied to your inbox) in Vercel's environment variables. With it, the form posts there and says "served" only when the API confirms delivery. Without it, the form opens the visitor's mail app with the message filled in, and says that is what happened.

## Where things live

| Thing | File |
|---|---|
| Page structure | [`src/components/Site.jsx`](src/components/Site.jsx) |
| Hero and the lazy 3D mount | [`src/components/Stage.jsx`](src/components/Stage.jsx) |
| The rally: table, ball flight, shot solver, AI, pointer control | [`src/scene/rally.js`](src/scene/rally.js) |
| Nav, scoreboard, flip paddle and wipe | [`src/components/Chrome.jsx`](src/components/Chrome.jsx) |
| Side and rally state outside React | [`src/lib/stores.js`](src/lib/stores.js) |
| Synthesised "pock" (no audio files) | [`src/lib/sound.js`](src/lib/sound.js) |
| Smooth scroll and reveals | [`src/lib/motion.js`](src/lib/motion.js) |
| Prerender, stats, asset check | [`scripts/prerender.mjs`](scripts/prerender.mjs), [`src/lib/stats.js`](src/lib/stats.js) |
| Share-image source (`public/og.png`) | [`scripts/og/og.html`](scripts/og/og.html) |
| Scripted rally check | [`scripts/rally-check/index.html`](scripts/rally-check/index.html), open at `/scripts/rally-check/` under `npm run dev` |

## Stack

React 19, Vite, three.js (no React Three Fiber, no physics engine), Lenis. The initial JavaScript is about 70 KB gzipped. three.js is a separate chunk loaded once the page is idle.
