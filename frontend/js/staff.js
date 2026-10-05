/* =====================================================
   staff.js — staff dashboard + assigned complaints list
   ===================================================== */

/* ================= Staff Dashboard ================= */
const staffDash = document.getElementById('staff-dashboard-root');
if (staffDash) {
  (async function initStaffDashboard() {
    const user = requireAuth('staff');
    if (!user) return;
    renderShell({
      role: 'staff',
      active: 'dashboard',
      title: 'Staff Dashboard',
      subtitle: `Welcome, ${user.name}`,
    });
    await loadStaffData('/staff/complaints');
  })();
}

/* ================= Staff Complaints page ================= */
const staffList = document.getElementById('staff-complaints-root');
if (staffList) {
  (async function initStaffComplaints() {
    const user = requireAuth('staff');
    if (!user) return;
    renderShell({ role: 'staff', active: 'assigned', title: 'Assigned Complaints' });
    await loadCategoriesInto('sf-category', true);
    document.getElementById('sf-category').addEventListener('change', loadStaffComplaints);
    document.getElementById('sf-search').addEventListener('input', debounceStaff);
    loadStaffComplaints();
  })();
}

let staffDebounceTimer = null;
function debounceStaff() {
  clearTimeout(staffDebounceTimer);
  staffDebounceTimer = setTimeout(loadStaffComplaints, 350);
}

async function loadStaffData(endpoint) {
  try {
    const res = await apiGet(endpoint);
    const all = res.data;

    const counts = { total: all.length, assigned: 0, inprogress: 0, resolved: 0 };
    all.forEach((c) => {
      if (c.status === 'Assigned') counts.assigned++;
      else if (c.status === 'In Progress') counts.inprogress++;
      else if (['Resolved', 'Closed'].includes(c.status)) counts.resolved++;
    });
    document.getElementById('sf-total').textContent = counts.total;
    document.getElementById('sf-assigned').textContent = counts.assigned;
    document.getElementById('sf-inprogress').textContent = counts.inprogress;
    document.getElementById('sf-resolved').textContent = counts.resolved;

    // Priority list: active complaints first (Assigned → In Progress), then done
    const active = all.filter((c) => ['Assigned', 'In Progress'].includes(c.status));
    const done = all.filter((c) => ['Resolved', 'Closed'].includes(c.status));
    const rows = [...active, ...done].slice(0, 10);

    const body = document.getElementById('staff-complaints-body');
    if (!rows.length) {
      body.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <h3>No complaints assigned yet</h3>
            <p>When the admin assigns complaints to you, they will appear here.</p>
          </div>
        </td></tr>`;
      refreshIcons();
      return;
    }
    body.innerHTML = rows.map((c) => `
      <tr>
        <td class="mono">${escapeHtml(c.complaintId)}</td>
        <td class="cell-strong">${escapeHtml(c.title.length > 40 ? c.title.slice(0, 40) + '…' : c.title)}</td>
        <td>${escapeHtml(c.category?.name || '—')}</td>
        <td>${priorityBadge(c.priority)}</td>
        <td>${statusBadge(c.status)}</td>
        <td class="cell-muted">${fmtDate(c.createdAt)}</td>
        <td><a class="btn btn-outline btn-sm" href="/complaint-details.html?id=${c._id}">Open</a></td>
      </tr>`).join('');
    refreshIcons();
  } catch (err) {
    const body = document.getElementById('staff-complaints-body');
    if (body) body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div></td></tr>`;
  }
}

async function loadStaffComplaints() {
  const body = document.getElementById('staff-complaints-body');
  body.innerHTML = `<tr><td colspan="7"><div class="loading"><div class="spinner"></div>Loading...</div></td></tr>`;

  const status = document.getElementById('sf-status').value;
  const category = document.getElementById('sf-category').value;
  const search = document.getElementById('sf-search').value.trim();

  const qs = new URLSearchParams();
  if (status === 'active') qs.set('status', 'active');
  else if (status === 'resolved') qs.set('status', 'resolved');
  if (category) qs.set('category', category);

  try {
    const res = await apiGet('/staff/complaints?' + qs.toString());
    let rows = res.data;
    if (search) {
      const rx = search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.complaintId.toLowerCase().includes(rx) ||
          c.title.toLowerCase().includes(rx) ||
          (c.student?.name || '').toLowerCase().includes(rx)
      );
    }
    document.getElementById('sf-count').textContent = `${rows.length} complaint${rows.length === 1 ? '' : 's'}`;

    if (!rows.length) {
      body.innerHTML = `
        <tr><td colspan="7">
          <div class="empty-state">
            <i data-lucide="search-x"></i>
            <h3>No complaints found</h3>
            <p>Nothing matches the current filters.</p>
          </div>
        </td></tr>`;
      refreshIcons();
      return;
    }
    body.innerHTML = rows.map((c) => `
      <tr>
        <td class="mono">${escapeHtml(c.complaintId)}</td>
        <td class="cell-strong">${escapeHtml(c.title)}</td>
        <td>${escapeHtml(c.student?.name || '—')}<div class="cell-muted">${escapeHtml(c.student?.studentId || '')}</div></td>
        <td>${escapeHtml(c.category?.name || '—')}</td>
        <td>${priorityBadge(c.priority)}</td>
        <td>${statusBadge(c.status)}</td>
        <td><a class="btn btn-outline btn-sm" href="/complaint-details.html?id=${c._id}">Open</a></td>
      </tr>`).join('');
    refreshIcons();
  } catch (err) {
    body.innerHTML = `<tr><td colspan="7"><div class="empty-state"><h3>Error</h3><p>${escapeHtml(err.message)}</p></div></td></tr>`;
  }
}
