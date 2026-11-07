# Blackstar — Brewery & Restaurant, Whitefish, Montana

Demo website for Blackstar (2 Central Ave, Whitefish, MT), built by **Nexlyr Solutions**.
Preview domain: `blackstar.nexlyr.solutions`

Static site, no build step. Deploy the repo root on Vercel (framework preset **Other**).

## Pages
| File | Page |
| --- | --- |
| `index.html` | Home: hero with 3D Blackstar star, three floors, Jeremiah Johnson brewery + tap board, dishes, gallery, events, visit |
| `menu.html` | Full menu with sticky category tabs (themed dropdown on mobile) |
| `brewery.html` | Jeremiah Johnson Brewing Co., brewed on site, split-flap tap board |
| `events.html` | Private events (30+), FAQ, gallery, Pint Night, request form |
| `story.html` | 1994 Great Northern Brewing Co. → today, timeline |
| `visit.html` | Map, hours, good-to-know, contact form |
| `404.html` | Not found |

## Structure
```
assets/css/tokens.css   colours, type, spacing, motion tokens (edit brand here)
assets/css/site.css     all styles
assets/js/site.js       interactions: nav, dropdowns, open-now, reveals, tap board, lightbox, chat, forms
assets/js/star3d.js     3D nautical star (three.js, lazy-loaded after the page is up)
assets/js/vendor/       GSAP + ScrollTrigger, Lenis (local copies, no CDN)
assets/fonts/           Archivo (expanded display), Instrument Serif (accents), Manrope (body), JetBrains Mono — subset woff2
assets/img/             photos from blackstarmt.com as responsive WebP (480–2400w); cut-*.webp are background-removed product shots
assets/brand/           vector logo, wordmark, star, bronco drawing, favicons
assets/og/              1200×630 link-preview images, one per page (home, menu, brewery, events, story, visit)
```

## Mobile
App-style layout under 960px: glass bottom dock (Home · Menu · Order · Events · Ask), compact menu sheet and chat panel (never full screen), swipe rows instead of long stacks, and one-category-at-a-time menu tabs.

## Editing
- **Hours:** `HOURS` at the top of `assets/js/site.js` (drives the "Open now" pills and today's row) + the hours text in the pages.
- **Menu items:** in `menu.html` (`.mitem` blocks). Prices live on Toast; the site links there.
- **Tap board:** `.board` rows in `index.html` / `brewery.html` (`data-text` on each `.flap`).
- **Forms:** marked `data-demo`. They validate and show a confirmation but don't send anything yet. Wire to Supabase / email before going live.

## Notes
- Hours used: Mon–Wed 11–9, Thu–Sat 11–10, Sun 11–9 (the current site also shows a second, different hours block — confirm with the client).
- No phone number or email is listed on the current site, so none is shown.
- Beer ABVs come from public listings of Jeremiah Johnson beers; the board is labelled as a sample.
