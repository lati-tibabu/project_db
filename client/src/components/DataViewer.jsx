import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTables,
  fetchSchema,
  fetchTableRows,
  setActiveDatabase,
  setSelectedTable,
  setPagination,
  createDatabaseTable,
  insertTableRow
} from '../store/slices/dataSlice';
import { deleteRow } from '../services/api';

const createEmptyColumn = () => ({ name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '', isPrimaryKey: false });
const createEmptyForeignKey = () => ({ column: '', referencesTable: '', referencesColumn: '', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' });

function DataViewer({ databaseId, dbId }) {
  const resolvedDbId = databaseId ?? dbId;
  const dispatch = useDispatch();
  const {
    activeDatabaseId,
    tables,
    tablesStatus,
    tablesError,
    selectedTable,
    schema,
    schemaStatus,
    schemaError,
    tableResult,
    tableDataStatus,
    tableDataError,
    pagination,
    lastRefreshedAt,
    createTableStatus,
    createTableError,
    insertRowStatus,
    insertRowError
  } = useSelector(state => state.data);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    tableName: '',
    columns: [createEmptyColumn()],
    foreignKeys: []
  });
  const [localCreateError, setLocalCreateError] = useState('');
  const [showInsertForm, setShowInsertForm] = useState(false);
  const [insertForm, setInsertForm] = useState({});
  const [tablesPage, setTablesPage] = useState(1);
  const tablesPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!resolvedDbId) return;
    if (activeDatabaseId !== resolvedDbId) {
      dispatch(setActiveDatabase(resolvedDbId));
    }
  }, [resolvedDbId, activeDatabaseId, dispatch]);

  useEffect(() => {
    if (!resolvedDbId) return;
    if (activeDatabaseId !== resolvedDbId) return;
    if (tablesStatus === 'idle') {
      dispatch(fetchTables(resolvedDbId));
    }
  }, [resolvedDbId, activeDatabaseId, tablesStatus, dispatch]);

  useEffect(() => {
    if (!resolvedDbId || !selectedTable) return;
    dispatch(fetchSchema({ dbId: resolvedDbId, tableName: selectedTable }));
  }, [resolvedDbId, selectedTable, dispatch]);

  useEffect(() => {
    if (!resolvedDbId || !selectedTable) return;
    dispatch(fetchTableRows({
      dbId: resolvedDbId,
      tableName: selectedTable,
      limit: pagination.limit,
      offset: pagination.offset
    }));
  }, [resolvedDbId, selectedTable, pagination.limit, pagination.offset, dispatch]);

  const tablesLoading = tablesStatus === 'loading';
  const dataLoading = tableDataStatus === 'loading';
  const schemaLoading = schemaStatus === 'loading';

  const handleSelectTable = (table) => {
    if (selectedTable === table) return;
    dispatch(setSelectedTable(table));
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    dispatch(setPagination({ offset: newOffset }));
  };

  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    dispatch(setPagination({ offset: newOffset }));
  };

  const handleRefresh = () => {
    if (!resolvedDbId) return;
    dispatch(fetchTables(resolvedDbId));
    if (selectedTable) {
      dispatch(fetchSchema({ dbId: resolvedDbId, tableName: selectedTable }));
      dispatch(fetchTableRows({
        dbId: resolvedDbId,
        tableName: selectedTable,
        limit: pagination.limit,
        offset: pagination.offset
      }));
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      tableName: '',
      columns: [createEmptyColumn()],
      foreignKeys: []
    });
  };

  const handleInsertRow = async () => {
    if (!resolvedDbId || !selectedTable) return;
    try {
      await dispatch(insertTableRow({
        dbId: resolvedDbId,
        tableName: selectedTable,
        rowData: insertForm
      })).unwrap();
      setInsertForm({});
      setShowInsertForm(false);
    } catch (err) {
      // Error is handled in Redux
    }
  };

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

      await deleteRow(resolvedDbId, selectedTable, where);
      // Refresh data after deletion
      dispatch(fetchTableRows({
        dbId: resolvedDbId,
        tableName: selectedTable,
        limit: pagination.limit,
        offset: pagination.offset
      }));
    } catch (err) {
      alert('Failed to delete row: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    }
  };

  const addColumn = () => {
    setCreateForm(prev => ({
      ...prev,
      columns: [...prev.columns, createEmptyColumn()]
    }));
  };

  const updateColumn = (index, field, value) => {
    setCreateForm(prev => ({
      ...prev,
      columns: prev.columns.map((col, i) => (i === index ? { ...col, [field]: value } : col))
    }));
  };

  const removeColumn = (index) => {
    setCreateForm(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  const addForeignKey = () => {
    setCreateForm(prev => ({
      ...prev,
      foreignKeys: [...prev.foreignKeys, createEmptyForeignKey()]
    }));
  };

  const updateForeignKey = (index, field, value) => {
    setCreateForm(prev => ({
      ...prev,
      foreignKeys: prev.foreignKeys.map((fk, i) => (i === index ? { ...fk, [field]: value } : fk))
    }));
  };

  const removeForeignKey = (index) => {
    setCreateForm(prev => ({
      ...prev,
      foreignKeys: prev.foreignKeys.filter((_, i) => i !== index)
    }));
  };

  const tablesTotalPages = Math.ceil(tables.length / tablesPerPage);
  const tablesStartIndex = (tablesPage - 1) * tablesPerPage;
  const tablesEndIndex = tablesStartIndex + tablesPerPage;
  const paginatedTables = tables.slice(tablesStartIndex, tablesEndIndex);

  const handleTablesPageChange = (page) => {
    setTablesPage(page);
  };

  // Filter tables based on search term
  const filteredTables = tables.filter(table =>
    table.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTablesTotalPages = Math.ceil(filteredTables.length / tablesPerPage);
  const filteredTablesStartIndex = (tablesPage - 1) * tablesPerPage;
  const filteredTablesEndIndex = filteredTablesStartIndex + tablesPerPage;
  const paginatedFilteredTables = filteredTables.slice(filteredTablesStartIndex, filteredTablesEndIndex);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setTablesPage(1); // Reset to first page when searching
  };

  const rows = tableResult?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const lastRefreshedLabel = lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : 'Never';

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Tables</h2>
          <div className="btn-group">
            <button className="btn" onClick={handleRefresh} disabled={tablesLoading}>
              Refresh
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              Create Table
            </button>
          </div>
        </div>
        {tablesError && <div className="alert alert-error">{tablesError}</div>}
        {tablesLoading && tables.length === 0 ? (
          <div className="loading">Loading tables...</div>
        ) : tables.length === 0 ? (
          <div className="empty-state">
            <p>No tables found in this database</p>
          </div>
        ) : (
          <>
            <div className="search-container" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search tables..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              {searchTerm && (
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                  Showing {filteredTables.length} of {tables.length} tables
                </small>
              )}
            </div>
            <div className="table-list">
              {paginatedFilteredTables.map(table => (
                <div
                  key={table}
                  className="table-item"
                  onClick={() => handleSelectTable(table)}
                  style={{
                    backgroundColor: selectedTable === table ? '#f0f8ff' : 'white',
                    borderColor: selectedTable === table ? '#3498db' : '#e0e0e0'
                  }}
                >
                  {table}
                </div>
              ))}
            </div>
          </>
        )}
        
        {filteredTablesTotalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary"
              onClick={() => handleTablesPageChange(tablesPage - 1)}
              disabled={tablesPage === 1}
            >
              Previous
            </button>
            <span>Page {tablesPage} of {filteredTablesTotalPages}</span>
            <button
              className="btn btn-secondary"
              onClick={() => handleTablesPageChange(tablesPage + 1)}
              disabled={tablesPage === filteredTablesTotalPages}
            >
              Next
            </button>
          </div>
        )}
        <small>Last refreshed: {lastRefreshedLabel}</small>
      </div>

      {selectedTable && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Table: {selectedTable}</h2>
            <button className="btn" onClick={handleRefresh} disabled={dataLoading}>
              Refresh
            </button>
          </div>

          {schemaError && <div className="alert alert-error">{schemaError}</div>}
          {schemaLoading ? (
            <div className="loading">Loading schema...</div>
          ) : schema.length > 0 && (
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
                    {schema.map((column, idx) => (
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
          {tableDataError && <div className="alert alert-error">{tableDataError}</div>}
          {dataLoading ? (
            <div className="loading">Loading data...</div>
          ) : rows.length > 0 ? (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {columns.map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        {columns.map((key) => (
                          <td key={key}>{row[key] !== null ? String(row[key]) : 'NULL'}</td>
                        ))}
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteRow(row)}
                            disabled={dataLoading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0 || dataLoading}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span>Page {Math.floor(pagination.offset / pagination.limit) + 1}</span>
                <button
                  onClick={handleNextPage}
                  disabled={rows.length < pagination.limit || dataLoading}
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

          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => setShowInsertForm(true)}>
              Add Row
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="card">
          <h2>Create New Table</h2>
          {(localCreateError || createTableError) && (
            <div className="alert alert-error">{localCreateError || createTableError}</div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleCreateTable(); }}>
            <div className="form-group">
              <label htmlFor="tableName">Table Name *</label>
              <input
                type="text"
                id="tableName"
                value={createForm.tableName}
                onChange={(e) => setCreateForm(prev => ({ ...prev, tableName: e.target.value }))}
                required
                placeholder="users"
              />
            </div>

            <h3>Columns</h3>
            {createForm.columns.map((col, index) => (
              <div key={index} className="column-row">
                <input
                  type="text"
                  placeholder="Column name"
                  value={col.name}
                  onChange={(e) => updateColumn(index, 'name', e.target.value)}
                  required
                />
                <select
                  value={col.type}
                  onChange={(e) => updateColumn(index, 'type', e.target.value)}
                >
                  <option value="VARCHAR(255)">VARCHAR(255)</option>
                  <option value="TEXT">TEXT</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="BIGINT">BIGINT</option>
                  <option value="SERIAL">SERIAL</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="DATE">DATE</option>
                  <option value="TIMESTAMP">TIMESTAMP</option>
                  <option value="DECIMAL(10,2)">DECIMAL(10,2)</option>
                </select>
                <label>
                  <input
                    type="checkbox"
                    checked={!col.nullable}
                    onChange={(e) => updateColumn(index, 'nullable', !e.target.checked)}
                  />
                  NOT NULL
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={col.isPrimaryKey}
                    onChange={(e) => updateColumn(index, 'isPrimaryKey', e.target.checked)}
                  />
                  Primary Key
                </label>
                <input
                  type="text"
                  placeholder="Default value"
                  value={col.defaultValue}
                  onChange={(e) => updateColumn(index, 'defaultValue', e.target.value)}
                />
                <button type="button" onClick={() => removeColumn(index)} className="btn btn-danger">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addColumn} className="btn btn-secondary">Add Column</button>

            <h3>Foreign Keys (Relationships)</h3>
            {createForm.foreignKeys.map((fk, index) => (
              <div key={index} className="fk-row">
                <select
                  value={fk.column}
                  onChange={(e) => updateForeignKey(index, 'column', e.target.value)}
                >
                  <option value="">Select column</option>
                  {createForm.columns.map((col, i) => (
                    <option key={i} value={col.name}>{col.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="References table"
                  value={fk.referencesTable}
                  onChange={(e) => updateForeignKey(index, 'referencesTable', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="References column"
                  value={fk.referencesColumn}
                  onChange={(e) => updateForeignKey(index, 'referencesColumn', e.target.value)}
                />
                <select
                  value={fk.onDelete}
                  onChange={(e) => updateForeignKey(index, 'onDelete', e.target.value)}
                >
                  <option value="NO ACTION">NO ACTION</option>
                  <option value="RESTRICT">RESTRICT</option>
                  <option value="CASCADE">CASCADE</option>
                  <option value="SET NULL">SET NULL</option>
                  <option value="SET DEFAULT">SET DEFAULT</option>
                </select>
                <select
                  value={fk.onUpdate}
                  onChange={(e) => updateForeignKey(index, 'onUpdate', e.target.value)}
                >
                  <option value="NO ACTION">NO ACTION</option>
                  <option value="RESTRICT">RESTRICT</option>
                  <option value="CASCADE">CASCADE</option>
                  <option value="SET NULL">SET NULL</option>
                  <option value="SET DEFAULT">SET DEFAULT</option>
                </select>
                <button type="button" onClick={() => removeForeignKey(index)} className="btn btn-danger">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addForeignKey} className="btn btn-secondary">Add Foreign Key</button>

            <div className="btn-group">
              <button type="submit" className="btn btn-primary" disabled={createTableStatus === 'loading'}>
                {createTableStatus === 'loading' ? 'Creating...' : 'Create Table'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetCreateForm();
                  setLocalCreateError('');
                  setShowCreateForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showInsertForm && selectedTable && schema.length > 0 && (
        <div className="card">
          <h2>Add New Row to {selectedTable}</h2>
          {insertRowError && <div className="alert alert-error">{insertRowError}</div>}

          <form onSubmit={(e) => { e.preventDefault(); handleInsertRow(); }}>
            {schema.map((col) => (
              <div key={col.column_name} className="form-group">
                <label htmlFor={col.column_name}>{col.column_name} ({col.data_type})</label>
                <input
                  type="text"
                  id={col.column_name}
                  value={insertForm[col.column_name] || ''}
                  onChange={(e) => setInsertForm(prev => ({ ...prev, [col.column_name]: e.target.value }))}
                  placeholder={col.is_nullable === 'YES' ? 'Optional' : 'Required'}
                />
              </div>
            ))}

            <div className="btn-group">
              <button type="submit" className="btn btn-primary" disabled={insertRowStatus === 'loading'}>
                {insertRowStatus === 'loading' ? 'Inserting...' : 'Insert Row'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setInsertForm({});
                  setShowInsertForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default DataViewer;
