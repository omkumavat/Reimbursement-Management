const Expense = require('../models/Expense');

exports.getPendingApprovals = async (req, res) => {
  try {
    const expenses = await Expense.find({ 
      company: req.user.company, 
      status: { $in: ['pending', 'in_review'] } 
    })
    .populate('submittedBy', 'name email manager isManagerApprover')
    .populate('approvalRule');

    const pendingForMe = expenses.filter(exp => {

      if (exp.approvalHistory.some(h => h.approver.toString() === req.user._id.toString())) {
        return false;
      }

      const rule = exp.approvalRule;
      if (rule && rule.approvers && rule.approvers.length > 0) {
        
        if (rule.workflowType === 'conditional') {
          // Parallel mode: Can they fulfill any of the parallel approver slots?
          return rule.approvers.some(stepConfig => {
            if (stepConfig.user && stepConfig.user.toString() === req.user._id.toString()) return true;
            if (stepConfig.role) {
              if (stepConfig.role === 'direct_manager') {
                return exp.submittedBy.manager && exp.submittedBy.manager.toString() === req.user._id.toString();
              }
              return req.user.role === stepConfig.role;
            }
            return false;
          });
        } else {
          // Sequential mode uses the specific randomly-assigned person
          if (exp.currentAssignee) {
             return exp.currentAssignee.toString() === req.user._id.toString();
          } else {
             // If unassigned somehow, allow fallback resolution by admin
             if (req.user.role === 'admin') return true;
             return false;
          }
        }

      } else {
        // Fallback or legacy (no custom rule defined for this expense)
        if (req.user.role === 'manager' && exp.submittedBy.manager && exp.submittedBy.manager.toString() === req.user._id.toString()) {
          return true;
        }
        if (req.user.role === 'admin') return true;
        return false;
      }
    });

    res.status(200).json({ success: true, count: pendingForMe.length, data: pendingForMe });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const { comments } = req.body;
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) return res.status(404).json({ success: false, error: 'Not found' });

    expense.approvalHistory.push({
      approver: req.user._id,
      step: expense.currentApprovalStep,
      action: 'approved',
      comments
    });
    
    expense.currentApprovalStep += 1;
    expense.status = 'in_review';
    await expense.save();

    // Evaluate if finalized
    const engine = require('../services/approvalEngine');
    await engine.evaluateApprovalState(expense._id);

    const updatedExpense = await Expense.findById(expense._id);
    res.status(200).json({ success: true, data: updatedExpense });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const { comments } = req.body;
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) return res.status(404).json({ success: false, error: 'Not found' });

    expense.approvalHistory.push({
      approver: req.user._id,
      step: expense.currentApprovalStep,
      action: 'rejected',
      comments
    });
    
    expense.status = 'rejected';
    await expense.save();

    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.overrideApproval = async (req, res) => {
  try {
    const { status, comments } = req.body; // status = 'approved' or 'rejected'
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) return res.status(404).json({ success: false, error: 'Not found' });
    
    expense.status = status;
    expense.approvalHistory.push({
      approver: req.user._id,
      step: expense.currentApprovalStep,
      action: status,
      comments: comments || 'Admin Override'
    });

    await expense.save();
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
