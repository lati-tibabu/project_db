import React from 'react';

// Component Library - Available components for drag-and-drop
export const COMPONENT_LIBRARY = [
  {
    type: 'text',
    name: 'Text',
    icon: '📝',
    category: 'Basic',
    description: 'Display text content',
    defaultConfig: {
      content: 'Enter your text here',
      fontSize: 'medium',
      alignment: 'left',
      color: '#2c3e50'
    }
  },
  {
    type: 'heading',
    name: 'Heading',
    icon: '📋',
    category: 'Basic',
    description: 'Display headings and titles',
    defaultConfig: {
      content: 'Heading Text',
      level: 'h2',
      alignment: 'left'
    }
  },
  {
    type: 'card',
    name: 'Card',
    icon: '🃏',
    category: 'Layout',
    description: 'Container for content with shadow',
    defaultConfig: {
      title: '',
      content: '',
      padding: 'medium',
      shadow: true
    }
  },
  {
    type: 'button',
    name: 'Button',
    icon: '🔘',
    category: 'Interactive',
    description: 'Clickable button with actions',
    defaultConfig: {
      label: 'Click me',
      variant: 'primary',
      size: 'medium',
      action: 'none',
      actionConfig: {}
    }
  },
  {
    type: 'table-view',
    name: 'Table View',
    icon: '📊',
    category: 'Data',
    description: 'Display data in tabular format',
    defaultConfig: {
      tableName: '',
      columns: [],
      pageSize: 10,
      sortable: true,
      filterable: true,
      selectable: false
    }
  },
  {
    type: 'form',
    name: 'Form',
    icon: '📋',
    category: 'Data',
    description: 'Data entry form with validation',
    defaultConfig: {
      tableName: '',
      fields: [],
      submitLabel: 'Submit',
      resetLabel: 'Reset',
      layout: 'vertical'
    }
  },
  {
    type: 'chart',
    name: 'Chart',
    icon: '📈',
    category: 'Data',
    description: 'Visual data representation',
    defaultConfig: {
      type: 'bar',
      tableName: '',
      xField: '',
      yField: '',
      title: '',
      showLegend: true,
      colors: ['#3498db', '#e74c3c', '#27ae60', '#f39c12']
    }
  },
  {
    type: 'data-table',
    name: 'Data Table',
    icon: '📋',
    category: 'Data',
    description: 'Advanced data table with features',
    defaultConfig: {
      tableName: '',
      columns: [],
      pagination: true,
      pageSize: 25,
      search: true,
      export: true
    }
  },
  {
    type: 'metrics',
    name: 'Metrics',
    icon: '📊',
    category: 'Data',
    description: 'Display key metrics and KPIs',
    defaultConfig: {
      metrics: [],
      layout: 'grid',
      refreshInterval: 30000
    }
  },
  {
    type: 'image',
    name: 'Image',
    icon: '🖼️',
    category: 'Media',
    description: 'Display images and media',
    defaultConfig: {
      src: '',
      alt: '',
      width: 'auto',
      height: 'auto',
      fit: 'cover'
    }
  },
  {
    type: 'divider',
    name: 'Divider',
    icon: '➖',
    category: 'Layout',
    description: 'Visual separator',
    defaultConfig: {
      style: 'solid',
      color: '#e9ecef',
      thickness: '1px'
    }
  },
  {
    type: 'spacer',
    name: 'Spacer',
    icon: '⬜',
    category: 'Layout',
    description: 'Add space between components',
    defaultConfig: {
      height: '20px'
    }
  }
];

// Group components by category
export const getComponentsByCategory = () => {
  const categories = {};
  COMPONENT_LIBRARY.forEach(component => {
    if (!categories[component.category]) {
      categories[component.category] = [];
    }
    categories[component.category].push(component);
  });
  return categories;
};

// Get component by type
export const getComponentByType = (type) => {
  return COMPONENT_LIBRARY.find(comp => comp.type === type);
};

// Create default component configuration
export const createComponentConfig = (type) => {
  const component = getComponentByType(type);
  return component ? { ...component.defaultConfig } : {};
};

export default COMPONENT_LIBRARY;