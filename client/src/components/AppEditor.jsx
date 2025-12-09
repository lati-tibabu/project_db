import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
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
import ComponentRenderer from './ComponentRenderer';
import ComponentPalette from './ComponentPalette';
import PropertyPanel from './PropertyPanel';
import { createComponentConfig } from './ComponentLibrary';

// Sortable Item Component
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { sortable: true } });

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

// Droppable Canvas Component
function DroppableCanvas({ children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={`app-canvas ${isOver ? 'drop-target' : ''}`}
    >
      {children}
    </div>
  );
}

function AppEditor({ standalone = false }) {
  const dispatch = useDispatch();
  const { items: apps, activeAppId, openAppIds } = useSelector(s => s.apps);
  const { tables, tablesStatus } = useSelector(s => s.data);
  const app = apps.find(a => a.id === activeAppId);
  const dbId = app?.databaseId;

  const [selectedComponent, setSelectedComponent] = useState(null);
  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize sensors before any conditional returns to maintain hook order
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const addComponent = (componentType, position = null) => {
    const componentConfig = createComponentConfig(componentType);
    const newComponent = {
      id: Date.now().toString(),
      type: componentType,
      name: `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} ${Date.now()}`,
      config: componentConfig
    };

    const components = [...(app.components || [])];
    if (position !== null) {
      components.splice(position, 0, newComponent);
    } else {
      components.push(newComponent);
    }

    dispatch(editApp({ id: app.id, updates: { components } }));
    setSelectedComponent(newComponent);
  };

  const updateComponent = (updatedComponent) => {
    const components = app.components.map(comp =>
      comp.id === updatedComponent.id ? updatedComponent : comp
    );
    dispatch(editApp({ id: app.id, updates: { components } }));
  };

  const removeComponent = (componentId) => {
    const components = app.components.filter(c => c.id !== componentId);
    dispatch(editApp({ id: app.id, updates: { components } }));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setDraggedComponent(active.data.current?.componentData);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    // Check if we're adding a new component from the palette
    if (active.data.current?.type === 'component') {
      // Adding new component from palette - can drop anywhere
      const componentType = active.data.current.componentType;
      addComponent(componentType);
      setDraggedComponent(null);
      return;
    }

    // For reordering, we need a valid drop target
    if (!over) {
      setDraggedComponent(null);
      return;
    }

    if (active.data.current?.sortable) {
      // Reordering existing components
      const oldIndex = app.components.findIndex((item) => item.id === active.id);
      const newIndex = app.components.findIndex((item) => item.id === over.id);

      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        const newComponents = arrayMove(app.components, oldIndex, newIndex);
        dispatch(editApp({ id: app.id, updates: { components: newComponents } }));
      }
    }

    setDraggedComponent(null);
  };

  return (
    <div className="app-editor">
      {/* App Header */}
      <div className="app-header">
        <div className="app-info">
          <h2>{app.name}</h2>
          {app.description && <p>{app.description}</p>}
        </div>
        <div className="app-actions">
          <button
            className={`btn ${isEditMode ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Exit Edit' : 'Edit Mode'}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="app-workspace">
          {/* Component Palette - Left Sidebar */}
          {isEditMode && (
            <div className="workspace-sidebar">
              <ComponentPalette onDragStart={() => { }} />
            </div>
          )}

          {/* Main Canvas */}
          <div className="workspace-canvas">
            <DroppableCanvas
            >
              <div className="canvas-content">
                {app.components && app.components.length > 0 ? (
                  <SortableContext items={app.components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {app.components.map((component) => (
                      <SortableItem key={component.id} id={component.id}>
                        <div
                          className={`canvas-component ${selectedComponent?.id === component.id ? 'selected' : ''} ${isEditMode ? 'editable' : ''}`}
                          onClick={() => isEditMode && setSelectedComponent(component)}
                        >
                          {isEditMode && (
                            <div className="component-toolbar">
                              <div className="drag-handle">⋮⋮</div>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeComponent(component.id);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                          <ComponentRenderer
                            component={component}
                            dbId={dbId}
                            isEditing={isEditMode && selectedComponent?.id === component.id}
                            onUpdate={updateComponent}
                          />
                        </div>
                      </SortableItem>
                    ))}
                  </SortableContext>
                ) : (
                  <div className="empty-canvas">
                    <div className="empty-state">
                      <h3>Start Building Your App</h3>
                      <p>Drag components from the palette to build your data-driven application</p>
                      {isEditMode && (
                        <p className="empty-hint">Enable edit mode to see the component palette</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DroppableCanvas>

            <DragOverlay>
              {draggedComponent ? (
                <div className="dragged-component">
                  <div className="component-icon">{draggedComponent.icon}</div>
                  <span>{draggedComponent.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </div>

          {/* Property Panel - Right Sidebar */}
          {isEditMode && (
            <div className="workspace-sidebar">
              <PropertyPanel
                selectedComponent={selectedComponent}
                onUpdate={updateComponent}
                dbId={dbId}
              />
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}

export default AppEditor;