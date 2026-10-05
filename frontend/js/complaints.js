/* =====================================================
   complaints.js — complaint details page (all roles)
   Renders details + timeline + status history and shows
   role-specific action panels:
     student → feedback form (after resolution)
     admin   → priority / assign / status / admin note
     staff   → progress note / start work / resolve
   ===================================================== */

const cdRoot = document.getElementById('cd-root');
let currentComplaint = null;
let currentUser = null;
let cdStaff = []; // staff list for admin assignment

if (cdRoot) {
  (async function initComplaintDetails() {
    currentUser = requireAuth();
    if (!currentUser) return;

    const titles = { student: 'Complaint Details', admin: 'Complaint Details', staff: 'Assigned Complaint' };
    renderShell({ role: currentUser.role, active: '', title: titles[currentUser.role] || 'Complaint' });

    const id = getQueryParam('id');
    if (!id) {
      cdRoot.innerHTML = `<div class="card"><div class="empty-state"><h3>No complaint selected</h3><p><a href="${redirectPathFor(currentUser.role)}">Go back</a></p></div></div>`;
      return;
    }

    await loadComplaint(id);

    // Success banner after fresh submission
    if (getQueryParam('new') === '1' && currentUser.role === 'student') {
      alertBox('cd-banner', 'Complaint submitted successfully.', 'success');
    }
  })();
}

async function loadComplaint(id) {
  cdRoot.innerHTML = `<div class="loading"><div class="spinner"></div>Loading complaint...</div>`;
  try {
    const res = await apiGet('/complaints/' + id);
    currentComplaint = res.data;
    renderComplaint();
  } catch (err) {
    cdRoot.innerHTML = `
      <div class="card">
        <div class="empty-state">
          <i data-lucide="file-x-2"></i>
          <h3>${err.status === 404 ? 'Complaint not found' : 'Could not load complaint'}</h3>
          <p>${escapeHtml(err.message)}</p>
          <a class="btn btn-outline btn-sm mt-1" href="${redirectPathFor(currentUser.role)}">Back to dashboard</a>
        </div>
      </div>`;
    refreshIcons();
  }
}

/* ================= Rendering ================= */
function renderComplaint() {
  const c = currentComplaint;
  const isStudent = currentUser.role === 'student';
  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'staff';

  cdRoot.innerHTML = `
    <div id="cd-banner" class="alert" hidden></div>
    <div class="detail-grid">
      <div>
        <div class="card">
          <div class="flex-between mb-1">
            <div>
              <span class="mono text-muted">${escapeHtml(c.complaintId)}</span>
              <h2>${escapeHtml(c.title)}</h2>
            </div>
            <div style="display:flex;gap:.4rem;flex-wrap:wrap;justify-content:flex-end">
              ${priorityBadge(c.priority)}
              ${statusBadge(c.status)}
            </div>
          </div>

          <ul class="meta-list mt-2">
            <li><span class="k">Category</span><span class="v">${escapeHtml(c.category?.name || '—')}</span></li>
            <li><span class="k">Location</span><span class="v">${escapeHtml(c.location)}</span></li>
            ${!isStudent ? `<li><span class="k">Student</span><span class="v">${escapeHtml(c.student?.name || '—')}${c.student?.studentId ? ` <span class="cell-muted">(${escapeHtml(c.student.studentId)})</span>` : ''}</span></li>` : ''}
            <li><span class="k">Assigned Staff</span><span class="v">${escapeHtml(c.assignedStaff?.name || 'Not assigned yet')}</span></li>
            <li><span class="k">Submitted</span><span class="v">${fmtDateTime(c.createdAt)}</span></li>
            <li><span class="k">Last Updated</span><span class="v">${fmtDateTime(c.updatedAt)}</span></li>
          </ul>

          <h3 class="mt-2 mb-1">Description</h3>
          <p style="white-space:pre-wrap">${escapeHtml(c.description)}</p>

          ${c.attachment ? `
            <h3 class="mt-2 mb-1">Attachment</h3>
            <a href="${escapeHtml(c.attachment)}" target="_blank" rel="noopener">
              <img src="${escapeHtml(c.attachment)}" alt="Complaint attachment" class="attachment-thumb"/>
            </a>` : ''}

          ${c.resolutionNotes ? `
            <h3 class="mt-2 mb-1">Resolution Notes</h3>
            <div class="note-item"><div class="note-text">${escapeHtml(c.resolutionNotes)}</div></div>` : ''}
        </div>

        ${c.notes?.length ? `
        <div class="card">
          <div class="card-title">Progress Notes</div>
          ${c.notes.map((n) => `
            <div class="note-item">
              <div class="note-meta">${escapeHtml(n.byName || 'User')} (${escapeHtml(n.byRole || '')}) · ${fmtDateTime(n.at)}</div>
              <div class="note-text">${escapeHtml(n.text)}</div>
            </div>`).join('')}
        </div>` : ''}

        ${renderFeedbackSection()}
      </div>

      <div>
        <div class="card">
          <div class="card-title">Progress Timeline</div>
          <ul class="timeline">${timelineHtml(c)}</ul>
        </div>

        <div class="card">
          <div class="card-title">Status History</div>
          ${c.history?.length ? `
            <ul class="history-list">
              ${c.history.map((h) => `
                <li>
                  <span><strong>${escapeHtml(h.status)}</strong> ${h.note ? `<span class="h-note">— ${escapeHtml(h.note)}</span>` : ''}</span>
                  <span class="cell-muted">${fmtDateTime(h.changedAt)}${h.changedBy?.name ? ` · ${escapeHtml(h.changedBy.name)}` : ''}</span>
                </li>`).join('')}
            </ul>` : '<p class="text-muted">No history recorded.</p>'}
        </div>

        ${isAdmin ? renderAdminActions() : ''}
        ${isStaff ? renderStaffActions() : ''}
      </div>
    </div>`;
  refreshIcons();
  if (isAdmin) wireAdminActions();
  if (isStaff) wireStaffActions();
  if (isStudent) wireFeedbackForm();
}

