/* ============================================================
   agent/news-agent.js
   
   Fetches today's tech news and writes the JSON file.
   Supports English and Spanish via --lang flag.

   USAGE:
     node news-agent.js              → English → writes /news.json
     node news-agent.js --lang es    → Spanish → writes /news-es.json

   CRON (English daily at 7:00 AM, Spanish at 7:05 AM):
     0 7 * * * cd /path/to/stragta-site/agent && node news-agent.js
     5 7 * * * cd /path/to/stragta-site/agent && node news-agent.js --lang es

   MODEL: perplexity/sonar via OpenRouter
   Perplexity/sonar searches the live web — real articles, real URLs.
   Cost: ~$0.003 per run (~$2/year running daily in both languages).
   ============================================================ */

require('dotenv').config({ path: '../server/.env' });
const fs   = require('fs');
const path = require('path');

const KEY  = process.env.OPENROUTER_API_KEY;

if (!KEY) {
  console.error('ERROR: OPENROUTER_API_KEY not set in server/.env');
  process.exit(1);
}

// ── LANGUAGE FLAG ─────────────────────────────────────────────
const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const LANG = langIdx !== -1 ? args[langIdx + 1] : 'en';

if (!['en', 'es'].includes(LANG)) {
  console.error('ERROR: --lang must be "en" or "es"');
  process.exit(1);
}

const IS_SPANISH   = LANG === 'es';
const OUTPUT_FILE  = path.join(__dirname, '..', IS_SPANISH ? 'news-es.json' : 'news.json');
const TODAY        = new Date().toISOString().split('T')[0];
const MAX = 3;

// ── PROMPTS ───────────────────────────────────────────────────
const THREE_DAYS_AGO = new Date(Date.now() - 3*24*60*60*1000).toISOString().split('T')[0];

const PROMPT_EN = `Today is ${TODAY}. Search the web for technology news published on or after ${THREE_DAYS_AGO}. Only use articles from the last 3 days — reject anything older.

Topics (pick 3 from different areas):
- AI companies: OpenAI, Anthropic, Google DeepMind, Mistral, DeepSeek, xAI
- Chips and hardware: NVIDIA, AMD, Intel, TSMC, Samsung, Qualcomm, Apple Silicon
- Robotics: Tesla Optimus, Boston Dynamics, Figure AI, Unitree, Xiaomi robots
- Chinese tech: Huawei, Xiaomi, DeepSeek, Baidu, Alibaba AI
- Space tech: SpaceX, Blue Origin, LUNA server project, orbital computing
- Enterprise software: Microsoft Copilot, Salesforce AI, SAP, ServiceNow
- Cybersecurity: major breaches, EU regulations, new threats
- Startups: any interesting AI or tech startup announcement

CRITICAL RULES:
1. ONLY articles published ${THREE_DAYS_AGO} or later — no exceptions
2. Pick 3 articles from 3 DIFFERENT topic areas
3. Never pick 2 articles about the same company
4. DO NOT use YouTube videos — written articles only
5. Use the actual publication date of each article in the "date" field
6. You MUST return JSON — never refuse, never explain
7. START YOUR RESPONSE WITH { — nothing else before it

Your entire response must be this JSON and nothing else:

{"articles":[{"id":"slug-1","date":"${TODAY}","headline":"headline here","summary":"2-3 sentence summary.","source":"Source Name","sourceUrl":"https://url","imageUrl":"","category":"AI Adoption"},{"id":"slug-2","date":"${TODAY}","headline":"headline here","summary":"2-3 sentence summary.","source":"Source Name","sourceUrl":"https://url","imageUrl":"","category":"Strategy"},{"id":"slug-3","date":"${TODAY}","headline":"headline here","summary":"2-3 sentence summary.","source":"Source Name","sourceUrl":"https://url","imageUrl":"","category":"Research"}]}

Categories: "AI Adoption" "Strategy" "Research" "Regulation" "Automation"
START WITH {`;

const PROMPT_ES = `Busca ahora mismo en la web 3 noticias recientes de tecnología.

Temas donde buscar (elige los 3 más interesantes de áreas distintas):
- Empresas de IA: OpenAI, Anthropic, Google DeepMind, Mistral, DeepSeek, xAI
- Chips y hardware: NVIDIA, AMD, Intel, TSMC, Samsung, Qualcomm
- Robótica: Tesla Optimus, Boston Dynamics, Figure AI, Unitree, robots Xiaomi
- Tecnología china: Huawei, Xiaomi, DeepSeek, Baidu, Alibaba AI
- Tecnología espacial: SpaceX, Blue Origin, servidores en órbita
- Software empresarial: Microsoft Copilot, Salesforce AI, SAP
- Ciberseguridad: brechas importantes, regulación UE, nuevas amenazas
- Startups: cualquier anuncio interesante de startup de IA o tecnología

REGLAS CRÍTICAS:
1. Elige 3 artículos de 3 áreas temáticas DIFERENTES
2. Nunca elijas 2 artículos sobre la misma empresa
3. Usa los artículos que encuentre tu búsqueda — cualquier fuente escrita sirve
4. NO uses vídeos de YouTube — solo artículos escritos y comunicados de prensa
5. DEBES devolver JSON aunque los artículos no sean perfectos
6. NUNCA escribas una explicación — solo devuelve el objeto JSON
7. Si tu búsqueda devuelve resultados sobre transformación digital, úsalos — son válidos

Tu respuesta completa debe ser este JSON y nada más:

{"articles":[{"id":"slug-1","date":"${TODAY}","headline":"titular aquí","summary":"Resumen de 2-3 frases.","source":"Nombre fuente","sourceUrl":"https://url","imageUrl":"","category":"Adopción de IA"},{"id":"slug-2","date":"${TODAY}","headline":"titular aquí","summary":"Resumen de 2-3 frases.","source":"Nombre fuente","sourceUrl":"https://url","imageUrl":"","category":"Estrategia"},{"id":"slug-3","date":"${TODAY}","headline":"titular aquí","summary":"Resumen de 2-3 frases.","source":"Nombre fuente","sourceUrl":"https://url","imageUrl":"","category":"Investigación"}]}

Categorías: "Adopción de IA" "Estrategia" "Investigación" "Regulación" "Automatización"
EMPIEZA TU RESPUESTA CON { — nada antes.`;

