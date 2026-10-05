/* =====================================================
   auth.js — login & registration pages
   ===================================================== */

/* ---------- Login page ---------- */
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox('login-alert', '');

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    let valid = true;
    if (!email) { showFieldError('email', 'Email is required'); valid = false; } else clearFieldError('email');
    if (!password) { showFieldError('password', 'Password is required'); valid = false; } else clearFieldError('password');
    if (!valid) return;

    const btn = document.getElementById('login-btn');
    setButtonLoading(btn, true, 'Signing in...');
    try {
      const res = await apiPost('/auth/login', { email, password });
      setSession(res.token, res.user);
      toast('Login successful');
      window.location.href = redirectPathFor(res.user.role);
    } catch (err) {
      alertBox('login-alert', err.message, 'error');
      setButtonLoading(btn, false);
    }
  });
}

/* ---------- Register page ---------- */
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox('register-alert', '');

    const name = document.getElementById('reg-name').value.trim();
    const studentId = document.getElementById('reg-studentid').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const department = document.getElementById('reg-department').value;
    const year = document.getElementById('reg-year').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    let valid = true;
    if (name.length < 3) { showFieldError('name', 'Please enter your full name'); valid = false; } else clearFieldError('name');
    if (!studentId) { showFieldError('studentid', 'Student ID is required'); valid = false; } else clearFieldError('studentid');
    if (!/^\S+@\S+\.\S+$/.test(email)) { showFieldError('email', 'Enter a valid email address'); valid = false; } else clearFieldError('email');
    if (!department) { showFieldError('department', 'Select your department'); valid = false; } else clearFieldError('department');
    if (!year) { showFieldError('year', 'Select your year'); valid = false; } else clearFieldError('year');
    if (password.length < 6) { showFieldError('password', 'Password must be at least 6 characters'); valid = false; } else clearFieldError('password');
    if (confirm !== password) { showFieldError('confirm', 'Passwords do not match'); valid = false; } else clearFieldError('confirm');
    if (!valid) return;

    const btn = document.getElementById('register-btn');
    setButtonLoading(btn, true, 'Creating account...');
    try {
      const res = await apiPost('/auth/register', { name, studentId, email, password, department, year });
      setSession(res.token, res.user);
      toast('Registration successful. Welcome!');
      window.location.href = redirectPathFor(res.user.role);
    } catch (err) {
      alertBox('register-alert', err.message, 'error');
      setButtonLoading(btn, false);
    }
  });
}

/* ---------- Shared field error helpers ---------- */
function showFieldError(key, message) {
  const input = document.getElementById(`${currentPrefix()}-${key}`);
  const error = document.getElementById(`${currentPrefix()}-error-${key}`);
  if (input) input.classList.add('invalid');
  if (error) { error.textContent = message; error.classList.add('show'); }
}
function clearFieldError(key) {
  const input = document.getElementById(`${currentPrefix()}-${key}`);
  const error = document.getElementById(`${currentPrefix()}-error-${key}`);
  if (input) input.classList.remove('invalid');
  if (error) { error.textContent = ''; error.classList.remove('show'); }
}
function currentPrefix() {
  return document.getElementById('register-form') ? 'reg' : 'login';
}

// Clear expired-session notice
if (new URLSearchParams(window.location.search).get('expired')) {
  alertBox('login-alert', 'Your session has expired. Please log in again.', 'info');
}
