const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const ComplaintStatusHistory = require('../models/ComplaintStatusHistory');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { TRANSITIONS, STATUS_GROUPS, PRIORITIES } = require('../utils/constants');

const escapeRx = (s) => String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc   Admin dashboard statistics + chart data
// @route  GET /api/admin/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  // Counts by status
  const statusAgg = await Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatusMap = {};
  statusAgg.forEach((r) => (byStatusMap[r._id] = r.count));

  const total = statusAgg.reduce((s, r) => s + r.count, 0);
  const pending = STATUS_GROUPS.pending.reduce((s, st) => s + (byStatusMap[st] || 0), 0);
  const inProgress = byStatusMap['In Progress'] || 0;
  const resolved = (byStatusMap['Resolved'] || 0) + (byStatusMap['Closed'] || 0);
  const rejected = byStatusMap['Rejected'] || 0;

  // Counts by category (with category names)
  const byCategory = await Complaint.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'cat',
      },
    },
    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 1, name: { $ifNull: ['$cat.name', 'Uncategorized'] }, count: 1 } },
    { $sort: { count: -1 } },
  ]);

  // Counts by priority
  const byPriority = await Complaint.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Complaints per day for the last 14 days (zero-filled)
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);
  const timeAgg = await Complaint.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
  ]);
  const timeMap = {};
  timeAgg.forEach((r) => (timeMap[r._id] = r.count));
  const overTime = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    overTime.push({ date: key, count: timeMap[key] || 0 });
  }

  // Average resolution time (Resolved/Closed) in days
  const avgAgg = await Complaint.aggregate([
    { $match: { status: { $in: ['Resolved', 'Closed'] } } },
    { $project: { diff: { $subtract: ['$updatedAt', '$createdAt'] } } },
    { $group: { _id: null, avgMs: { $avg: '$diff' } } },
  ]);
  const avgResolutionDays = avgAgg.length && avgAgg[0].avgMs ? +(avgAgg[0].avgMs / 86400000).toFixed(1) : 0;

  // Feedback average rating
  const ratingAgg = await Feedback.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' }, total: { $sum: 1 } } },
  ]);

  // Recent complaints
  const recent = await Complaint.find()
    .populate('student', 'name studentId')
    .populate('category', 'name')
    .populate('assignedStaff', 'name')
    .sort({ createdAt: -1 })
    .limit(8);

  res.json({
    success: true,
    data: {
      stats: { total, pending, inProgress, resolved, rejected },
      byStatus: statusAgg.map((r) => ({ status: r._id, count: r.count })),
      byCategory,
      byPriority,
      overTime,
      avgResolutionDays,
      feedback: {
        averageRating: ratingAgg.length && ratingAgg[0].avg ? +ratingAgg[0].avg.toFixed(1) : 0,
        total: ratingAgg.length ? ratingAgg[0].total : 0,
      },
      recent,
    },
  });
});

// @desc   List all complaints with search/filters/sort
// @route  GET /api/admin/complaints?search=&category=&priority=&status=&from=&to=&sort=newest|oldest
exports.listComplaints = asyncHandler(async (req, res) => {
  const { search, category, priority, status, from, to, sort = 'newest' } = req.query;
  const query = {};

  if (search) {
    const rx = new RegExp(escapeRx(search), 'i');
    const conditions = [{ complaintId: rx }, { title: rx }];
    const students = await User.find({ name: rx }).select('_id');
    if (students.length) conditions.push({ student: { $in: students.map((s) => s._id) } });
    query.$or = conditions;
  }
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (status && status !== 'all') {
    const group = STATUS_GROUPS[status];
    query.status = group ? { $in: group } : status;
  }
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(`${from}T00:00:00`);
    if (to) query.createdAt.$lte = new Date(`${to}T23:59:59`);
  }

  const complaints = await Complaint.find(query)
    .populate('student', 'name studentId email')
    .populate('category', 'name')
    .populate('assignedStaff', 'name')
    .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
    .limit(500);

  res.json({ success: true, count: complaints.length, data: complaints });
});

// @desc   Update a complaint (priority / status / admin note)
// @route  PUT /api/admin/complaints/:id
exports.updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const { priority, status, note } = req.body;

  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) throw new ApiError(400, 'Invalid priority value');
    complaint.priority = priority;
  }

  if (status !== undefined && status !== complaint.status) {
    const allowed = TRANSITIONS[complaint.status] || [];
    if (!allowed.includes(status)) {
      throw new ApiError(
        400,
        `Invalid status transition: ${complaint.status} → ${status}`
      );
    }
    complaint.status = status;
    await ComplaintStatusHistory.create({
      complaint: complaint._id,
      status,
      changedBy: req.user._id,
      note: String(note || '').trim() || `Status changed to ${status} by admin`,
    });
  }

  if (note && status === undefined) {
    // Standalone admin note (no status change)
    complaint.notes.push({
      by: req.user._id,
      byName: req.user.name,
      byRole: 'admin',
      text: String(note).trim(),
    });
  }

  await complaint.save();

  const updated = await Complaint.findById(complaint._id)
    .populate('student', 'name studentId email')
    .populate('category', 'name')
    .populate('assignedStaff', 'name email');

  res.json({ success: true, message: 'Complaint updated successfully', data: updated });
});

