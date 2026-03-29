const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');

exports.processExpenseSubmission = async (expense) => {
  // Determine if direct manager is first approver
  let initialStep = 1;
  const submitter = await require('../models/User').findById(expense.submittedBy);
  
  if (submitter.isManagerApprover && submitter.manager) {
    // We add manager as pseudo-step 1. If there's an approval rule, its approvers will start at step 2.
    // However, a simpler way is handled during the expense creation by not touching the rule's steps.
    // The engine's logic handles checking if the current step requires an approver.
  }
  
  let rule;
  if (expense.approvalRule) {
    rule = await ApprovalRule.findById(expense.approvalRule);
  } else {
    rule = await ApprovalRule.findOne({ company: expense.company, isDefault: true });
    if (rule) {
      expense.approvalRule = rule._id;
    }
  }

  expense.status = 'pending';
  await expense.save();

  if (rule) {
    const expenseWithRule = await Expense.findById(expense._id).populate('approvalRule');
    await exports.assignNextApprover(expenseWithRule);
  }
  
  return expense;
};

exports.assignNextApprover = async (expense) => {
  const rule = expense.approvalRule;
  
  if (!rule || rule.workflowType === 'conditional') {
    expense.currentAssignee = null;
    await expense.save();
    return;
  }

  const stepConfig = rule.approvers.find(a => a.step === expense.currentApprovalStep);
  if (!stepConfig) {
    expense.currentAssignee = null;
    await expense.save();
    return;
  }

  const User = require('../models/User');

  if (stepConfig.user) {
    expense.currentAssignee = stepConfig.user;
  } else if (stepConfig.role) {
    if (stepConfig.role === 'direct_manager') {
      const submitter = await User.findById(expense.submittedBy);
      if (submitter && submitter.manager) {
        expense.currentAssignee = submitter.manager;
      } else {
        const admin = await User.findOne({ company: expense.company, role: 'admin' });
        expense.currentAssignee = admin ? admin._id : null;
      }
    } else {
      const targetUsers = await User.find({ company: expense.company, role: stepConfig.role });
      
      if (targetUsers.length > 0) {
        const randomUser = targetUsers[Math.floor(Math.random() * targetUsers.length)];
        expense.currentAssignee = randomUser._id;
      } else {
        const admin = await User.findOne({ company: expense.company, role: 'admin' });
        expense.currentAssignee = admin ? admin._id : null;
      }
    }
  }

  await expense.save();
};

exports.evaluateApprovalState = async (expenseId) => {
  const expense = await Expense.findById(expenseId)
    .populate('approvalRule')
    .populate('approvalHistory.approver', 'role');
  
  const rule = expense.approvalRule;
  
  if (!rule) {
    if (expense.approvalHistory.length > 0) {
      expense.status = 'approved';
      await expense.save();
    }
    return;
  }

  const history = expense.approvalHistory.filter(h => h.action === 'approved');

  // Conditional/parallel logic (unchanged)
  if (rule.workflowType === 'conditional' || (rule.conditionalRules && rule.conditionalRules.enabled)) {
    let autoApprove = false;

    if (rule.conditionalRules.specificApproverRule.enabled && rule.conditionalRules.specificApproverRule.autoApprove) {
      const targetRole = rule.conditionalRules.specificApproverRule.role || 'admin';
      if (history.some(h => h.approver && h.approver.role === targetRole)) {
        autoApprove = true;
      }
    }

    if (!autoApprove && rule.conditionalRules.percentageRule.enabled) {
      const requiredThreshold = rule.conditionalRules.percentageRule.percentage;
      const totalApprovers = rule.approvers.length;
      if (totalApprovers > 0) {
        const percentApproved = (history.length / totalApprovers) * 100;
        if (percentApproved >= requiredThreshold) {
          autoApprove = true;
        }
      }
    }

    if (autoApprove) {
      expense.status = 'approved';
      await expense.save();
      return;
    }

    if (rule.workflowType === 'conditional' && history.length >= rule.approvers.length) {
      expense.status = 'approved';
      await expense.save();
      return;
    }
    
    if (rule.workflowType === 'conditional') return;
  }

  expense.currentApprovalStep += 1;

  const maxStep = rule.approvers.reduce((max, a) => Math.max(max, a.step), 0);

  if (expense.currentApprovalStep > maxStep) {
    expense.status = 'approved';
    expense.currentAssignee = null;
    await expense.save();
  } else {
    await expense.save(); // save the incremented step first
    await exports.assignNextApprover(expense);
  }
};