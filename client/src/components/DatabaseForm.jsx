import React, { useState } from 'react';
import { createDatabase } from '../services/api';

function DatabaseForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '5432',
    database: '',
    user: '',
    password: '',
    ssl: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createDatabase(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to add database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Add New Database</h2>
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="two-column-grid">
          <div className="form-group">
            <label htmlFor="name">Database Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="My Database"
            />
          </div>

          <div className="form-group">
            <label htmlFor="host">Host *</label>
            <input
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleChange}
              required
              placeholder="localhost"
            />
          </div>

          <div className="form-group">
            <label htmlFor="port">Port</label>
            <input
              type="number"
              id="port"
              name="port"
              value={formData.port}
              onChange={handleChange}
              placeholder="5432"
            />
          </div>

          <div className="form-group">
            <label htmlFor="database">Database Name *</label>
            <input
              type="text"
              id="database"
              name="database"
              value={formData.database}
              onChange={handleChange}
              required
              placeholder="mydb"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user">Username *</label>
            <input
              type="text"
              id="user"
              name="user"
              value={formData.user}
              onChange={handleChange}
              required
              placeholder="postgres"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="ssl"
              name="ssl"
              checked={formData.ssl}
              onChange={handleChange}
            />
            <label htmlFor="ssl">Use SSL Connection</label>
          </div>
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Testing Connection...' : 'Add Database'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default DatabaseForm;
