# Level Up Certified

Hub site and $1 certification course for Level Up Cornhole players.

**Test link:** https://hamannlpcornhole-beep.github.io/level-up-certified/

This is a test build. Payments run in demo mode (nothing is charged) and search engines are blocked (`robots.txt` + `noindex`). The plan is to move to a new domain later.

## Layout
- `index.html` home
- `certify/` the course app (enroll, modules, "I'm done", player card)
- `gear/`, `play/`, `training/`, `leagues/`, `verify/`, `giveaways/` hub pages
- `assets/css/site.css` design system (tokens + components)
- `assets/js/config.js` price, season, demo mode, ACL line switch, league codes
- `assets/js/site.js` nav, footer, reveals, toasts, modals
- `assets/js/hero3d.js` the 3D board on the home page (three.js)

## Deploying
GitHub Pages serves `main` from the repo root. Push to `main` and it's live in about a minute.
