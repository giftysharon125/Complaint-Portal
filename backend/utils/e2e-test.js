/**
 * End-to-end API verification script.
 * Run while the server is up:  node backend/utils/e2e-test.js
 *
 * Verifies: register → login → submit → admin dashboard → assign →
 * staff status updates → resolve → student feedback → admin sees feedback,
 * plus the main error paths (invalid login, RBAC, duplicates, transitions).
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000/api';

let passed = 0;
let failed = 0;
const results = [];

function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    results.push(`  ✅ ${name}`);
  } else {
    failed++;
    results.push(`  ❌ ${name} ${extra}`);
  }
}

async function req(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: raw ? raw : body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { status: res.status, data };
}

(async () => {
  console.log('\n==============================================');
  console.log(' END-TO-END API VERIFICATION');
  console.log('==============================================\n');

  // ---------- Health ----------
  let r = await req('GET', '/health');
  check('TC-API: health endpoint reachable', r.status === 200 && r.data.success === true);

  // ---------- Register a brand-new student ----------
  const ts = Date.now();
  const regBody = {
    name: 'E2E Test Student',
    studentId: `E2E${ts}`,
    email: `e2e${ts}@college.edu`,
    password: 'test123',
    department: 'Computer Science',
    year: '2nd Year',
  };
  r = await req('POST', '/auth/register', { body: regBody });
  check('TC001: student registration works', r.status === 201 && r.data.token && r.data.user.role === 'student');
  const studentTok = r.data.token;
  const studentId = r.data.user?.id;

  r = await req('POST', '/auth/register', { body: regBody });
  check('TC022: duplicate registration rejected', r.status === 400 && /already/i.test(r.data.message || ''));

  // ---------- Login ----------
  r = await req('POST', '/auth/login', { body: { email: `e2e${ts}@college.edu`, password: 'test123' } });
  check('TC002: fresh student can log in', r.status === 200 && r.data.token);

  r = await req('POST', '/auth/login', { body: { email: `e2e${ts}@college.edu`, password: 'WRONG' } });
  check('TC003: invalid login rejected (401)', r.status === 401 && /invalid/i.test(r.data.message || ''));

  r = await req('POST', '/auth/login', { body: { email: 'admin@college.edu', password: 'admin123' } });
  check('TC002b: seeded admin can log in', r.status === 200 && r.data.user.role === 'admin');
  const adminTok = r.data.token;

  r = await req('POST', '/auth/login', { body: { email: 'staff1@college.edu', password: 'staff123' } });
  check('TC002c: seeded staff can log in', r.status === 200 && r.data.user.role === 'staff');
  const staffTok = r.data.token;

  r = await req('POST', '/auth/login', { body: { email: 'staff2@college.edu', password: 'staff123' } });
  const staff2Tok = r.data.token;

  // ---------- Auth guard ----------
  r = await req('GET', '/complaints/my');
  check('TC014: private API without token → 401', r.status === 401);

  r = await req('GET', '/admin/dashboard', { token: studentTok });
  check('TC015: student blocked from admin API → 403', r.status === 403);

  // ---------- Categories ----------
  r = await req('GET', '/categories', { token: studentTok });
  check('TC-cat: category list available for form', r.status === 200 && r.data.data.length >= 12);
  const wifiCat = r.data.data.find((c) => c.name === 'Internet/Wi-Fi');

  // ---------- Submit complaint ----------
  r = await req('POST', '/complaints', {
    token: studentTok,
    body: {
      title: 'E2E test — projector flickering in CS-105',
      category: wifiCat._id,
      description: 'Automated end-to-end test complaint. The projector flickers every few seconds during lectures.',
      location: 'CS Block, Room 105',
      priority: 'High',
    },
  });
  check('TC004: complaint submitted', r.status === 201 && /^CMP-\d{4}-\d{4}$/.test(r.data.data.complaintId || ''));
  const complaintMongoId = r.data.data._id;
  const complaintHumanId = r.data.data.complaintId;
  console.log(`     → created ${complaintHumanId} (mongo ${complaintMongoId})`);

  // Empty form validation (server-side)
  r = await req('POST', '/complaints', { token: studentTok, body: { title: 'ab', category: '', description: 'short', location: '' } });
  check('TC005: empty/invalid form rejected server-side', r.status === 400);

  // ---------- Student list + detail ----------
  r = await req('GET', '/complaints/my', { token: studentTok });
  check('TC006: student sees own complaint in list', r.status === 200 && r.data.data.some((c) => c._id === complaintMongoId));

  r = await req('GET', '/complaints/' + complaintMongoId, { token: studentTok });
  check('TC006b: detail includes history (Submitted)', r.status === 200 && r.data.data.history?.length === 1 && r.data.data.history[0].status === 'Submitted');

  // Student cannot see someone else's complaint
  r = await req('GET', '/admin/complaints?search=E2E', { token: adminTok });
  const other = r.data.data?.find((c) => c._id !== complaintMongoId);
  if (other) {
    const rr = await req('GET', '/complaints/' + other._id, { token: studentTok });
    check('TC017: student blocked from foreign complaint → 403', rr.status === 403);
  }

  // ---------- Invalid transitions ----------
  r = await req('PUT', `/admin/complaints/${complaintMongoId}`, { token: adminTok, body: { status: 'Resolved' } });
  check('TC013: admin invalid transition Submitted→Resolved rejected', r.status === 400);

  r = await req('PUT', `/staff/complaints/${complaintMongoId}/status`, { token: staffTok, body: { status: 'Resolved' } });
  check('TC013b: staff cannot touch unassigned complaint → 403', r.status === 403);

  // ---------- Admin workflow ----------
  r = await req('GET', '/admin/dashboard', { token: adminTok });
  check('TC023: admin dashboard stats computed', r.status === 200 && typeof r.data.data.stats.total === 'number' && r.data.data.stats.total >= 15);

  r = await req('PUT', `/admin/complaints/${complaintMongoId}`, { token: adminTok, body: { priority: 'Critical' } });
  check('TC-FR09: admin changes priority', r.status === 200 && r.data.data.priority === 'Critical');

  r = await req('PUT', `/admin/complaints/${complaintMongoId}`, { token: adminTok, body: { status: 'Under Review', note: 'Verified with lab in-charge' } });
  check('TC-FR11: admin moves Submitted→Under Review', r.status === 200 && r.data.data.status === 'Under Review');

  // staff list for assignment
  r = await req('GET', '/admin/staff', { token: adminTok });
  check('TC-FR-stafflist: admin staff list with workload', r.status === 200 && r.data.data.length >= 2 && 'activeAssignments' in r.data.data[0]);
  const staff2Id = r.data.data.find((s) => s.email === 'staff2@college.edu')._id;

  r = await req('PUT', `/admin/complaints/${complaintMongoId}/assign`, { token: adminTok, body: { staffId: staff2Id } });
  check('TC007: admin assigns staff → status Assigned', r.status === 200 && r.data.data.status === 'Assigned' && r.data.data.assignedStaff?._id === staff2Id);

  // admin cannot assign again to another staff member? (reassign allowed while Assigned)
  r = await req('GET', '/staff/complaints', { token: staff2Tok });
  check('TC007b: assigned staff sees complaint in own list', r.status === 200 && r.data.data.some((c) => c._id === complaintMongoId));

  // staff2 (other staff) must NOT access it
  r = await req('GET', '/complaints/' + complaintMongoId, { token: staffTok });
  check('TC016: other staff blocked from complaint → 403', r.status === 403);

  // ---------- Staff workflow ----------
  r = await req('PUT', `/staff/complaints/${complaintMongoId}/status`, { token: staff2Tok, body: { status: 'Resolved' } });
  check('TC013c: staff Assigned→Resolved directly rejected', r.status === 400);

  r = await req('PUT', `/staff/complaints/${complaintMongoId}/note`, { token: staff2Tok, body: { note: 'Diagnosed lamp driver board; spare ordered.' } });
  check('TC-FR14: staff adds progress note', r.status === 200);

  r = await req('PUT', `/staff/complaints/${complaintMongoId}/status`, { token: staff2Tok, body: { status: 'In Progress', note: 'Repair started' } });
  check('TC008: staff moves Assigned→In Progress', r.status === 200 && r.data.data.status === 'In Progress');

  r = await req('PUT', `/staff/complaints/${complaintMongoId}/resolve`, { token: staff2Tok, body: { resolutionNotes: '' } });
  check('TC010: resolve without notes rejected', r.status === 400);

  r = await req('PUT', `/staff/complaints/${complaintMongoId}/resolve`, {
    token: staff2Tok,
    body: { resolutionNotes: 'Replaced lamp driver board and tested for two full lectures. Stable now.' },
  });
  check('TC009: staff resolves with notes', r.status === 200 && r.data.data.status === 'Resolved' && /lamp driver/i.test(r.data.data.resolutionNotes || ''));

  // ---------- Feedback ----------
  r = await req('GET', '/complaints/' + complaintMongoId, { token: studentTok });
  check('TC006c: student sees Resolved + staff assignment + history (5 entries)', r.data.data.status === 'Resolved' && r.data.data.history?.length >= 5);

  r = await req('POST', `/complaints/${complaintMongoId}/feedback`, { token: staff2Tok, body: { rating: 5, comment: 'x' } });
  check('TC-FR16-guard: only the complaint owner can give feedback', r.status === 403);

  r = await req('POST', `/complaints/${complaintMongoId}/feedback`, { token: studentTok, body: { rating: 9, comment: 'too high' } });
  check('TC-FR16-guard2: rating outside 1–5 rejected', r.status === 400);

  r = await req('POST', `/complaints/${complaintMongoId}/feedback`, { token: studentTok, body: { rating: 5, comment: 'Quick fix, excellent work!' } });
  check('TC011: student submits feedback after resolution', r.status === 201);

  r = await req('POST', `/complaints/${complaintMongoId}/feedback`, { token: studentTok, body: { rating: 3, comment: 'again' } });
  check('TC012: duplicate feedback blocked (409)', r.status === 409);

  // ---------- Admin sees feedback ----------
  r = await req('GET', '/admin/feedback', { token: adminTok });
  check('TC011b: admin feedback list contains new feedback', r.status === 200 && r.data.data.some((f) => f.complaint?._id === complaintMongoId));

  // ---------- Admin closes ----------
  r = await req('PUT', `/admin/complaints/${complaintMongoId}`, { token: adminTok, body: { status: 'Closed' } });
  check('TC-FR11b: admin closes resolved complaint', r.status === 200 && r.data.data.status === 'Closed');

  // ---------- Students listing / profile ----------
  r = await req('GET', '/admin/users', { token: adminTok });
  check('TC-FR-users: admin student list includes new student + count', r.status === 200 && r.data.data.some((s) => s.email === `e2e${ts}@college.edu` && s.totalComplaints >= 1));

  r = await req('PUT', '/users/profile', { token: studentTok, body: { name: 'E2E Test Student Renamed' } });
  check('TC021: profile update works', r.status === 200 && r.data.user.name === 'E2E Test Student Renamed');

  // ---------- Category management ----------
  r = await req('POST', '/admin/categories', { token: adminTok, body: { name: `E2E Cat ${ts}`, description: 'temp' } });
  check('TC-FR19: admin creates category', r.status === 201);
  const tmpCatId = r.data.data?._id;
  r = await req('PUT', `/admin/categories/${tmpCatId}`, { token: adminTok, body: { active: false } });
  check('TC-FR19b: admin deactivates category', r.status === 200 && r.data.data.active === false);
  r = await req('DELETE', `/admin/categories/${tmpCatId}`, { token: adminTok });
  check('TC-FR19c: admin deletes unused category', r.status === 200);
  r = await req('GET', '/admin/categories', { token: adminTok });
  const canteen = r.data.data.find((c) => c.name === 'Canteen');
  r = await req('DELETE', `/admin/categories/${canteen._id}`, { token: adminTok });
  check('TC020: in-use category delete blocked', r.status === 400 && /Cannot delete/i.test(r.data.message || ''));

  // ---------- Cleanup: remove E2E complaint so seed data stays pristine ----------
  // (soft approach: leave data — it demonstrates the flow; commented out on purpose)

  console.log(results.join('\n'));
  console.log('\n==============================================');
  console.log(` RESULT: ${passed} passed, ${failed} failed`);
  console.log('==============================================\n');
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('E2E run crashed:', e);
  process.exit(1);
});
