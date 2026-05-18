const Task = require('../models/Task');
const Leave = require('../models/Leave');
const Announcement = require('../models/Announcement');
const Message = require('../models/Message');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Settings = require('../models/Settings');
const bcrypt = require('bcryptjs');
const socketManager = require('../socket/socketManager');
const { createAndEmit } = require('./notificationController');

// ─── TASK ACTIONS ─────────────────────────────────────────────────────────────

const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate, priority } = req.body;
    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ message: 'Title, assignedTo, and dueDate are required' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      dueDate,
      priority: priority || 'Medium',
      status: 'Pending'
    });

    const populated = await task.populate('assignedBy', 'name avatar');

    // Notify employee via Socket + DB Notification
    await createAndEmit({
      recipientId: assignedTo,
      senderId: req.user._id,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: "${title}"`,
      type: 'system',
      link: '/employee/dashboard'
    });

    socketManager.emitToUser(assignedTo, 'task:created', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = 'Completed';
    await task.save();

    const populated = await task.populate('assignedTo', 'name avatar');

    // Notify manager
    await createAndEmit({
      recipientId: task.assignedBy,
      senderId: req.user._id,
      title: 'Task Completed',
      message: `${req.user.name} completed the task: "${task.title}"`,
      type: 'goal_approved',
      link: '/manager/dashboard'
    });

    socketManager.emitToUser(task.assignedBy, 'task:completed', populated);

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── LEAVE ACTIONS ────────────────────────────────────────────────────────────

const createLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;
    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All leave fields are required' });
    }

    const leave = await Leave.create({
      user: req.user._id,
      type,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    });

    const populated = await leave.populate('user', 'name avatar department designation manager');

    // If employee has a manager, notify manager
    if (req.user.manager) {
      await createAndEmit({
        recipientId: req.user.manager,
        senderId: req.user._id,
        title: 'New Leave Request',
        message: `${req.user.name} submitted a leave request: "${type}"`,
        type: 'system',
        link: '/manager/dashboard'
      });
      socketManager.emitToUser(req.user.manager, 'leave:created', populated);
    }

    // Also notify HR room
    socketManager.emitToRole('hr', 'leave:created', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid leave status' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    leave.status = status;
    leave.approvedBy = req.user._id;
    await leave.save();

    const populated = await leave.populate('user', 'name avatar');

    // Notify employee
    await createAndEmit({
      recipientId: leave.user._id,
      senderId: req.user._id,
      title: status === 'Approved' ? '🎉 Leave Request Approved' : '❌ Leave Request Rejected',
      message: `Your leave request for "${leave.type}" has been ${status.toLowerCase()}`,
      type: status === 'Approved' ? 'goal_approved' : 'goal_rejected',
      link: '/employee/dashboard'
    });

    socketManager.emitToUser(leave.user._id, 'leave:updated', populated);
    socketManager.emitToRole('hr', 'leave:updated', populated);

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, targetRole } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      createdBy: req.user._id,
      targetRole: targetRole || 'all'
    });

    const populated = await announcement.populate('createdBy', 'name avatar');

    // Broadcast to target roles
    if (targetRole === 'all') {
      socketManager.emitToAll('announcement:new', populated);
    } else {
      socketManager.emitToRole(targetRole, 'announcement:new', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── MESSAGES (CHAT) ──────────────────────────────────────────────────────────

const sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    if (!recipientId || !text) {
      return res.status(400).json({ message: 'recipientId and text are required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      text
    });

    const populated = await message.populate('sender', 'name avatar');

    // Real-time emit to recipient
    socketManager.emitToUser(recipientId, 'message:new', populated);
    // Also emit to sender (in case they have multiple tabs open)
    socketManager.emitToUser(req.user._id, 'message:new', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    }).sort({ createdAt: 1 }).populate('sender', 'name avatar');

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatUsers = async (req, res) => {
  try {
    // Load all users to chat with (excluding self)
    const users = await User.find({ _id: { $ne: req.user._id } }).select('name email avatar role department designation');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── RECRUITMENT (CANDIDATES) ────────────────────────────────────────────────
const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: 1 });
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCandidate = async (req, res) => {
  try {
    const { name, role } = req.body;
    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required' });
    }
    const candidate = await Candidate.create({ name, role });
    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCandidateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    if (!stage || !['Applied', 'Interviewing', 'Offered', 'Hired'].includes(stage)) {
      return res.status(400).json({ message: 'Invalid recruitment stage' });
    }
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.stage = stage;
    await candidate.save();

    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    await Candidate.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Candidate requisition closed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── SETTINGS ACTIONS ─────────────────────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    Object.assign(settings, req.body);
    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── ADMIN EMPLOYEE CRUD ──────────────────────────────────────────────────────
const createEmployeeAdmin = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, manager } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role ? role.toLowerCase() : 'employee',
      department: department || 'Engineering',
      designation: designation || 'Frontend Developer',
      manager: manager || undefined,
      avatar: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEmployeeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    const { name, role, department, designation, manager } = req.body;
    if (name) user.name = name;
    if (role) user.role = role.toLowerCase();
    if (department) user.department = department;
    if (designation) user.designation = designation;
    user.manager = manager || undefined;

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEmployeeAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Employee not found' });

    await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Employee removed from system successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
