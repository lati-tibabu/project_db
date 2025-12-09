import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addApp } from '../store/slices/appsSlice';
import { fetchDatabases } from '../store/slices/databasesSlice';

// Icon options for apps
const APP_ICONS = [
  { id: 'dashboard', icon: '📊', name: 'Dashboard' },
  { id: 'shopping-cart', icon: '🛒', name: 'E-commerce' },
  { id: 'building', icon: '🏢', name: 'Business' },
  { id: 'users', icon: '👥', name: 'HR' },
  { id: 'book', icon: '📚', name: 'Education' },
  { id: 'calendar', icon: '📅', name: 'Events' },
  { id: 'chart-bar', icon: '📈', name: 'Analytics' },
  { id: 'clipboard', icon: '📋', name: 'Tasks' },
  { id: 'cog', icon: '⚙️', name: 'Settings' },
  { id: 'database', icon: '🗄️', name: 'Database' },
  { id: 'envelope', icon: '✉️', name: 'Communication' },
  { id: 'globe', icon: '🌐', name: 'Web' },
  { id: 'heart', icon: '❤️', name: 'Health' },
  { id: 'home', icon: '🏠', name: 'Home' },
  { id: 'lightbulb', icon: '💡', name: 'Ideas' },
  { id: 'map', icon: '🗺️', name: 'Location' },
  { id: 'money', icon: '💰', name: 'Finance' },
  { id: 'music', icon: '🎵', name: 'Media' },
  { id: 'phone', icon: '📞', name: 'Contact' },
  { id: 'plane', icon: '✈️', name: 'Travel' },
  { id: 'rocket', icon: '🚀', name: 'Startup' },
  { id: 'shield', icon: '🛡️', name: 'Security' },
  { id: 'star', icon: '⭐', name: 'Favorites' },
  { id: 'trophy', icon: '🏆', name: 'Achievements' },
  { id: 'wrench', icon: '🔧', name: 'Tools' }
];

function AppCreationForm({ onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const { items: databases, status: dbStatus } = useSelector(state => state.databases);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    databaseId: '',
    icon: 'dashboard',
    authEnabled: false,
    theme: 'default',
    publicAccess: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'App name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'App name must be at least 2 characters';
    }

    if (!formData.databaseId) {
      newErrors.databaseId = 'Please select a database';
    }

    if (!formData.icon) {
      newErrors.icon = 'Please select an icon';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const appData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim()
      };

      await dispatch(addApp(appData)).unwrap();

      if (onSuccess) {
        onSuccess();
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        databaseId: '',
        icon: 'dashboard',
        authEnabled: false,
        theme: 'default',
        publicAccess: false
      });

    } catch (error) {
      setErrors({ submit: error || 'Failed to create app' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIcon = APP_ICONS.find(icon => icon.id === formData.icon);

  return (
    <div className="app-creation-form">
      <div className="form-header">
        <h3>Create New App</h3>
        <p>Build a data-driven application with drag-and-drop components</p>
      </div>

      <form onSubmit={handleSubmit} className="creation-form">
        {/* Basic Information */}
        <div className="form-section">
          <h4>Basic Information</h4>

          <div className="form-group">
            <label htmlFor="app-name">App Name *</label>
            <input
              id="app-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter app name"
              className={errors.name ? 'error' : ''}
              maxLength={50}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="app-description">Description</label>
            <textarea
              id="app-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your app's purpose"
              rows={3}
              maxLength={200}
            />
          </div>
        </div>

        {/* Database Connection */}
        <div className="form-section">
          <h4>Database Connection</h4>

          <div className="form-group">
            <label htmlFor="database-select">Database *</label>
            <select
              id="database-select"
              value={formData.databaseId}
              onChange={(e) => handleInputChange('databaseId', e.target.value)}
              className={errors.databaseId ? 'error' : ''}
              disabled={dbStatus === 'loading'}
            >
              <option value="">
                {dbStatus === 'loading' ? 'Loading databases...' : 'Select a database'}
              </option>
              {databases.map(db => (
                <option key={db.id} value={db.id}>
                  {db.name} ({db.host}:{db.port})
                </option>
              ))}
            </select>
            {errors.databaseId && <span className="error-message">{errors.databaseId}</span>}
          </div>
        </div>

        {/* Appearance */}
        <div className="form-section">
          <h4>Appearance</h4>

          <div className="form-group">
            <label>App Icon *</label>
            <div className="icon-selector">
              {APP_ICONS.map(icon => (
                <button
                  key={icon.id}
                  type="button"
                  className={`icon-option ${formData.icon === icon.id ? 'selected' : ''}`}
                  onClick={() => handleInputChange('icon', icon.id)}
                  title={icon.name}
                >
                  <span className="icon-emoji">{icon.icon}</span>
                  <span className="icon-name">{icon.name}</span>
                </button>
              ))}
            </div>
            {errors.icon && <span className="error-message">{errors.icon}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="theme-select">Theme</label>
            <select
              id="theme-select"
              value={formData.theme}
              onChange={(e) => handleInputChange('theme', e.target.value)}
            >
              <option value="default">Default</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
            </select>
          </div>
        </div>

        {/* Security & Access */}
        <div className="form-section">
          <h4>Security & Access</h4>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="auth-enabled"
              checked={formData.authEnabled}
              onChange={(e) => handleInputChange('authEnabled', e.target.checked)}
            />
            <label htmlFor="auth-enabled">
              Enable user authentication
              <span className="help-text">Creates user management system with login/logout</span>
            </label>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="public-access"
              checked={formData.publicAccess}
              onChange={(e) => handleInputChange('publicAccess', e.target.checked)}
            />
            <label htmlFor="public-access">
              Allow public access
              <span className="help-text">App can be accessed without authentication</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="form-section">
          <h4>Preview</h4>
          <div className="app-preview">
            <div className="preview-card">
              <div className="preview-icon">
                {selectedIcon?.icon}
              </div>
              <div className="preview-info">
                <h5>{formData.name || 'App Name'}</h5>
                <p>{formData.description || 'App description'}</p>
                <div className="preview-badges">
                  {formData.authEnabled && <span className="badge">Auth</span>}
                  {formData.publicAccess && <span className="badge">Public</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="error-message submit-error">
            {errors.submit}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create App'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AppCreationForm;