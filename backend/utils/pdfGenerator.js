const PDFDocument = require('pdfkit');

// ─── Colour Palette ────────────────────────────────────────────────────────────
const COLORS = {
  bg:          '#0f1117',
  card:        '#1a1d2e',
  border:      '#2a2d3e',
  primary:     '#6366f1',   // indigo
  accent:      '#8b5cf6',   // violet
  emerald:     '#10b981',
  amber:       '#f59e0b',
  red:         '#ef4444',
  textPrimary: '#f1f5f9',
  textMuted:   '#64748b',
  textSub:     '#94a3b8',
  white:       '#ffffff',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fillRect = (doc, x, y, w, h, color, opacity = 1) => {
  doc.save().fillColor(color).fillOpacity(opacity).rect(x, y, w, h).fill().restore();
};

const strokeRect = (doc, x, y, w, h, color, lw = 0.5) => {
  doc.save().strokeColor(color).lineWidth(lw).rect(x, y, w, h).stroke().restore();
};

const progressBar = (doc, x, y, w, h, pct, barColor, bgColor) => {
  fillRect(doc, x, y, w, h, bgColor, 0.3);
  fillRect(doc, x, y, Math.round(w * (pct / 100)), h, barColor);
};

const kpiCard = (doc, x, y, w, h, title, value, sub, accentColor) => {
  fillRect(doc, x, y, w, h, COLORS.card);
  strokeRect(doc, x, y, w, h, accentColor, 0.6);

  // Left accent stripe
  fillRect(doc, x, y, 3, h, accentColor);

  doc.fillColor(COLORS.textMuted).fontSize(7).font('Helvetica')
     .text(title.toUpperCase(), x + 12, y + 10, { width: w - 16 });
  doc.fillColor(COLORS.textPrimary).fontSize(22).font('Helvetica-Bold')
     .text(value, x + 12, y + 22, { width: w - 16 });
  doc.fillColor(COLORS.textSub).fontSize(7).font('Helvetica')
     .text(sub, x + 12, y + 50, { width: w - 16 });
};

// ─── Draw page background ─────────────────────────────────────────────────────
const drawBackground = (doc) => {
  fillRect(doc, 0, 0, doc.page.width, doc.page.height, COLORS.bg);
};

// ─── Branded Header ──────────────────────────────────────────────────────────
const drawHeader = (doc, title, subTitle, userName, dateStr) => {
  // gradient band
  fillRect(doc, 0, 0, doc.page.width, 80, COLORS.card);
  fillRect(doc, 0, 0, 4, 80, COLORS.primary);

  // Logo text
  doc.fillColor(COLORS.primary).fontSize(14).font('Helvetica-Bold')
     .text('GoalSphere', 24, 20);
  doc.fillColor(COLORS.accent).fontSize(7).font('Helvetica')
     .text('AI-POWERED ENTERPRISE PLATFORM', 24, 36);

  // Report title (right-aligned)
  doc.fillColor(COLORS.textPrimary).fontSize(16).font('Helvetica-Bold')
     .text(title, 0, 18, { align: 'right', width: doc.page.width - 24 });
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica')
     .text(subTitle, 0, 38, { align: 'right', width: doc.page.width - 24 });

  // Divider
  doc.save().strokeColor(COLORS.border).lineWidth(0.5)
     .moveTo(24, 82).lineTo(doc.page.width - 24, 82).stroke().restore();

  // User meta row
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica')
     .text(`Prepared for: `, 24, 92, { continued: true });
  doc.fillColor(COLORS.textPrimary).fontSize(8).font('Helvetica-Bold')
     .text(userName, { continued: true });
  doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica')
     .text(`   |   Generated: ${dateStr}`, { continued: false });
};

// ─── Section label ────────────────────────────────────────────────────────────
const sectionLabel = (doc, label, y) => {
  doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold')
     .text(label.toUpperCase(), 24, y);
  doc.save().strokeColor(COLORS.primary).strokeOpacity(0.25).lineWidth(0.4)
     .moveTo(24, y + 14).lineTo(doc.page.width - 24, y + 14).stroke().restore();
};

// ─── Bar Chart (Native vector) ────────────────────────────────────────────────
const drawBarChart = (doc, x, y, w, h, data, label) => {
  sectionLabel(doc, label, y);
  const chartY = y + 20;
  const chartH = h - 20;
  const barW = Math.floor((w - 20) / data.length) - 8;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  data.forEach((d, i) => {
    const barH = Math.round((d.value / maxVal) * (chartH - 24));
    const bx = x + 10 + i * (barW + 8);
    const by = chartY + chartH - barH - 20;

    const barColor = d.color || COLORS.primary;
    doc.save().fillColor(barColor).fillOpacity(0.9).roundedRect(bx, by, barW, barH, 3).fill().restore();

    // Value label
    doc.fillColor(COLORS.textPrimary).fontSize(8).font('Helvetica-Bold')
       .text(String(d.value), bx, by - 12, { width: barW, align: 'center' });

    // X-axis label
    doc.fillColor(COLORS.textMuted).fontSize(6.5).font('Helvetica')
       .text(d.label, bx, chartY + chartH - 18, { width: barW, align: 'center' });
  });
};

// ─── AI Insight text box ──────────────────────────────────────────────────────
const drawInsightBox = (doc, x, y, w, text) => {
  const padding = 12;
  const textH = doc.heightOfString(text, { width: w - padding * 2, fontSize: 8 }) + 14;
  fillRect(doc, x, y, w, textH + padding, COLORS.card);
  strokeRect(doc, x, y, w, textH + padding, COLORS.accent, 0.5);
  fillRect(doc, x, y, 3, textH + padding, COLORS.accent);

  doc.fillColor(COLORS.accent).fontSize(7).font('Helvetica-Bold')
     .text('AI INTELLIGENCE SUMMARY', x + padding, y + 8);
  doc.fillColor(COLORS.textSub).fontSize(8).font('Helvetica')
     .text(text, x + padding, y + 22, { width: w - padding * 2, lineGap: 3 });
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const drawFooter = (doc) => {
  const y = doc.page.height - 32;
  doc.save().strokeColor(COLORS.border).lineWidth(0.4)
     .moveTo(24, y).lineTo(doc.page.width - 24, y).stroke().restore();
  doc.fillColor(COLORS.textMuted).fontSize(7).font('Helvetica')
     .text('GoalSphere AI  |  Confidential Enterprise Report  |  Powered by Gemini AI', 24, y + 8, {
       align: 'center', width: doc.page.width - 48
     });
};

// ─── MAIN EXPORT FUNCTION ──────────────────────────────────────────────────────
const generatePDFStream = (reportType, data, stream) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, compress: false });
      
      // Pipe directly to the express response or file stream
      doc.pipe(stream);
      
      doc.on('end', () => resolve());
      doc.on('error', reject);

      const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const pageW = doc.page.width;   // 595
      const contentW = pageW - 48;   // 547 (24px margin each side)

      drawBackground(doc);

      // ── EMPLOYEE REPORT ──────────────────────────────────────────────────────
      if (reportType === 'employee') {
        drawHeader(doc, 'Performance Report', 'Individual Employee Q2 Analytics', data.name, dateStr);

        // KPI Cards row
        const cardW = (contentW - 24) / 4;
        const cards = [
          { title: 'Tasks Completed', value: String(data.completedTasks || 0), sub: `of ${data.totalTasks || 0} total`, color: COLORS.emerald },
          { title: 'Completion Rate', value: `${data.completionRate || 0}%`, sub: 'Task output velocity', color: COLORS.primary },
          { title: 'Active Goals', value: String(data.goalsActive || 0), sub: `${data.goalsApproved || 0} approved`, color: COLORS.accent },
          { title: 'Engagement', value: `${data.engagementScore || 85}%`, sub: `Risk: ${data.burnoutRisk || 'Low'}`, color: data.burnoutRisk === 'High' ? COLORS.red : COLORS.amber },
        ];
        cards.forEach((c, i) => kpiCard(doc, 24 + i * (cardW + 8), 116, cardW, 70, c.title, c.value, c.sub, c.color));

        // Bar chart – task breakdown
        drawBarChart(doc, 24, 204, contentW * 0.55, 140, [
          { label: 'Completed', value: data.completedTasks || 0, color: COLORS.emerald },
          { label: 'Pending', value: data.pendingTasks || 0, color: COLORS.amber },
          { label: 'Goals Active', value: data.goalsActive || 0, color: COLORS.primary },
          { label: 'Goals Aprv.', value: data.goalsApproved || 0, color: COLORS.accent },
          { label: 'Leaves', value: data.leavesRequested || 0, color: COLORS.red },
        ], 'Weekly Task & Goal Breakdown');

        // Attendance probability bar
        const probX = 24 + contentW * 0.55 + 16;
        const probW = contentW * 0.45 - 16;
        sectionLabel(doc, 'Attendance Probability', 204);
        doc.fillColor(COLORS.textPrimary).fontSize(28).font('Helvetica-Bold')
           .text(`${data.attendanceProbability || 92}%`, probX, 234);
        doc.fillColor(COLORS.textMuted).fontSize(8).font('Helvetica')
           .text(`Risk Level: ${data.burnoutRisk || 'Low'}`, probX, 272);
        progressBar(doc, probX, 288, probW, 10, data.attendanceProbability || 92, COLORS.emerald, COLORS.border);

        // AI Insight Box
        if (data.summaryText) {
          drawInsightBox(doc, 24, 360, contentW, data.summaryText);
        }

      // ── MANAGER / TEAM REPORT ─────────────────────────────────────────────────
      } else if (reportType === 'team') {
        drawHeader(doc, 'Team Analytics Report', 'Manager Q2 Team Intelligence Overview', data.name, dateStr);

        const cardW = (contentW - 16) / 3;
        const cards = [
          { title: 'Team Size', value: String(data.teamSize || 0), sub: 'Active members', color: COLORS.primary },
          { title: 'Pending Approvals', value: String((data.pendingGoals || 0) + (data.pendingLeaves || 0)), sub: 'Goals + Leave requests', color: COLORS.amber },
          { title: 'Team Goals', value: String(data.totalGoals || 0), sub: `${data.approvedGoals || 0} approved`, color: COLORS.emerald },
        ];
        cards.forEach((c, i) => kpiCard(doc, 24 + i * (cardW + 8), 116, cardW, 70, c.title, c.value, c.sub, c.color));

        drawBarChart(doc, 24, 210, contentW, 140, [
          { label: 'Active Members', value: data.teamSize || 0, color: COLORS.primary },
          { label: 'Total Goals', value: data.totalGoals || 0, color: COLORS.accent },
          { label: 'Approved Goals', value: data.approvedGoals || 0, color: COLORS.emerald },
          { label: 'Pending Goals', value: data.pendingGoals || 0, color: COLORS.amber },
          { label: 'Pending Leaves', value: data.pendingLeaves || 0, color: COLORS.red },
        ], 'Team Performance Distribution');

        if (data.summaryText) {
          drawInsightBox(doc, 24, 370, contentW, data.summaryText);
        }

      // ── HR WORKFORCE REPORT ─────────────────────────────────────────────────
      } else if (reportType === 'hr') {
        drawHeader(doc, 'Workforce Overview Report', 'HR Executive Q2 Analytics Intelligence', data.name, dateStr);

        const cardW = (contentW - 24) / 4;
        const cards = [
          { title: 'Total Employees', value: String(data.totalEmployees || 0), sub: 'Incl. managers', color: COLORS.primary },
          { title: 'Goals Submitted', value: String(data.goalsSubmitted || 0), sub: `${data.approvalRate || '0%'} approved`, color: COLORS.emerald },
          { title: 'Active Leaves', value: String(data.activeLeaves || 0), sub: 'Approved this cycle', color: COLORS.amber },
          { title: 'Workforce Risk', value: `${data.highRiskCount || 0}`, sub: 'High burnout employees', color: COLORS.red },
        ];
        cards.forEach((c, i) => kpiCard(doc, 24 + i * (cardW + 8), 116, cardW, 70, c.title, c.value, c.sub, c.color));

        drawBarChart(doc, 24, 210, contentW, 140, [
          { label: 'Total Emp.', value: data.totalEmployees || 0, color: COLORS.primary },
          { label: 'Goals Sub.', value: data.goalsSubmitted || 0, color: COLORS.accent },
          { label: 'Leaves Active', value: data.activeLeaves || 0, color: COLORS.amber },
          { label: 'High Risk', value: data.highRiskCount || 0, color: COLORS.red },
          { label: 'Managers', value: data.totalManagers || 0, color: COLORS.emerald },
        ], 'Workforce Analytics Snapshot');

        if (data.summaryText) {
          drawInsightBox(doc, 24, 370, contentW, data.summaryText);
        }
      }

      drawFooter(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePDFStream };
