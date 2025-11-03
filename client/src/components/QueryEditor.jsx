import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-dark.css';
import {
  Play,
  Square,
  History,
  Clock,
  Database,
  Table,
  Columns,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  Minus
} from 'lucide-react';
import { executeQuery, getTables, getTableSchema } from '../services/api';

function QueryEditor({ databaseId }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableSchema, setTableSchema] = useState([]);
  const [builderMode, setBuilderMode] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [whereConditions, setWhereConditions] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [limit, setLimit] = useState(100);

  const codeMirrorRef = useRef(null);

  useEffect(() => {
    if (databaseId) {
      loadTables();
      loadQueryHistory();
    }
  }, [databaseId]);

  const loadTables = async () => {
    try {
      const tablesData = await getTables(databaseId);
      setTables(tablesData);
    } catch (err) {
      console.error('Failed to load tables:', err);
    }
  };

  const loadTableSchema = async (tableName) => {
    try {
      const schema = await getTableSchema(databaseId, tableName);
      setTableSchema(schema);
      setSelectedTable(tableName);
    } catch (err) {
      console.error('Failed to load table schema:', err);
    }
  };

  const loadQueryHistory = () => {
    const history = JSON.parse(localStorage.getItem(`queryHistory_${databaseId}`) || '[]');
    setQueryHistory(history);
  };

  const saveQueryToHistory = (queryText, resultData, execTime) => {
    const historyItem = {
      id: Date.now(),
      query: queryText,
      timestamp: new Date().toISOString(),
      executionTime: execTime,
      rowCount: resultData?.rowCount || 0,
      success: !error
    };

    const updatedHistory = [historyItem, ...queryHistory.slice(0, 49)]; // Keep last 50 queries
    setQueryHistory(updatedHistory);
    localStorage.setItem(`queryHistory_${databaseId}`, JSON.stringify(updatedHistory));
  };

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setExecutionTime(null);
    setCurrentPage(0);

    const startTime = performance.now();

    try {
      const data = await executeQuery(databaseId, query);
      const endTime = performance.now();
      const execTime = Math.round(endTime - startTime);

      setResult(data);
      setExecutionTime(execTime);
      saveQueryToHistory(query, data, execTime);
    } catch (err) {
      const endTime = performance.now();
      const execTime = Math.round(endTime - startTime);
      setExecutionTime(execTime);

      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Query execution failed';
      setError(errorMessage);
      saveQueryToHistory(query, null, execTime);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setError('');
    setExecutionTime(null);
    setCurrentPage(0);
  };

  const handleHistorySelect = (historyItem) => {
    setQuery(historyItem.query);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem(`queryHistory_${databaseId}`);
  };

  const generateQueryFromBuilder = () => {
    if (!selectedTable || selectedColumns.length === 0) return '';

    let query = `SELECT ${selectedColumns.join(', ')} FROM ${selectedTable}`;

    if (whereConditions.length > 0) {
      const conditions = whereConditions
        .filter(cond => cond.column && cond.operator && cond.value)
        .map(cond => `${cond.column} ${cond.operator} '${cond.value}'`)
        .join(' AND ');
      if (conditions) query += ` WHERE ${conditions}`;
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    return query;
  };

  const addColumnToSelection = (column) => {
    if (!selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  const removeColumnFromSelection = (column) => {
    setSelectedColumns(selectedColumns.filter(col => col !== column));
  };

  const addWhereCondition = () => {
    setWhereConditions([...whereConditions, { column: '', operator: '=', value: '' }]);
  };

  const updateWhereCondition = (index, field, value) => {
    const updated = [...whereConditions];
    updated[index][field] = value;
    setWhereConditions(updated);
  };

  const removeWhereCondition = (index) => {
    setWhereConditions(whereConditions.filter((_, i) => i !== index));
  };

  const applyBuilderQuery = () => {
    const builderQuery = generateQueryFromBuilder();
    if (builderQuery) {
      setQuery(builderQuery);
      setBuilderMode(false);
    }
  };

  const paginatedRows = result?.rows?.slice(currentPage * pageSize, (currentPage + 1) * pageSize) || [];
  const totalPages = Math.ceil((result?.rows?.length || 0) / pageSize);

  return (
    <div className="query-editor-container">
      <div className="query-editor-header">
        <h2>SQL Query Editor</h2>
        <div className="editor-controls">
          <button
            className={`btn ${builderMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBuilderMode(!builderMode)}
          >
            {builderMode ? <EyeOff size={16} /> : <Eye size={16} />}
            {builderMode ? 'Hide Builder' : 'Show Builder'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History size={16} />
            History ({queryHistory.length})
          </button>
        </div>
      </div>

      {builderMode && (
        <div className="query-builder">
          <div className="builder-section">
            <h3><Database size={16} /> Select Table</h3>
            <div className="table-selector">
              {tables.map(table => (
                <button
                  key={table}
                  className={`table-select-btn ${selectedTable === table ? 'active' : ''}`}
                  onClick={() => loadTableSchema(table)}
                >
                  <Table size={14} />
                  {table}
                </button>
              ))}
            </div>
          </div>

          {selectedTable && (
            <div className="builder-section">
              <h3><Columns size={16} /> Select Columns</h3>
              <div className="column-selector">
                <div className="available-columns">
                  <h4>Available Columns</h4>
                  {tableSchema.map(col => (
                    <div
                      key={col.column_name}
                      className={`column-item ${selectedColumns.includes(col.column_name) ? 'selected' : ''}`}
                      onClick={() => {
                        if (selectedColumns.includes(col.column_name)) {
                          removeColumnFromSelection(col.column_name);
                        } else {
                          addColumnToSelection(col.column_name);
                        }
                      }}
                    >
                      <span>{col.column_name}</span>
                      <small>({col.data_type})</small>
                    </div>
                  ))}
                </div>
                <div className="selected-columns">
                  <h4>Selected Columns ({selectedColumns.length})</h4>
                  {selectedColumns.length === 0 ? (
                    <div className="empty-selection">Click columns to select them</div>
                  ) : (
                    selectedColumns.map(col => (
                      <div key={col} className="selected-column-item">
                        <span>{col}</span>
                        <button onClick={() => removeColumnFromSelection(col)}>
                          <Minus size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="builder-section">
            <h3>WHERE Conditions</h3>
            {whereConditions.map((condition, index) => (
              <div key={index} className="where-condition">
                <select
                  value={condition.column}
                  onChange={(e) => updateWhereCondition(index, 'column', e.target.value)}
                >
                  <option value="">Select column</option>
                  {tableSchema.map(col => (
                    <option key={col.column_name} value={col.column_name}>
                      {col.column_name}
                    </option>
                  ))}
                </select>
                <select
                  value={condition.operator}
                  onChange={(e) => updateWhereCondition(index, 'operator', e.target.value)}
                >
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value="<">&lt;</option>
                  <option value="<=">&lt;=</option>
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="LIKE">LIKE</option>
                  <option value="ILIKE">ILIKE</option>
                </select>
                <input
                  type="text"
                  placeholder="Value"
                  value={condition.value}
                  onChange={(e) => updateWhereCondition(index, 'value', e.target.value)}
                />
                <button onClick={() => removeWhereCondition(index)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addWhereCondition}>
              Add Condition
            </button>
          </div>

          <div className="builder-section">
            <h3>ORDER BY & LIMIT</h3>
            <div className="order-limit-controls">
              <div className="form-group">
                <label>Order By:</label>
                <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
                  <option value="">No ordering</option>
                  {tableSchema.map(col => (
                    <option key={col.column_name} value={col.column_name}>
                      {col.column_name} ASC
                    </option>
                  ))}
                  {tableSchema.map(col => (
                    <option key={`${col.column_name}_desc`} value={`${col.column_name} DESC`}>
                      {col.column_name} DESC
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Limit:</label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                  min="1"
                  max="10000"
                />
              </div>
            </div>
          </div>

          <div className="builder-actions">
            <button className="btn btn-primary" onClick={applyBuilderQuery}>
              Apply to Editor
            </button>
            <button className="btn btn-success" onClick={() => { applyBuilderQuery(); handleExecute(); }}>
              <Play size={16} />
              Execute Query
            </button>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="query-history">
          <div className="history-header">
            <h3>Query History</h3>
            <div className="history-actions">
              <button className="btn btn-danger btn-sm" onClick={clearHistory}>
                <Trash2 size={14} />
                Clear History
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="history-list">
            {queryHistory.length === 0 ? (
              <div className="empty-history">No query history yet</div>
            ) : (
              queryHistory.map(item => (
                <div key={item.id} className="history-item" onClick={() => handleHistorySelect(item)}>
                  <div className="history-query">{item.query.substring(0, 100)}...</div>
                  <div className="history-meta">
                    <span className="history-time">
                      <Clock size={12} />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                    <span className="history-duration">
                      {item.executionTime}ms
                    </span>
                    <span className="history-rows">
                      {item.rowCount} rows
                    </span>
                    <span className={`history-status ${item.success ? 'success' : 'error'}`}>
                      {item.success ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="query-editor-main">
        <div className="sql-editor-section">
          <div className="editor-toolbar">
            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={loading}
            >
              {loading ? <RotateCcw size={16} className="spinning" /> : <Play size={16} />}
              {loading ? 'Executing...' : 'Execute Query'}
            </button>
            <button className="btn btn-secondary" onClick={handleClear}>
              <Square size={16} />
              Clear
            </button>
            {executionTime && (
              <div className="execution-info">
                <Clock size={14} />
                {executionTime}ms
              </div>
            )}
          </div>

          <div className="code-editor">
            <Editor
              value={query}
              onValueChange={(value) => setQuery(value)}
              highlight={(code) => highlight(code, languages.sql)}
              padding={15}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 14,
                backgroundColor: '#2d3748',
                color: '#e2e8f0',
                border: '1px solid #4a5568',
                borderRadius: '4px',
                minHeight: '200px',
                outline: 'none'
              }}
              placeholder="Enter your SQL query here..."
              textareaProps={{
                style: {
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical'
                }
              }}
            />
          </div>
        </div>

        <div className="results-section">
          {error && (
            <div className="alert alert-error">
              <strong>Query Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="query-result">
              <div className="result-header">
                <h3>Query Result</h3>
                <div className="result-meta">
                  <span>{result.rowCount || 0} rows</span>
                  {executionTime && <span>{executionTime}ms execution time</span>}
                </div>
              </div>

              {result.rows && result.rows.length > 0 ? (
                <>
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
                        {paginatedRows.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((value, i) => (
                              <td key={i} title={String(value)}>
                                {value !== null ? String(value) : 'NULL'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft size={14} />
                        Previous
                      </button>
                      <span className="page-info">
                        Page {currentPage + 1} of {totalPages}
                        ({result.rows.length} total rows)
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage === totalPages - 1}
                      >
                        Next
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <p>Query executed successfully but returned no rows</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QueryEditor;
