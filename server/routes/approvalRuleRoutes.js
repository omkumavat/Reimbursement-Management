const express = require('express');
const { getApprovalRules, createApprovalRule, updateApprovalRule, deleteApprovalRule } = require('../controllers/approvalRuleController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);
router.use(roleCheck.authorize('admin')); // Only admins can manage approval rules

router.route('/')
  .get(getApprovalRules)
  .post(createApprovalRule);

router.route('/:id')
  .put(updateApprovalRule)
  .delete(deleteApprovalRule);

module.exports = router;
