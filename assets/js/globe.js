/* ============================================================
   globe.js — Tech Growth Outlook 2026-2030
   Choropleth: countries filled by projected technological growth.

   SOURCES (all 2024-2026, publicly verifiable):
     PwC AI Impact Report 2024
     McKinsey Global Institute: AI Readiness + EU Sovereign AI (Dec 2025)
     Stanford HAI Global AI Index 2024
     WEF Future of Jobs Report 2025
     Goldman Sachs Semiconductor Forecast 2025
     EU AI Continent Action Plan, April 2025
     EuroHPC AI Factory selections: Dec 2024, Mar 2025, Oct 2025 (19 EU sites)
     EU Inc / 28th Regime, adopted March 18 2026
     Japan AI Promotion Act 2025, ¥10T pledge by 2030
     Russia National AI Strategy 2030 + Washington Quarterly analysis (2024)
     UAE/Saudi Nvidia chip agreements 2025

   TIER LOGIC (projected growth to 2030):
     1 — Exceptional: massive state + private commitment, structural advantage
     2 — Strong: significant investment, real infrastructure, clear 2030 roadmap
     3 — Moderate: policy framework + growing investment, catching up
     4 — Emerging: early but visible trajectory, nascent ecosystem

   Keys are ISO 3166-1 numeric codes matching world-atlas topojson.
   ============================================================ */

