import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Database,
  Table,
  FileText,
  HardDrive,
  Activity,
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  fetchDashboardData,
  refreshDashboardData,
  clearDashboardError,
  setAutoRefresh,
  setRefreshInterval
} from '../store/slices/dashboardSlice';

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];

function DatabaseSummaryDashboard() {
  const dispatch = useDispatch();
  const {
    summary,
    trends,
    recentQueries,
    status,
    error,
    lastUpdated,
    autoRefreshEnabled,
    refreshInterval
  } = useSelector(state => state.dashboard);

  const refreshIntervalRef = useRef(null);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshEnabled && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        dispatch(refreshDashboardData());
      }, refreshInterval);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, dispatch]);

  // Initial data fetch
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDashboardData());
    }
  }, [status, dispatch]);

  const handleRefresh = () => {
    dispatch(refreshDashboardData());
  };

  const handleRetry = () => {
    dispatch(clearDashboardError());
    dispatch(fetchDashboardData());
  };

  const toggleAutoRefresh = () => {
    dispatch(setAutoRefresh(!autoRefreshEnabled));
  };

  const loading = status === 'loading';
  const refreshing = status === 'refreshing';

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={32} className="spinning" style={{ marginBottom: '1rem' }} />
          <p>Loading database summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          <strong>Error loading dashboard:</strong> {error}
        </div>
        <div className="btn-group" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleRetry}>
            <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="database-summary-dashboard">
      <div className="dashboard-header">
        <h2>Database Summary Dashboard</h2>
        <div className="header-actions">
          <div className="auto-refresh-controls">
            <label className="checkbox-label" style={{ fontSize: '0.9rem', marginRight: '1rem' }}>
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={toggleAutoRefresh}
                style={{ marginRight: '0.5rem' }}
              />
              Auto-refresh ({refreshInterval / 1000}s)
            </label>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} style={{ marginRight: '0.5rem' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {lastUpdated && (
            <small className="last-updated">
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </small>
          )}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <Database size={24} />
          </div>
          <div className="metric-content">
            <h3>{summary?.totalDatabases || 0}</h3>
            <p>Total Databases</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <Table size={24} />
          </div>
          <div className="metric-content">
            <h3>{formatNumber(summary?.totalTables || 0)}</h3>
            <p>Total Tables</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <FileText size={24} />
          </div>
          <div className="metric-content">
            <h3>{formatNumber(summary?.totalRecords || 0)}</h3>
            <p>Total Records</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <HardDrive size={24} />
          </div>
          <div className="metric-content">
            <h3>{formatBytes(summary?.totalSize || 0)}</h3>
            <p>Total Size</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3><Activity size={20} style={{ marginRight: '0.5rem' }} />Database Activity Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="queries"
                stroke="#3498db"
                strokeWidth={2}
                name="Queries"
              />
              <Line
                type="monotone"
                dataKey="connections"
                stroke="#e74c3c"
                strokeWidth={2}
                name="Connections"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3><TrendingUp size={20} style={{ marginRight: '0.5rem' }} />Database Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={summary?.databases?.filter(db => !db.error) || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, tables }) => `${name}: ${tables} tables`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="tables"
              >
                {(summary?.databases?.filter(db => !db.error) || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} tables`, 'Tables']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Database Details Table */}
      <div className="database-details">
        <h3>Database Details</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Database Name</th>
                <th>Tables</th>
                <th>Records</th>
                <th>Size</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary?.databases?.map(db => (
                <tr key={db.id}>
                  <td>{db.name}</td>
                  <td>{db.error ? '—' : formatNumber(db.tables || 0)}</td>
                  <td>{db.error ? '—' : formatNumber(db.records || 0)}</td>
                  <td>{db.error ? '—' : formatBytes(db.size || 0)}</td>
                  <td>
                    {db.error ? (
                      <span style={{ color: '#e74c3c' }}>❌ Error</span>
                    ) : (
                      <span style={{ color: '#27ae60' }}>✅ Connected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Queries */}
      <div className="recent-queries">
        <h3><Clock size={20} style={{ marginRight: '0.5rem' }} />Recent Queries</h3>
        <div className="queries-list">
          {recentQueries.length === 0 ? (
            <div className="empty-state">
              <p>No recent queries found</p>
            </div>
          ) : (
            recentQueries.map(query => (
              <div key={query.id} className="query-item">
                <div className="query-header">
                  <span className="database-name">{query.database}</span>
                  <span className={`query-status ${query.success ? 'success' : 'error'}`}>
                    {query.success ? '✓' : '✗'}
                  </span>
                  <span className="query-time">{query.executionTime}ms</span>
                  <span className="query-timestamp">
                    {new Date(query.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="query-sql">
                  <code>{query.query}</code>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DatabaseSummaryDashboard;