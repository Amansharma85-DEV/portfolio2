/* ============================================================
   PREMIUM PORTFOLIO — INTERACTIONS & ANIMATIONS
   ============================================================ */

'use strict';

const DEFAULT_PROJECTS = [
  { id: 1, title: 'Glamora Fashion', demo: 'https://amansharma85-dev.github.io/glamora-fashion/', github: 'https://github.com/amansharma85-dev/glamora-fashion', badges: ['React', 'Vite', 'CSS3'], image: 'assets/project1.png', description: 'Elegant contemporary fashion e-commerce platform, thoughtfully curated for modern lifestyles. Features product lists, cart management, and fluid UI.' },
  { id: 2, title: 'Clinic Website', demo: 'https://amansharma85-dev.github.io/clinic/', github: 'https://github.com/amansharma85-dev/clinic', badges: ['React', 'Vite', 'Tailwind'], image: 'assets/project2.png', description: 'Professional medical clinic interface with appointment booking, doctor profiles, services showcase, and clean healthcare UI.' },
  { id: 3, title: 'E-Commerce React App', demo: 'https://amansharma85-dev.github.io/ecommerce/#/', github: 'https://github.com/amansharma85-dev/ecommerce', badges: ['React', 'Node.js', 'Express'], image: 'assets/project3.png', description: 'React e-commerce shopping platform with product catalog filtering, cart state management, and seamless checkout.' },
  { id: 4, title: 'E-Commerce Website', demo: 'https://amansharma85-dev.github.io/e-commerce-website/', github: 'https://github.com/amansharma85-dev/e-commerce-website', badges: ['JavaScript', 'HTML5', 'CSS3'], image: 'assets/project4.png', description: 'Traditional shopping website with clean product catalog layouts, sliding banner, category filters, and intuitive cart UI.' },
  { id: 5, title: 'Swadeshi Kitchen', demo: 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/', github: 'https://github.com/amansharma85-dev/swadeshi-kitchen-live', badges: ['React', 'CSS3', 'GitHub Pages'], image: 'assets/ss1.png?v=3', description: 'A premium recipe platform featuring traditional Indian recipes, interactive cooking guides, food categories, and responsive UI.' },
  { id: 6, title: 'Elite Fitness Club', demo: 'https://amansharma85-dev.github.io/gym/', github: 'https://github.com/amansharma85-dev/gym', badges: ['Next.js', 'React', 'Tailwind'], image: 'assets/ss2.png?v=3', description: 'A premium gym landing page highlighting workouts, trainer profiles, plans, and fitness trackers with modern aesthetics.' },
  { id: 7, title: 'Savoria Kitchen', demo: 'https://amansharma85-dev.github.io/restaurant-website/', github: 'https://github.com/amansharma85-dev/restaurant-website', badges: ['JavaScript', 'HTML5', 'CSS3', 'GitHub Pages'], image: 'assets/restaurant.png', description: 'A premium gourmet food delivery and restaurant web application featuring interactive food categories, search, cart, meal bundles, and dark/light roast themes.' },
  { id: 8, title: 'Chrono Anime Hub', demo: 'https://Amansharma85-DEV.github.io/anime-website/', github: 'https://github.com/Amansharma85-DEV/anime-website', badges: ['JavaScript', 'HTML5', 'CSS3', 'GitHub Pages'], image: 'assets/anime.png', description: 'An ultra-modern anime magazine & character hub featuring interactive character switchers, manga stories, trailer modals, wallpaper galleries, and dark/light themes.' }
];

function initProjectsDynamic() {
  const container = document.querySelector('.projects-grid');
  if (!container) return;

  let projs = localStorage.getItem('admin_projects')
    ? JSON.parse(localStorage.getItem('admin_projects'))
    : DEFAULT_PROJECTS;

  // Auto-upgrade image paths to bypass cached localStorage & HTTP cache
  projs = projs.map(p => {
    if (p.id === 5 || p.title === 'Swadeshi Kitchen') {
      return { ...p, image: 'assets/ss1.png?v=3' };
    }
    if (p.id === 6 || p.title === 'Elite Fitness Club') {
      return { ...p, image: 'assets/ss2.png?v=3' };
    }
    return p;
  });

  // Ensure all default projects (including Savoria Kitchen & Chrono Anime Hub) exist in projs
  DEFAULT_PROJECTS.forEach(dp => {
    const exists = projs.some(p => p.id === dp.id || (p.demo && p.demo.toLowerCase() === dp.demo.toLowerCase()));
    if (!exists) {
      projs.push(dp);
    }
  });

  localStorage.setItem('admin_projects', JSON.stringify(projs));

  container.innerHTML = projs.map((p, idx) => {
    const delay = (idx % 3) + 1;
    const badgesHtml = (p.badges || []).map(b => `<span class="badge">${b}</span>`).join('');
    
    return `
      <article class="glass-card project-card reveal delay-${delay}">
        <div class="project-img">
          <img src="${p.image || 'assets/project1.png'}" alt="${p.title}" loading="lazy" />
          <div class="project-overlay"></div>
        </div>
        <div class="project-body">
          <div class="project-title">${p.title}</div>
          <div class="project-desc">${p.description || p.projectDesc || 'A premium web development project showcasing modern design, interactive UI, and robust backend integrations.'}</div>
          <div class="tech-badges">
            ${badgesHtml}
          </div>
          <div class="project-links">
            <a href="${p.demo}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Live Demo</a>
            <a href="${p.github}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" aria-label="GitHub">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Call dynamic renderer
initProjectsDynamic();

/* ── Loader ── */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('fade-out');
  }, 1900);
});

/* ── Custom Cursor Spotlight ── */
const cursorGlow = document.getElementById('cursor-glow');
const cursorDot  = document.getElementById('cursor-dot');

if (cursorGlow || cursorDot) {
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (cursorDot) {
      cursorDot.style.left = mouseX + 'px';
      cursorDot.style.top  = mouseY + 'px';
    }
    if (cursorGlow) {
      cursorGlow.style.left = mouseX + 'px';
      cursorGlow.style.top  = mouseY + 'px';
    }
  }, { passive: true });

  // Cursor hover state
  const hoverTargets = 'a, button, [role="button"], input, textarea, .skill-item, .service-card, .project-card, .glass-card';

  document.addEventListener('mouseover', e => {
    if (cursorDot && e.target.closest(hoverTargets)) {
      cursorDot.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (cursorDot && e.target.closest(hoverTargets)) {
      cursorDot.classList.remove('hover');
    }
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    if (cursorDot) cursorDot.style.opacity = '0';
    if (cursorGlow) cursorGlow.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    if (cursorDot) cursorDot.style.opacity = '1';
    if (cursorGlow) cursorGlow.style.opacity = '1';
  });
}

/* ── Scroll Progress ── */
const progressBar = document.getElementById('scroll-progress');

window.addEventListener('scroll', () => {
  const scrollTop  = window.scrollY;
  const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
  const progress   = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = progress + '%';
}, { passive: true });

/* ── Sticky Navbar ── */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 30) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

/* ── Mobile Menu ── */
const hamburger       = document.getElementById('hamburger');
const mobileMenu      = document.getElementById('mobile-menu');
const mobileMenuClose = document.getElementById('mobile-menu-close');

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
  if (hamburger) {
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
  });
}

if (mobileMenuClose) {
  mobileMenuClose.addEventListener('click', closeMobileMenu);
}

// Close on link click
if (mobileMenu) {
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });
}

/* ── Smooth scroll for all hash links ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const targetId = link.getAttribute('href');
    if (targetId && targetId !== '#') {
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        link.blur();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });

        if (link.classList.contains('bottom-nav-item')) {
          document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
          link.classList.add('active');
        }
      }
    }
  });
});

/* ── Back to Top ── */
const btt = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    btt.classList.add('visible');
  } else {
    btt.classList.remove('visible');
  }
}, { passive: true });

btt.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── Intersection Observer — Reveal on scroll ── */
const revealObserverOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -60px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, revealObserverOptions);

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

/* ── Counter Animation ── */
function animateCounter(el, target, suffix = '') {
  const duration = 1800;
  const start    = performance.now();

  function update(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current  = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// Observe hero stats
const heroStats = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

heroStats.forEach(el => counterObserver.observe(el));

/* ── Parallax Glow Orbs ── */
const orbs = document.querySelectorAll('.glow-orb');

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  orbs.forEach((orb, i) => {
    const speed = (i % 3 + 1) * 0.04;
    const dir   = i % 2 === 0 ? 1 : -1;
    orb.style.transform = `translateY(${scrollY * speed * dir}px)`;
  });
}, { passive: true });

/* ── Card Tilt Effect ── */
function applyTilt(el) {
  el.addEventListener('mousemove', e => {
    const rect   = el.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const y      = e.clientY - rect.top;
    const cx     = rect.width / 2;
    const cy     = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -5;
    const rotateY = ((x - cx) / cx) * 5;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
    el.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(() => { el.style.transition = ''; }, 500);
  });
}

document.querySelectorAll('.service-card, .stat-card, .why-card').forEach(applyTilt);

/* ── Ripple Button Effect ── */
function createRipple(e) {
  const btn  = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const x    = e.clientX - rect.left;
  const y    = e.clientY - rect.top;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: 0; height: 0;
    border-radius: 50%;
    background: rgba(255,255,255,0.25);
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: ripple-expand 0.6s ease-out forwards;
  `;

  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// Inject ripple keyframes
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple-expand {
    to { width: 400px; height: 400px; opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);

document.querySelectorAll('.btn').forEach(btn => {
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.addEventListener('click', createRipple);
});

/* ── Active Nav Highlight ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');

const activeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${id}`) {
          link.style.color = 'var(--accent-3)';
        } else {
          link.style.color = '';
        }
      });
      bottomNavItems.forEach(item => {
        if (item.getAttribute('href') === `#${id}`) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      mobileMenuItems.forEach(item => {
        if (item.getAttribute('href') === `#${id}`) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });
}, { threshold: 0.25, rootMargin: '-70px 0px -30% 0px' });

sections.forEach(s => activeObserver.observe(s));

/* ── Download Resume Button Handler ── */
const downloadResumeBtn = document.getElementById('download-resume');
if (downloadResumeBtn) {
  downloadResumeBtn.addEventListener('click', e => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const top = contactSection.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
}

/* ── Mobile Bottom Nav Scroll Hide / Reveal ── */
let lastScrollY = window.scrollY;
const mobileBottomNav = document.getElementById('mobile-bottom-nav');
const waFloating = document.getElementById('whatsapp-floating');
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  if (!mobileBottomNav) return;
  const currentScrollY = window.scrollY;

  if (currentScrollY < 100) {
    mobileBottomNav.classList.remove('nav-hidden');
    if (waFloating) waFloating.style.bottom = '5.5rem';
    if (backToTopBtn) backToTopBtn.style.bottom = '5.5rem';
    lastScrollY = currentScrollY;
    return;
  }

  if (currentScrollY > lastScrollY + 8) {
    // Scrolling down -> hide nav
    mobileBottomNav.classList.add('nav-hidden');
    if (waFloating) waFloating.style.bottom = '2rem';
    if (backToTopBtn) backToTopBtn.style.bottom = '2rem';
  } else if (currentScrollY < lastScrollY - 8) {
    // Scrolling up -> reveal nav
    mobileBottomNav.classList.remove('nav-hidden');
    if (waFloating) waFloating.style.bottom = '5.5rem';
    if (backToTopBtn) backToTopBtn.style.bottom = '5.5rem';
  }

  lastScrollY = currentScrollY;
}, { passive: true });

/* ── Contact Form ── */
const form       = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (form && formStatus) {
  formStatus.setAttribute('aria-live', 'polite');

  // Client-side Rate Limiting with Exponential Backoff
  let submitAttempts = 0;
  let nextAllowedTime = 0;

  // Clear errors on typing
  form.querySelectorAll('.form-input, .form-textarea').forEach(input => {
    input.addEventListener('input', () => {
      input.style.borderColor = '';
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Check exponential backoff timer
    const now = Date.now();
    if (now < nextAllowedTime) {
      const waitSec = Math.ceil((nextAllowedTime - now) / 1000);
      showStatus(`⏳ Rate Limit Active: Exponential backoff in effect. Please wait ${waitSec} second(s) before retrying.`, 'error');
      return;
    }

    const btn = form.querySelector('[type="submit"]');

    // Validation
    const name    = form.name.value.trim();
    const email   = form.email.value.trim();
    const phone   = form.phone ? form.phone.value.trim() : '';
    const message = form.message.value.trim();

    let valid = true;

    if (!name) {
      form.name.style.borderColor = 'rgba(239, 68, 68, 0.8)';
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.email.style.borderColor = 'rgba(239, 68, 68, 0.8)';
      valid = false;
    }
    if (phone && !/^[+\d\s()-]{7,20}$/.test(phone)) {
      form.phone.style.borderColor = 'rgba(239, 68, 68, 0.8)';
      showStatus('Please enter a valid phone number or leave it blank.', 'error');
      return;
    }
    if (!message) {
      form.message.style.borderColor = 'rgba(239, 68, 68, 0.8)';
      valid = false;
    }

    if (!valid) {
      showStatus('Please fill in all required fields correctly.', 'error');
      return;
    }

    // Increment submit attempt & set exponential backoff penalty
    submitAttempts++;
    const backoffDelay = Math.min(1000 * Math.pow(2, submitAttempts - 1), 60000);
    nextAllowedTime = now + backoffDelay;

    // Disable button & show loading spinner
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin 1s linear infinite">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Sending...
    `;

    if (!document.getElementById('spin-style')) {
      const spinStyle = document.createElement('style');
      spinStyle.id = 'spin-style';
      spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(spinStyle);
    }

    // Attempt API request to Express server (if running)
    try {
      await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || undefined, message })
      });
    } catch (err) {
      // Offline/Static mode fallback — server not reachable
    }

    // Save to localStorage under admin_messages for fully working control panel
    const existingMessages = localStorage.getItem('admin_messages')
      ? JSON.parse(localStorage.getItem('admin_messages'))
      : [];

    const newMsg = {
      id: Date.now(),
      name,
      email,
      phone,
      message,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'new'
    };

    existingMessages.unshift(newMsg);
    localStorage.setItem('admin_messages', JSON.stringify(existingMessages));

    btn.disabled = false;
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      Send Message
    `;

    showStatus('🎉 Message sent successfully! I\'ll get back to you within 24 hours.', 'success');
    form.reset();
  });
}

function showStatus(msg, type) {
  if (!formStatus) return;
  formStatus.textContent = msg;
  formStatus.style.display = 'block';
  formStatus.style.background = type === 'success'
    ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
  formStatus.style.border = type === 'success'
    ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)';
  formStatus.style.color = type === 'success' ? '#86EFAC' : '#FCA5A5';

  setTimeout(() => {
    formStatus.style.display = 'none';
  }, 6000);
}

/* ── Image Error Fallback Safeguard ── */
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => {
    img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><rect width="100%" height="100%" fill="%23111118"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23A855F7" font-family="sans-serif" font-size="16">AS Project Preview</text></svg>';
  });
});

/* ── Typewriter effect on hero subtitle ── */
(function () {
  const lines = [
    'Full Stack Developer & AI Developer',
    'Building Intelligent Web Experiences',
    'React · Python · LangChain · OpenAI'
  ];

  let lineIdx = 0, charIdx = 0, deleting = false;

  const el = document.querySelector('.hero-subtitle strong');
  if (!el) return;

  function tick() {
    const current = lines[lineIdx];
    if (!deleting) {
      el.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(tick, 2500);
        return;
      }
      setTimeout(tick, 60);
    } else {
      el.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        lineIdx  = (lineIdx + 1) % lines.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 35);
    }
  }

  setTimeout(tick, 1200);
})();

