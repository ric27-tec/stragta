
const SESSION_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : Math.random().toString(36).slice(2);

let chatHistory = [];
let chatLoading = false;
let widgetOpen  = false;

// ── BUILD THE WIDGET DOM ──────────────────────────────────────
function buildWidget() {
  // Floating button
  const btn = document.createElement('button');
  btn.id = 'stragta-fab';
  btn.title = 'Chat with Paco, our virtual assistant';
  btn.innerHTML = `
    <svg id="fab-icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    <svg id="fab-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `;

  // Popup panel
  const panel = document.createElement('div');
  panel.id = 'stragta-panel';
  panel.innerHTML = `
    <div id="stragta-header">
      <div id="stragta-avatar">
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.4">
          <circle cx="6.5" cy="4.5" r="2.5"/>
          <path d="M1 12c0-3.038 2.462-5.5 5.5-5.5S12 8.962 12 12"/>
        </svg>
      </div>
      <div>
        <div id="stragta-hname">PACO</div>
        <div id="stragta-hstatus">Stragta's virtual assistant</div>
      </div>
      <div id="stragta-online"></div>
    </div>
    <div id="stragta-msgs"></div>
    <div id="stragta-chips">
      <span class="s-chip" onclick="sendChip(this)">What does Stragta do?</span>
      <span class="s-chip" onclick="sendChip(this)">How does an engagement work?</span>
      <span class="s-chip" onclick="sendChip(this)">Do you work remotely?</span>
      <span class="s-chip" onclick="sendChip(this)">I'd like to talk to someone</span>
    </div>
    <div id="stragta-input-row">
      <textarea id="stragta-input" rows="1"
        placeholder="Ask anything about Stragta..."
        onkeydown="handleKey(event)"></textarea>
      <button id="stragta-send" onclick="sendMessage()" title="Send">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M2 8l12-6-6 12-2-4-4-2z"/>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  btn.addEventListener('click', toggleWidget);
}

// ── INJECT STYLES ─────────────────────────────────────────────
function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    /* Floating action button */
    #stragta-fab {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1A1A17;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,.28), 0 0 0 1px rgba(255,255,255,.06);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .2s, box-shadow .2s;
      color: #F2F0EA;
    }
    #stragta-fab:hover {
      transform: scale(1.07);
      box-shadow: 0 6px 28px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.1);
    }
    #stragta-fab svg {
      width: 22px;
      height: 22px;
    }

    /* Unread dot (shown before first open) */
    #stragta-fab::after {
      content: '';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 9px;
      height: 9px;
      background: #B8F020;
      border-radius: 50%;
      border: 2px solid #1A1A17;
      animation: pulse-fab 2.5s ease-in-out infinite;
    }
    #stragta-fab.opened::after { display: none; }
    @keyframes pulse-fab {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:.7; transform:scale(1.2); }
    }

    /* Chat panel */
    #stragta-panel {
      position: fixed;
      bottom: 96px;
      right: 28px;
      z-index: 9998;
      width: 360px;
      height: 500px;
      background: #F5F5F3;
      border: 1px solid rgba(28,28,20,.12);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,.18), 0 0 0 1px rgba(28,28,20,.06);
      transform: scale(0.92) translateY(12px);
      transform-origin: bottom right;
      opacity: 0;
      pointer-events: none;
      transition: transform .28s cubic-bezier(.34,1.4,.64,1), opacity .22s ease;
    }
    #stragta-panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* Header — stays dark for contrast */
    #stragta-header {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(28,28,20,.08);
      display: flex;
      align-items: center;
      gap: 10px;
      background: #1A1A17;
      flex-shrink: 0;
    }
    #stragta-avatar {
      width: 32px;
      height: 32px;
      background: #F2F0EA;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #1A1A17;
    }
    #stragta-avatar svg { width: 14px; height: 14px; }
    #stragta-hname {
      font-size: 13px;
      font-weight: 700;
      color: #F2F0EA;
      letter-spacing: .01em;
    }
    #stragta-hstatus {
      font-size: 11px;
      color: rgba(242,240,234,.45);
      margin-top: 1px;
    }
    #stragta-online {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 6px rgba(74,222,128,.6);
      margin-left: auto;
      flex-shrink: 0;
    }

    /* Messages area */
    #stragta-msgs {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
      background: #F5F5F3;
    }
    #stragta-msgs::-webkit-scrollbar { width: 3px; }
    #stragta-msgs::-webkit-scrollbar-thumb {
      background: rgba(28,28,20,.12);
      border-radius: 3px;
    }

    /* Message bubbles */
    .s-msg {
      max-width: 84%;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .s-msg.bot  { align-self: flex-start; }
    .s-msg.user { align-self: flex-end; }

    .s-bubble {
      padding: 9px 13px;
      font-size: 13px;
      line-height: 1.55;
      border-radius: 14px;
    }
    .s-msg.bot  .s-bubble {
      background: #FFFFFF;
      color: #1A1A17;
      border-radius: 4px 14px 14px 14px;
      box-shadow: 0 1px 3px rgba(28,28,20,.08);
    }
    .s-msg.user .s-bubble {
      background: #1A1A17;
      color: #F2F0EA;
      border-radius: 14px 4px 14px 14px;
    }
    .s-time {
      font-size: 10px;
      color: rgba(28,28,20,.35);
    }
    .s-msg.user .s-time { text-align: right; }

    /* Typing indicator */
    .s-typing {
      display: flex;
      gap: 4px;
      padding: 10px 13px;
      background: #FFFFFF;
      border-radius: 4px 14px 14px 14px;
      width: fit-content;
      box-shadow: 0 1px 3px rgba(28,28,20,.08);
    }
    .s-typing span {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: rgba(28,28,20,.3);
      animation: s-dot 1.2s ease-in-out infinite;
    }
    .s-typing span:nth-child(2) { animation-delay: .2s; }
    .s-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes s-dot {
      0%,60%,100% { transform: translateY(0); }
      30%          { transform: translateY(-5px); }
    }

    /* Suggestion chips */
    #stragta-chips {
      padding: 6px 12px 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      border-top: 1px solid rgba(28,28,20,.08);
      flex-shrink: 0;
      background: #F5F5F3;
    }
    .s-chip {
      padding: 4px 10px;
      background: #FFFFFF;
      border: 1px solid rgba(28,28,20,.12);
      border-radius: 99px;
      font-size: 11px;
      color: rgba(28,28,20,.55);
      cursor: pointer;
      white-space: nowrap;
      transition: all .18s;
      font-family: inherit;
    }
    .s-chip:hover {
      background: #F5F5F3;
      color: #1A1A17;
      border-color: rgba(28,28,20,.25);
    }

    /* Input row */
    #stragta-input-row {
      border-top: 1px solid rgba(28,28,20,.1);
      display: flex;
      flex-shrink: 0;
      background: #FFFFFF;
    }
    #stragta-input {
      flex: 1;
      padding: 12px 14px;
      background: transparent;
      border: none;
      outline: none;
      color: #1A1A17;
      font-family: inherit;
      font-size: 13px;
      resize: none;
      line-height: 1.5;
    }
    #stragta-input::placeholder { color: rgba(28,28,20,.3); }
    #stragta-send {
      padding: 12px 14px;
      background: transparent;
      border: none;
      border-left: 1px solid rgba(28,28,20,.1);
      cursor: pointer;
      color: rgba(28,28,20,.3);
      transition: color .2s;
      display: flex;
      align-items: center;
    }
    #stragta-send:hover { color: #1A1A17; }
    #stragta-send svg { width: 15px; height: 15px; }

    /* Mobile adjustments */
    @media (max-width: 480px) {
      #stragta-panel {
        width: calc(100vw - 24px);
        right: 12px;
        bottom: 88px;
        height: 60vh;
      }
      #stragta-fab { bottom: 20px; right: 16px; }
    }
  `;
  document.head.appendChild(s);
}

