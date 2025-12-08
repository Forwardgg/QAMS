import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AuthContext } from '../../../components/AuthProvider';
import moderatorAPI from '../../../api/moderator.api';
import './QuestionModeration.css';

// Import MUI components for Bloom's analysis
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';

const QuestionModeration = ({ paperId, onBack, onContinue }) => {
  const auth = useContext(AuthContext);
  
  const [paper, setPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [bloomData, setBloomData] = useState([]);

  useEffect(() => {
    if (paperId) {
      loadPaperDetails();
    }
  }, [paperId]);

  // Helper functions for Bloom's analysis
  const getBloomColor = (level) => {
    const colors = {
      'L1': '#FF6B6B', // Remember
      'L2': '#4ECDC4', // Understand
      'L3': '#45B7D1', // Apply
      'L4': '#96CEB4', // Analyze
      'L5': '#FFEAA7', // Evaluate
      'L6': '#DDA0DD'  // Create
    };
    return colors[level] || '#CCCCCC';
  };

  const getBloomLabel = (level) => {
    const labels = {
      'L1': 'Remember',
      'L2': 'Understand',
      'L3': 'Apply',
      'L4': 'Analyze',
      'L5': 'Evaluate',
      'L6': 'Create'
    };
    return labels[level] || 'Unknown';
  };

  const loadPaperDetails = async () => {
    setLoading(true);
    try {
      const response = await moderatorAPI.getPaperDetails(paperId);
      const data = response.data;
      
      setPaper(data.paper);
      
      // Check if main response has CO data
      const hasCO = data.questions?.some(q => q.co_number || q.co_id);
      console.log('Has CO data in main response?', hasCO);
      
      if (hasCO) {
        // Use CO data from main response
        setQuestions(data.questions || []);
      } else {
        // Try to get CO data from breakdown
        try {
          const coResponse = await moderatorAPI.getCOBreakdown(paperId);
          console.log('CO Breakdown response:', coResponse);
          
          if (coResponse.success && coResponse.data) {
            // Create a mapping of question_id to CO data
            const questionToCOMap = {};
            coResponse.data.forEach(co => {
              if (co.questions) {
                co.questions.forEach(q => {
                  questionToCOMap[q.question_id] = {
                    co_number: co.co_number,
                    co_description: co.co_description,
                    bloom_level: co.bloom_level // Add Bloom's level from CO
                  };
                });
              }
            });
            
            // Map CO data to questions
            const questionsWithCO = data.questions.map(question => {
              const coData = questionToCOMap[question.question_id];
              return coData ? { ...question, ...coData } : question;
            });
            
            console.log('Questions with CO mapped:', questionsWithCO);
            setQuestions(questionsWithCO);
          } else {
            setQuestions(data.questions || []);
          }
        } catch (coError) {
          console.log('CO breakdown failed, using questions without CO data');
          setQuestions(data.questions || []);
        }
      }
    } catch (error) {
      console.error('Failed to load paper details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Bloom's Taxonomy distribution
  useEffect(() => {
    if (questions && questions.length > 0) {
      const bloomDistribution = {};
      
      // Initialize all levels
      ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].forEach(level => {
        bloomDistribution[level] = { count: 0, marks: 0, questions: [] };
      });

      // Count questions by bloom level
      questions.forEach(question => {
        if (question.bloom_level) {
          const level = question.bloom_level.toUpperCase();
          if (bloomDistribution[level]) {
            bloomDistribution[level].count++;
            bloomDistribution[level].marks += (question.marks || 0);
            bloomDistribution[level].questions.push(question);
          }
        }
      });

      // Convert to array
      const chartData = Object.keys(bloomDistribution)
        .filter(level => bloomDistribution[level].count > 0)
        .map(level => {
          const data = bloomDistribution[level];
          return {
            id: level,
            value: data.count,
            label: getBloomLabel(level),
            color: getBloomColor(level),
            marks: data.marks,
            percentage: (data.count / questions.length * 100).toFixed(1)
          };
        });

      setBloomData(chartData);
    }
  }, [questions]);

  const handleQuestionStatusChange = async (questionId, newStatus) => {
    try {
      setSaving(true);
      await moderatorAPI.updateQuestionStatus(questionId, newStatus);
      setQuestions(prev => prev.map(q => 
        q.question_id === questionId ? { ...q, status: newStatus } : q
      ));
      setHasChanges(true);
    } catch (error) {
      console.error('Failed to update question status:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartModeration = async () => {
    try {
      setSaving(true);
      await moderatorAPI.startModeration(paperId);
      await loadPaperDetails();
    } catch (error) {
      console.error('Failed to start moderation:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      draft: 'status-draft',
      submitted: 'status-submitted',
      under_review: 'status-under-review',
      change_requested: 'status-change-requested',
      approved: 'status-approved'
    };
    return statusClasses[status] || 'status-default';
  };

  const getApprovalStats = () => {
    const total = questions.length;
    const approved = questions.filter(q => q.status === 'approved').length;
    const changeRequested = questions.filter(q => q.status === 'change_requested').length;
    const pending = questions.filter(q => q.status === 'submitted' || q.status === 'under_review').length;
    return { total, approved, changeRequested, pending };
  };

  // Calculate Bloom's statistics
  const bloomStats = useMemo(() => {
    const totalQuestions = questions.length;
    const questionsWithBloom = questions.filter(q => q.bloom_level).length;
    const percentageWithBloom = totalQuestions > 0 ? 
      Math.round((questionsWithBloom / totalQuestions) * 100) : 0;
    
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const marksWithBloom = questions
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
  }, [questions]);

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

  if (loading) return <div className="loading">Loading paper details...</div>;
  if (!paper) return <div className="error">Paper not found</div>;

  const stats = getApprovalStats();
  const hasCOData = questions.some(q => q.co_number || q.co_id);

  return (
    <div className="question-moderation-container">
      {/* Header */}
      <div className="moderation-header">
        <div className="header-main">
          <h1>Question Moderation</h1>
          <div className="paper-info">
            <h2>{paper.title}</h2>
            <div className="paper-meta">
              <span className="course-code">{paper.course_code}</span>
              <span className="course-title">{paper.course_title}</span>
              <span className={`paper-status ${getStatusBadgeClass(paper.status)}`}>
                {paper.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {paper.status === 'submitted' && (
            <button className="btn btn-start" onClick={handleStartModeration} disabled={saving}>
              {saving ? 'Starting...' : 'Start Moderation'}
            </button>
          )}
          
          <button 
            className="btn btn-continue"
            onClick={onContinue}
            disabled={saving || (paper.status === 'submitted' && !hasChanges)}
          >
            Continue to Paper Moderation →
          </button>
        </div>
      </div>

      {/* Approval Stats */}
      <div className="approval-stats">
        <div className="stat-item"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div>
        <div className="stat-item approved"><div className="stat-number">{stats.approved}</div><div className="stat-label">Approved</div></div>
        <div className="stat-item change-requested"><div className="stat-number">{stats.changeRequested}</div><div className="stat-label">Changes</div></div>
        <div className="stat-item pending"><div className="stat-number">{stats.pending}</div><div className="stat-label">Pending</div></div>
      </div>

      {/* Bloom's Taxonomy Analysis Section */}
      {questions.length > 0 && (
        <Paper className="bloom-analysis-section" elevation={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom align="center" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <AssessmentIcon />
              Bloom's Taxonomy Analysis
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" paragraph>
                      No Bloom's Taxonomy data available.
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Questions are not tagged with Bloom's levels.
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Statistics
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            With Bloom Level
                          </Typography>
                          <Typography variant="h5" color="primary">
                            {bloomStats.questionsWithBloom}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ({bloomStats.percentageWithBloom}%)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Marks with Bloom
                          </Typography>
                          <Typography variant="h5" color="primary">
                            {bloomStats.marksWithBloom}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ({bloomStats.marksPercentageWithBloom}%)
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Breakdown by Level
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Level</TableCell>
                            <TableCell align="right">Questions</TableCell>
                            <TableCell align="right">Marks</TableCell>
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
                                    {item.label}
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Questions List */}
      <div className="questions-list">
        <div className="questions-header">
          <h3>Questions Review</h3>
          <p className="instructions">
            Review each question and mark as ✅ Approved or ❌ Change Requested
            {hasCOData && ' • CO badges show Course Outcomes'}
            {' • Marks show question weightage'}
            {bloomData.length > 0 && ' • Colors indicate Bloom\'s Taxonomy levels'}
          </p>
        </div>

        <div className="questions-container">
          {questions.map((question, index) => {
            const coNumber = question.co_number || question.co_id;
            const bloomLevel = question.bloom_level;
            
            return (
              <div key={question.question_id} className="question-item">
                <div className="question-header">
                  <div className="question-meta">
                    <span className="question-number">Q{index + 1}</span>
                    {/* Marks display */}
                    {question.marks !== null && question.marks !== undefined && (
                      <span className="marks-badge" title={`Marks: ${question.marks}`}>
                        [{question.marks} marks]
                      </span>
                    )}
                    {/* Bloom's level chip */}
                    {bloomLevel && (
                      <Chip 
                        label={`Bloom: ${bloomLevel}`}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.7rem',
                          height: 20,
                          backgroundColor: getBloomColor(bloomLevel),
                          color: 'white',
                          fontWeight: 'bold',
                          ml: 1
                        }}
                      />
                    )}
                    {/* CO badge */}
                    {coNumber && <span className="co-badge">CO{coNumber}</span>}
                    <span className={`question-status ${getStatusBadgeClass(question.status)}`}>
                      {question.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="question-actions">
                    <button
                      className={`btn btn-approve ${question.status === 'approved' ? 'active' : ''}`}
                      onClick={() => handleQuestionStatusChange(question.question_id, 'approved')}
                      disabled={saving || paper.status === 'submitted'}
                    >
                      ✅ Approve
                    </button>
                    <button
                      className={`btn btn-reject ${question.status === 'change_requested' ? 'active' : ''}`}
                      onClick={() => handleQuestionStatusChange(question.question_id, 'change_requested')}
                      disabled={saving || paper.status === 'submitted'}
                    >
                      ❌ Request Changes
                    </button>
                  </div>
                </div>

                <div className="question-content" dangerouslySetInnerHTML={{ __html: question.content_html }} />

                {/* CO and Bloom's info */}
                {(coNumber || bloomLevel) && (
                  <div className="question-co-info">
                    {coNumber && (
                      <>
                        <strong>Course Outcome:</strong> CO{coNumber}
                        {question.co_description && <span className="co-description"> - {question.co_description}</span>}
                        {bloomLevel && ' • '}
                      </>
                    )}
                    {bloomLevel && (
                      <>
                        <strong>Bloom's Level:</strong> {bloomLevel} ({getBloomLabel(bloomLevel)})
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {questions.length === 0 && <div className="no-questions">No questions found</div>}
      </div>

      <div className="bottom-actions">
        <button className="btn btn-back" onClick={onBack}>← Back to Papers List</button>
        <button 
          className="btn btn-primary" 
          onClick={onContinue}
          disabled={saving || (paper.status === 'submitted' && !hasChanges)}
        >
          Continue to Paper Moderation →
        </button>
      </div>
    </div>
  );
};

export default QuestionModeration;