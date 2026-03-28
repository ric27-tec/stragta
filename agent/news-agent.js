/* ============================================================
   agent/news-agent.js

   Fetches tech news and writes the JSON file.
   Supports English and Spanish via --lang flag.

   USAGE:
     node news-agent.js --lang en
     node news-agent.js --lang es

   OUTPUT:
     en -> /news.json
     es -> /news-es.json

   MODEL: perplexity/sonar via OpenRouter
   ============================================================ */

require('dotenv').config({ path: '../.env' });

const fs = require('fs');
const path = require('path');

const KEY = process.env.OPENROUTER_API_KEY;

if (!KEY) {
  console.error('ERROR: OPENROUTER_API_KEY not set in .env or GitHub Actions secrets');
  process.exit(1);
}

const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const LANG = langIdx !== -1 ? args[langIdx + 1] : 'en';

if (!['en', 'es'].includes(LANG)) {
  console.error('ERROR: --lang must be "en" or "es"');
  process.exit(1);
}

const IS_SPANISH = LANG === 'es';
const OUTPUT_FILE = path.join(
  __dirname,
  '..',
  IS_SPANISH ? 'news-es.json' : 'news.json'
);

const NOW = new Date();
const TODAY_ISO = NOW.toISOString().split('T')[0];

function formatUniversalDate(input) {
  const date = input ? new Date(input) : new Date();

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function parseFlexibleDate(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const direct = new Date(input);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const match = input.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, dayStr, monthName, yearStr] = match;
  const normalized = `${dayStr} ${monthName} ${yearStr} UTC`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function isoDateDaysAgo(days) {
  return new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString().split('T')[0];
}

const THREE_DAYS_AGO = isoDateDaysAgo(3);
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const PROMPT_EN = `Today is ${TODAY_ISO}. Search the web for technology news published on or after ${THREE_DAYS_AGO}.

Topics (pick up to 5 from different areas):
- AI companies: OpenAI, Anthropic, Google DeepMind, Mistral, DeepSeek, xAI
- Chips and hardware: NVIDIA, AMD, Intel, TSMC, Samsung, Qualcomm, Apple Silicon
- Robotics: Tesla Optimus, Boston Dynamics, Figure AI, Unitree, Xiaomi robots
- Chinese tech: Huawei, Xiaomi, DeepSeek, Baidu, Alibaba AI
- Space tech: SpaceX, Blue Origin, orbital computing
- Enterprise software: Microsoft Copilot, Salesforce AI, SAP, ServiceNow
- Cybersecurity: major breaches, EU regulations, new threats
- Startups: interesting AI or tech startup announcements

CRITICAL RULES:
1. Prefer articles published ${THREE_DAYS_AGO} or later
2. Pick articles from DIFFERENT topic areas whenever possible
3. Never pick 2 articles about the same company unless unavoidable
4. DO NOT use YouTube videos — written articles only
5. Use the actual publication date of each article
6. Every "date" must use this exact format: 27 April 2026
7. Return ONLY valid JSON
8. If no valid recent articles are found, return:
{"no_updates":true,"articles":[]}
9. Never write any explanation outside JSON
10. Start with {

Your entire response must be valid JSON and nothing else:

{
  "articles": [
    {
      "id": "slug-1",
      "date": "27 April 2026",
      "headline": "headline here",
      "summary": "2-3 sentence summary.",
      "source": "Source Name",
      "sourceUrl": "https://url",
      "imageUrl": "",
      "category": "AI Adoption"
    }
  ]
}

Allowed categories:
"AI Adoption", "Strategy", "Research", "Regulation", "Automation"`;

const PROMPT_ES = `Hoy es ${TODAY_ISO}. Busca en la web noticias de tecnología publicadas preferentemente el ${THREE_DAYS_AGO} o después.

Temas (elige hasta 5 de áreas distintas):
- Empresas de IA: OpenAI, Anthropic, Google DeepMind, Mistral, DeepSeek, xAI
- Chips y hardware: NVIDIA, AMD, Intel, TSMC, Samsung, Qualcomm
- Robótica: Tesla Optimus, Boston Dynamics, Figure AI, Unitree, robots Xiaomi
- Tecnología china: Huawei, Xiaomi, DeepSeek, Baidu, Alibaba AI
- Tecnología espacial: SpaceX, Blue Origin, servidores en órbita
- Software empresarial: Microsoft Copilot, Salesforce AI, SAP, ServiceNow
- Ciberseguridad: brechas importantes, regulación UE, nuevas amenazas
- Startups: anuncios interesantes de startups de IA o tecnología

REGLAS CRÍTICAS:
1. Prefiere artículos publicados el ${THREE_DAYS_AGO} o después
2. Elige artículos de áreas temáticas DIFERENTES cuando sea posible
3. Nunca elijas 2 artículos sobre la misma empresa salvo que sea inevitable
4. NO uses vídeos de YouTube — solo artículos escritos
5. Usa la fecha real de publicación
6. Cada campo "date" debe usar exactamente este formato: 27 April 2026
7. Devuelve SOLO JSON válido
8. Si no encuentras artículos recientes válidos, devuelve:
{"no_updates":true,"articles":[]}
9. Nunca escribas explicaciones fuera del JSON
10. Empieza con {

Tu respuesta completa debe ser JSON válido y nada más:

{
  "articles": [
    {
      "id": "slug-1",
      "date": "27 April 2026",
      "headline": "titular aquí",
      "summary": "Resumen de 2-3 frases.",
      "source": "Nombre fuente",
      "sourceUrl": "https://url",
      "imageUrl": "",
      "category": "Adopción de IA"
    }
  ]
}

Categorías permitidas:
"Adopción de IA", "Estrategia", "Investigación", "Regulación", "Automatización"`;

function readExistingNews(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeHeadline(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeArticles(articles) {
  const seenUrls = new Set();
  const seenHeadlines = new Set();
  const result = [];

  for (const article of articles) {
    const url = (article.sourceUrl || '').trim();
    const headline = normalizeHeadline(article.headline);

    if (url && seenUrls.has(url)) {
      continue;
    }
    if (headline && seenHeadlines.has(headline)) {
      continue;
    }

    if (url) {
      seenUrls.add(url);
    }
    if (headline) {
      seenHeadlines.add(headline);
    }

    result.push(article);
  }

  return result;
}

function isWithinLastSevenDays(dateString) {
  const parsed = parseFlexibleDate(dateString);
  if (!parsed) {
    return false;
  }
  return parsed >= SEVEN_DAYS_AGO;
}

function sanitizeArticles(rawArticles) {
  if (!Array.isArray(rawArticles)) {
    return [];
  }

  return rawArticles
    .map((article, index) => {
      const parsedDate = parseFlexibleDate(article.date);

      if (!parsedDate) {
        return null;
      }

      const universalDate = formatUniversalDate(parsedDate);

      return {
        id: article.id || `${LANG}-news-${index + 1}`,
        date: universalDate,
        headline: (article.headline || '').trim(),
        summary: (article.summary || '').trim(),
        source: (article.source || '').trim(),
        sourceUrl: (article.sourceUrl || '').trim(),
        imageUrl: (article.imageUrl || '').trim(),
        category: (article.category || '').trim(),
      };
    })
    .filter(Boolean)
    .filter((article) =>
      article.headline &&
      article.summary &&
      article.source &&
      article.sourceUrl &&
      article.sourceUrl.startsWith('http') &&
      !article.sourceUrl.includes('youtube.com') &&
      !article.sourceUrl.includes('youtu.be')
    );
}

async function fetchNewsFromModel() {
  const label = IS_SPANISH ? 'Spanish' : 'English';
  const prompt = IS_SPANISH ? PROMPT_ES : PROMPT_EN;

  console.log(`Fetching ${label} news for ${TODAY_ISO}...`);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://www.stragta.com',
      'X-Title': `Stragta News Agent (${LANG})`,
    },
    body: JSON.stringify({
      model: 'perplexity/sonar',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const cleaned = content.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    try {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error('No JSON object found');
      }
      parsed = JSON.parse(match[0]);
    } catch {
      console.warn(`Model response was not valid JSON. Keeping existing file.\n${cleaned.slice(0, 500)}`);
      return { no_updates: true, articles: [] };
    }
  }

  if (parsed?.no_updates === true) {
    return { no_updates: true, articles: [] };
  }

  return {
    no_updates: false,
    articles: sanitizeArticles(parsed.articles || []),
  };
}

async function scrapeOgImage(url) {
  if (!url || url.includes('youtube.com') || url.includes('youtu.be')) {
    return '';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Stragta-NewsBot/1.0)',
        Accept: 'text/html',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return '';
    }

    const html = await res.text();

    const og = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    );
    const twitter = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    );
    const found = og?.[1] || twitter?.[1] || '';

    if (!found.startsWith('https://')) {
      return '';
    }

    if (
      found.includes('logo') ||
      found.includes('favicon') ||
      found.includes('icon')
    ) {
      return '';
    }

    return found;
  } catch {
    return '';
  }
}

