const express = require('express');
const router = express.Router();
const { getEmployeeDashboard, getManagerDashboard, getHRDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/employee', protect, getEmployeeDashboard);
router.get('/manager', protect, getManagerDashboard);
router.get('/hr', protect, getHRDashboard);

module.exports = router;
