/**
 * Efexis — Premium Interactive JavaScript
 * Animations & interactions inspired by wibify.agency
 * 
 * Features:
 * 1. Navigation (burger, overlay, scroll-aware)
 * 2. Hero entrance choreography
 * 3. Scroll reveal with stagger
 * 4. Text-roll hover (CSS-driven, JS touch support)
 * 5. FAQ accordion
 * 6. Animated stats counter
 * 7. Contact form validation
 * 8. Smooth scroll
 * 9. Magnetic hover effects
 * 10. Parallax-lite on hero
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSectionRail();
  initScrollProgress();
  initKineticScroll();
  initAmbientSystem();
  initCursorGlow();
  initHeroNetwork();
  initHeroEntrance();
  initCommunityReviews();
  initScrollReveal();
  initTextRoll();
  initFAQ();
  initReviewTicker();
  initStatsCounter();
  initContactForm();
  initSmoothScroll();
  initInteractiveSurfaces();
  initButtonInteractions();
  initSectionDepth();
  initMagneticButtons();
  initParallaxHero();
  initCardTilt();
});

/* ===================================================================
   1. NAVIGATION
   =================================================================== */
function initNav() {
  const burger = document.getElementById('burgerBtn');
  const overlay = document.getElementById('menuOverlay');
  const navLinks = document.querySelectorAll('.menu-link');
  const body = document.body;

  if (!burger || !overlay) return;

  const toggle = () => {
    const isOpen = overlay.classList.toggle('open');
    burger.classList.toggle('open');
    burger.setAttribute('aria-expanded', isOpen);
    overlay.setAttribute('aria-hidden', !isOpen);
    body.style.overflow = isOpen ? 'hidden' : '';
  };

  burger.addEventListener('click', toggle);

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (overlay.classList.contains('open')) toggle();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) toggle();
  });

  // Scroll-aware nav with smooth transition
  let lastScroll = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const nav = document.querySelector('.nav');
        if (nav) {
          const scrollY = window.scrollY;
          nav.classList.toggle('scrolled', scrollY > 60);

          if (scrollY > 400) {
            if (scrollY > lastScroll + 5) {
              nav.style.transform = 'translateY(-100%)';
            } else if (scrollY < lastScroll - 5) {
              nav.style.transform = 'translateY(0)';
            }
          } else {
            nav.style.transform = 'translateY(0)';
          }
          lastScroll = scrollY;
        }
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ===================================================================
   2. SECTION RAIL
   =================================================================== */
