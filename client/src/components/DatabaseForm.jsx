import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addDatabase, addDatabaseFromConf } from '../store/slices/databasesSlice';

const INITIAL_FORM = {
  name: '',
  host: '',
  port: '5432',
  database: '',
  user: '',
  password: '',
  ssl: false,
  createOnServer: false,
  confPath: ''
};

function DatabaseForm({ onSuccess, onCancel }) {
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
      const { confPath, ...rest } = formData;
      const payload = { ...rest, create_on_server: rest.createOnServer };
      delete payload.createOnServer;
      const newDatabase = await dispatch(addDatabase(payload)).unwrap();
      resetForm();
      onSuccess && onSuccess(newDatabase);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Failed to add database');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setError('');
    setLoading(true);
    try {
      if (!formData.confPath) {
        throw new Error('Please provide confPath');
      }
      const newDatabase = await dispatch(addDatabaseFromConf(formData.confPath)).unwrap();
      resetForm();
      onSuccess && onSuccess(newDatabase);
    } catch (err) {
      setError(typeof err === 'string' ? err : err?.message || 'Failed to import from conf');
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

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="createOnServer"
              name="createOnServer"
              checked={formData.createOnServer}
              onChange={handleChange}
            />
            <label htmlFor="createOnServer">Create database on server (requires privilege)</label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confPath">Or import from .conf (server/config or absolute path)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              id="confPath"
              name="confPath"
              value={formData.confPath}
              placeholder="db.conf or C:\\path\\to\\db.conf"
              onChange={handleChange}
            />
            <button
              type="button"
              className="btn"
              disabled={loading || createStatus === 'loading'}
              onClick={handleImport}
            >
              Import .conf
            </button>
          </div>
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary" disabled={loading || createStatus === 'loading'}>
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