// ── TOGGLE WIDGET ─────────────────────────────────────────────
function toggleWidget() {
  widgetOpen = !widgetOpen;
  const panel = document.getElementById('stragta-panel');
  const btn   = document.getElementById('stragta-fab');
  const open  = document.getElementById('fab-icon-open');
  const close = document.getElementById('fab-icon-close');

  panel.classList.toggle('open', widgetOpen);
  btn.classList.add('opened'); // removes unread dot permanently

  open.style.display  = widgetOpen ? 'none'  : 'block';
  close.style.display = widgetOpen ? 'block' : 'none';

  if (widgetOpen && chatHistory.length === 0) {
    setTimeout(() => {
      addMsg('bot', "Hi, I'm PACO — Stragta's virtual assistant. What can I help you with?");
    }, 220);
  }
}

// ── MESSAGES ──────────────────────────────────────────────────
function fmt() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function addMsg(role, text) {
  const wall = document.getElementById('stragta-msgs');
  const div  = document.createElement('div');
  div.className = `s-msg ${role}`;
  div.innerHTML = `<div class="s-bubble">${text}</div><div class="s-time">${fmt()}</div>`;
  wall.appendChild(div);
  wall.scrollTop = wall.scrollHeight;
}

function showTyping() {
  const wall = document.getElementById('stragta-msgs');
  const div  = document.createElement('div');
  div.id = 's-typing'; div.className = 's-msg bot';
  div.innerHTML = '<div class="s-typing"><span></span><span></span><span></span></div>';
  wall.appendChild(div);
  wall.scrollTop = wall.scrollHeight;
}

