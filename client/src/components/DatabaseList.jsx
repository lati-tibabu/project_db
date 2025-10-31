import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeDatabase, setSelectedDatabase } from '../store/slices/databasesSlice';
import { testDatabaseConnection } from '../services/api';

function DatabaseList({ onSelect }) {
  const dispatch = useDispatch();
  const { items: databases, selectedId } = useSelector(state => state.databases);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Show 6 databases per page

  const totalPages = Math.ceil(databases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDatabases = databases.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await dispatch(removeDatabase(id)).unwrap();
      } catch (err) {
        alert('Failed to delete database: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleTest = async (id, name) => {
    try {
      const result = await testDatabaseConnection(id);
      if (result.success) {
        alert(`✅ Connection to "${name}" successful!`);
      } else {
        alert(`❌ Connection failed: ${result.message}`);
      }
    } catch (err) {
      alert('Failed to test connection: ' + (err.response?.data?.message || err.message));
    }
  };

  if (databases.length === 0) {
    return (
      <div className="empty-state">
        <h3>No databases configured</h3>
        <p>Click "Add New Database" to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="database-list">
        {paginatedDatabases.map(db => (
          <div
            key={db.id}
            className={`database-card ${selectedId === db.id ? 'selected' : ''}`}
            onClick={() => {
              dispatch(setSelectedDatabase(db.id));
              onSelect && onSelect(db.id);
            }}
          >
            <h3>{db.name}</h3>
            <p><strong>Host:</strong> {db.host}:{db.port}</p>
            <p><strong>Database:</strong> {db.database}</p>
            <p><strong>User:</strong> {db.user}</p>
            <p><strong>SSL:</strong> {db.ssl ? 'Yes' : 'No'}</p>
            
            <div className="actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="btn btn-success"
                onClick={() => handleTest(db.id, db.name)}
              >
                Test
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(db.id, db.name)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default DatabaseList;
