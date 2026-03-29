const Expense = require('../models/Expense');

exports.getPendingApprovals = async (req, res) => {
  try {
    // For now, simpler: Return all expenses pending for company if admin, or pending for team if manager
    let expenses = [];
    if (req.user.role === 'admin') {
      expenses = await Expense.find({ company: req.user.company, status: { $in: ['pending', 'in_review'] } })
        .populate('submittedBy', 'name email');
    } else if (req.user.role === 'manager') {
      const team = await require('../models/User').find({ manager: req.user._id });
      const teamIds = team.map(u => u._id);
      expenses = await Expense.find({ submittedBy: { $in: teamIds }, status: { $in: ['pending', 'in_review'] } })
        .populate('submittedBy', 'name email');
    }

    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const { comments } = req.body;
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) return res.status(404).json({ success: false, error: 'Not found' });

    // Validate if the user is authorized for this step... skipped for simplicitly
    // Add to history
    expense.approvalHistory.push({
      approver: req.user._id,
      step: expense.currentApprovalStep,
      action: 'approved',
      comments
    });
    
    expense.currentApprovalStep += 1;
    expense.status = 'in_review';
    await expense.save();

    res.status(200).json({ success: true, data: expense });
    
    // Evaluate if finalized async
    const engine = require('../services/approvalEngine');
    await engine.evaluateApprovalState(expense._id);

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
