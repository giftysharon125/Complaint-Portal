const express = require('express');
const { updateProfile, profileSummary } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/profile/summary', protect, profileSummary);

module.exports = router;
