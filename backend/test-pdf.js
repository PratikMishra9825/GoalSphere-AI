const { generatePDFBuffer } = require('./utils/pdfGenerator');

async function run() {
  try {
    const data = {
      name: 'Test User',
      completedTasks: 5,
      totalTasks: 10,
      completionRate: 50,
      goalsActive: 2,
      goalsApproved: 1,
      leavesRequested: 0,
      engagementScore: 80,
      burnoutRisk: 'Low',
      attendanceProbability: 90,
      summaryText: 'This is a test summary'
    };
    
    console.log('Generating PDF...');
    const buffer = await generatePDFBuffer('employee', data);
    console.log('PDF generated successfully, length:', buffer.length);
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
}

run();
