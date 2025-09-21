// src/pages/InstructorMyCourses/InstructorMyCourses.jsx
import React, { useState } from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import Table from '../../components/Table/Table';
import Button from '../../components/Button/Button';
import './InstructorMyCourses.css';

const InstructorMyCourses = () => {
  const instructorName = "Dr. Jane Doe"; // This would be dynamic in a real app

  // Dummy data for courses assigned to this instructor
  const [courses] = useState([
    { id: 'CS201', title: 'Data Structures', students: 80, questions: 45, lastUpdated: '2025-09-15' },
    { id: 'CS305', title: 'Algorithms Design', students: 65, questions: 30, lastUpdated: '2025-09-12' },
    { id: 'MA101', title: 'Calculus I', students: 100, questions: 60, lastUpdated: '2025-09-18' },
  ]);

  // Define columns for the courses table
  const columns = [
    { header: 'Course ID', accessor: 'id' },
    { header: 'Title', accessor: 'title' },
    { header: 'Students Enrolled', accessor: 'students' },
    { header: 'Questions in Bank', accessor: 'questions' },
    { header: 'Last Updated', accessor: 'lastUpdated' },
  ];

  // Define actions for each course row
  const actions = [
    { 
      label: 'View Questions', 
      variant: 'primary', 
      handler: (course) => {
        console.log('Viewing questions for course:', course.id);
        alert(`Navigating to question bank for ${course.title}`);
        // In a real app, this would navigate: navigate(`/instructor/my-questions?courseId=${course.id}`);
      }
    },
    { 
      label: 'Course Details', 
      variant: 'secondary', 
      handler: (course) => {
        console.log('Viewing details for course:', course.id);
        alert(`Viewing details for ${course.title}`);
      }
    },
  ];

  const handleRequestCourse = () => {
    alert("Instructors cannot directly create new courses. Please contact an administrator to have a new course assigned to you.");
  };

  return (
    <MainLayout role="instructor" username={instructorName}>
      <div className="instructor-my-courses-page">
        <h2>My Courses</h2>

        <div className="page-actions-header">
          <Button variant="outline-primary" onClick={handleRequestCourse}>
              Request New Course Assignment
          </Button>
        </div>

        <div className="my-courses-list-section card">
          <h3>Courses Assigned to You</h3>
          <Table data={courses} columns={columns} actions={actions} />
        </div>
      </div>
    </MainLayout>
  );
};

export default InstructorMyCourses;