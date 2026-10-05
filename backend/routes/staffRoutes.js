const express = require('express');
const {
  listAssigned,
  getAssignedComplaint,
  updateStatus,
  resolveComplaint,
  addProgressNote,
} = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Everything under /api/staff requires an authenticated staff member
router.use(protect, authorize('staff'));

router.get('/complaints', listAssigned);
router.get('/complaints/:id', getAssignedComplaint);
router.put('/complaints/:id/status', updateStatus);
router.put('/complaints/:id/resolve', resolveComplaint);
router.put('/complaints/:id/note', addProgressNote);

module.exports = router;
