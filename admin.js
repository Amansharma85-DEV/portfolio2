/**
 * Admin Dashboard Control Panel Script
 * Manages authentication, inbox messages, project showcases, tech stack, and security settings.
 */

'use strict';

// Initial Mock Data Store
const DEFAULT_MESSAGES = [
  {
    id: 1,
    name: 'Vikram Mehta',
    email: 'vikram@techcorp.io',
    phone: '+91 98112 34567',
    message: 'Hi Aman, we loved your Glamora Fashion and E-Commerce projects. We want to hire you for a custom full-stack web application.',
    date: '2026-07-21 10:15',
    status: 'new'
  },
  {
    id: 2,
    name: 'Ananya Roy',
    email: 'ananya@medicare.org',
    phone: '+91 98765 12345',
    message: 'Hello! I saw your Clinic Website live demo. Can we discuss building a telemedicine booking portal for our medical center?',
    date: '2026-07-20 18:30',
    status: 'new'
  },
  {
    id: 3,
    name: 'Rohan Gupta',
    email: 'rohan@elitefitness.in',
    phone: '+91 99988 77665',
    message: 'Great work on the Gym landing page! We need an AI chatbot integrated for automated workout recommendations.',
    date: '2026-07-19 14:20',
    status: 'replied'
  }
];

const DEFAULT_PROJECTS = [
  { id: 1, title: 'Glamora Fashion', demo: 'https://amansharma85-dev.github.io/glamora-fashion/', github: 'https://github.com/amansharma85-dev/glamora-fashion', badges: ['React', 'Vite', 'CSS3'], image: 'assets/project1.png' },
  { id: 2, title: 'Clinic Website', demo: 'https://amansharma85-dev.github.io/clinic/', github: 'https://github.com/amansharma85-dev/clinic', badges: ['React', 'Vite', 'Tailwind'], image: 'assets/project2.png' },
  { id: 3, title: 'E-Commerce React App', demo: 'https://amansharma85-dev.github.io/ecommerce/#/', github: 'https://github.com/amansharma85-dev/ecommerce', badges: ['React', 'Node.js', 'Express'], image: 'assets/project3.png' },
  { id: 4, title: 'E-Commerce Website', demo: 'https://amansharma85-dev.github.io/e-commerce-website/', github: 'https://github.com/amansharma85-dev/e-commerce-website', badges: ['JavaScript', 'HTML5', 'CSS3'], image: 'assets/project4.png' },
  { id: 5, title: 'Swadeshi Kitchen', demo: 'https://amansharma85-dev.github.io/swadeshi-kitchen-live/', github: 'https://github.com/amansharma85-dev/swadeshi-kitchen-live', badges: ['React', 'CSS3', 'GitHub Pages'], image: 'assets/ss1.png' },
  { id: 6, title: 'Elite Fitness Club', demo: 'https://amansharma85-dev.github.io/gym/', github: 'https://github.com/amansharma85-dev/gym', badges: ['Next.js', 'React', 'Tailwind'], image: 'assets/ss2.png' },
  { id: 7, title: 'Savoria Kitchen', demo: 'https://amansharma85-dev.github.io/restaurant-website/', github: 'https://github.com/amansharma85-dev/restaurant-website', badges: ['JavaScript', 'HTML5', 'CSS3', 'GitHub Pages'], image: 'assets/restaurant.png?v=10' },
  { id: 8, title: 'Chrono Anime Hub', demo: 'https://Amansharma85-DEV.github.io/anime-website/', github: 'https://github.com/Amansharma85-DEV/anime-website', badges: ['JavaScript', 'HTML5', 'CSS3', 'GitHub Pages'], image: 'assets/anime.png?v=10' }
];

// Helper to get local data
function getMessages() {
  const stored = localStorage.getItem('admin_messages');
  return stored ? JSON.parse(stored) : DEFAULT_MESSAGES;
}

function saveMessages(msgs) {
  localStorage.setItem('admin_messages', JSON.stringify(msgs));
}

function getProjects() {
  const stored = localStorage.getItem('admin_projects');
  let projs = stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
  let updated = false;
  DEFAULT_PROJECTS.forEach(dp => {
    const exists = projs.some(p => p.id === dp.id || (p.demo && p.demo.toLowerCase() === dp.demo.toLowerCase()));
    if (!exists) {
      projs.push(dp);
      updated = true;
    }
  });
  if (updated || !stored) {
    saveProjects(projs);
  }
  return projs;
}

function saveProjects(projs) {
  localStorage.setItem('admin_projects', JSON.stringify(projs));
}

