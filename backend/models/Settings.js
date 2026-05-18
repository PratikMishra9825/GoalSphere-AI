const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  timeout: { type: String, default: "30" },
  policy: { type: String, default: "Strict (12 chars, special, number)" },
  ipRanges: { type: String, default: "0.0.0.0/0" },
  twoFactor: { type: Boolean, default: true },
  sessionPinning: { type: Boolean, default: false },
  backupSchedule: { type: String, default: "Daily" },
  retainLogs: { type: String, default: "90" },
  cloudBackup: { type: Boolean, default: true },
  emailAlerts: { type: Boolean, default: true },
  smsAlerts: { type: Boolean, default: false },
  notifChannel: { type: String, default: "#announcements" },
  reviewReminders: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
