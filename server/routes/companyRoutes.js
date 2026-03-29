const express = require('express');
const { getCompany, updateCompany, getCountries, getExchangeRates } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/countries', getCountries);
router.get('/exchange-rate/:base', getExchangeRates);

router.use(protect);

router.route('/')
  .get(getCompany)
  .put(roleCheck.authorize('admin'), updateCompany);

module.exports = router;