const GROWTH_TIERS = {

  // ── TIER 1: EXCEPTIONAL ─────────────────────────────────────
  '156': 1,  // China       — state AI + quantum + chip self-sufficiency drive
  '840': 1,  // USA         — $500B+ Stargate, OpenAI/Google/Meta; 61% global AI VC
  '356': 1,  // India       — fastest growing AI economy, National AI Mission, 1.4B scale
  '784': 1,  // UAE         — $100B sovereign AI fund, massive Nvidia chip access (2025)
  '682': 1,  // Saudi Arabia — Vision 2030, NEOM, $100B+ tech, Nvidia chip deals
  '392': 1,  // Japan       — ¥10T semiconductor + AI pledge by 2030; Rapidus 2nm (2027);
             //               TSMC Kumamoto; spends more on chips per GDP than USA

  // ── TIER 2: STRONG ──────────────────────────────────────────
  '410': 2,  // South Korea — Samsung + SK Hynix: HBM memory powering all global AI chips
  '158': 2,  // Taiwan      — TSMC 90%+ share at 3nm/2nm; indispensable to AI supply chain
  '276': 2,  // Germany     — 2x EuroHPC AI Factory selections; industrial AI leader
  '250': 2,  // France      — Mistral AI (EU frontier model); AI Factory; €10B tech fund
  '826': 2,  // UK          — AI Safety Institute; frontier lab concentration; strong VC
  '702': 2,  // Singapore   — SE Asia AI hub; national AI strategy; Nvidia infrastructure deal
  '376': 2,  // Israel      — highest unicorn density per capita outside US/China; deep tech
  '752': 2,  // Sweden      — EuroHPC AI Factory; Ericsson; strong EU AI participation
  '528': 2,  // Netherlands — ASML: world's only maker of EUV chip machines; AI Factory
  '360': 2,  // Indonesia   — 270M population; fastest digital economy growth in SE Asia
  '076': 2,  // Brazil      — largest LatAm AI market; Nubank + MercadoLibre frontier use
  '704': 2,  // Vietnam     — rapid manufacturing + tech shift; Samsung base; FDI surge
  '458': 2,  // Malaysia    — Penang semiconductor corridor; Intel + Infineon expansions
  '634': 2,  // Qatar       — national AI strategy; sovereign wealth fund; Doha AI hub
  '124': 2,  // Canada      — Vector Institute; Cohere; Mila; government AI investment
  '036': 2,  // Australia   — National AI Centre; quantum roadmap; US alliance chip access
  '643': 2,  // Russia      — strong STEM + Yandex/Sber frontier models; ₽65.2B federal
             //               AI project to 2030. CONSTRAINED by semiconductor sanctions
             //               and post-2022 brain drain. "Catch-up" paradigm (WQ 2024).

  // ── TIER 3: MODERATE ────────────────────────────────────────
  // EU AI Factory countries — actual compute infrastructure built 2024-2025

  '724': 3,  // Spain       — 2x AI Factory selections (Dec 2024 + Oct 2025)
             //               Barcelona Supercomputing Centre (MareNostrum)
             //               Stragta HQ. EU AI Continent Action Plan participant.
  '380': 3,  // Italy       — AI Factory (Cineca); €6.7B PNRR digital investment
  '616': 3,  // Poland      — 2x AI Factory + Antenna; largest Eastern EU tech workforce
  '246': 3,  // Finland     — AI Factory (LUMI supercomputer); top EU digital rankings
  '040': 3,  // Austria     — AI Factory selected March 2025; strong Vienna tech scene
  '100': 3,  // Bulgaria    — AI Factory selected; low-cost EU tech hub
  '300': 3,  // Greece      — AI Factory (ARIS); EU digital recovery funds
  '442': 3,  // Luxembourg  — AI Factory + EuroHPC headquarters + EU institutions
  '203': 3,  // Czech Republic — AI Factory Oct 2025; Central EU manufacturing + tech
  '440': 3,  // Lithuania   — AI Factory Oct 2025; Baltic tech hub
  '705': 3,  // Slovenia    — AI Factory March 2025; growing EU tech cluster
  '642': 3,  // Romania     — AI Factory Oct 2025; large IT talent pool

  // EU AI Factory Antenna countries
  '056': 3,  // Belgium     — AI Factory Antenna; IMEC chip research (world-leading)
  '196': 3,  // Cyprus      — AI Factory Antenna
  '348': 3,  // Hungary     — AI Factory Antenna; Central EU manufacturing
  '372': 3,  // Ireland     — AI Factory Antenna; EU hyperscaler hub (Google/Meta/AWS)
  '428': 3,  // Latvia      — AI Factory Antenna; Baltic digital economy
  '470': 3,  // Malta       — AI Factory Antenna
  '703': 3,  // Slovakia    — AI Factory Antenna; growing Central EU tech base
  '756': 3,  // Switzerland — AI Factory Antenna; CERN quantum; ETH Zurich; biotech AI

  // Other strong Tier 3
  '208': 3,  // Denmark     — Maersk AI; life sciences AI; digital infrastructure leader
  '578': 3,  // Norway      — $1.7T sovereign wealth fund beginning AI deployment
  '620': 3,  // Portugal    — Web Summit base; growing startup scene; EU digital funds
  '484': 3,  // Mexico      — nearshoring boom; 130M population digital surge
  '170': 3,  // Colombia    — fastest growing LatAm startup ecosystem; Medellin tech hub
  '032': 3,  // Argentina   — strong AI talent; MercadoLibre most AI-native in LatAm
  '152': 3,  // Chile       — most advanced digital infrastructure in LatAm
  '608': 3,  // Philippines — BPO-to-AI transition; 110M population digital shift
  '764': 3,  // Thailand    — SE Asian semiconductor assembly; national digital economy push
  '818': 3,  // Egypt       — Africa's 2nd largest economy; Nile tech corridor; EU proximity
  '504': 3,  // Morocco     — Atlantic AI hub; Casablanca Finance City; EU bilateral deals
  '404': 3,  // Kenya       — M-Pesa legacy; Nairobi Silicon Savannah; Africa's #1 startup hub
  '710': 3,  // South Africa — most developed African tech market; Joburg VC ecosystem
  '792': 3,  // Turkey      — fast growing tech sector; Baykar drone AI; EU customs union
  '818': 3,  // Egypt       — already listed above

  // ── TIER 4: EMERGING ────────────────────────────────────────
  '050': 4,  // Bangladesh  — 170M population; garment-to-tech transition underway
  '566': 4,  // Nigeria     — Africa's largest economy; fintech AI (Flutterwave, Paystack)
  '288': 4,  // Ghana       — West Africa's stable tech hub; Accra startup scene
  '800': 4,  // Uganda      — East Africa fintech growth; mobile money adoption
  '012': 4,  // Algeria     — hydrocarbon-funded diversification push
  '586': 4,  // Pakistan    — 240M population; large developer pool; fintech growth
  '144': 4,  // Sri Lanka   — IT services growth; talent pool; recovery trajectory
  '116': 4,  // Cambodia    — digital economy early push
  '604': 4,  // Peru        — Lima tech scene; fintech adoption
  '214': 4,  // Dominican Republic — Caribbean tech hub potential
  '788': 4,  // Tunisia     — North Africa tech talent; growing startup ecosystem
  '231': 4,  // Ethiopia    — Addis tech hub emerging; large young population
  '072': 4,  // Botswana    — stable digital economy; AI governance leadership in Africa
  '068': 4,  // Bolivia     — early digital adoption
  '524': 4,  // Nepal       — IT services export growth
  '418': 4,  // Laos        — digital economy early push
  '064': 4,  // Bhutan      — digital governance experiment
};

// Visual styles per tier
const TIER_FILL = {
  1: 'rgba(184,240,32,.82)',
  2: 'rgba(184,240,32,.48)',
  3: 'rgba(184,240,32,.22)',
  4: 'rgba(184,240,32,.09)',
};
const TIER_STROKE = {
  1: 'rgba(184,240,32,.65)',
  2: 'rgba(184,240,32,.38)',
  3: 'rgba(184,240,32,.18)',
  4: 'rgba(184,240,32,.08)',
};
const NO_DATA_FILL   = 'rgba(242,240,234,.045)';
const NO_DATA_STROKE = 'rgba(242,240,234,.08)';

const HQ_COORDS  = [-3.7, 40.4]; // Madrid
let   hqPulse    = Math.random() * Math.PI * 2;

