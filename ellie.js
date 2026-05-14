/* ============================================================
   Ellie AI Receptionist — Page Script
   anupama.dev/ellie
   ============================================================ */

(function () {
  'use strict';

  // ── Nav scroll ────────────────────────────────────────────
  const nav = document.getElementById('main-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // ── Mobile hamburger ──────────────────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
    const spans = hamburger.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = s.style.opacity = ''; });
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
    { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // ── Hero avatar intro audio ───────────────────────────────
  const heroPlayBtn       = document.getElementById('hero-av-play');
  const heroBubblePlayBtn = document.getElementById('hero-av-play-bubble');
  const heroAudio         = document.getElementById('hero-av-audio');
  const heroAvTalk        = document.querySelector('.hero-av-img-talk');
  const heroAvSound       = document.querySelector('.hero-av-sound');

  function toggleHeroAudio() {
    if (!heroAudio) return;
    if (heroAudio.paused) {
      heroAudio.play();
      if (heroPlayBtn)       heroPlayBtn.classList.add('playing');
      if (heroBubblePlayBtn) heroBubblePlayBtn.classList.add('playing');
      if (heroAvTalk)        heroAvTalk.style.opacity  = '0.85';
      if (heroAvSound)       heroAvSound.classList.add('active');
    } else {
      heroAudio.pause();
      if (heroPlayBtn)       heroPlayBtn.classList.remove('playing');
      if (heroBubblePlayBtn) heroBubblePlayBtn.classList.remove('playing');
      if (heroAvTalk)        heroAvTalk.style.opacity  = '0';
      if (heroAvSound)       heroAvSound.classList.remove('active');
    }
  }

  if (heroAudio) {
    if (heroPlayBtn)       heroPlayBtn.addEventListener('click', toggleHeroAudio);
    if (heroBubblePlayBtn) heroBubblePlayBtn.addEventListener('click', toggleHeroAudio);
    heroAudio.addEventListener('ended', () => {
      if (heroPlayBtn)       heroPlayBtn.classList.remove('playing');
      if (heroBubblePlayBtn) heroBubblePlayBtn.classList.remove('playing');
      if (heroAvTalk)        heroAvTalk.style.opacity  = '0';
      if (heroAvSound)       heroAvSound.classList.remove('active');
    });
  }

  // ── Clock in phone status bar ─────────────────────────────
  function updateClock() {
    const el = document.getElementById('phone-time');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  updateClock();
  setInterval(updateClock, 30000);

  // ── Phone demo simulation ─────────────────────────────────
  const DEFAULT_DEMO_SCRIPT = [
    { role: 'ellie',  text: "Hi there! I'm Ellie, your AI receptionist. I answer calls, book appointments and send SMS confirmations 24/7. How can I help?", delay: 800 },
    { role: 'caller', text: "How do you handle bookings after hours?", delay: 3200 },
    { role: 'ellie',  text: "I never sleep! I answer every call within 2 rings — evenings, weekends, public holidays. I collect the customer's details and book straight into your calendar.", delay: 2600 },
    { role: 'caller', text: "What if someone asks something you don't know?", delay: 3200 },
    { role: 'ellie',  text: "I let them know I'll pass the message on, take their details, and notify you instantly. No caller ever gets an empty voicemail.", delay: 2600 },
    { role: 'caller', text: "How quickly can we get set up?", delay: 3000 },
    { role: 'ellie',  text: "Most businesses go live in under 20 minutes. Enter your website URL on the left and I'll learn your business right now!", delay: 2400 },
  ];

  let DEMO_SCRIPT = DEFAULT_DEMO_SCRIPT;

  const demoBizUrlInput  = document.getElementById('demo-biz-url');
  const demoBizBtn       = document.getElementById('demo-biz-btn');
  const demoUrlStatus    = document.getElementById('demo-url-status');
  const demoContactName  = document.getElementById('demo-contact-name');
  const demoContactLabel = document.getElementById('demo-contact-label');
  const demoPhoneNote    = document.getElementById('demo-phone-note');
  const demoBriefCard    = document.getElementById('demo-brief-card');
  const demoBriefDomain  = document.getElementById('demo-brief-domain');
  const demoBriefName    = document.getElementById('demo-brief-name');
  const demoBriefFavicon = document.getElementById('demo-brief-favicon');
  const demoBriefLine    = document.getElementById('demo-brief-line');
  const demoBriefChips   = document.getElementById('demo-brief-chips');

  let briefedUrl = null;

  function setDemoUrlStatus(type, msg) {
    if (!demoUrlStatus) return;
    demoUrlStatus.className = 'demo-url-status' + (type ? ' ' + type : '');
    demoUrlStatus.textContent = msg;
  }

  function setBtnLoading(loading) {
    if (!demoBizBtn) return;
    demoBizBtn.classList.toggle('loading', loading);
    demoBizBtn.disabled = loading;
  }

  function getCompanyDomain(raw) {
    return extractDomain(raw || '').split('/')[0].split('?')[0].split('#')[0];
  }

  function setDemoBriefing(visible, details = {}) {
    if (!demoBriefCard) return;
    demoBriefCard.classList.toggle('visible', visible);
    if (!visible) return;

    const domain = getCompanyDomain(details.url || '');
    const name = (details.name || domain || 'this business').replace(/\s+/g, ' ').trim();
    const description = (details.description || '').replace(/\s+/g, ' ').trim();

    if (demoBriefName)   demoBriefName.textContent   = name;
    if (demoBriefDomain) demoBriefDomain.textContent = domain;

    if (demoBriefFavicon && domain) {
      demoBriefFavicon.style.display = '';
      demoBriefFavicon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      demoBriefFavicon.alt = name;
      demoBriefFavicon.onerror = () => { demoBriefFavicon.style.display = 'none'; };
    }

    if (demoBriefLine) {
      demoBriefLine.textContent = description
        ? `${description.slice(0, 200)}${description.length > 200 ? '…' : ''}`
        : `Ellie will greet callers using the business name and website as context for handling enquiries.`;
    }

    if (demoBriefChips) {
      demoBriefChips.innerHTML = '';
      const chips = [
        details.phone    && { icon: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>', label: details.phone },
        details.location && { icon: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>', label: details.location },
        details.bizType  && { icon: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>', label: details.bizType },
      ].filter(Boolean);

      chips.forEach(({ icon, label }) => {
        const chip = document.createElement('div');
        chip.className = 'demo-brief-chip';
        chip.innerHTML = `${icon}<span>${label}</span>`;
        demoBriefChips.appendChild(chip);
      });
    }
  }

  async function briefEllie() {
    const val = demoBizUrlInput ? demoBizUrlInput.value.trim() : '';
    if (!val) {
      setDemoUrlStatus('', '');
      setDemoBriefing(false);
      briefedUrl = null;
      if (demoContactName)  demoContactName.textContent  = 'Ellie AI Receptionist';
      if (demoContactLabel) demoContactLabel.textContent = 'Your AI receptionist demo';
      if (demoPhoneNote)    demoPhoneNote.textContent    = 'Enter your website above — Ellie will demo as your receptionist';
      return;
    }

    const domain = getCompanyDomain(val);
    briefedUrl = val;
    if (demoContactName)  demoContactName.textContent  = domain;
    if (demoContactLabel) demoContactLabel.textContent = 'Ellie · AI Receptionist';
    if (demoPhoneNote)    demoPhoneNote.textContent    = 'Ellie is being briefed on ' + domain;
    setDemoBriefing(true, { url: val, name: domain });

    setBtnLoading(true);
    setDemoUrlStatus('briefing', 'Reading your website…');

    try {
      const res  = await fetch('/.netlify/functions/demo-vapi-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessWebsite: val }),
      });
      if (!res.ok) throw new Error('Could not read website');
      const data = await res.json();
      const name = data.businessName || getCompanyDomain(val);
      briefedUrl = val;
      if (demoContactName)  demoContactName.textContent  = name;
      if (demoContactLabel) demoContactLabel.textContent = 'Ellie · AI Receptionist';
      if (demoPhoneNote)    demoPhoneNote.textContent    = 'Ellie is briefed on ' + name;
      setDemoBriefing(true, {
        url:         val,
        name,
        description: data.businessDescription,
        phone:       data.businessPhone,
        location:    data.businessLocation,
        bizType:     data.businessType,
      });
      setDemoUrlStatus('ready', '✓ Ellie is ready as ' + name);
    } catch (_) {
      briefedUrl = val;
      setDemoBriefing(true, { url: val, name: getCompanyDomain(val) });
      setDemoUrlStatus('ready', 'Using website address as company context');
    } finally {
      setBtnLoading(false);
    }
  }

  if (demoBizBtn)     demoBizBtn.addEventListener('click', briefEllie);
  if (demoBizUrlInput) {
    demoBizUrlInput.addEventListener('input', () => {
      const val = demoBizUrlInput.value.trim();
      if (!val && briefedUrl) {
        setDemoUrlStatus('', '');
        setDemoBriefing(false);
        briefedUrl = null;
        if (demoContactName)  demoContactName.textContent  = 'Ellie AI Receptionist';
        if (demoContactLabel) demoContactLabel.textContent = 'Your AI receptionist demo';
        if (demoPhoneNote)    demoPhoneNote.textContent    = 'Enter your website above — Ellie will demo as your receptionist';
      }
    });
    demoBizUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        briefEllie();
      }
    });
  }

  const callBtn    = document.getElementById('demo-call-btn');
  const endBtn     = document.getElementById('demo-end-btn');
  const btns       = document.getElementById('demo-btns');
  const transcript = document.getElementById('demo-transcript');
  const emptyEl    = document.getElementById('demo-transcript-empty');
  const statusDot  = document.getElementById('demo-status-dot');
  const statusText = document.getElementById('demo-status-text');
  const timerEl    = document.getElementById('demo-timer');
  const waveEl     = document.getElementById('demo-wave');
  const avatarFrame = document.getElementById('demo-phone-avatar');

  let demoActive   = false;
  let demoTimeout  = null;
  let timerInterval = null;
  let timerSecs    = 0;
  let pendingTimeouts = [];

  function clearAllTimeouts() {
    pendingTimeouts.forEach(t => clearTimeout(t));
    pendingTimeouts = [];
  }

  function scheduleTimeout(fn, delay) {
    const t = setTimeout(fn, delay);
    pendingTimeouts.push(t);
    return t;
  }

  function setStatus(text, connected) {
    statusText.textContent = text;
    statusDot.classList.toggle('active', connected);
  }

  function setWave(active) {
    waveEl.classList.toggle('active', active);
  }

  function setAvatarState(state) {
    if (!avatarFrame) return;
    avatarFrame.classList.remove('phone-state-speaking');
    if (state === 'speaking') avatarFrame.classList.add('phone-state-speaking');
    const talking = avatarFrame.querySelector('.phone-avatar-talking');
    if (talking) {
      talking.style.opacity = state === 'speaking' ? '0.85' : '0';
    }
  }

  function addBubble(role, text) {
    if (emptyEl) emptyEl.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = `log-msg ${role === 'caller' ? 'caller' : ''}`;
    const isEllie = role === 'ellie';
    msg.innerHTML = `
      <div class="log-avatar ${isEllie ? 'ellie-av' : 'caller-av'}">${isEllie ? 'E' : 'Y'}</div>
      <div class="log-body">
        <div class="log-who">${isEllie ? 'Ellie' : 'You'}</div>
        <div class="log-bubble ${isEllie ? 'ellie-bub' : 'caller-bub'}">${text}</div>
      </div>`;
    transcript.appendChild(msg);
    requestAnimationFrame(() => msg.classList.add('show'));
    transcript.scrollTop = transcript.scrollHeight;
    return msg;
  }

  function addTyping() {
    if (emptyEl) emptyEl.style.display = 'none';
    const msg = document.createElement('div');
    msg.className = 'log-msg';
    msg.innerHTML = `
      <div class="log-avatar ellie-av">E</div>
      <div class="log-body">
        <div class="log-who">Ellie</div>
        <div class="log-bubble ellie-bub">
          <div class="log-typing"><span></span><span></span><span></span></div>
        </div>
      </div>`;
    transcript.appendChild(msg);
    requestAnimationFrame(() => msg.classList.add('show'));
    transcript.scrollTop = transcript.scrollHeight;
    return msg;
  }

  let vapiInstance = null;

  function resetDemo() {
    clearAllTimeouts();
    clearInterval(timerInterval);
    timerSecs = 0;
    demoActive = false;
    if (vapiInstance) { try { vapiInstance.stop(); } catch(_) {} vapiInstance = null; }
    transcript.innerHTML = '';
    if (emptyEl) { transcript.appendChild(emptyEl); emptyEl.style.display = ''; }
    setStatus('Ready to call', false);
    setWave(false);
    setAvatarState('idle');
    timerEl.textContent = '';
    btns.className = 'phone-btns phone-btns-idle';
    callBtn.style.display = '';
    endBtn.style.display  = 'none';
  }

  async function startDemo() {
    if (demoActive) return;
    demoActive = true;
    btns.className = 'phone-btns phone-btns-active';
    callBtn.style.display = 'none';
    endBtn.style.display  = '';
    setStatus('Connecting…', false);

    try {
      const enteredUrl = demoBizUrlInput ? demoBizUrlInput.value.trim() : '';
      const websiteForCall = enteredUrl || briefedUrl || null;

      const cfgRes = await fetch('/.netlify/functions/demo-vapi-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessWebsite: websiteForCall }),
      });
      if (!cfgRes.ok) throw new Error('Could not prepare company context');
      const { publicKey, assistantId, assistantOverrides } = await cfgRes.json();

      const VapiClass = (typeof Vapi === 'function') ? Vapi : Vapi.default;
      const vapi = new VapiClass(publicKey);
      vapiInstance = vapi;

      // ── UI events ──────────────────────────────────────────
      vapi.on('call-start', () => {
        setStatus('Connected', true);
        timerSecs = 0;
        timerEl.textContent = '0:00';
        timerInterval = setInterval(() => {
          timerSecs++;
          timerEl.textContent = `${Math.floor(timerSecs/60)}:${String(timerSecs%60).padStart(2,'0')}`;
        }, 1000);
      });

      vapi.on('call-end', () => {
        clearInterval(timerInterval);
        setStatus('Call ended', false);
        setWave(false);
        setAvatarState('idle');
        demoActive = false;
        btns.className = 'phone-btns phone-btns-idle';
        callBtn.style.display = '';
        endBtn.style.display  = 'none';
        vapiInstance = null;
      });

      vapi.on('speech-start', () => {
        setWave(true);
        setAvatarState('speaking');
        setStatus('Ellie is speaking…', true);
      });

      vapi.on('speech-end', () => {
        setWave(false);
        setAvatarState('idle');
        setStatus('Listening…', true);
      });

      vapi.on('message', (msg) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final' && msg.transcript?.trim()) {
          addBubble(msg.role === 'assistant' ? 'ellie' : 'caller', msg.transcript.trim());
        }
      });

      vapi.on('error', (err) => {
        console.error('VAPI error', err);
        setStatus('Could not connect', false);
        resetDemo();
      });

      // ── Start the call with dynamic overrides ─────────────
      vapi.start(assistantId, assistantOverrides);

    } catch (err) {
      console.error('Demo start error', err);
      setStatus('Connection failed', false);
      resetDemo();
    }
  }

  if (callBtn) callBtn.addEventListener('click', startDemo);
  if (endBtn)  endBtn.addEventListener('click',  resetDemo);

  // ── Hero Google Review Carousel ────────────────────────────
  const HERO_REVIEWS = [
    { initials:'MC', color:'a', name:'Mia C.', biz:'Glamour & Co. Hair Studio, Norwood SA', time:'2 days ago',
      text:'We were missing 8–10 calls a day. Now Ellie books them all. Revenue up 35% in the first month. Absolute game changer.' },
    { initials:'DH', color:'b', name:'Daniel H.', biz:'D&H Auto Mechanics, Prospect SA', time:'5 days ago',
      text:"Can't answer when I'm under a car. Ellie answers every single time. Three new regulars in week one from calls I'd normally miss." },
    { initials:'KT', color:'c', name:'Karen T.', biz:'Spotless Cleaning Co., Glenelg SA', time:'1 week ago',
      text:'Set it up Sunday afternoon. By Monday morning Ellie had booked 3 new cleaning jobs. Paid for the whole month in one day.' },
    { initials:'RP', color:'d', name:'Ryan P.', biz:'Prestige Plumbing & Gas, Unley SA', time:'3 days ago',
      text:"Ellie handles all our after-hours emergency call intake. Customers get an immediate response instead of voicemail. Haven't lost a single urgent job." },
    { initials:'SN', color:'e', name:'Sophie N.', biz:'North Adelaide Dental Clinic, SA', time:'6 days ago',
      text:'Our front desk was overwhelmed. Ellie handles the overflow perfectly. Patients love getting an instant answer. Setup took under an hour.' },
    { initials:'JW', color:'f', name:'Jake W.', biz:'Wattle Park Electrical, Burnside SA', time:'4 days ago',
      text:"Customers don't even realise it's AI. Picked up 4 jobs this week alone that came through after 5pm. Game changer for sole traders." },
    { initials:'LB', color:'a', name:'Lisa B.', biz:'Belair Beauty & Spa, Belair SA', time:'1 week ago',
      text:'I run a one-woman spa and used to dread missing calls during treatments. Ellie books clients seamlessly. Bookings up 40%.' },
    { initials:'TM', color:'d', name:'Tom M.', biz:'Modbury Landscaping & Turf, SA', time:'2 weeks ago',
      text:'Landscaping is seasonal and calls flood in during spring. Ellie handled 60+ enquiries in one week without missing a beat. Unreal.' },
    { initials:'AK', color:'e', name:'Anika K.', biz:'Kurralta Park Physio, SA', time:'3 days ago',
      text:'We were losing patients to competitors simply because phones went to voicemail at lunch. Ellie fixed that overnight.' },
  ];

  (function initHeroCarousel() {
    const wrap    = document.getElementById('heroRevWrap');
    const dotsEl  = document.getElementById('heroRevDots');
    const countEl = document.getElementById('heroRevCount');
    const progEl  = document.getElementById('heroRevProgress');
    if (!wrap) return;

    let current = 0, timer = null, progTimer = null;

    function buildCard(r, idx) {
      const div = document.createElement('div');
      div.className = 'hero-rev-card';
      div.dataset.idx = idx;
      div.innerHTML = `
        <div class="hero-rev-top">
          <div class="hero-rev-av hero-rev-av--${r.color}">${r.initials}</div>
          <div>
            <div class="hero-rev-name">${r.name}</div>
            <div class="hero-rev-biz">${r.biz}</div>
          </div>
          <div class="hero-rev-time">${r.time}</div>
        </div>
        <div class="hero-rev-stars">★★★★★</div>
        <p class="hero-rev-text">${r.text}</p>`;
      return div;
    }

    // Build all cards
    HERO_REVIEWS.forEach((r, i) => wrap.appendChild(buildCard(r, i)));

    // Build dots
    HERO_REVIEWS.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'hero-rev-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Review ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dotsEl.appendChild(d);
    });

    function resetProgress() {
      if (progEl) { progEl.style.animation = 'none'; void progEl.offsetWidth; progEl.style.animation = 'revProgress 5s linear forwards'; }
    }

    function goTo(idx) {
      const cards   = wrap.querySelectorAll('.hero-rev-card');
      const dots    = dotsEl.querySelectorAll('.hero-rev-dot');
      const next    = (idx + HERO_REVIEWS.length) % HERO_REVIEWS.length;
      const forward = next > current || (current === HERO_REVIEWS.length - 1 && next === 0);

      // Slide out current
      const cur = wrap.querySelector('.hero-rev-card.active');
      if (cur) {
        cur.classList.remove('active');
        if (!forward) cur.classList.add('to-right');
        cur.classList.add('leaving');
        setTimeout(() => { cur.classList.remove('leaving', 'to-right'); }, 340);
      }

      // Slide in next
      current = next;
      if (!forward) cards[current].classList.add('from-left');
      cards[current].classList.add('active');
      setTimeout(() => cards[current].classList.remove('from-left'), 450);

      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      if (countEl) countEl.textContent = (current + 1) + ' / ' + HERO_REVIEWS.length;
      resetProgress();
    }

    function autoAdvance() { goTo(current + 1); }

    function startAuto() { clearInterval(timer); timer = setInterval(autoAdvance, 5000); }

    goTo(0);
    startAuto();
    wrap.addEventListener('mouseenter', () => { clearInterval(timer); if (progEl) progEl.style.animationPlayState = 'paused'; });
    wrap.addEventListener('mouseleave', () => { startAuto(); if (progEl) progEl.style.animationPlayState = 'running'; });
  })();

  // ── Hero headline rotator ─────────────────────────────────
  (function initHeadlineRotator() {
    const h1    = document.getElementById('heroH1');
    const line1 = document.getElementById('heroLine1');
    const line2 = document.getElementById('heroLine2');
    if (!h1 || !line1 || !line2) return;

    const HEADLINES = [
      { l1: 'Every missed call',       l2: 'is money walking out.'          },
      { l1: 'Most human-like',         l2: 'AI receptionist.'               },
      { l1: 'Never miss',              l2: 'another booking.'               },
      { l1: 'Your callers deserve',    l2: 'better than voicemail.'         },
      { l1: '24/7 availability,',      l2: 'zero missed calls.'             },
      { l1: 'Your business answers',   l2: 'every single call.'             },
    ];

    const mobileStartIndex = HEADLINES.findIndex(h => h.l1 === '24/7 availability,');
    let idx = window.matchMedia('(max-width: 600px)').matches && mobileStartIndex >= 0
      ? mobileStartIndex
      : 0;

    line1.textContent = HEADLINES[idx].l1;
    line2.textContent = HEADLINES[idx].l2;

    setInterval(() => {
      idx = (idx + 1) % HEADLINES.length;
      // Exit: line1 slides up, line2 follows 70ms later
      h1.classList.remove('hl-in');
      h1.classList.add('hl-out');
      // After exit completes (~400ms), swap text and enter
      setTimeout(() => {
        line1.textContent = HEADLINES[idx].l1;
        line2.textContent = HEADLINES[idx].l2;
        h1.classList.remove('hl-out');
        h1.classList.add('hl-in');
        // Clean up so next cycle starts fresh
        setTimeout(() => h1.classList.remove('hl-in'), 680);
      }, 400);
    }, 4000);
  })();

  // ── Hero URL bar → visible demo ───────────────────────────
  const heroBizUrl   = document.getElementById('hero-biz-url');
  const heroUrlBtn   = document.getElementById('hero-url-btn');
  const heroDomBadge = document.getElementById('hero-domain-badge');
  const heroDomText  = document.getElementById('hero-domain-text');

  function extractDomain(url) {
    try {
      const s = url.includes('://') ? url : 'https://' + url;
      return new URL(s).hostname.replace(/^www\./, '');
    } catch { return url.trim(); }
  }

  function applyHeroUrl(raw) {
    if (!raw) {
      if (demoBizUrlInput) demoBizUrlInput.focus();
      return;
    }
    const domain = extractDomain(raw);
    if (heroDomText) heroDomText.textContent = domain;
    if (heroDomBadge) heroDomBadge.classList.add('visible');

    // Pre-fill the visible demo and the disabled live-call section if it is re-enabled later.
    if (demoBizUrlInput) demoBizUrlInput.value = raw;
    const liveUrl = document.getElementById('live-website-url');
    if (liveUrl) liveUrl.value = raw;
    applyLiveBriefing(raw);
  }

  if (heroBizUrl) {
    heroBizUrl.addEventListener('input', () => {
      const v = heroBizUrl.value.trim();
      if (heroDomBadge) heroDomBadge.classList.toggle('visible', v.length > 4);
      if (v.length > 4 && heroDomText) heroDomText.textContent = extractDomain(v);
    });
  }

  if (heroUrlBtn) {
    heroUrlBtn.addEventListener('click', () => {
      const url = heroBizUrl ? heroBizUrl.value.trim() : '';
      applyHeroUrl(url);
      if (url && demoBizUrlInput) briefEllie();
      const target = document.getElementById('demo');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── Try Live: website URL briefing ────────────────────────
  const liveWebsiteUrl    = document.getElementById('live-website-url');
  const liveBriefingBadge = document.getElementById('live-briefing-badge');
  const liveBriefingText  = document.getElementById('live-briefing-text');
  const liveDescDefault   = document.getElementById('live-desc-default');
  const liveDescBriefed   = document.getElementById('live-desc-briefed');
  const liveBriefedDomain = document.getElementById('live-briefed-domain');

  function applyLiveBriefing(url) {
    if (!url) return;
    const domain = extractDomain(url);
    if (liveBriefingBadge) liveBriefingBadge.classList.add('visible');
    if (liveBriefingText) liveBriefingText.textContent = 'Ellie is studying ' + domain + '…';
    if (liveBriefedDomain) liveBriefedDomain.textContent = domain;
    if (liveDescDefault) liveDescDefault.classList.add('hidden');
    if (liveDescBriefed) liveDescBriefed.classList.add('visible');
    // After 2s, change to "ready" state
    setTimeout(() => {
      if (liveBriefingText) liveBriefingText.textContent = '✓ Ellie is ready to represent ' + domain;
      if (liveBriefingBadge) liveBriefingBadge.style.background = 'rgba(34,197,94,.07)';
      if (liveBriefingBadge) liveBriefingBadge.style.borderColor = 'rgba(34,197,94,.25)';
      if (liveBriefingBadge) liveBriefingBadge.style.color = '#4ade80';
      const dots = liveBriefingBadge ? liveBriefingBadge.querySelector('.live-briefing-dots') : null;
      if (dots) dots.style.display = 'none';
    }, 2200);
  }

  if (liveWebsiteUrl) {
    let briefDebounce = null;
    liveWebsiteUrl.addEventListener('input', () => {
      clearTimeout(briefDebounce);
      const v = liveWebsiteUrl.value.trim();
      if (!v || v.length < 5) {
        if (liveBriefingBadge) liveBriefingBadge.classList.remove('visible');
        if (liveDescDefault) liveDescDefault.classList.remove('hidden');
        if (liveDescBriefed) liveDescBriefed.classList.remove('visible');
        return;
      }
      // Reset state
      if (liveBriefingBadge) { liveBriefingBadge.style.background = ''; liveBriefingBadge.style.borderColor = ''; liveBriefingBadge.style.color = ''; }
      const dots = liveBriefingBadge ? liveBriefingBadge.querySelector('.live-briefing-dots') : null;
      if (dots) dots.style.display = '';
      briefDebounce = setTimeout(() => applyLiveBriefing(v), 600);
    });
  }

  // ── Live call (outbound via Netlify function) ─────────────
  const liveBiz     = document.getElementById('live-biz');
  const livePhone   = document.getElementById('live-phone');
  const liveCallBtn = document.getElementById('live-call-btn');
  const liveStatus  = document.getElementById('live-status');

  function flashInvalid(el) {
    el.style.borderColor = '#ef4444';
    el.focus();
    setTimeout(() => { el.style.borderColor = ''; }, 1800);
  }

  if (liveCallBtn) {
    liveCallBtn.addEventListener('click', async () => {
      const biz     = liveBiz   ? liveBiz.value.trim()   : '';
      const phone   = livePhone ? livePhone.value.trim() : '';
      const website = liveWebsiteUrl ? liveWebsiteUrl.value.trim() : '';
      if (!phone) { flashInvalid(livePhone); return; }

      liveCallBtn.disabled = true;
      liveStatus.hidden = false;

      if (website) {
        liveStatus.className = 'live-status live-status--calling';
        liveStatus.textContent = 'Briefing Ellie on ' + extractDomain(website) + '…';
        await new Promise(r => setTimeout(r, 1600));
      }

      liveStatus.className = 'live-status live-status--calling';
      liveStatus.textContent = 'Calling your number now…';

      try {
        const res  = await fetch('/.netlify/functions/call-initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, businessType: biz || 'General', businessWebsite: website }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Could not start call');

        liveStatus.className = 'live-status live-status--success';
        liveStatus.textContent = website
          ? 'Ellie is calling you now — she knows your business. Pick up and start talking!'
          : 'Ellie is calling you now! Pick up and start talking.';
        setTimeout(() => { liveCallBtn.disabled = false; liveStatus.hidden = true; }, 35000);
      } catch (err) {
        liveStatus.className = 'live-status live-status--error';
        liveStatus.textContent = err.message || 'Something went wrong — please try again.';
        liveCallBtn.disabled = false;
      }
    });
  }

  // ── FAQ accordion ─────────────────────────────────────────
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-a');
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-a').style.maxHeight = null;
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
    });
  });

  // ── Demo booking form ─────────────────────────────────────
  const demoForm  = document.getElementById('demo-form');
  const ctaSubmit = document.getElementById('cta-submit');

  if (demoForm) {
    demoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      ctaSubmit.disabled = true;
      ctaSubmit.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Request sent! We'll be in touch within 1 business day.`;
      ctaSubmit.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      ctaSubmit.style.boxShadow  = '0 0 28px rgba(34,197,94,.4)';
      demoForm.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
    });
  }

  // ── Dashboard tabs ────────────────────────────────────────
  document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = document.getElementById('dp-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  // ── Dashboard stat counters ───────────────────────────────
  function countUp(el, target, prefix, duration) {
    if (!el) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const val = Math.round(pct * target);
      el.textContent = prefix + (target >= 1000 ? val.toLocaleString() : val);
      if (pct < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target.toLocaleString();
    };
    requestAnimationFrame(step);
  }

  // ── Problem section loss counter ─────────────────────────
  // ── Revenue chart draw animation ─────────────────────────
  const pcLineBad  = document.getElementById('pcLineBad');
  const pcLineGood = document.getElementById('pcLineGood');
  const pcDots     = document.querySelectorAll('.pc-dot, .pc-ellie-marker');
  if (pcLineBad) {
    let drawn = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !drawn) {
        drawn = true;
        pcLineBad.classList.add('pc-drawn');
        pcLineGood.classList.add('pc-drawn');
        setTimeout(() => pcDots.forEach(d => d.classList.add('pc-shown')), 1800);
      }
    }, { threshold: 0.3 }).observe(pcLineBad);
  }

  const probLossEl = document.getElementById('prob-loss-num');
  if (probLossEl) {
    let counted = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        let n = 0; const target = 2400;
        const iv = setInterval(() => {
          n = Math.min(n + 48, target);
          probLossEl.textContent = '$' + n.toLocaleString();
          if (n >= target) clearInterval(iv);
        }, 18);
      }
    }, { threshold: 0.5 }).observe(probLossEl);
  }

  const dashStatsEl = document.querySelector('.dash-stats');
  if (dashStatsEl) {
    let counted = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        countUp(document.getElementById('ds-calls'),    142, '',   1400);
        countUp(document.getElementById('ds-bookings'),  89, '',   1200);
        countUp(document.getElementById('ds-revenue'),  4200, '$', 1600);
      }
    }, { threshold: 0.4 }).observe(dashStatsEl);
  }

  // ── Dashboard bar chart ───────────────────────────────────
  const CHART_DATA = [
    { day: 'Mon', calls: 18, bookings: 11 },
    { day: 'Tue', calls: 24, bookings: 15 },
    { day: 'Wed', calls: 16, bookings: 9  },
    { day: 'Thu', calls: 28, bookings: 18 },
    { day: 'Fri', calls: 32, bookings: 20 },
    { day: 'Sat', calls: 14, bookings: 9  },
    { day: 'Sun', calls: 10, bookings: 6  },
  ];
  const chartEl = document.getElementById('dash-chart');
  if (chartEl) {
    const maxVal = Math.max(...CHART_DATA.map(d => d.calls));
    const MAX_PX = 75;
    CHART_DATA.forEach(d => {
      const callsH    = Math.round(d.calls    / maxVal * MAX_PX);
      const bookingsH = Math.round(d.bookings / maxVal * MAX_PX);
      const col = document.createElement('div');
      col.className = 'bar-col';
      col.innerHTML = `
        <div class="bar-val-lbl">${d.calls}</div>
        <div class="bar-pair">
          <div class="bar-fill bar-fill-v" data-h="${callsH}" style="height:0px"></div>
          <div class="bar-fill bar-fill-r" data-h="${bookingsH}" style="height:0px"></div>
        </div>
        <div class="bar-day-lbl">${d.day}</div>`;
      chartEl.appendChild(col);
    });
    let barAnimated = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !barAnimated) {
        barAnimated = true;
        chartEl.querySelectorAll('.bar-fill').forEach(bar => {
          bar.style.height = bar.dataset.h + 'px';
        });
      }
    }, { threshold: 0.3 }).observe(chartEl);
  }

  // ── Play / pause buttons (calls + recordings) ─────────────
  document.addEventListener('click', e => {
    const btn = e.target.closest('.call-play-btn');
    if (!btn) return;
    const wasPlaying = btn.classList.contains('playing');
    document.querySelectorAll('.call-play-btn.playing').forEach(b => {
      b.classList.remove('playing'); b.textContent = '▶';
    });
    document.querySelectorAll('.rec-row.playing').forEach(r => r.classList.remove('playing'));
    if (!wasPlaying) {
      btn.classList.add('playing'); btn.textContent = '⏸';
      if (btn.classList.contains('rec-play-btn')) btn.closest('.rec-row').classList.add('playing');
      setTimeout(() => {
        btn.classList.remove('playing'); btn.textContent = '▶';
        btn.closest('.rec-row')?.classList.remove('playing');
      }, 8000);
    }
  });

  // ── Integrations hub ─────────────────────────────────────
  (function buildIntHub() {
    const svg = document.getElementById('int-svg');
    if (!svg) return;

    const CX = 300, CY = 300, RADIUS = 210, NODE_R = 28;

    // slug: Simple Icons CDN identifier — https://cdn.simpleicons.org/[slug]/[hexcolor]
    const INT_TOOLS = [
      { name: 'Google',    sub: 'Calendar',   color: '#4285F4', slug: 'googlecalendar' },
      { name: 'Xero',      sub: 'Accounting', color: '#1AB4D7', slug: 'xero'           },
      { name: 'HubSpot',   sub: 'CRM',        color: '#FF7A59', slug: 'hubspot'        },
      { name: 'Stripe',    sub: 'Payments',   color: '#635BFF', slug: 'stripe'         },
      { name: 'ServiceM8', sub: 'Field Jobs', color: '#F59E0B', slug: 'servicem8'      },
      { name: 'Calendly',  sub: 'Scheduling', color: '#4BA1FF', slug: 'calendly'       },
      { name: 'Mailchimp', sub: 'Marketing',  color: '#FFE01B', slug: 'mailchimp'      },
      { name: 'Zapier',    sub: 'Automation', color: '#FF4A00', slug: 'zapier'         },
      { name: 'Sheets',    sub: 'Google',     color: '#34A853', slug: 'googlesheets'   },
      { name: 'Square',    sub: 'Payments',   color: '#FFFFFF', slug: 'square'         },
      { name: 'Cliniko',   sub: 'Practice',   color: '#00C4B4', slug: 'cliniko'        },
      { name: 'MYOB',      sub: 'Accounting', color: '#BB6BD9', slug: 'myob'           },
    ];

    function ns(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }

    function setAttrs(el, attrs) {
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    }

    const linesG    = svg.querySelector('#int-lines');
    const ringsG    = svg.querySelector('#int-rings');
    const nodesG    = svg.querySelector('#int-nodes');
    const particleG = svg.querySelector('#int-particles');

    INT_TOOLS.forEach((tool, i) => {
      const angle = (i / INT_TOOLS.length) * Math.PI * 2 - Math.PI / 2;
      const nx = CX + Math.cos(angle) * RADIUS;
      const ny = CY + Math.sin(angle) * RADIUS;

      // Connection line
      const line = setAttrs(ns('line'), {
        x1: CX, y1: CY, x2: nx, y2: ny,
        stroke: tool.color,
        'stroke-width': '1',
        'stroke-opacity': '0.2',
        'stroke-dasharray': '4 6',
      });
      linesG.appendChild(line);

      // Tool icon — Simple Icons CDN brand logo
      const g = ns('g');
      const IMG = 30;
      const hex = tool.color.replace('#', '');

      // Letter fallback (visible if CDN image fails to load for niche tools)
      const fallback = setAttrs(ns('text'), {
        x: String(nx), y: String(ny + 5),
        'text-anchor': 'middle',
        'font-family': 'Inter,sans-serif',
        'font-size': '15', 'font-weight': '800',
        fill: tool.color,
      });
      fallback.textContent = tool.name[0];
      g.appendChild(fallback);

      // Brand icon from Simple Icons CDN (renders over the fallback)
      const imgEl = setAttrs(ns('image'), {
        href: `https://cdn.simpleicons.org/${tool.slug}/${hex}`,
        x: String(nx - IMG / 2), y: String(ny - IMG / 2),
        width: String(IMG), height: String(IMG),
        filter: 'url(#ig-glow-v)',
      });
      g.appendChild(imgEl);

      // Label positioning based on angle quadrant
      const labelPad = NODE_R + 14;
      const lx = CX + Math.cos(angle) * (RADIUS + labelPad);
      const ly = CY + Math.sin(angle) * (RADIUS + labelPad);
      const anchor = Math.cos(angle) > 0.25 ? 'start' : Math.cos(angle) < -0.25 ? 'end' : 'middle';

      const nameEl = setAttrs(ns('text'), {
        x: lx, y: ly - 2,
        'text-anchor': anchor,
        'font-family': 'Inter,sans-serif',
        'font-size': '10.5',
        'font-weight': '600',
        fill: 'rgba(255,255,255,0.8)',
      });
      nameEl.textContent = tool.name;
      g.appendChild(nameEl);

      const subEl = setAttrs(ns('text'), {
        x: lx, y: ly + 10,
        'text-anchor': anchor,
        'font-family': 'Inter,sans-serif',
        'font-size': '8.5',
        fill: tool.color,
        'fill-opacity': '0.75',
      });
      subEl.textContent = tool.sub;
      g.appendChild(subEl);

      nodesG.appendChild(g);

      // Animated particles along the line
      const pCount = 2;
      for (let p = 0; p < pCount; p++) {
        const inbound = p % 2 === 0;
        const dot = setAttrs(ns('circle'), {
          r: '3',
          fill: tool.color,
          opacity: '0.85',
          filter: 'url(#ig-glow-v)',
        });

        const motionPath = `M ${inbound ? nx : CX} ${inbound ? ny : CY} L ${inbound ? CX : nx} ${inbound ? CY : ny}`;
        const mPath = ns('path');
        mPath.setAttribute('d', motionPath);
        mPath.setAttribute('id', `ipath-${i}-${p}`);
        mPath.setAttribute('fill', 'none');
        mPath.setAttribute('stroke', 'none');
        svg.querySelector('defs').appendChild(mPath);

        const motion = ns('animateMotion');
        motion.setAttribute('dur', (2.4 + i * 0.18 + p * 1.1) + 's');
        motion.setAttribute('repeatCount', 'indefinite');
        motion.setAttribute('begin', (p * 1.2 + i * 0.15) + 's');

        const mref = ns('mpath');
        mref.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#ipath-${i}-${p}`);
        motion.appendChild(mref);
        dot.appendChild(motion);
        particleG.appendChild(dot);
      }
    });

    // Pulse rings on center node
    [60, 80, 105].forEach((r, idx) => {
      const ring = setAttrs(ns('circle'), {
        cx: CX, cy: CY, r,
        fill: 'none',
        stroke: 'rgba(167,139,250,0.35)',
        'stroke-width': '1',
      });
      const anim = setAttrs(ns('animate'), {
        attributeName: 'stroke-opacity',
        values: '0.35;0.05;0.35',
        dur: (2.4 + idx * 0.6) + 's',
        repeatCount: 'indefinite',
        begin: (idx * 0.4) + 's',
      });
      ring.appendChild(anim);
      ringsG.appendChild(ring);
    });

    // Animate connection count to 12
    const connNum = document.getElementById('int-conn-num');
    if (connNum) {
      let counted = false;
      new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !counted) {
          counted = true;
          let n = 0;
          const iv = setInterval(() => {
            n++;
            connNum.textContent = n;
            if (n >= 12) clearInterval(iv);
          }, 90);
        }
      }, { threshold: 0.4 }).observe(svg);
    }
  })();

  // ── Hero avatar idle animation (subtle mouth twitch) ──────
  const heroClip = document.getElementById('hero-ellie-clip');
  if (heroClip) {
    const talkingImg = heroClip.querySelector('.e-photo-talking');
    let talkTimeout = null;

    function scheduleTalk() {
      const delay = 4000 + Math.random() * 6000;
      talkTimeout = setTimeout(() => {
        heroClip.classList.add('is-speaking');
        if (talkingImg) talkingImg.style.opacity = '0.7';
        setTimeout(() => {
          heroClip.classList.remove('is-speaking');
          if (talkingImg) talkingImg.style.opacity = '0';
          scheduleTalk();
        }, 1200 + Math.random() * 1600);
      }, delay);
    }
    scheduleTalk();
  }

  // ── Pricing tabs (mobile) ──────────────────────────────────
  const pricingTabs  = document.querySelectorAll('.pricing-tab');
  const pricingPlans = document.querySelectorAll('.plan');

  function activatePricingTab(index) {
    pricingTabs.forEach(t => t.classList.remove('active'));
    pricingPlans.forEach(p => p.classList.remove('plan-active'));
    if (pricingTabs[index])  pricingTabs[index].classList.add('active');
    if (pricingPlans[index]) pricingPlans[index].classList.add('plan-active');
  }

  pricingTabs.forEach((tab, i) => tab.addEventListener('click', () => activatePricingTab(i)));

  if (window.innerWidth <= 600 && pricingTabs.length) {
    activatePricingTab(1); // default to "Core" (Most Popular)
  }

})();
