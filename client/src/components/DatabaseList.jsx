import React from 'react';
import { deleteDatabase, testDatabaseConnection } from '../services/api';

function DatabaseList({ databases, onSelect, onDelete, onTest, selectedId }) {
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDatabase(id);
        onDelete();
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
      onTest();
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
    <div className="database-list">
      {databases.map(db => (
        <div
          key={db.id}
          className={`database-card ${selectedId === db.id ? 'selected' : ''}`}
          onClick={() => onSelect(db.id)}
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
  );
}

export default DatabaseList;
