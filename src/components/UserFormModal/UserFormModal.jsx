import React, { useState, useEffect } from "react";
import "./UserFormModal.css";

const UserFormModal = ({ show, onClose, onSave, initialData }) => {
  const [form, setForm] = useState({ name: "", email: "", role: "instructor", status: "active", password: "" });

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData, password: "" }); // don’t overwrite password
    } else {
      setForm({ name: "", email: "", role: "instructor", status: "active", password: "" });
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
          <input type="text" name="name" value={form.name} onChange={handleChange} required />

          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />

          {!initialData && (
            <>
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required />
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
            <button type="submit">{initialData ? "Save Changes" : "Create User"}</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
