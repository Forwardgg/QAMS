import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../components/AuthProvider';
import moderatorAPI from '../../../api/moderator.api';
import './ModerationList.css';

const ModerationList = () => {
  const navigate = useNavigate();
  const [moderations, setModerations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    courseCode: '',
    moderatorName: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });
  const auth = useContext(AuthContext);

  const fetchModerations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await moderatorAPI.getAllModerations(filters);
      setModerations(response.data || []);
      setPagination(response.pagination || {
        total: 0,
        page: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    } catch (error) {
      console.error('Error fetching moderations:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch moderation records';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchModerations();
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      courseCode: '',
      moderatorName: '',
      page: 1,
      limit: 20
    });
  };

  // Navigate to ModReport with moderation details
  const handleViewReport = (moderation) => {
    navigate(`/admin/moderation/report?moderationId=${moderation.moderation_id}&paperId=${moderation.paper_id}`);
  };

  // Navigate to QuestionList
  const handleViewQuestions = (moderation) => {
    navigate(`/admin/moderation/questions?moderationId=${moderation.moderation_id}&paperId=${moderation.paper_id}`);
  };

  const getUniqueValues = (key) => {
    return [...new Set(moderations.map(mod => mod[key]).filter(Boolean))].sort();
  };

  const getSortedModerations = () => {
    if (!sortConfig.key) return moderations;

    return [...moderations].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  useEffect(() => {
    fetchModerations();
  }, [filters]);

  const sortedModerations = getSortedModerations();
  const uniqueStatuses = ['pending', 'approved', 'rejected'];
  const uniqueCourses = getUniqueValues('course_code');
  const uniqueModerators = getUniqueValues('moderator_name');

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const StatusBadge = ({ status }) => {
    const statusClass = `status-badge status-${status}`;
    return <span className={statusClass}>{status}</span>;
  };

  return (
    <div className="moderation-list">
      <div className="page-header">
        <h1>Moderation Records</h1>
        <div className="header-actions">
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="btn btn-outline"
          >
            ← Dashboard
          </button>
          <button 
            onClick={fetchModerations} 
            className="btn btn-secondary"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="page-subtitle">
        <p>View and manage all moderation activities</p>
        <div className="quick-stats">
          <span className="stat-item">Total: {pagination.total}</span>
          <span className="stat-item">Showing: {moderations.length}</span>
          <span className="stat-item">Page: {pagination.page}/{pagination.totalPages}</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
          <button onClick={fetchModerations} className="retry-btn">Retry</button>
        </div>
      )}

      <div className="filters-section">
        <div className="section-header">
          <h3>Filters</h3>
          <button 
            onClick={fetchModerations} 
            className="btn btn-refresh"
            disabled={loading}
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="filter-controls">
          <div className="filter-row">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search paper title, course, or moderator..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                disabled={loading}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Course</label>
              <select 
                value={filters.courseCode} 
                onChange={(e) => handleFilterChange('courseCode', e.target.value)}
                disabled={loading}
              >
                <option value="">All Courses</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Moderator</label>
              <select 
                value={filters.moderatorName} 
                onChange={(e) => handleFilterChange('moderatorName', e.target.value)}
                disabled={loading}
              >
                <option value="">All Moderators</option>
                {uniqueModerators.map(moderator => (
                  <option key={moderator} value={moderator}>{moderator}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Apply Filters
            </button>
            <button type="button" className="btn btn-outline" onClick={handleResetFilters} disabled={loading}>
              Reset
            </button>
            <span className="result-count">
              {loading ? 'Loading...' : `${pagination.total} records found`}
            </span>
          </div>
        </form>
      </div>

      <div className="moderation-table-container">
        {loading ? (
          <div className="loading">Loading moderation records...</div>
        ) : moderations.length === 0 ? (
          <div className="no-data">
            {Object.values(filters).some(val => val && val !== 1 && val !== 20) 
              ? "No records found matching your criteria" 
              : "No moderation records found"
            }
            {!filters.search && !filters.status && !filters.courseCode && !filters.moderatorName && (
              <div className="no-data-actions">
                <p>It looks like there are no moderation records yet.</p>
                <button className="btn btn-primary" onClick={fetchModerations}>
                  Refresh
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="moderation-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('paper_title')} className="sortable-header">
                      Paper Title <SortIcon columnKey="paper_title" />
                    </th>
                    <th onClick={() => handleSort('course_code')} className="sortable-header">
                      Course <SortIcon columnKey="course_code" />
                    </th>
                    <th onClick={() => handleSort('creator_name')} className="sortable-header">
                      Instructor <SortIcon columnKey="creator_name" />
                    </th>
                    <th onClick={() => handleSort('moderator_name')} className="sortable-header">
                      Moderator <SortIcon columnKey="moderator_name" />
                    </th>
                    <th onClick={() => handleSort('status')} className="sortable-header">
                      Status <SortIcon columnKey="status" />
                    </th>
                    <th onClick={() => handleSort('updated_at')} className="sortable-header">
                      Updated <SortIcon columnKey="updated_at" />
                    </th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModerations.map((moderation) => (
                    <tr key={moderation.moderation_id} className="moderation-row">
                      <td className="paper-title">
                        <div className="title-text" title={moderation.paper_title}>
                          {moderation.paper_title}
                        </div>
                        <div className="paper-meta">
                          ID: #{moderation.moderation_id} • v{moderation.paper_version} • {moderation.question_count} questions
                        </div>
                      </td>
                      <td className="course-info">
                        <div className="course-code">{moderation.course_code}</div>
                        <div className="course-title" title={moderation.course_title}>
                          {moderation.course_title}
                        </div>
                      </td>
                      <td className="instructor-info">
                        <div className="instructor-name">{moderation.creator_name || 'N/A'}</div>
                      </td>
                      <td className="moderator-info">
                        <div className="moderator-name">{moderation.moderator_name}</div>
                        <div className="moderator-email">{moderation.moderator_email}</div>
                      </td>
                      <td>
                        <StatusBadge status={moderation.status} />
                      </td>
                      <td className="date-cell">
                        {new Date(moderation.updated_at).toLocaleDateString()}
                        <div className="time-text">
                          {new Date(moderation.updated_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewReport(moderation)}
                          title="View moderation report"
                        >
                          Report
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleViewQuestions(moderation)}
                          title="View question analysis"
                        >
                          Questions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  ← Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-page ${pageNum === pagination.page ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <span className="page-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  className="btn btn-outline"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ModerationList;