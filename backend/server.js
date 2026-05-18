const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const socketManager = require('./socket/socketManager');
const { initScheduler } = require('./utils/weeklyScheduler');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ─── Socket.io setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialise socket manager with the io instance
socketManager.init(io);

// JWT authentication handshake middleware for sockets
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) return next(new Error('Authentication error: no token'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Authentication error: user not found'));

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: ' + err.message));
  }
});

// Socket connection handler
io.on('connection', (socket) => {
  const user = socket.user;
  const userId = user._id.toString();

  console.log(`[Socket] Connected: ${user.name} (${user.role}) — socket ${socket.id}`);

  // Join personal room + role room
  socket.join(`user:${userId}`);
  socket.join(`role:${user.role}`);

  // Track socket
  socketManager.addUserSocket(userId, socket.id);

  // Broadcast online status to all
  io.emit('user:online', {
    userId,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
  });

  // Send current online users to this socket
  socket.emit('online:users', socketManager.getOnlineUserIds());

  // ─── Client events ──────────────────────────────────────────────────────────

  // typing indicator (for future chat)
  socket.on('typing:start', (data) => {
    socket.to(`user:${data.recipientId}`).emit('typing:start', {
      senderId: userId,
      senderName: user.name,
    });
  });

  socket.on('typing:stop', (data) => {
    socket.to(`user:${data.recipientId}`).emit('typing:stop', { senderId: userId });
  });

  // Ping/pong health check from client
  socket.on('ping:client', () => {
    socket.emit('pong:server', { ts: Date.now() });
  });

  // ─── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${user.name} — reason: ${reason}`);
    socketManager.removeUserSocket(userId, socket.id);

    // If user has no more sockets, they are truly offline
    if (!socketManager.isUserOnline(userId)) {
      io.emit('user:offline', { userId });
    }
  });
});

// ─── Express middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    initScheduler(); // Start weekly summary cron after DB is ready
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/actions', require('./routes/actionRoutes'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'GoalSphere API is running',
    onlineUsers: socketManager.getOnlineUserIds().length,
  });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 GoalSphere server running on port ${PORT}`);
  console.log(`⚡ Socket.io enabled with JWT auth`);
});

