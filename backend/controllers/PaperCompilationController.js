// backend/controllers/PaperCompilationController.js
import { QuestionPaper } from '../models/QuestionPaper.js';
import { Question } from '../models/Question.js';
import puppeteer from 'puppeteer';

export const paperCompilationController = {

  // GET /api/papers/:paperId/template
  getPaperTemplate: async (req, res) => {
    try {
      const { paperId } = req.params;
      
      // Get paper details
      const papers = await QuestionPaper.getAll(100, 0); // Get all papers
      const paper = papers.find(p => p.paper_id == paperId);
      
      if (!paper) {
        return res.status(404).json({ error: 'Paper not found' });
      }

      // Get questions for this paper
      const questions = await Question.getByPaperId(paperId);
      
      // Get complete question details with options
      const questionsWithDetails = await Promise.all(
        questions.map(async (q) => {
          const fullQuestion = await Question.getById(q.question_id);
          return fullQuestion;
        })
      );

      // Generate HTML template
      const htmlTemplate = generateHTMLTemplate({
        ...paper,
        questions: questionsWithDetails
      });
      
      res.json({ 
        success: true, 
        html: htmlTemplate,
        paper: paper 
      });
      
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ error: 'Failed to generate template' });
    }
  },

  // POST /api/papers/:paperId/generate-pdf
  generatePDF: async (req, res) => {
    let browser;
    try {
      const { paperId } = req.params;
      const { html } = req.body;

      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Set the HTML content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="paper-${paperId}.pdf"`);
      
      res.send(pdfBuffer);

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },

  // POST /api/papers/:paperId/submit
  submitForModeration: async (req, res) => {
    try {
      const { paperId } = req.params;
      const { html } = req.body;
      const userId = req.user.id;

      // Update paper status to 'submitted' using existing model
      const updatedPaper = await QuestionPaper.update(paperId, {
        status: 'submitted'
      });

      res.json({ 
        success: true, 
        message: 'Paper submitted for moderation',
        paper: updatedPaper
      });

    } catch (error) {
      console.error('Submission error:', error);
      res.status(500).json({ error: 'Failed to submit paper' });
    }
  }

};

// HTML template generation function
function generateHTMLTemplate(paper) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'Times New Roman', serif; 
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .paper-header { 
      text-align: center; 
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .department-line { font-size: 14px; margin-bottom: 5px; }
    .university-info h1 { 
      margin: 5px 0; 
      font-size: 24px;
      text-transform: uppercase;
    }
    .university-info h2 { 
      margin: 5px 0; 
      font-size: 18px;
      font-weight: normal;
    }
    .university-info h3 { 
      margin: 5px 0; 
      font-size: 16px;
      font-weight: bold;
    }
    .paper-details-simple { 
      margin-top: 10px;
      font-size: 14px;
    }
    .questions-section { margin-top: 30px; }
    .question-item { margin: 20px 0; }
    .question-header { margin-bottom: 8px; }
    .question-number { font-weight: bold; }
    .question-marks { 
      font-weight: bold; 
      margin-left: 10px;
      font-size: 14px;
    }
    .question-content { margin: 10px 0; }
    .mcq-options { margin-left: 20px; margin-top: 10px; }
    .option { margin: 3px 0; }
    .option-label { font-weight: bold; margin-right: 8px; }
    .answer-space { 
      margin-top: 15px; 
      border-top: 1px dashed #ccc;
      padding-top: 10px;
    }
    .answer-line { 
      border-bottom: 1px solid #ccc; 
      margin: 8px 0;
      height: 20px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="paper-header">
    <div class="department-line">
      <strong>TU/${paper.course_code?.split(' ')[0] || 'CSE'}</strong>
    </div>
    
    <div class="university-info">
      <h1>TEZPUR UNIVERSITY</h1>
      <h2>${paper.exam_type || 'End Term Examination'}, ${paper.academic_year || '2024'}</h2>
      <h3>${paper.course_code}: ${paper.course_title}</h3>
    </div>

    <div class="paper-details-simple">
      <div class="detail-item">
        <strong>Full marks: ${paper.full_marks || '60'}</strong> 
        <strong>Time: ${paper.duration ? `${paper.duration} mins` : '100 mins'}</strong>
      </div>
    </div>
  </div>

  <div class="questions-section">
    ${paper.questions && paper.questions.length > 0 ? paper.questions.map((question, index) => `
      <div class="question-item">
        <div class="question-header">
          <span class="question-number">${index + 1}.</span>
          ${question.marks ? `<span class="question-marks">[${question.marks}]</span>` : ''}
        </div>
        
        <div class="question-content">
          ${question.content || ''}
        </div>
        
        ${question.question_type === 'mcq' && question.options ? `
          <div class="mcq-options">
            ${question.options.map((option, optIndex) => `
              <div class="option">
                <span class="option-label">(${String.fromCharCode(97 + optIndex)})</span>
                <span class="option-text">${option.option_text}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${(question.question_type === 'subjective' || !question.question_type) ? `
          <div class="answer-space">
            <div class="answer-lines">
              ${Array.from({ length: 6 }, (_, i) => `<div class="answer-line"></div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `).join('') : `
      <div class="question-item">
        <div class="question-header">
          <span class="question-number">1.</span>
        </div>
        <div class="question-content">
          No questions added yet. Start adding questions to see them here.
        </div>
      </div>
    `}
  </div>
</body>
</html>`;
}