const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const Goal = require('../models/Goal');
const WeeklyReport = require('../models/WeeklyReport');
const { generateWeeklySummary } = require('./gemini');

// ─── Compile metrics and generate a weekly report for a single user ───────────
const generateReportForUser = async (user) => {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // ── Compile live telemetry ─────────────────────────────────────────────────
    const totalTasks = await Task.countDocuments({ assignedTo: user._id });
    const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: 'Pending' });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;
    const leavesRequested = await Leave.countDocuments({ user: user._id, createdAt: { $gte: weekStart } });
    const goalsActive = await Goal.countDocuments({ owner: user._id });
    const goalsApproved = await Goal.countDocuments({ owner: user._id, status: 'Approved' });

    // Compute engagement & burnout
    let engagementScore = 88;
    if (completionRate > 90) engagementScore += 4;
    if (completionRate < 70) engagementScore -= 8;
    if (pendingTasks > 5) engagementScore -= 4;
    engagementScore = Math.min(Math.max(engagementScore, 60), 98);

    let burnoutRisk = 'Low';
    if (engagementScore < 70 || pendingTasks > 7) burnoutRisk = 'High';
    else if (engagementScore < 80 || pendingTasks > 4) burnoutRisk = 'Medium';

    const metrics = {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      leavesRequested,
      goalsActive,
      goalsApproved,
      engagementScore,
      burnoutRisk,
    };

    // ── Generate Gemini AI summary narrative ────────────────────────────────────
    const summaryText = await generateWeeklySummary(user.name, user.role, metrics);

    // ── Upsert into weekly_reports ──────────────────────────────────────────────
    await WeeklyReport.findOneAndUpdate(
      { user: user._id, weekStart },
      {
        user: user._id,
        role: user.role,
        weekStart,
        weekEnd,
        summaryText,
        metrics,
        burnoutRisk,
        productivityDelta: completionRate >= 80 ? '+stable' : 'Below target',
      },
      { upsert: true, new: true }
    );

    console.log(`[WeeklySummary] ✓ Generated for ${user.name} (${user.role})`);
  } catch (err) {
    console.error(`[WeeklySummary] ✗ Failed for ${user.name}:`, err.message);
  }
};

// ─── Run the job for all active users ─────────────────────────────────────────
const runWeeklySummaryJob = async () => {
  console.log('[WeeklySummary] 🚀 Starting weekly summary generation job...');
  const users = await User.find({}).select('_id name role');
  for (const user of users) {
    await generateReportForUser(user); // sequential to avoid Gemini rate limits
  }
  console.log(`[WeeklySummary] ✅ Completed for ${users.length} users.`);
};

// ─── Initialise scheduler ─────────────────────────────────────────────────────
const initScheduler = () => {
  // Every Sunday at midnight (00:00)
  cron.schedule('0 0 * * 0', async () => {
    console.log('[WeeklySummary] ⏰ Cron triggered: Sunday midnight');
    await runWeeklySummaryJob();
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[WeeklySummary] ⚡ Scheduler initialised — runs every Sunday at midnight IST');
};

module.exports = { initScheduler, runWeeklySummaryJob, generateReportForUser };
