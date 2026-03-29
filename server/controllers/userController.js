const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company }).populate('manager', 'name email');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, manager, isManagerApprover } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const user = await User.create({
      company: req.user.company,
      name,
      email,
      password,
      role,
      manager: manager || null,
      isManagerApprover: isManagerApprover || false
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getManagers = async (req, res) => {
  try {
    const managers = await User.find({ 
      company: req.user.company, 
      role: { $in: ['manager', 'admin'] } 
    }).select('name role email');
    res.status(200).json({ success: true, count: managers.length, data: managers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { role, manager, isManagerApprover, password, name, email } = req.body;
    
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (user.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Logic: if changing to manager, remove manager assignment
    let newManagerId = manager;
    if (role === 'manager' || role === 'admin') {
      newManagerId = null; 
    }

    const updates = { role, manager: newManagerId, isManagerApprover };
    if (name) updates.name = name;
    if (email) updates.email = email;
    
    // if we also wanted to update password we'd need to use save() to trigger the hook
    // for now we'll update fields via User.findByIdAndUpdate
    user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate('manager', 'name email');

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    if (user.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
