const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Goal = require('./models/Goal');
const Task = require('./models/Task');
const Leave = require('./models/Leave');
const Announcement = require('./models/Announcement');
const Message = require('./models/Message');
const Candidate = require('./models/Candidate');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goalsphere')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Utility to generate dates relative to today
const getRelativeDate = (daysOffset) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d;
};

const seedData = async () => {
  try {
    console.log("Cleaning database collections...");
    await User.deleteMany();
    await Goal.deleteMany();
    await Task.deleteMany();
    await Leave.deleteMany();
    await Announcement.deleteMany();
    await Message.deleteMany();
    await Candidate.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);

    console.log("Generating Roles & Personas...");
    
    // 1. HR Director
    const hr = await User.create({
      name: 'Sarah Jenkins', email: 'hr@goalsphere.com', password,
      role: 'hr', department: 'Human Resources', designation: 'Global HR Director',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      bio: 'Leading workspace growth, talent success, and organizational AI adoption.'
    });

    // 2. Managers
    const managerEng = await User.create({
      name: 'Michael Scott', email: 'manager@goalsphere.com', password,
      role: 'manager', department: 'Engineering', designation: 'VP of Engineering',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      bio: 'Scaling cloud infrastructure and driving AI integration across backend teams.'
    });
    
    const managerMkt = await User.create({
      name: 'Elena Rodriguez', email: 'elena@goalsphere.com', password,
      role: 'manager', department: 'Marketing', designation: 'Marketing Director',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      bio: 'Data-driven growth marketer focusing on enterprise adoption.'
    });

    // 3. Employees - Personas
    // Persona A: Top Performer (100% completion, high goals)
    const empTop = await User.create({
      name: 'Alex Rivera', email: 'employee@goalsphere.com', password,
      role: 'employee', department: 'Engineering', designation: 'Lead AI Engineer',
      manager: managerEng._id, avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      bio: 'Architecting neural network inferences. Always ahead of schedule.'
    });

    // Persona B: Burnout Risk (Overdue tasks, multiple pending leaves, high workload)
    const empBurnout = await User.create({
      name: 'David Chen', email: 'david@goalsphere.com', password,
      role: 'employee', department: 'Engineering', designation: 'Backend Developer',
      manager: managerEng._id, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'Maintaining legacy microservices and firefighting production issues.'
    });

    // Persona C: Consistent Average Performer
    const empAvg = await User.create({
      name: 'Priya Patel', email: 'priya@goalsphere.com', password,
      role: 'employee', department: 'Engineering', designation: 'Frontend Engineer',
      manager: managerEng._id, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'Building seamless UI/UX components using React and Framer Motion.'
    });

    // Persona D: New Joiner (Few tasks, onboarding goals)
    const empNew = await User.create({
      name: 'Marcus Johnson', email: 'marcus@goalsphere.com', password,
      role: 'employee', department: 'Marketing', designation: 'Growth Analyst',
      manager: managerMkt._id, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Recent graduate. Learning the ropes of enterprise SaaS marketing.'
    });

    console.log("Injecting Historical Timeline Tasks & Heatmap Data...");
    const tasksToInsert = [];
    
    // Top Performer Tasks (All completed on time or early)
    for (let i = -30; i < 5; i += 4) {
      tasksToInsert.push({
        title: `AI Optimization Phase ${i}`, description: 'Implement caching for neural inferences',
        assignedTo: empTop._id, assignedBy: managerEng._id,
        dueDate: getRelativeDate(i),
        status: i < 0 ? 'Completed' : 'In Progress',
        priority: 'High'
      });
    }

    // Burnout Risk Tasks (Many overdue, heavily backlogged)
    for (let i = -15; i < 10; i += 2) {
      tasksToInsert.push({
        title: `Legacy Fix Ticket #${Math.abs(i) * 102}`, description: 'Resolve critical memory leak in worker pool.',
        assignedTo: empBurnout._id, assignedBy: managerEng._id,
        dueDate: getRelativeDate(i),
        status: i < -5 ? 'Overdue' : (i < 0 ? 'Pending' : 'In Progress'),
        priority: 'High'
      });
    }

    // Average Performer Tasks (Steady stream)
    for (let i = -20; i < 10; i += 7) {
      tasksToInsert.push({
        title: `Dashboard Component ${i}`, description: 'Migrate component to Tailwind V4.',
        assignedTo: empAvg._id, assignedBy: managerEng._id,
        dueDate: getRelativeDate(i),
        status: i < 0 ? 'Completed' : 'Pending',
        priority: 'Medium'
      });
    }

    // New Joiner Tasks
    tasksToInsert.push({
      title: 'Complete Onboarding Training', description: 'Finish compliance and product training modules.',
      assignedTo: empNew._id, assignedBy: managerMkt._id, dueDate: getRelativeDate(2), status: 'In Progress', priority: 'High'
    });

    await Task.insertMany(tasksToInsert);

    console.log("Generating Goals to trigger Approval Bottleneck AI Insights...");
    
    // Top Performer Goals (Approved, high progress)
    await Goal.create({
      title: 'Launch Enterprise AI Module', description: 'Deploy the workforce simulator to production.',
      thrustArea: 'Product Innovation', uom: 'Percentage', targetValue: 100, weightage: 50, dueDate: getRelativeDate(30), status: 'Approved',
      owner: empTop._id, cycle: '2026-2027',
      checkIns: [{ quarter: 'Q1', actualAchievement: 90, status: 'On Track', progressNotes: 'Simulator engine is live and tested.' }]
    });

    // Burnout Risk Goals (Pending approvals to clog Manager dashboard)
    for(let i=1; i<=4; i++) {
       await Goal.create({
         title: `Refactor Legacy Auth Service Part ${i}`, description: 'Break down monolithic auth into microservices.',
         thrustArea: 'Technical Debt', uom: 'Numeric', targetValue: 5, weightage: 20, dueDate: getRelativeDate(60), status: 'Pending Approval',
         owner: empBurnout._id, cycle: '2026-2027'
       });
    }

    console.log("Generating Leaves to trigger Elevated Absenteeism Alerts...");
    // Multiple people requesting leaves overlapping exactly next week
    await Leave.create({ user: empBurnout._id, type: 'Sick', startDate: getRelativeDate(1), endDate: getRelativeDate(5), reason: 'Extreme fatigue and migraines.', status: 'Pending' });
    await Leave.create({ user: empAvg._id, type: 'Casual', startDate: getRelativeDate(2), endDate: getRelativeDate(7), reason: 'Family vacation.', status: 'Pending' });
    await Leave.create({ user: empNew._id, type: 'Casual', startDate: getRelativeDate(2), endDate: getRelativeDate(4), reason: 'Moving apartments.', status: 'Pending' });
    // And an approved one
    await Leave.create({ user: empTop._id, type: 'Earned', startDate: getRelativeDate(-10), endDate: getRelativeDate(-5), reason: 'Post-launch recovery.', status: 'Approved', approvedBy: managerEng._id });


    console.log("Broadcasting Realistic Announcements...");
    await Announcement.create({
      title: '🚨 Urgent: Q3 Sprint Planning Adjusted',
      content: 'Due to identified team bottlenecks, Q3 deliverables are being adjusted. Please check your assigned tasks and update statuses by EOD.',
      createdBy: managerEng._id, targetRole: 'employee'
    });
    
    await Announcement.create({
      title: '🌟 Employee Wellness Initiative Launched',
      content: 'HR is launching a mandatory "No-Meeting Friday" policy to combat screen fatigue and improve deep work focus. Let\'s prioritize mental health.',
      createdBy: hr._id, targetRole: 'all'
    });

    console.log("Seeding Messages...");
    await Message.create({ sender: managerEng._id, recipient: empBurnout._id, text: 'Hey David, noticing a lot of overdue tasks. Do you need me to reassign some of your tickets to Priya?' });
    await Message.create({ sender: empBurnout._id, recipient: managerEng._id, text: 'That would be a lifesaver. I am completely blocked by the legacy DB locks right now.' });

    console.log("Seeding Recruitment Candidates...");
    await Candidate.create([
      { name: "David Chen", role: "Senior Backend Developer", stage: "Interviewing" },
      { name: "Alice Wong", role: "Principal UX Designer", stage: "Applied" },
      { name: "Robert Miller", role: "DevOps Engineer", stage: "Offered" },
      { name: "Sarah Smith", role: "AI Research Specialist", stage: "Applied" }
    ]);

    console.log('✅ Advanced Enterprise Demo Dataset Injected Successfully!');
    console.log('-------------------------------------------------------');
    console.log('Test Personas:');
    console.log('HR Director: hr@goalsphere.com');
    console.log('Manager: manager@goalsphere.com');
    console.log('Employee (Top): employee@goalsphere.com');
    console.log('-------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
