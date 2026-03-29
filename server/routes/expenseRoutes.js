const express = require('express');
const { submitExpense, getMyExpenses, getTeamExpenses, getAllExpenses, getExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('receipt'), submitExpense);
router.get('/my', getMyExpenses);
router.get('/team', roleCheck.authorize('manager', 'admin'), getTeamExpenses);
router.get('/all', roleCheck.authorize('admin'), getAllExpenses);
router.get('/:id', getExpense);

module.exports = router;