function initSectionRail() {
  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'about', label: 'About' },
    { id: 'process', label: 'Process' },
    { id: 'faq', label: 'FAQ' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' }
  ].map(item => ({ ...item, element: document.getElementById(item.id) }))
    .filter(item => item.element);

  if (!sections.length) return;

  const rail = document.createElement('nav');
  rail.className = 'section-rail';
  rail.setAttribute('aria-label', 'Section navigation');
  rail.innerHTML = sections
    .map((section, index) => `<a href="#${section.id}" data-section="${section.id}"><span>${String(index + 1).padStart(2, '0')} ${section.label}</span></a>`)
    .join('');
  document.body.appendChild(rail);

  const links = [...rail.querySelectorAll('a')];

  rail.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    const navHeight = document.querySelector('.nav')?.offsetHeight || 72;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - navHeight,
      behavior: 'smooth'
    });
  });

  const updateActive = () => {
    const midpoint = window.innerHeight * 0.48;
    let active = sections[0]?.id;

    sections.forEach(section => {
      const rect = section.element.getBoundingClientRect();
      if (rect.top <= midpoint && rect.bottom >= midpoint) {
        active = section.id;
      }
    });

    links.forEach(link => {
      link.classList.toggle('is-active', link.dataset.section === active);
    });
  };

  window.addEventListener('scroll', () => requestAnimationFrame(updateActive), { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();
}

/* ===================================================================
   3. SCROLL PROGRESS
   =================================================================== */
function initScrollProgress() {
  const progress = document.querySelector('.page-progress span');
  const hero = document.querySelector('.hero');
  if (!progress) return;

  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  let ticking = false;
  const easeOut = value => 1 - Math.pow(1 - value, 3);

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    document.body.style.setProperty('--scroll-progress', ratio.toFixed(4));

    if (hero) {
      const fadeDistance = Math.max(hero.offsetHeight * 0.72, 1);
      const fadeProgress = Math.min(Math.max(window.scrollY / fadeDistance, 0), 1);
      const eased = easeOut(fadeProgress);
      const fade = Math.max(1 - eased, 0);
      hero.style.setProperty('--hero-fade', fade.toFixed(3));
      hero.style.setProperty('--hero-blur', `${(eased * 4).toFixed(2)}px`);
      hero.style.pointerEvents = fade < 0.12 ? 'none' : '';
      document.body.classList.toggle('is-beyond-hero', fade < 0.58);
    }

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('load', update);
  window.addEventListener('pageshow', update);
  update();
  setTimeout(update, 0);
  setTimeout(update, 250);
}

function initKineticScroll() {
  let lastY = window.scrollY;
  let lastTime = performance.now();
  let scrollTimer = null;
  let ticking = false;

  const update = () => {
    const now = performance.now();
    const deltaY = window.scrollY - lastY;
    const deltaTime = Math.max(now - lastTime, 16);
    const velocity = Math.max(Math.min(deltaY / deltaTime, 1.6), -1.6);

    document.body.style.setProperty('--scroll-velocity', velocity.toFixed(3));
    document.body.classList.add('is-scrolling');

    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      document.body.classList.remove('is-scrolling');
      document.body.style.setProperty('--scroll-velocity', '0');
    }, 180);

    lastY = window.scrollY;
    lastTime = now;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

function initAmbientSystem() {
  const layer = document.querySelector('.ambient-system');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!layer || reduceMotion) return;

  const colors = [
    { color: '#99ff00', glow: 'rgba(153, 255, 0, 0.46)' },
    { color: '#8bdcff', glow: 'rgba(139, 220, 255, 0.38)' },
    { color: '#b799ff', glow: 'rgba(183, 153, 255, 0.32)' }
  ];

  Array.from({ length: 26 }, (_, index) => {
    const particle = document.createElement('span');
    const palette = colors[index % colors.length];
    particle.className = 'ambient-particle';
    particle.style.setProperty('--particle-x', `${Math.round(4 + Math.random() * 92)}%`);
    particle.style.setProperty('--particle-y', `${Math.round(5 + Math.random() * 90)}%`);
    particle.style.setProperty('--particle-size', `${(1.5 + Math.random() * 2.8).toFixed(1)}px`);
    particle.style.setProperty('--particle-duration', `${(6 + Math.random() * 7).toFixed(2)}s`);
    particle.style.setProperty('--particle-delay', `${(-Math.random() * 8).toFixed(2)}s`);
    particle.style.setProperty('--particle-drift-x', `${Math.round((Math.random() - 0.5) * 80)}px`);
    particle.style.setProperty('--particle-drift-y', `${Math.round(-20 - Math.random() * 60)}px`);
    particle.style.setProperty('--particle-color', palette.color);
    particle.style.setProperty('--particle-glow', palette.glow);
    layer.appendChild(particle);
    return particle;
  });
}

/* ===================================================================
   3. CURSOR GLOW
   =================================================================== */
function initCursorGlow() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(dot);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;
  let raf = null;

  const animate = () => {
    currentX += (mouseX - currentX) * 0.16;
    currentY += (mouseY - currentY) * 0.16;
    document.body.style.setProperty('--cursor-x', `${currentX}px`);
    document.body.style.setProperty('--cursor-y', `${currentY}px`);
    raf = requestAnimationFrame(animate);
  };

  window.addEventListener('pointermove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    document.body.classList.add('cursor-ready');
    if (!raf) raf = requestAnimationFrame(animate);
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    const target = event.target.closest('a, button, input, textarea, .service-card, .process-card, .about-stat-card, .review-card, .faq-question');
    document.body.classList.toggle('cursor-interactive', Boolean(target));
  });

  window.addEventListener('pointerleave', () => {
    document.body.classList.remove('cursor-ready');
    document.body.classList.remove('cursor-interactive');
  });
}

/* ===================================================================
   4. HERO NETWORK CANVAS
   =================================================================== */
