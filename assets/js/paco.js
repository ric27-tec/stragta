(function () {
  const script = document.currentScript;
  const primary = script.getAttribute('data-primary') || '#1A1A17';
  const botName = script.getAttribute('data-name') || 'PACO';
  const serverUrl = script.getAttribute('data-server') || script.src.replace('/embed.js', '');
  const lang = script.getAttribute('data-lang') || (document.documentElement.lang || 'en').slice(0, 2);
  const privacyUrl = script.getAttribute('data-privacy') || (lang === 'es' ? '/es/privacidad/' : '/privacy/');
  const sessionId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const copy = lang === 'es'
    ? {
        title: `Chatear con ${botName}`,
        placeholder: 'Haz una pregunta...',
        notice: 'Tus mensajes se enviarán a proveedores de IA de Stragta. No incluyas datos sensibles.',
        consent: 'Entiendo y quiero iniciar el chat con IA.',
        privacy: 'Privacidad',
        greeting: `Hola. Soy ${botName}. Pregúntame sobre Stragta y sus servicios.`,
        connectionError: 'Ahora mismo no puedo conectarme. Puedes usar el formulario de contacto.',
      }
    : {
        title: `Chat with ${botName}`,
        placeholder: 'Ask a question...',
        notice: 'Your messages will be sent to Stragta AI providers. Do not include sensitive information.',
        consent: 'I understand and want to start the AI chat.',
        privacy: 'Privacy',
        greeting: `Hi. I am ${botName}. Ask me about Stragta and its services.`,
        connectionError: 'I cannot connect right now. You can use the contact form.',
      };

  const style = document.createElement('style');
  style.textContent = `
    #stragta-chat-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 54px; height: 54px; border-radius: 50%;
      background: ${primary}; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,.2);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    #stragta-chat-btn:hover { transform: scale(1.08); }
    #stragta-chat-btn svg { width: 24px; height: 24px; color: #fff; }

    #stragta-chat-box {
      position: fixed; bottom: 88px; right: 24px; z-index: 9998;
      width: 340px; height: 500px;
      background: #fff; border: 1px solid rgba(0,0,0,.12);
      border-radius: 12px; display: flex; flex-direction: column;
      font-family: system-ui, sans-serif; font-size: 14px;
      box-shadow: 0 8px 40px rgba(0,0,0,.15);
      overflow: hidden; transform: scale(0); transform-origin: bottom right;
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
      opacity: 0; pointer-events: none;
    }
    #stragta-chat-box.open {
      transform: scale(1); opacity: 1; pointer-events: all;
    }
    .sc-header {
      background: ${primary}; color: #fff;
      padding: 12px 16px; display: flex; align-items: center; gap: 10px;
    }
    .sc-header-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; }
    .sc-header-name { font-weight: 700; font-size: 13px; flex: 1; }
    .sc-header-close {
      background: none; border: none; color: rgba(255,255,255,.7);
      cursor: pointer; font-size: 18px; line-height: 1; padding: 0;
    }
    .sc-messages {
      flex: 1; overflow-y: auto; padding: 14px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .sc-msg { max-width: 82%; display: flex; flex-direction: column; gap: 3px; }
    .sc-msg.bot { align-self: flex-start; }
    .sc-msg.user { align-self: flex-end; }
    .sc-bubble { padding: 9px 13px; border-radius: 12px; line-height: 1.5; font-size: 13px; }
    .sc-msg.bot .sc-bubble { background: #f4f4f2; color: #1a1a17; border-radius: 2px 12px 12px 12px; }
    .sc-msg.user .sc-bubble { background: ${primary}; color: #fff; border-radius: 12px 2px 12px 12px; }
    .sc-time { font-size: 10px; color: #aaa; }
    .sc-msg.user .sc-time { text-align: right; }
    .sc-typing {
      display: flex; gap: 4px; padding: 9px 13px;
      background: #f4f4f2; border-radius: 2px 12px 12px 12px; width: fit-content;
    }
    .sc-typing span {
      width: 5px; height: 5px; border-radius: 50%; background: #aaa;
      animation: sc-dot 1.2s ease-in-out infinite;
    }
    .sc-typing span:nth-child(2) { animation-delay: .2s; }
    .sc-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes sc-dot { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    .sc-input-row {
      border-top: 1px solid rgba(0,0,0,.09);
      display: flex;
    }
    .sc-input {
      flex: 1; padding: 12px 14px; border: none; outline: none;
      font-family: inherit; font-size: 13px; resize: none;
      background: transparent; color: #1a1a17;
    }
    .sc-send {
      padding: 12px 14px; border: none; background: none;
      border-left: 1px solid rgba(0,0,0,.09);
      cursor: pointer; color: #aaa; transition: color .2s;
    }
    .sc-send:hover { color: ${primary}; }
    .sc-send:disabled, .sc-input:disabled { cursor: not-allowed; opacity: .55; }
    .sc-notice {
      padding: 10px 12px; border-top: 1px solid rgba(0,0,0,.09);
      background: #fafaf8; color: #5f5f59; font-size: 10.5px; line-height: 1.45;
    }
    .sc-notice p { margin: 0 0 6px; }
    .sc-notice label { display: flex; gap: 7px; align-items: flex-start; cursor: pointer; }
    .sc-notice input { margin-top: 2px; }
    .sc-notice a { color: ${primary}; }
    .sc-branding {
      text-align: center; padding: 5px;
      font-size: 10px; color: #ccc; letter-spacing: .04em;
    }
    .sc-branding a { color: #ccc; text-decoration: none; }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'stragta-chat-btn';
  btn.title = copy.title;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`;

  const box = document.createElement('div');
  box.id = 'stragta-chat-box';
  box.innerHTML = `
    <div class="sc-header">
      <div class="sc-header-dot"></div>
      <span class="sc-header-name">${botName}</span>
      <button class="sc-header-close" id="sc-close">×</button>
    </div>
    <div class="sc-messages" id="sc-msgs"></div>
    <div class="sc-notice">
      <p>${copy.notice} <a href="${privacyUrl}">${copy.privacy}</a>.</p>
      <label><input type="checkbox" id="sc-consent"> <span>${copy.consent}</span></label>
    </div>
    <div class="sc-input-row">
      <textarea class="sc-input" id="sc-input" rows="1" placeholder="${copy.placeholder}" disabled></textarea>
      <button class="sc-send" id="sc-send-btn" disabled>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M2 8l12-6-6 12-2-4-4-2z"/>
        </svg>
      </button>
    </div>
    <div class="sc-branding">Powered by <a href="https://www.stragta.com" target="_blank" rel="noopener">Stragta</a></div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(box);

  let history = [];
  let loading = false;

  const consent = document.getElementById('sc-consent');
  const input = document.getElementById('sc-input');
  const sendButton = document.getElementById('sc-send-btn');

  consent.addEventListener('change', () => {
    input.disabled = !consent.checked;
    sendButton.disabled = !consent.checked;
    if (consent.checked) input.focus();
  });

  function timeFmt() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addMsg(role, text) {
    const wall = document.getElementById('sc-msgs');
    const d = document.createElement('div');
    d.className = `sc-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'sc-bubble';
    bubble.textContent = text;
    const time = document.createElement('div');
    time.className = 'sc-time';
    time.textContent = timeFmt();
    d.append(bubble, time);
    wall.appendChild(d);
    wall.scrollTop = wall.scrollHeight;
  }

  function showTyping() {
    const wall = document.getElementById('sc-msgs');
    const d = document.createElement('div');
    d.id = 'sc-typing';
    d.className = 'sc-msg bot';
    d.innerHTML = '<div class="sc-typing"><span></span><span></span><span></span></div>';
    wall.appendChild(d);
    wall.scrollTop = wall.scrollHeight;
  }

  function rmTyping() {
    const t = document.getElementById('sc-typing');
    if (t) t.remove();
  }

  async function send(txt) {
    const inp = document.getElementById('sc-input');
    const msg = (txt || inp.value).trim();
    if (!msg || loading) return;

    inp.value = '';
    addMsg('user', msg);
    history.push({ role: 'user', content: msg });
    loading = true;
    showTyping();

    try {
      const res = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || copy.connectionError;
      rmTyping();
      addMsg('bot', reply);
      history.push({ role: 'assistant', content: reply });
    } catch {
      rmTyping();
      addMsg('bot', copy.connectionError);
    }

    loading = false;
  }

  btn.addEventListener('click', () => {
    box.classList.toggle('open');
    if (box.classList.contains('open') && history.length === 0) {
      setTimeout(() => {
        addMsg('bot', copy.greeting);
      }, 300);
    }
  });

  document.getElementById('sc-close').addEventListener('click', () => {
    box.classList.remove('open');
  });

  document.getElementById('sc-send-btn').addEventListener('click', () => {
    send();
  });

  document.getElementById('sc-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();
