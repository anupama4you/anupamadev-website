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
  const DEMO_SCRIPT = [
    { role: 'ellie',  text: "Hi, thanks for calling Luxe Hair Studio on Rundle Street! This is Ellie — how can I help you today?", delay: 800 },
    { role: 'caller', text: "Hi, I'd like to book a haircut for Saturday if possible?", delay: 3200 },
    { role: 'ellie',  text: "Of course! We have availability on Saturday — would 9:30 AM or 2:00 PM work better for you?", delay: 2800 },
    { role: 'caller', text: "9:30 sounds perfect.", delay: 3000 },
    { role: 'ellie',  text: "Wonderful! Can I get your name and a mobile number for the confirmation SMS?", delay: 2600 },
    { role: 'caller', text: "Sarah Mitchell, 0412 345 678.", delay: 3400 },
    { role: 'ellie',  text: "Perfect! I've booked you in for Saturday at 9:30 AM. You'll receive an SMS confirmation shortly. Is there anything else I can help with?", delay: 2800 },
    { role: 'caller', text: "No that's great, thank you!", delay: 3000 },
    { role: 'ellie',  text: "You're welcome, Sarah! We look forward to seeing you Saturday. Have a wonderful day!", delay: 2600 },
  ];

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

  function resetDemo() {
    clearAllTimeouts();
    clearInterval(timerInterval);
    timerSecs = 0;
    demoActive = false;
    transcript.innerHTML = '';
    if (emptyEl) { transcript.appendChild(emptyEl); emptyEl.style.display = ''; }
    setStatus('Ready to play', false);
    setWave(false);
    setAvatarState('idle');
    timerEl.textContent = '';
    btns.className = 'phone-btns phone-btns-idle';
    callBtn.style.display = '';
    endBtn.style.display  = 'none';
  }

  function startDemo() {
    if (demoActive) return;
    demoActive = true;
    btns.className = 'phone-btns phone-btns-active';
    callBtn.style.display = 'none';
    endBtn.style.display  = '';

    timerSecs = 0;
    timerEl.textContent = '0:00';
    timerInterval = setInterval(() => {
      timerSecs++;
      timerEl.textContent = `${Math.floor(timerSecs / 60)}:${String(timerSecs % 60).padStart(2,'0')}`;
    }, 1000);

    setStatus('Connecting...', false);
    setWave(false);

    scheduleTimeout(() => {
      setStatus('Connected', true);
      setWave(true);
      setAvatarState('speaking');

      let cursor = 0;
      let cumulativeDelay = 400;

      function playNext() {
        if (cursor >= DEMO_SCRIPT.length) {
          scheduleTimeout(() => {
            setStatus('Call ended', false);
            setWave(false);
            setAvatarState('idle');
            clearInterval(timerInterval);
            demoActive = false;
            btns.className = 'phone-btns phone-btns-idle';
            callBtn.style.display = '';
            endBtn.style.display  = 'none';
          }, 800);
          return;
        }

        const line = DEMO_SCRIPT[cursor];
        cursor++;

        if (line.role === 'ellie') {
          setStatus('Ellie is speaking...', true);
          setWave(true);
          setAvatarState('speaking');
          const typingEl = addTyping();
          scheduleTimeout(() => {
            typingEl.remove();
            addBubble('ellie', line.text);
            setStatus('Listening...', true);
            setWave(false);
            setAvatarState('idle');
            scheduleTimeout(playNext, line.delay);
          }, 1200);
        } else {
          setStatus('Caller is speaking...', true);
          setWave(false);
          setAvatarState('idle');
          scheduleTimeout(() => {
            addBubble('caller', line.text);
            setStatus('Ellie is speaking...', true);
            scheduleTimeout(playNext, 600);
          }, line.delay);
        }
      }

      playNext();
    }, 1200);
  }

  if (callBtn) callBtn.addEventListener('click', startDemo);
  if (endBtn)  endBtn.addEventListener('click',  resetDemo);

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
      const biz   = liveBiz   ? liveBiz.value.trim()   : '';
      const phone = livePhone ? livePhone.value.trim() : '';
      if (!biz)   { flashInvalid(liveBiz);   return; }
      if (!phone) { flashInvalid(livePhone); return; }

      liveCallBtn.disabled = true;
      liveStatus.hidden = false;
      liveStatus.className = 'live-status live-status--calling';
      liveStatus.textContent = 'Calling your number now...';

      try {
        const res  = await fetch('/.netlify/functions/call-initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, businessType: biz }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Could not start call');

        liveStatus.className = 'live-status live-status--success';
        liveStatus.textContent = 'Ellie is calling you now! Pick up and start talking.';
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

})();
