import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const PropertyPanel = ({ selectedComponent, onUpdate, dbId }) => {
  const [tables, setTables] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);

  useEffect(() => {
    if (dbId) {
      loadTables();
    }
  }, [dbId]);

  useEffect(() => {
    if (selectedComponent?.config?.tableName && dbId) {
      loadTableColumns(selectedComponent.config.tableName);
    }
  }, [selectedComponent?.config?.tableName, dbId]);

  const loadTables = async () => {
    try {
      const response = await fetch(`/api/database/${dbId}/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const loadTableColumns = async (tableName) => {
    try {
      const response = await fetch(`/api/database/${dbId}/tables/${tableName}/columns`);
      if (response.ok) {
        const data = await response.json();
        setTableColumns(data.columns || []);
      }
    } catch (error) {
      console.error('Failed to load table columns:', error);
    }
  };

  const handleConfigChange = (field, value) => {
    if (selectedComponent && onUpdate) {
      onUpdate({
        ...selectedComponent,
        config: {
          ...selectedComponent.config,
          [field]: value
        }
      });
    }
  };

  const handleTableChange = (tableName) => {
    handleConfigChange('tableName', tableName);
    if (tableName) {
      loadTableColumns(tableName);
    } else {
      setTableColumns([]);
    }
  };

  if (!selectedComponent) {
    return (
      <div className="property-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="panel-content">
          <div className="empty-state">
            <p>Select a component to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const { type, name, config } = selectedComponent;

  return (
    <div className="property-panel">
      <div className="panel-header">
        <h3>Properties</h3>
        <div className="component-info">
          <span className="component-type">{type}</span>
          <span className="component-name">{name}</span>
        </div>
      </div>

      <div className="panel-content">
        {/* Basic Properties */}
        <div className="property-section">
          <h4>Basic</h4>

          <div className="property-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onUpdate({
                ...selectedComponent,
                name: e.target.value
              })}
              placeholder="Component name"
            />
          </div>
        </div>

        {/* Type-specific properties */}
        {renderTypeSpecificProperties(type, config, {
          tables,
          tableColumns,
          onChange: handleConfigChange,
          onTableChange: handleTableChange
        })}
      </div>
    </div>
  );
};

// Render type-specific properties based on component type
const renderTypeSpecificProperties = (type, config, { tables, tableColumns, onChange, onTableChange }) => {
  switch (type) {
    case 'text':
      return (
        <div className="property-section">
          <h4>Text Properties</h4>

          <div className="property-group">
            <label>Content</label>
            <textarea
              value={config.content || ''}
              onChange={(e) => onChange('content', e.target.value)}
              rows={3}
              placeholder="Enter text content"
            />
          </div>

          <div className="property-group">
            <label>Font Size</label>
            <select
              value={config.fontSize || 'medium'}
              onChange={(e) => onChange('fontSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="xlarge">Extra Large</option>
            </select>
          </div>

          <div className="property-group">
            <label>Alignment</label>
            <select
              value={config.alignment || 'left'}
              onChange={(e) => onChange('alignment', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="property-group">
            <label>Color</label>
            <input
              type="color"
              value={config.color || '#2c3e50'}
              onChange={(e) => onChange('color', e.target.value)}
            />
          </div>
        </div>
      );

    case 'heading':
      return (
        <div className="property-section">
          <h4>Heading Properties</h4>

          <div className="property-group">
            <label>Content</label>
            <input
              type="text"
              value={config.content || ''}
              onChange={(e) => onChange('content', e.target.value)}
              placeholder="Enter heading text"
            />
          </div>

          <div className="property-group">
            <label>Level</label>
            <select
              value={config.level || 'h2'}
              onChange={(e) => onChange('level', e.target.value)}
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
            </select>
          </div>

          <div className="property-group">
            <label>Alignment</label>
            <select
              value={config.alignment || 'left'}
              onChange={(e) => onChange('alignment', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </div>
      );

    case 'card':
      return (
        <div className="property-section">
          <h4>Card Properties</h4>

          <div className="property-group">
            <label>Title</label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Card title (optional)"
            />
          </div>

          <div className="property-group">
            <label>Padding</label>
            <select
              value={config.padding || 'medium'}
              onChange={(e) => onChange('padding', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="property-group">
            <label>
              <input
                type="checkbox"
                checked={config.shadow !== false}
                onChange={(e) => onChange('shadow', e.target.checked)}
              />
              Show Shadow
            </label>
          </div>
        </div>
      );

    case 'button':
      return (
        <div className="property-section">
          <h4>Button Properties</h4>

          <div className="property-group">
            <label>Label</label>
            <input
              type="text"
              value={config.label || ''}
              onChange={(e) => onChange('label', e.target.value)}
              placeholder="Button text"
            />
          </div>

          <div className="property-group">
            <label>Variant</label>
            <select
              value={config.variant || 'primary'}
              onChange={(e) => onChange('variant', e.target.value)}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="success">Success</option>
              <option value="danger">Danger</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div className="property-group">
            <label>Size</label>
            <select
              value={config.size || 'medium'}
              onChange={(e) => onChange('size', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className="property-group">
            <label>Action</label>
            <select
              value={config.action || 'none'}
              onChange={(e) => onChange('action', e.target.value)}
            >
              <option value="none">None</option>
              <option value="navigate">Navigate</option>
              <option value="submit">Submit Form</option>
              <option value="reset">Reset Form</option>
            </select>
          </div>

          {config.action === 'navigate' && (
            <div className="property-group">
              <label>URL</label>
              <input
                type="url"
                value={config.actionConfig?.url || ''}
                onChange={(e) => onChange('actionConfig', { ...config.actionConfig, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          )}
        </div>
      );

    case 'table-view':
    case 'data-table':
      return (
        <div className="property-section">
          <h4>Data Source</h4>

          <div className="property-group">
            <label>Table</label>
            <select
              value={config.tableName || ''}
              onChange={(e) => onTableChange(e.target.value)}
            >
              <option value="">Select a table</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          {config.tableName && (
            <>
              <div className="property-group">
                <label>Page Size</label>
                <input
                  type="number"
                  value={config.pageSize || 10}
                  onChange={(e) => onChange('pageSize', parseInt(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>

              <div className="property-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.sortable !== false}
                    onChange={(e) => onChange('sortable', e.target.checked)}
                  />
                  Sortable
                </label>
              </div>

              <div className="property-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.filterable !== false}
                    onChange={(e) => onChange('filterable', e.target.checked)}
                  />
                  Filterable
                </label>
              </div>

              <div className="property-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.selectable || false}
                    onChange={(e) => onChange('selectable', e.target.checked)}
                  />
                  Selectable Rows
                </label>
              </div>
            </>
          )}
        </div>
      );

    case 'chart':
      return (
        <div className="property-section">
          <h4>Data Source</h4>

          <div className="property-group">
            <label>Table</label>
            <select
              value={config.tableName || ''}
              onChange={(e) => onTableChange(e.target.value)}
            >
              <option value="">Select a table</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          {config.tableName && (
            <>
              <div className="property-group">
                <label>Chart Type</label>
                <select
                  value={config.type || 'bar'}
                  onChange={(e) => onChange('type', e.target.value)}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              <div className="property-group">
                <label>X-Axis Field</label>
                <select
                  value={config.xField || ''}
                  onChange={(e) => onChange('xField', e.target.value)}
                >
                  <option value="">Select field</option>
                  {tableColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>

              <div className="property-group">
                <label>Y-Axis Field</label>
                <select
                  value={config.yField || ''}
                  onChange={(e) => onChange('yField', e.target.value)}
                >
                  <option value="">Select field</option>
                  {tableColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>

              <div className="property-group">
                <label>Title</label>
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => onChange('title', e.target.value)}
                  placeholder="Chart title"
                />
              </div>

              <div className="property-group">
                <label>
                  <input
                    type="checkbox"
                    checked={config.showLegend !== false}
                    onChange={(e) => onChange('showLegend', e.target.checked)}
                  />
                  Show Legend
                </label>
              </div>
            </>
          )}
        </div>
      );

    case 'form':
      return (
        <div className="property-section">
          <h4>Form Configuration</h4>

          <div className="property-group">
            <label>Table</label>
            <select
              value={config.tableName || ''}
              onChange={(e) => onTableChange(e.target.value)}
            >
              <option value="">Select a table</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          <div className="property-group">
            <label>Layout</label>
            <select
              value={config.layout || 'vertical'}
              onChange={(e) => onChange('layout', e.target.value)}
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
              <option value="grid">Grid</option>
            </select>
          </div>

          <div className="property-group">
            <label>Submit Button Label</label>
            <input
              type="text"
              value={config.submitLabel || 'Submit'}
              onChange={(e) => onChange('submitLabel', e.target.value)}
              placeholder="Submit"
            />
          </div>

          <div className="property-group">
            <label>Reset Button Label</label>
            <input
              type="text"
              value={config.resetLabel || 'Reset'}
              onChange={(e) => onChange('resetLabel', e.target.value)}
              placeholder="Reset"
            />
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="property-section">
          <h4>Image Properties</h4>

          <div className="property-group">
            <label>Image URL</label>
            <input
              type="url"
              value={config.src || ''}
              onChange={(e) => onChange('src', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="property-group">
            <label>Alt Text</label>
            <input
              type="text"
              value={config.alt || ''}
              onChange={(e) => onChange('alt', e.target.value)}
              placeholder="Image description"
            />
          </div>

          <div className="property-group">
            <label>Width</label>
            <input
              type="text"
              value={config.width || 'auto'}
              onChange={(e) => onChange('width', e.target.value)}
              placeholder="auto, 100px, 50%"
            />
          </div>

          <div className="property-group">
            <label>Height</label>
            <input
              type="text"
              value={config.height || 'auto'}
              onChange={(e) => onChange('height', e.target.value)}
              placeholder="auto, 100px, 50%"
            />
          </div>

          <div className="property-group">
            <label>Fit</label>
            <select
              value={config.fit || 'cover'}
              onChange={(e) => onChange('fit', e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div className="property-section">
          <h4>Spacer Properties</h4>

          <div className="property-group">
            <label>Height</label>
            <input
              type="text"
              value={config.height || '20px'}
              onChange={(e) => onChange('height', e.target.value)}
              placeholder="20px, 2rem, etc."
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="property-section">
          <p>No specific properties for this component type.</p>
        </div>
      );
  }
};

export default PropertyPanel;