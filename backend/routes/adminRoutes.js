const express = require('express');
const {
  getDashboard,
  listComplaints,
  updateComplaint,
  assignComplaint,
  listStudents,
  listStaff,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listFeedback,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Everything under /api/admin requires an authenticated admin
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/complaints', listComplaints);
router.put('/complaints/:id', updateComplaint);
router.put('/complaints/:id/assign', assignComplaint);

router.get('/users', listStudents);
router.get('/staff', listStaff);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/feedback', listFeedback);

module.exports = router;