// @desc   Assign / reassign a complaint to a staff member
// @route  PUT /api/admin/complaints/:id/assign
exports.assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new ApiError(404, 'Complaint not found');

  const { staffId } = req.body;
  const staff = await User.findById(staffId);
  if (!staff || staff.role !== 'staff') {
    throw new ApiError(400, 'Please select a valid staff member');
  }
  if (['Resolved', 'Closed', 'Rejected'].includes(complaint.status)) {
    throw new ApiError(400, `Cannot assign a complaint that is already ${complaint.status}`);
  }

  const isReassignment =
    complaint.assignedStaff && complaint.assignedStaff.toString() !== staff._id.toString();

  complaint.assignedStaff = staff._id;

  if (['Submitted', 'Under Review'].includes(complaint.status)) {
    complaint.status = 'Assigned';
    await ComplaintStatusHistory.create({
      complaint: complaint._id,
      status: 'Assigned',
      changedBy: req.user._id,
      note: `Assigned to ${staff.name}${isReassignment ? ' (reassigned)' : ''}`,
    });
  } else if (isReassignment) {
    complaint.notes.push({
      by: req.user._id,
      byName: req.user.name,
      byRole: 'admin',
      text: `Complaint reassigned to ${staff.name}`,
    });
  }

  await complaint.save();

  const updated = await Complaint.findById(complaint._id)
    .populate('student', 'name studentId email')
    .populate('category', 'name')
    .populate('assignedStaff', 'name email department');

  res.json({ success: true, message: `Complaint assigned to ${staff.name}`, data: updated });
});

// @desc   List all students (with complaint counts)
// @route  GET /api/admin/users
exports.listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' })
    .select('name studentId email department year createdAt')
    .sort({ createdAt: -1 });

  const counts = await Complaint.aggregate([
    { $group: { _id: '$student', total: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach((c) => (countMap[c._id.toString()] = c.total));

  res.json({
    success: true,
    count: students.length,
    data: students.map((s) => {
      const o = s.toObject();
      o.totalComplaints = countMap[s._id.toString()] || 0;
      return o;
    }),
  });
});

// @desc   List all staff (with workload counts)
// @route  GET /api/admin/staff
exports.listStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({ role: 'staff' })
    .select('name email department createdAt')
    .sort({ createdAt: 1 });

  const agg = await Complaint.aggregate([
    { $match: { assignedStaff: { $ne: null } } },
    {
      $group: {
        _id: '$assignedStaff',
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $in: ['$status', ['Assigned', 'In Progress']] }, 1, 0] },
        },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] },
        },
      },
    },
  ]);
  const map = {};
  agg.forEach((a) => (map[a._id.toString()] = a));

  res.json({
    success: true,
    count: staff.length,
    data: staff.map((s) => {
      const o = s.toObject();
      const m = map[s._id.toString()] || {};
      o.totalAssigned = m.total || 0;
      o.activeAssignments = m.active || 0;
      o.resolvedCount = m.resolved || 0;
      return o;
    }),
  });
});

// --- Category management ---

// @desc   List categories with usage counts
// @route  GET /api/admin/categories
exports.listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const counts = await Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const map = {};
  counts.forEach((c) => (map[c._id.toString()] = c.count));
  res.json({
    success: true,
    count: categories.length,
    data: categories.map((c) => {
      const o = c.toObject();
      o.complaintCount = map[c._id.toString()] || 0;
      return o;
    }),
  });
});

// @desc   Create a category
// @route  POST /api/admin/categories
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !String(name).trim()) throw new ApiError(400, 'Category name is required');
  const exists = await Category.findOne({ name: String(name).trim() });
  if (exists) throw new ApiError(400, 'A category with this name already exists');
  const category = await Category.create({
    name: String(name).trim(),
    description: String(description || '').trim(),
  });
  res.status(201).json({ success: true, message: 'Category created', data: category });
});

// @desc   Update a category
// @route  PUT /api/admin/categories/:id
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  const { name, description, active } = req.body;
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) throw new ApiError(400, 'Category name cannot be empty');
    const dupe = await Category.findOne({ name: trimmed, _id: { $ne: category._id } });
    if (dupe) throw new ApiError(400, 'A category with this name already exists');
    category.name = trimmed;
  }
  if (description !== undefined) category.description = String(description).trim();
  if (active !== undefined) category.active = Boolean(active);
  await category.save();
  res.json({ success: true, message: 'Category updated', data: category });
});

// @desc   Delete a category (blocked while complaints use it)
// @route  DELETE /api/admin/categories/:id
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  const inUse = await Complaint.countDocuments({ category: category._id });
  if (inUse > 0) {
    throw new ApiError(
      400,
      `Cannot delete: ${inUse} complaint(s) use this category. Deactivate it instead.`
    );
  }
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});

// @desc   List all feedback with complaint + student details
// @route  GET /api/admin/feedback
exports.listFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find()
    .populate({ path: 'complaint', select: 'complaintId title category status', populate: { path: 'category', select: 'name' } })
    .populate('student', 'name studentId')
    .sort({ createdAt: -1 });

  const avg = feedback.length
    ? +(feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : 0;

  res.json({ success: true, count: feedback.length, averageRating: avg, data: feedback });
});
