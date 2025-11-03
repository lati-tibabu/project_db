import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { editApp, closeAppTab, setActiveApp } from '../store/slices/appsSlice';
import { fetchTables } from '../store/slices/dataSlice';
import DataViewer from './DataViewer';
import DashboardView from './DashboardView';
import FormView from './FormView';
import ChartView from './ChartView';
import DataTableView from './DataTableView';
import MetricsView from './MetricsView';

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

function AppView({ standalone = false }) {
  const dispatch = useDispatch();
  const { items: apps, activeAppId, openAppIds } = useSelector(s => s.apps);
  const { tables, tablesStatus } = useSelector(s => s.data);
  const app = apps.find(a => a.id === activeAppId);
  const dbId = app?.databaseId;

  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState({ type: 'dashboard', name: '', config: {} });

  useEffect(() => {
    if (dbId && tablesStatus === 'idle') {
      dispatch(fetchTables(dbId));
    }
  }, [dbId, tablesStatus, dispatch]);
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

  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = app.components.findIndex((item) => item.id === active.id);
      const newIndex = app.components.findIndex((item) => item.id === over.id);

      const newComponents = arrayMove(app.components, oldIndex, newIndex);
      dispatch(editApp({ id: app.id, updates: { components: newComponents } }));
    }

    setActiveId(null);
  };

  const renderComponent = (comp) => {
    switch (comp.type) {
      case 'dashboard':
        return <DashboardView component={comp} app={app} tables={tables} />;
      case 'data-view':
        return <DataViewer databaseId={dbId} />;
      case 'form-view':
        return <FormView component={comp} dbId={dbId} />;
      case 'chart-view':
        return <ChartView component={comp} dbId={dbId} />;
      case 'data-table':
        return <DataTableView component={comp} dbId={dbId} />;
      case 'metrics':
        return <MetricsView component={comp} dbId={dbId} />;

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
          </select>
          {newComponent.type === 'data-table' && tables.length > 0 && (
            <select
              value={newComponent.config.tableName || ''}
              onChange={e => setNewComponent(c => ({ ...c, config: { ...c.config, tableName: e.target.value } }))}
            >
              <option value="">Select a table</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
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
                <option key={table} value={table}>{table}</option>
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
                  <option key={table} value={table}>{table}</option>
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



      <div className="components-list">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={(app.components || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
            {(app.components || []).map((comp) => (
              <SortableItem key={comp.id} id={comp.id}>
                <div className="component-wrapper">
                  <div className="component-header">
                    <div className="drag-handle">
                      <span>⋮⋮</span>
                    </div>
                    <span>{comp.name} ({comp.type})</span>
                    <button className="btn btn-danger btn-sm" onClick={() => removeComponent(comp.id)}>Remove</button>
                  </div>
                  {renderComponent(comp)}
                </div>
              </SortableItem>
            ))}
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="component-wrapper dragging">
                <div className="component-header">
                  <span>{app.components.find(c => c.id === activeId)?.name}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
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