function rmTyping() {
  const t = document.getElementById('s-typing');
  if (t) t.remove();
}

// ── PRESET FALLBACK ───────────────────────────────────────────
function preset(msg) {
  const q = msg.toLowerCase();
  if (q.includes('stragta') || q.includes('what do') || q.includes('who are'))
    return "Stragta is a technology consulting partner based in Madrid. We test and compare hardware, software, AI systems, security, and digital workflows so organisations can make better decisions and implement what truly works.";
  if (q.includes('remote') || q.includes('latam') || q.includes('online') || q.includes('eu'))
    return "Yes, we are remote-first. We serve clients across the EU, Spain, and Latin America via video call, with occasional on-site work for executive training.";
  if (q.includes('how') && (q.includes('work') || q.includes('engag') || q.includes('process')))
    return "Three steps: Diagnose, where we audit your tech and team. Design, where we co-create a strategy tied to outcomes you care about. Then Deploy and Embed, where we implement and stay through adoption.";
  if (q.includes('talk') || q.includes('person') || q.includes('someone') || q.includes('call'))
    return "Of course. Use the contact form on this page and one of our team members will get back to you within one business day. First conversation is always free.";
  if (q.includes('price') || q.includes('cost') || q.includes('how much'))
    return "Engagements are scoped individually. Technology audits start from a few thousand euros; executive training from around a thousand euros per day. Use the contact form to start a free discovery conversation.";
  if (q.includes('train') || q.includes('workshop') || q.includes('executive') || q.includes('course'))
    return "Our Executive Training programs are intensive and hands-on, built for decision-makers. They run on-site or remotely, fully customised to your sector.";
  return "That is a good question for our team. Use the contact form on this page and someone will get back to you within one business day. First conversation is always free.";
}

// ── API CALL ──────────────────────────────────────────────────
async function callAPI(userMessage) {
  try {
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': SESSION_ID,
      },
      body: JSON.stringify({ messages: chatHistory }),
    });
    if (!res.ok) throw new Error('server error');
    const data = await res.json();
    return data.content[0].text;
  } catch {
    return preset(userMessage);
  }
}

// ── SEND ──────────────────────────────────────────────────────
async function sendMessage(txt) {
  const inp = document.getElementById('stragta-input');
  const msg = (txt || inp.value).trim();
  if (!msg || chatLoading) return;

  const chips = document.getElementById('stragta-chips');
  if (chips) chips.style.display = 'none';

  inp.value = '';
  addMsg('user', msg);
  chatHistory.push({ role: 'user', content: msg });

  chatLoading = true;
  showTyping();
  const reply = await callAPI(msg);
  rmTyping();
  addMsg('bot', reply);
  chatHistory.push({ role: 'assistant', content: reply });
  chatLoading = false;
}

function sendChip(el) { sendMessage(el.textContent); }

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  buildWidget();
});
