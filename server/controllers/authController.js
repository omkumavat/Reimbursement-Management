const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, companyName, country, defaultCurrency, currencySymbol } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    let company;
    try {
      company = await Company.create({
        name: companyName,
        country,
        defaultCurrency,
        currencySymbol,
        admin: null // placeholder
      });
    } catch (err) {
      console.error('Company creation error:', err);
      return res.status(400).json({ success: false, error: 'Company creation failed: ' + err.message });
    }

    try {
      const user = await User.create({
        name,
        email,
        password,
        role: 'admin',
        company: company._id
      });

      company.admin = user._id;
      await company.save();
      await user.save();

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        }
      });
    } catch (err) {
      console.error('User creation error:', err);
      // Rollback company creation
      await Company.findByIdAndDelete(company._id);
      return res.status(400).json({ success: false, error: 'User creation failed: ' + err.message });
    }


  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email }).select('+password').populate('company');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        isManagerApprover: user.isManagerApprover,
        token: generateToken(user._id),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('company');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
