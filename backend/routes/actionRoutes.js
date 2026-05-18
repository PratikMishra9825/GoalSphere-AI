const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTask,
  completeTask,
  createLeave,
  updateLeaveStatus,
  createAnnouncement,
  sendMessage,
  getMessages,
  getChatUsers,
  getCandidates,
  createCandidate,
  updateCandidateStage,
  deleteCandidate,
  getSettings,
  updateSettings,
  createEmployeeAdmin,
  updateEmployeeAdmin,
  deleteEmployeeAdmin
} = require('../controllers/actionController');

router.post('/task', protect, createTask);
router.put('/task/:id/complete', protect, completeTask);

router.post('/leave', protect, createLeave);
router.put('/leave/:id/status', protect, updateLeaveStatus);

router.post('/announcement', protect, createAnnouncement);

router.post('/message', protect, sendMessage);
router.get('/messages/users', protect, getChatUsers);
router.get('/messages/:userId', protect, getMessages);

// Recruitment Funnel CRUD
router.get('/recruitment/candidates', protect, getCandidates);
router.post('/recruitment/candidates', protect, createCandidate);
router.put('/recruitment/candidates/:id', protect, updateCandidateStage);
router.delete('/recruitment/candidates/:id', protect, deleteCandidate);

// Global Settings CRUD
router.get('/settings', protect, getSettings);
router.post('/settings', protect, updateSettings);

// Admin Employees CRUD
router.post('/employees', protect, createEmployeeAdmin);
router.put('/employees/:id', protect, updateEmployeeAdmin);
router.delete('/employees/:id', protect, deleteEmployeeAdmin);

module.exports = router;
