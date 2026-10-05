/* =====================================================
   admin.js — all admin pages
   ===================================================== */

/* ================= Admin Dashboard ================= */
const adDash = document.getElementById('admin-dashboard-root');
if (adDash) {
  (async function initAdminDashboard() {
    const user = requireAuth('admin');
    if (!user) return;
    renderShell({ role: 'admin', active: 'dashboard', title: 'Admin Dashboard' });
    try {
      const res = await apiGet('/admin/dashboard');
      const d = res.data;

      document.getElementById('st-total').textContent = d.stats.total;
      document.getElementById('st-pending').textContent = d.stats.pending;
      document.getElementById('st-inprogress').textContent = d.stats.inProgress;
      document.getElementById('st-resolved').textContent = d.stats.resolved;

      document.getElementById('mini-rating').textContent = d.feedback.averageRating || '—';
      document.getElementById('mini-feedback-count').textContent = `${d.feedback.total} response${d.feedback.total === 1 ? '' : 's'}`;
      document.getElementById('mini-avg-resolution').textContent = d.avgResolutionDays ? `${d.avgResolutionDays} days` : '—';

      statusDoughnut('chart-status', d.byStatus);
      categoryBarChart('chart-category', d.byCategory);
      timeLineChart('chart-time', d.overTime);

      const tbody = document.getElementById('recent-body');
      if (!d.recent.length) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h3>No complaints yet</h3><p>New complaints will appear here.</p></div></td></tr>`;
      } else {
        tbody.innerHTML = d.recent.map((c) => `
          <tr>
            <td class="mono">${escapeHtml(c.complaintId)}</td>
            <td>${escapeHtml(c.student?.name || '—')}</td>
            <td>${escapeHtml(c.category?.name || '—')}</td>
            <td>${priorityBadge(c.priority)}</td>
            <td>${statusBadge(c.status)}</td>
            <td class="cell-muted">${fmtDate(c.createdAt)}</td>
            <td>${escapeHtml(c.assignedStaff?.name || '—')}</td>
            <td><a class="btn btn-outline btn-sm" href="/complaint-details.html?id=${c._id}">View</a></td>
          </tr>`).join('');
      }
      refreshIcons();
    } catch (err) {
      toast(err.message, 'error');
    }
  })();
}

/* ================= Admin Complaints ================= */
const adComplaints = document.getElementById('admin-complaints-root');
if (adComplaints) {
  (async function initAdminComplaints() {
    const user = requireAuth('admin');
    if (!user) return;
    renderShell({ role: 'admin', active: 'complaints', title: 'Complaint Management' });
    await loadCategoriesInto('f-category', true);

    ['f-search', 'f-from', 'f-to'].forEach((id) =>
      document.getElementById(id).addEventListener('input', debounceAdmin)
    );
    ['f-category', 'f-priority', 'f-status', 'f-sort'].forEach((id) =>
      document.getElementById(id).addEventListener('change', loadAdminComplaints)
    );
    document.getElementById('f-reset').addEventListener('click', resetAdminFilters);
    loadAdminComplaints();
  })();
}

let adminDebounceTimer = null;
function debounceAdmin() {
  clearTimeout(adminDebounceTimer);
  adminDebounceTimer = setTimeout(loadAdminComplaints, 350);
}

function resetAdminFilters() {
  ['f-search', 'f-from', 'f-to'].forEach((id) => (document.getElementById(id).value = ''));
  ['f-category', 'f-priority', 'f-status'].forEach((id) => (document.getElementById(id).value = ''));
  document.getElementById('f-sort').value = 'newest';
  loadAdminComplaints();
}

async function loadAdminComplaints() {
  const body = document.getElementById('admin-complaints-body');
  body.innerHTML = `<tr><td colspan="9"><div class="loading"><div class="spinner"></div>Loading complaints...</div></td></tr>`;

  const qs = new URLSearchParams();
  const search = document.getElementById('f-search').value.trim();
  const category = document.getElementById('f-category').value;
  const priority = document.getElementById('f-priority').value;
  const status = document.getElementById('f-status').value;
  const from = document.getElementById('f-from').value;
  const to = document.getElementById('f-to').value;
  const sort = document.getElementById('f-sort').value;

  if (search) qs.set('search', search);
  if (category) qs.set('category', category);
  if (priority) qs.set('priority', priority);
  if (status) qs.set('status', status);
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  qs.set('sort', sort);

  try {
    const res = await apiGet('/admin/complaints?' + qs.toString());
    document.getElementById('ac-count').textContent = `${res.count} complaint${res.count === 1 ? '' : 's'}`;
    if (!res.data.length) {
      body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i data-lucide="search-x"></i><h3>No complaints found</h3><p>Try adjusting the search or filters.</p></div></td></tr>`;
      refreshIcons();
      return;
    }
    body.innerHTML = res.data.map((c) => `
      <tr>
        <td class="mono">${escapeHtml(c.complaintId)}</td>
        <td>${escapeHtml(c.student?.name || '—')}<div class="cell-muted">${escapeHtml(c.student?.studentId || '')}</div></td>
        <td class="cell-strong">${escapeHtml(c.title.length > 36 ? c.title.slice(0, 36) + '…' : c.title)}</td>
        <td>${escapeHtml(c.category?.name || '—')}</td>
        <td>${priorityBadge(c.priority)}</td>
        <td>${statusBadge(c.status)}</td>
        <td class="cell-muted">${fmtDate(c.createdAt)}</td>
        <td>${escapeHtml(c.assignedStaff?.name || '—')}</td>
        <td><a class="btn btn-outline btn-sm" href="/complaint-details.html?id=${c._id}">View</a></td>
      </tr>`).join('');
    refreshIcons();
  } catch (err) {
    body.innerHTML = `<tr><td colspan="9"><div class="empty-state"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div></td></tr>`;
  }
}

/* ================= Admin Students ================= */
const adUsers = document.getElementById('admin-users-root');
if (adUsers) {
  (async function initAdminUsers() {
    const user = requireAuth('admin');
    if (!user) return;
    renderShell({ role: 'admin', active: 'students', title: 'Registered Students' });
    try {
      const res = await apiGet('/admin/users');
      document.getElementById('users-count').textContent = `${res.count} student${res.count === 1 ? '' : 's'}`;
      const body = document.getElementById('users-body');
      if (!res.data.length) {
        body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><h3>No students registered</h3><p>Student accounts will appear here.</p></div></td></tr>`;
      } else {
        body.innerHTML = res.data.map((s) => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td class="mono">${escapeHtml(s.studentId || '—')}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.department || '—')}</td>
            <td>${escapeHtml(s.year || '—')}</td>
            <td class="cell-muted">${fmtDate(s.createdAt)}</td>
          </tr>`).join('');
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  })();
}

/* ================= Admin Staff ================= */
const adStaff = document.getElementById('admin-staff-root');
if (adStaff) {
  (async function initAdminStaff() {
    const user = requireAuth('admin');
    if (!user) return;
    renderShell({ role: 'admin', active: 'staff', title: 'Staff Members' });
    try {
      const res = await apiGet('/admin/staff');
      document.getElementById('staff-count').textContent = `${res.count} staff member${res.count === 1 ? '' : 's'}`;
      const body = document.getElementById('staff-body');
      if (!res.data.length) {
        body.innerHTML = `<tr><td colspan="6"><div class="empty-state"><h3>No staff accounts</h3><p>Staff accounts are created by the system/DB administrator.</p></div></td></tr>`;
      } else {
        body.innerHTML = res.data.map((s) => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.department || '—')}</td>
            <td>${s.totalAssigned}</td>
            <td>${s.activeAssignments}</td>
            <td>${s.resolvedCount}</td>
          </tr>`).join('');
      }
    } catch (err) {
      toast(err.message, 'error');
    }
  })();
}

/* ================= Admin Categories ================= */
const adCategories = document.getElementById('admin-categories-root');
if (adCategories) {
  (async function initAdminCategories() {
    const user = requireAuth('admin');
    if (!user) return;
    renderShell({ role: 'admin', active: 'categories', title: 'Complaint Categories' });

    document.getElementById('cat-add-btn').addEventListener('click', () => openCategoryModal());
    document.getElementById('cat-form').addEventListener('submit', saveCategory);
    document.getElementById('cat-cancel').addEventListener('click', () => closeModal('cat-modal'));
    loadAdminCategories();
  })();
}

let editingCategoryId = null;

async function loadAdminCategories() {
  const body = document.getElementById('categories-body');
  body.innerHTML = `<tr><td colspan="5"><div class="loading"><div class="spinner"></div>Loading...</div></td></tr>`;
  try {
    const res = await apiGet('/admin/categories');
    document.getElementById('cat-count').textContent = `${res.count} categorie${res.count === 1 ? 'y' : 's'}`;
    if (!res.data.length) {
      body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><h3>No categories</h3><p>Add your first category using the button above.</p></div></td></tr>`;
      return;
    }
    body.innerHTML = res.data.map((cat) => `
      <tr>
        <td class="cell-strong">${escapeHtml(cat.name)}</td>
        <td class="cell-muted">${escapeHtml(cat.description || '—')}</td>
        <td>${cat.active ? '<span class="badge badge-resolved">Active</span>' : '<span class="badge badge-rejected">Inactive</span>'}</td>
        <td>${cat.complaintCount}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-outline btn-sm" onclick='openCategoryModal(${JSON.stringify(cat)})'>Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteCategory('${cat._id}', '${escapeHtml(cat.name).replace(/'/g, '')}', ${cat.complaintCount})">Delete</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (err) {
    body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div></td></tr>`;
  }
}

function openCategoryModal(cat = null) {
  editingCategoryId = cat?._id || null;
  document.getElementById('cat-modal-title').textContent = cat ? 'Edit Category' : 'Add Category';
  document.getElementById('cat-name').value = cat?.name || '';
  document.getElementById('cat-description').value = cat?.description || '';
  document.getElementById('cat-active').checked = cat ? cat.active : true;
  alertBox('cat-alert', '');
  openModal('cat-modal');
}

async function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  if (!name) return alertBox('cat-alert', 'Category name is required', 'error');

  const payload = {
    name,
    description: document.getElementById('cat-description').value.trim(),
    active: document.getElementById('cat-active').checked,
  };
  try {
    if (editingCategoryId) {
      await apiPut(`/admin/categories/${editingCategoryId}`, payload);
      toast('Category updated');
    } else {
      await apiPost('/admin/categories', payload);
      toast('Category created');
    }
    closeModal('cat-modal');
    loadAdminCategories();
  } catch (err) {
    alertBox('cat-alert', err.message, 'error');
  }
}

async function deleteCategory(id, name, count) {
  if (count > 0) {
    toast(`Cannot delete "${name}": ${count} complaint(s) use it. Deactivate instead.`, 'error');
    return;
  }
  if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
  try {
    await apiDelete(`/admin/categories/${id}`);
    toast('Category deleted');
    loadAdminCategories();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ================= Admin Reports ================= */
const adReports = document.getElementById('admin-reports-root');
if (adReports) {
  (async function initAdminReports() {
    const user = requireAuth('admin');
    if (!user) return;
    renderShell({ role: 'admin', active: 'reports', title: 'Reports & Analytics' });
    try {
      const res = await apiGet('/admin/dashboard');
      const d = res.data;

      document.getElementById('rp-total').textContent = d.stats.total;
      document.getElementById('rp-rejected').textContent = d.stats.rejected;
      document.getElementById('rp-avg-resolution').textContent = d.avgResolutionDays ? `${d.avgResolutionDays} days` : '—';
      document.getElementById('rp-rating').textContent = d.feedback.averageRating || '—';

      categoryBarChart('rp-chart-category', d.byCategory);
      statusDoughnut('rp-chart-status', d.byStatus);
      timeLineChart('rp-chart-time', d.overTime);

      // Priority breakdown table
      const pr = d.byPriority || [];
      const total = pr.reduce((s, p) => s + p.count, 0) || 1;
      document.getElementById('rp-priority-body').innerHTML = pr.map((p) => `
        <tr>
          <td>${priorityBadge(p._id)}</td>
          <td>${p.count}</td>
          <td>${Math.round((p.count / total) * 100)}%</td>
        </tr>`).join('');
      refreshIcons();
    } catch (err) {
      toast(err.message, 'error');
    }
  })();
}

/* ================= Admin Feedback ================= */
const adFeedback = document.getElementById('admin-feedback-root');
if (adFeedback) {
  (async function initAdminFeedback() {
    const user = requireAuth('admin');
    if (!user) return;
    renderShell({ role: 'admin', active: 'feedback', title: 'Student Feedback' });
    try {
      const res = await apiGet('/admin/feedback');
      document.getElementById('fb-average').textContent = res.averageRating || '—';
      document.getElementById('fb-count').textContent = `${res.count} response${res.count === 1 ? '' : 's'}`;

      const body = document.getElementById('feedback-body');
      if (!res.data.length) {
        body.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i data-lucide="star"></i><h3>No feedback yet</h3><p>Students can rate complaints once they are resolved.</p></div></td></tr>`;
        refreshIcons();
        return;
      }
      body.innerHTML = res.data.map((f) => `
        <tr>
          <td class="mono">${escapeHtml(f.complaint?.complaintId || '—')}</td>
          <td class="cell-strong">${escapeHtml(f.complaint?.title || '—')}</td>
          <td>${escapeHtml(f.student?.name || '—')}</td>
          <td>${starsHtml(f.rating)} <span class="cell-muted">${f.rating}/5</span></td>
          <td class="cell-muted">${escapeHtml(f.comment || '—')}</td>
          <td class="cell-muted">${fmtDate(f.createdAt)}</td>
        </tr>`).join('');
    } catch (err) {
      toast(err.message, 'error');
    }
  })();
}
