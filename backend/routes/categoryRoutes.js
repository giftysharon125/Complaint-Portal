const express = require('express');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @desc   List active categories (used by submission form) — any logged-in user
// @route  GET /api/categories
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ active: true }).sort({ name: 1 }).select('name');
    res.json({ success: true, count: categories.length, data: categories });
  })
);

module.exports = router;
