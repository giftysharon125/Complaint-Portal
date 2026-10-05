const path = require('path');
const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const ComplaintStatusHistory = require('../models/ComplaintStatusHistory');
const Feedback = require('../models/Feedback');
const generateComplaintId = require('../utils/generateComplaintId');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { PRIORITIES, STATUS_GROUPS } = require('../utils/constants');

// @desc   Student submits a new complaint
// @route  POST /api/complaints  (multipart, optional "attachment" image)
exports.createComplaint = asyncHandler(async (req, res) => {
  const { title, category, description, location, priority } = req.body;

  if (!title || !category || !description || !location) {
    throw new ApiError(400, 'Title, category, description and location are required');
  }
  const cat = await Category.findById(category);
  if (!cat || !cat.active) throw new ApiError(400, 'Please select a valid category');
  if (priority && !PRIORITIES.includes(priority)) {
    throw new ApiError(400, 'Priority must be Low, Medium, High or Critical');
  }

  const complaint = await Complaint.create({
    complaintId: await generateComplaintId(),
    student: req.user._id,
    title: String(title).trim(),
    category,
    description: String(description).trim(),
    location: String(location).trim(),
    priority: priority || 'Medium',
    attachment: req.file ? `/uploads/${req.file.filename}` : '',
  });

  await ComplaintStatusHistory.create({
    complaint: complaint._id,
    status: 'Submitted',
    changedBy: req.user._id,
    note: 'Complaint submitted',
  });

  const populated = await Complaint.findById(complaint._id).populate('category', 'name');
  res.status(201).json({
    success: true,
    message: 'Complaint submitted successfully.',
    data: populated,
  });
});

// @desc   Student lists own complaints (with filters)
// @route  GET /api/complaints/my?status=pending|inprogress|resolved|rejected|all&category=&search=
exports.getMyComplaints = asyncHandler(async (req, res) => {
  const { status = 'all', category, search } = req.query;
  const query = { student: req.user._id };

  if (status && status !== 'all') {
    const group = STATUS_GROUPS[status];
    query.status = group ? { $in: group } : status;
  }
  if (category) query.category = category;
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: rx }, { complaintId: rx }];
  }

  const complaints = await Complaint.find(query)
    .populate('category', 'name')
    .populate('assignedStaff', 'name')
    .sort({ createdAt: -1 })
    .limit(200);

  // Attach the student's own feedback (if any) to resolved complaints
  const ids = complaints.map((c) => c._id);
  const feedbacks = await Feedback.find({ complaint: { $in: ids }, student: req.user._id });
  const fbMap = {};
  feedbacks.forEach((f) => (fbMap[f.complaint.toString()] = f));

  res.json({
    success: true,
    count: complaints.length,
    data: complaints.map((c) => {
      const o = c.toObject();
      o.feedback = fbMap[c._id.toString()] || null;
      return o;
    }),
  });
});

// @desc   Get one complaint (role-aware access)
// @route  GET /api/complaints/:id
exports.getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('student', 'name email studentId department year')
    .populate('category', 'name description')
    .populate('assignedStaff', 'name email department');
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const role = req.user.role;
  if (role === 'student' && complaint.student._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only view your own complaints');
  }
  if (
    role === 'staff' &&
    (!complaint.assignedStaff || complaint.assignedStaff._id.toString() !== req.user._id.toString())
  ) {
    throw new ApiError(403, 'This complaint is not assigned to you');
  }

  const history = await ComplaintStatusHistory.find({ complaint: complaint._id })
    .populate('changedBy', 'name role')
    .sort({ changedAt: 1 });

  const feedback = await Feedback.findOne({ complaint: complaint._id }).populate(
    'student',
    'name'
  );

  res.json({
    success: true,
    data: { ...complaint.toObject(), history, feedback: feedback || null },
  });
});

// @desc   Student submits feedback on a resolved complaint (once only)
// @route  POST /api/complaints/:id/feedback
exports.addFeedback = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  if (complaint.student.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only give feedback on your own complaints');
  }
  if (!['Resolved', 'Closed'].includes(complaint.status)) {
    throw new ApiError(400, 'Feedback can only be given after the complaint is resolved');
  }

  const existing = await Feedback.findOne({ complaint: complaint._id });
  if (existing) {
    throw new ApiError(409, 'Feedback has already been submitted for this complaint');
  }

  const rating = parseInt(req.body.rating, 10);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be a whole number between 1 and 5');
  }

  const feedback = await Feedback.create({
    complaint: complaint._id,
    student: req.user._id,
    rating,
    comment: String(req.body.comment || '').trim().slice(0, 500),
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback!',
    data: feedback,
  });
});
