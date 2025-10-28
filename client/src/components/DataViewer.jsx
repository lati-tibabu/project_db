import React, { useState, useEffect } from 'react';
import { getTables, getTableData, getTableSchema } from '../services/api';

function DataViewer({ databaseId }) {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState(null);
  const [tableSchema, setTableSchema] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ limit: 100, offset: 0 });

  useEffect(() => {
    loadTables();
  }, [databaseId]);

  useEffect(() => {
    if (selectedTable) {
      loadTableData();
      loadTableSchema();
    }
  }, [selectedTable, pagination]);

  const loadTables = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTables(databaseId);
      setTables(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTableData(databaseId, selectedTable, pagination.limit, pagination.offset);
      setTableData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load table data');
    } finally {
      setLoading(false);
    }
  };

  const loadTableSchema = async () => {
    try {
      const schema = await getTableSchema(databaseId, selectedTable);
      setTableSchema(schema);
    } catch (err) {
      console.error('Failed to load schema:', err);
    }
  };

  const handleNextPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  const handlePrevPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }));
  };

  if (loading && !tableData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="card">
        <h2>Tables</h2>
        {error && <div className="alert alert-error">{error}</div>}
        
        {tables.length === 0 ? (
          <div className="empty-state">
            <p>No tables found in this database</p>
          </div>
        ) : (
          <div className="table-list">
            {tables.map(table => (
              <div
                key={table}
                className="table-item"
                onClick={() => setSelectedTable(table)}
                style={{
                  backgroundColor: selectedTable === table ? '#f0f8ff' : 'white',
                  borderColor: selectedTable === table ? '#3498db' : '#e0e0e0'
                }}
              >
                {table}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTable && (
        <>
          <div className="card">
            <h2>Table: {selectedTable}</h2>
            
            {tableSchema.length > 0 && (
              <>
                <h3>Schema</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Column Name</th>
                        <th>Data Type</th>
                        <th>Nullable</th>
                        <th>Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSchema.map((column, idx) => (
                        <tr key={idx}>
                          <td>{column.column_name}</td>
                          <td>{column.data_type}</td>
                          <td>{column.is_nullable}</td>
                          <td>{column.column_default || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <h3>Data (Showing {pagination.limit} rows from offset {pagination.offset})</h3>
            
            {tableData && tableData.rows && tableData.rows.length > 0 ? (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(tableData.rows[0]).map(key => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, i) => (
                            <td key={i}>{value !== null ? String(value) : 'NULL'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination">
                  <button
                    onClick={handlePrevPage}
                    disabled={pagination.offset === 0}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <span>Page {Math.floor(pagination.offset / pagination.limit) + 1}</span>
                  <button
                    onClick={handleNextPage}
                    disabled={tableData.rows.length < pagination.limit}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No data found in this table</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default DataViewer;
