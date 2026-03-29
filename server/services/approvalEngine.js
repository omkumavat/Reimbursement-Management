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
  // Let it be picked up by pending logic
  
  await expense.save();
  return expense;
};

// Simplified evaluation engine
exports.evaluateApprovalState = async (expenseId) => {
  const expense = await Expense.findById(expenseId).populate('approvalRule');
  const rule = expense.approvalRule;
  
  if (!rule) {
    // If no rules and manager approved, or no manager and no rules -> approved
    if (expense.approvalHistory.length > 0) {
      expense.status = 'approved';
      await expense.save();
    }
    return;
  }

  // Check auto-approve logic
  if (rule.conditionalRules && rule.conditionalRules.enabled) {
    const history = expense.approvalHistory.filter(h => h.action === 'approved');
    
    let autoApprove = false;

    // specific approver trigger
    if (rule.conditionalRules.specificApproverRule.enabled && rule.conditionalRules.specificApproverRule.autoApprove) {
      const spApproverId = rule.conditionalRules.specificApproverRule.approver.toString();
      if (history.some(h => h.approver.toString() === spApproverId)) {
        autoApprove = true;
      }
    }

    // percentage trigger
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
  }

  // Max step logic
  const maxStep = rule.approvers.reduce((max, a) => Math.max(max, a.step), 0);
  if (expense.currentApprovalStep > maxStep) {
    expense.status = 'approved';
    await expense.save();
  }
};
