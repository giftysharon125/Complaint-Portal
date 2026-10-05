const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  year: u.year,
  studentId: u.studentId || '',
  createdAt: u.createdAt,
});

// @desc   Register a new student
// @route  POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, studentId, email, password, department, year } = req.body;

  if (!name || !studentId || !email || !password) {
    throw new ApiError(400, 'Name, Student ID, email and password are required');
  }
  if (String(password).length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const emailNorm = String(email).toLowerCase().trim();
  const sid = String(studentId).toUpperCase().trim();

  const emailExists = await User.findOne({ email: emailNorm });
  if (emailExists) throw new ApiError(400, 'An account with this email already exists');

  const sidExists = await User.findOne({ studentId: sid });
  if (sidExists) throw new ApiError(400, 'This Student ID is already registered');

  const user = await User.create({
    name: name.trim(),
    studentId: sid,
    email: emailNorm,
    password,
    department: (department || '').trim(),
    year: (year || '').trim(),
    role: 'student', // public registration is for students only
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. You can now log in.',
    token: signToken(user),
    user: publicUser(user),
  });
});

// @desc   Login (student/admin/staff)
// @route  POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({
    success: true,
    message: 'Login successful',
    token: signToken(user),
    user: publicUser(user),
  });
});

// @desc   Get current logged-in user
// @route  GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// @desc   Update own profile (name, department, year)
// @route  PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, department, year } = req.body;
  if (name !== undefined && !String(name).trim()) {
    throw new ApiError(400, 'Name cannot be empty');
  }
  if (name !== undefined) req.user.name = String(name).trim();
  if (department !== undefined) req.user.department = String(department).trim();
  if (year !== undefined) req.user.year = String(year).trim();
  await req.user.save();

  // Also keep an optional password change path secure: omitted by design here.
  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: publicUser(req.user),
  });
});

// @desc   Get my own complaint counts (used by profile page)
// @route  GET /api/users/profile/summary
exports.profileSummary = asyncHandler(async (req, res) => {
  const total = await Complaint.countDocuments({ student: req.user._id });
  res.json({ success: true, data: { totalComplaints: total, memberSince: req.user.createdAt } });
});
