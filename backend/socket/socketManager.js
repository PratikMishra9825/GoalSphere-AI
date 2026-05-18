/**
 * GoalSphere Socket Manager
 * Central hub for all real-time emission and online user tracking.
 */

let _io = null;

// Map: userId (string) → Set of socketIds
const userSocketMap = new Map();

/**
 * Initialise the manager with the io instance from server.js
 */
function init(io) {
  _io = io;
}

function getIO() {
  if (!_io) throw new Error('Socket.io not initialised');
  return _io;
}

// ─── User ↔ Socket tracking ───────────────────────────────────────────────────

function addUserSocket(userId, socketId) {
  const key = userId.toString();
  if (!userSocketMap.has(key)) userSocketMap.set(key, new Set());
  userSocketMap.get(key).add(socketId);
}

function removeUserSocket(userId, socketId) {
  const key = userId.toString();
  const sockets = userSocketMap.get(key);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) userSocketMap.delete(key);
  }
}

function isUserOnline(userId) {
  const key = userId.toString();
  return userSocketMap.has(key) && userSocketMap.get(key).size > 0;
}

function getOnlineUserIds() {
  return Array.from(userSocketMap.keys());
}

// ─── Emission helpers ─────────────────────────────────────────────────────────

/**
 * Emit an event to all sockets belonging to a specific user
 */
function emitToUser(userId, event, data) {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch (e) {
    console.error('[Socket] emitToUser error:', e.message);
  }
}

/**
 * Emit an event to all users in a role room (employee | manager | hr)
 */
function emitToRole(role, event, data) {
  try {
    getIO().to(`role:${role}`).emit(event, data);
  } catch (e) {
    console.error('[Socket] emitToRole error:', e.message);
  }
}

/**
 * Emit an event to every connected client
 */
function emitToAll(event, data) {
  try {
    getIO().emit(event, data);
  } catch (e) {
    console.error('[Socket] emitToAll error:', e.message);
  }
}

/**
 * Emit an event to all roles except the specified one
 */
function emitToOtherRoles(excludeRole, event, data) {
  const roles = ['employee', 'manager', 'hr'].filter((r) => r !== excludeRole);
  roles.forEach((role) => emitToRole(role, event, data));
}

module.exports = {
  init,
  getIO,
  addUserSocket,
  removeUserSocket,
  isUserOnline,
  getOnlineUserIds,
  emitToUser,
  emitToRole,
  emitToAll,
  emitToOtherRoles,
};
