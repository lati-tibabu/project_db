import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DatabaseList from '../components/DatabaseList';
import DatabaseForm from '../components/DatabaseForm';
import DatabaseCreationForm from '../components/DatabaseCreationForm';
import DataViewer from '../components/DataViewer';
import QueryEditor from '../components/QueryEditor';
import AppsBar from '../components/AppsBar';
import AppView from '../components/AppView';
import DatabaseSummaryDashboard from '../components/DatabaseSummaryDashboard';
import { fetchDatabases, setSelectedDatabase } from '../store/slices/databasesSlice';
import { setActiveDatabase } from '../store/slices/dataSlice';

function Home() {
  const dispatch = useDispatch();
  const { items: databases, status, error, selectedId } = useSelector(state => state.databases);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formMode, setFormMode] = useState(null); // 'add' or 'create'
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('databases');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDatabases());
    }
  }, [status, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + D: Add new database
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (activeMainTab === 'databases') {
          setShowAddForm(true);
        }
      }
      // Ctrl/Cmd + 1-3: Switch main tabs
      if ((e.ctrlKey || e.metaKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['dashboard', 'databases', 'apps'];
        if (tabs[tabIndex]) {
          setActiveMainTab(tabs[tabIndex]);
        }
      }
      // Ctrl/Cmd + Shift + 1-3: Switch sub-tabs within databases
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        if (activeMainTab === 'databases') {
          const tabIndex = parseInt(e.key) - 1;
          const tabs = ['databases'];
          if (selectedId) {
            tabs.push('data', 'query');
          }
          if (tabs[tabIndex]) {
            setActiveSubTab(tabs[tabIndex]);
          }
        }
      }
      // Escape: Close forms
      if (e.key === 'Escape') {
        setFormMode(null);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedId, activeMainTab]);

  const handleDatabaseAdded = (database) => {
    setFormMode(null);
    if (database?.id) {
      dispatch(setSelectedDatabase(database.id));
      dispatch(setActiveDatabase(database.id));
      setActiveSubTab('data');
    }
  };

  const handleDatabaseCreated = (database) => {
    setFormMode(null);
    if (database?.id) {
      dispatch(setSelectedDatabase(database.id));
      dispatch(setActiveDatabase(database.id));
      setActiveSubTab('data');
    }
  };

  const handleDatabaseSelect = (id) => {
    dispatch(setSelectedDatabase(id));
    dispatch(setActiveDatabase(id));
    setActiveSubTab('data');
  };

  const loading = status === 'loading' && databases.length === 0;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      {/* Main Tabs */}
      <div className="main-tabs">
        <button
          className={`main-tab ${activeMainTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`main-tab ${activeMainTab === 'databases' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('databases')}
        >
          🗄️ Databases
        </button>
        <button
          className={`main-tab ${activeMainTab === 'apps' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('apps')}
        >
          📱 Apps
        </button>
        <button
          className="main-tab help-tab"
          onClick={() => setShowShortcuts(true)}
          title="Keyboard Shortcuts"
        >
          ?
        </button>
      </div>

      {/* Dashboard Tab Content */}
      {activeMainTab === 'dashboard' && (
        <div className="tab-content">
          <DatabaseSummaryDashboard />
        </div>
      )}

      {/* Databases Tab Content */}
      {activeMainTab === 'databases' && (
        <div className="tab-content">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeSubTab === 'databases' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('databases')}
            >
              Databases
            </button>
            {selectedId && (
              <>
                <button
                  className={`nav-tab ${activeSubTab === 'data' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('data')}
                >
                  View Data
                </button>
                <button
                  className={`nav-tab ${activeSubTab === 'query' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('query')}
                >
                  Query Editor
                </button>
              </>
            )}
          </div>

          {activeSubTab === 'databases' && (
            <>
              {!formMode && (
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setFormMode('add')}
                  >
                    ➕ Add Database
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setFormMode('create')}
                  >
                    🏗️ Create & Add Database
                  </button>
                </div>
              )}

              {status === 'failed' && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                  Failed to load databases: {error}
                </div>
              )}

              {formMode === 'add' && (
                <DatabaseForm
                  onSuccess={handleDatabaseAdded}
                  onCancel={() => setFormMode(null)}
                />
              )}

              {formMode === 'create' && (
                <DatabaseCreationForm
                  onSuccess={handleDatabaseCreated}
                  onCancel={() => setFormMode(null)}
                />
              )}

              {!formMode && (
                <DatabaseList onSelect={handleDatabaseSelect} />
              )}
            </>
          )}

          {activeSubTab === 'data' && selectedId && (
            <DataViewer databaseId={selectedId} />
          )}

          {activeSubTab === 'query' && selectedId && (
            <QueryEditor databaseId={selectedId} />
          )}
        </div>
      )}

      {/* Apps Tab Content */}
      {activeMainTab === 'apps' && (
        <div className="tab-content">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ width: '280px' }}>
              <AppsBar />
            </div>
            <div style={{ flex: 1 }}>
              <AppView />
            </div>
          </div>
        </div>
      )}

      {showShortcuts && (
        <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="modal shortcuts-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="modal-close" onClick={() => setShowShortcuts(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="shortcuts-list">
                <div className="shortcut-item">
                  <kbd>Ctrl+D</kbd>
                  <span>Add new database (when in Databases tab)</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+1</kbd>
                  <span>Switch to Dashboard tab</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+2</kbd>
                  <span>Switch to Databases tab</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+3</kbd>
                  <span>Switch to Apps tab</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+Shift+1</kbd>
                  <span>Databases sub-tab</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+Shift+2</kbd>
                  <span>Data View sub-tab</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl+Shift+3</kbd>
                  <span>Query Editor sub-tab</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Close forms/modals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