/* ── Authentication Handlers ── */
const authOverlay = document.getElementById('admin-auth-overlay');
const adminApp    = document.getElementById('admin-app');
const loginForm   = document.getElementById('admin-login-form');
const authMsg     = document.getElementById('admin-auth-msg');

let loginAttempts = 0;
let loginBackoffUntil = 0;

function checkAuthSession() {
  const isAuth = sessionStorage.getItem('admin_auth_token') === 'authenticated_aman_sharma';
  if (isAuth) {
    authOverlay.style.display = 'none';
    adminApp.style.display = 'flex';
    initDashboard();
  } else {
    authOverlay.style.display = 'flex';
    adminApp.style.display = 'none';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const now = Date.now();

    if (now < loginBackoffUntil) {
      const remainingSec = Math.ceil((loginBackoffUntil - now) / 1000);
      showAuthMsg(`⏳ Exponential Backoff Active: Please wait ${remainingSec}s before retrying.`, 'error');
      return;
    }

    const email = document.getElementById('admin-email').value.trim();
    const pass  = document.getElementById('admin-pass').value.trim();

    // Verification check (Accepts amansharma.aslink@gmail.com with password 'AmanAdmin2026!' or 'admin123')
    if (email === 'amansharma.aslink@gmail.com' && (pass === 'AmanAdmin2026!' || pass === 'admin123')) {
      sessionStorage.setItem('admin_auth_token', 'authenticated_aman_sharma');
      showAuthMsg('🔓 Authentication successful! Unlocking dashboard...', 'success');
      setTimeout(checkAuthSession, 800);
    } else {
      loginAttempts++;
      const penaltyMs = Math.min(1000 * Math.pow(2, loginAttempts - 1), 30000);
      loginBackoffUntil = Date.now() + penaltyMs;
      showAuthMsg(`❌ Invalid credentials. Failed attempts: ${loginAttempts}. Exponential backoff penalty: ${Math.ceil(penaltyMs / 1000)}s.`, 'error');
    }
  });
}

function showAuthMsg(msg, type) {
  authMsg.textContent = msg;
  authMsg.style.display = 'block';
  authMsg.style.background = type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
  authMsg.style.border = type === 'success' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)';
  authMsg.style.color = type === 'success' ? '#86EFAC' : '#FCA5A5';
}

document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
  sessionStorage.removeItem('admin_auth_token');
  checkAuthSession();
});

/* ── Panel Navigation ── */
const navItems = document.querySelectorAll('.admin-nav-item[data-panel]');
const panels   = document.querySelectorAll('.admin-panel');
const panelTitle = document.getElementById('panel-title');

