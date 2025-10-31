import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DatabaseList from '../components/DatabaseList';
import DatabaseForm from '../components/DatabaseForm';
import DataViewer from '../components/DataViewer';
import QueryEditor from '../components/QueryEditor';
import AppsBar from '../components/AppsBar';
import AppView from '../components/AppView';
import { fetchDatabases, setSelectedDatabase } from '../store/slices/databasesSlice';
import { setActiveDatabase } from '../store/slices/dataSlice';

function Home() {
  const dispatch = useDispatch();
  const { items: databases, status, error, selectedId } = useSelector(state => state.databases);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('databases');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDatabases());
    }
  }, [status, dispatch]);

  const handleDatabaseAdded = (database) => {
    setShowAddForm(false);
    if (database?.id) {
      dispatch(setSelectedDatabase(database.id));
      dispatch(setActiveDatabase(database.id));
      setActiveTab('data');
    }
  };

  const handleDatabaseSelect = (id) => {
    dispatch(setSelectedDatabase(id));
    dispatch(setActiveDatabase(id));
    setActiveTab('data');
  };

  const loading = status === 'loading' && databases.length === 0;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ width: '280px' }}>
          <AppsBar />
        </div>
        <div style={{ flex: 1 }}>
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'databases' ? 'active' : ''}`}
          onClick={() => setActiveTab('databases')}
        >
          Databases
    </button>
    {selectedId && (
          <>
            <button
              className={`nav-tab ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              View Data
            </button>
            <button
              className={`nav-tab ${activeTab === 'query' ? 'active' : ''}`}
              onClick={() => setActiveTab('query')}
            >
              Query Editor
            </button>
          </>
        )}
      </div>

      {activeTab === 'databases' && (
        <>
          {!showAddForm && (
            <div style={{ marginBottom: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                ➕ Add New Database
              </button>
            </div>
          )}

          {status === 'failed' && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              Failed to load databases: {error}
            </div>
          )}

          {showAddForm ? (
            <DatabaseForm
              onSuccess={handleDatabaseAdded}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <DatabaseList onSelect={handleDatabaseSelect} />
          )}
        </>
      )}

      {activeTab === 'data' && selectedId && (
        <DataViewer databaseId={selectedId} />
      )}

      {activeTab === 'query' && selectedId && (
        <QueryEditor databaseId={selectedId} />
      )}
        </div>
        <div style={{ width: '480px' }}>
          <AppView />
        </div>
      </div>
    </div>
  );
}

export default Home;
