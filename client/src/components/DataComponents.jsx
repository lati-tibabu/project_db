import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Table View Component
export const TableViewComponent = ({ component, dbId, isEditing = false, onUpdate }) => {
  const { config } = component;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (config.tableName && dbId) {
      loadData();
    }
  }, [config.tableName, dbId]);

  const loadData = async () => {
    if (!config.tableName || !dbId) return;

    setLoading(true);
    setError(null);

    try {
      // This would be replaced with actual API call
      const response = await fetch(`/api/data/${dbId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT * FROM ${config.tableName} LIMIT ${config.pageSize || 10}`,
          type: 'select'
        })
      });

      if (!response.ok) throw new Error('Failed to load data');

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, [field]: value }
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading table data...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!config.tableName) {
    return (
      <div className="empty-state">
        <p>Configure table name to display data</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p>No data found in table "{config.tableName}"</p>
      </div>
    );
  }

  const columns = config.columns && config.columns.length > 0
    ? config.columns
    : Object.keys(data[0] || {});

  return (
    <div className="table-view-component">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>
                  {typeof col === 'string' ? col : col.label || col.field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map(col => {
                  const field = typeof col === 'string' ? col : col.field;
                  return (
                    <td key={field}>
                      {row[field]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Form Component
export const FormComponent = ({ component, dbId, isEditing = false, onUpdate }) => {
  const { config } = component;
  const [formData, setFormData] = useState({});
  const [tableSchema, setTableSchema] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config.tableName && dbId) {
      loadTableSchema();
    }
  }, [config.tableName, dbId]);

  const loadTableSchema = async () => {
    if (!config.tableName || !dbId) return;

    setLoading(true);
    try {
      // This would be replaced with actual API call to get table schema
      const response = await fetch(`/api/database/${dbId}/tables/${config.tableName}/schema`);
      if (!response.ok) throw new Error('Failed to load schema');

      const schema = await response.json();
      setTableSchema(schema.columns || []);
    } catch (err) {
      console.error('Failed to load table schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/data/${dbId}/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: config.tableName,
          data: formData
        })
      });

      if (!response.ok) throw new Error('Failed to submit form');

      // Reset form on success
      setFormData({});
      alert('Data submitted successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleReset = () => {
    setFormData({});
  };

  const handleConfigChange = (field, value) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, [field]: value }
      });
    }
  };

  if (!config.tableName) {
    return (
      <div className="empty-state">
        <p>Configure table name to create form</p>
      </div>
    );
  }

  const fields = config.fields && config.fields.length > 0
    ? config.fields
    : tableSchema.map(col => ({
        field: col.name,
        label: col.name,
        type: getInputType(col.type),
        required: !col.nullable
      }));

  return (
    <form onSubmit={handleSubmit} className={`form-component ${config.layout || 'vertical'}`}>
      {fields.map(field => (
        <div key={field.field} className="form-group">
          <label htmlFor={field.field}>
            {field.label || field.field}
            {field.required && <span className="required">*</span>}
          </label>
          {renderFormField(field, formData[field.field] || '', (value) =>
            setFormData(prev => ({ ...prev, [field.field]: value }))
          )}
        </div>
      ))}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {config.submitLabel || 'Submit'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
          {config.resetLabel || 'Reset'}
        </button>
      </div>
    </form>
  );
};

// Chart Component
export const ChartComponent = ({ component, dbId, isEditing = false, onUpdate }) => {
  const { config } = component;
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config.tableName && config.xField && config.yField && dbId) {
      loadChartData();
    }
  }, [config.tableName, config.xField, config.yField, dbId]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/data/${dbId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT ${config.xField}, ${config.yField} FROM ${config.tableName}`,
          type: 'select'
        })
      });

      if (!response.ok) throw new Error('Failed to load chart data');

      const result = await response.json();
      setChartData(result.data || []);
    } catch (err) {
      console.error('Failed to load chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, [field]: value }
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading chart...</div>;
  }

  if (!config.tableName || !config.xField || !config.yField) {
    return (
      <div className="empty-state">
        <p>Configure table, X-axis, and Y-axis fields to display chart</p>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (config.type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xField} />
            <YAxis />
            <Tooltip />
            {config.showLegend && <Legend />}
            <Bar dataKey={config.yField} fill={config.colors?.[0] || '#3498db'} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={config.xField} />
            <YAxis />
            <Tooltip />
            {config.showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={config.yField}
              stroke={config.colors?.[0] || '#3498db'}
              strokeWidth={2}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ [config.xField]: name, [config.yField]: value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={config.yField}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={config.colors?.[index % (config.colors?.length || 1)] || '#3498db'} />
              ))}
            </Pie>
            <Tooltip />
            {config.showLegend && <Legend />}
          </PieChart>
        );

      default:
        return <div>Unsupported chart type: {config.type}</div>;
    }
  };

  return (
    <div className="chart-component">
      {config.title && <h3>{config.title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

// Helper functions
const getInputType = (dbType) => {
  const type = dbType?.toLowerCase();
  if (type?.includes('int') || type?.includes('numeric')) return 'number';
  if (type?.includes('date') || type?.includes('time')) return 'date';
  if (type?.includes('bool')) return 'checkbox';
  return 'text';
};

const renderFormField = (field, value, onChange) => {
  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          id={field.field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={4}
        />
      );

    case 'select':
      return (
        <select
          id={field.field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="">Select...</option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <input
          type="checkbox"
          id={field.field}
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          required={field.required}
        />
      );

    default:
      return (
        <input
          type={field.type || 'text'}
          id={field.field}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          placeholder={field.placeholder}
        />
      );
  }
};