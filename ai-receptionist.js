/* ============================================================
   Nova AI Receptionist — Page Script
   ============================================================ */

(function () {
  'use strict';

  // ── Theme toggle (shared logic with main site) ────────────
  const html        = document.documentElement;
  const themeBtn    = document.getElementById('theme-toggle');
  const STORAGE_KEY = 'anupama-dev-theme';

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    themeBtn.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
  applyTheme(localStorage.getItem(STORAGE_KEY) || 'dark');
  themeBtn.addEventListener('click', () => {
    applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ── Nav scroll ────────────────────────────────────────────
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 48);
  }, { passive: true });

  // ── Mobile menu ───────────────────────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    const spans = hamburger.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.transform = spans[1].style.opacity = spans[2].style.transform = '';
    }
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = s.style.opacity = ''; });
    });
  });

  // ── Scroll reveal ─────────────────────────────────────────
  const revealObs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // ── VAPI live demo ────────────────────────────────────────

  const playBtn    = document.getElementById('play-demo');
  const callLog    = document.getElementById('call-log');
  const callStatus = document.getElementById('call-status-text');
  const callDot    = document.getElementById('call-dot');
  const callTimer  = document.getElementById('call-timer');
  const soundWave  = document.getElementById('sound-wave');
  const muteBtn    = document.getElementById('call-mute');

  let timerInterval = null;
  let timerSeconds  = 0;
  let callActive    = false;
  let muted         = false;

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function setSoundWave(active) {
    soundWave.className = 'ar-sound-wave';
    if (active) soundWave.classList.add('speaking');
  }

  function addBubble(role, text) {
    const el = document.createElement('div');
    el.className = `ar-log-msg ar-log-msg--${role}`;
    el.innerHTML = `
      <div class="ar-log-msg__wrap">
        <span class="ar-log-msg__label">${role === 'nova' ? 'Nova' : 'You'}</span>
        <div class="ar-log-msg__bubble">${text}</div>
      </div>`;
    callLog.appendChild(el);
    callLog.scrollTop = callLog.scrollHeight;
    return el;
  }

  function updateBubble(el, text) {
    const bubble = el.querySelector('.ar-log-msg__bubble');
    if (bubble) bubble.textContent = text;
    callLog.scrollTop = callLog.scrollHeight;
  }

  function resetDemo() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds  = 0;
    callLog.innerHTML = '';
    callStatus.textContent = 'Ready';
    callDot.className = 'ar-call-ui__status-dot';
    callTimer.textContent = '0:00';
    setSoundWave(false);
    callActive = false;
    muted = false;
    muteBtn.classList.remove('muted');
  }

  if (playBtn && window.Vapi) {
    const vapi = new window.Vapi('6df6b010-1a5b-4edf-aa60-fc54563a337b');
    let currentBubble = null;
    let currentRole   = null;

    vapi.on('call-start', () => {
      callActive = true;
      callStatus.textContent = 'Connected — say hello!';
      callDot.classList.add('connected');
      timerInterval = setInterval(() => {
        timerSeconds++;
        callTimer.textContent = formatTime(timerSeconds);
      }, 1000);
      playBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 1.61 3.39a2 2 0 0 1 1.22-2A12.84 12.84 0 0 0 5.64 1a2 2 0 0 1 2.11.45L9.02 2.72a16 16 0 0 0 2.6 3.41"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
        End Demo`;
      playBtn.disabled = false;
    });

    vapi.on('speech-start', () => {
      setSoundWave(true);
      callStatus.textContent = 'Nova is speaking...';
    });

    vapi.on('speech-end', () => {
      setSoundWave(false);
      callStatus.textContent = 'Nova is listening...';
    });

    vapi.on('message', (msg) => {
      if (msg.type !== 'transcript') return;
      const role = msg.role === 'assistant' ? 'nova' : 'customer';
      const text = (msg.transcript || '').trim();
      if (!text) return;

      if (!currentBubble || currentRole !== role) {
        currentBubble = addBubble(role, text);
        currentRole   = role;
      } else {
        updateBubble(currentBubble, text);
      }

      if (msg.transcriptType === 'final') {
        currentBubble = null;
        currentRole   = null;
      }
    });

    vapi.on('call-end', () => {
      clearInterval(timerInterval);
      callStatus.textContent = 'Call ended';
      callDot.classList.remove('connected');
      setSoundWave(false);
      callActive    = false;
      currentBubble = null;
      currentRole   = null;
      playBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        Try Demo Again`;
      playBtn.disabled = false;
    });

    vapi.on('error', () => {
      clearInterval(timerInterval);
      callStatus.textContent = 'Something went wrong — try again';
      callDot.classList.remove('connected');
      setSoundWave(false);
      callActive    = false;
      currentBubble = null;
      currentRole   = null;
      playBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
        Start Live Demo`;
      playBtn.disabled = false;
    });

    muteBtn.addEventListener('click', () => {
      muted = !muted;
      vapi.setMuted(muted);
      muteBtn.classList.toggle('muted', muted);
      muteBtn.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    });

    playBtn.addEventListener('click', () => {
      if (callActive) {
        vapi.stop();
      } else {
        resetDemo();
        playBtn.disabled = true;
        playBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Connecting...`;
        callStatus.textContent = 'Connecting...';
        vapi.start('1cb11ab1-02bf-4824-9d49-a29e9429aef3');
      }
    });
  }

  // ── Live Call — phone-based real demo ────────────────────

  const liveBizSel  = document.getElementById('live-biz');
  const livePhone   = document.getElementById('live-phone');
  const liveCallBtn = document.getElementById('live-call-btn');
  const liveStatus  = document.getElementById('live-call-status');

  function flashInvalid(el) {
    el.classList.add('ar-live-call__invalid');
    el.focus();
    setTimeout(() => el.classList.remove('ar-live-call__invalid'), 1800);
  }

  if (liveCallBtn) {
    liveCallBtn.addEventListener('click', async () => {
      const biz   = liveBizSel ? liveBizSel.value : '';
      const phone = livePhone  ? livePhone.value.trim() : '';

      if (!biz)   { flashInvalid(liveBizSel); return; }
      if (!phone) { flashInvalid(livePhone);  return; }

      liveCallBtn.disabled = true;
      liveStatus.hidden = false;
      liveStatus.className = 'ar-live-call__status ar-live-call__status--calling';
      liveStatus.textContent = 'Calling your number...';

      try {
        const res  = await fetch('/.netlify/functions/call-initiate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ phone, businessType: biz }),
        });
        const data = await res.json();

        if (!res.ok || data.error) throw new Error(data.error || 'Could not start call');

        liveStatus.className = 'ar-live-call__status ar-live-call__status--success';
        liveStatus.textContent = 'Nova is calling you now! Pick up and start talking.';

        setTimeout(() => {
          liveCallBtn.disabled = false;
          liveStatus.hidden = true;
        }, 35000);

      } catch (err) {
        liveStatus.className = 'ar-live-call__status ar-live-call__status--error';
        liveStatus.textContent = err.message || 'Something went wrong — please try again.';
        liveCallBtn.disabled = false;
      }
    });
  }

  // ── FAQ accordion ─────────────────────────────────────────

  document.querySelectorAll('.ar-faq__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.ar-faq__item');
      const answer = item.querySelector('.ar-faq__a');
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.ar-faq__item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.ar-faq__a').style.maxHeight = null;
          other.querySelector('.ar-faq__q').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
    });
  });

  // ── Demo form ─────────────────────────────────────────────

  const demoForm = document.getElementById('demo-form');
  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = demoForm.querySelector('.ar-cta__submit');
      btn.textContent = 'Request sent! We\'ll be in touch within 1 business day.';
      btn.disabled = true;
      btn.style.background = 'var(--green)';
      demoForm.querySelectorAll('input, select').forEach(el => el.disabled = true);
    });
  }

})();
