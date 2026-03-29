const ApprovalRule = require('../models/ApprovalRule');

exports.getApprovalRules = async (req, res) => {
  try {
    const rules = await ApprovalRule.find({ company: req.user.company })
      .populate('approvers.user', 'name role email');
      // .populate('conditionalRules.specificApproverRule.approver', 'name role email');
      // console.log(rules)
    res.status(200).json({ success: true, count: rules.length, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createApprovalRule = async (req, res) => {
  try {
    req.body.company = req.user.company;
    
    // If setting as default, unset others
    if (req.body.isDefault) {
      await ApprovalRule.updateMany({ company: req.user.company }, { isDefault: false });
    }

    const rule = await ApprovalRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateApprovalRule = async (req, res) => {
  try {
    let rule = await ApprovalRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    if (rule.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (req.body.isDefault) {
      await ApprovalRule.updateMany({ company: req.user.company, _id: { $ne: req.params.id } }, { isDefault: false });
    }

    rule = await ApprovalRule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteApprovalRule = async (req, res) => {
  try {
    const rule = await ApprovalRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: 'Rule not found' });
    }

    if (rule.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await ApprovalRule.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
