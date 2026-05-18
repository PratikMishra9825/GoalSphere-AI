const express = require('express');
const router = express.Router();
const {
  getGoals,
  setGoal,
  updateGoal,
  deleteGoal,
  submitCheckIn,
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getGoals).post(protect, setGoal);
router.route('/:id').put(protect, updateGoal).delete(protect, deleteGoal);
router.route('/:id/checkins').post(protect, submitCheckIn);

module.exports = router;
