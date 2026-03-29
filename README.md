# idev.team

Portfolio and showcase website for **iDev** (iDevelop IT) — a software development company specializing in web apps, CRM systems, Telegram bots, and integrations.

**Live:** [https://idev.team](https://idev.team)

## Tech Stack

Static site built with plain HTML + CSS + JavaScript — no frameworks, no build step.

| File | Purpose |
|------|---------|
| `index.html` | Main page (Russian) — hero, services, projects, contact |
| `en/index.html` | English version |
| `styles.css` | Dark theme, gradients, animations, responsive layout |
| `script.js` | Scroll reveal, 3D card tilt, mobile menu, language toggle |
| `lang-redirect.js` | Auto-redirect based on saved language preference |
| `firebase.json` | Firebase Hosting config (rewrites, security headers) |

## Sections

- **Hero** — company intro with CTA
- **Services** (6 cards) — web development, CRM, bots, integrations, consulting, support
- **Projects** (5 cards):
  - Corporate website
  - HR System (live demo at [demo.hr.idev.team](https://demo.hr.idev.team))
  - Bot Assistant ([@MyAssistWork_Bot](https://t.me/MyAssistWork_Bot))
  - Internal CRM
  - Integrations (NDA)
- **Contact** — Telegram request bot

## Navigation

Services | Projects | CRM | HR-система | Contact | Language toggle (RU/EN)

## Internationalization (i18n)

Two full versions: Russian (`/index.html`) and English (`/en/index.html`).
Language preference is stored in `localStorage` — no URL query params. The `lang-redirect.js` script handles automatic redirect on first visit.

## Telegram

Request bot: [@iDevelop_bot](https://t.me/iDevelop_bot) — forwards inquiries to the owner.

## Hosting

Firebase Hosting (project: `idevteam-601c2`), domain: `idev.team`.

Security headers configured in `firebase.json`:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Local Development

No build required. Open `index.html` directly or use any local server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

## Deploy

```bash
firebase deploy --only hosting
```

## Git Repository

[github.com/ITS1Lv3R/portfolio](https://github.com/ITS1Lv3R/portfolio) (private)
