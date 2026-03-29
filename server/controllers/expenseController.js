const Expense = require('../models/Expense');
const ApprovalRule = require('../models/ApprovalRule');
const { getConvertedAmount } = require('../services/currencyService');

exports.submitExpense = async (req, res) => {
  try {
    const { amount, currency, category, description, date, expenseLines, merchantName } = req.body;
    let receiptUrl = '';

    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    }

    const { convertedAmount, rate } = await getConvertedAmount(req.user.company, amount, currency);

    const expense = await Expense.create({
      company: req.user.company,
      submittedBy: req.user._id,
      amount,
      currency,
      convertedAmount,
      exchangeRate: rate,
      category,
      description,
      date,
      receiptUrl,
      expenseLines: expenseLines ? JSON.parse(expenseLines) : [],
      merchantName,
      status: 'pending' // Default starts pending
    });

    const engine = require('../services/approvalEngine');
    await engine.processExpenseSubmission(expense); // This attaches rule!

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ submittedBy: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTeamExpenses = async (req, res) => {
  try {
    // Basic implementation: manager sees all team's expenses or pending depending on role
    const usersInTeam = await require('../models/User').find({ manager: req.user._id });
    const userIds = usersInTeam.map(u => u._id);
    const expenses = await Expense.find({ submittedBy: { $in: userIds } }).populate('submittedBy', 'name');
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ company: req.user.company })
      .populate('submittedBy', 'name')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'name')
      .populate('currentAssignee', 'name role email')
      .populate('approvalHistory.approver', 'name role');
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    // basic check
    if (expense.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    res.status(200).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
