import React, { useMemo } from 'react';
import { Assessment } from '@mui/icons-material';
import './BloomsAnalysis.css';

// Helper functions
const getBloomColor = (level) => {
  const colors = {
    'L1': '#FF6B6B', // Remember
    'L2': '#4ECDC4', // Understand
    'L3': '#45B7D1', // Apply
    'L4': '#96CEB4', // Analyze
    'L5': '#FFEAA7', // Evaluate
    'L6': '#DDA0DD', // Create
    'UNKNOWN': '#CCCCCC'
  };
  return colors[level] || '#CCCCCC';
};

const getBloomLabel = (level) => {
  const labels = {
    'L1': 'L1 (Remember)',
    'L2': 'L2 (Understand)',
    'L3': 'L3 (Apply)',
    'L4': 'L4 (Analyze)',
    'L5': 'L5 (Evaluate)',
    'L6': 'L6 (Create)',
    'UNKNOWN': 'Not Assigned'
  };
  return labels[level] || 'Unknown';
};

const BloomsAnalysis = ({ questionReport }) => {
  const bloomStats = useMemo(() => {
    const bloomDistribution = {};
    
    // Initialize all levels
    ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'UNKNOWN'].forEach(level => {
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
          percentage: (data.count / questionReport.length * 100).toFixed(1)
        };
      });

    // Calculate overall statistics
    const totalQuestions = questionReport.length;
    const questionsWithBloom = questionReport.filter(q => q.bloom_level).length;
    const percentageWithBloom = totalQuestions > 0 ? 
      Math.round((questionsWithBloom / totalQuestions) * 100) : 0;
    
    const totalMarks = questionReport.reduce((sum, q) => sum + (q.marks || 0), 0);
    const marksWithBloom = questionReport
      .filter(q => q.bloom_level)
      .reduce((sum, q) => sum + (q.marks || 0), 0);

    return {
      chartData,
      totalQuestions,
      questionsWithBloom,
      percentageWithBloom,
      totalMarks,
      marksWithBloom,
      marksPercentageWithBloom: totalMarks > 0 ? 
        Math.round((marksWithBloom / totalMarks) * 100) : 0
    };
  }, [questionReport]);

  // Function to create conic gradient for pie chart
  const getPieChartStyle = () => {
    if (bloomStats.chartData.length === 0) return {};
    
    let accumulatedPercentage = 0;
    const gradients = bloomStats.chartData.map(item => {
      const start = accumulatedPercentage + '%';
      accumulatedPercentage += parseFloat(item.percentage);
      const end = accumulatedPercentage + '%';
      return `${item.color} ${start} ${end}`;
    }).join(', ');
    
    return {
      background: `conic-gradient(${gradients})`
    };
  };

  if (!questionReport || questionReport.length === 0) {
    return (
      <div className="bloom-analysis-section">
        <div className="bloom-header">
          <Assessment />
          <h2>Bloom's Taxonomy Analysis</h2>
        </div>
        <div className="empty-state">
          <p>No questions available for analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bloom-analysis-section">
      <div className="bloom-header">
        <Assessment />
        <h2>Bloom's Taxonomy Analysis</h2>
      </div>
      
      <div className="bloom-content">
        <div className="bloom-chart-section">
          {bloomStats.chartData.length > 0 ? (
            <>
              <div className="bloom-pie-chart-container">
                <div className="bloom-pie-chart" style={getPieChartStyle()}>
                  <div className="pie-chart-center">
                    <h4>{bloomStats.totalQuestions}</h4>
                    <span className="total-questions-label">Total Questions</span>
                  </div>
                </div>
              </div>
              
              <div className="bloom-legend">
                {bloomStats.chartData.map((item) => (
                  <div key={item.id} className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="legend-label">
                      {item.label} <span className="legend-count">({item.value})</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>No Bloom's Taxonomy data available.</p>
              <p className="hint">Tag questions with Bloom's levels in the editor.</p>
            </div>
          )}
        </div>

        <div className="bloom-stats-section">
          <div className="stats-container">
            <h3 className="stats-header">Statistics</h3>
            
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Questions</span>
                <div className="stat-value">{bloomStats.totalQuestions}</div>
              </div>
              
              <div className="stat-card">
                <span className="stat-label">With Bloom Level</span>
                <div className="stat-value">{bloomStats.questionsWithBloom}</div>
                <span className="stat-percentage">({bloomStats.percentageWithBloom}%)</span>
              </div>
              
              <div className="stat-card">
                <span className="stat-label">Total Marks</span>
                <div className="stat-value">{bloomStats.totalMarks}</div>
              </div>
              
              <div className="stat-card">
                <span className="stat-label">Marks with Bloom</span>
                <div className="stat-value">{bloomStats.marksWithBloom}</div>
                <span className="stat-percentage">({bloomStats.marksPercentageWithBloom}%)</span>
              </div>
            </div>

            <div className="breakdown-section">
              <h3 className="breakdown-header">Breakdown by Level</h3>
              <div className="breakdown-table-container">
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Questions</th>
                      <th>Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bloomStats.chartData.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="level-cell">
                            <div 
                              className="level-color" 
                              style={{ backgroundColor: item.color }} 
                            />
                            <span className="level-name">{item.label}</span>
                          </div>
                        </td>
                        <td>{item.value}</td>
                        <td>{item.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloomsAnalysis;