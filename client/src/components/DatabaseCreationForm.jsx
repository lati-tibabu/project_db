import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addDatabase } from '../store/slices/databasesSlice';

const INITIAL_FORM = {
  name: '',
  host: '',
  port: '5432',
  database: '',
  user: '',
  password: '',
  ssl: false
};

function DatabaseCreationForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const createStatus = useSelector(state => state.databases.createStatus);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Always create the database on server and add to managed list
      const payload = { ...formData, create_on_server: true };
      const newDatabase = await dispatch(addDatabase(payload)).unwrap();
      resetForm();
      onSuccess && onSuccess(newDatabase);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Failed to create and add database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create & Add Database</h2>
      <p className="form-description">
        Create a new database on the PostgreSQL server and add it to your managed database list.
      </p>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="two-column-grid">
          <div className="form-group">
            <label htmlFor="name">Display Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="My New Database"
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
              placeholder="mynewdb"
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
          <button type="submit" className="btn btn-primary" disabled={loading || createStatus === 'loading'}>
            {loading ? 'Creating & Adding Database...' : 'Create & Add Database'}
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

export default DatabaseCreationForm;