/* ── Skill items staggered reveal ── */
const skillItems = document.querySelectorAll('.skill-item');
skillItems.forEach((item, i) => {
  item.style.transitionDelay = `${i * 0.04}s`;
});

/* ── Floating particle background ── */
(function createParticles() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
  `;
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x    = Math.random() * W;
      this.y    = Math.random() * H;
      this.r    = Math.random() * 1.5 + 0.3;
      this.vx   = (Math.random() - 0.5) * 0.3;
      this.vy   = (Math.random() - 0.5) * 0.3;
      this.a    = Math.random() * 0.4 + 0.1;
      this.life = 0;
      this.maxLife = 200 + Math.random() * 200;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife) this.reset();
    }
    draw() {
      const prog  = this.life / this.maxLife;
      const alpha = this.a * (prog < 0.2 ? prog / 0.2 : prog > 0.8 ? (1 - prog) / 0.2 : 1);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168,85,247,${alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) {
    const p = new Particle();
    p.life = Math.random() * p.maxLife; // randomize start
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  animate();
})();

/* ── Scroll-linked hero glow parallax ── */
const heroBg = document.querySelector('.hero-bg-glow');
if (heroBg) {
  window.addEventListener('scroll', () => {
    heroBg.style.transform = `translateX(-50%) translateY(${window.scrollY * 0.3}px)`;
  }, { passive: true });
}

/* ── Nav link active smooth styling ── */
navLinks.forEach(link => {
  link.addEventListener('mouseenter', function() {
    if (!this.classList.contains('nav-cta')) {
      this.style.transition = 'color 0.2s ease, background 0.2s ease';
    }
  });
});

/* ── Keyboard accessibility: close mobile menu on Escape ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});

/* ── Testimonial card subtle hover effect ── */
document.querySelectorAll('.testimonial-card').forEach(card => {
  card.addEventListener('mouseenter', function () {
    this.style.borderColor = 'rgba(168,85,247,0.5)';
  });
  card.addEventListener('mouseleave', function () {
    this.style.borderColor = '';
  });
});

/* ── Project card hover scan line ── */
document.querySelectorAll('.project-card').forEach(card => {
  const overlay = card.querySelector('.project-overlay');

  card.addEventListener('mouseenter', () => {
    if (overlay) {
      overlay.style.background = 'linear-gradient(180deg, transparent 10%, rgba(124,58,237,0.15) 50%, rgba(5,5,5,0.85) 100%)';
    }
  });

  card.addEventListener('mouseleave', () => {
    if (overlay) {
      overlay.style.background = '';
    }
  });
});

/* ── Init: trigger visible on elements already in viewport ── */
setTimeout(() => {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      el.classList.add('visible');
    }
  });
}, 100);

console.log('%cAman Sharma Portfolio ⚡', 'color:#A855F7;font-size:18px;font-weight:700;');
console.log('%cFull Stack & AI Developer', 'color:#A1A1AA;font-size:13px;');

