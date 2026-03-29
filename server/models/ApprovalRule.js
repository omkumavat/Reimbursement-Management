const mongoose = require('mongoose');

const approverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  role: {
    type: String, // 'direct_manager', 'finance', 'director', 'manager', 'admin'
    default: null
  },
  step: {
    type: Number,
    required: true
  }
}, { _id: true });

const approvalRuleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  workflowType: {
    type: String,
    enum: ['sequence', 'conditional'],
    default: 'sequence'
  },
  name: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  approvers: [approverSchema],
  conditionalRules: {
    enabled: {
      type: Boolean,
      default: false
    },
    percentageRule: {
      enabled: { type: Boolean, default: false },
      percentage: { type: Number, default: 100 }
    },
    specificApproverRule: {
      enabled: { type: Boolean, default: false },
      role: { type: String, default: 'admin' },
      autoApprove: { type: Boolean, default: false }
    },
    hybridMode: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
