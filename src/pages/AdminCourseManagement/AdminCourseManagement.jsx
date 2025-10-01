import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout/MainLayout";
import Button from "../../components/Button/Button";
import Table from "../../components/Table/Table";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import CourseFormModal from "../../components/CourseFormModal/CourseFormModal";
import "./AdminCourseManagement.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

const AdminCourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  // Open Add form
  const handleAddCourse = () => {
    setEditCourse(null);
    setShowForm(true);
  };

  // Open Edit form
  const handleEditCourse = (course) => {
    setEditCourse(course);
    setShowForm(true);
  };

  // Save Add/Edit form
  const handleSaveCourse = async (courseData) => {
    try {
      const token = sessionStorage.getItem("token");
      let res;

      if (editCourse) {
        res = await fetch(`http://localhost:5000/api/courses/${editCourse.course_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(courseData),
        });
      } else {
        res = await fetch("http://localhost:5000/api/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(courseData),
        });
      }

      const data = await res.json();

      if (res.ok) {
        const formatted = {
          course_id: data.course_id,
          id: data.code,
          title: data.title,
          instructorId: data.creator_id,
          instructor: data.creator_name,
          ltp_structure: data.ltp_structure, // ✅ use LTP instead of status
        };

        setCourses((prev) =>
          editCourse
            ? prev.map((c) =>
                c.course_id === editCourse.course_id ? formatted : c
              )
            : [...prev, formatted]
        );

        alert(editCourse ? "Course updated" : "Course added");
      } else {
        alert(data.error || "Failed to save course");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setShowForm(false);
      setEditCourse(null);
    }
  };

  // Load courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await fetch(
          "http://localhost:5000/api/courses?includeInstructors=true",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        const formatted = data.map((c) => ({
          course_id: c.course_id,
          id: c.code,
          title: c.title,
          instructorId: c.creator_id,
          instructor: c.creator_name,
          ltp_structure: c.ltp_structure, // ✅ add LTP here
        }));

        setCourses(formatted);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchCourses();
  }, []);

  // Table columns
  const columns = [
    { header: "Course ID", accessor: "id" },
    { header: "Title", accessor: "title" },
    { header: "Instructor ID", accessor: "instructorId" },
    { header: "Instructor Name", accessor: "instructor" },
    { header: "LTP", accessor: "ltp_structure" }, // ✅ new column
  ];

  // Table row actions
  const actions = [
    {
      label: "Edit",
      variant: "primary",
      handler: (course) => handleEditCourse(course),
    },
    {
      label: "Delete",
      variant: "error",
      handler: (course) => {
        setSelectedCourse(course);
        setShowModal(true);
      },
    },
  ];

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedCourse) return;
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/courses/${selectedCourse.course_id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (res.ok) {
        setCourses(courses.filter((c) => c.course_id !== selectedCourse.course_id));
        alert("Course deleted successfully!");
      } else {
        alert(data.error || "Failed to delete course");
      }
    } catch (err) {
      console.error("Error deleting course:", err);
    } finally {
      setShowModal(false);
      setSelectedCourse(null);
    }
  };

  return (
    <MainLayout>
      <div className="admin-course-management-page">
        <h2>Course Management</h2>

        <div className="page-actions-header">
          <Button variant="primary" onClick={handleAddCourse}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} />
            Add New Course
          </Button>
        </div>

        <div className="course-list-section card">
          <h3>All Courses</h3>
          <Table data={courses} columns={columns} actions={actions} />
        </div>

        <CourseFormModal
          show={showForm}
          onClose={() => setShowForm(false)}
          onSave={handleSaveCourse}
          initialData={editCourse}
        />

        <ConfirmModal
          show={showModal}
          title="Confirm Delete"
          message={
            selectedCourse
              ? `Are you sure you want to delete course "${selectedCourse.title}" (${selectedCourse.id})?`
              : ""
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowModal(false);
            setSelectedCourse(null);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default AdminCourseManagement;
