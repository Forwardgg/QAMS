// src/pages/AdminSystemLogs/AdminSystemLogs.jsx
import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/Mainlayout/MainLayout";
import "./AdminUserLogs.css";

const AdminUserLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState(""); // controlled input
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    fetch("http://localhost:5000/api/logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLogs(data);
          setFilteredLogs(data);
        } else if (Array.isArray(data.rows)) {
          setLogs(data.rows);
          setFilteredLogs(data.rows);
        } else {
          console.error("Unexpected API response:", data);
          setLogs([]);
          setFilteredLogs([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching logs:", err);
        setLogs([]);
        setFilteredLogs([]);
        setLoading(false);
      });
  }, []);

  // Filtering logic
  useEffect(() => {
    let updated = [...logs];

    // Search filter
    if (search.trim() !== "") {
      updated = updated.filter(
        (log) =>
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.details.toLowerCase().includes(search.toLowerCase()) ||
          (log.username && log.username.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Date range filter
    if (startDate || endDate) {
      updated = updated.filter((log) => {
        const logDate = new Date(log.created_at).toISOString().split("T")[0];
        return (
          (!startDate || logDate >= startDate) &&
          (!endDate || logDate <= endDate)
        );
      });
    }

    setFilteredLogs(updated);
  }, [search, startDate, endDate, logs]);

  return (
    <MainLayout role="admin" username="Admin User">
      <div className="admin-system-logs-page">
        <h2>System Logs</h2>

        {/* Filters */}
        <div
          className="log-filters"
          style={{
            marginBottom: "1rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search by user, action, details..."
            value={pendingSearch}
            onChange={(e) => setPendingSearch(e.target.value)}
            className="form-control"
            style={{ flex: 1 }}
          />

          <button
            onClick={() => setSearch(pendingSearch)}
            className="btn btn-primary"
            style={{ padding: "0.5rem 1rem" }}
          >
            🔍 Search
          </button>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-control"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="form-control"
          />
        </div>

        {/* Logs Table */}
        <div className="system-logs-list card">
          <h3>Recent Logs</h3>
          <div className="log-header">
            <span style={{ flex: 2 }}>Timestamp</span>
            <span style={{ flex: 1 }}>User</span>
            <span style={{ flex: 1 }}>Action</span>
            <span style={{ flex: 3 }}>Details</span>
          </div>

          {loading ? (
            <p>Loading logs...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="no-data-message">No logs found.</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.log_id} className="log-item">
                <span style={{ flex: 2 }}>
                  {new Date(log.created_at).toLocaleString()}
                </span>
                <span style={{ flex: 1 }}>
                  {log.username || `User ${log.user_id}`}
                </span>
                <span style={{ flex: 1 }}>{log.action}</span>
                <span style={{ flex: 3 }}>{log.details}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminUserLogs;