/* Timeline: main path steps; Rejected handled separately */
function timelineHtml(c) {
  if (c.status === 'Rejected') {
    const rej = [...(c.history || [])].reverse().find((h) => h.status === 'Rejected');
    return `
      <li class="done"><span class="dot"></span><div class="step-title">Submitted</div><div class="step-date">${fmtDateTime(c.createdAt)}</div></li>
      <li class="rejected"><span class="dot"></span>
        <div class="step-title">Rejected</div>
        <div class="step-date">${rej ? fmtDateTime(rej.changedAt) : ''}</div>
        ${rej?.note ? `<div class="step-note">${escapeHtml(rej.note)}</div>` : ''}</li>`;
  }
  const steps = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const reached = {};
  (c.history || []).forEach((h) => {
    if (steps.includes(h.status) && (!reached[h.status] || h.changedAt > reached[h.status]))
      reached[h.status] = h.changedAt;
  });
  let idx = steps.indexOf(c.status);
  if (idx === -1) idx = 0;
  return steps
    .map((s, i) => {
      const state = i < idx ? 'done' : i === idx ? 'current' : 'pending';
      const when = reached[s] ? fmtDateTime(reached[s]) : i === idx ? fmtDateTime(c.updatedAt) : '';
      return `<li class="${state}"><span class="dot"></span>
        <div class="step-title">${s}</div>
        ${when ? `<div class="step-date">${when}</div>` : ''}</li>`;
    })
    .join('');
}

function renderFeedbackSection() {
  if (currentUser.role !== 'student') return '';
  const c = currentComplaint;
  const resolvedLike = ['Resolved', 'Closed'].includes(c.status);
  if (!resolvedLike) return '';
  if (c.feedback) {
    return `
      <div class="card">
        <div class="card-title">Your Feedback</div>
        <div class="feedback-summary">
          ${starsHtml(c.feedback.rating)}
          <span class="text-muted">${c.feedback.rating}/5</span>
        </div>
        ${c.feedback.comment ? `<p class="mt-1">"${escapeHtml(c.feedback.comment)}"</p>` : ''}
        <p class="text-muted mt-1" style="font-size:.78rem">Submitted on ${fmtDateTime(c.feedback.createdAt)}</p>
      </div>`;
  }
  return `
    <div class="card">
      <div class="card-title">Rate the Resolution</div>
      <div id="fb-alert" class="alert alert-error" hidden></div>
      <div class="form-group">
        <label>Your Rating</label>
        <div class="stars" id="fb-stars">
          ${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-v="${i}" aria-label="${i} star">★</button>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label for="fb-comment">Comment (optional)</label>
        <textarea id="fb-comment" class="form-control" maxlength="500" placeholder="Share your experience with the resolution..."></textarea>
      </div>
      <button id="fb-submit" class="btn btn-primary">Submit Feedback</button>
    </div>`;
}

