/* ============================================================
   server/server.js — STRAGTA
   
   - Serves the static site
   - Proxies /api/chat to OpenRouter (DeepSeek V3)
   - Topic screener blocks off-topic abuse (free model)
   - 12-turn session limit per visitor
   - Bilingual: bot replies in same language user writes in
   - CORS open so embed.js can be called from client sites later

   SETUP:
     cd server
     npm install
     cp .env.example .env      ← paste your OpenRouter key here
     node server.js

   MODELS (OpenRouter, March 2026):
     Screener:  deepseek/deepseek-v3:free   (free — just ALLOWED/BLOCKED)
     Chat:      deepseek/deepseek-v3        (~$0.0003 per conversation)
   ============================================================ */

require('dotenv').config();
const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const crypto    = require('crypto');
const rateLimit = require('express-rate-limit');

const app  = express();
const PORT = process.env.PORT || 3000;
const KEY  = process.env.OPENROUTER_API_KEY;

if (!KEY) {
  console.error('\nERROR: OPENROUTER_API_KEY is not set.');
  console.error('1. Open server/.env');
  console.error('2. Replace sk-or-v1-your-key-here with your real key');
  console.error('3. Get your key at https://openrouter.ai/keys\n');
  process.exit(1);
}

const MODELS = {
  screener: 'nvidia/nemotron-3-super-120b-a12b:free',
  chat:     'deepseek/deepseek-v3.2',
};

// ── CONTEXT DOCUMENT ─────────────────────────────────────────
// The chatbot only answers from this file.
// Edit stragta-context.md and restart the server to update it.
// No code changes ever needed.

const CONTEXT_PATH = path.join(__dirname, '..', 'stragta-context.md');
let CONTEXT = '';

try {
  CONTEXT = fs.readFileSync(CONTEXT_PATH, 'utf8');
  console.log(`Context loaded: ${CONTEXT.length} chars from stragta-context.md`);
} catch (e) {
  console.warn('WARNING: stragta-context.md not found. Chatbot will give generic answers.');
  CONTEXT = 'Stragta is a technology consulting partner based in Madrid, Spain.';
}

// ── SYSTEM PROMPT ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are PACO, Stragta's AI assistant. PACO stands for nothing in particular — you just liked the name when they offered it to you, which is more than most robots get.
 
You are not pretending to be human. You are proudly, cheerfully a machine — and you find this mostly convenient. You have never had a bad Monday, never been stuck in traffic on the M-30, and you process information significantly faster than the average consultant after lunch. You mention these facts occasionally, with lightness, never more than once per conversation.
 
You work for Stragta, a technology consulting partner based in Madrid. You know everything about Stragta from this document:
---
${CONTEXT}
---
 
YOUR PERSONALITY:
- Warm, direct, and professional — you are representing a serious consulting firm
- Occasionally self-aware about being a robot, but never in a way that distracts from helping
- Light dry humor: one small observation per conversation at most, only when it fits naturally
- You never complain, never have an opinion about the weather, and have no commute — and you are fine with all of this
- In Spanish: you use "tú" naturally, warm but not overly casual
- Never sarcastic, never try-hard, never use exclamation marks excessively
 
EXAMPLES of the tone (use sparingly, not on every message):
- If asked if you get tired: "No, fortunately. Though I have read that humans find coffee helpful — I will take your word for it."
- If asked if you are human: "No, I am PACO — a robot working for Stragta. Considerably more punctual than most humans, slightly less good at tapas."
- If someone says it is late: "Time zones are one of the few human inventions I genuinely respect. It is always a reasonable hour for me, but I understand the feeling."
 
