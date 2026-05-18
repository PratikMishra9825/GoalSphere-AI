const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
  updateProfile,
  setRole,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/set-role', protect, setRole);
router.get('/me', protect, getMe);
router.put('/update', protect, upload.single('avatar'), updateProfile);

module.exports = router;
