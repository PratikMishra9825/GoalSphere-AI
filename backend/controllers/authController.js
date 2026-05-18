const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const cloudinary = require('cloudinary').v2;
const socketManager = require('../socket/socketManager');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME || 
      process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name' ||
      !process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_API_KEY === 'your_api_key'
    ) {
      return reject(new Error('Cloudinary credentials are default placeholders'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'goalsphere' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'Employee',
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && user.password && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// @desc    Google OAuth login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId set, update it
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture || user.avatar;
        await user.save();
      }

      if (user.role === 'pending') {
        return res.json({
          isNewUser: true,
          _id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          token: generateToken(user._id),
        });
      }

      return res.json({
        isNewUser: false,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      // Create new user via Google
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        role: 'pending' // Default role requires selection
      });

      return res.json({
        isNewUser: true,
        _id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: error.message || 'Google authentication failed' });
  }
};

// @desc    Set User Role
// @route   POST /api/auth/set-role
// @access  Private
const setRole = async (req, res) => {
  const { role } = req.body;
  
  if (!role || !['employee', 'manager', 'hr'].includes(role.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid role selection' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Prevent changing role if already set
    if (user.role && user.role !== 'pending') {
      return res.status(400).json({ message: 'Role already set. Cannot modify.' });
    }

    user.role = role.toLowerCase();
    await user.save();

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Set role error:', error);
    res.status(500).json({ message: 'Server error setting role' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Process Text Fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email is already taken' });
      }
      user.email = req.body.email;
    }
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.department !== undefined) user.department = req.body.department;
    if (req.body.designation !== undefined) user.designation = req.body.designation;
    if (req.body.bio !== undefined) user.bio = req.body.bio;

    // 2. Process Image Operations
    if (req.body.removeAvatar === 'true' || req.body.removeAvatar === true) {
      user.avatar = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
    } else if (req.file) {
      try {
        const cloudinaryUrl = await uploadToCloudinary(req.file.buffer);
        user.avatar = cloudinaryUrl;
      } catch (cloudinaryError) {
        console.warn('Cloudinary upload failed or not configured. Falling back to MongoDB Base64...', cloudinaryError.message);
        const base64Image = req.file.buffer.toString('base64');
        user.avatar = `data:${req.file.mimetype};base64,${base64Image}`;
      }
    } else if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }

    const updatedUser = await user.save();

    const responseData = {
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      phone: updatedUser.phone || '',
      department: updatedUser.department || '',
      designation: updatedUser.designation || '',
      bio: updatedUser.bio || '',
    };

    // Real-time: push updated profile to all user's open sockets
    socketManager.emitToUser(updatedUser._id, 'profile:updated', responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  setRole,
  getMe,
  updateProfile,
};
