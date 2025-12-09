import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getTableSchema, getTableData, executeQuery, deleteRow } from '../services/api';
import { editApp } from '../store/slices/appsSlice';

const sanitizeIdentifier = (value) => {
  if (!value) return '';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error('Invalid table name provided to data table component');
  }
  return `"${value.replace(/"/g, '""')}"`;
};

const clampLimit = (limit) => {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return 25;
  return Math.min(parsed, 500);
};

function DataTableView({ component, dbId }) {
  const dispatch = useDispatch();
  const { items: apps, activeAppId } = useSelector(state => state.apps);
  const app = apps.find(item => item.id === activeAppId);

  const [schema, setSchema] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const config = component.config || {};
  const tableName = config.tableName || '';
  const limit = clampLimit(config.limit);

  const updateComponentConfig = useCallback((updates) => {
    if (!app) return;
    const updatedComponents = (app.components || []).map(comp =>
      comp.id === component.id
        ? { ...comp, config: { ...comp.config, ...updates } }
        : comp
    );
    dispatch(editApp({ id: app.id, updates: { components: updatedComponents } }));
  }, [app, component.id, dispatch]);

  const pageInfo = useMemo(() => {
    if (!rows.length && offset === 0) return 'No rows to display';
    const start = offset + 1;
    const end = offset + rows.length;
    return `Showing ${start}-${end} of ${totalRows}`;
  }, [rows.length, offset, totalRows]);

  const fetchData = useCallback(async () => {
    if (!dbId || !tableName) return;
    setLoading(true);
    setError('');

    try {
      const safeName = sanitizeIdentifier(tableName);
      const [schemaResponse, dataResponse, countResponse] = await Promise.all([
        getTableSchema(dbId, tableName),
        getTableData(dbId, tableName, limit, offset),
        executeQuery(dbId, `SELECT COUNT(*)::int AS count FROM ${safeName}`)
      ]);

      setSchema(schemaResponse || []);
  const nextRows = dataResponse?.rows || [];
  setRows(nextRows);
  const count = Number(countResponse?.rows?.[0]?.count ?? 0);
  setTotalRows(Number.isFinite(count) ? count : nextRows.length);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load table data');
      setSchema([]);
      setRows([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [dbId, tableName, limit, offset]);

  useEffect(() => {
    setOffset(0);
  }, [tableName, limit]);

  useEffect(() => {
    if (dbId && tableName) {
      fetchData();
    }
  }, [dbId, tableName, fetchData]);

  const handleNext = () => {
    if (offset + limit >= totalRows) return;
    setOffset(prev => prev + limit);
  };

  const handlePrev = () => {
    if (offset === 0) return;
    setOffset(prev => Math.max(0, prev - limit));
  };

  const canNext = offset + limit < totalRows;
  const canPrev = offset > 0;

  const handleDeleteRow = async (row) => {
    if (!window.confirm('Are you sure you want to delete this row?')) return;

    try {
      // Find primary key columns or use first column as identifier
      const primaryKeyColumns = schema.filter(col => col.is_primary_key);
      const identifierColumns = primaryKeyColumns.length > 0 ? primaryKeyColumns : [schema[0]];

      // Build WHERE clause
      const whereConditions = identifierColumns.map(col => {
        const value = row[col.column_name];
        if (value === null || value === undefined) {
          return `${col.column_name} IS NULL`;
        }
        // For simplicity, assume string values; in production, handle types properly
        return `${col.column_name} = '${String(value).replace(/'/g, "''")}'`;
      });

      const where = whereConditions.join(' AND ');

      await deleteRow(dbId, tableName, where);
      // Refresh data after deletion
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete row');
    }
  };

  return (
    <div className="component data-table">
      <div className="component-config" style={{ marginBottom: '1rem' }}>
        <h4>Table Settings</h4>
        {!tableName && <p>Select a table in the component configuration to display data.</p>}
        {tableName && (
          <div className="form-row">
            <div className="form-group">
              <label>Rows per page</label>
              <input
                type="number"
                min="1"
                max="500"
                value={limit}
                onChange={(event) => updateComponentConfig({ limit: clampLimit(event.target.value) })}
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

      {!tableName && !error && <p>Configure a table to preview its data.</p>}

      {tableName && loading && <div className="loading">Loading table data...</div>}

      {tableName && !loading && !error && schema.length > 0 && (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {schema.map(column => (
                    <th key={column.column_name}>{column.column_name}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={schema.length + 1} style={{ textAlign: 'center' }}>No rows returned.</td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={index}>
                      {schema.map(column => (
                        <td key={column.column_name}>
                          {row[column.column_name] !== null && row[column.column_name] !== undefined
                            ? String(row[column.column_name])
                            : 'NULL'}
                        </td>
                      ))}
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteRow(row)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination" style={{ marginTop: '1rem' }}>
            <span>{pageInfo}</span>
            <div className="btn-group">
              <button className="btn btn-secondary" onClick={handlePrev} disabled={!canPrev || loading}>
                Previous
              </button>
              <button className="btn btn-secondary" onClick={handleNext} disabled={!canNext || loading}>
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {tableName && !loading && !error && schema.length === 0 && (
        <div className="empty-state">
          <p>No schema information available for this table.</p>
        </div>
      )}
    </div>
  );
}

export default DataTableView;