async function enrichWithImages(articles) {
  if (!articles.length) {
    return [];
  }

  console.log('Fetching article images...');

  const results = await Promise.all(
    articles.map(async (article) => {
      if (article.imageUrl) {
        return article;
      }

      const imageUrl = await scrapeOgImage(article.sourceUrl);

      if (imageUrl) {
        console.log(`  Got image for: ${article.headline.slice(0, 50)}...`);
      } else {
        console.log(`  No image for:  ${article.headline.slice(0, 50)}...`);
      }

      return { ...article, imageUrl };
    })
  );

  return results;
}

function mergeWithExisting(existingArticles, freshArticles) {
  const safeExisting = Array.isArray(existingArticles) ? existingArticles : [];

  const cleanedExisting = safeExisting
    .map((article, index) => ({
      id: article.id || `${LANG}-existing-${index + 1}`,
      date: formatUniversalDate(article.date) || formatUniversalDate(new Date()),
      headline: (article.headline || '').trim(),
      summary: (article.summary || '').trim(),
      source: (article.source || '').trim(),
      sourceUrl: (article.sourceUrl || '').trim(),
      imageUrl: (article.imageUrl || '').trim(),
      category: (article.category || '').trim(),
    }))
    .filter((article) => article.headline && article.summary && article.source && article.sourceUrl)
    .filter((article) => isWithinLastSevenDays(article.date));

  const cleanedFresh = freshArticles.filter((article) => isWithinLastSevenDays(article.date));

  const combined = [...cleanedFresh, ...cleanedExisting].sort((a, b) => {
    const dateA = parseFlexibleDate(a.date) || new Date(0);
    const dateB = parseFlexibleDate(b.date) || new Date(0);
    return dateB - dateA;
  });

  return dedupeArticles(combined).slice(0, 3);
}

