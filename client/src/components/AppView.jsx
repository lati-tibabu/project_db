import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editApp, closeAppTab, setActiveApp } from '../store/slices/appsSlice';
import { fetchTables } from '../store/slices/dataSlice';
import { getTableSchema, insertRow, getTableData } from '../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, ScatterController, LineController, BarController, BubbleController, DoughnutController, PieController, PolarAreaController, RadarController, RadialLinearScale } from 'chart.js';
import { Bar, Line, Pie, Scatter, Doughnut, PolarArea, Radar } from 'react-chartjs-2';
import { checkAuthStatus, loginToApp, logoutFromApp, changePassword, getUsers, createUser, updateUser, deleteUser, getApiDocumentation, callDynamicApi } from '../services/api';
import DataViewer from './DataViewer';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, ScatterController, LineController, BarController, BubbleController, DoughnutController, PieController, PolarAreaController, RadarController, RadialLinearScale);

function AppView({ standalone = false }) {
  const dispatch = useDispatch();
  const { items: apps, activeAppId, openAppIds } = useSelector(s => s.apps);
  const { tables, tablesStatus } = useSelector(s => s.data);
  const app = apps.find(a => a.id === activeAppId);
  const dbId = app?.databaseId;

  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState({ type: 'dashboard', name: '', config: {} });
  const [schemas, setSchemas] = useState({});
  const [formData, setFormData] = useState({});
  const [chartData, setChartData] = useState({});
  const [authStatus, setAuthStatus] = useState({ authenticated: false, user: null, loading: true });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [users, setUsers] = useState([]);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', email: '', fullName: '', role: 'viewer' });
  const [apiDocs, setApiDocs] = useState(null);
  const [showApiDocs, setShowApiDocs] = useState(false);

  useEffect(() => {
    if (dbId && tablesStatus === 'idle') {
      dispatch(fetchTables(dbId));
    }
  }, [dbId, tablesStatus, dispatch]);

  useEffect(() => {
    if (app) {
      checkAuthentication();
    }
  }, [app]);

  const checkAuthentication = async () => {
    if (!app) return;
    try {
      const status = await checkAuthStatus(app.id);
      setAuthStatus({ ...status, loading: false });
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({ authenticated: false, user: null, loading: false });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginToApp(app.id, loginForm.username, loginForm.password);
      setLoginForm({ username: '', password: '' });
      await checkAuthentication();
    } catch (error) {
      alert('Login failed: ' + error.response?.data?.error || error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFromApp(app.id);
      await checkAuthentication();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('New passwords do not match');
      return;
    }
    try {
      await changePassword(app.id, passwordForm.current, passwordForm.new);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setShowPasswordChange(false);
      alert('Password changed successfully');
    } catch (error) {
      alert('Password change failed: ' + error.response?.data?.error || error.message);
    }
  };

  const loadUsers = async () => {
    try {
      const userList = await getUsers(app.id);
      setUsers(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(app.id, userForm);
      setUserForm({ username: '', password: '', email: '', fullName: '', role: 'viewer' });
      loadUsers();
      alert('User created successfully');
    } catch (error) {
      alert('Failed to create user: ' + error.response?.data?.error || error.message);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await updateUser(app.id, userId, updates);
      loadUsers();
    } catch (error) {
      alert('Failed to update user: ' + error.response?.data?.error || error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(app.id, userId);
      loadUsers();
    } catch (error) {
      alert('Failed to delete user: ' + error.response?.data?.error || error.message);
    }
  };

  const loadApiDocumentation = async () => {
    try {
      const docs = await getApiDocumentation(app.id);
      setApiDocs(docs);
    } catch (error) {
      console.error('Failed to load API docs:', error);
    }
  };

  const fetchSchema = async (tableName) => {
    if (!schemas[tableName] && dbId) {
      try {
        const schema = await getTableSchema(dbId, tableName);
        setSchemas(prev => ({ ...prev, [tableName]: schema }));
      } catch (error) {
        console.error('Failed to fetch schema:', error);
      }
    }
  };

  const fetchChartData = async (tableName, compId) => {
    if (!chartData[compId] && dbId) {
      try {
        const data = await getTableData(dbId, tableName, 100); // limit to 100 rows
        setChartData(prev => ({ ...prev, [compId]: data.rows }));
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    }
  };

  if (authStatus.loading) {
    return (
      <div className="card app-view">
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!authStatus.authenticated) {
    return (
      <div className="card app-view">
        <div className="login-form">
          <h2>Login to {app?.name}</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
          <p className="login-hint">Default credentials: admin / admin</p>
        </div>
      </div>
    );
  }

  if (openAppIds.length === 0) {
    return (
      <div className="card app-view">
        <div className="empty-state">
          <p>No apps opened. Click the ➕ button next to an app in the sidebar to open it in a new tab.</p>
        </div>
      </div>
    );
  }

  const addComponent = () => {
    if (!newComponent.name) return;
    const components = [...(app.components || []), { ...newComponent, id: Date.now().toString() }];
    dispatch(editApp({ id: app.id, updates: { components } }));
    setNewComponent({ type: 'dashboard', name: '', config: {} });
    setShowAddComponent(false);
  };

  const removeComponent = (compId) => {
    const components = app.components.filter(c => c.id !== compId);
    dispatch(editApp({ id: app.id, updates: { components } }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const components = Array.from(app.components || []);
    const [reorderedItem] = components.splice(result.source.index, 1);
    components.splice(result.destination.index, 0, reorderedItem);

    dispatch(editApp({ id: app.id, updates: { components } }));
  };

  const renderComponent = (comp) => {
    switch (comp.type) {
      case 'dashboard':
        // Calculate advanced metrics
        const totalRecords = tables.reduce((sum, table) => sum + (table.rowCount || 0), 0);
        const connectedTables = tables.length;
        const appAge = app ? Math.floor((Date.now() - new Date(app.createdAt)) / (1000 * 60 * 60 * 24)) : 0;
        const lastActivity = app?.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'Never';

        return (
          <div className="component dashboard">
            <h3>{comp.name}</h3>
            <div className="dashboard-content">
              <div className="dashboard-grid">
                <div className="stat-card primary">
                  <h4>📊 Total Records</h4>
                  <p className="metric">{totalRecords.toLocaleString()}</p>
                  <span className="subtitle">Across {connectedTables} tables</span>
                </div>
                <div className="stat-card success">
                  <h4>🔗 Connected Tables</h4>
                  <p className="metric">{connectedTables}</p>
                  <span className="subtitle">Database tables linked</span>
                </div>
                <div className="stat-card info">
                  <h4>⚡ Database Status</h4>
                  <p className="metric">{dbId ? '✅ Connected' : '❌ Disconnected'}</p>
                  <span className="subtitle">{dbId ? 'Ready for queries' : 'Link a database'}</span>
                </div>
                <div className="stat-card warning">
                  <h4>📱 App Components</h4>
                  <p className="metric">{(app.components || []).length}</p>
                  <span className="subtitle">Active components</span>
                </div>
                <div className="stat-card secondary">
                  <h4>📅 App Age</h4>
                  <p className="metric">{appAge} days</p>
                  <span className="subtitle">Since creation</span>
                </div>
                <div className="stat-card light">
                  <h4>🔄 Last Activity</h4>
                  <p className="metric">{lastActivity}</p>
                  <span className="subtitle">Last updated</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-actions">
                <h4>Quick Actions</h4>
                <div className="action-buttons">
                  <button className="btn btn-sm btn-primary" onClick={() => setShowAddComponent(true)}>
                    ➕ Add Component
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => window.open(`/app/${app.id}`, '_blank')}>
                    ↗ Open Standalone
                  </button>
                  <button className="btn btn-sm btn-info" onClick={() => {
                    const data = JSON.stringify(app, null, 2);
                    navigator.clipboard.writeText(data);
                    alert('App configuration copied to clipboard!');
                  }}>
                    📋 Export Config
                  </button>
                </div>
              </div>

              {/* Recent Tables Overview */}
              {tables.length > 0 && (
                <div className="dashboard-tables">
                  <h4>Recent Tables</h4>
                  <div className="table-overview">
                    {tables.slice(0, 5).map(table => (
                      <div key={table.name} className="table-item">
                        <span className="table-name">{table.name}</span>
                        <span className="table-count">{table.rowCount || 0} records</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Health */}
              <div className="dashboard-health">
                <h4>System Health</h4>
                <div className="health-indicators">
                  <div className="health-item">
                    <span className="indicator">🟢</span>
                    <span>Database Connection</span>
                  </div>
                  <div className="health-item">
                    <span className="indicator">🟢</span>
                    <span>App Configuration</span>
                  </div>
                  <div className="health-item">
                    <span className="indicator">🟢</span>
                    <span>Component Rendering</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'data-table':
        const tableTableName = comp.config?.tableName;
        const tableRows = chartData[comp.id]; // Reusing chartData for table data
        const sortColumn = comp.config?.sortColumn;
        const sortDirection = comp.config?.sortDirection || 'asc';
        const filterColumn = comp.config?.filterColumn;
        const filterValue = comp.config?.filterValue || '';

        if (!tableTableName) {
          return (
            <div className="component data-table">
              <h3>{comp.name}</h3>
              <p>No table selected for this data table.</p>
            </div>
          );
        }
        if (!tableRows) {
          fetchChartData(tableTableName, comp.id);
          return (
            <div className="component data-table">
              <h3>{comp.name}</h3>
              <p>Loading table data...</p>
            </div>
          );
        }

        // Apply filtering and sorting
        let processedRows = [...tableRows];
        if (filterValue && filterColumn) {
          processedRows = processedRows.filter(row =>
            String(row[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
          );
        }
        if (sortColumn) {
          processedRows.sort((a, b) => {
            const aVal = a[sortColumn];
            const bVal = b[sortColumn];
            if (sortDirection === 'asc') {
              return aVal > bVal ? 1 : -1;
            } else {
              return aVal < bVal ? 1 : -1;
            }
          });
        }

        const columns = Object.keys(tableRows[0] || {});

        return (
          <div className="component data-table">
            <h3>{comp.name}</h3>
            <div className="table-controls">
              <div className="control-group">
                <label>Sort by:</label>
                <select
                  value={sortColumn || ''}
                  onChange={e => {
                    const newConfig = { ...comp.config, sortColumn: e.target.value };
                    dispatch(editApp({ id: app.id, updates: {
                      components: app.components.map(c =>
                        c.id === comp.id ? { ...c, config: newConfig } : c
                      )
                    } }));
                  }}
                >
                  <option value="">None</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <select
                  value={sortDirection}
                  onChange={e => {
                    const newConfig = { ...comp.config, sortDirection: e.target.value };
                    dispatch(editApp({ id: app.id, updates: {
                      components: app.components.map(c =>
                        c.id === comp.id ? { ...c, config: newConfig } : c
                      )
                    } }));
                  }}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              <div className="control-group">
                <label>Filter:</label>
                <select
                  value={filterColumn || ''}
                  onChange={e => {
                    const newConfig = { ...comp.config, filterColumn: e.target.value };
                    dispatch(editApp({ id: app.id, updates: {
                      components: app.components.map(c =>
                        c.id === comp.id ? { ...c, config: newConfig } : c
                      )
                    } }));
                  }}
                >
                  <option value="">None</option>
                  {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Filter value..."
                  value={filterValue}
                  onChange={e => {
                    const newConfig = { ...comp.config, filterValue: e.target.value };
                    dispatch(editApp({ id: app.id, updates: {
                      components: app.components.map(c =>
                        c.id === comp.id ? { ...c, config: newConfig } : c
                      )
                    } }));
                  }}
                />
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedRows.slice(0, 50).map((row, index) => (
                    <tr key={index}>
                      {columns.map(col => (
                        <td key={col}>{String(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {processedRows.length > 50 && (
                <p className="table-note">Showing first 50 rows of {processedRows.length} total</p>
              )}
            </div>
          </div>
        );
      case 'metrics':
        const metricsTableName = comp.config?.tableName;
        const metricsRows = chartData[comp.id];
        const metricsColumns = comp.config?.columns || [];

        if (!metricsTableName) {
          return (
            <div className="component metrics">
              <h3>{comp.name}</h3>
              <p>No table selected for metrics.</p>
            </div>
          );
        }
        if (!metricsRows) {
          fetchChartData(metricsTableName, comp.id);
          return (
            <div className="component metrics">
              <h3>{comp.name}</h3>
              <p>Loading metrics data...</p>
            </div>
          );
        }

        const availableColumns = Object.keys(metricsRows[0] || {});
        const displayColumns = metricsColumns.length > 0 ? metricsColumns : availableColumns.slice(0, 4);

        const calculateMetrics = (column) => {
          const values = metricsRows.map(row => parseFloat(row[column]) || 0).filter(v => !isNaN(v));
          if (values.length === 0) return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };

          return {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          };
        };

        return (
          <div className="component metrics">
            <h3>{comp.name}</h3>
            <div className="metrics-grid">
              {displayColumns.map(column => {
                const metrics = calculateMetrics(column);
                return (
                  <div key={column} className="metric-card">
                    <h4>{column}</h4>
                    <div className="metric-values">
                      <div className="metric-item">
                        <span className="label">Count:</span>
                        <span className="value">{metrics.count}</span>
                      </div>
                      <div className="metric-item">
                        <span className="label">Sum:</span>
                        <span className="value">{metrics.sum.toFixed(2)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="label">Average:</span>
                        <span className="value">{metrics.avg.toFixed(2)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="label">Min:</span>
                        <span className="value">{metrics.min.toFixed(2)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="label">Max:</span>
                        <span className="value">{metrics.max.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'form-view':
        const tableName = comp.config?.tableName;
        const schema = schemas[tableName];
        if (!tableName) {
          return (
            <div className="component form-view">
              <h3>{comp.name}</h3>
              <p>No table selected for this form.</p>
            </div>
          );
        }
        if (!schema) {
          fetchSchema(tableName);
          return (
            <div className="component form-view">
              <h3>{comp.name}</h3>
              <p>Loading schema...</p>
            </div>
          );
        }
        const handleFormSubmit = async (e) => {
          e.preventDefault();
          try {
            await insertRow(dbId, tableName, formData[comp.id] || {});
            alert('Data inserted successfully!');
            setFormData(prev => ({ ...prev, [comp.id]: {} }));
          } catch (error) {
            alert('Failed to insert data: ' + error.message);
          }
        };
        const handleInputChange = (column, value) => {
          setFormData(prev => ({
            ...prev,
            [comp.id]: { ...prev[comp.id], [column]: value }
          }));
        };
        return (
          <div className="component form-view">
            <h3>{comp.name}</h3>
            <form onSubmit={handleFormSubmit}>
              {schema.columns.map(col => (
                <div key={col.name} style={{ marginBottom: '0.5rem' }}>
                  <label>{col.name} ({col.type}):</label>
                  <input
                    type={col.type.includes('int') || col.type.includes('numeric') ? 'number' : 'text'}
                    value={formData[comp.id]?.[col.name] || ''}
                    onChange={e => handleInputChange(col.name, e.target.value)}
                    required={!col.nullable}
                  />
                </div>
              ))}
              <button type="submit" className="btn btn-primary">Insert Row</button>
            </form>
          </div>
        );
      case 'chart-view':
        const chartTableName = comp.config?.tableName;
        const chartType = comp.config?.chartType || 'bar';
        const xAxis = comp.config?.xAxis;
        const yAxis = comp.config?.yAxis;
        const chartTitle = comp.config?.title || `${chartType} Chart for ${chartTableName}`;
        const showLegend = comp.config?.showLegend !== false;
        const chartColor = comp.config?.color || '#3498db';
        const chartRows = chartData[comp.id];

        if (!chartTableName) {
          return (
            <div className="component chart-view">
              <h3>{comp.name}</h3>
              <p>No table selected for this chart.</p>
            </div>
          );
        }
        if (!chartRows || chartRows.length === 0) {
          fetchChartData(chartTableName, comp.id);
          return (
            <div className="component chart-view">
              <h3>{comp.name}</h3>
              <p>Loading chart data...</p>
            </div>
          );
        }

        const chartColumns = Object.keys(chartRows[0] || {});
        const xKey = xAxis || chartColumns[0];
        const yKey = yAxis || chartColumns[1];

        // Prepare data based on chart type
        let chartConfig;
        const labels = chartRows.map(row => row[xKey]);
        const dataValues = chartRows.map(row => parseFloat(row[yKey]) || 0);

        // Generate color variations
        const generateColors = (count, baseColor) => {
          const colors = [];
          for (let i = 0; i < count; i++) {
            const hue = (i * 137.5) % 360; // Golden angle approximation for good distribution
            colors.push(`hsl(${hue}, 70%, 50%)`);
          }
          return colors;
        };

        const backgroundColors = generateColors(dataValues.length, chartColor);
        const borderColors = backgroundColors.map(color => color.replace('50%', '40%'));

        switch (chartType) {
          case 'bar':
          case 'line':
            chartConfig = {
              labels,
              datasets: [{
                label: yKey,
                data: dataValues,
                backgroundColor: chartType === 'bar' ? backgroundColors : 'rgba(52, 152, 219, 0.1)',
                borderColor: chartType === 'bar' ? borderColors : chartColor,
                borderWidth: 2,
                fill: chartType === 'line' ? false : true,
                tension: chartType === 'line' ? 0.4 : 0,
              }],
            };
            break;
          case 'pie':
          case 'doughnut':
          case 'polarArea':
            chartConfig = {
              labels,
              datasets: [{
                label: yKey,
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
              }],
            };
            break;
          case 'scatter':
            chartConfig = {
              datasets: [{
                label: `${xKey} vs ${yKey}`,
                data: chartRows.map(row => ({
                  x: parseFloat(row[xKey]) || 0,
                  y: parseFloat(row[yKey]) || 0,
                })),
                backgroundColor: chartColor,
                borderColor: chartColor,
                borderWidth: 2,
              }],
            };
            break;
          case 'radar':
            chartConfig = {
              labels,
              datasets: [{
                label: yKey,
                data: dataValues,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: chartColor,
                borderWidth: 2,
                pointBackgroundColor: chartColor,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: chartColor,
              }],
            };
            break;
          default:
            chartConfig = {
              labels,
              datasets: [{
                label: yKey,
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
              }],
            };
        }

        const options = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: showLegend,
              position: 'top',
            },
            title: {
              display: !!chartTitle,
              text: chartTitle,
              font: { size: 16, weight: 'bold' },
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.y || context.parsed}`,
              },
            },
          },
          scales: chartType === 'scatter' ? {} : {
            x: {
              display: chartType !== 'pie' && chartType !== 'doughnut' && chartType !== 'polarArea',
              title: {
                display: true,
                text: xKey,
              },
            },
            y: {
              display: chartType !== 'pie' && chartType !== 'doughnut' && chartType !== 'polarArea',
              title: {
                display: true,
                text: yKey,
              },
              beginAtZero: true,
            },
          },
        };

        const renderChart = () => {
          switch (chartType) {
            case 'bar':
              return <Bar data={chartConfig} options={options} />;
            case 'line':
              return <Line data={chartConfig} options={options} />;
            case 'pie':
              return <Pie data={chartConfig} options={options} />;
            case 'doughnut':
              return <Doughnut data={chartConfig} options={options} />;
            case 'polarArea':
              return <PolarArea data={chartConfig} options={options} />;
            case 'radar':
              return <Radar data={chartConfig} options={options} />;
            case 'scatter':
              return <Scatter data={chartConfig} options={options} />;
            default:
              return <Bar data={chartConfig} options={options} />;
          }
        };

        return (
          <div className="component chart-view">
            <h3>{comp.name}</h3>
            <div style={{ height: '400px', position: 'relative' }}>
              {renderChart()}
            </div>
            <div className="chart-info">
              <small>Data source: {chartTableName} | X: {xKey} | Y: {yKey} | Records: {chartRows.length}</small>
            </div>
          </div>
        );
      case 'user-management':
        const userRole = authStatus.user?.role;
        const isAdmin = userRole === 'admin';

        if (!isAdmin) {
          return (
            <div className="component user-management">
              <h3>{comp.name}</h3>
              <p>You need admin privileges to access user management.</p>
            </div>
          );
        }

        if (!showUserManagement) {
          loadUsers();
          setShowUserManagement(true);
        }

        return (
          <div className="component user-management">
            <h3>{comp.name}</h3>
            <div className="user-management-content">
              {/* Create User Form */}
              <div className="create-user-section">
                <h4>Create New User</h4>
                <form onSubmit={handleCreateUser}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Username:</label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Password:</label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Full Name:</label>
                      <input
                        type="text"
                        value={userForm.fullName}
                        onChange={e => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role:</label>
                      <select
                        value={userForm.role}
                        onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <button type="submit" className="btn btn-primary">Create User</button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Users List */}
              <div className="users-list-section">
                <h4>Users ({users.length})</h4>
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Full Name</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{user.email || '-'}</td>
                          <td>{user.full_name || '-'}</td>
                          <td>
                            <select
                              value={user.role}
                              onChange={e => handleUpdateUser(user.id, { role: e.target.value })}
                              disabled={user.id === authStatus.user?.id}
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={user.is_active}
                                onChange={e => handleUpdateUser(user.id, { isActive: e.target.checked })}
                                disabled={user.id === authStatus.user?.id}
                              />
                              Active
                            </label>
                          </td>
                          <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                          <td>
                            {user.id !== authStatus.user?.id && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'api-documentation':
        if (!showApiDocs) {
          loadApiDocumentation();
          setShowApiDocs(true);
        }

        if (!apiDocs) {
          return (
            <div className="component api-documentation">
              <h3>{comp.name}</h3>
              <p>Loading API documentation...</p>
            </div>
          );
        }

        return (
          <div className="component api-documentation">
            <h3>{comp.name}</h3>
            <div className="api-docs-content">
              <div className="api-info">
                <h4>API Information</h4>
                <p><strong>App:</strong> {apiDocs.app}</p>
                <p><strong>Base URL:</strong> <code>{apiDocs.baseUrl}</code></p>
                <p><strong>Authentication:</strong> Session-based (login required)</p>
              </div>

              <div className="api-endpoints">
                <h4>Available Endpoints</h4>
                {apiDocs.endpoints.map(endpoint => (
                  <div key={endpoint.table} className="endpoint-group">
                    <h5>📋 {endpoint.table}</h5>
                    <div className="endpoint-methods">
                      {endpoint.endpoints.map((method, index) => (
                        <div key={index} className="endpoint-method">
                          <div className="method-header">
                            <span className={`method-badge method-${method.method.toLowerCase()}`}>
                              {method.method}
                            </span>
                            <code className="endpoint-path">{method.path}</code>
                            {method.permissions && (
                              <span className="permissions-badge">{method.permissions}</span>
                            )}
                          </div>
                          <p className="endpoint-description">{method.description}</p>
                          {method.query && (
                            <div className="endpoint-query">
                              <strong>Query Parameters:</strong>
                              <ul>
                                {Object.entries(method.query).map(([param, desc]) => (
                                  <li key={param}><code>{param}</code>: {desc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="endpoint-schema">
                      <h6>Schema:</h6>
                      <div className="schema-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Column</th>
                              <th>Type</th>
                              <th>Nullable</th>
                              <th>Default</th>
                            </tr>
                          </thead>
                          <tbody>
                            {endpoint.schema.map(col => (
                              <tr key={col.name}>
                                <td><code>{col.name}</code></td>
                                <td>{col.type}</td>
                                <td>{col.nullable ? 'Yes' : 'No'}</td>
                                <td>{col.default || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="api-examples">
                <h4>Example Usage</h4>
                <div className="example-code">
                  <h5>Get all records:</h5>
                  <pre><code>GET {apiDocs.baseUrl}/users</code></pre>

                  <h5>Get single record:</h5>
                  <pre><code>GET {apiDocs.baseUrl}/users/1</code></pre>

                  <h5>Create new record:</h5>
                  <pre><code>POST {apiDocs.baseUrl}/users
Content-Type: application/json

{{
  "name": "John Doe",
  "email": "john@example.com"
}}</code></pre>

                  <h5>Update record:</h5>
                  <pre><code>PUT {apiDocs.baseUrl}/users/1
Content-Type: application/json

{{
  "name": "Jane Doe",
  "email": "jane@example.com"
}}</code></pre>

                  <h5>Delete record:</h5>
                  <pre><code>DELETE {apiDocs.baseUrl}/users/1</code></pre>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div className="component">Unknown component type: {comp.type}</div>;
    }
  };

  return (
    <div className="card app-view">
      {!standalone && (
        <div className="app-tabs">
          {openAppIds.map(appId => {
            const tabApp = apps.find(a => a.id === appId);
            if (!tabApp) return null;
            return (
              <div
                key={appId}
                className={`app-tab ${activeAppId === appId ? 'active' : ''}`}
                onClick={() => dispatch(setActiveApp(appId))}
              >
                <span>{tabApp.name}</span>
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(closeAppTab(appId));
                  }}
                  title="Close tab"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>App: {app.name}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span>Logged in as: {authStatus.user?.username}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setShowPasswordChange(true)}>
            Change Password
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleLogout}>
            Logout
          </button>
          {!standalone && (
            <button className="btn btn-primary" onClick={() => setShowAddComponent(true)}>
              Add Component
            </button>
          )}
        </div>
      </div>

      {app.description && <p>{app.description}</p>}

      {showAddComponent && (
        <div className="component-config">
          <h3>Add Component</h3>
          <input
            placeholder="Component name"
            value={newComponent.name}
            onChange={e => setNewComponent(c => ({ ...c, name: e.target.value }))}
          />
          <select
            value={newComponent.type}
            onChange={e => setNewComponent(c => ({ ...c, type: e.target.value, config: {} }))}
          >
            <option value="dashboard">Dashboard</option>
            <option value="data-view">Data View</option>
            <option value="data-table">Data Table</option>
            <option value="form-view">Form View</option>
            <option value="chart-view">Chart View</option>
            <option value="metrics">Metrics</option>
            <option value="user-management">User Management</option>
            <option value="api-documentation">API Documentation</option>
          </select>
          {newComponent.type === 'data-table' && tables.length > 0 && (
            <select
              value={newComponent.config.tableName || ''}
              onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, tableName: e.target.value } }))}
            >
              <option value="">Select a table</option>
              {tables.map(table => (
                <option key={table.name} value={table.name}>{table.name}</option>
              ))}
            </select>
          )}
          {newComponent.type === 'metrics' && tables.length > 0 && (
            <select
              value={newComponent.config.tableName || ''}
              onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, tableName: e.target.value } }))}
            >
              <option value="">Select a table</option>
              {tables.map(table => (
                <option key={table.name} value={table.name}>{table.name}</option>
              ))}
            </select>
          )}
          {newComponent.type === 'chart-view' && tables.length > 0 && (
            <>
              <select
                value={newComponent.config.tableName || ''}
                onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, tableName: e.target.value } }))}
              >
                <option value="">Select a table</option>
                {tables.map(table => (
                  <option key={table.name} value={table.name}>{table.name}</option>
                ))}
              </select>
              <select
                value={newComponent.config.chartType || 'bar'}
                onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, chartType: e.target.value } }))}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="doughnut">Doughnut Chart</option>
                <option value="polarArea">Polar Area Chart</option>
                <option value="radar">Radar Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
              <input
                type="text"
                placeholder="Chart title (optional)"
                value={newComponent.config.title || ''}
                onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, title: e.target.value } }))}
              />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={newComponent.config.color || '#3498db'}
                  onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, color: e.target.value } }))}
                  title="Chart color"
                />
                <label style={{ fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={newComponent.config.showLegend !== false}
                    onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, showLegend: e.target.checked } }))}
                  />
                  Show legend
                </label>
              </div>
            </>
          )}
          <div className="btn-group">
            <button className="btn btn-primary" onClick={addComponent}>Add</button>
            <button className="btn" onClick={() => setShowAddComponent(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showPasswordChange && (
        <div className="component-config">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password:</label>
              <input
                type="password"
                value={passwordForm.current}
                onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>New Password:</label>
              <input
                type="password"
                value={passwordForm.new}
                onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password:</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                required
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-primary">Change Password</button>
              <button type="button" className="btn" onClick={() => setShowPasswordChange(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="components-list">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="components">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {(app.components || []).map((comp, index) => (
                  <Draggable key={comp.id} draggableId={comp.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`component-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="component-header">
                          <div {...provided.dragHandleProps} className="drag-handle">
                            <span>⋮⋮</span>
                          </div>
                          <span>{comp.name} ({comp.type})</span>
                          <button className="btn btn-danger btn-sm" onClick={() => removeComponent(comp.id)}>Remove</button>
                        </div>
                        {renderComponent(comp)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {(app.components || []).length === 0 && (
        <div className="empty-state">
          <p>No components added yet. Click "Add Component" to get started.</p>
        </div>
      )}
    </div>
  );
}

export default AppView;
