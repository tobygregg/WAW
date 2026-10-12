# World Aid Walk — Guernsey 🥾💚

*Fighting Poverty with Heart & Sole* — the website for Guernsey's charity walk (since 1970).

One-page site with a video hero, a floating 3D map of Guernsey & Herm, a footprint trail through the charities, registration, donate and prep tips — plus separate Volunteer, Contact, Support, Privacy and Terms pages.

---

## ✏️ Editing content (the easy bit)

**Almost everything lives in one file: [`assets/js/config.js`](assets/js/config.js)**

| Want to change… | Look for |
|---|---|
| Hero text, buttons, video | `hero` |
| Walk date / countdown / year | `event` |
| Registration, donate, social links | `links` |
| Walk times, start & finish, map pins | `walkInfo` |
| Charities (text, links, logos) | `charities` |
| Sponsors | `sponsors` |
| Fees, t-shirt, open/closed status | `register` |
| Prep tips | `prepare` |
| Volunteer / Contact / Support / Privacy / Terms text | `pages` |

Tips:
- `{year}` in any text is swapped for `event.year` automatically.
- `register.status` can be `"open"`, `"soon"` or `"closed"` (closed greys out the entry buttons).
- **Charity logos:** drop the official logo files in `assets/images/logos/` and set e.g. `logo: "assets/images/logos/christian-aid.png"`. Leave `logo: ""` to show the styled name badge.
- **Hero video:** replace `assets/video/hero.mp4` / `hero.webm` / `hero-poster.jpg` (keep it under ~5 MB). The current one is a slideshow made from the event photos.
- **Map pins** use `[longitude, latitude]`. Google Maps shows *latitude, longitude* when you right-click — so swap them round.

### Things that are NOT in config.js
- **Social share previews** (Open Graph title/description/image) — in the `<head>` of each `.html` file, because Facebook/WhatsApp don't run JavaScript.
- **Event info for Google** (`<script type="application/ld+json">` in `index.html`) — update the date and prices each year.
- `sitemap.xml` / `robots.txt` — update if the domain changes.

---

## 🗂 File structure

```
├── index.html               ← home page (one-page site)
├── 404.html                 ← "wandered off the route" page
├── pages/                   ← separate pages (not on the main scroll)
│   ├── volunteer.html  contact.html  support.html
│   ├── privacy.html    terms.html    thanks.html
├── assets/
│   ├── js/
│   │   ├── config.js        ← ✏️ EDIT ME — all text & links
│   │   ├── layout.js        ← nav, footer, footprints, reveal animations (all pages)
│   │   ├── main.js          ← home page sections + animations
│   │   ├── pages.js         ← fills the extra pages
│   │   └── island3d.js      ← the floating 3D island map
│   ├── data/island-outlines.js   ← real Guernsey & Herm coastlines
│   ├── css/input.css        ← Tailwind source (edit this…)
│   ├── css/styles.css       ← …this is the built file the site uses
│   ├── vendor/              ← GSAP, ScrollTrigger, slim three.js build
│   ├── fonts/               ← Archivo Black, Archivo, Caveat (self-hosted)
│   ├── images/              ← logo, arch, t-shirts, photos, og-image
│   └── video/               ← hero video + poster
├── favicon.ico, apple-touch-icon.png, android-chrome-*.png, site.webmanifest
├── robots.txt, sitemap.xml
├── tailwind.config.js       ← brand colours, fonts, animations
└── tools/three-entry.js     ← which three.js parts get bundled
```

---

## 🛠 Running & building

The site is plain HTML/CSS/JS — **no build needed to host it**, `styles.css` is already compiled.

```bash
npm install          # first time only
npm run dev          # rebuilds CSS as you edit (Tailwind watch)
npm run build        # one-off minified CSS build
npm run serve        # local preview at http://localhost:3000
```

Only run `npm run build` if you change Tailwind classes in HTML/JS or edit `input.css`. Text changes in `config.js` need no build.

`npm run build:three` rebuilds the slim three.js bundle (only needed if `island3d.js` starts using a new three.js class — add it to `tools/three-entry.js`).

## 🚀 Hosting

Works on GitHub Pages, Netlify, Vercel, Cloudflare Pages — just serve the folder. For GitHub Pages: *Settings → Pages → Deploy from branch → `main` / root*.

## ✉️ Contact form

Uses [FormSubmit](https://formsubmit.co) (free, no backend). The **first** message sent triggers a one-time activation email to `worldaidwalk@gmail.com` — click the link in it and you're live. Change the address via `site.formEndpoint` in config.

## 🙌 Credits

- Coastline data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL) & [geoBoundaries](https://www.geoboundaries.org) (CC BY 4.0)
- [three.js](https://threejs.org) (MIT), [GSAP](https://gsap.com) (free standard licence), [Tailwind CSS](https://tailwindcss.com) (MIT)
- Fonts: Archivo Black, Archivo, Caveat (SIL Open Font License)
