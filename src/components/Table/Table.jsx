// src/components/Table/Table.jsx
import React from 'react';
import './Table.css';
import Button from '../Button/Button'; // Assuming your Button component exists

const Table = ({ data, columns, actions }) => {
  if (!data || data.length === 0) {
    return <p className="no-data-message">No data available.</p>;
  }

  return (
    <div className="table-responsive">
      <table className="app-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
            {actions && actions.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
              {actions && actions.length > 0 && (
                <td className="table-actions">
                  {actions.map((action, actionIndex) => (
                    <Button
                      key={actionIndex}
                      variant={action.variant || 'secondary'}
                      onClick={() => action.handler(row)}
                      className="table-action-btn"
                    >
                      {action.label}
                    </Button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;