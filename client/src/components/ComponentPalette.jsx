import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { COMPONENT_LIBRARY, getComponentsByCategory } from './ComponentLibrary';

const DraggableComponent = ({ component, onDragStart }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${component.type}`,
    data: {
      type: 'component',
      componentType: component.type,
      componentData: component
    }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`palette-component ${isDragging ? 'dragging' : ''}`}
      onMouseDown={() => onDragStart && onDragStart(component)}
    >
      <div className="component-icon">
        {component.icon}
      </div>
      <div className="component-info">
        <div className="component-name">{component.name}</div>
        <div className="component-description">{component.description}</div>
      </div>
    </div>
  );
};

const ComponentPalette = ({ onDragStart }) => {
  const [selectedCategory, setSelectedCategory] = useState('Basic');
  const [searchTerm, setSearchTerm] = useState('');

  const componentsByCategory = getComponentsByCategory();

  const filteredComponents = COMPONENT_LIBRARY.filter(component => {
    const matchesCategory = selectedCategory === 'All' || component.category === selectedCategory;
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         component.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', ...Object.keys(componentsByCategory)];

  return (
    <div className="component-palette">
      <div className="palette-header">
        <h3>Component Library</h3>
        <div className="palette-search">
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="palette-categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
            {category !== 'All' && (
              <span className="category-count">
                ({componentsByCategory[category]?.length || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="palette-components">
        {filteredComponents.length === 0 ? (
          <div className="empty-state">
            <p>No components found</p>
            <small>Try adjusting your search or category filter</small>
          </div>
        ) : (
          filteredComponents.map(component => (
            <DraggableComponent
              key={component.type}
              component={component}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>

      <div className="palette-footer">
        <small className="palette-help">
          Drag components to the canvas to add them to your app
        </small>
      </div>
    </div>
  );
};

export default ComponentPalette;