async function initGlobe() {
  const canvas  = document.getElementById('globe-canvas');
  const loading = document.getElementById('globe-loading');
  const section = document.getElementById('map-section');
  if (!canvas) return;

  const dpr = window.devicePixelRatio || 1;
  const W   = section.offsetWidth;
  const H   = Math.min(W * 0.68, 620);
  const R   = Math.min(W, H) / 2 - 50;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  let rot  = [-8, -30, 0];
  const proj   = d3.geoOrthographic().scale(R).translate([W/2, H/2]).rotate(rot).clipAngle(90);
  const path   = d3.geoPath().projection(proj).context(ctx);
  const grat   = d3.geoGraticule().step([30, 30])();
  const sphere = { type: 'Sphere' };

  let features, borders;
  try {
    const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    features = topojson.feature(world, world.objects.countries).features;
    borders  = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
    features.forEach(f => { f._tier = GROWTH_TIERS[String(f.id)] || 0; });
    loading.style.display = 'none';
    canvas.style.display  = 'block';
  } catch (e) {
    loading.textContent = 'Globe unavailable offline.';
    return;
  }

  function vis(lon, lat) {
    const r  = proj.rotate();
    const l0 = -r[0]*Math.PI/180, p0 = -r[1]*Math.PI/180;
    const l  =  lon*Math.PI/180,  p  =  lat*Math.PI/180;
    return Math.sin(p0)*Math.sin(p) + Math.cos(p0)*Math.cos(p)*Math.cos(l-l0) >= 0.04;
  }

  let lastT = 0;
  function frame(t) {
    const dt = t - lastT; lastT = t;
    rot[0] += dt * 0.003;
    proj.rotate(rot);
    ctx.clearRect(0, 0, W, H);

    // Atmosphere
    const atmo = ctx.createRadialGradient(W/2,H/2,R*.9, W/2,H/2,R*1.12);
    atmo.addColorStop(0,'rgba(184,240,32,.016)'); atmo.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.arc(W/2,H/2,R*1.12,0,Math.PI*2); ctx.fillStyle=atmo; ctx.fill();

    // Ocean
    ctx.beginPath(); path(sphere); ctx.fillStyle='rgba(242,240,234,.016)'; ctx.fill();

    // Graticule
    ctx.beginPath(); path(grat); ctx.strokeStyle='rgba(242,240,234,.036)'; ctx.lineWidth=.4; ctx.stroke();

    // Countries
    features.forEach(f => {
      ctx.beginPath(); path(f);
      ctx.fillStyle   = f._tier ? TIER_FILL[f._tier]  : NO_DATA_FILL;
      ctx.strokeStyle = f._tier ? TIER_STROKE[f._tier] : NO_DATA_STROKE;
      ctx.lineWidth   = .4; ctx.fill(); ctx.stroke();
    });

    // Sphere outline
    ctx.beginPath(); path(sphere); ctx.strokeStyle='rgba(242,240,234,.09)'; ctx.lineWidth=.8; ctx.stroke();

    // Madrid HQ diamond
    if (vis(HQ_COORDS[0], HQ_COORDS[1])) {
      const p = proj(HQ_COORDS); if (!p) { requestAnimationFrame(frame); return; }
      const [cx, cy] = p;
      const pt = (((t*.001) + hqPulse) % 3.2) / 3.2;
      ctx.beginPath(); ctx.arc(cx,cy, 3+pt*18, 0,Math.PI*2);
      ctx.strokeStyle=`rgba(184,240,32,${(1-pt)*.9})`; ctx.lineWidth=1.2; ctx.stroke();
      const s=6;
      ctx.beginPath(); ctx.moveTo(cx,cy-s); ctx.lineTo(cx+s,cy); ctx.lineTo(cx,cy+s); ctx.lineTo(cx-s,cy); ctx.closePath();
      ctx.fillStyle='#B8F020'; ctx.fill();
      ctx.fillStyle='rgba(184,240,32,.9)'; ctx.font='700 8.5px "Manrope",sans-serif';
      ctx.textAlign = cx>W*.76 ? 'right' : 'left';
      ctx.fillText('Stragta HQ', ctx.textAlign==='right' ? cx-10 : cx+10, cy+3.5);
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Drag (mouse)
  let drag=false, last=null;
  canvas.addEventListener('mousedown', e=>{ drag=true; last=[e.clientX,e.clientY]; });
  window.addEventListener('mouseup', ()=>drag=false);
  window.addEventListener('mousemove', e=>{
    if(!drag||!last)return;
    rot[0]+=(e.clientX-last[0])*.28; rot[1]-=(e.clientY-last[1])*.28;
    rot[1]=Math.max(-80,Math.min(80,rot[1])); last=[e.clientX,e.clientY];
  });
  // Drag (touch)
  canvas.addEventListener('touchstart', e=>{ drag=true; last=[e.touches[0].clientX,e.touches[0].clientY]; },{passive:true});
  window.addEventListener('touchend', ()=>drag=false);
  window.addEventListener('touchmove', e=>{
    if(!drag||!last)return;
    rot[0]+=(e.touches[0].clientX-last[0])*.28; rot[1]-=(e.touches[0].clientY-last[1])*.28;
    rot[1]=Math.max(-80,Math.min(80,rot[1])); last=[e.touches[0].clientX,e.touches[0].clientY];
  },{passive:true});
}

initGlobe();
