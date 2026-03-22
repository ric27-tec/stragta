/* ============================================================
   assets/js/news.js

   Loads news articles from /news.json (English) or
   /news-es.json (Spanish) depending on a data-lang attribute
   on the script tag, or the html lang attribute.

   English page: loads /news.json
   Spanish page: loads /news-es.json

   To use on the Spanish page, either:
   A) Add data-lang="es" to the script tag in es/index.html:
      <script src="../assets/js/news.js" data-lang="es"></script>
   B) Or the script auto-detects from <html lang="es">
   ============================================================ */

const CATEGORY_ART = {
  // English categories
  'AI Adoption': `<svg viewBox="0 0 400 168" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="168" fill="#0a1628"/><circle cx="200" cy="84" r="50" fill="none" stroke="rgba(59,130,246,.2)" stroke-width="1"/><circle cx="200" cy="84" r="30" fill="none" stroke="rgba(59,130,246,.28)" stroke-width="1"/><circle cx="200" cy="84" r="10" fill="rgba(59,130,246,.15)" stroke="rgba(59,130,246,.5)" stroke-width="1"/>${[0,60,120,180,240,300].map(a=>{const x=(200+50*Math.cos(a*Math.PI/180)).toFixed(1),y=(84+50*Math.sin(a*Math.PI/180)).toFixed(1);return`<circle cx="${x}" cy="${y}" r="4" fill="rgba(59,130,246,.75)"/><line x1="${x}" y1="${y}" x2="200" y2="84" stroke="rgba(59,130,246,.15)" stroke-width=".7"/>`;}).join('')}<rect x="0" y="114" width="400" height="54" fill="url(#ga)"/><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a1628" stop-opacity="0"/><stop offset="100%" stop-color="#0a1628"/></linearGradient></defs></svg>`,
  'Strategy': `<svg viewBox="0 0 400 168" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="168" fill="#160f00"/>${[0,1,2,3,4].map(i=>`<polygon points="200,${12+i*26} ${355-i*28},152 ${45+i*28},152" fill="${i===4?'rgba(234,179,8,.06)':'none'}" stroke="rgba(234,179,8,${.09+i*.08})" stroke-width=".9"/>`).join('')}<circle cx="200" cy="12" r="3" fill="rgba(234,179,8,.8)"/><rect x="0" y="114" width="400" height="54" fill="url(#gb)"/><defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#160f00" stop-opacity="0"/><stop offset="100%" stop-color="#160f00"/></linearGradient></defs></svg>`,
  'Research': `<svg viewBox="0 0 400 168" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="168" fill="#120a22"/><rect x="0" y="112" width="400" height="56" fill="url(#gc)"/><defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#120a22" stop-opacity="0"/><stop offset="100%" stop-color="#120a22"/></linearGradient></defs></svg>`,
  'Regulation': `<svg viewBox="0 0 400 168" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="168" fill="#0a100b"/><rect x="68" y="28" width="264" height="112" fill="none" stroke="rgba(34,197,94,.28)" stroke-width="1"/><line x1="96" y1="84" x2="200" y2="84" stroke="rgba(34,197,94,.55)" stroke-width="1.4"/><line x1="96" y1="72" x2="162" y2="72" stroke="rgba(34,197,94,.28)" stroke-width=".9"/><line x1="96" y1="96" x2="178" y2="96" stroke="rgba(34,197,94,.28)" stroke-width=".9"/><rect x="0" y="114" width="400" height="54" fill="url(#gd)"/><defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a100b" stop-opacity="0"/><stop offset="100%" stop-color="#0a100b"/></linearGradient></defs></svg>`,
  'Automation': `<svg viewBox="0 0 400 168" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="168" fill="#001515"/><path d="M 10,84 C 55,34 100,134 145,84 C 190,34 235,134 280,84 C 325,34 370,134 390,84" fill="none" stroke="rgba(20,184,166,.42)" stroke-width="1.5"/><circle cx="145" cy="84" r="4" fill="rgba(20,184,166,.82)"/><circle cx="280" cy="84" r="4" fill="rgba(20,184,166,.82)"/><rect x="0" y="114" width="400" height="54" fill="url(#ge)"/><defs><linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#001515" stop-opacity="0"/><stop offset="100%" stop-color="#001515"/></linearGradient></defs></svg>`,
  // Spanish category aliases (same art, different keys)
  'Adopción de IA': null,  // set after definition
  'Estrategia':     null,
  'Investigación':  null,
  'Regulación':     null,
  'Automatización': null,
  'default': `<svg viewBox="0 0 400 168" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="168" fill="#0f0f0d"/></svg>`,
};

// Point Spanish categories to the same SVGs
CATEGORY_ART['Adopción de IA'] = CATEGORY_ART['AI Adoption'];
CATEGORY_ART['Estrategia']     = CATEGORY_ART['Strategy'];
CATEGORY_ART['Investigación']  = CATEGORY_ART['Research'];
CATEGORY_ART['Regulación']     = CATEGORY_ART['Regulation'];
CATEGORY_ART['Automatización'] = CATEGORY_ART['Automation'];

