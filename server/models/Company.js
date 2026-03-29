const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true
  },
  defaultCurrency: {
    type: String,
    required: true
  },
  currencySymbol: {
    type: String,
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
