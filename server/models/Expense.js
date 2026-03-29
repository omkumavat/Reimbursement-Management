const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema({
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  step: {
    type: Number,
    required: true
  },
  action: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true
  },
  comments: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const expenseLineSchema = new mongoose.Schema({
  description: { type: String },
  amount: { type: Number }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  convertedAmount: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['travel', 'meals', 'accommodation', 'supplies', 'entertainment', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  receiptUrl: {
    type: String
  },
  expenseLines: [expenseLineSchema],
  merchantName: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  currentApprovalStep: {
    type: Number,
    default: 1
  },
  approvalHistory: [approvalHistorySchema],
  approvalRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalRule'
  }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
