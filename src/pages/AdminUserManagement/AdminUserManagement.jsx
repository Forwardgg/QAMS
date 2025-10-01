import React, { useState, useEffect } from "react";
import MainLayout from "../../layouts/Mainlayout/MainLayout";
import Button from "../../components/Button/Button";
import Table from "../../components/Table/Table";
import "./AdminUserManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const API_URL = "http://localhost:5000/api/users";

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          console.warn("⚠️ No token found. Redirecting to login.");
          return;
        }

        const res = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("❌ Error fetching users:", data.error || data);
          setUsers([]);
          return;
        }

        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  // Save (create or update) user
  const handleSaveUser = async (formData) => {
    const token = sessionStorage.getItem("token");
    let res;

    if (editUser) {
      // Update existing user
      res = await fetch(`${API_URL}/${editUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
    } else {
      // Create new user
      res = await fetch(`${API_URL}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
    }

    const data = await res.json();

    if (res.ok) {
      if (editUser) {
        setUsers(users.map((u) => (u.id === editUser.id ? data.user : u)));
      } else {
        setUsers([...users, data.user]);
      }
      setShowForm(false);
      setEditUser(null);
    } else {
      alert(data.error || "Failed to save user");
    }
  };

  // Define columns
  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Role", accessor: "role" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className={`status-badge status-${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      ),
    },
  ];

  // Define actions
  const actions = [
    {
      label: "Edit",
      variant: "primary",
      handler: (user) => {
        setEditUser(user);
        setShowForm(true);
      },
    },
    {
      label: "Deactivate",
      variant: "secondary",
      handler: async (user) => {
        if (window.confirm(`Deactivate ${user.name}?`)) {
          const token = sessionStorage.getItem("token");
          const res = await fetch(`${API_URL}/${user.id}/deactivate`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setUsers(
              users.map((u) =>
                u.id === user.id ? { ...u, status: "inactive" } : u
              )
            );
          }
        }
      },
    },
    {
      label: "Activate",
      variant: "success",
      handler: async (user) => {
        if (window.confirm(`Activate ${user.name}?`)) {
          const token = sessionStorage.getItem("token");
          const res = await fetch(`${API_URL}/${user.id}/activate`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setUsers(
              users.map((u) =>
                u.id === user.id ? { ...u, status: "active" } : u
              )
            );
          }
        }
      },
    },
  ];

  const handleAddUser = () => {
    setEditUser(null);
    setShowForm(true);
  };

  return (
    <MainLayout role="admin" username="Admin User">
      <div className="admin-user-management-page">
        <h2>User Management</h2>

        <div className="page-actions-header">
          <Button variant="primary" onClick={handleAddUser}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} />
            Add New User
          </Button>
        </div>

        <div className="user-list-section card">
          <h3>All Users</h3>
          <Table data={users} columns={columns} actions={actions} />
        </div>

        {/* Modal Form for Add/Edit */}
        {showForm && (
          <UserFormModal
            show={showForm}
            onClose={() => setShowForm(false)}
            onSave={handleSaveUser}
            initialData={editUser}
          />
        )}
      </div>
    </MainLayout>
  );
};

// 🔹 Inline modal component
const UserFormModal = ({ show, onClose, onSave, initialData }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "instructor",
    status: "active",
    password: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData, password: "" }); // don’t show password
    }
  }, [initialData]);

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
        <h3>{initialData ? "Edit User" : "Add New User"}</h3>
        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          {!initialData && (
            <>
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </>
          )}

          <label>Role</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="moderator">Moderator</option>
          </select>

          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="modal-actions">
            <button type="submit">
              {initialData ? "Save Changes" : "Create User"}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserManagement;
