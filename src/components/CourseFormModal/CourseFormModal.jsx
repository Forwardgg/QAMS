// src/components/CourseFormModal/CourseFormModal.jsx
import React, { useState, useEffect } from "react";
import "./CourseFormModal.css";

const CourseFormModal = ({ show, onClose, onSave, initialData }) => {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [ltp, setLtp] = useState("");

  useEffect(() => {
    if (initialData) {
      setCode(initialData.id || "");
      setTitle(initialData.title || "");
      setLtp(initialData.ltp_structure || "");
    } else {
      setCode("");
      setTitle("");
      setLtp("");
    }
  }, [initialData]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ code, title, ltp_structure: ltp });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{initialData ? "Edit Course" : "Add New Course"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Course Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>LTP Structure</label>
            <input value={ltp} onChange={(e) => setLtp(e.target.value)} placeholder="3-0-0" required />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseFormModal;
