/* ============================================================
   Nova Chat Widget — shared across all pages
   ============================================================ */

(function () {
  'use strict';

  const chatRoot = document.getElementById('ai-chat');
  if (!chatRoot) return;

  const DEFAULT_GREETING = "Hi! I'm Nova, Anupama's AI consultant. I'm here to help figure out if we're a great fit for your project — what brings you here today?";
  const GREETING = chatRoot.dataset.greeting || DEFAULT_GREETING;
  const API      = '/.netlify/functions/chat';

  const chatToggle   = document.getElementById('ai-chat-toggle');
  const chatPanel    = document.getElementById('ai-chat-panel');
  const chatMessages = document.getElementById('ai-chat-messages');
  const chatForm     = document.getElementById('ai-chat-form');
  const chatInput    = document.getElementById('ai-chat-input');
  const chatSend     = document.querySelector('.ai-chat-send');
  const chatBubble   = document.getElementById('ai-chat-bubble');

  let isOpen    = false;
  let isLoading = false;
  let greeted   = false;
  const history = [];

  // ── Speech bubble hints (configurable per page) ───────────
  const defaultHints = [
    "Hi, I'm Nova! How can I help? 👋",
    'Ask Nova about AI solutions ✨',
    "Let's talk about your idea 💡",
    'Free 30-min consultation available',
    'Building something new? Ask Nova 🚀',
    'Got a tech challenge? I can help!',
  ];
  const receptHints = [
    'Never miss a customer call again 📞',
    'Nova answers 24/7 — even at midnight',
    'See how Nova books appointments 📅',
    'Free 7-day trial — no card needed',
    'Ask me how Nova works for your biz',
    'Salons, mechanics, clinics — ask me!',
  ];

  const HINTS = chatRoot.dataset.page === 'receptionist' ? receptHints : defaultHints;
  let bubbleIdx = 0;
  let bubbleHideTimer, bubbleShowTimer;

  function showBubble() {
    if (isOpen || !chatBubble) return;
    chatBubble.textContent = HINTS[bubbleIdx % HINTS.length];
    bubbleIdx++;
    chatBubble.classList.add('is-visible');
    bubbleHideTimer = setTimeout(() => {
      chatBubble.classList.remove('is-visible');
      bubbleShowTimer = setTimeout(showBubble, 9000);
    }, 4500);
  }
  setTimeout(showBubble, 3500);

  function toggleChat() {
    isOpen = !isOpen;
    chatRoot.classList.toggle('is-open', isOpen);
    chatPanel.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      clearTimeout(bubbleHideTimer);
      clearTimeout(bubbleShowTimer);
      if (chatBubble) chatBubble.classList.remove('is-visible');
    } else {
      bubbleShowTimer = setTimeout(showBubble, 6000);
    }

    if (isOpen && !greeted) {
      greeted = true;
      addMessage('ai', GREETING);
    }

    if (isOpen) setTimeout(() => chatInput.focus(), 320);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMarkdown(str) {
    return escapeHtml(str)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function aiAvatar() {
    return `<div class="ai-chat-msg__avatar" aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nova-msg-bg" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <rect x="7" y="10" width="28" height="25" rx="8" fill="url(#nova-msg-bg)"/>
        <rect x="4"  y="17" width="4" height="7" rx="2" fill="url(#nova-msg-bg)"/>
        <rect x="34" y="17" width="4" height="7" rx="2" fill="url(#nova-msg-bg)"/>
        <line x1="21" y1="10" x2="21" y2="5" stroke="#c084fc" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="21" cy="4" r="2.2" fill="#e879f9"/>
        <circle cx="21" cy="4" r="1"   fill="#fff" opacity="0.6"/>
        <circle cx="15.5" cy="21" r="4.5" fill="#fff" opacity="0.95"/>
        <circle cx="26.5" cy="21" r="4.5" fill="#fff" opacity="0.95"/>
        <circle cx="16"   cy="21" r="2.8" fill="#4f46e5"/>
        <circle cx="27"   cy="21" r="2.8" fill="#4f46e5"/>
        <circle cx="17"   cy="20" r="1"   fill="#fff"/>
        <circle cx="28"   cy="20" r="1"   fill="#fff"/>
        <path d="M15.5 28.5 Q21 32 26.5 28.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.9"/>
        <circle cx="10" cy="13" r="1"   fill="#22d3ee" opacity="0.8"/>
        <circle cx="32" cy="13" r="1"   fill="#f0abfc" opacity="0.8"/>
      </svg>
    </div>`;
  }

  function addMessage(role, text) {
    const isAI = role === 'ai';
    const el   = document.createElement('div');
    el.className = `ai-chat-msg ai-chat-msg--${isAI ? 'ai' : 'user'}`;
    el.innerHTML = isAI
      ? `${aiAvatar()}<div class="ai-chat-msg__bubble">${renderMarkdown(text)}</div>`
      : `<div class="ai-chat-msg__bubble">${escapeHtml(text)}</div>`;
    chatMessages.appendChild(el);
    scrollBottom(true);
  }

  function streamMessage(text, onDone) {
    const el = document.createElement('div');
    el.className = 'ai-chat-msg ai-chat-msg--ai';
    el.innerHTML = `${aiAvatar()}<div class="ai-chat-msg__bubble"><span class="nova-cursor">▍</span></div>`;
    chatMessages.appendChild(el);
    scrollBottom(true);

    const bubble = el.querySelector('.ai-chat-msg__bubble');
    const total  = text.length;
    const speed  = Math.max(10, Math.min(22, 1400 / total));
    let i = 0;

    function tick() {
      i++;
      bubble.innerHTML = escapeHtml(text.slice(0, i)) + (i < total ? '<span class="nova-cursor">▍</span>' : '');
      scrollBottom();
      if (i < total) {
        setTimeout(tick, speed);
      } else {
        setTimeout(() => {
          bubble.innerHTML = renderMarkdown(text);
          scrollBottom();
          if (onDone) onDone();
        }, 80);
      }
    }
    setTimeout(tick, speed);
  }

  function showTyping() {
    const el     = document.createElement('div');
    el.id        = 'ai-typing-row';
    el.className = 'ai-chat-msg ai-chat-msg--ai';
    el.innerHTML = `${aiAvatar()}
      <div class="ai-chat-typing">
        <span class="ai-chat-typing__dot"></span>
        <span class="ai-chat-typing__dot"></span>
        <span class="ai-chat-typing__dot"></span>
      </div>`;
    chatMessages.appendChild(el);
    scrollBottom();
  }

  function hideTyping() {
    const el = document.getElementById('ai-typing-row');
    if (el) el.remove();
  }

  function scrollBottom(force) {
    const distFromBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight;
    if (force || distFromBottom < 80) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function setLoading(loading) {
    isLoading          = loading;
    chatSend.disabled  = loading;
    chatInput.disabled = loading;
  }

  async function sendMessage(text) {
    if (isLoading || !text.trim()) return;

    setLoading(true);
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    showTyping();

    try {
      const res  = await fetch(API, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      hideTyping();

      if (!res.ok || data.error) {
        streamMessage("I'm having a little trouble right now. Please use the contact form to reach Anupama directly — she'll get back to you quickly.");
        return;
      }

      history.push({ role: 'assistant', content: data.reply });
      streamMessage(data.reply, () => {
        setLoading(false);
        chatInput.focus();
      });
      return;
    } catch {
      hideTyping();
      streamMessage("Looks like I'm offline at the moment. Feel free to use the contact form — Anupama will be in touch.");
    } finally {
      setLoading(false);
      chatInput.focus();
    }
  }

  chatToggle.addEventListener('click', toggleChat);

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    sendMessage(text);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggleChat();
  });

})();
