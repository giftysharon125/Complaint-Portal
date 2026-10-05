/* =====================================================
   student.js — student dashboard, submit complaint,
   my complaints list
   ===================================================== */

/* ================= Student Dashboard ================= */
const dashTable = document.getElementById('dash-complaints-body');
let myComplaintsCache = [];

if (dashTable && document.getElementById('dash-chart')) {
  (async function initStudentDashboard() {
    const user = requireAuth('student');
    if (!user) return;
    renderShell({
      role: 'student',
      active: 'dashboard',
      title: 'Student Dashboard',
      subtitle: new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    });
    document.getElementById('welcome-name').textContent = user.name;

    await loadStudentDashboard('all');
  })();
}

// Pill filter on the dashboard
document.querySelectorAll('#dash-pills .pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('#dash-pills .pill').forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    loadStudentDashboard(pill.dataset.filter);
  });
});

async function loadStudentDashboard(filter = 'all') {
  const body = document.getElementById('dash-complaints-body');
  body.innerHTML = `<tr><td colspan="7"><div class="loading"><div class="spinner"></div>Loading complaints...</div></td></tr>`;
  try {
    const res = await apiGet('/complaints/my?status=' + filter);
    myComplaintsCache = res.data;
    renderDashStats(res.data);
    renderDashTable(res.data);
    renderDashChart(res.data);
  } catch (err) {
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h3>Could not load complaints</h3><p>${escapeHtml(err.message)}</p></div></td></tr>`;
  }
}

function renderDashStats(complaints) {
  const counts = { total: complaints.length, pending: 0, inprogress: 0, resolved: 0 };
  complaints.forEach((c) => {
    if (STATUS_GROUPS.pending.includes(c.status)) counts.pending++;
    else if (c.status === 'In Progress') counts.inprogress++;
    else if (STATUS_GROUPS.resolved.includes(c.status)) counts.resolved++;
  });
  // NOTE: stats shown reflect the currently filtered list; the four cards
  // always describe the whole dataset, so fetch totals when filter != all
  if (document.querySelector('#dash-pills .pill.active')?.dataset.filter === 'all') {
    setStatValues(counts);
  } else {
    apiGet('/complaints/my').then((res) => {
      const all = { total: res.data.length, pending: 0, inprogress: 0, resolved: 0 };
      res.data.forEach((c) => {
        if (STATUS_GROUPS.pending.includes(c.status)) all.pending++;
        else if (c.status === 'In Progress') all.inprogress++;
        else if (STATUS_GROUPS.resolved.includes(c.status)) all.resolved++;
      });
      setStatValues(all);
    }).catch(() => {});
  }
}
function setStatValues(counts) {
  document.getElementById('stat-total').textContent = counts.total;
  document.getElementById('stat-pending').textContent = counts.pending;
  document.getElementById('stat-inprogress').textContent = counts.inprogress;
  document.getElementById('stat-resolved').textContent = counts.resolved;
}

function renderDashTable(complaints) {
  const body = document.getElementById('dash-complaints-body');
  if (!complaints.length) {
    body.innerHTML = `
      <tr><td colspan="7">
        <div class="empty-state">
          <i data-lucide="inbox"></i>
          <h3>No complaints found</h3>
          <p>You have not submitted any complaints in this filter yet.</p>
          <a href="/submit-complaint.html" class="btn btn-primary btn-sm mt-1">Submit your first complaint</a>
        </div>
      </td></tr>`;
    refreshIcons();
    return;
  }
  body.innerHTML = complaints.slice(0, 8).map((c) => `
    <tr>
      <td class="mono">${escapeHtml(c.complaintId)}</td>
      <td class="cell-strong">${escapeHtml(c.title.length > 42 ? c.title.slice(0, 42) + '…' : c.title)}</td>
      <td>${escapeHtml(c.category?.name || '—')}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="cell-muted">${fmtDate(c.createdAt)}</td>
      <td><a class="btn btn-outline btn-sm" href="/complaint-details.html?id=${c._id}">View</a></td>
    </tr>`).join('');
  refreshIcons();
}

let dashChart = null;
function renderDashChart(complaints) {
  // Distribution over ALL of the student's complaints
  apiGet('/complaints/my').then((res) => {
    const counts = {};
    res.data.forEach((c) => (counts[c.status] = (counts[c.status] || 0) + 1));
    const byStatus = Object.entries(counts).map(([status, count]) => ({ status, count }));
    if (dashChart) dashChart.destroy();
    dashChart = statusDoughnut('dash-chart', byStatus);
  }).catch(() => {});
}

/* ================= Submit Complaint ================= */
const submitForm = document.getElementById('submit-form');
if (submitForm) {
  (async function initSubmitPage() {
    const user = requireAuth('student');
    if (!user) return;
    renderShell({ role: 'student', active: 'submit', title: 'Submit Complaint' });

    // Load active categories
    try {
      const res = await apiGet('/categories');
      const sel = document.getElementById('sc-category');
      sel.innerHTML =
        '<option value="">Select a category</option>' +
        res.data.map((c) => `<option value="${c._id}">${escapeHtml(c.name)}</option>`).join('');
    } catch (err) {
      toast(err.message, 'error');
    }

    // Attachment name preview
    document.getElementById('sc-attachment').addEventListener('change', (e) => {
      const f = e.target.files[0];
      document.getElementById('sc-file-name').textContent = f ? f.name : 'No file chosen (JPG/PNG, max 5 MB)';
    });

    submitForm.addEventListener('submit', onSubmitComplaint);
    document.getElementById('sc-cancel').addEventListener('click', () => (window.location.href = '/student-dashboard.html'));
  })();
}

async function onSubmitComplaint(e) {
  e.preventDefault();
  alertBox('sc-alert', '');

  const title = document.getElementById('sc-title').value.trim();
  const category = document.getElementById('sc-category').value;
  const description = document.getElementById('sc-description').value.trim();
  const location = document.getElementById('sc-location').value.trim();
  const priority = document.getElementById('sc-priority').value;
  const file = document.getElementById('sc-attachment').files[0];

  let valid = true;
  if (title.length < 5) { showFieldError2('sc-title', 'Title must be at least 5 characters'); valid = false; } else clearFieldError2('sc-title');
  if (!category) { showFieldError2('sc-category', 'Please select a category'); valid = false; } else clearFieldError2('sc-category');
  if (description.length < 10) { showFieldError2('sc-description', 'Description must be at least 10 characters'); valid = false; } else clearFieldError2('sc-description');
  if (!location) { showFieldError2('sc-location', 'Location is required'); valid = false; } else clearFieldError2('sc-location');
  if (!valid) return;

  const btn = document.getElementById('sc-submit');
  setButtonLoading(btn, true, 'Submitting...');
  try {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('category', category);
    fd.append('description', description);
    fd.append('location', location);
    fd.append('priority', priority);
    if (file) fd.append('attachment', file);

    const res = await apiPostForm('/complaints', fd);
    toast(res.message || 'Complaint submitted successfully.');
    window.location.href = `/complaint-details.html?id=${res.data._id}&new=1`;
  } catch (err) {
    alertBox('sc-alert', err.message, 'error');
    setButtonLoading(btn, false);
  }
}

function showFieldError2(id, message) {
  const el = document.getElementById(id);
  const err = document.getElementById(id + '-error');
  if (el) el.classList.add('invalid');
  if (err) { err.textContent = message; err.classList.add('show'); }
}
function clearFieldError2(id) {
  const el = document.getElementById(id);
  const err = document.getElementById(id + '-error');
  if (el) el.classList.remove('invalid');
  if (err) { err.textContent = ''; err.classList.remove('show'); }
}

/* ================= My Complaints ================= */
const myTable = document.getElementById('my-complaints-body');
if (myTable) {
  (async function initMyComplaints() {
    const user = requireAuth('student');
    if (!user) return;
    renderShell({ role: 'student', active: 'my', title: 'My Complaints' });
    await loadCategoriesInto('my-category', true);
    document.getElementById('my-search').addEventListener('input', debounceMy);
    document.getElementById('my-category').addEventListener('change', loadMyComplaints);
    loadMyComplaints();
  })();
}

let myDebounceTimer = null;
function debounceMy() {
  clearTimeout(myDebounceTimer);
  myDebounceTimer = setTimeout(loadMyComplaints, 350);
}

async function loadMyComplaints() {
  const body = document.getElementById('my-complaints-body');
  body.innerHTML = `<tr><td colspan="7"><div class="loading"><div class="spinner"></div>Loading...</div></td></tr>`;

  const status = document.getElementById('my-status')?.value || 'all';
  const category = document.getElementById('my-category')?.value || '';
  const search = document.getElementById('my-search')?.value.trim() || '';

  const qs = new URLSearchParams({ status });
  if (category) qs.set('category', category);
  if (search) qs.set('search', search);

  try {
    const res = await apiGet('/complaints/my?' + qs.toString());
    const rows = res.data;
    document.getElementById('my-count').textContent = `${res.count} complaint${res.count === 1 ? '' : 's'}`;
    if (!rows.length) {
      body.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <i data-lucide="search-x"></i>
            <h3>No complaints found</h3>
            <p>Try changing the filters or submit a new complaint.</p>
          </div>
        </td></tr>`;
      refreshIcons();
      return;
    }
    body.innerHTML = rows.map((c) => `
      <tr>
        <td class="mono">${escapeHtml(c.complaintId)}</td>
        <td class="cell-strong">${escapeHtml(c.title)}</td>
        <td>${escapeHtml(c.category?.name || '—')}</td>
        <td>${priorityBadge(c.priority)}</td>
        <td>${statusBadge(c.status)}</td>
        <td class="cell-muted">${fmtDateTime(c.createdAt)}</td>
        <td><a class="btn btn-outline btn-sm" href="/complaint-details.html?id=${c._id}">View</a></td>
      </tr>`).join('');
    refreshIcons();
  } catch (err) {
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div></td></tr>`;
  }
}
