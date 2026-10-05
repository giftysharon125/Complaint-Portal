const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  addFeedback,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// --- Multer config: optional image attachment, max 5 MB, images only ---
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.warn('Could not initialize uploads directory:', err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_ ]/gi, '')
      .trim()
      .slice(0, 40) || 'attachment';
    cb(null, `${Date.now()}-${base.replace(/\s+/g, '-')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(
      path.extname(file.originalname).toLowerCase()
    );
    if (!ok) return cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed'));
    cb(null, true);
  },
});

// All complaint routes require authentication
router.use(protect);

// Student routes
router.get('/my', authorize('student'), getMyComplaints);
router.post('/', authorize('student'), upload.single('attachment'), createComplaint);
router.post('/:id/feedback', authorize('student'), addFeedback);

// Shared detail route (student=own, staff=assigned, admin=all)
router.get('/:id', getComplaintById);

module.exports = router;
