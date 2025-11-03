import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTableSchema, getTableData } from '../services/api';
import { editApp } from '../store/slices/appsSlice';

const numericTypes = new Set([
  'smallint',
  'integer',
  'bigint',
  'decimal',
  'numeric',
  'real',
  'double precision'
]);

const sanitizeIdentifier = (value) => {
  if (!value) return '';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error('Invalid table name provided to metrics component');
  }
  return value;
};

const clampSampleSize = (size) => {
  const parsed = Number(size);
  if (!Number.isFinite(parsed) || parsed <= 0) return 500;
  return Math.min(parsed, 2000);
};

function MetricsView({ component, dbId }) {
  const dispatch = useDispatch();
  const { items: apps, activeAppId } = useSelector(state => state.apps);
  const app = apps.find(item => item.id === activeAppId);

  const [schema, setSchema] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const config = component.config || {};
  const tableName = config.tableName || '';
  const sampleSize = clampSampleSize(config.sampleSize);

  const updateComponentConfig = useCallback((updates) => {
    if (!app) return;
    const updatedComponents = (app.components || []).map(comp =>
      comp.id === component.id
        ? { ...comp, config: { ...comp.config, ...updates } }
        : comp
    );
    dispatch(editApp({ id: app.id, updates: { components: updatedComponents } }));
  }, [app, component.id, dispatch]);

  const fetchData = useCallback(async () => {
    if (!dbId || !tableName) return;
    setLoading(true);
    setError('');

    try {
      sanitizeIdentifier(tableName);
      const [schemaResponse, dataResponse] = await Promise.all([
        getTableSchema(dbId, tableName),
        getTableData(dbId, tableName, sampleSize, 0)
      ]);

      setSchema(schemaResponse || []);
      setRows(dataResponse?.rows || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load metrics');
      setSchema([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dbId, tableName, sampleSize]);

  useEffect(() => {
    if (dbId && tableName) {
      fetchData();
    }
  }, [dbId, tableName, fetchData]);

  const numericColumns = useMemo(() =>
    schema.filter(column => numericTypes.has(column.data_type)).map(column => column.column_name),
    [schema]
  );

  const stringColumns = useMemo(() =>
    schema.filter(column => !numericTypes.has(column.data_type)).map(column => column.column_name),
    [schema]
  );

  const summarisedMetrics = useMemo(() => {
    if (!rows.length) return [];
    return numericColumns.map(column => {
      const values = rows
        .map(row => Number(row[column]))
        .filter(value => Number.isFinite(value));

      if (!values.length) {
        return { column, count: 0, sum: 0, avg: 0, min: null, max: null };
      }

      const sum = values.reduce((acc, value) => acc + value, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      return {
        column,
        count: values.length,
        sum,
        avg,
        min,
        max
      };
    });
  }, [rows, numericColumns]);

  const categoricalHighlights = useMemo(() => {
    if (!rows.length || !stringColumns.length) return [];
    const column = stringColumns[0];
    const counts = rows.reduce((acc, row) => {
      const key = row[column] ?? '—';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count, column }));
  }, [rows, stringColumns]);

  return (
    <div className="component metrics">
      <div className="component-config" style={{ marginBottom: '1rem' }}>
        <h4>Metrics Settings</h4>
        {!tableName && <p>Select a table in the component configuration to compute metrics.</p>}
        {tableName && (
          <div className="form-row">
            <div className="form-group">
              <label>Sample Size</label>
              <input
                type="number"
                min="1"
                max="2000"
                value={sampleSize}
                onChange={(event) => updateComponentConfig({ sampleSize: clampSampleSize(event.target.value) })}
              />
            </div>
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-secondary" type="button" onClick={fetchData} disabled={loading}>
                Refresh
              </button>
            </div>
          </div>
        )}
        {lastUpdated && (
          <small>Last updated: {lastUpdated.toLocaleTimeString()}</small>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!tableName && !error && <p>Configure a table to view aggregate metrics.</p>}

      {tableName && loading && <div className="loading">Calculating metrics...</div>}

      {tableName && !loading && !error && (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Total Sampled Rows</h4>
              <div className="metric-value">{rows.length}</div>
              <small>Limited to {sampleSize} rows</small>
            </div>

            {summarisedMetrics.map(metric => (
              <div key={metric.column} className="metric-card">
                <h4>{metric.column}</h4>
                {metric.count === 0 ? (
                  <p>No numeric data available.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                    <li>Average: {metric.avg.toFixed(2)}</li>
                    <li>Sum: {metric.sum.toFixed(2)}</li>
                    <li>Min: {metric.min}</li>
                    <li>Max: {metric.max}</li>
                  </ul>
                )}
              </div>
            ))}
          </div>

          {categoricalHighlights.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h4>Top Values ({categoricalHighlights[0].column})</h4>
              <table style={{ width: '100%', marginTop: '0.75rem' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Value</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {categoricalHighlights.map(item => (
                    <tr key={item.value}>
                      <td>{item.value}</td>
                      <td style={{ textAlign: 'right' }}>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h4>Sample Rows</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(rows[0]).map(column => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {Object.keys(row).map(column => (
                          <td key={column}>
                            {row[column] !== null && row[column] !== undefined ? String(row[column]) : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MetricsView;
