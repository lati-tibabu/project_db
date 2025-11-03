import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApps, addApp, openAppInTab, closeAppTab, setActiveApp } from '../store/slices/appsSlice';
import { fetchDatabases } from '../store/slices/databasesSlice';

function AppsBar() {
  const dispatch = useDispatch();
  const { items: apps, status } = useSelector(s => s.apps);
  const { items: databases } = useSelector(s => s.databases);
  const selectedAppId = useSelector(s => s.apps.activeAppId);
  const openAppIds = useSelector(s => s.apps.openAppIds);

  const [form, setForm] = useState({ name: '', databaseId: '', description: '', authEnabled: false });
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'default');

  useEffect(() => {
    if (status === 'idle') dispatch(fetchApps());
    dispatch(fetchDatabases());
  }, [status, dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.databaseId) return;
    try {
      await dispatch(addApp(form)).unwrap();
      setForm({ name: '', databaseId: '', description: '', authEnabled: false });
    } catch (err) {
      // handle error lightly
      alert(err || 'Failed to create app');
    }
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
            <span onClick={() => dispatch(setActiveApp(a.id))}>
              {a.name}
            </span>
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

      <form onSubmit={handleCreate} className="app-create-form">
        <input placeholder="App name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <select value={form.databaseId} onChange={e => setForm(f => ({ ...f, databaseId: e.target.value }))}>
          <option value="">Link database...</option>
          {databases.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <div className="checkbox-group" style={{ marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            id="authEnabled"
            checked={form.authEnabled}
            onChange={e => setForm(f => ({ ...f, authEnabled: e.target.checked }))}
          />
          <label htmlFor="authEnabled" style={{ fontSize: '0.9rem' }}>Enable user authentication</label>
        </div>
        <button className="btn btn-primary" type="submit">Create App</button>
      </form>
    </div>
  );
}

export default AppsBar;
