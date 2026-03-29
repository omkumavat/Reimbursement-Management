const axios = require('axios');
const Company = require('../models/Company');

exports.getConvertedAmount = async (companyId, amount, fromCurrency) => {
  const company = await Company.findById(companyId);
  if (!company) throw new Error('Company not found');

  const baseCurrency = company.defaultCurrency;

  if (fromCurrency === baseCurrency) {
    return { convertedAmount: amount, rate: 1 };
  }

  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const rate = response.data.rates[fromCurrency];
    
    if (!rate) throw new Error(`Exchange rate for ${fromCurrency} not found`);

    // We are converting FROM `fromCurrency` TO `baseCurrency`. 
    // The API gives us `1 BASE = RATE * FROM_CURRENCY`.
    // So `BASE_AMOUNT = amount / RATE`.
    const convertedAmount = amount / rate;

    return { convertedAmount, rate };
  } catch (error) {
    throw new Error('Failed to fetch exchange rates');
  }
};
