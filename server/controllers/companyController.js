const Company = require('../models/Company');
const axios = require('axios');

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.user.company).populate('admin', 'name email');
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.user.company, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: company });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCountries = async (req, res) => {
  try {
    const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getExchangeRates = async (req, res) => {
  try {
    const { base } = req.params;
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`);
    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
