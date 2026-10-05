/* =====================================================
   profile.js — profile page (all roles)
   ===================================================== */

const profileForm = document.getElementById('profile-form');
if (profileForm) {
  (async function initProfile() {
    const user = requireAuth();
    if (!user) return;
    renderShell({ role: user.role, active: 'profile', title: 'My Profile' });

    // Fill fields (email & student ID are read-only)
    document.getElementById('pf-name').value = user.name || '';
    document.getElementById('pf-email').value = user.email || '';
    document.getElementById('pf-studentid').value = user.studentId || '—';
    document.getElementById('pf-role').value = user.role;

    // Department/year dropdowns only meaningful for students
    if (user.role === 'student') {
      const dep = document.getElementById('pf-department');
      const yr = document.getElementById('pf-year');
      dep.innerHTML = DEPARTMENTS.map((d) => `<option ${d === user.department ? 'selected' : ''}>${d}</option>`).join('');
      yr.innerHTML = YEARS.map((y) => `<option ${y === user.year ? 'selected' : ''}>${y}</option>`).join('');
    }

    // Member since + total complaints
    try {
      const res = await apiGet('/users/profile/summary');
      document.getElementById('pf-since').textContent = fmtDate(res.data.memberSince);
      document.getElementById('pf-total').textContent = res.data.totalComplaints;
      document.getElementById('pf-summary').classList.remove('hidden');
    } catch { /* non-fatal */ }

    profileForm.addEventListener('submit', saveProfile);
  })();
}

async function saveProfile(e) {
  e.preventDefault();
  alertBox('pf-alert', '');

  const name = document.getElementById('pf-name').value.trim();
  if (name.length < 3) return alertBox('pf-alert', 'Please enter your full name', 'error');

  const payload = { name };
  if (currentUserRole() === 'student') {
    payload.department = document.getElementById('pf-department').value;
    payload.year = document.getElementById('pf-year').value;
  }

  const btn = document.getElementById('pf-save');
  setButtonLoading(btn, true, 'Saving...');
  try {
    const res = await apiPut('/users/profile', payload);
    setSession(getToken(), res.user); // refresh cached user
    alertBox('pf-alert', res.message || 'Profile updated successfully', 'success');
    // Update topbar name without reload
    const nameEl = document.querySelector('.topbar-user .user-name');
    if (nameEl) nameEl.textContent = res.user.name;
  } catch (err) {
    alertBox('pf-alert', err.message, 'error');
  } finally {
    setButtonLoading(btn, false);
  }
}

function currentUserRole() {
  return getUser()?.role || 'student';
}
