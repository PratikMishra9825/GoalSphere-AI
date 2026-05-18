const express = require('express');
const router = express.Router();
const { generateGoalSuggestions, queryVoiceAssistant, explainAttendanceRisk, generateWeeklySummary } = require('../utils/gemini');
const { generatePDFStream } = require('../utils/pdfGenerator');
const { generateReportForUser } = require('../utils/weeklyScheduler');
const { protect } = require('../middleware/auth');
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const WeeklyReport = require('../models/WeeklyReport');
const Performance = require('../models/Performance');

router.post('/suggest', protect, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    const suggestion = await generateGoalSuggestions(prompt);
    if (suggestion) {
      res.json({ suggestion });
    } else {
      res.status(500).json({ message: 'Failed to generate suggestion' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/voice-assistant', protect, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const userId = req.user._id;
    const role = req.user.role ? req.user.role.toLowerCase() : 'employee';
    let liveData = {};

    // Ingest specific database context depending on user role with ultra-resilient mapping
    if (role === 'employee') {
      const goals = await Goal.find({ owner: userId }) || [];
      const tasks = await Task.find({ assignedTo: userId }).sort({ createdAt: -1 }) || [];
      const leaves = await Leave.find({ user: userId }) || [];
      const announcements = await Announcement.find({ targetRole: { $in: ['all', 'employee'] } })
        .sort({ createdAt: -1 })
        .limit(3) || [];

      liveData = {
        activeGoals: goals.map(g => {
          let currentProgress = 0;
          if (g.checkIns && Array.isArray(g.checkIns) && g.checkIns.length > 0) {
            currentProgress = g.checkIns[0].actualAchievement || 0;
          }
          return {
            title: g.title || 'Untitled Goal',
            status: g.status || 'Draft',
            weightage: g.weightage || 0,
            current: currentProgress
          };
        }),
        activeTasks: tasks.map(t => ({
          title: t.title || 'Untitled Task',
          status: t.status || 'Pending',
          priority: t.priority || 'Medium'
        })),
        leaves: leaves.map(l => ({
          type: l.type || 'Casual',
          status: l.status || 'Pending',
          reason: l.reason || ''
        })),
        announcements: announcements.map(a => ({
          title: a.title || 'No Title'
        }))
      };
    } else if (role === 'manager') {
      const teamMembers = await User.find({ manager: userId }) || [];
      const teamIds = teamMembers.map(u => u._id);
      
      const pendingGoals = teamIds.length > 0
        ? await Goal.find({ owner: { $in: teamIds }, status: 'Pending Approval' }).populate('owner', 'name')
        : [];
      const pendingLeaves = teamIds.length > 0
        ? await Leave.find({ user: { $in: teamIds }, status: 'Pending' }).populate('user', 'name')
        : [];
      const teamGoals = teamIds.length > 0
        ? await Goal.find({ owner: { $in: teamIds } })
        : [];

      liveData = {
        teamSize: teamMembers.length,
        teamMembers: teamMembers.map(m => m.name || 'Anonymous'),
        pendingApprovalsCount: (pendingGoals || []).length + (pendingLeaves || []).length,
        pendingGoals: (pendingGoals || []).map(g => ({
          title: g.title || 'Untitled Goal',
          owner: g.owner ? g.owner.name : 'Anonymous'
        })),
        pendingLeaves: (pendingLeaves || []).map(l => ({
          type: l.type || 'Casual',
          owner: l.user ? l.user.name : 'Anonymous'
        })),
        totalTeamGoals: (teamGoals || []).map(g => ({
          title: g.title || 'Untitled Goal',
          status: g.status || 'Draft'
        }))
      };
    } else if (role === 'hr') {
      const totalEmployees = await User.countDocuments({ role: 'employee' }) || 0;
      const totalManagers = await User.countDocuments({ role: 'manager' }) || 0;
      const allGoals = await Goal.countDocuments() || 0;
      const approvedGoals = await Goal.countDocuments({ status: 'Approved' }) || 0;
      const activeLeaves = await Leave.find({ status: 'Approved' }).populate('user', 'name') || [];

      liveData = {
        totalEmployees: totalEmployees + totalManagers,
        totalManagers,
        totalGoalsSubmitted: allGoals,
        approvedGoalsRate: allGoals > 0 ? `${Math.round((approvedGoals / allGoals) * 100)}%` : '100%',
        approvedLeavesCount: activeLeaves.length,
        activeLeavesList: activeLeaves.slice(0, 5).map(l => ({
          employee: l.user ? l.user.name : 'Anonymous',
          type: l.type || 'Casual'
        }))
      };
    }

    const userContext = {
      name: req.user.name || 'User',
      role: req.user.role || 'employee',
      department: req.user.department || 'General',
      designation: req.user.designation || 'Staff',
      liveData
    };

    const aiResponseText = await queryVoiceAssistant(query, userContext);
    res.json({ response: aiResponseText });
  } catch (error) {
    console.error('Voice assistant error:', error);
    res.status(500).json({ message: error.message || 'Internal database processing error' });
  }
});

// ─── SMART ATTENDANCE PREDICTION SYSTEM ───────────────────────────────────────

router.get('/attendance-prediction', protect, async (req, res) => {
  try {
    // Only HR and Managers can view prediction analytics
    if (req.user.role !== 'hr' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Access denied. Leadership privileges required.' });
    }

    const employees = await User.find({ role: 'employee' }) || [];
    const predictionData = [];

    for (const emp of employees) {
      // 1. Leave History
      const leavesCount = await Leave.countDocuments({ user: emp._id }) || 0;
      const approvedLeaves = await Leave.countDocuments({ user: emp._id, status: 'Approved' }) || 0;

      // 2. Workload (Active tasks)
      const workloadCount = await Task.countDocuments({ assignedTo: emp._id, status: 'Pending' }) || 0;

      // 3. Task Completion Rate
      const totalTasks = await Task.countDocuments({ assignedTo: emp._id }) || 0;
      const completedTasks = await Task.countDocuments({ assignedTo: emp._id, status: 'Completed' }) || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;

      // 4. Engagement Score (Calculated from check-in velocity and defaults)
      let engagementScore = 88;
      if (completionRate > 90) engagementScore += 4;
      if (completionRate < 70) engagementScore -= 8;
      if (workloadCount > 5) engagementScore -= 4; // burnout
      engagementScore = Math.min(Math.max(engagementScore, 60), 98);

      // 5. Lightweight ML Heuristic Predictor
      let probability = 96;
      probability -= (leavesCount * 2);        // leave likelihood factor
      probability -= (workloadCount * 1.5);     // workload stress factor
      probability += (completionRate - 80) * 0.15; // output boost
      probability += (engagementScore - 80) * 0.1; // engagement boost
      probability = Math.min(Math.max(Math.round(probability), 50), 98);

      // Scopes Risk Levels
      let riskLevel = 'Low';
      if (probability < 78) {
        riskLevel = 'High';
      } else if (probability < 88) {
        riskLevel = 'Medium';
      }

      // Fast pre-calculated explainability bullet
      let baseReason = '';
      if (riskLevel === 'High') {
        baseReason = `Exhibiting high burnout markers with ${workloadCount} pending tasks and recent leave requests.`;
      } else if (riskLevel === 'Medium') {
        baseReason = `Moderate workload strain. Engagement levels remain stable at ${engagementScore}%.`;
      } else {
        baseReason = `Outstanding task velocity (${completionRate}%) and healthy attendance consistency.`;
      }

      predictionData.push({
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        avatar: emp.avatar,
        department: emp.department || 'General',
        designation: emp.designation || 'Staff',
        telemetry: {
          leavesCount,
          approvedLeaves,
          workloadCount,
          completionRate,
          engagementScore,
          probability,
          riskLevel,
          baseReason
        }
      });
    }

    // Sort: highest risk employees at the top (High -> Medium -> Low)
    predictionData.sort((a, b) => a.telemetry.probability - b.telemetry.probability);

    res.json(predictionData);
  } catch (error) {
    console.error('Attendance prediction API error:', error);
    res.status(500).json({ message: error.message || 'Internal analytics compilation error' });
  }
});

router.post('/explain-attendance', protect, async (req, res) => {
  try {
    const { employeeId, telemetry } = req.body;
    if (!employeeId || !telemetry) {
      return res.status(400).json({ message: 'employeeId and telemetry are required' });
    }

    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const explainReport = await explainAttendanceRisk(employee.name, telemetry);
    res.json({ report: explainReport });
  } catch (error) {
    console.error('AI Explain Attendance risk error:', error);
    res.status(500).json({ message: error.message || 'Generative AI compilation error' });
  }
});

// ─── PDF EXPORT SYSTEM ─────────────────────────────────────────────────────────
router.get('/export-pdf', protect, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;
    const userName = req.user.name;
    let reportData = { name: userName };
    let reportType = role === 'hr' ? 'hr' : role === 'manager' ? 'team' : 'employee';

    if (role === 'employee') {
      const totalTasks = await Task.countDocuments({ assignedTo: userId });
      const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'Completed' });
      const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: 'Pending' });
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 85;
      const goalsActive = await Goal.countDocuments({ owner: userId });
      const goalsApproved = await Goal.countDocuments({ owner: userId, status: 'Approved' });
      const leavesRequested = await Leave.countDocuments({ user: userId });
      let engagementScore = 88;
      if (completionRate > 90) engagementScore += 4;
      if (completionRate < 70) engagementScore -= 8;
      if (pendingTasks > 5) engagementScore -= 4;
      engagementScore = Math.min(Math.max(engagementScore, 60), 98);
      let burnoutRisk = 'Low';
      if (engagementScore < 70 || pendingTasks > 7) burnoutRisk = 'High';
      else if (engagementScore < 80 || pendingTasks > 4) burnoutRisk = 'Medium';

      // Get latest weekly summary if available
      const latestSummary = await WeeklyReport.findOne({ user: userId }).sort({ createdAt: -1 });
      let attendanceProbability = 96;
      attendanceProbability -= (leavesRequested * 2);
      attendanceProbability -= (pendingTasks * 1.5);
      attendanceProbability += (completionRate - 80) * 0.15;
      attendanceProbability = Math.min(Math.max(Math.round(attendanceProbability), 50), 98);

      reportData = { ...reportData, totalTasks, completedTasks, pendingTasks, completionRate, goalsActive, goalsApproved, leavesRequested, engagementScore, burnoutRisk, attendanceProbability, summaryText: latestSummary?.summaryText || '' };

    } else if (role === 'manager') {
      const teamMembers = await User.find({ manager: userId });
      const teamIds = teamMembers.map(u => u._id);
      const totalGoals = teamIds.length > 0 ? await Goal.countDocuments({ owner: { $in: teamIds } }) : 0;
      const approvedGoals = teamIds.length > 0 ? await Goal.countDocuments({ owner: { $in: teamIds }, status: 'Approved' }) : 0;
      const pendingGoals = teamIds.length > 0 ? await Goal.countDocuments({ owner: { $in: teamIds }, status: 'Pending Approval' }) : 0;
      const pendingLeaves = teamIds.length > 0 ? await Leave.countDocuments({ user: { $in: teamIds }, status: 'Pending' }) : 0;
      const latestSummary = await WeeklyReport.findOne({ user: userId }).sort({ createdAt: -1 });
      reportData = { ...reportData, teamSize: teamMembers.length, totalGoals, approvedGoals, pendingGoals, pendingLeaves, summaryText: latestSummary?.summaryText || '' };

    } else if (role === 'hr') {
      const totalEmployees = await User.countDocuments({ role: 'employee' });
      const totalManagers = await User.countDocuments({ role: 'manager' });
      const goalsSubmitted = await Goal.countDocuments();
      const approvedGoals = await Goal.countDocuments({ status: 'Approved' });
      const approvalRate = goalsSubmitted > 0 ? `${Math.round((approvedGoals / goalsSubmitted) * 100)}%` : '100%';
      const activeLeaves = await Leave.countDocuments({ status: 'Approved' });
      // Estimate high risk count
      const allEmployees = await User.find({ role: 'employee' });
      let highRiskCount = 0;
      for (const emp of allEmployees) {
        const pending = await Task.countDocuments({ assignedTo: emp._id, status: 'Pending' });
        if (pending > 5) highRiskCount++;
      }
      const latestSummary = await WeeklyReport.findOne({ user: userId }).sort({ createdAt: -1 });
      reportData = { ...reportData, totalEmployees: totalEmployees + totalManagers, totalManagers, goalsSubmitted, approvalRate, activeLeaves, highRiskCount, summaryText: latestSummary?.summaryText || '' };
    }

    const filename = `GoalSphere_${reportType}_report_${Date.now()}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    
    // Pipe the PDF generation directly into the Express response stream
    await generatePDFStream(reportType, reportData, res);
    
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: error.message || 'PDF generation failed' });
  }
});

// ─── WEEKLY SUMMARY SYSTEM ─────────────────────────────────────────────────────
router.get('/weekly-summary', protect, async (req, res) => {
  try {
    const report = await WeeklyReport.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!report) return res.json(null);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/weekly-summary/generate', protect, async (req, res) => {
  try {
    await generateReportForUser(req.user);
    const report = await WeeklyReport.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(report);
  } catch (error) {
    console.error('Manual weekly summary generation error:', error);
    res.status(500).json({ message: error.message || 'Summary generation failed' });
  }
});

module.exports = router;

