const { GoogleGenerativeAI } = require('@google/generative-ai');

// Clean quotes from key if present
const apiKey = (process.env.GEMINI_API_KEY || "").replace(/"/g, "");
const genAI = new GoogleGenerativeAI(apiKey);

const generateGoalSuggestions = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`As an HR expert, improve the following goal to make it SMART (Specific, Measurable, Achievable, Relevant, Time-bound). Return only the suggested text: ${prompt}`);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI suggestions with primary model:', error);
    try {
      const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const resultFallback = await modelFallback.generateContent(`As an HR expert, improve the following goal to make it SMART (Specific, Measurable, Achievable, Relevant, Time-bound). Return only the suggested text: ${prompt}`);
      const responseFallback = resultFallback.response;
      return responseFallback.text();
    } catch (innerError) {
      console.error('AI suggestions fallback also failed:', innerError);
      return null;
    }
  }
};

const queryVoiceAssistant = async (query, userContext) => {
  const systemPrompt = `You are "GoalSphere AI Voice Assistant", a sophisticated, friendly, and highly intelligent vocal intelligence built into the GoalSphere AI enterprise platform.
Your task is to answer the user's spoken-word questions regarding their tasks, goals, workload, or organizational status.

CRITICAL RULES FOR RESPONSES:
1. Speak directly, conversationally, and clearly in the first person.
2. The user will HEAR this response spoken aloud via browser text-to-speech. You MUST return ONLY clean, natural prose.
3. ABSOLUTELY NO markdown formatting, asterisks (**), bullets (-), numbering (1.), or special symbols are allowed.
4. Keep the response highly concise (1 to 3 short sentences maximum!).
5. Address the user by their name: ${userContext.name}.

USER CONTEXT DETAILS:
- Name: ${userContext.name}
- Role: ${userContext.role}
- Department: ${userContext.department || 'N/A'}
- Designation: ${userContext.designation || 'N/A'}

PORTAL LIVE DATABASE METRICS CONTEXT:
${JSON.stringify(userContext.liveData, null, 2)}

User's Spoken Query: "${query}"

Return only the clean conversational spoken response text:`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating Voice AI assistant response with primary model:', error);
    try {
      const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const resultFallback = await modelFallback.generateContent(systemPrompt);
      return resultFallback.response.text().trim();
    } catch (innerError) {
      console.error('Voice AI assistant fallback also failed:', innerError);
      return "I'm having trouble retrieving that information right now. Please check back in a moment while I synchronize my databases.";
    }
  }
};

const explainAttendanceRisk = async (employeeName, telemetry) => {
  const systemPrompt = `You are "GoalSphere AI Workforce Psychologist & Attendance Analyst", a sophisticated AI capability integrated into the GoalSphere Q2 Enterprise Portal.
Your task is to provide a highly explainable, detailed, and professional psychological stress and attendance risk analysis for the employee: ${employeeName}.

INPUT TELEMETRY METRICS:
- Name: ${employeeName}
- Department: ${telemetry.department}
- Designation: ${telemetry.designation}
- Leaves History: ${telemetry.leavesCount} requested leave(s)
- Workload (Active Pending Tasks): ${telemetry.workloadCount} pending task(s)
- Task Completion Rate: ${telemetry.completionRate}%
- Engagement Telemetry Score: ${telemetry.engagementScore}%
- Calculated Attendance Probability: ${telemetry.probability}%
- Current Risk Level: ${telemetry.riskLevel}

CRITICAL INSTRUCTIONS:
1. Provide a professional, deeply psychological, and explainable AI analysis of the employee's attendance likelihood. Focus on burnout, stress from workload, absence history, and engagement patterns.
2. Structure your analysis into EXACTLY 3 clean paragraphs:
   - Paragraph 1: Detailed Risk Explanation (analyze the telemetry numbers like high workload vs task completion rate, leave frequency, etc.).
   - Paragraph 2: Psychological Stress & Burnout Impact (assess their stress levels, Q2 engagement rate, and potential root causes of absenteeism).
   - Paragraph 3: Specific Actionable Recommendations for HR (detailed directives like one-on-one syncs, adjustments in active assignments, wellness pre-approvals).
3. Do NOT output markdown headers (like # or ##) or bold formatting. Just output clean, professional paragraphs separated by double newlines.
4. Keep the tone sophisticated, empathetic, and HR-executive grade.

Return only the clean explainable text content:`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating AI explainability with primary model:', error);
    try {
      const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const resultFallback = await modelFallback.generateContent(systemPrompt);
      return resultFallback.response.text().trim();
    } catch (innerError) {
      console.error('AI explainability fallback also failed:', innerError);
      return `Based on Q2 metrics, ${employeeName} has a calculated attendance probability of ${telemetry.probability}% (${telemetry.riskLevel} Risk). The workload of ${telemetry.workloadCount} pending tasks might contribute to stress. We recommend a proactive Q2 sync and checking active workload levels.`;
    }
  }
};

const generateWeeklySummary = async (userName, role, metrics) => {
  const systemPrompt = `You are "GoalSphere Weekly Intelligence Engine", an advanced AI narrative writer for enterprise workforce analytics.
Your task is to generate a professional, insightful, and deeply human weekly summary for: ${userName} (Role: ${role}).

WEEKLY TELEMETRY METRICS:
- Total Tasks: ${metrics.totalTasks}
- Completed Tasks: ${metrics.completedTasks}
- Task Completion Rate: ${metrics.completionRate}%
- Pending Tasks: ${metrics.pendingTasks}
- Leaves Requested This Week: ${metrics.leavesRequested}
- Active Goals: ${metrics.goalsActive}
- Approved Goals: ${metrics.goalsApproved}
- Engagement Score: ${metrics.engagementScore}%
- Burnout Risk Level: ${metrics.burnoutRisk}

CRITICAL INSTRUCTIONS:
1. Write a 3-paragraph, executive-grade weekly intelligence narrative for this team member.
2. Paragraph 1: "Performance Pulse" — Analyze task velocity, completions, and output trends this week.
3. Paragraph 2: "Engagement & Wellbeing Signal" — Assess engagement trends, risk of burnout, and leave patterns.
4. Paragraph 3: "Strategic Guidance for Next Week" — Actionable, empowering directives tailored to their role.
5. Write in a sophisticated, motivating, and empathetic tone — like a brilliant executive coach.
6. Do NOT use markdown headers or bullet points. Output ONLY clean paragraphs separated by double newlines.
7. Keep each paragraph to 2-3 sentences — precise and impactful.

Return only the clean narrative text:`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(systemPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating weekly summary with primary model:', error);
    try {
      const modelFallback = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const resultFallback = await modelFallback.generateContent(systemPrompt);
      return resultFallback.response.text().trim();
    } catch (innerError) {
      console.error('Weekly summary fallback also failed:', innerError);
      return `This week, ${userName} achieved a ${metrics.completionRate}% task completion rate with ${metrics.completedTasks} of ${metrics.totalTasks} tasks completed.\n\nEngagement levels are at ${metrics.engagementScore}% with a current burnout risk classified as ${metrics.burnoutRisk}.\n\nFor next week, focus on closing the ${metrics.pendingTasks} pending tasks and maintaining consistent check-in velocity to sustain performance momentum.`;
    }
  }
};

module.exports = { generateGoalSuggestions, queryVoiceAssistant, explainAttendanceRisk, generateWeeklySummary };

