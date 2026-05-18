const User = require('../models/User');
const Goal = require('../models/Goal');
const Task = require('../models/Task');
const Leave = require('../models/Leave');
const Announcement = require('../models/Announcement');

function calculateGoalScore(goal) {
  if (!goal.checkIns || goal.checkIns.length === 0) return 0;
  const latestCheckIn = goal.checkIns[goal.checkIns.length - 1];
  const actual = latestCheckIn.actualAchievement;
  const target = goal.targetValue;
  
  if (goal.uom === 'Zero-based') {
    return actual === 0 ? 100 : Math.max(0, 100 - actual);
  } else if (goal.uom === 'Timeline') {
    return latestCheckIn.status === 'Completed' ? 100 : 
           latestCheckIn.status === 'On Track' ? 50 : 25;
  } else {
    // Default 'Min' formula (higher is better): Achievement / Target
    if (target === 0) return 0;
    const score = (actual / target) * 100;
    return Math.min(Math.round(score), 100);
  }
}

// ─── GET /api/dashboard/employee ──────────────────────────────────────────────
const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Fetch employee's goals
    const goals = await Goal.find({ owner: userId }).sort({ createdAt: -1 });
    const totalGoals = goals.length;
    
    let totalScore = 0;
    goals.forEach(g => {
      totalScore += calculateGoalScore(g);
    });
    const overallCompletion = totalGoals > 0 ? Math.round(totalScore / totalGoals) : 0;

    // 2. Fetch active tasks for employee
    const tasks = await Task.find({ assignedTo: userId }).sort({ createdAt: -1 });
    const pendingTasks = tasks.filter(t => t.status !== 'Completed');

    // 3. Fetch leaves
    const leaves = await Leave.find({ user: userId }).sort({ createdAt: -1 });

    // 4. Announcements
    const announcements = await Announcement.find({
      targetRole: { $in: ['all', 'employee'] }
    }).sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name avatar');

    res.status(200).json({
      metrics: {
        overallCompletion: `${overallCompletion}%`,
        activeGoals: totalGoals,
        upcomingDeadlines: pendingTasks.length,
        productivityScore: totalGoals > 0 ? Math.round(overallCompletion * 0.8 + 20) : 90
      },
      goals: goals.map(g => {
        const score = calculateGoalScore(g);
        return {
          _id: g._id,
          title: g.title,
          progress: score,
          status: g.status,
          targetValue: g.targetValue,
          uom: g.uom,
          color: score >= 100 ? 'bg-emerald-500' : (score > 50 ? 'bg-blue-500' : 'bg-amber-500')
        };
      }),
      tasks: tasks.slice(0, 5),
      leaves: leaves.slice(0, 5),
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/dashboard/manager ───────────────────────────────────────────────
const getManagerDashboard = async (req, res) => {
  try {
    // A manager sees their direct reports
    const teamMembers = await User.find({ manager: req.user._id });
    const teamIds = teamMembers.map(u => u._id);

    // 1. Fetch pending approvals (goals and leaves)
    const pendingGoals = await Goal.find({
      owner: { $in: teamIds },
      status: 'Pending Approval'
    }).populate('owner', 'name avatar email designation').sort({ createdAt: -1 });

    const pendingLeaves = await Leave.find({
      user: { $in: teamIds },
      status: 'Pending'
    }).populate('user', 'name avatar email department').sort({ createdAt: -1 });

    // 2. Team goals and performance
    const teamGoals = await Goal.find({ owner: { $in: teamIds } }).sort({ createdAt: -1 });
    const completedTeamGoals = teamGoals.filter(g => g.status === 'Approved');

    // 3. Announcements
    const announcements = await Announcement.find({
      targetRole: { $in: ['all', 'manager'] }
    }).sort({ createdAt: -1 }).limit(5).populate('createdBy', 'name avatar');

    res.status(200).json({
      teamSize: teamMembers.length,
      pendingApprovals: {
        goals: pendingGoals,
        leaves: pendingLeaves
      },
      teamMembers: teamMembers.map(m => {
        const mGoals = teamGoals.filter(g => g.owner.toString() === m._id.toString());
        let mScore = 0;
        mGoals.forEach(g => mScore += calculateGoalScore(g));
        const score = mGoals.length > 0 ? Math.round(mScore / mGoals.length) : 0;
        return {
          _id: m._id,
          name: m.name,
          designation: m.designation,
          avatar: m.avatar,
          email: m.email,
          goals: mGoals.length,
          score: score > 0 ? score : 0,
          status: score > 80 ? 'On Track' : (score > 50 ? 'Needs Attention' : 'At Risk')
        };
      }),
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/dashboard/hr ────────────────────────────────────────────────────
const getHRDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'employee' });
    const totalManagers = await User.countDocuments({ role: 'manager' });
    const allGoals = await Goal.countDocuments();
    const approvedGoals = await Goal.countDocuments({ status: 'Approved' });
    const approvalRate = allGoals > 0 ? Math.round((approvedGoals / allGoals) * 100) : 100;

    const allLeaves = await Leave.find().populate('user', 'name department').sort({ createdAt: -1 }).limit(10);
    const announcements = await Announcement.find().sort({ createdAt: -1 }).populate('createdBy', 'name avatar');

    // Fetch all goals populated with owner department
    const goalsList = await Goal.find().populate('owner', 'department');
    
    // Group goals by department, then by status
    const deptDistributionMap = {};
    
    goalsList.forEach(goal => {
      if (!goal.owner) return;
      const dept = goal.owner.department || 'Engineering';
      if (!deptDistributionMap[dept]) {
        deptDistributionMap[dept] = { 'On Track': 0, Delayed: 0, Blocked: 0 };
      }
      
      const latestCheckIn = goal.checkIns?.[goal.checkIns.length - 1];
      const status = latestCheckIn ? latestCheckIn.status : 'Not Started';
      
      if (status === 'On Track' || status === 'Completed') {
        deptDistributionMap[dept]['On Track'] += 1;
      } else if (status === 'Delayed') {
        deptDistributionMap[dept]['Delayed'] += 1;
      } else if (status === 'Blocked') {
        deptDistributionMap[dept]['Blocked'] += 1;
      } else {
        deptDistributionMap[dept]['On Track'] += 1;
      }
    });

    // Ensure all departments from user stats are represented
    const departmentStats = await User.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const departmentDistribution = departmentStats.map(d => {
      const deptName = d._id || 'Engineering';
      const stats = deptDistributionMap[deptName] || { 'On Track': 0, Delayed: 0, Blocked: 0 };
      
      if (stats['On Track'] === 0 && stats['Delayed'] === 0 && stats['Blocked'] === 0) {
        // Safe baseline if zero goals exist in department
        return {
          name: deptName,
          'On Track': d.count,
          Delayed: 0,
          Blocked: 0
        };
      }
      
      return {
        name: deptName,
        'On Track': stats['On Track'],
        Delayed: stats['Delayed'],
        Blocked: stats['Blocked']
      };
    });

    res.status(200).json({
      metrics: {
        totalEmployees: totalUsers + totalManagers,
        goalsSubmitted: allGoals,
        approvalRate: `${approvalRate}%`,
        activeCycle: '2026-2027 Active'
      },
      departmentDistribution,
      allLeaves,
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployeeDashboard,
  getManagerDashboard,
  getHRDashboard
};
