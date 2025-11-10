// src/pages/AdminCourseManagement/AdminCourseManagement.jsx
import React, { useState } from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import Button from '../../components/Button/Button';
import Table from '../../components/Table/Table'; // Import the new Table component
import './AdminCourseManagement.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const AdminCourseManagement = () => {
  // Dummy data for courses (in a real app, this would come from an API)
  const [courses, setCourses] = useState([
    { id: 'CS101', title: 'Introduction to Programming', instructor: 'Dr. A. Sharma', students: 120, status: 'Active' },
    { id: 'EE203', title: 'Circuit Analysis', instructor: 'Prof. B. Kumar', students: 85, status: 'Active' },
    { id: 'ME302', title: 'Thermodynamics', instructor: 'Dr. C. Singh', students: 60, status: 'Inactive' },
    { id: 'PH101', title: 'General Physics I', instructor: 'Dr. D. Gupta', students: 150, status: 'Active' },
    { id: 'CH201', title: 'Organic Chemistry', instructor: 'Prof. E. Rao', students: 70, status: 'Active' },
  ]);

  // Define columns for the table
  const columns = [
    { header: 'Course ID', accessor: 'id' },
    { header: 'Title', accessor: 'title' },
    { header: 'Instructor', accessor: 'instructor' },
    { header: 'Students', accessor: 'students' },
    { header: 'Status', accessor: 'status', render: (row) => (
        <span className={`status-badge status-${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      )
    },
  ];

  // Define actions for each row
  const actions = [
    { label: 'Edit', variant: 'primary', handler: (course) => console.log('Edit course:', course.id) },
    { label: 'Delete', variant: 'error', handler: (course) => {
        if (window.confirm(`Are you sure you want to delete course ${course.id}?`)) {
          setCourses(courses.filter(c => c.id !== course.id));
          console.log('Delete course:', course.id);
        }
      }
    },
  ];

  const handleAddCourse = () => {
    console.log('Open Add New Course Modal/Form');
    // In a real app, this would open a modal or navigate to a form
    alert('Add New Course feature coming soon!');
  };

  return (
    <MainLayout role="admin" username="Admin User">
      <div className="admin-course-management-page">
        <h2>Course Management</h2>

        <div className="page-actions-header">
          <Button variant="primary" onClick={handleAddCourse}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
            Add New Course
          </Button>
        </div>

        <div className="course-list-section card">
          <h3>All Courses</h3>
          <Table data={courses} columns={columns} actions={actions} />
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminCourseManagement;