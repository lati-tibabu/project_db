import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, PolarArea, Radar, Scatter } from 'react-chartjs-2';
import { getTableSchema, getTableData } from '../services/api';
import { editApp } from '../store/slices/appsSlice';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
  polarArea: PolarArea,
  radar: Radar,
  scatter: Scatter
};

const numericTypes = new Set([
  'smallint',
  'integer',
  'bigint',
  'decimal',
  'numeric',
  'real',
  'double precision'
]);

const categoricalTypes = new Set([
  'character varying',
  'character',
  'varchar',
  'text',
  'uuid',
  'date',
  'timestamp without time zone',
  'timestamp with time zone'
]);

const sanitizeIdentifier = (value) => {
  if (!value) return '';
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error('Invalid identifier in chart configuration');
  }
  return value;
};

const lightenColor = (hex, amount) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const decimal = parseInt(normalized, 16);
  const adjust = (shift) => {
    const channel = (decimal >> shift) & 0xff;
    const offset = Math.round((amount / 100) * 255);
    const next = Math.min(255, Math.max(0, channel + offset));
    return next;
  };
  return `#${((adjust(16) << 16) | (adjust(8) << 8) | adjust(0)).toString(16).padStart(6, '0')}`;
};

const paletteFromBase = (base, size) => {
  if (size <= 1) return [base];
  const step = 40 / Math.max(size - 1, 1);
  return Array.from({ length: size }, (_, index) => lightenColor(base, 20 - step * index));
};

const defaultColor = '#3498db';

function ChartView({ component, dbId }) {
  const dispatch = useDispatch();
  const { items: apps, activeAppId } = useSelector(state => state.apps);
  const tables = useSelector(state => state.data.tables);
  const app = apps.find(item => item.id === activeAppId);

  const [schema, setSchema] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const config = component.config || {};
  const tableName = config.tableName || '';
  const chartType = config.chartType || 'bar';
  const categoryField = config.categoryField || '';
  const valueField = config.valueField || '';
  const xField = config.xField || '';
  const yField = config.yField || '';
  const color = config.color || defaultColor;
  const showLegend = config.showLegend !== false;
  const title = config.title || component.name || 'Chart';

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
        getTableData(dbId, tableName, 500, 0)
      ]);
      setSchema(schemaResponse || []);
      setRows(dataResponse?.rows || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load chart data');
      setSchema([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dbId, tableName]);

  useEffect(() => {
    setSchema([]);
    setRows([]);
    if (dbId && tableName) {
      fetchData();
    }
  }, [dbId, tableName, fetchData]);

  const numericColumns = useMemo(() =>
    schema.filter(col => numericTypes.has(col.data_type)).map(col => col.column_name),
    [schema]
  );

  const categoricalColumns = useMemo(() =>
    schema.filter(col => categoricalTypes.has(col.data_type) || !numericTypes.has(col.data_type))
      .map(col => col.column_name),
    [schema]
  );

  const ChartComponent = chartComponents[chartType] || Bar;
  const isPieLike = chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea';
  const isScatter = chartType === 'scatter';

  const chartData = useMemo(() => {
    if (!rows.length) return null;

    if (isScatter) {
      if (!xField || !yField) return null;
      const points = rows.map(row => {
        const xValue = Number(row[xField]);
        const yValue = Number(row[yField]);
        if (Number.isFinite(xValue) && Number.isFinite(yValue)) {
          return { x: xValue, y: yValue };
        }
        return null;
      }).filter(Boolean);

      if (!points.length) return null;

      return {
        datasets: [
          {
            label: title,
            data: points,
            backgroundColor: lightenColor(color, -10),
            borderColor: color,
            pointRadius: 4
          }
        ]
      };
    }

    if (!categoryField || !valueField) return null;

    const grouped = rows.reduce((acc, row) => {
      const key = row[categoryField] ?? '—';
      const raw = row[valueField];
      const numericValue = Number.parseFloat(raw);
      const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
      acc[key] = (acc[key] || 0) + safeValue;
      return acc;
    }, {});

    const labels = Object.keys(grouped);
    const values = labels.map(label => grouped[label]);

    const datasetColor = isPieLike ? paletteFromBase(color, labels.length) : color;
    const dataset = {
      label: valueField,
      data: values,
      backgroundColor: datasetColor,
      borderColor: isPieLike ? undefined : lightenColor(color, -15),
      borderWidth: isPieLike ? 1 : 2,
      tension: chartType === 'line' ? 0.35 : 0,
      fill: chartType === 'line'
    };

    return { labels, datasets: [dataset] };
  }, [rows, chartType, isPieLike, isScatter, categoryField, valueField, xField, yField, color, title]);

  const chartOptions = useMemo(() => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: isPieLike ? 'bottom' : 'top'
        },
        title: {
          display: Boolean(title),
          text: title
        }
      }
    };

    if (isScatter) {
      options.plugins.legend.display = false;
      options.scales = {
        x: {
          type: 'linear',
          title: { display: Boolean(xField), text: xField || 'X' }
        },
        y: {
          type: 'linear',
          title: { display: Boolean(yField), text: yField || 'Y' }
        }
      };
    } else if (!isPieLike) {
      options.scales = {
        x: { ticks: { autoSkip: true, maxRotation: 35 }, grid: { display: chartType !== 'line' } },
        y: { beginAtZero: true, grid: { display: true } }
      };
    }

    return options;
  }, [chartType, showLegend, isPieLike, isScatter, title, xField, yField]);

  const renderConfigurator = () => (
    <div className="component-config" style={{ marginBottom: '1rem' }}>
      <h4>Chart Settings</h4>
      <div className="form-group">
        <label>Table</label>
        <select
          value={tableName}
          onChange={(event) => updateComponentConfig({ tableName: event.target.value || '' })}
        >
          <option value="">Select a table</option>
          {tables.map(table => (
            <option key={table} value={table}>{table}</option>
          ))}
        </select>
      </div>

      {schema.length > 0 && !isScatter && (
        <div className="form-row">
          <div className="form-group">
            <label>Group By</label>
            <select
              value={categoryField}
              onChange={(event) => updateComponentConfig({ categoryField: event.target.value })}
            >
              <option value="">Select column</option>
              {categoricalColumns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Value Column</label>
            <select
              value={valueField}
              onChange={(event) => updateComponentConfig({ valueField: event.target.value })}
            >
              <option value="">Select column</option>
              {numericColumns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {schema.length > 0 && isScatter && (
        <div className="form-row">
          <div className="form-group">
            <label>X Axis</label>
            <select
              value={xField}
              onChange={(event) => updateComponentConfig({ xField: event.target.value })}
            >
              <option value="">Select column</option>
              {numericColumns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Y Axis</label>
            <select
              value={yField}
              onChange={(event) => updateComponentConfig({ yField: event.target.value })}
            >
              <option value="">Select column</option>
              {numericColumns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => updateComponentConfig({ title: event.target.value })}
            placeholder="Chart title"
          />
        </div>
        <div className="form-group">
          <label>Color</label>
          <input
            type="color"
            value={color}
            onChange={(event) => updateComponentConfig({ color: event.target.value })}
          />
        </div>
        <label className="checkbox-label" style={{ alignSelf: 'flex-end' }}>
          <input
            type="checkbox"
            checked={showLegend}
            onChange={(event) => updateComponentConfig({ showLegend: event.target.checked })}
          />
          Show legend
        </label>
      </div>

      <div className="btn-group">
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading || !tableName}>
          Refresh Data
        </button>
      </div>

      {lastUpdated && (
        <small>Last updated: {lastUpdated.toLocaleTimeString()}</small>
      )}
    </div>
  );

  return (
    <div className="component chart-view">
      {renderConfigurator()}
      {error && <div className="alert alert-error">{error}</div>}
      {!tableName && <p>Select a table to begin visualizing data.</p>}
      {tableName && loading && <div className="loading">Loading chart data...</div>}
      {tableName && !loading && !error && chartData && (
        <div style={{ height: isPieLike ? '360px' : '420px' }}>
          <ChartComponent data={chartData} options={chartOptions} />
        </div>
      )}
      {tableName && !loading && !error && !chartData && (
        <div className="empty-state">
          <p>Select valid columns to render the chart.</p>
        </div>
      )}
    </div>
  );
}

export default ChartView;
