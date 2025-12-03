import PDFGenerationService from './PDFGenerationService.js';

class ModerationReportPdfService {
  constructor(config = {}) {
    this.pdfService = new PDFGenerationService(config);
  }

  generateModerationReport(moderationData, paperData) {
    const html = this.buildReportHtml(moderationData, paperData);
    
    return this.pdfService.generatePdf({
      html,
      pdfOptions: {
        pageSize: 'A4',
        margins: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      }
    });
  }

  buildReportHtml(moderationData, paperData) {
    const {
      semester = '',
      course_code = '',
      course_title = '',
      academic_year = ''
    } = paperData;

    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    const criteria = this.getModerationCriteria(moderationData);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.3;
      margin: 0;
      padding: 0;
      color: #000;
    }
    .container {
      padding: 0 5mm;
    }
    .header {
      text-align: center;
      margin-bottom: 8mm;
    }
    .school {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    .university {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 1mm;
    }
    .department {
      font-size: 11pt;
      margin-bottom: 4mm;
    }
    .separator {
      border-top: 2px solid #000;
      margin: 4mm 0;
    }
    .report-title {
      text-align: center;
      font-size: 14pt;
      font-weight: bold;
      margin: 6mm 0;
      text-decoration: underline;
    }
    .paper-info {
      margin: 4mm 0;
      font-size: 11pt;
    }
    .info-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2mm 4mm;
      margin-bottom: 6mm;
    }
    .info-label {
      font-weight: bold;
    }
    .criteria-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4mm;
      border: 1px solid #000;
    }
    .criteria-table td {
      border: 1px solid #000;
      padding: 3mm;
      vertical-align: top;
    }
    .col-number {
      width: 8%;
      text-align: center;
      font-weight: bold;
    }
    .col-question {
      width: 67%;
      font-weight: bold;
    }
    .col-answer {
      width: 25%;
      text-align: center;
      font-weight: bold;
    }
    .comment-cell {
      border-left: none;
      border-right: none;
      padding-top: 1mm;
      padding-bottom: 3mm;
      font-style: italic;
    }
    .comment-text {
      color: #333;
      margin-top: 1mm;
      font-weight: normal;
    }
    .yes-no {
      font-weight: bold;
    }
    .moderator-section {
      margin-top: 12mm;
    }
    .moderator-title {
      font-weight: bold;
      margin-bottom: 4mm;
    }
    .moderator-list {
      margin-left: 10mm;
      margin-bottom: 8mm;
    }
    .hod-signature {
      text-align: right;
      margin-top: 20mm;
      font-weight: bold;
    }
    .empty-row {
      height: 8mm;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="school">SCHOOL OF ENGINEERING</div>
      <div class="university">TEZPUR UNIVERSITY</div>
      <div class="department">DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING</div>
    </div>

    <div class="separator"></div>

    <div class="report-title">MODERATION REPORT</div>

    <div class="info-grid">
      <div class="info-label">Semester:</div>
      <div>${semester}</div>
      
      <div class="info-label">Course Name:</div>
      <div>${course_title}</div>
      
      <div class="info-label">Course Code:</div>
      <div>${course_code}</div>
      
      <div class="info-label">Date:</div>
      <div>${currentDate}</div>
      
      <div class="info-label">Time:</div>
      <div>${currentTime}</div>
    </div>

    <table class="criteria-table">
      ${criteria}
    </table>

    <!-- Moderator Names Section -->
    <div class="moderator-section">
      <div class="moderator-title">Name of Moderator(s):</div>
      <div class="moderator-list">
        1. ${moderationData.moderator_name || 'Moderator Name'}<br>
        2.<br>
        3.
      </div>
    </div>

    <!-- HoD Signature -->
    <div class="hod-signature">
      Signature of HoD
    </div>
  </div>
</body>
</html>`;
  }

  getModerationCriteria(moderationData) {
    const criteria = [
      {
        number: 1,
        question: "Whether the question paper is set as per the COs?",
        field: 'questions_set_per_co',
        commentField: 'questions_set_per_co_comment'
      },
      {
        number: 2,
        question: "Does the question paper meet the standard of the level of the students?",
        field: 'meets_level_standard', 
        commentField: 'meets_level_standard_comment'
      },
      {
        number: 3,
        question: "Does the question paper covers the syllabus specified for the exam?",
        field: 'covers_syllabus',
        commentField: 'covers_syllabus_comment'
      },
      {
        number: 4, 
        question: "Whether the question paper is technically accurate?",
        field: 'technically_accurate',
        commentField: 'technically_accurate_comment'
      },
      {
        number: 5,
        question: "Whether the question paper is edited and formatted accurately?",
        field: 'edited_formatted_accurately',
        commentField: 'edited_formatted_comment'
      },
      {
        number: 6,
        question: "Whether the question paper is linguistically accurate?",
        field: 'linguistically_accurate',
        commentField: 'linguistically_accurate_comment'
      },
      {
        number: 7,
        question: "Whether any question is verbatim copy from any of the question papers of the course of last two years?",
        field: 'verbatim_copy_check',
        commentField: 'verbatim_copy_comment'
      }
    ];

    let html = '';
    
    criteria.forEach(criterion => {
      const value = moderationData[criterion.field];
      const comment = moderationData[criterion.commentField];
      const answer = value === true ? 'Yes' : value === false ? 'No' : 'Not Evaluated';
      
      // Main criteria row
      html += `
      <tr>
        <td class="col-number">${criterion.number}</td>
        <td class="col-question">${criterion.question}</td>
        <td class="col-answer yes-no">${answer}</td>
      </tr>`;
      
      // Comment row - now properly inside the table with empty first and last columns
      html += `
      <tr>
        <td class="col-number"></td>
        <td class="comment-cell">
          Comments of the moderator if any:
          ${comment && comment !== 'N/A' && comment !== '' ? 
            `<div class="comment-text">${comment}</div>` : 
            '<div class="empty-row"></div>'
          }
        </td>
        <td class="col-answer"></td>
      </tr>`;
    });

    return html;
  }
}

export default ModerationReportPdfService;