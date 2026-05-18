const Goal = require('../models/Goal');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const socketManager = require('../socket/socketManager');
const { createAndEmit } = require('./notificationController');

// ─── Helper: find managers / hr to notify ────────────────────────────────────
async function getManagersAndHR() {
  return User.find({ role: { $in: ['manager', 'hr'] } }).select('_id');
}

// @desc    Get goals for current user
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      query = { owner: req.user._id };
    } else if (req.query.owner) {
      query = { owner: req.query.owner };
    }

    const goals = await Goal.find(query).populate('owner', 'name email avatar designation').sort({ createdAt: -1 });
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set goal
// @route   POST /api/goals
// @access  Private
const setGoal = async (req, res) => {
  try {
    const { title, description, thrustArea, uom, targetValue, weightage, dueDate } = req.body;

    if (!title || !description || !thrustArea || !uom || !targetValue || !weightage || !dueDate) {
      return res.status(400).json({ message: 'Please add all required fields' });
    }

    const userGoals = await Goal.find({ owner: req.user._id });
    const activeGoals = userGoals.filter(g => g.status !== 'Archived');
    if (activeGoals.length >= 8) {
      return res.status(400).json({ message: 'Maximum 8 active goals allowed per employee' });
    }

    const currentTotalWeightage = userGoals
      .filter(g => g.status !== 'Archived')
      .reduce((sum, g) => sum + g.weightage, 0);
    if (currentTotalWeightage + Number(weightage) > 100) {
      return res.status(400).json({ message: `Adding this goal exceeds the 100% total weightage limit. Current active total: ${currentTotalWeightage}%` });
    }

    const goal = await Goal.create({
      title,
      description,
      thrustArea,
      uom,
      targetValue,
      weightage,
      dueDate,
      owner: req.user._id,
      status: 'Draft',
    });

    await AuditLog.create({
      action: 'Create Goal',
      entity: 'Goal',
      entityId: goal._id,
      performedBy: req.user._id,
      newValue: { title, weightage, uom, targetValue }
    });

    const populated = await goal.populate('owner', 'name email avatar designation');

    // ── Real-time: notify managers and HR ──────────────────────────────────
    const recipients = await getManagersAndHR();
    for (const r of recipients) {
      await createAndEmit({
        recipientId: r._id,
        senderId: req.user._id,
        title: 'New Goal Created',
        message: `${req.user.name} created a new goal: "${title}"`,
        type: 'goal_created',
        link: '/manager/dashboard',
      });
    }

    // Broadcast goal to manager/hr rooms so dashboards update live
    socketManager.emitToRole('manager', 'goal:created', populated);
    socketManager.emitToRole('hr', 'goal:created', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (goal.owner.toString() !== req.user._id.toString() && req.user.role === 'employee') {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (goal.status === 'Approved' && req.user.role === 'employee' && req.body.status !== 'Archived') {
      return res.status(400).json({ message: 'Approved goals cannot be modified directly.' });
    }

    // Shared Goal Validation: Employees can only modify weightage or submit for review
    if (goal.isShared && req.user.role === 'employee') {
      const allowedFields = ['weightage', 'status'];
      const attemptedFields = Object.keys(req.body);
      const isViolating = attemptedFields.some(f => !allowedFields.includes(f));
      if (isViolating) {
        return res.status(400).json({ message: 'This is a shared goal. Title, Target, and UoM are read-only for employees.' });
      }
    }

    if (req.body.weightage !== undefined || req.body.status === 'Pending Approval' || req.body.status === 'Archived') {
      const userGoals = await Goal.find({ owner: req.user._id });
      let newTotal = 0;
      let targetGoalWeightage = req.body.weightage !== undefined ? Number(req.body.weightage) : goal.weightage;

      userGoals.forEach(g => {
        if (g._id.toString() !== goal._id.toString() && g.status !== 'Archived') {
          newTotal += g.weightage;
        }
      });
      
      // If we are archiving this goal, it should no longer count towards the active total weightage
      if (req.body.status !== 'Archived') {
        newTotal += targetGoalWeightage;
      }

      if (newTotal > 100) {
        return res.status(400).json({ message: `Total active weightage cannot exceed 100%. Current configuration totals ${newTotal}%.` });
      }

      if (req.body.status === 'Pending Approval' && newTotal !== 100) {
        return res.status(400).json({ message: `Total active weightage must be exactly 100% to submit for approval. Currently at ${newTotal}%.` });
      }
    }

    const prevStatus = goal.status;
    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('owner', 'name email avatar designation');

    await AuditLog.create({
      action: 'Update Goal',
      entity: 'Goal',
      entityId: goal._id,
      performedBy: req.user._id,
      previousValue: { status: goal.status, weightage: goal.weightage },
      newValue: { status: updatedGoal.status, weightage: updatedGoal.weightage }
    });

    const newStatus = updatedGoal.status;

    // ── Real-time: emit goal update to owner + all managers/hr ────────────
    socketManager.emitToUser(updatedGoal.owner._id, 'goal:updated', updatedGoal);
    socketManager.emitToRole('manager', 'goal:updated', updatedGoal);
    socketManager.emitToRole('hr', 'goal:updated', updatedGoal);

    // ── If status changed to Approved or Rejected, notify employee ─────────
    if (prevStatus !== newStatus) {
      if (newStatus === 'Approved') {
        await createAndEmit({
          recipientId: updatedGoal.owner._id,
          senderId: req.user._id,
          title: '🎉 Goal Approved!',
          message: `Your goal "${updatedGoal.title}" has been approved.`,
          type: 'goal_approved',
          link: '/employee/goals',
        });
        socketManager.emitToUser(updatedGoal.owner._id, 'goal:status_changed', {
          goalId: updatedGoal._id,
          status: 'Approved',
          title: updatedGoal.title,
        });
      } else if (newStatus === 'Rejected' || newStatus === 'Rework Required') {
        await createAndEmit({
          recipientId: updatedGoal.owner._id,
          senderId: req.user._id,
          title: newStatus === 'Rejected' ? '❌ Goal Rejected' : '🔁 Rework Required',
          message: `Your goal "${updatedGoal.title}" requires attention.`,
          type: 'goal_rejected',
          link: '/employee/goals',
        });
        socketManager.emitToUser(updatedGoal.owner._id, 'goal:status_changed', {
          goalId: updatedGoal._id,
          status: newStatus,
          title: updatedGoal.title,
        });
      } else if (newStatus === 'Pending Approval') {
        // Employee submitted for review — notify managers/hr
        const recipients = await getManagersAndHR();
        for (const r of recipients) {
          await createAndEmit({
            recipientId: r._id,
            senderId: req.user._id,
            title: '📋 Goal Awaiting Approval',
            message: `${req.user.name} submitted "${updatedGoal.title}" for approval.`,
            type: 'goal_submitted',
            link: '/manager/dashboard',
          });
        }
      } else if (newStatus === 'Archived') {
        // Goal achieved and archived - notify managers and HR
        const recipients = await getManagersAndHR();
        for (const r of recipients) {
          await createAndEmit({
            recipientId: r._id,
            senderId: req.user._id,
            title: '🗄️ Goal Completed & Archived!',
            message: `${updatedGoal.owner.name} successfully achieved and archived their goal: "${updatedGoal.title}"!`,
            type: 'goal_archived',
            link: '/manager/dashboard',
          });
        }
      }
    }

    res.status(200).json(updatedGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (goal.owner.toString() !== req.user._id.toString() && req.user.role === 'employee') {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (goal.status === 'Approved' && req.user.role === 'employee') {
      return res.status(400).json({ message: 'Approved goals cannot be deleted.' });
    }

    await goal.deleteOne();

    await AuditLog.create({
      action: 'Delete Goal',
      entity: 'Goal',
      entityId: goal._id,
      performedBy: req.user._id
    });

    // Emit deletion to all relevant parties
    socketManager.emitToRole('manager', 'goal:deleted', { goalId: req.params.id });
    socketManager.emitToRole('hr', 'goal:deleted', { goalId: req.params.id });

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit check-in for a goal
// @route   POST /api/goals/:id/checkins
// @access  Private
const submitCheckIn = async (req, res) => {
  try {
    const { quarter, actualAchievement, progressNotes, evidenceUrl } = req.body;
    
    if (!quarter || actualAchievement === undefined) {
      return res.status(400).json({ message: 'Quarter and actual achievement are required' });
    }

    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (goal.owner.toString() !== req.user._id.toString() && req.user.role === 'employee') {
      return res.status(401).json({ message: 'User not authorized' });
    }

    goal.checkIns.push({
      quarter,
      actualAchievement,
      progressNotes,
      evidenceUrl,
      submittedAt: new Date()
    });

    await goal.save();
    
    await AuditLog.create({
      action: 'Submit Check-In',
      entity: 'Goal',
      entityId: goal._id,
      performedBy: req.user._id,
      newValue: { quarter, actualAchievement }
    });

    // Shared Goal Sync: Propagate check-in to other linked shared goals
    if (goal.isShared && goal.sharedPrimaryOwner) {
      const linkedGoals = await Goal.find({
        isShared: true,
        title: goal.title,
        sharedPrimaryOwner: goal.sharedPrimaryOwner,
        _id: { $ne: goal._id }
      });

      for (const linked of linkedGoals) {
        linked.checkIns.push({
          quarter,
          actualAchievement,
          progressNotes: `${progressNotes} (Synced from shared primary owner)`,
          evidenceUrl,
          submittedAt: new Date()
        });
        await linked.save();

        const populatedLinked = await linked.populate('owner', 'name email avatar designation');
        socketManager.emitToUser(linked.owner._id, 'goal:updated', populatedLinked);
      }
    }

    const populated = await goal.populate('owner', 'name email avatar designation');
    
    // Check if goal reached 100% completion on this check-in
    const progressVal = goal.targetValue > 0 ? (actualAchievement / goal.targetValue) * 100 : 0;
    if (progressVal >= 100) {
      const recipients = await getManagersAndHR();
      for (const r of recipients) {
        await createAndEmit({
          recipientId: r._id,
          senderId: req.user._id,
          title: '🎉 Goal Completed!',
          message: `${req.user.name} has reached 100% target progress on: "${goal.title}"!`,
          type: 'goal_completed',
          link: '/manager/dashboard',
        });
      }
    }

    socketManager.emitToRole('manager', 'goal:updated', populated);

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getGoals,
  setGoal,
  updateGoal,
  deleteGoal,
  submitCheckIn,
};
