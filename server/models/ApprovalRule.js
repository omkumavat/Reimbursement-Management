const mongoose = require('mongoose');

const approverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  step: {
    type: Number,
    required: true
  },
  role: {
    type: String
  }
}, { _id: false });

const approvalRuleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
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
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      autoApprove: { type: Boolean, default: false }
    },
    hybridMode: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalRule', approvalRuleSchema);
