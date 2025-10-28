import React, { useState, useEffect } from 'react';
import DatabaseList from '../components/DatabaseList';
import DatabaseForm from '../components/DatabaseForm';
import DataViewer from '../components/DataViewer';
import QueryEditor from '../components/QueryEditor';
import { getDatabases } from '../services/api';

function Home() {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('databases');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const data = await getDatabases();
      setDatabases(data);
    } catch (err) {
      console.error('Failed to load databases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseAdded = () => {
    setShowAddForm(false);
    loadDatabases();
  };

  const handleDatabaseSelect = (id) => {
    setSelectedDatabase(id);
    setActiveTab('data');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'databases' ? 'active' : ''}`}
          onClick={() => setActiveTab('databases')}
        >
          Databases
        </button>
        {selectedDatabase && (
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

          {showAddForm ? (
            <DatabaseForm
              onSuccess={handleDatabaseAdded}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <DatabaseList
              databases={databases}
              onSelect={handleDatabaseSelect}
              onDelete={loadDatabases}
              onTest={loadDatabases}
              selectedId={selectedDatabase}
            />
          )}
        </>
      )}

      {activeTab === 'data' && selectedDatabase && (
        <DataViewer databaseId={selectedDatabase} />
      )}

      {activeTab === 'query' && selectedDatabase && (
        <QueryEditor databaseId={selectedDatabase} />
      )}
    </div>
  );
}

export default Home;