function initHeroNetwork() {
  const canvas = document.getElementById('heroNetwork');
  const hero = document.querySelector('.hero');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || !hero || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  const pointer = { x: 0.5, y: 0.45, active: false };
  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let raf = null;
  let running = false;

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    width = Math.max(rect.width, 1);
    height = Math.max(rect.height, 1);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = width < 760 ? 34 : 58;
    nodes = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      base: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.18,
      r: index % 9 === 0 ? 1.7 : 1.1
    }));
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, width, height);

    const px = pointer.x * width;
    const py = pointer.y * height;

    nodes.forEach((node, index) => {
      node.x += node.vx + Math.sin(time * 0.00035 + node.base) * 0.045;
      node.y += node.vy + Math.cos(time * 0.0003 + node.base) * 0.035;

      if (node.x < -20) node.x = width + 20;
      if (node.x > width + 20) node.x = -20;
      if (node.y < -20) node.y = height + 20;
      if (node.y > height + 20) node.y = -20;

      const pointerDistance = Math.hypot(node.x - px, node.y - py);
      const pull = pointer.active ? Math.max(0, 1 - pointerDistance / 240) : 0;
      const x = node.x + (px - node.x) * pull * 0.04;
      const y = node.y + (py - node.y) * pull * 0.04;

      for (let j = index + 1; j < nodes.length; j += 1) {
        const other = nodes[j];
        const dx = x - other.x;
        const dy = y - other.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 150) {
          const alpha = (1 - distance / 150) * 0.16;
          ctx.strokeStyle = `rgba(153, 255, 0, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = pointerDistance < 180 ? 'rgba(139, 220, 255, 0.72)' : 'rgba(153, 255, 0, 0.48)';
      ctx.beginPath();
      ctx.arc(x, y, node.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (running) {
      raf = requestAnimationFrame(draw);
    }
  };

  const start = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(draw);
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  };

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.active = true;
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    pointer.active = false;
  });

  window.addEventListener('resize', resize);
  resize();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        start();
      } else {
        stop();
      }
    });
  }, { threshold: 0.08 });

  observer.observe(hero);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else if (hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < window.innerHeight) {
      start();
    }
  });
}

/* ===================================================================
   5. HERO ENTRANCE CHOREOGRAPHY
   All hero animations are CSS-driven via animation-delay.
   JS only needs to handle the stats that have data-count (counter).
   This function does a slight enhancement: adding a loaded class
   to body so CSS can key off it if needed.
   =================================================================== */
function initHeroEntrance() {
  // Mark body as loaded after a tick so CSS animations start cleanly
  requestAnimationFrame(() => {
    document.body.classList.add('loaded');
  });

  // Trigger hero-stat separators to fade in
  const seps = document.querySelectorAll('.hero-stat-sep');
  seps.forEach((sep, i) => {
    sep.style.opacity = '0';
    sep.style.transition = `opacity 0.6s ease ${1.9 + i * 0.1}s`;
    requestAnimationFrame(() => {
      sep.style.opacity = '1';
    });
  });
}

/* ===================================================================
   3. SCROLL REVEAL — IntersectionObserver with stagger support
   =================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) return;

  document.querySelectorAll('section, .expertise-grid, .process-grid, .about-stats, .faq-list, .featured-reviews, .reviews-wall').forEach(group => {
    group.querySelectorAll(':scope > .reveal, :scope > article.reveal, :scope > li.reveal').forEach((el, index) => {
      if (!el.style.getPropertyValue('--reveal-order')) {
        el.style.setProperty('--reveal-order', Math.min(index, 6));
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        requestAnimationFrame(() => {
          entry.target.classList.add('visible');
          if (entry.target.classList.contains('process-card')) {
            entry.target.closest('.process-grid')?.classList.add('visible-line');
          }
        });
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

/* ===================================================================
   4. TEXT ROLL — Touch support for mobile
   CSS handles the hover animation via .text-roll-letter translateY
   =================================================================== */
function initTextRoll() {
  const textRolls = document.querySelectorAll('.text-roll');

  textRolls.forEach(roll => {
    // Touch devices: toggle active class
    roll.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      roll.classList.add('active');
    }, { passive: true });

    roll.addEventListener('touchend', () => {
      setTimeout(() => roll.classList.remove('active'), 800);
    }, { passive: true });
  });
}

/* ===================================================================
   5. FAQ ACCORDION — Single-open with smooth expand
   =================================================================== */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!question) return;

    if (answer) answer.style.setProperty('--answer-height', '0px');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all others
      faqItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const btn = other.querySelector('.faq-question');
          const otherAnswer = other.querySelector('.faq-answer');
          if (btn) btn.setAttribute('aria-expanded', 'false');
          if (otherAnswer) otherAnswer.style.setProperty('--answer-height', '0px');
        }
      });

      // Toggle current
      item.classList.toggle('open', !isOpen);
      question.setAttribute('aria-expanded', !isOpen);
      if (answer) {
        answer.style.setProperty('--answer-height', !isOpen ? `${answer.scrollHeight}px` : '0px');
      }
    });
  });

  window.addEventListener('resize', () => {
    faqItems.forEach(item => {
      if (!item.classList.contains('open')) return;
      const answer = item.querySelector('.faq-answer');
      if (answer) answer.style.setProperty('--answer-height', `${answer.scrollHeight}px`);
    });
  });
}

function initReviewTicker() {
  const carousel = document.querySelector('.hero-review-carousel');
  if (!carousel) return;

  const slides = [...carousel.querySelectorAll('.hero-review-slide')];
  if (slides.length < 2) return;

  let index = 0;
  let timer = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const show = (nextIndex) => {
    slides[index]?.classList.remove('is-active');
    index = nextIndex % slides.length;
    slides[index]?.classList.add('is-active');
  };

  if (reduceMotion) {
    slides.forEach((slide, slideIndex) => {
      slide.style.animation = 'none';
      slide.style.opacity = slideIndex === 0 ? '1' : '0';
      slide.style.transform = slideIndex === 0 ? 'translateY(0)' : 'translateY(24px)';
      slide.style.filter = slideIndex === 0 ? 'blur(0)' : 'blur(10px)';
    });
    return;
  }

  timer = setInterval(() => show(index + 1), 5000);
  carousel.addEventListener('mouseenter', () => {
    slides.forEach(slide => { slide.style.animationPlayState = 'paused'; });
    clearInterval(timer);
  });
  carousel.addEventListener('mouseleave', () => {
    slides.forEach(slide => { slide.style.animationPlayState = ''; });
    timer = setInterval(() => show(index + 1), 5000);
  });
}

function initCommunityReviews() {
  const grid = document.getElementById('communityReviewGrid');
  if (!grid) return;

  const names = [
    'Aarav K.', 'Maya P.', 'Nikhil R.', 'Sofia L.', 'Tenzin G.', 'Priya S.', 'Daniel M.', 'Ishaan V.',
    'Milan T.', 'Nora A.', 'Kabir D.', 'Leah C.', 'Samir B.', 'Anika R.', 'Rohan M.', 'Clara J.',
    'Dev S.', 'Yuna K.', 'Marcus H.', 'Sana T.', 'Ethan W.', 'Ritika N.', 'Noah B.', 'Ira M.'
  ];
  const roles = [
    'Windows 11 user', 'Quest collector', 'Student gamer', 'Desktop power user', 'Reward hunter',
    'Low-storage setup', 'Privacy-focused player', 'Casual Discord user', 'Automation tester', 'Laptop user'
  ];
  const comments = [
    'Saved me from installing another huge game just to claim one Discord reward. The dummy file approach is exactly what I needed.',
    'Clean, fast, and surprisingly simple. I opened it, selected the quest, and Discord picked it up almost instantly.',
    'The app feels lightweight and focused. I like that it does one job instead of burying everything under menus.',
    'Worked great after I moved it out of a protected Windows folder. The setup is quick once you know where to place it.',
    'I was skeptical at first, but it handled the quest presence without making my laptop sound like it was taking off.',
    'Perfect for people with tiny SSDs. I would rather use this than download a massive game I will uninstall ten minutes later.',
    'The UI is polished and the workflow makes sense. A small status log would make it even better, but the core feature is excellent.',
    'I avoid games with invasive anti-cheats, so this tool gave me a clean way to claim a cosmetic reward without installing the whole thing.',
    'It is the kind of utility I wish Discord quests had officially. Lightweight, fast, and easy to understand.',
    'The Windows build worked smoothly for me. I would love to see Linux support later, but on Windows it does what it promises.',
    'Tiny download, tiny generated file, and no drama. That is exactly the kind of utility I want for limited-time rewards.',
    'I used it for a quest that required a game I did not own. The simulation was quick and the reward showed up without hassle.',
    'Nice little tool. The only thing I had to remember was running it from a normal folder with write permissions.',
    'The experience feels much safer than installing random huge launchers for one reward. Very useful for occasional quest claims.',
    'I appreciate that it keeps the process transparent. It is not bloated and it does not try to be more than it is.',
    'One of those apps that solves a very specific annoyance perfectly. I installed it for one quest and ended up keeping it.'
  ];
  const ratings = [5, 5, 5, 4.5, 4.5, 4, 5, 4.5, 5, 4, 4.5, 5];

  const makeInitials = (name) => name
    .replace('.', '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const stars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 !== 0;
    const empty = 5 - full - (half ? 1 : 0);
    return `
      <span class="star-rating" aria-label="${rating} out of 5 stars">
        ${'<span class="star star-full"></span>'.repeat(full)}
        ${half ? '<span class="star star-half"></span>' : ''}
        ${'<span class="star star-empty"></span>'.repeat(empty)}
      </span>
    `;
  };

  const cards = Array.from({ length: 120 }, (_, index) => {
    const name = names[index % names.length];
    const role = roles[(index * 3) % roles.length];
    const rating = ratings[(index * 5) % ratings.length];
    const base = comments[(index * 7) % comments.length];
    const extra = index % 5 === 0
      ? ` I also liked that the app did not force a complicated account flow or make me install extra launchers. It feels like a practical utility for people who just want the reward and want to move on.`
      : '';

    return `
      <article class="review-card community-review reveal" style="--reveal-order:${Math.min(index % 8, 6)}">
        <div class="community-review-head">
          <span class="review-initials" aria-hidden="true">${escapeHtml(makeInitials(name))}</span>
          <div class="community-review-meta">
            <strong>${escapeHtml(name)}</strong>
            <span>${escapeHtml(role)}</span>
          </div>
          ${stars(rating)}
        </div>
        <p class="review-text">${escapeHtml(base + extra)}</p>
      </article>
    `;
  }).join('');

  grid.innerHTML = cards;
}

/* ===================================================================
   6. STATS COUNTER — Animated count-up with easing
   =================================================================== */
function initStatsCounter() {
  const statNums = document.querySelectorAll('[data-count]');
  if (!statNums.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-count'));
        const suffix = el.getAttribute('data-suffix') || '';
        const prefix = el.getAttribute('data-prefix') || '';
        const duration = 2200;
        const start = performance.now();

        const animate = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out quint for a satisfying deceleration
          const eased = 1 - Math.pow(1 - progress, 5);
          const current = Math.floor(target * eased);

          el.textContent = prefix + current.toLocaleString() + suffix;

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            el.textContent = prefix + target.toLocaleString() + suffix;
          }
        };

        requestAnimationFrame(animate);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  statNums.forEach(el => observer.observe(el));
}

/* ===================================================================
   7. CONTACT FORM — Validation with visual feedback
   =================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valid = true;
    const required = form.querySelectorAll('[required]');

    required.forEach(field => {
      const wrapper = field.closest('.form-field');
      if (!field.value.trim()) {
        valid = false;
        if (wrapper) wrapper.classList.add('error');
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        valid = false;
        if (wrapper) wrapper.classList.add('error');
      } else {
        if (wrapper) wrapper.classList.remove('error');
      }
    });

    if (valid) {
      showToast('Message sent! We\'ll get back to you soon.');
      form.reset();
      // Remove all error states
      form.querySelectorAll('.form-field.error').forEach(el => el.classList.remove('error'));
    }
  });

  // Clear errors on input
  form.addEventListener('input', (e) => {
    const wrapper = e.target.closest('.form-field');
    if (wrapper) wrapper.classList.remove('error');
  });

  // Focus glow effect
  form.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('focus', () => {
      const wrapper = field.closest('.form-field');
      if (wrapper) wrapper.classList.add('focused');
    });
    field.addEventListener('blur', () => {
      const wrapper = field.closest('.form-field');
      if (wrapper) wrapper.classList.remove('focused');
    });
  });
}

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span style="font-size:1.1em">✓</span><span>${message}</span>`;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(30px) scale(0.95);
    background: #99ff00;
    color: #000;
    padding: 1rem 2rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 8px 40px rgba(153,255,0,0.35), 0 2px 10px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1),
                transform 0.4s cubic-bezier(0.16,1,0.3,1);
    font-family: 'Inter', -apple-system, sans-serif;
    white-space: nowrap;
  `;

  document.body.appendChild(toast);

  // Trigger entrance
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0) scale(1)';
    });
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(30px) scale(0.95)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

/* ===================================================================
   8. SMOOTH SCROLL — For all anchor links
   =================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = document.querySelector('.nav')?.offsetHeight || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ===================================================================
   9. MAGNETIC HOVER — Buttons follow cursor slightly on hover
   =================================================================== */
function initInteractiveSurfaces() {
  const surfaces = document.querySelectorAll('.service-card, .process-card, .about-stat-card, .review-card, .faq-item, .cta-form');

  document.querySelectorAll('.service-card').forEach(card => {
    card.querySelectorAll('.service-tag').forEach((tag, index) => {
      tag.style.setProperty('--tag-i', index);
    });
  });

  surfaces.forEach(surface => {
    if (!surface.querySelector('.surface-sheen')) {
      const sheen = document.createElement('span');
      sheen.className = 'surface-sheen';
      sheen.setAttribute('aria-hidden', 'true');
      surface.appendChild(sheen);
    }

    if (!surface.querySelector('.surface-edge')) {
      const edge = document.createElement('span');
      edge.className = 'surface-edge';
      edge.setAttribute('aria-hidden', 'true');
      surface.appendChild(edge);
    }

    if (!surface.hasAttribute('tabindex') && !surface.classList.contains('faq-item') && !surface.classList.contains('cta-form')) {
      surface.setAttribute('tabindex', '0');
    }

    const setSpot = (event) => {
      const rect = surface.getBoundingClientRect();
      const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
      surface.style.setProperty('--spot-x', `${(x * 100).toFixed(1)}%`);
      surface.style.setProperty('--spot-y', `${(y * 100).toFixed(1)}%`);
    };

    surface.addEventListener('pointerenter', (event) => {
      surface.classList.add('is-hovered');
      setSpot(event);
    }, { passive: true });

    surface.addEventListener('pointermove', setSpot, { passive: true });

    surface.addEventListener('pointerleave', () => {
      surface.classList.remove('is-hovered');
      surface.style.setProperty('--spot-x', '50%');
      surface.style.setProperty('--spot-y', '0%');
    });

    surface.addEventListener('focusin', () => surface.classList.add('is-hovered'));
    surface.addEventListener('focusout', () => surface.classList.remove('is-hovered'));

    surface.addEventListener('pointerdown', (event) => {
      surface.classList.add('is-pressing');
      addSurfacePing(surface, event);
    });

    surface.addEventListener('pointerup', () => {
      surface.classList.remove('is-pressing');
    });

    surface.addEventListener('pointerleave', () => {
      surface.classList.remove('is-pressing');
    });
  });
}

function addSurfacePing(surface, event) {
  const rect = surface.getBoundingClientRect();
  const ping = document.createElement('span');
  ping.className = 'surface-ping';
  ping.style.setProperty('--ping-x', `${event.clientX - rect.left}px`);
  ping.style.setProperty('--ping-y', `${event.clientY - rect.top}px`);
  surface.appendChild(ping);
  ping.addEventListener('animationend', () => ping.remove(), { once: true });
}

function initButtonInteractions() {
  const controls = document.querySelectorAll('.shiny-cta, .btn-secondary, .faq-question');

  controls.forEach(control => {
    if (!control.querySelector('.button-orbit')) {
      const orbit = document.createElement('span');
      orbit.className = 'button-orbit';
      orbit.setAttribute('aria-hidden', 'true');
      control.appendChild(orbit);
    }

    let lastSpark = 0;

    control.addEventListener('pointermove', (event) => {
      const rect = control.getBoundingClientRect();
      control.style.setProperty('--button-x', `${event.clientX - rect.left}px`);
      control.style.setProperty('--button-y', `${event.clientY - rect.top}px`);
      if (window.matchMedia('(pointer: fine)').matches && event.timeStamp - lastSpark > 120) {
        addButtonSpark(control, event);
        lastSpark = event.timeStamp;
      }
    }, { passive: true });

    control.addEventListener('pointerdown', (event) => {
      addButtonBurst(control, event);
      Array.from({ length: 4 }, () => addButtonSpark(control, event, true));
    });
  });
}

function addButtonBurst(control, event) {
  const rect = control.getBoundingClientRect();
  const burst = document.createElement('span');
  burst.className = 'button-burst';
  burst.style.setProperty('--burst-x', `${event.clientX - rect.left}px`);
  burst.style.setProperty('--burst-y', `${event.clientY - rect.top}px`);
  control.appendChild(burst);
  burst.addEventListener('animationend', () => burst.remove(), { once: true });
}

function addButtonSpark(control, event, energetic = false) {
  const rect = control.getBoundingClientRect();
  const spark = document.createElement('span');
  const angle = Math.random() * Math.PI * 2;
  const distance = energetic ? 26 + Math.random() * 34 : 14 + Math.random() * 22;
  const size = energetic ? 3 + Math.random() * 5 : 2 + Math.random() * 3;

  spark.className = 'button-spark';
  spark.style.setProperty('--spark-origin-x', `${event.clientX - rect.left}px`);
  spark.style.setProperty('--spark-origin-y', `${event.clientY - rect.top}px`);
  spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
  spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
  spark.style.setProperty('--spark-size', `${size.toFixed(1)}px`);
  control.appendChild(spark);
  spark.addEventListener('animationend', () => spark.remove(), { once: true });
}

function initSectionDepth() {
  const sections = [...document.querySelectorAll('.expertise, .about-section, .process, .faq, .reviews-section, .cta-section')];
  if (!sections.length) return;

  let ticking = false;

  const update = () => {
    const viewport = window.innerHeight || 1;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const progress = Math.min(Math.max((viewport - rect.top) / (viewport + rect.height), 0), 1);
      section.style.setProperty('--section-progress', progress.toFixed(3));
      section.classList.toggle('is-current', rect.top < viewport * 0.55 && rect.bottom > viewport * 0.35);
    });

    ticking = false;
  };

  const requestUpdate = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}

function initMagneticButtons() {
  const magnets = document.querySelectorAll('.shiny-cta, .btn-secondary');

  if (!window.matchMedia('(pointer: fine)').matches) return;

  magnets.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const strength = 0.12;

      btn.style.setProperty('--magnet-x', `${x * strength}px`);
      btn.style.setProperty('--magnet-y', `${y * strength}px`);
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--magnet-x', '0px');
      btn.style.setProperty('--magnet-y', '0px');
    });
  });
}

/* ===================================================================
   10. PARALLAX HERO — Subtle depth on mouse move
   =================================================================== */
function initParallaxHero() {
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  const heroBgLight = document.querySelector('.hero-bg-light');

  if (!hero || !heroContent) return;

  // Only on desktop
  if (window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Subtle content shift
      heroContent.style.transform = `translate(${x * -8}px, ${y * -6}px)`;
      heroContent.style.transition = 'transform 0.3s ease-out';

      // Green glow follows mouse slightly
      if (heroBgLight) {
        heroBgLight.style.transform = `translateX(calc(-50% + ${x * 40}px))`;
        heroBgLight.style.transition = 'transform 0.5s ease-out';
      }
    });

    hero.addEventListener('mouseleave', () => {
      heroContent.style.transform = '';
      heroContent.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      if (heroBgLight) {
        heroBgLight.style.transform = 'translateX(-50%)';
        heroBgLight.style.transition = 'transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      }
    });
  }
}

/* ===================================================================
   11. CARD TILT — Subtle 3D tilt on service/process cards
   =================================================================== */
function initCardTilt() {
  const cards = document.querySelectorAll('.service-card, .process-card, .about-stat-card, .review-card');

  if (!window.matchMedia('(pointer: fine)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (0.5 - y) * 6;   // max 3deg
      const rotateY = (x - 0.5) * 6;   // max 3deg

      card.style.setProperty('--tilt-x', `${rotateX}deg`);
      card.style.setProperty('--tilt-y', `${rotateY}deg`);
      card.style.setProperty('--spot-x', `${x * 100}%`);
      card.style.setProperty('--spot-y', `${y * 100}%`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--spot-x', '50%');
      card.style.setProperty('--spot-y', '0%');
    });
  });
}
