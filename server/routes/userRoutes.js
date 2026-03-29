const express = require('express');
const { getUsers, createUser, updateUser, deleteUser, getManagers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(protect);
router.use(roleCheck.authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.get('/managers', getManagers);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
