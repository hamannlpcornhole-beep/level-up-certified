# Level Up Certified

Hub site and $1 player certification for Level Up Cornhole.

**Test link:** https://hamannlpcornhole-beep.github.io/level-up-certified/

This is a test build. Payments run in demo mode (nothing is charged), forms don't send anywhere, and search engines are blocked (`robots.txt` + `noindex`). The plan is to move to a real domain later.

## Pages
| Path | What it is |
|---|---|
| `/` | Home. 3D broadcast court with a live scorebug, how it works, the 11 modules, the player card, hub tiles, leagues pitch, giveaways, FAQ |
| `/certify/` | The course app: signup, demo checkout, dashboard with XP and levels, 11 modules, the pledge, the finish reveal and the player card |
| `/gear/` | Bags and boards, bag speed tool, starter kits, company directory |
| `/play/` | Levels of play, league finder, event finders, apps |
| `/training/` | Beginner path, drills library, PPR tracker, programs, coaches |
| `/leagues/` | Partner pitch, sample dashboard, earnings example, QR poster kit, apply form |
| `/verify/` | Type or scan a certification ID and get verified, expired or not found |
| `/giveaways/` | Countdown, entries, prizes, free entry form, draft official rules |
| `/404.html` | Branded not found page |

## Layout
- `assets/css/site.css` design system (tokens and components). `course.css`, `course-widgets.css` and `pages.css` build on it.
- `assets/js/config.js` price, season, demo mode, ACL line switch, league codes, contact email.
- `assets/js/site.js` nav, footer, reveals, toasts, modals, helpers.
- `assets/js/hero3d.js` the 3D court on the home page (three.js from a CDN).
- `assets/js/holo-card.js` the player card, its tilt, and the PNG export.
- `assets/js/course/` the course app: `app.js` (router and views), `content.js` (lessons), `widgets.js` (interactive pieces).
- `assets/js/pages/` one file per hub page.
- `tools/og.html` regenerates the link preview image (`assets/img/og-certified.jpg`).

## Facts the content follows
ACL rulebook: board 2 x 4 ft, 6 in hole 9 in from the back, back edge 12 in and front edge 2.5 to 3.5 in, boards 27 ft apart front to front, pitcher's box 3 x 4 ft, 15 second pitch clock, a round is 8 bags, cancellation scoring, first to 21 or more with no bust. Bags are 6 x 6 in, 15.5 to 16.5 oz, resin filled, stamped PRO, COMP, REC or MINI.

## Deploying
GitHub Pages serves `main` from the repo root. Push to `main` and it's live in about a minute. If a change doesn't show, hard refresh (Pages caches for about 10 minutes).

## Going live later
1. Buy the domain and point it at Pages. Change `<base href>` in `404.html` to `/`.
2. Create the $1 Shopify product and a certifications registry, then read it from `/verify/`.
3. Klaviyo list plus certificate and renewal emails.
4. Add real league codes in `config.js`.
5. Drop real video URLs into the module slots.
6. Set `demoMode: false`, remove `noindex` and the `robots.txt` block.
