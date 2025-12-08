import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ListIcon from '@mui/icons-material/List';
import moderatorAPI from '../../../api/moderator.api';
import './QuestionList.css';

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
  const [bloomData, setBloomData] = useState([]);

  const searchParams = new URLSearchParams(location.search);
  const moderationId = searchParams.get('moderationId');
  const paperId = searchParams.get('paperId');

  // Bloom's Taxonomy color scheme
  const BLOOM_COLORS = {
    'L1': '#FF6B6B', // Remember
    'L2': '#4ECDC4', // Understand
    'L3': '#45B7D1', // Apply
    'L4': '#96CEB4', // Analyze
    'L5': '#FFEAA7', // Evaluate
    'L6': '#DDA0DD', // Create
    'UNKNOWN': '#CCCCCC' // Unknown/Not assigned
  };

  // Bloom's Taxonomy labels
  const BLOOM_LABELS = {
    'L1': 'Remember',
    'L2': 'Understand',
    'L3': 'Apply',
    'L4': 'Analyze',
    'L5': 'Evaluate',
    'L6': 'Create',
    'UNKNOWN': 'Not Assigned'
  };

  useEffect(() => {
    loadData();
  }, [moderationId, paperId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (paperId) {
        const [questionRes, paperRes] = await Promise.all([
          moderatorAPI.getQuestionReport(paperId),
          moderatorAPI.getPaperReport(paperId)
        ]);
        
        setQuestionReport(questionRes.data || []);
        setPaperData(paperRes.data || {});
      } else if (moderationId) {
        const moderationRes = await moderatorAPI.getModerationDetails(moderationId);
        const moderation = moderationRes.data;
        
        if (moderation?.paper_id) {
          const [questionRes, paperRes] = await Promise.all([
            moderatorAPI.getQuestionReport(moderation.paper_id),
            moderatorAPI.getPaperReport(moderation.paper_id)
          ]);
          
          setQuestionReport(questionRes.data || []);
          setPaperData({ ...paperRes.data, ...moderation });
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

  // Calculate Bloom's Taxonomy distribution
  useEffect(() => {
    if (questionReport && questionReport.length > 0) {
      const bloomDistribution = {};
      
      // Initialize all levels
      Object.keys(BLOOM_LABELS).forEach(level => {
        bloomDistribution[level] = { count: 0, marks: 0, questions: [] };
      });

      // Count questions by bloom level
      questionReport.forEach(question => {
        if (question.bloom_level) {
          const level = question.bloom_level.toUpperCase();
          if (bloomDistribution[level]) {
            bloomDistribution[level].count++;
            bloomDistribution[level].marks += (question.marks || 0);
            bloomDistribution[level].questions.push(question);
          }
        } else {
          // Handle questions without bloom level
          bloomDistribution['UNKNOWN'].count++;
          bloomDistribution['UNKNOWN'].marks += (question.marks || 0);
          bloomDistribution['UNKNOWN'].questions.push(question);
        }
      });

      // Convert to array for pie chart
      const chartData = Object.keys(bloomDistribution)
        .filter(level => bloomDistribution[level].count > 0)
        .map(level => {
          const data = bloomDistribution[level];
          const label = BLOOM_LABELS[level] || 'Unknown';
          return {
            id: level,
            value: data.count,
            label: `${level}: ${label}`,
            color: BLOOM_COLORS[level] || '#CCCCCC',
            marks: data.marks,
            questions: data.questions,
            percentage: (data.count / questionReport.length * 100).toFixed(1)
          };
        });

      setBloomData(chartData);
    }
  }, [questionReport]);

  const hasQuestions = Array.isArray(questionReport) && questionReport.length > 0;
  
  const sortedQuestions = [...questionReport].sort((a, b) => 
    (a.sequence_number || 0) - (b.sequence_number || 0)
  );

  // Calculate statistics
  const bloomStats = useMemo(() => {
    const totalQuestions = sortedQuestions.length;
    const questionsWithBloom = sortedQuestions.filter(q => q.bloom_level).length;
    const percentageWithBloom = totalQuestions > 0 ? 
      Math.round((questionsWithBloom / totalQuestions) * 100) : 0;
    
    const totalMarks = sortedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const marksWithBloom = sortedQuestions
      .filter(q => q.bloom_level)
      .reduce((sum, q) => sum + (q.marks || 0), 0);
    
    return {
      totalQuestions,
      questionsWithBloom,
      percentageWithBloom,
      totalMarks,
      marksWithBloom,
      marksPercentageWithBloom: totalMarks > 0 ? 
        Math.round((marksWithBloom / totalMarks) * 100) : 0
    };
  }, [sortedQuestions]);

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

  // Function to create conic gradient for pie chart
  const getPieChartStyle = () => {
    if (bloomData.length === 0) return {};
    
    let accumulatedPercentage = 0;
    const gradients = bloomData.map(item => {
      const start = accumulatedPercentage + '%';
      accumulatedPercentage += parseFloat(item.percentage);
      const end = accumulatedPercentage + '%';
      return `${item.color} ${start} ${end}`;
    }).join(', ');
    
    return {
      background: `conic-gradient(${gradients})`
    };
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

      {/* Bloom's Taxonomy Analysis Section */}
      <Paper className="bloom-analysis-section" elevation={2}>
        <Typography variant="h5" gutterBottom align="center">
          Bloom's Taxonomy Analysis
        </Typography>
        
        <Grid container spacing={3} className="bloom-container">
          <Grid item xs={12} md={6} className="bloom-chart-container">
            {bloomData.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Box sx={{ position: 'relative', width: 250, height: 250, mb: 3 }}>
                  {/* CSS-only Pie Chart */}
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%',
                      ...getPieChartStyle(),
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Center hole */}
                    <Box 
                      sx={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {bloomStats.totalQuestions}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Total Questions
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                {/* Legend */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1, mb: 2 }}>
                  {bloomData.map((item) => (
                    <Box 
                      key={item.id}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: 'rgba(255,255,255,0.8)'
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: item.color 
                        }} 
                      />
                      <Typography variant="caption">
                        {item.label} ({item.value})
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box className="no-bloom-data">
                <Typography variant="body1" paragraph align="center">
                  No Bloom's Taxonomy data available for this paper.
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Please ensure questions are tagged with Bloom's levels.
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={6} className="bloom-stats-container">
            <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              
              <Grid container spacing={2} className="bloom-stats-grid">
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Total Questions
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {bloomStats.totalQuestions}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        With Bloom Level
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {bloomStats.questionsWithBloom}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ({bloomStats.percentageWithBloom}%)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Total Marks
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {bloomStats.totalMarks}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={6}>
                  <Card variant="outlined">
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Marks with Bloom
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {bloomStats.marksWithBloom}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ({bloomStats.marksPercentageWithBloom}%)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Bloom's Taxonomy Levels:
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Level</TableCell>
                        <TableCell align="right">Questions</TableCell>
                        <TableCell align="right">Marks</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bloomData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: item.color
                                }}
                              />
                              <Typography variant="body2">
                                {item.label.split(': ')[1]}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {item.value}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {item.marks}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="textSecondary">
                              {item.percentage}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

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
            {isGeneratingPdf ? 'Generating PDF...' : 'Generate Question Paper PDF'}
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