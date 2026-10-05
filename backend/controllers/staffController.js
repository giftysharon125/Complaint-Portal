const Complaint = require('../models/Complaint');
const ComplaintStatusHistory = require('../models/ComplaintStatusHistory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { TRANSITIONS } = require('../utils/constants');

// Staff may only move complaints along these transitions
const STAFF_TRANSITIONS = {
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
};

const loadAssignedComplaint = async (req) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('student', 'name email studentId department year')
    .populate('category', 'name description');
  if (!complaint) throw new ApiError(404, 'Complaint not found');
  if (
    !complaint.assignedStaff ||
    complaint.assignedStaff.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, 'This complaint is not assigned to you');
  }
  return complaint;
};

// @desc   List complaints assigned to the logged-in staff
// @route  GET /api/staff/complaints?status=active|resolved|all
exports.listAssigned = asyncHandler(async (req, res) => {
  const { status = 'all' } = req.query;
  const query = { assignedStaff: req.user._id };
  if (status === 'active') query.status = { $in: ['Assigned', 'In Progress'] };
  if (status === 'resolved') query.status = { $in: ['Resolved', 'Closed'] };

  const complaints = await Complaint.find(query)
    .populate('student', 'name studentId')
    .populate('category', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .limit(300);

  res.json({ success: true, count: complaints.length, data: complaints });
});

// @desc   Get one assigned complaint (detail)
// @route  GET /api/staff/complaints/:id
exports.getAssignedComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadAssignedComplaint(req);
  const history = await ComplaintStatusHistory.find({ complaint: complaint._id })
    .populate('changedBy', 'name role')
    .sort({ changedAt: 1 });
  const Feedback = require('../models/Feedback');
  const feedback = await Feedback.findOne({ complaint: complaint._id }).populate('student', 'name');
  res.json({ success: true, data: { ...complaint.toObject(), history, feedback: feedback || null } });
});

// @desc   Update status of an assigned complaint (Assigned→In Progress→Resolved)
// @route  PUT /api/staff/complaints/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const complaint = await loadAssignedComplaint(req);
  const { status, note } = req.body;

  if (!status) throw new ApiError(400, 'New status is required');
  const allowed = STAFF_TRANSITIONS[complaint.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `Invalid status transition: ${complaint.status} → ${status}`);
  }

  if (status === 'Resolved' && req.body.resolutionNotes !== undefined) {
    complaint.resolutionNotes = String(req.body.resolutionNotes).trim();
  }

  complaint.status = status;
  await complaint.save();

  await ComplaintStatusHistory.create({
    complaint: complaint._id,
    status,
    changedBy: req.user._id,
    note: String(note || '').trim() || `Status updated to ${status} by staff`,
  });

  const updated = await Complaint.findById(complaint._id)
    .populate('student', 'name studentId email')
    .populate('category', 'name');

  res.json({ success: true, message: `Status updated to ${status}`, data: updated });
});

// @desc   Mark an assigned complaint as resolved (with resolution notes)
// @route  PUT /api/staff/complaints/:id/resolve
exports.resolveComplaint = asyncHandler(async (req, res) => {
  const complaint = await loadAssignedComplaint(req);

  if (complaint.status !== 'In Progress') {
    throw new ApiError(400, 'Only complaints that are In Progress can be resolved');
  }

  const resolutionNotes = String(req.body.resolutionNotes || '').trim();
  if (resolutionNotes.length < 5) {
    throw new ApiError(400, 'Resolution notes are required (at least 5 characters)');
  }

  complaint.resolutionNotes = resolutionNotes;
  complaint.status = 'Resolved';
  await complaint.save();

  await ComplaintStatusHistory.create({
    complaint: complaint._id,
    status: 'Resolved',
    changedBy: req.user._id,
    note: 'Complaint resolved by staff',
  });

  const updated = await Complaint.findById(complaint._id)
    .populate('student', 'name studentId email')
    .populate('category', 'name');

  res.json({ success: true, message: 'Complaint marked as resolved', data: updated });
});

// @desc   Add a progress note to an assigned complaint
// @route  PUT /api/staff/complaints/:id/note
exports.addProgressNote = asyncHandler(async (req, res) => {
  const complaint = await loadAssignedComplaint(req);
  const text = String(req.body.note || '').trim();
  if (!text) throw new ApiError(400, 'Note text is required');

  complaint.notes.push({ by: req.user._id, byName: req.user.name, byRole: 'staff', text });
  await complaint.save();

  res.json({ success: true, message: 'Progress note added', data: complaint.notes });
});
