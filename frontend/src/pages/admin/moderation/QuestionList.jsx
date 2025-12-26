import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  CircularProgress,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ListIcon from '@mui/icons-material/List';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import moderatorAPI from '../../../api/moderator.api';
import questionPaperAPI from '../../../api/questionPaper.api';
import './QuestionList.css';

// Import the BloomsAnalysis component
import BloomsAnalysis from './BloomsAnalysis';

const QuestionList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [questionReport, setQuestionReport] = useState([]);
  const [paperData, setPaperData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState({ type: '', text: '' });
  const [showCO, setShowCO] = useState(true);
  const [showBloomsAnalysis, setShowBloomsAnalysis] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const moderationId = searchParams.get('moderationId');
  const paperId = searchParams.get('paperId');

  useEffect(() => {
    loadData();
  }, [moderationId, paperId]);
  const getFullPaperData = async (paperId) => {
  try {
    const papersRes = await questionPaperAPI.getAll();
    
    const normalizeArrayResponse = (resp) => {
      if (!resp) return [];
      if (Array.isArray(resp)) return resp;
      if (Array.isArray(resp.data)) return resp.data;
      if (Array.isArray(resp.rows)) return resp.rows;
      if (Array.isArray(resp.questions)) return resp.questions;
      const arr = Object.values(resp).find(v => Array.isArray(v));
      return arr || [];
    };
    
    const papersArray = normalizeArrayResponse(papersRes);
    return papersArray.find(p => String(p.paper_id) === String(paperId));
  } catch (error) {
    console.error('Error getting full paper data:', error);
    return null;
  }
};
  const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    if (paperId) {
      // Get questions from moderator API (your preferred route)
      const questionRes = await moderatorAPI.getQuestionReport(paperId);
      
      // Get FULL paper data from questionPaperAPI (same as PaperQuestionsManager)
      const papersRes = await questionPaperAPI.getAll();
      
      // Find the specific paper (copy helper from PaperQuestionsManager)
      const normalizeArrayResponse = (resp) => {
        if (!resp) return [];
        if (Array.isArray(resp)) return resp;
        if (Array.isArray(resp.data)) return resp.data;
        if (Array.isArray(resp.rows)) return resp.rows;
        if (Array.isArray(resp.questions)) return resp.questions;
        const arr = Object.values(resp).find(v => Array.isArray(v));
        return arr || [];
      };
      
      const papersArray = normalizeArrayResponse(papersRes);
      const fullPaperData = papersArray.find(p => String(p.paper_id) === String(paperId));
      
      if (!fullPaperData) {
        throw new Error('Paper not found');
      }
      
      // ALSO get the moderator report for moderation data
      const paperReportRes = await moderatorAPI.getPaperReport(paperId);
      const moderationData = paperReportRes.data?.data?.moderation || null;
      
      console.log('✅ Full paper data with headers:', {
        semester: fullPaperData.semester,
        exam_type: fullPaperData.exam_type,
        academic_year: fullPaperData.academic_year,
        full_marks: fullPaperData.full_marks,
        duration: fullPaperData.duration
      });
      
      // Combine: Use full paper data + moderation data
      setQuestionReport(questionRes.data || []);
      setPaperData({ 
        paper: fullPaperData, // This has all header fields!
        moderation: moderationData,
        counts: paperReportRes.data?.data?.counts || {},
        questions: paperReportRes.data?.data?.questions || []
      });
      
    } else if (moderationId) {
      // Similar logic for moderation flow
      const moderationRes = await moderatorAPI.getModerationDetails(moderationId);
      const moderation = moderationRes.data;
      
      if (moderation?.paper_id) {
        const questionRes = await moderatorAPI.getQuestionReport(moderation.paper_id);
        
        // Get FULL paper data
        const papersRes = await questionPaperAPI.getAll();
        const normalizeArrayResponse = (resp) => {
          if (!resp) return [];
          if (Array.isArray(resp)) return resp;
          if (Array.isArray(resp.data)) return resp.data;
          if (Array.isArray(resp.rows)) return resp.rows;
          if (Array.isArray(resp.questions)) return resp.questions;
          const arr = Object.values(resp).find(v => Array.isArray(v));
          return arr || [];
        };
        
        const papersArray = normalizeArrayResponse(papersRes);
        const fullPaperData = papersArray.find(p => String(p.paper_id) === String(moderation.paper_id));
        
        if (!fullPaperData) {
          throw new Error('Paper not found');
        }
        
        const paperReportRes = await moderatorAPI.getPaperReport(moderation.paper_id);
        
        setQuestionReport(questionRes.data || []);
        setPaperData({ 
          paper: fullPaperData,
          moderation: moderation,
          counts: paperReportRes.data?.data?.counts || {},
          questions: paperReportRes.data?.data?.questions || []
        });
        
      } else {
        throw new Error('Paper ID not found in moderation record');
      }
    } else {
      throw new Error('No moderation or paper ID provided');
    }
  } catch (error) {
    console.error('Error loading question data:', error);
    setError(error.message || 'Failed to load question data');
  } finally {
    setLoading(false);
  }
};

  const hasQuestions = Array.isArray(questionReport) && questionReport.length > 0;
  
  const sortedQuestions = [...questionReport].sort((a, b) => 
    (a.sequence_number || 0) - (b.sequence_number || 0)
  );

  const handleGeneratePdf = async () => {
    if (!paperData?.paper?.paper_id) {
      setPdfMessage({ type: 'error', text: 'Paper ID not found' });
      return;
    }

    if (paperData.paper.status !== 'approved') {
      setPdfMessage({ 
        type: 'error', 
        text: `Cannot generate PDF. Paper status is "${paperData.paper.status}". Only approved papers can be downloaded.` 
      });
      return;
    }

    setIsGeneratingPdf(true);
    setPdfMessage({ type: '', text: '' });

    try {
      const pdfBlob = await moderatorAPI.generatePdf({
        paperId: paperData.paper.paper_id,
        baseUrl: process.env.REACT_APP_BASE_URL || window.location.origin,
        postOptions: {
          addPageNumbers: true,
          pageNumberOptions: { fontSize: 10, marginBottom: 18 },
        },
        filename: `${paperData.paper.course_code || 'paper'}-${paperData.paper.title || 'questions'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_')
      });

      moderatorAPI.downloadPdf(
        pdfBlob, 
        `${paperData.paper.course_code || 'paper'}-${paperData.paper.title || 'questions'}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_')
      );

      setPdfMessage({ type: 'success', text: 'PDF generated and downloaded successfully!' });
    } catch (error) {
      console.error('PDF generation error:', error);
      setPdfMessage({ 
        type: 'error', 
        text: error.message || 'Failed to generate PDF. Please try again.' 
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatHeaderData = () => {
    const paper = paperData?.paper || {};
    const institution = 'TEZPUR UNIVERSITY';
    const semester = paper.semester || '';
    const examType = paper.exam_type || '';
    const academicYear = paper.academic_year || '';
    const course = paper.course_code && paper.course_title 
      ? `${paper.course_code}: ${paper.course_title}`
      : '';
    const fullMarks = paper.full_marks || '';
    const duration = paper.duration ? `${paper.duration} mins` : '';

    return {
      institution,
      semester,
      examType,
      academicYear,
      course,
      fullMarks,
      duration
    };
  };

  const headerData = formatHeaderData();
  const hasCOData = sortedQuestions.some(question => question.co_number);
  const isPaperApproved = paperData?.paper?.status === 'approved';

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'change_requested': return 'warning';
      case 'under_review': return 'info';
      case 'draft': return 'default';
      case 'submitted': return 'secondary';
      default: return 'default';
    }
  };

  const toggleBloomsAnalysis = () => {
    setShowBloomsAnalysis(!showBloomsAnalysis);
  };

  if (loading) {
    return (
      <Box className="question-list">
        <Box className="page-header">
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/moderation/list')} 
            variant="outlined"
          >
            Back to List
          </Button>
          <Typography variant="h4" component="h1">
            Question Analysis
          </Typography>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="question-list">
        <Box className="page-header">
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/moderation/list')} 
            variant="outlined"
          >
            Back to List
          </Button>
          <Typography variant="h4" component="h1">
            Question Analysis
          </Typography>
        </Box>
        <Box className="error-message">
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box className="action-buttons">
            <Button onClick={loadData} variant="contained" color="primary">
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/admin/moderation/list')} 
              variant="outlined"
            >
              Browse Moderation List
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!hasQuestions) {
    return (
      <Box className="question-list">
        <Box className="page-header">
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/moderation/list')} 
            variant="outlined"
          >
            Back to List
          </Button>
          <Box className="header-right">
            {moderationId && (
              <Button 
                startIcon={<VisibilityIcon />}
                onClick={() => navigate(`/admin/moderation/report?moderationId=${moderationId}`)}
                variant="contained"
                color="primary"
              >
                View Report
              </Button>
            )}
            <Button 
              startIcon={<ListIcon />}
              onClick={() => navigate('/admin/moderation/list')}
              variant="outlined"
            >
              View All
            </Button>
          </Box>
        </Box>
        <Box className="no-data">
          <Typography variant="h5" gutterBottom>
            No Questions Found
          </Typography>
          <Typography variant="body1" paragraph>
            No questions found for this paper.
          </Typography>
          <Box className="action-buttons">
            <Button onClick={loadData} variant="contained" color="primary">
              Reload
            </Button>
            <Button 
              onClick={() => navigate('/admin/moderation/list')} 
              variant="outlined"
            >
              Back to List
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="question-list">
      <Box className="page-header">
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin/moderation/list')} 
          variant="outlined"
        >
          Back to List
        </Button>
        <Typography variant="h4" component="h1">
          Question Analysis
        </Typography>
        <Box className="header-right">
          {moderationId && (
            <Button 
              startIcon={<VisibilityIcon />}
              onClick={() => navigate(`/admin/moderation/report?moderationId=${moderationId}`)}
              variant="contained"
              color="primary"
            >
              View Report
            </Button>
          )}
          <Button
            startIcon={<AnalyticsIcon />}
            onClick={toggleBloomsAnalysis}
            variant={showBloomsAnalysis ? "contained" : "outlined"}
            color="secondary"
            className="blooms-toggle-btn"
          >
            {showBloomsAnalysis ? 'Hide' : 'Show'} Blooms
          </Button>
        </Box>
      </Box>

      {paperData?.paper && (
        <Paper className="paper-info-card" elevation={2}>
          <Typography variant="h5" gutterBottom>
            Question Paper Analysis
          </Typography>
          <Grid container spacing={2} className="info-grid">
            {paperData.paper.paper_title && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Paper Title:
                </Typography>
                <Typography variant="body1">
                  {paperData.paper.paper_title}
                </Typography>
              </Grid>
            )}
            {paperData.paper.course_code && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Course:
                </Typography>
                <Typography variant="body1">
                  {paperData.paper.course_code} - {paperData.paper.course_title || 'N/A'}
                </Typography>
              </Grid>
            )}
            {paperData.paper.semester && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Semester:
                </Typography>
                <Typography variant="body1">
                  {paperData.paper.semester}
                </Typography>
              </Grid>
            )}
            {paperData.paper.exam_type && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Exam Type:
                </Typography>
                <Typography variant="body1">
                  {paperData.paper.exam_type}
                </Typography>
              </Grid>
            )}
            {paperData.paper.status && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="textSecondary">
                  Status:
                </Typography>
                <Chip 
                  label={paperData.paper.status}
                  color={getStatusColor(paperData.paper.status)}
                  size="small"
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Blooms Analysis Component (conditionally rendered) */}
      {showBloomsAnalysis && (
        <BloomsAnalysis questionReport={questionReport} />
      )}

      <Box className="print-controls">
        <Box className="controls-left">
          <Button 
            startIcon={<PictureAsPdfIcon />}
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || !isPaperApproved}
            variant="contained"
            color="primary"
            size="large"
          >
            {isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF'}
            {!isPaperApproved && ' (Approved Only)'}
          </Button>
          
          {paperData?.paper?.status && (
            <Chip 
              label={`Status: ${paperData.paper.status}`}
              color={getStatusColor(paperData.paper.status)}
              size="medium"
              className="paper-status"
            />
          )}
        </Box>
        
        <Box className="controls-right">
          {hasCOData && (
            <FormControlLabel
              control={
                <Switch
                  checked={showCO}
                  onChange={(e) => setShowCO(e.target.checked)}
                  color="primary"
                />
              }
              label="Show Course Outcomes"
              className="co-toggle"
            />
          )}
          
          <Typography variant="body1" className="question-count">
            {sortedQuestions.length} question{sortedQuestions.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {pdfMessage.text && (
        <Alert 
          severity={pdfMessage.type === 'success' ? 'success' : 'error'}
          className={`pdf-message ${pdfMessage.type}`}
          sx={{ mb: 2 }}
        >
          {pdfMessage.text}
        </Alert>
      )}

      <Box className="print-preview-wrapper">
        <Paper className="print-preview-page" elevation={3}>
          <Box className="print-preview-header">
            <Typography variant="h6" className="header-line1">
              {headerData.institution}
            </Typography>
            <Typography variant="subtitle1" className="header-line2">
              {headerData.semester} {headerData.examType}, {headerData.academicYear}
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold" className="header-line3">
              {headerData.course}
            </Typography>
            
            <Box className="marks-time-line">
              <Typography variant="body2" className="full-marks">
                Full mark : {headerData.fullMarks}
              </Typography>
              <Typography variant="body2" className="time">
                Time: {headerData.duration}
              </Typography>
            </Box>
          </Box>

          <Box className="print-preview-body">
            {sortedQuestions.map((question, index) => (
              <Box key={question.question_id} className="print-preview-question" sx={{ mb: 2 }}>
                <Box className="question-number-content">
                  <Typography fontWeight="bold" className="question-number">
                    {question.sequence_number || index + 1}.
                  </Typography>
                  <Box 
                    className="question-content" 
                    dangerouslySetInnerHTML={{ 
                      __html: question.content_html || question.content_preview || 'No content available' 
                    }} 
                  />
                  {question.marks !== null && question.marks !== undefined && (
                    <Typography fontWeight="bold" className="question-marks-right">
                      [{question.marks}]
                    </Typography>
                  )}
                </Box>
                {showCO && question.co_number && (
                  <Chip 
                    label={
                      <>
                        Course Outcome: CO{question.co_number}
                        {question.bloom_level && ` (Bloom's: ${question.bloom_level})`}
                      </>
                    }
                    size="small"
                    color="primary"
                    variant="outlined"
                    className="question-co"
                  />
                )}
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default QuestionList;