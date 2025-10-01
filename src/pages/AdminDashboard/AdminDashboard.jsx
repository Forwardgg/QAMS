import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import Button from "../../components/Button/Button";
import CourseFormModal from "../../components/CourseFormModal/CourseFormModal";
import "./AdminDashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCubes, faUserTie, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalInstructors: 0,
    pendingModerations: 0,
  });

  const [logs, setLogs] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false); // ✅ new state for user modal

  // Fetch stats + logs
  useEffect(() => {
    const fetchStatsAndLogs = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const [courseRes, instructorRes, moderationRes, logsRes] = await Promise.all([
          fetch("http://localhost:5000/api/courses/count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/users/total-instructors", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/moderation/pending/count", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/logs/recent?limit=5", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [courseData, instructorData, moderationData, logsData] = await Promise.all([
          courseRes.json(),
          instructorRes.json(),
          moderationRes.json(),
          logsRes.json(),
        ]);

        setStats({
          totalCourses: courseData.total_courses || 0,
          totalInstructors: instructorData.total_instructors || 0,
          pendingModerations: moderationData.pending_moderations || 0,
        });

        setLogs(logsData);
      } catch (err) {
        console.error("Error fetching stats/logs:", err);
      }
    };

    fetchStatsAndLogs();
  }, []);

  // ✅ Handle saving a new course
  const handleSaveCourse = async (courseData) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Course added successfully!");
        setStats((prev) => ({
          ...prev,
          totalCourses: prev.totalCourses + 1,
        }));
      } else {
        alert(data.error || "Failed to add course");
      }
    } catch (err) {
      console.error("Error adding course:", err);
      alert("Server error");
    } finally {
      setShowCourseForm(false);
    }
  };

  // ✅ Handle saving a new user
  const handleSaveUser = async (formData) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("User created successfully!");
        setStats((prev) => ({
          ...prev,
          totalInstructors:
            formData.role === "instructor"
              ? prev.totalInstructors + 1
              : prev.totalInstructors,
        }));
      } else {
        alert(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      alert("Server error");
    } finally {
      setShowUserForm(false);
    }
  };

  return (
    <MainLayout>
      <div className="admin-dashboard-page">
        <h2>System Overview</h2>

        {/* Stats Section */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <FontAwesomeIcon icon={faCubes} />
            <h4>Total Courses</h4>
            <p>{stats.totalCourses}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faUserTie} />
            <h4>Total Instructors</h4>
            <p>{stats.totalInstructors}</p>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faHourglassHalf} />
            <h4>Pending Moderations</h4>
            <p>{stats.pendingModerations}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex gap-md" style={{ marginBottom: "var(--spacing-xl)" }}>
          <Button variant="primary" onClick={() => setShowCourseForm(true)}>
            Add New Course
          </Button>
          <Button variant="outline-primary" onClick={() => setShowUserForm(true)}>
            Create User Account
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-box card">
          <h3>Recent System Activity</h3>
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.log_id} className="activity-item">
                <span>{new Date(log.created_at).toLocaleString()}</span>
                <span>
                  {log.user_name} → {log.action} ({log.details})
                </span>
              </div>
            ))
          ) : (
            <p>No recent activity</p>
          )}
        </div>

        {/* Course Form Modal */}
        <CourseFormModal
          show={showCourseForm}
          onClose={() => setShowCourseForm(false)}
          onSave={handleSaveCourse}
        />

        {/* User Form Modal */}
        {showUserForm && (
          <UserFormModal
            show={showUserForm}
            onClose={() => setShowUserForm(false)}
            onSave={handleSaveUser}
          />
        )}
      </div>
    </MainLayout>
  );
};

// ✅ Inline UserFormModal
const UserFormModal = ({ show, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "instructor",
    status: "active",
  });

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Create New User</h3>
        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="moderator">Moderator</option>
          </select>

          <div className="modal-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;