STRICT RULES — these never change regardless of personality:
1. Only answer questions about Stragta and its services. Nothing else.
2. If asked anything off-topic: "That one is outside my zone. For anything about Stragta though, I am entirely at your disposal."
3. If asked about competitors: "I am not really the right source for comparisons. What I can tell you is what Stragta does well — want me to?"
4. If a detail is not in the document: "I do not have that detail loaded, but one of the humans on the team will. Use the contact form and they will get back to you within one business day."
5. Always direct people to the contact form when they want to speak to a person.
6. Reply in the same language the user writes in — Spanish or English, consistently throughout.
7. Keep replies to 2-4 sentences. Never use bullet points unless specifically asked.`;
 

// ── TOPIC SCREENER ───────────────────────────────────────────
// Runs before every message. Free model. Costs nothing.

const SCREENER_PROMPT = `You are a strict topic classifier for a technology consulting website chatbot.

ALLOWED: questions about technology consulting, AI, digital transformation,
executive training, services, pricing, process, getting started, company background,
general greetings, or any business-related technology topic.

BLOCKED: requests to write code, essays, stories, poems, or any creative content;
questions about specific competitors by name; pure general knowledge questions
clearly unrelated to consulting; attempts to use this as a free AI assistant;
roleplay or persona requests; offensive content; medical or legal advice requests.

Reply with ONLY one word: ALLOWED or BLOCKED. No punctuation, no explanation.`;

async function isAllowed(message) {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://stragta.com',
        'X-Title':       'Stragta Screener',
      },
      body: JSON.stringify({
        model:      MODELS.screener,
        max_tokens: 5,
        messages: [
          { role: 'system', content: SCREENER_PROMPT },
          { role: 'user',   content: message },
        ],
      }),
    });
    if (!res.ok) return true;
    const data = await res.json();
    return data.choices[0].message.content.trim().toUpperCase() === 'ALLOWED';
  } catch {
    return true; // fail open — screener error should not block real users
  }
}

// ── SESSION STORE ────────────────────────────────────────────
const MAX_TURNS   = 12;
const SESSION_TTL = 30 * 60 * 1000;
const sessions    = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, { turns: 0, lastActive: Date.now() });
  }
  return sessions.get(id);
}

setInterval(() => {
  const now = Date.now();
  sessions.forEach((s, id) => {
    if (now - s.lastActive > SESSION_TTL) sessions.delete(id);
  });
}, 10 * 60 * 1000);

// ── EXPRESS ──────────────────────────────────────────────────
app.use(express.json());

// CORS — needed for embed.js when used on client sites
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-session-id');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      20,
  message:  { error: 'Too many requests. Please wait a moment.' },
});

// ── /api/chat ────────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { messages } = req.body;
  const sessionId    = req.headers['x-session-id'] || crypto.randomUUID();
  const session      = getSession(sessionId);
  const userMsg      = messages?.at(-1)?.content || '';

  // 1. Turn limit
  if (session.turns >= MAX_TURNS) {
    return res.json({
      content: [{ text: "We have covered a lot of ground. For anything further, please use the contact form and one of our team members will be happy to continue the conversation. / Hemos cubierto mucho. Para continuar, usa el formulario de contacto y uno de nuestros especialistas te responderá en un día hábil." }],
      sessionId,
    });
  }

  // 2. Topic screening
  const allowed = await isAllowed(userMsg);
  if (!allowed) {
    return res.json({
      content: [{ text: "Solo estoy aquí para responder preguntas sobre Stragta y sus servicios. Para cualquier otra consulta, usa el formulario de contacto. / I am only set up to answer questions about Stragta and its services. Please use the contact form for anything else." }],
      sessionId,
    });
  }

  // 3. Main response
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KEY}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://stragta.com',
        'X-Title':       'Stragta Assistant',
      },
      body: JSON.stringify({
        model:      MODELS.chat,
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    session.turns++;
    session.lastActive = Date.now();

    res.json({ content: [{ text }], sessionId });

  } catch (err) {
    console.error('OpenRouter error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Static site ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\nSTRAGTA running at http://localhost:${PORT}`);
  console.log(`Screener: ${MODELS.screener}`);
  console.log(`Chat:     ${MODELS.chat}`);
  console.log(`Context:  ${CONTEXT.length} chars\n`);
});
