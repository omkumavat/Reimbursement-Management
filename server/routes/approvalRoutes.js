const express = require('express');
const { getPendingApprovals, approveExpense, rejectExpense, overrideApproval } = require('../controllers/approvalController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);

router.get('/pending', roleCheck.authorize('admin', 'manager'), getPendingApprovals);
router.post('/:id/approve', roleCheck.authorize('admin', 'director','finance','manager'), approveExpense);
router.post('/:id/reject', roleCheck.authorize('admin','director','finance', 'manager'), rejectExpense);
router.post('/override/:id', roleCheck.authorize('admin'), overrideApproval);

module.exports = router;
