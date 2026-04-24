/* ============================================================
   anupama.dev — Main Script
   ============================================================ */

(function () {
  'use strict';

  // ── Theme toggle ──────────────────────────────────────────
  const html       = document.documentElement;
  const themeBtn   = document.getElementById('theme-toggle');
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


  // ── Nav scroll state ──────────────────────────────────────
  const nav = document.getElementById('nav');
  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 48);
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();


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
      spans[0].style.transform = '';
      spans[1].style.opacity   = '';
      spans[2].style.transform = '';
    }
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.querySelectorAll('span').forEach(s => {
        s.style.transform = s.style.opacity = '';
      });
    });
  });


  // ── Scroll reveal ─────────────────────────────────────────
  const revealObserver = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  // ── Counter animation ─────────────────────────────────────
  function animateCounter(el) {
    const target   = parseInt(el.dataset.count, 10);
    const suffix   = el.dataset.suffix || '';
    const duration = 1800;
    const t0       = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / duration, 1);
      el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const counterObserver = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        const n = e.target.querySelector('.stats__number');
        if (n) animateCounter(n);
        counterObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.6 }
  );

  // Called after all render functions have injected DOM
  function initObservers() {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    document.querySelectorAll('.stats__item').forEach(el => counterObserver.observe(el));
  }


  // ── Active nav link ───────────────────────────────────────
  const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  const sectionObserver = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--text)' : '';
        });
      }
    }),
    { threshold: 0.4 }
  );
  document.querySelectorAll('section[id]').forEach(s => sectionObserver.observe(s));


  // ══════════════════════════════════════════════════════════
  //  FUTURISTIC AI EFFECTS
  // ══════════════════════════════════════════════════════════


  // ── 1. Neural Network Canvas ──────────────────────────────
  (function initNeuralNetwork() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let raf;
    let paused = false;
    let mouseX = -9999, mouseY = -9999;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      buildParticles();
    }

    function buildParticles() {
      const count = Math.min(90, Math.floor((canvas.width * canvas.height) / 11000));
      particles = Array.from({ length: count }, () => ({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  Math.random() * 1.5 + 0.5,
        o:  Math.random() * 0.45 + 0.1,
      }));
    }

    function draw() {
      if (paused) { raf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = html.getAttribute('data-theme') !== 'light';
      const baseColor = isDark ? '99,102,241' : '83,85,212';
      const lineColor = isDark ? '99,102,241' : '83,85,212';
      const maxDist = 140;
      const mouseDist = 180;

      particles.forEach(p => {
        // move
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // subtle mouse attraction
        const mdx = mouseX - p.x, mdy = mouseY - p.y;
        const md  = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < mouseDist && md > 0) {
          p.x += (mdx / md) * 0.4;
          p.y += (mdy / md) * 0.4;
        }

        // draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseColor},${p.o})`;
        ctx.fill();
      });

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx   = particles[i].x - particles[j].x;
          const dy   = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${lineColor},${0.18 * (1 - dist / maxDist)})`;
            ctx.lineWidth   = 0.6;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', () => { paused = document.hidden; });
    resize();
    draw();
  })();


  // ── 2. Custom Cursor Glow ─────────────────────────────────
  (function initCursorGlow() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // skip touch devices
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let tx = 0, ty = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

    function animGlow() {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      glow.style.transform = `translate(${cx - 300}px, ${cy - 300}px)`;
      requestAnimationFrame(animGlow);
    }
    animGlow();
  })();


  // ── 3. Glitch effect on hero headline ─────────────────────
  (function initGlitch() {
    const headline = document.querySelector('.hero__headline');
    if (!headline) return;

    // Inject two transparent overlay layers
    for (let i = 0; i < 2; i++) {
      const layer = document.createElement('div');
      layer.className = 'glitch-layer';
      layer.setAttribute('aria-hidden', 'true');
      layer.innerHTML = headline.innerHTML;
      headline.appendChild(layer);
    }

    function triggerGlitch() {
      headline.classList.add('is-glitching');
      setTimeout(() => headline.classList.remove('is-glitching'), 500);
      // schedule next glitch: every 4–10 s
      setTimeout(triggerGlitch, 4000 + Math.random() * 6000);
    }
    setTimeout(triggerGlitch, 3000 + Math.random() * 2000);
  })();


  // ── 4. Text Scramble on section titles ────────────────────
  const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#@$%&ABCDEFGHIJabcdefghij0123456789';

  class TextScramble {
    constructor(el) {
      this.el      = el;
      this.queue   = [];
      this.raf     = null;
      this._resolve = null;
    }
    scramble(text) {
      const prev = this.el.innerText;
      const len  = Math.max(prev.length, text.length);
      this.queue = Array.from({ length: len }, (_, i) => ({
        from:  prev[i] || '',
        to:    text[i] || '',
        start: Math.floor(Math.random() * 12),
        end:   Math.floor(Math.random() * 12) + 12,
        char:  '',
      }));
      cancelAnimationFrame(this.raf);
      this.frame = 0;
      return new Promise(resolve => {
        this._resolve = resolve;
        this._tick();
      });
    }
    _tick() {
      let out = '', done = 0;
      this.queue.forEach(item => {
        if (this.frame >= item.end) {
          done++;
          out += item.to;
        } else if (this.frame >= item.start) {
          if (!item.char || Math.random() < 0.3) {
            item.char = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
          out += `<span class="scramble-char">${item.char}</span>`;
        } else {
          out += item.from;
        }
      });
      this.el.innerHTML = out;
      if (done < this.queue.length) {
        this.frame++;
        this.raf = requestAnimationFrame(() => this._tick());
      } else if (this._resolve) {
        this._resolve();
        this._resolve = null;
      }
    }
  }

  // ── Hero headline continuous scramble loop ────────────────
  (function initHeroLoop() {
    const el1 = document.querySelector('.hero__line1');
    const el2 = document.querySelector('.hero__line2');
    if (!el1 || !el2) return;

    const phrases = (window.SITE_DATA && window.SITE_DATA.heroPhrases) || [];
    if (!phrases.length) return;

    const fx1 = new TextScramble(el1);
    const fx2 = new TextScramble(el2);
    let index = 0;

    async function cycle() {
      const { line1, line2 } = phrases[index];
      index = (index + 1) % phrases.length;
      await Promise.all([fx1.scramble(line1), fx2.scramble(line2)]);
      setTimeout(cycle, 3500);
    }

    setTimeout(cycle, 4000);
  })();

  // ── Render: Stats ─────────────────────────────────────────
  (function renderStats() {
    const container = document.getElementById('stats-container');
    if (!container || !window.SITE_DATA) return;
    container.innerHTML = SITE_DATA.stats.map((s, i) => `
      <div class="stats__item">
        <div class="stats__number" data-count="${s.count}" data-suffix="${s.suffix}">${s.count}${s.suffix}</div>
        <div class="stats__label">${s.label}</div>
      </div>
      ${i < SITE_DATA.stats.length - 1 ? '<div class="stats__divider"></div>' : ''}
    `).join('');
  })();

  // ── Render: Services ──────────────────────────────────────
  (function renderServices() {
    const grid = document.getElementById('services-grid');
    if (!grid || !window.SITE_DATA) return;
    grid.innerHTML = SITE_DATA.services.map(s => `
      <div class="service-card reveal">
        <div class="service-card__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${s.iconPath}</svg>
        </div>
        <h3 class="service-card__title">${s.title}</h3>
        <p class="service-card__desc">${s.desc}</p>
        <ul class="service-card__list">
          ${s.list.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  })();

  // ── Render: Projects grid ─────────────────────────────────
  (function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid || !window.SITE_DATA) return;
    const arrowSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M7 7h10v10"/></svg>`;
    grid.innerHTML = SITE_DATA.projects.map(p => `
      <div class="project-card reveal">
        <div class="project-card__image ${p.imageClass}">
          <img src="${p.imageSrc}" alt="${p.imageAlt}" class="project-card__img" loading="lazy">
          <div class="project-card__overlay">
            <div class="project-card__tags">
              ${p.tags.map(t => `<span>${t}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="project-card__content">
          <span class="project-card__category">${p.category}</span>
          <h3 class="project-card__title">${p.title}</h3>
          <p class="project-card__desc">${p.desc}</p>
          <a href="${p.link}" target="_blank" rel="noopener" class="project-card__link">
            ${p.linkLabel} ${arrowSvg}
          </a>
        </div>
      </div>
    `).join('');
  })();

  // ── Render: Tech stack ────────────────────────────────────
  (function renderTechStack() {
    const container = document.getElementById('tech-groups');
    if (!container || !window.SITE_DATA) return;
    container.innerHTML = SITE_DATA.techStack.map(g => `
      <div class="tech__group">
        <h4 class="tech__group-label">${g.label}</h4>
        <div class="tech__pills">
          ${g.pills.map(p => `<span>${p}</span>`).join('')}
        </div>
      </div>
    `).join('');
  })();

  // Wire up observers now that all dynamic content is in the DOM
  initObservers();

  // ── Contact form submission ───────────────────────────────
  (function initContactForm() {
    const form      = document.getElementById('contact-form');
    const submitBtn = document.getElementById('cf-submit');
    const status    = document.getElementById('cf-status');
    if (!form || !submitBtn || !status) return;

    const btnLabel   = submitBtn.querySelector('.cf-btn-label');
    const endpoint   = window.SITE_DATA ? window.SITE_DATA.formEndpoint : '';
    const fallbackTo = 'anupama.dilshan@icloud.com';

    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Validate required fields
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(field => {
        if (!field.value.trim()) {
          field.classList.add('error');
          valid = false;
        } else {
          field.classList.remove('error');
        }
      });
      if (!valid) {
        status.textContent = 'Please fill in all required fields.';
        status.className = 'contact-form__status contact-form__status--error';
        return;
      }

      // No Formspree endpoint — fall back to mailto
      if (!endpoint) {
        const data = new FormData(form);
        const body = [...data.entries()]
          .filter(([, v]) => v)
          .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
          .join('\n');
        window.location.href = `mailto:${fallbackTo}?subject=${encodeURIComponent('Project Inquiry')}&body=${encodeURIComponent(body)}`;
        return;
      }

      // Submit via Formspree
      submitBtn.disabled = true;
      btnLabel.textContent = 'Sending…';
      status.className = 'contact-form__status';
      status.textContent = '';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          status.textContent = "✓ Received! I'll review your requirements and send a quote within 1 business day.";
          status.className = 'contact-form__status contact-form__status--success';
          form.reset();
        } else {
          throw new Error();
        }
      } catch {
        status.textContent = `Something went wrong. Please email me directly at ${fallbackTo}`;
        status.className = 'contact-form__status contact-form__status--error';
      } finally {
        submitBtn.disabled = false;
        btnLabel.textContent = 'Send My Requirements';
      }
    });

    // Clear error highlight as user types
    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => field.classList.remove('error'));
    });
  })();

  // Trigger scramble once when each section-title enters the viewport
  const scrambleObserver = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        const saved = e.target.dataset.originalText || e.target.innerText;
        e.target.dataset.originalText = saved;
        const fx = new TextScramble(e.target);
        fx.scramble(saved);
        scrambleObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.6 }
  );
  document.querySelectorAll('.section-title').forEach(el => scrambleObserver.observe(el));


  // ── 5. Magnetic Buttons ───────────────────────────────────
  (function initMagnetic() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.querySelectorAll('.btn--primary, .nav__cta').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r   = btn.getBoundingClientRect();
        const dx  = e.clientX - (r.left + r.width  / 2);
        const dy  = e.clientY - (r.top  + r.height / 2);
        btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.22}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  })();


  // ── 6. Service card — 3D tilt + cursor spotlight ─────────
  (function initCardTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // skip touch

    document.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r   = card.getBoundingClientRect();
        const x   = e.clientX - r.left;
        const y   = e.clientY - r.top;
        const cx  = r.width  / 2;
        const cy  = r.height / 2;

        // tilt: max ±7 deg
        const rotX = -((y - cy) / cy) * 7;
        const rotY =  ((x - cx) / cx) * 7;

        card.style.transform =
          `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px) scale(1.015)`;

        // spotlight: soft radial glow that follows the cursor
        const isDark = html.getAttribute('data-theme') !== 'light';
        const glow   = isDark
          ? `rgba(99,102,241,0.11)`
          : `rgba(83,85,212,0.08)`;
        card.style.background =
          `radial-gradient(circle at ${x}px ${y}px, ${glow} 0%, var(--card) 55%)`;
      });

      card.addEventListener('mouseleave', () => {
        // smooth spring-back via a short CSS transition burst
        card.style.transition =
          'transform 0.55s cubic-bezier(0.23,1,0.32,1), border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), background 0.3s ease';
        card.style.transform  = '';
        card.style.background = '';
        // restore original transition after spring finishes
        setTimeout(() => {
          card.style.transition = '';
        }, 560);
      });

      // disable tilt while entering (avoid jump on fast cursor)
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease), background 0.15s ease';
      });
    });
  })();


  // ── 8. Floating data streams in hero ──────────────────────
  (function initStreams() {
    const heroEl = document.querySelector('.hero__bg');
    if (!heroEl) return;
    const count = 10;

    for (let i = 0; i < count; i++) {
      const stream   = document.createElement('div');
      stream.className = 'hero__stream';
      const height   = 60 + Math.random() * 120;
      const duration = 4 + Math.random() * 6;
      const delay    = Math.random() * -10; // stagger start
      stream.style.cssText = `
        left: ${Math.random() * 100}%;
        height: ${height}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: ${0.3 + Math.random() * 0.4};
      `;
      heroEl.appendChild(stream);
    }
  })();


  // ── 9. Subtle hero orb parallax ───────────────────────────
  const orbs = document.querySelectorAll('.hero__orb');
  window.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    orbs.forEach((orb, i) => {
      const f = (i + 1) * 9;
      orb.style.transform = `translate(${dx * f}px, ${dy * f}px)`;
    });
  }, { passive: true });


})();
