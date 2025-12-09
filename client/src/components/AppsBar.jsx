import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApps, addApp, openAppInTab, closeAppTab, setActiveApp } from '../store/slices/appsSlice';
import { fetchDatabases } from '../store/slices/databasesSlice';
import AppCreationForm from './AppCreationForm';

function AppsBar() {
  const dispatch = useDispatch();
  const { items: apps, status } = useSelector(s => s.apps);
  const { items: databases } = useSelector(s => s.databases);
  const selectedAppId = useSelector(s => s.apps.activeAppId);
  const openAppIds = useSelector(s => s.apps.openAppIds);
  
  // State for theme management
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || 'default';
  });
  
  // State for app creation form
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getIconEmoji = (iconId) => {
    const icons = {
      'dashboard': '📊', 'shopping-cart': '🛒', 'building': '🏢', 'users': '👥',
      'book': '📚', 'calendar': '📅', 'chart-bar': '📈', 'clipboard': '📋',
      'cog': '⚙️', 'database': '🗄️', 'envelope': '✉️', 'globe': '🌐',
      'heart': '❤️', 'home': '🏠', 'lightbulb': '💡', 'map': '🗺️',
      'money': '💰', 'music': '🎵', 'phone': '📞', 'plane': '✈️',
      'rocket': '🚀', 'shield': '🛡️', 'star': '⭐', 'trophy': '🏆', 'wrench': '🔧'
    };
    return icons[iconId] || '📱';
  };

  const getDatabaseName = (databaseId) => {
    const db = databases.find(d => d.id === databaseId);
    return db ? db.name : 'Unknown Database';
  };

  useEffect(() => {
    if (status === 'idle') dispatch(fetchApps());
    dispatch(fetchDatabases());
  }, [status, dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const handleCreateApp = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="apps-bar card">
      <div className="apps-bar-header">
        <h3>Apps</h3>
        <div className="theme-selector">
          <label>Theme:</label>
          <select value={currentTheme} onChange={e => setCurrentTheme(e.target.value)}>
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="purple">Purple</option>
            <option value="green">Green</option>
          </select>
        </div>
      </div>
      <div className="apps-list">
        {apps.map(a => (
          <div
            key={a.id}
            className={`app-item ${selectedAppId === a.id ? 'active' : ''} ${openAppIds.includes(a.id) ? 'open' : ''}`}
          >
            <div className="app-icon">
              {a.icon ? getIconEmoji(a.icon) : '📱'}
            </div>
            <div className="app-info">
              <span className="app-name" onClick={() => dispatch(setActiveApp(a.id))}>
                {a.name}
              </span>
              <span className="app-database">{getDatabaseName(a.databaseId)}</span>
            </div>
            <div className="app-actions">
              {!openAppIds.includes(a.id) ? (
                <button
                  className="btn btn-sm"
                  onClick={() => dispatch(openAppInTab(a.id))}
                  title="Open in app tab"
                >
                  ➕
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => dispatch(closeAppTab(a.id))}
                  title="Close tab"
                >
                  ✕
                </button>
              )}
              <button
                className="btn btn-sm"
                onClick={() => window.open(`/app/${a.id}`, '_blank')}
                title="Open in new browser tab"
              >
                ↗
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="apps-actions">
        <button className="btn btn-primary" onClick={handleCreateApp}>
          ➕ Create New App
        </button>
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={handleCreateCancel}>
          <div className="modal app-creation-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <AppCreationForm
                onSuccess={handleCreateSuccess}
                onCancel={handleCreateCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppsBar;
