import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/Mainlayout/MainLayout";
import Button from "../../components/Button/Button";
import "./InstructorDashboard.css";
import {
  FontAwesomeIcon,
} from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faQuestionCircle,
  faCheckCircle,
  faComments,
} from "@fortawesome/free-solid-svg-icons";

const InstructorDashboard = () => {
  const [stats, setStats] = useState({
    assignedCourses: 0,
    totalQuestions: 0,
    approvedQuestions: 0,
    pendingQuestions: 0,
  });
  const [activity, setActivity] = useState([]);
  const [username, setUsername] = useState("Instructor");

  // Fetch stats + logs
  useEffect(() => {
    const fetchInstructorStats = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const [coursesRes, questionsRes, approvedRes, pendingRes, activityRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/instructor/courses/count", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/instructor/questions/count", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/instructor/questions/approved", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/instructor/questions/pending", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:5000/api/instructor/logs/recent", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const [
          coursesData,
          questionsData,
          approvedData,
          pendingData,
          activityData,
        ] = await Promise.all([
          coursesRes.json(),
          questionsRes.json(),
          approvedRes.json(),
          pendingRes.json(),
          activityRes.json(),
        ]);

        setStats({
          assignedCourses: coursesData.assigned_courses || 0,
          totalQuestions: questionsData.total_questions || 0,
          approvedQuestions: approvedData.approved_questions || 0,
          pendingQuestions: pendingData.pending_questions || 0,
        });

        setActivity(activityData);

        // Optional: set username if returned in logs
        if (activityData.length > 0 && activityData[0].user_name) {
          setUsername(activityData[0].user_name);
        }
      } catch (err) {
        console.error("Error fetching instructor stats:", err);
      }
    };

    fetchInstructorStats();
  }, []);

  const handleCreateQuestion = () => {
    console.log("Navigate to Create New Question Form/Modal");
    alert("Create New Question feature is coming!");
    // In a real app, you'd use: navigate('/instructor/questions/new');
  };

  return (
    <MainLayout role="instructor" username={username}>
      <div className="instructor-dashboard-page">
        <h2>Instructor Dashboard</h2>

        {/* Stats Section */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <FontAwesomeIcon icon={faBookOpen} />
            <h4>Assigned Courses</h4>
            <p>{stats.assignedCourses}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faQuestionCircle} />
            <h4>Total Questions</h4>
            <p>{stats.totalQuestions}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faCheckCircle} />
            <h4>Approved Questions</h4>
            <p>{stats.approvedQuestions}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faComments} />
            <h4>Pending Moderation</h4>
            <p>{stats.pendingQuestions}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="d-flex gap-md"
          style={{ marginBottom: "var(--spacing-xl)" }}
        >
          <Button variant="primary" onClick={handleCreateQuestion}>
            <FontAwesomeIcon
              icon={faQuestionCircle}
              style={{ marginRight: "8px" }}
            />
            Create New Question
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-box card">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {activity.length > 0 ? (
              activity.map((log) => (
                <div key={log.log_id} className="activity-item">
                  <span className="activity-message">
                    {log.action}: {log.details}
                  </span>
                  <span className="activity-timestamp">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="no-data-message">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default InstructorDashboard;
