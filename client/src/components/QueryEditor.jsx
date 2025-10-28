import React, { useState } from 'react';
import { executeQuery } from '../services/api';

function QueryEditor({ databaseId }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await executeQuery(databaseId, query);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setError('');
  };

  return (
    <div className="card">
      <h2>SQL Query Editor</h2>
      
      <div className="form-group">
        <label htmlFor="query">Enter your SQL query</label>
        <textarea
          id="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM table_name LIMIT 10;"
          style={{ minHeight: '150px', fontFamily: 'monospace' }}
        />
      </div>

      <div className="btn-group">
        <button
          className="btn btn-primary"
          onClick={handleExecute}
          disabled={loading}
        >
          {loading ? 'Executing...' : 'Execute Query'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="query-result">
          <h3>Query Result</h3>
          <div className="alert alert-success">
            Query executed successfully. Rows affected: {result.rowCount || 0}
          </div>

          {result.rows && result.rows.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {Object.keys(result.rows[0]).map(key => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{value !== null ? String(value) : 'NULL'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.rows && result.rows.length === 0 && (
            <div className="empty-state">
              <p>Query returned no rows</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QueryEditor;
