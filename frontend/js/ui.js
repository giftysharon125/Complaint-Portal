/* =====================================================
   ui.js — shared UI helpers used by every page
   - page guard + role redirect
   - sidebar/topbar shell rendering
   - badges, dates, toasts, modals, stars
   ===================================================== */

/* ---------- Domain constants (mirror backend/utils/constants.js) ---------- */
const STATUSES = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'];
const TRANSITIONS = {
  Submitted: ['Under Review', 'Rejected'],
  'Under Review': ['Assigned', 'Rejected'],
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
  Rejected: [],
};
const STAFF_TRANSITIONS = {
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
};
const STATUS_GROUPS = {
  pending: ['Submitted', 'Under Review', 'Assigned'],
  inprogress: ['In Progress'],
  resolved: ['Resolved', 'Closed'],
  rejected: ['Rejected'],
};
const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

/* ---------- Guards & redirects ---------- */
function requireAuth(role) {
  const user = getUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  if (role && user.role !== role) {
    window.location.href = redirectPathFor(user.role);
    return null;
  }
  return user;
}

function redirectPathFor(role) {
  if (role === 'admin') return '/admin-dashboard.html';
  if (role === 'staff') return '/staff-dashboard.html';
  return '/student-dashboard.html';
}

function logout() {
  clearSession();
  window.location.href = '/login.html';
}

/* ---------- Sidebar / topbar shell ---------- */
const NAV_MENUS = {
  student: [
    { href: '/student-dashboard.html', key: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { href: '/submit-complaint.html', key: 'submit', icon: 'file-plus-2', label: 'Submit Complaint' },
    { href: '/my-complaints.html', key: 'my', icon: 'clipboard-list', label: 'My Complaints' },
    { href: '/feedback.html', key: 'feedback', icon: 'star', label: 'Feedback' },
    { href: '/profile.html', key: 'profile', icon: 'user-round', label: 'Profile' },
  ],
  admin: [
    { href: '/admin-dashboard.html', key: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { href: '/admin-complaints.html', key: 'complaints', icon: 'clipboard-list', label: 'Complaints' },
    { href: '/admin-users.html', key: 'students', icon: 'graduation-cap', label: 'Students' },
    { href: '/admin-staff.html', key: 'staff', icon: 'hard-hat', label: 'Staff' },
    { href: '/admin-categories.html', key: 'categories', icon: 'tags', label: 'Categories' },
    { href: '/admin-reports.html', key: 'reports', icon: 'bar-chart-3', label: 'Reports' },
    { href: '/admin-feedback.html', key: 'feedback', icon: 'star', label: 'Feedback' },
    { href: '/profile.html', key: 'profile', icon: 'user-round', label: 'Profile' },
  ],
  staff: [
    { href: '/staff-dashboard.html', key: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
    { href: '/staff-complaints.html', key: 'assigned', icon: 'clipboard-list', label: 'Assigned Complaints' },
    { href: '/staff-complaints.html?filter=resolved', key: 'resolved', icon: 'check-circle-2', label: 'Resolved Complaints' },
    { href: '/profile.html', key: 'profile', icon: 'user-round', label: 'Profile' },
  ],
};

/**
 * Renders the app shell (sidebar + topbar) into #sidebar / #topbar-slot.
 * @param {{role:string, active:string, title:string, subtitle?:string}} cfg
 */
function renderShell(cfg) {
  const user = getUser();
  const menu = NAV_MENUS[cfg.role] || [];

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = `
      <a class="sidebar-brand" href="${redirectPathFor(cfg.role)}">
        <i data-lucide="message-square-warning"></i>
        <span>
          <span class="brand-name">Complaint Portal</span><br/>
          <span class="brand-sub">College Management</span>
        </span>
      </a>
      <nav class="sidebar-nav">
        ${menu.map(
          (m) => `
          <a href="${m.href}" class="${cfg.active === m.key ? 'active' : ''}">
            <i data-lucide="${m.icon}"></i>${m.label}
          </a>`
        ).join('')}
        <div class="nav-section">Account</div>
        <a href="#" id="nav-logout"><i data-lucide="log-out"></i>Logout</a>
      </nav>
      <div class="sidebar-footer">v1.0 · Student CMS</div>
    `;
    const lo = document.getElementById('nav-logout');
    if (lo) lo.addEventListener('click', (e) => { e.preventDefault(); logout(); });
  }

  const slot = document.getElementById('topbar-slot');
  if (slot) {
    const initials = (user?.name || '?')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    slot.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" id="menu-btn" aria-label="Open menu">
            <i data-lucide="menu"></i>
          </button>
          <div>
            <h1>${cfg.title}</h1>
            ${cfg.subtitle ? `<div class="page-sub">${cfg.subtitle}</div>` : ''}
          </div>
        </div>
        <div class="topbar-user">
          <div class="avatar">${initials}</div>
          <div class="user-meta">
            <div class="user-name">${escapeHtml(user?.name || '')}</div>
            <div class="user-role">${user?.role || ''}</div>
          </div>
          <button class="logout-btn" id="topbar-logout" title="Logout" aria-label="Logout">
            <i data-lucide="log-out"></i>
          </button>
        </div>
      </header>
    `;
    document.getElementById('topbar-logout')?.addEventListener('click', logout);
    document.getElementById('menu-btn')?.addEventListener('click', toggleSidebar);
  }

  // Mobile drawer overlay
  if (!document.getElementById('sidebar-overlay')) {
    const ov = document.createElement('div');
    ov.className = 'sidebar-overlay';
    ov.id = 'sidebar-overlay';
    ov.addEventListener('click', toggleSidebar);
    document.body.appendChild(ov);
  }

  refreshIcons();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (!sb) return;
  const open = sb.classList.toggle('open');
  ov?.classList.toggle('show', open);
}

/* ---------- Icons ---------- */
function refreshIcons() {
  if (window.lucide?.createIcons) {
    try { lucide.createIcons(); } catch { /* ignore */ }
  }
}

/* ---------- Badges ---------- */
function statusClass(status) {
  return 'badge badge-' + String(status || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
function statusBadge(status) {
  return `<span class="${statusClass(status)}">${escapeHtml(status || '—')}</span>`;
}
function priorityBadge(priority) {
  return `<span class="badge badge-${String(priority || 'medium').toLowerCase()}">${escapeHtml(priority || 'Medium')}</span>`;
}

/* ---------- Dates ---------- */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ---------- Stars ---------- */
function starsHtml(rating) {
  let out = '';
  for (let i = 1; i <= 5; i++) out += i <= rating ? '★' : '☆';
  return `<span class="rating-display" aria-label="${rating} out of 5">${out}</span>`;
}

/* ---------- Escaping ---------- */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Toast ---------- */
function toast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ---------- Modal helpers ---------- */
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}
// Close any modal when clicking its backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) e.target.classList.remove('open');
});

/* ---------- Misc ---------- */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* Loads active categories into a <select>. withAll prepends an "All categories" option. */
async function loadCategoriesInto(selectId, withAll = false) {
  try {
    const res = await apiGet('/categories');
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML =
      (withAll ? '<option value="">All categories</option>' : '') +
      res.data.map((c) => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');
  } catch { /* non-fatal */ }
}

function alertBox(id, message, type = 'success') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type}`;
  el.textContent = message;
  el.hidden = !message;
}

function setButtonLoading(btn, loading, labelWhileLoading = 'Please wait...') {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = labelWhileLoading;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
  }
}
