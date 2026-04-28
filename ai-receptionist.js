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

  // ── Demo call — voice + text ──────────────────────────────

  const DEMO_SCRIPT = [
    { role: 'nova',     text: "Good afternoon! Thanks for calling Bella Hair Salon. I'm Nova, your AI receptionist. How can I help you today?" },
    { role: 'customer', text: "Hi, I'd like to book a haircut for this Saturday." },
    { role: 'nova',     text: "Of course! We have a few openings this Saturday. Are you after a morning or afternoon appointment?" },
    { role: 'customer', text: "Morning would be great." },
    { role: 'nova',     text: "Perfect. We have 9:30 AM and 11:00 AM available. Which suits you better?" },
    { role: 'customer', text: "I'll go with 9:30 please." },
    { role: 'nova',     text: "Great choice! Could I get your name and mobile number for a confirmation SMS?" },
    { role: 'customer', text: "Sure — Sarah, 0412 345 678." },
    { role: 'nova',     text: "Thanks Sarah! You're all booked in for this Saturday at 9:30 AM. Confirmation text on its way. Is there anything else I can help with?" },
    { role: 'customer', text: "No, that's all. Thanks!" },
    { role: 'nova',     text: "You're welcome! We'll see you Saturday. Have a lovely day!" },
    { role: 'sms' },
  ];

  const playBtn   = document.getElementById('play-demo');
  const callLog   = document.getElementById('call-log');
  const smsToast  = document.getElementById('sms-toast');
  const callStatus = document.getElementById('call-status-text');
  const callDot   = document.getElementById('call-dot');
  const callTimer = document.getElementById('call-timer');
  const soundWave = document.getElementById('sound-wave');
  const muteBtn   = document.getElementById('call-mute');

  let timerInterval = null;
  let timerSeconds  = 0;
  let playing       = false;
  let aborted       = false;
  let muted         = false;

  // ── Voice setup ───────────────────────────────────────────

  let voiceNova     = null;
  let voiceCustomer = null;
  const synth = window.speechSynthesis;

  function pickVoices(voices) {
    const en = voices.filter(v => v.lang.startsWith('en'));

    // Nova: prefer AU or GB female-sounding voice
    voiceNova =
      en.find(v => v.lang === 'en-AU') ||
      en.find(v => /karen|lee|catherine|female|zira|hazel|kate|susan/i.test(v.name)) ||
      en.find(v => v.lang === 'en-GB') ||
      en[0] || null;

    // Customer: different voice, prefer US male-sounding
    voiceCustomer =
      en.find(v => v !== voiceNova && /david|alex|tom|daniel|james|male/i.test(v.name)) ||
      en.find(v => v !== voiceNova && v.lang === 'en-US') ||
      en.find(v => v !== voiceNova) ||
      voiceNova;
  }

  function initVoices() {
    return new Promise(resolve => {
      const v = synth.getVoices();
      if (v.length) { pickVoices(v); resolve(); }
      else {
        synth.addEventListener('voiceschanged', () => {
          pickVoices(synth.getVoices()); resolve();
        }, { once: true });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  const wait = ms => new Promise(r => setTimeout(r, ms));

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function setSoundWave(role) {
    soundWave.className = 'ar-sound-wave';
    if (role) soundWave.classList.add('speaking', role);
  }

  function addTyping(role) {
    const el = document.createElement('div');
    el.id = 'demo-typing';
    el.className = `ar-log-msg ar-log-msg--${role}`;
    el.innerHTML = `
      <div class="ar-log-msg__wrap">
        <span class="ar-log-msg__label">${role === 'nova' ? 'Nova' : 'Customer'}</span>
        <div class="ar-log-typing">
          <span class="ar-log-typing__dot"></span>
          <span class="ar-log-typing__dot"></span>
          <span class="ar-log-typing__dot"></span>
        </div>
      </div>`;
    callLog.appendChild(el);
    callLog.scrollTop = callLog.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('demo-typing');
    if (el) el.remove();
  }

  function addMessage(role, text) {
    removeTyping();
    const el = document.createElement('div');
    el.className = `ar-log-msg ar-log-msg--${role}`;
    el.innerHTML = `
      <div class="ar-log-msg__wrap">
        <span class="ar-log-msg__label">${role === 'nova' ? 'Nova' : 'Customer'}</span>
        <div class="ar-log-msg__bubble">${text}</div>
      </div>`;
    callLog.appendChild(el);
    callLog.scrollTop = callLog.scrollHeight;
  }

  function speak(text, role) {
    return new Promise(resolve => {
      if (!synth || muted) { resolve(); return; }
      synth.cancel();

      const utt = new SpeechSynthesisUtterance(text);
      utt.voice  = role === 'nova' ? voiceNova : voiceCustomer;
      utt.rate   = role === 'nova' ? 1.05 : 0.95;
      utt.pitch  = role === 'nova' ? 1.15 : 0.9;
      utt.volume = 1;

      utt.onstart = () => setSoundWave(role);
      utt.onend   = () => { setSoundWave(null); resolve(); };
      utt.onerror = () => { setSoundWave(null); resolve(); };

      synth.speak(utt);
    });
  }

  function resetDemo() {
    aborted = true;
    if (synth) synth.cancel();
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds  = 0;
    callLog.innerHTML = '';
    smsToast.setAttribute('aria-hidden', 'true');
    callStatus.textContent = 'Ready to play';
    callDot.className = 'ar-call-ui__status-dot';
    callTimer.textContent = '0:00';
    setSoundWave(null);
    playing = false;
  }

  async function runDemo() {
    aborted  = false;
    playing  = true;

    playBtn.disabled = true;
    playBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      Playing...`;

    callStatus.textContent = 'Connecting...';
    await wait(600);
    if (aborted) return;

    callStatus.textContent = 'Connected';
    callDot.classList.add('connected');
    timerInterval = setInterval(() => {
      timerSeconds++;
      callTimer.textContent = formatTime(timerSeconds);
    }, 1000);

    for (const step of DEMO_SCRIPT) {
      if (aborted) break;

      if (step.role === 'sms') {
        await wait(700);
        smsToast.setAttribute('aria-hidden', 'false');
        callLog.scrollTop = callLog.scrollHeight;
        await wait(1200);
        break;
      }

      // Show typing, speak in parallel
      addTyping(step.role);
      const typingMs = step.role === 'nova' ? 850 : 600;
      await wait(typingMs);
      if (aborted) break;

      // Reveal message + speak simultaneously
      addMessage(step.role, step.text);
      await speak(step.text, step.role);
      if (aborted) break;

      // Pause between turns
      await wait(step.role === 'nova' ? 300 : 500);
    }

    if (!aborted) {
      clearInterval(timerInterval);
      callStatus.textContent = 'Call ended';
      callDot.classList.remove('connected');
      setSoundWave(null);
      playBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        Replay Demo`;
      playBtn.disabled = false;
    }
    playing = false;
  }

  // Mute toggle
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.classList.toggle('muted', muted);
    muteBtn.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    if (muted && synth) { synth.cancel(); setSoundWave(null); }
  });

  playBtn.addEventListener('click', async () => {
    if (playing) return;
    resetDemo();
    await initVoices();
    runDemo();
  });

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
