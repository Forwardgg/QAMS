// src/pages/AdminUserManagement/AdminUserManagement.jsx
import React, { useState } from 'react';
import MainLayout from '../../layouts/Mainlayout/MainLayout';
import Button from '../../components/Button/Button';
import Table from '../../components/Table/Table'; // Reusing the Table component
import './AdminUserManagement.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const AdminUserManagement = () => {
  // Dummy data for users (in a real app, this would come from an API)
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Instructor', status: 'Active' },
    { id: 3, name: 'Bob Johnson', email: 'bob.j@example.com', role: 'Moderator', status: 'Inactive' },
    { id: 4, name: 'Alice Williams', email: 'alice.w@example.com', role: 'Instructor', status: 'Active' },
    { id: 5, name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Instructor', status: 'Pending' },
  ]);

  // Define columns for the user table
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Status', accessor: 'status', render: (row) => (
        <span className={`status-badge status-${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      )
    },
  ];

  // Define actions for each user row
  const actions = [
    { label: 'Edit', variant: 'primary', handler: (user) => console.log('Edit user:', user.id) },
    { label: 'Deactivate', variant: 'secondary', handler: (user) => {
        if (window.confirm(`Are you sure you want to deactivate ${user.name}?`)) {
          setUsers(users.map(u => u.id === user.id ? { ...u, status: 'Inactive' } : u));
          console.log('Deactivate user:', user.id);
        }
      }
    },
    { label: 'Delete', variant: 'error', handler: (user) => {
        if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
          setUsers(users.filter(u => u.id !== user.id));
          console.log('Delete user:', user.id);
        }
      }
    },
  ];

  const handleAddUser = () => {
    console.log('Open Add New User Modal/Form');
    alert('Add New User feature coming soon!');
  };

  return (
    <MainLayout role="admin" username="Admin User">
      <div className="admin-user-management-page">
        <h2>User Management</h2>

        <div className="page-actions-header">
          <Button variant="primary" onClick={handleAddUser}>
            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
            Add New User
          </Button>
        </div>

        <div className="user-list-section card">
          <h3>All Users</h3>
          <Table data={users} columns={columns} actions={actions} />
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminUserManagement;