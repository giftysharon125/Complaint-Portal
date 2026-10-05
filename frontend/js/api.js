/* =====================================================
   api.js — small fetch wrapper for the REST API
   - attaches JWT from localStorage
   - normalizes errors (server `message` field)
   - redirects to login on 401
   ===================================================== */

const API_BASE = '/api';

const TOKEN_KEY = 'cms_token';
const USER_KEY = 'cms_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Performs a request against the API.
 * @param {string} path  e.g. '/auth/login'
 * @param {{method?:string, body?:object, formData?:FormData}} opts
 * @returns {Promise<any>} parsed JSON response
 */
async function api(path, opts = {}) {
  const { method = 'GET', body, formData } = opts;

  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: formData ? formData : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Please check your connection.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
    clearSession();
    window.location.href = '/login.html?expired=1';
    throw new Error(data?.message || 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const apiGet = (path) => api(path);
const apiPost = (path, body) => api(path, { method: 'POST', body });
const apiPostForm = (path, formData) => api(path, { method: 'POST', formData });
const apiPut = (path, body) => api(path, { method: 'PUT', body });
const apiDelete = (path) => api(path, { method: 'DELETE' });
