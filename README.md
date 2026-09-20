# STRAGTA Website

Static website for Stragta, a Madrid-based technology consulting partner serving Europe in English and Spain / LATAM in Spanish.

## Integration boundaries

- The main English and Spanish pages contain presentation content only.
- `/contact/` and `/es/contacto/` own the contact experience. `assets/js/contact.js` is the only frontend file tied to the current Google Apps Script endpoint. Replace that adapter when moving the form to Odoo CRM.
- `assets/js/paco.js` is the isolated assistant widget. The `data-server` attribute in each page selects its backend. Replace this script block when adopting Odoo Live Chat or an Odoo bot.
- Legal, privacy, and cookie information lives in dedicated bilingual pages and must be reviewed whenever the contact or assistant provider changes.
- Frontend fonts, globe libraries, and map data are self-hosted under `assets/`; their licenses are stored in `assets/vendor/`.

## Current structure

```text
.
├── index.html
├── es/
│   └── index.html
├── contact/ and es/contacto/
├── legal/ and es/aviso-legal/
├── privacy/ and es/privacidad/
├── cookies/ and es/cookies/
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── globe.js
│       ├── main.js
│       ├── contact.js
│       ├── paco.js
│       ├── news.js
│       └── reviews.js
├── agent/
│   ├── news-agent.js
│   ├── package.json
│   └── package-lock.json
├── news.json
├── news-es.json
└── .github/
    └── workflows/
        └── news.yml