// Demo articles — shown when no JSON file exists yet
const DEMO = {
  en: [
    { id:'demo-1', date:'2026-03-21', headline:'McKinsey: 72% of enterprises now use AI in at least one business function', summary:'The latest McKinsey Global Survey reveals accelerating AI adoption, with generative AI leading in marketing, software development, and operations. Successful implementations remain concentrated among a guided minority.', source:'McKinsey Global Institute', sourceUrl:'https://mckinsey.com', imageUrl:'', category:'AI Adoption' },
    { id:'demo-2', date:'2026-03-20', headline:'EU AI Act enforcement: what business leaders need to do now', summary:'With the EU AI Act entering its compliance phase, enterprises face new obligations around documentation, human oversight, and staff training before year-end deadlines.', source:'European Commission', sourceUrl:'https://ec.europa.eu', imageUrl:'', category:'Regulation' },
    { id:'demo-3', date:'2026-03-19', headline:'Why enterprise AI implementations fail at year two', summary:'A Stanford study tracking 180 enterprise AI deployments found companies bypassing structured guidance saw a 3.2x higher failure rate, driven by change management gaps rather than technical problems.', source:'Stanford HAI', sourceUrl:'https://hai.stanford.edu', imageUrl:'', category:'Research' },
  ],
  es: [
    { id:'demo-es-1', date:'2026-03-21', headline:'El 72% de las empresas ya usa inteligencia artificial en al menos una función de negocio', summary:'La última encuesta global de McKinsey revela una aceleración en la adopción de IA, con la IA generativa liderando en marketing, desarrollo de software y operaciones. Las implementaciones exitosas siguen concentradas entre una minoría con guía especializada.', source:'McKinsey Global Institute', sourceUrl:'https://mckinsey.com', imageUrl:'', category:'Adopción de IA' },
    { id:'demo-es-2', date:'2026-03-20', headline:'Reglamento de IA de la UE en fase de cumplimiento: lo que los directivos necesitan hacer ahora', summary:'Con el Reglamento de IA de la UE en vigor, las empresas europeas deben cumplir nuevas obligaciones de documentación, supervisión humana y formación del personal antes de fin de año.', source:'Comisión Europea', sourceUrl:'https://ec.europa.eu', imageUrl:'', category:'Regulación' },
    { id:'demo-es-3', date:'2026-03-19', headline:'Por qué fracasan las implementaciones de IA empresarial en el segundo año', summary:'Un estudio de Stanford que rastreó 180 implementaciones de IA empresarial encontró que las empresas que prescindieron de orientación estructurada tuvieron una tasa de fracaso 3,2 veces mayor, impulsada por brechas en la gestión del cambio.', source:'Stanford HAI', sourceUrl:'https://hai.stanford.edu', imageUrl:'', category:'Investigación' },
  ],
};

// ── LANGUAGE DETECTION ────────────────────────────────────────
function detectLang() {
  // 1. data-lang on this script tag
  const script = document.currentScript
    || document.querySelector('script[src*="news.js"]');
  if (script && script.dataset.lang) return script.dataset.lang;

  // 2. <html lang="...">
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.startsWith('es')) return 'es';

  return 'en';
}

// ── DATE FORMATTING ───────────────────────────────────────────
function formatDate(str, lang) {
  try {
    const locale = lang === 'es' ? 'es-ES' : 'en-GB';
    return new Date(str).toLocaleDateString(locale, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return str; }
}

// ── RENDER ────────────────────────────────────────────────────
function renderCard(article, lang) {
  const svgArt = (CATEGORY_ART[article.category] || CATEGORY_ART['default'])
    .replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const art = article.imageUrl
    ? `<img src="${article.imageUrl}" alt=""
         style="width:100%;height:168px;object-fit:cover;display:block"
         loading="lazy"
         onerror="this.parentNode.innerHTML='${(CATEGORY_ART[article.category] || CATEGORY_ART['default']).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}'"
       />`
    : (CATEGORY_ART[article.category] || CATEGORY_ART['default']);

  const readLabel = lang === 'es' ? 'Leer fuente' : 'Read source';

  return `
    <article class="news-card"
      onclick="if(event.target.tagName!=='A') window.open('${article.sourceUrl}','_blank','noopener')">
      <div class="news-art">${art}</div>
      <div class="news-body">
        <div class="news-meta">
          <span class="news-cat">${article.category || 'Insights'}</span>
          <span class="news-date">${formatDate(article.date, lang)}</span>
        </div>
        <h3 class="news-headline">${article.headline}</h3>
        <p class="news-summary">${article.summary}</p>
      </div>
      <div class="news-footer">
        <span class="news-source">${article.source}</span>
        <a href="${article.sourceUrl}" target="_blank" rel="noopener"
           class="news-link" onclick="event.stopPropagation()">${readLabel} ↗</a>
      </div>
    </article>`;
}

// ── LOAD ──────────────────────────────────────────────────────
async function loadNews() {
  const lang   = detectLang();
  const grid   = document.getElementById('news-grid');
  const updEl  = document.getElementById('news-updated');
  const file   = lang === 'es' ? '/news-es.json' : '/news.json';

  let articles = [];

  try {
    const res = await fetch(file, { cache: 'no-cache' });
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    articles = data.articles || [];
    if (data.lastUpdated) {
      const locale = lang === 'es' ? 'es-ES' : 'en-GB';
      const label  = lang === 'es' ? 'Actualizado' : 'Updated';
      updEl.textContent = label + ': ' + new Date(data.lastUpdated)
        .toLocaleDateString(locale, { day: 'numeric', month: 'long' });
    }
  } catch {
    articles = DEMO[lang] || DEMO.en;
    updEl.textContent = lang === 'es'
      ? 'Contenido de ejemplo. Conecta el agente para actualizaciones diarias.'
      : 'Demo content. Connect the news agent for daily updates.';
  }

  if (!articles.length) {
    grid.innerHTML = `<div class="news-loading">${lang === 'es' ? 'Sin artículos por ahora.' : 'No articles yet.'}</div>`;
    return;
  }

  grid.innerHTML = articles.slice(0, 6).map(a => renderCard(a, lang)).join('');
}

loadNews();