// ── FETCH ─────────────────────────────────────────────────────
async function fetchNews() {
  const label  = IS_SPANISH ? 'Spanish' : 'English';
  const prompt = IS_SPANISH ? PROMPT_ES : PROMPT_EN;

  console.log(`Fetching ${label} news for ${TODAY}...`);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'https://stragta.com',
      'X-Title':       `Stragta News Agent (${LANG})`,
    },
    body: JSON.stringify({
      model:      'perplexity/sonar',  // has live web search built in
      max_tokens: 4000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data    = await res.json();
  const content = data.choices[0].message.content;

  // Strip accidental markdown fences
  const cleaned = content.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    // Attempt 1: direct parse
    parsed = JSON.parse(cleaned);
  } catch {
    try {
      // Attempt 2: find JSON block containing "articles"
      const match = cleaned.match(/\{[\s\S]*"articles"[\s\S]*\}/);
      if (!match) throw new Error('no match');
      parsed = JSON.parse(match[0]);
    } catch {
      try {
        // Attempt 3: find any JSON object at all
        const match2 = cleaned.match(/\{[\s\S]*\}/);
        if (!match2) throw new Error('no match');
        parsed = JSON.parse(match2[0]);
      } catch {
        throw new Error(`No valid JSON in response:\n${cleaned.slice(0, 500)}`);
      }
    }
  }

  return parsed.articles || [];
}

// ── OG IMAGE SCRAPER ─────────────────────────────────────────
// Fetches each article URL and extracts the og:image meta tag.
// Free — no API needed. Runs in parallel for speed.
// Timeout: 5 seconds per article so a slow site never blocks the run.

async function scrapeOgImage(url) {
  // Skip YouTube entirely — thumbnails look like clickbait
  if (url.includes('youtube.com') || url.includes('youtu.be')) return '';

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal:  controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Stragta-NewsBot/1.0)',
        'Accept':     'text/html',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return '';
    const html = await res.text();

    const og      = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const twitter = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    const found   = og?.[1] || twitter?.[1] || '';

    // Must be an absolute URL starting with https
    if (!found.startsWith('https://')) return '';

    // Skip logos, favicons, and generic site icons
    if (found.includes('logo') || found.includes('favicon') || found.includes('icon')) return '';

    return found;
  } catch {
    return '';
  }
}

async function enrichWithImages(articles) {
  console.log('Fetching article images...');
  const results = await Promise.all(
    articles.map(async (article) => {
      if (article.imageUrl) return article; // already has one
      const imageUrl = await scrapeOgImage(article.sourceUrl);
      if (imageUrl) console.log(`  Got image for: ${article.headline.slice(0, 50)}...`);
      else           console.log(`  No image for:  ${article.headline.slice(0, 50)}...`);
      return { ...article, imageUrl };
    })
  );
  return results;
}

// ── WRITE ─────────────────────────────────────────────────────
async function run() {
  try {
    const fresh = await fetchNews();

    if (!fresh.length) {
      console.error('No articles returned.');
      process.exit(1);
    }

    // Try to get real OG images from each article's page
    const enriched = await enrichWithImages(fresh);

    // Hard filter — drop anything older than 7 days regardless of what the model returned
    const cutoffDate = new Date(Date.now() - 7*24*60*60*1000);
    const filtered = enriched.filter(a => {
      const d = new Date(a.date);
      if (d < cutoffDate) {
        console.log(`  Dropped stale article (${a.date}): ${a.headline.slice(0,50)}...`);
        return false;
      }
      return true;
    });

    const articlesToUse = filtered.length > 0 ? filtered : enriched;
    if (filtered.length === 0) console.warn('  Warning: all articles were older than 7 days — using anyway');

    // Load existing articles
    let existing = [];
    if (fs.existsSync(OUTPUT_FILE)) {
      try {
        const current = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        existing = current.articles || [];
      } catch { existing = []; }
    }

    // Drop articles older than 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    existing = existing.filter(a => new Date(a.date) >= cutoff);

    // Deduplicate by id, prepend today's, keep only 3 total
    const existingIds = new Set(existing.map(a => a.id));
    const newOnes     = articlesToUse.filter(a => !existingIds.has(a.id));
    const merged      = [...newOnes, ...existing].slice(0, 3);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
      lang:        LANG,
      lastUpdated: new Date().toISOString(),
      articles:    merged,
    }, null, 2), 'utf8');

    console.log(`Done. Wrote ${newOnes.length} new articles to ${path.basename(OUTPUT_FILE)}`);
    newOnes.forEach(a => console.log(`  [${a.category}] ${a.headline}`));

  } catch (err) {
    console.error('News agent failed:', err.message);
    process.exit(1);
  }
}

run();