function switchPanel(panelName) {
  navItems.forEach(item => {
    if (item.getAttribute('data-panel') === panelName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  panels.forEach(p => {
    if (p.id === `panel-${panelName}`) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  const titles = {
    overview: 'Dashboard Overview',
    messages: 'Contact Messages Inbox',
    projects: 'Featured Projects Manager',
    skills: 'Technical Skills Stack',
    security: 'Security & Rate Limiting Controls'
  };

  if (panelTitle && titles[panelName]) {
    panelTitle.textContent = titles[panelName];
  }
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchPanel(item.getAttribute('data-panel'));
  });
});

/* ── Render Dashboard Data ── */
function initDashboard() {
  renderMessages();
  renderProjects();
  renderSkills();
}

function renderMessages() {
  const msgs = getMessages();
  const newMsgs = msgs.filter(m => m.status === 'new');

  const badge = document.getElementById('unread-count-badge');
  if (badge) {
    if (newMsgs.length > 0) {
      badge.textContent = `${newMsgs.length} New`;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  const statNew = document.getElementById('stat-messages-new');
  if (statNew) statNew.textContent = `${newMsgs.length} New`;

  const statTotal = document.getElementById('stat-total-messages');
  if (statTotal) statTotal.textContent = msgs.length;

  // Overview Table (Top 3)
  const overviewBody = document.getElementById('overview-messages-body');
  if (overviewBody) {
    overviewBody.innerHTML = msgs.slice(0, 3).map(m => `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${m.email}</td>
        <td style="max-width:250px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.message}</td>
        <td><span class="status-badge ${m.status === 'new' ? 'status-new' : 'status-replied'}">${m.status}</span></td>
        <td>
          <a href="mailto:${m.email}?subject=Reply to your inquiry&body=Hi ${m.name}," class="btn btn-secondary btn-sm" style="padding:0.3rem 0.6rem;font-size:0.75rem;">Reply</a>
        </td>
      </tr>
    `).join('');
  }

  // All Messages Table
  const allBody = document.getElementById('all-messages-body');
  if (allBody) {
    allBody.innerHTML = msgs.map(m => `
      <tr>
        <td style="font-size:0.78rem;color:var(--text-dim);">${m.date}</td>
        <td><strong>${m.name}</strong></td>
        <td><a href="mailto:${m.email}" style="color:var(--accent-2);">${m.email}</a></td>
        <td>${m.phone || 'N/A'}</td>
        <td style="max-width:300px;line-height:1.5;">${m.message}</td>
        <td><span class="status-badge ${m.status === 'new' ? 'status-new' : 'status-replied'}">${m.status}</span></td>
        <td>
          <div style="display:flex;gap:0.4rem;">
            <a href="https://wa.me/${(m.phone || '').replace(/\D/g, '') || '919310575998'}" target="_blank" class="btn btn-primary btn-sm" style="padding:0.3rem 0.6rem;font-size:0.75rem;">WhatsApp</a>
            <button onclick="deleteMessage(${m.id})" class="btn btn-ghost btn-sm" style="padding:0.3rem 0.6rem;font-size:0.75rem;color:#FCA5A5;">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

function deleteMessage(id) {
  let msgs = getMessages();
  msgs = msgs.filter(m => m.id !== id);
  saveMessages(msgs);
  renderMessages();
}

function renderProjects() {
  const projs = getProjects();
  const body = document.getElementById('projects-table-body');
  if (!body) return;

  body.innerHTML = projs.map(p => `
    <tr>
      <td><strong>${p.title}</strong></td>
      <td><a href="${p.demo}" target="_blank" style="color:var(--accent-2);font-size:0.82rem;">${p.demo}</a></td>
      <td><a href="${p.github}" target="_blank" style="color:var(--text-muted);font-size:0.82rem;">${p.github}</a></td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${(p.badges || []).map(b => `<span class="badge" style="font-size:0.7rem;">${b}</span>`).join('')}
        </div>
      </td>
      <td>
        <button onclick="deleteProject(${p.id})" class="btn btn-ghost btn-sm" style="color:#FCA5A5;padding:0.3rem 0.6rem;font-size:0.75rem;">Delete</button>
      </td>
    </tr>
  `).join('');
}

function deleteProject(id) {
  let projs = getProjects();
  projs = projs.filter(p => p.id !== id);
  saveProjects(projs);
  renderProjects();
}

function renderSkills() {
  const container = document.getElementById('skills-admin-container');
  if (!container) return;

  const categories = [
    { title: 'Frontend', items: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Tailwind CSS'] },
    { title: 'Backend', items: ['Python', 'Flask', 'Node.js', 'Express.js'] },
    { title: 'Database & Cloud', items: ['MongoDB', 'Firebase', 'MySQL', 'AWS', 'GitHub', 'Vercel'] }
  ];

  container.innerHTML = categories.map(c => `
    <div style="padding:1.2rem;background:rgba(255,255,255,0.03);border-radius:16px;border:1px solid rgba(124,58,237,0.2);">
      <div style="font-weight:700;margin-bottom:0.8rem;color:var(--accent-2);">${c.title}</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
        ${c.items.map(item => `<span class="badge">${item}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

/* ── Modals & Refresh ── */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

document.getElementById('add-project-btn')?.addEventListener('click', () => {
  openModal('project-modal');
});

document.getElementById('project-modal-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('proj-title-input').value.trim();
  const demo = document.getElementById('proj-demo-input').value.trim();
  const github = document.getElementById('proj-github-input').value.trim();
  const image = document.getElementById('proj-image-input').value.trim() || 'assets/project1.png';
  const badgesStr = document.getElementById('proj-badges-input').value.trim();

  if (!title || !demo || !github) return;

  const badges = badgesStr.split(',').map(b => b.trim()).filter(Boolean);
  const projs = getProjects();
  projs.push({
    id: Date.now(),
    title,
    demo,
    github,
    image,
    badges
  });

  saveProjects(projs);
  renderProjects();
  closeModal('project-modal');
  document.getElementById('project-modal-form').reset();
});

document.getElementById('refresh-data-btn')?.addEventListener('click', () => {
  initDashboard();
});

document.getElementById('clear-read-btn')?.addEventListener('click', () => {
  let msgs = getMessages();
  msgs = msgs.filter(m => m.status === 'new');
  saveMessages(msgs);
  renderMessages();
});

// Close modal when clicking outside modal card (backdrop click)
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
    }
  });
});

// Explicitly export handlers to global window scope for inline HTML event attributes
window.openModal = openModal;
window.closeModal = closeModal;
window.deleteMessage = deleteMessage;
window.deleteProject = deleteProject;

// Run check on page load
checkAuthSession();

