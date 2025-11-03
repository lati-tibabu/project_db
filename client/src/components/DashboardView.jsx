import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTableData, executeQuery, getTableSchema } from '../services/api';

const sanitizeIdentifier = (value) => {
  if (!value) return '';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error('Invalid table name');
  }
  return `"${value.replace(/"/g, '""')}"`;
};

const summarizeRows = (rows = []) => {
  if (!rows.length) return { columns: [], rows: [] };
  const columns = Object.keys(rows[0]);
  return { columns, rows };
};

function DashboardView({ component, app, tables = [] }) {
  const dbId = app?.databaseId;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableStats, setTableStats] = useState([]);
  const [highlight, setHighlight] = useState({ table: '', sample: { columns: [], rows: [] } });
  const [schemaMap, setSchemaMap] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!dbId || !tables.length) return;
    setLoading(true);
    setError('');

    try {
      const limitedTables = tables.slice(0, 8);
      const stats = [];
      let busiest = { table: '', count: -1 };
      const schemaAcc = {};

      for (const table of limitedTables) {
        const safeName = sanitizeIdentifier(table);
        const [{ rows: countRows }, dataResponse, schemaResponse] = await Promise.all([
          executeQuery(dbId, `SELECT COUNT(*)::int AS count FROM ${safeName}`),
          getTableData(dbId, table, 5, 0),
          getTableSchema(dbId, table)
        ]);

        const count = Number(countRows?.[0]?.count || 0);
        stats.push({ table, count });
        schemaAcc[table] = schemaResponse || [];

        if (count > busiest.count) {
          busiest = { table, count, sample: summarizeRows(dataResponse?.rows) };
        }
      }

      setTableStats(stats);
      setSchemaMap(schemaAcc);
      setHighlight({ table: busiest.table, sample: busiest.sample || { columns: [], rows: [] } });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
      setTableStats([]);
      setHighlight({ table: '', sample: { columns: [], rows: [] } });
    } finally {
      setLoading(false);
    }
  }, [dbId, tables]);

  useEffect(() => {
    if (dbId && tables.length) {
      fetchDashboardData();
    }
  }, [dbId, tables, fetchDashboardData]);

  const totalRecords = useMemo(
    () => tableStats.reduce((acc, item) => acc + item.count, 0),
    [tableStats]
  );

  const zeroRowTables = useMemo(
    () => tableStats.filter(item => item.count === 0).map(item => item.table),
    [tableStats]
  );

  return (
    <div className="component dashboard-view">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem' }}>{component.name || 'Dashboard'}</h3>
          <small>Connected to database: {dbId || 'Not selected'}</small>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary" onClick={fetchDashboardData} disabled={loading || !dbId}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
      {!error && !dbId && <p style={{ marginTop: '1rem' }}>Link this app to a database to view dashboard insights.</p>}

      {dbId && loading && <div className="loading" style={{ marginTop: '1rem' }}>Loading dashboard metrics...</div>}

      {dbId && !loading && !error && (
        <>
          <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="stat-card">
              <h4>Total Tables</h4>
              <span className="stat-value">{tables.length}</span>
            </div>
            <div className="stat-card">
              <h4>Total Records (sampled)</h4>
              <span className="stat-value">{totalRecords}</span>
            </div>
            <div className="stat-card">
              <h4>Tables with Data</h4>
              <span className="stat-value">{tableStats.filter(item => item.count > 0).length}</span>
            </div>
            <div className="stat-card">
              <h4>Empty Tables</h4>
              <span className="stat-value">{zeroRowTables.length}</span>
            </div>
          </div>

          {zeroRowTables.length > 0 && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              Tables without data: {zeroRowTables.join(', ')}
            </div>
          )}

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <h4>Tables Overview</h4>
            {tableStats.length === 0 ? (
              <div className="empty-state">
                <p>No tables found.</p>
              </div>
            ) : (
              <table style={{ width: '100%', marginTop: '0.75rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Table</th>
                    <th style={{ textAlign: 'right' }}>Rows</th>
                    <th style={{ textAlign: 'left' }}>Columns</th>
                  </tr>
                </thead>
                <tbody>
                  {tableStats.map(stat => (
                    <tr key={stat.table}>
                      <td>{stat.table}</td>
                      <td style={{ textAlign: 'right' }}>{stat.count}</td>
                      <td>
                        {(schemaMap[stat.table] || []).map(col => col.column_name).slice(0, 5).join(', ') || '—'}
                        {(schemaMap[stat.table] || []).length > 5 && '…'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {highlight.table && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4>Sample Rows: {highlight.table}</h4>
                <small>Showing up to 5 rows</small>
              </div>
              {highlight.sample.rows.length === 0 ? (
                <div className="empty-state">
                  <p>No sample data available.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {highlight.sample.columns.map(column => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {highlight.sample.rows.map((row, index) => (
                        <tr key={index}>
                          {highlight.sample.columns.map(column => (
                            <td key={column}>{row[column] !== null && row[column] !== undefined ? String(row[column]) : 'NULL'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {lastUpdated && (
            <small style={{ display: 'block', marginTop: '1rem' }}>
              Last refreshed: {lastUpdated.toLocaleTimeString()}
            </small>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardView;