async function run() {
  try {
    const existingData = readExistingNews(OUTPUT_FILE);
    const existingArticles = existingData?.articles || [];

    const fetched = await fetchNewsFromModel();

    if (fetched.no_updates || !fetched.articles.length) {
      console.warn(`No valid fresh ${LANG} articles found. Keeping existing ${path.basename(OUTPUT_FILE)}.`);

      if (existingArticles.length > 0) {
        process.exit(0);
      }

      console.warn(`No previous ${path.basename(OUTPUT_FILE)} exists or it is empty. Writing a safe fallback file.`);

      const fallback = {
        lang: LANG,
        lastUpdated: new Date().toISOString(),
        articles: [],
      };

      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallback, null, 2), 'utf8');
      process.exit(0);
    }

    const enriched = await enrichWithImages(fetched.articles);
    const merged = mergeWithExisting(existingArticles, enriched);

    if (!merged.length && existingArticles.length > 0) {
      console.warn(`Merge produced no valid articles. Keeping existing ${path.basename(OUTPUT_FILE)}.`);
      process.exit(0);
    }

    if (!merged.length) {
      console.warn(`No merged articles available. Writing current fresh articles as fallback.`);
    }

    const finalArticles = merged.length ? merged : enriched.slice(0, 3);

    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(
        {
          lang: LANG,
          lastUpdated: new Date().toISOString(),
          articles: finalArticles,
        },
        null,
        2
      ),
      'utf8'
    );

    const existingUrls = new Set(existingArticles.map((a) => (a.sourceUrl || '').trim()));
    const existingHeadlines = new Set(existingArticles.map((a) => normalizeHeadline(a.headline)));

    const newOnes = finalArticles.filter((a) => {
      const url = (a.sourceUrl || '').trim();
      const headline = normalizeHeadline(a.headline);
      return !existingUrls.has(url) && !existingHeadlines.has(headline);
    });

    console.log(`Done. ${path.basename(OUTPUT_FILE)} now contains ${finalArticles.length} articles.`);
    console.log(`New unique articles added: ${newOnes.length}`);
    newOnes.forEach((a) => console.log(`  [${a.category}] ${a.headline}`));

    process.exit(0);
  } catch (err) {
    console.error('News agent failed:', err.message);
    process.exit(1);
  }
}

run();