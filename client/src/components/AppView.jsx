import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { editApp, closeAppTab, setActiveApp } from '../store/slices/appsSlice';
import { fetchTables } from '../store/slices/dataSlice';
import { getTableSchema, insertRow, getTableData } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import DataViewer from './DataViewer';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

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

  useEffect(() => {
    if (dbId && tablesStatus === 'idle') {
      dispatch(fetchTables(dbId));
    }
  }, [dbId, tablesStatus, dispatch]);

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

  const renderComponent = (comp) => {
    switch (comp.type) {
      case 'dashboard':
        return (
          <div className="component dashboard">
            <h3>{comp.name}</h3>
            <div className="dashboard-content">
              <div className="stat-card">
                <h4>Total Tables</h4>
                <p>{tables.length}</p>
              </div>
              <div className="stat-card">
                <h4>Database Status</h4>
                <p>{dbId ? 'Connected' : 'No database linked'}</p>
              </div>
              <div className="stat-card">
                <h4>Components</h4>
                <p>{(app.components || []).length}</p>
              </div>
              <div className="stat-card">
                <h4>App Created</h4>
                <p>{new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        );
      case 'data-view':
        return (
          <div className="component data-view">
            <h3>{comp.name}</h3>
            <DataViewer databaseId={dbId} />
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
        const chartRows = chartData[comp.id];
        if (!chartTableName) {
          return (
            <div className="component chart-view">
              <h3>{comp.name}</h3>
              <p>No table selected for this chart.</p>
            </div>
          );
        }
        if (!chartRows) {
          fetchChartData(chartTableName, comp.id);
          return (
            <div className="component chart-view">
              <h3>{comp.name}</h3>
              <p>Loading chart data...</p>
            </div>
          );
        }
        const columns = Object.keys(chartRows[0] || {});
        const xKey = columns[0];
        const yKey = columns[1];
        const labels = chartRows.map(row => row[xKey]);
        const dataValues = chartRows.map(row => parseFloat(row[yKey]) || 0);
        const chartConfig = {
          labels,
          datasets: [{
            label: yKey,
            data: dataValues,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          }],
        };
        const options = {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `${chartType} Chart for ${chartTableName}` },
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
            default:
              return <p>Unknown chart type</p>;
          }
        };
        return (
          <div className="component chart-view">
            <h3>{comp.name}</h3>
            {renderChart()}
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
        {!standalone && (
          <button className="btn btn-primary" onClick={() => setShowAddComponent(true)}>
            Add Component
          </button>
        )}
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
            <option value="form-view">Form View</option>
            <option value="chart-view">Chart View</option>
          </select>
          {newComponent.type === 'form-view' && tables.length > 0 && (
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
              </select>
            </>
          )}
          <div className="btn-group">
            <button className="btn btn-primary" onClick={addComponent}>Add</button>
            <button className="btn" onClick={() => setShowAddComponent(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="components-list">
        {(app.components || []).map(comp => (
          <div key={comp.id} className="component-wrapper">
            <div className="component-header">
              <span>{comp.name} ({comp.type})</span>
              <button className="btn btn-danger btn-sm" onClick={() => removeComponent(comp.id)}>Remove</button>
            </div>
            {renderComponent(comp)}
          </div>
        ))}
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
