# STRAGTA — Site

Technology consulting partner website. One-page, warm cream palette, Manrope typeface, interactive D3 globe, AI chatbot powered by Claude, daily automated news section.

---

## Project structure

```
stragta-site/
  index.html              Main page (HTML only, no inline JS or CSS)
  news.json               Articles shown in the Insights section
  .gitignore
  assets/
    css/
      styles.css          All styles
    js/
      main.js             Nav scroll, reveal animations, contact form
      globe.js            D3 orthographic globe with real tier data
      chat.js             AI chatbot (calls /api/chat)
      news.js             Loads news.json and renders articles
  server/
    server.js             Node.js/Express: serves the site + proxies /api/chat
    package.json
    .env.example          Copy to .env and add your API key
  agent/
    news-agent.js         Daily news fetcher (writes news.json automatically)
    package.json
```

---

## Quick start (local development)

```bash
# 1. Clone your repo
git clone https://github.com/YOUR_USERNAME/stragta-site.git
cd stragta-site

# 2. Set up the server
cd server
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start the server
node server.js
# Site is now at http://localhost:3000
```

The server:
- Serves the static site at `/`
- Proxies chatbot requests from `/api/chat` to Anthropic (key stays server-side)

---

## Getting your Anthropic API key

1. Go to https://console.anthropic.com
2. Create an account (or sign in)
3. Go to API Keys and create a new key
4. Copy it into `server/.env`

**Cost:** Claude Sonnet at current rates is roughly $0.003 per conversation.
A consulting site with 200 visitors/month where 20 people chat costs under $1/month.

---

## News agent setup

The news agent uses the Anthropic API with web search to find today's top AI and tech news and write them to `news.json` automatically.

```bash
cd agent
npm install

# Run once manually to test
node news-agent.js

# Schedule to run daily at 7:00 AM (cron on Linux/Mac)
crontab -e
# Add this line:
0 7 * * * cd /full/path/to/stragta-site/agent && node news-agent.js >> /var/log/stragta-news.log 2>&1
```

The agent:
1. Asks Claude to search the web for today's top AI/tech news
2. Gets back structured JSON with headlines, summaries, sources
3. Prepends new articles to `news.json` (keeps last 30)
4. The site picks them up on next page load (no redeploy needed)

---

## Deployment options

### Option A: Any VPS (DigitalOcean, Hetzner, Linode) — Recommended

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/stragta-site.git
cd stragta-site/server
npm install
cp .env.example .env && nano .env   # add API key

# Run with PM2 (keeps the server alive after reboots)
npm install -g pm2
pm2 start server.js --name stragta
pm2 save && pm2 startup

# Point your domain with nginx:
# Proxy pass port 3000 to stragta.com
```

Nginx config for stragta.com:
```nginx
server {
    server_name stragta.com www.stragta.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Then run: `certbot --nginx -d stragta.com -d www.stragta.com`

### Option B: GitHub Pages (static only, no chatbot)

The site works as pure HTML/CSS/JS without the chatbot if you do not have a server.
The chat widget falls back to preset responses automatically.
Push to the `gh-pages` branch or enable Pages in repo settings.

### Option C: Vercel or Netlify (static + serverless function)

Move `server.js` logic into a serverless function:
- Vercel: create `/api/chat.js` as a Vercel function
- Netlify: create `/netlify/functions/chat.js`

Both platforms have free tiers that cover a small consulting site easily.

---

## Adding new content (articles, workshops, talks)

All future pages (webinar landing pages, workshop pages, etc.) should:
1. Live in the same repo as their own `.html` file
2. Link to `assets/css/styles.css` for consistent styling
3. Be served automatically by the Express server

Example: `stragta.com/webinar-ia` = create `webinar-ia.html` in the root folder.

---

## news.json schema (for the agent and manual updates)

```json
{
  "lastUpdated": "2026-03-21T08:00:00Z",
  "articles": [
    {
      "id": "unique-slug",
      "date": "2026-03-21",
      "headline": "Article headline",
      "summary": "2-3 sentence factual summary.",
      "source": "Publication Name",
      "sourceUrl": "https://full-url",
      "imageUrl": "",
      "category": "AI Adoption"
    }
  ]
}
```

Valid categories: `AI Adoption`, `Strategy`, `Research`, `Regulation`, `Automation`

Leave `imageUrl` empty to use the automatic abstract category artwork.
Set it to a real image URL for custom visuals.

---

## Contact form

The form currently shows a success state on submit but does not send email yet.
To wire it up, choose one:

**Formspree (free tier, no server needed):**
1. Create account at formspree.io
2. Get your form ID
3. In `main.js`, uncomment the Formspree fetch block and add your ID

**EmailJS (free tier, no server needed):**
Similar approach, works fully from the browser.

**Your own SMTP via the server:**
Add a `/api/contact` route to `server.js` using nodemailer.

---

Built with Claude · Anthropic API · D3.js · Manrope · No frameworks