/* ================= Admin actions ================= */
function renderAdminActions() {
  const c = currentComplaint;
  const canChangeStatus = !['Closed', 'Rejected'].includes(c.status);
  const allowed = TRANSITIONS[c.status] || [];
  const assignable = !['Resolved', 'Closed', 'Rejected'].includes(c.status);

  return `
    <div class="card">
      <div class="card-title">Admin Actions</div>
      <div id="aa-alert" class="alert alert-error" hidden></div>

      <div class="form-group">
        <label for="aa-priority">Change Priority</label>
        <div style="display:flex;gap:.5rem">
          <select id="aa-priority" class="form-control">
            ${['Low', 'Medium', 'High', 'Critical'].map((p) => `<option ${p === c.priority ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
          <button id="aa-priority-btn" class="btn btn-outline">Update</button>
        </div>
      </div>

      ${assignable ? `
      <div class="form-group">
        <label for="aa-staff">Assign to Staff</label>
        <div style="display:flex;gap:.5rem">
          <select id="aa-staff" class="form-control"><option value="">Loading staff...</option></select>
          <button id="aa-assign-btn" class="btn btn-primary">Assign</button>
        </div>
      </div>` : ''}

      ${canChangeStatus && allowed.length ? `
      <div class="form-group">
        <label for="aa-status">Update Status (allowed: ${allowed.join(', ')})</label>
        <div style="display:flex;gap:.5rem">
          <select id="aa-status" class="form-control">
            ${allowed.map((s) => `<option value="${s}">${s}</option>`).join('')}
          </select>
          <button id="aa-status-btn" class="btn btn-outline">Update</button>
        </div>
      </div>` : ''}

      ${canChangeStatus ? `
      <div class="form-group">
        <label for="aa-note">Add Admin Note</label>
        <textarea id="aa-note" class="form-control" style="min-height:70px" maxlength="1000" placeholder="Internal note about this complaint..."></textarea>
        <button id="aa-note-btn" class="btn btn-outline mt-1">Save Note</button>
      </div>` : ''}
    </div>`;
}

function wireAdminActions() {
  loadStaffOptions();

  document.getElementById('aa-priority-btn')?.addEventListener('click', async () => {
    const priority = document.getElementById('aa-priority').value;
    try {
      await apiPut(`/admin/complaints/${currentComplaint._id}`, { priority });
      toast('Priority updated');
      await loadComplaint(currentComplaint._id);
    } catch (err) { aaError(err.message); }
  });

  document.getElementById('aa-assign-btn')?.addEventListener('click', async () => {
    const staffId = document.getElementById('aa-staff').value;
    if (!staffId) return aaError('Please select a staff member');
    try {
      const res = await apiPut(`/admin/complaints/${currentComplaint._id}/assign`, { staffId });
      toast(res.message || 'Complaint assigned');
      await loadComplaint(currentComplaint._id);
    } catch (err) { aaError(err.message); }
  });

  document.getElementById('aa-status-btn')?.addEventListener('click', async () => {
    const status = document.getElementById('aa-status').value;
    const note = document.getElementById('aa-note')?.value.trim() || '';
    try {
      await apiPut(`/admin/complaints/${currentComplaint._id}`, { status, note });
      toast(`Status updated to ${status}`);
      await loadComplaint(currentComplaint._id);
    } catch (err) { aaError(err.message); }
  });

  document.getElementById('aa-note-btn')?.addEventListener('click', async () => {
    const note = document.getElementById('aa-note').value.trim();
    if (!note) return aaError('Note cannot be empty');
    try {
      await apiPut(`/admin/complaints/${currentComplaint._id}`, { note });
      toast('Note added');
      await loadComplaint(currentComplaint._id);
    } catch (err) { aaError(err.message); }
  });
}

async function loadStaffOptions() {
  const sel = document.getElementById('aa-staff');
  if (!sel) return;
  try {
    const res = await apiGet('/admin/staff');
    cdStaff = res.data;
    sel.innerHTML =
      '<option value="">Select staff member</option>' +
      cdStaff
        .map((s) => `<option value="${s._id}" ${currentComplaint.assignedStaff?._id === s._id ? 'selected' : ''}>
          ${escapeHtml(s.name)} — ${escapeHtml(s.department || 'Staff')} (${s.activeAssignments} active)
        </option>`)
        .join('');
  } catch (err) {
    sel.innerHTML = `<option value="">Could not load staff</option>`;
  }
}

function aaError(msg) {
  const el = document.getElementById('aa-alert');
  if (el) { el.textContent = msg; el.hidden = false; } else toast(msg, 'error');
}

/* ================= Staff actions ================= */
function renderStaffActions() {
  const c = currentComplaint;
  const allowed = STAFF_TRANSITIONS[c.status] || [];
  const isDone = ['Resolved', 'Closed', 'Rejected'].includes(c.status);

  return `
    <div class="card">
      <div class="card-title">Work on this Complaint</div>
      <div id="sa-alert" class="alert alert-error" hidden></div>

      ${!isDone ? `
      <div class="form-group">
        <label for="sa-note">Add Progress Note</label>
        <textarea id="sa-note" class="form-control" style="min-height:70px" maxlength="1000" placeholder="What work has been done or planned?"></textarea>
        <button id="sa-note-btn" class="btn btn-outline mt-1">Save Note</button>
      </div>
      <div class="form-group">
        <label for="sa-status">Update Status</label>
        <select id="sa-status" class="form-control">
          ${allowed.map((s) => `<option value="${s}">${s}</option>`).join('') || '<option value="">No transitions available</option>'}
        </select>
        <button id="sa-status-btn" class="btn btn-primary mt-1" ${allowed.length ? '' : 'disabled'}>Update Status</button>
      </div>
      ${c.status === 'In Progress' ? `
      <div class="form-group">
        <label for="sa-resolution">Resolution Notes (required to resolve)</label>
        <textarea id="sa-resolution" class="form-control" style="min-height:90px" maxlength="2000" placeholder="How was the issue fixed?"></textarea>
        <button id="sa-resolve-btn" class="btn btn-success mt-1">Mark as Resolved</button>
      </div>` : ''}` : `
      <p class="text-success" style="display:flex;align-items:center;gap:.4rem">
        <i data-lucide="check-circle-2"></i> This complaint is ${c.status.toLowerCase()}.
      </p>
      ${c.resolutionNotes ? `<p class="mt-1"><strong>Resolution:</strong> ${escapeHtml(c.resolutionNotes)}</p>` : ''}`}
    </div>`;
}

function wireStaffActions() {
  document.getElementById('sa-note-btn')?.addEventListener('click', async () => {
    const note = document.getElementById('sa-note').value.trim();
    if (!note) return saError('Note cannot be empty');
    try {
      await apiPut(`/staff/complaints/${currentComplaint._id}/note`, { note });
      toast('Progress note added');
      await loadComplaint(currentComplaint._id);
    } catch (err) { saError(err.message); }
  });

  document.getElementById('sa-status-btn')?.addEventListener('click', async () => {
    const status = document.getElementById('sa-status').value;
    if (!status) return;
    try {
      await apiPut(`/staff/complaints/${currentComplaint._id}/status`, {
        status,
        note: document.getElementById('sa-note')?.value.trim() || '',
      });
      toast(`Status updated to ${status}`);
      await loadComplaint(currentComplaint._id);
    } catch (err) { saError(err.message); }
  });

  document.getElementById('sa-resolve-btn')?.addEventListener('click', async () => {
    const resolutionNotes = document.getElementById('sa-resolution').value.trim();
    if (resolutionNotes.length < 5) return saError('Resolution notes are required (at least 5 characters)');
    try {
      await apiPut(`/staff/complaints/${currentComplaint._id}/resolve`, { resolutionNotes });
      toast('Complaint marked as resolved');
      await loadComplaint(currentComplaint._id);
    } catch (err) { saError(err.message); }
  });
}

function saError(msg) {
  const el = document.getElementById('sa-alert');
  if (el) { el.textContent = msg; el.hidden = false; } else toast(msg, 'error');
}

/* ================= Student feedback ================= */
let fbRating = 0;
function wireFeedbackForm() {
  const stars = document.getElementById('fb-stars');
  if (!stars) return;

  stars.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      fbRating = parseInt(btn.dataset.v, 10);
      stars.querySelectorAll('button').forEach((b) =>
        b.classList.toggle('active', parseInt(b.dataset.v, 10) <= fbRating)
      );
    });
  });

  document.getElementById('fb-submit').addEventListener('click', async () => {
    const alertEl = document.getElementById('fb-alert');
    alertEl.hidden = true;
    if (!fbRating) {
      alertEl.textContent = 'Please select a rating first';
      alertEl.hidden = false;
      return;
    }
    const comment = document.getElementById('fb-comment').value.trim();
    const btn = document.getElementById('fb-submit');
    setButtonLoading(btn, true, 'Submitting...');
    try {
      const res = await apiPost(`/complaints/${currentComplaint._id}/feedback`, { rating: fbRating, comment });
      toast(res.message || 'Feedback submitted');
      await loadComplaint(currentComplaint._id);
    } catch (err) {
      alertEl.textContent = err.message;
      alertEl.hidden = false;
      setButtonLoading(btn, false);
    }
  });
}
