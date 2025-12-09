import React from 'react';
import {
  TextComponent,
  HeadingComponent,
  CardComponent,
  ButtonComponent,
  DividerComponent,
  SpacerComponent,
  ImageComponent
} from './BasicComponents';
import {
  TableViewComponent,
  FormComponent,
  ChartComponent
} from './DataComponents';

// Component Renderer - Renders any component based on type
const ComponentRenderer = ({
  component,
  dbId,
  isEditing = false,
  onUpdate,
  children
}) => {
  const renderComponent = () => {
    switch (component.type) {
      case 'text':
        return <TextComponent component={component} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'heading':
        return <HeadingComponent component={component} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'card':
        return (
          <CardComponent component={component} isEditing={isEditing} onUpdate={onUpdate}>
            {children}
          </CardComponent>
        );

      case 'button':
        return <ButtonComponent component={component} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'table-view':
        return <TableViewComponent component={component} dbId={dbId} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'form':
        return <FormComponent component={component} dbId={dbId} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'chart':
        return <ChartComponent component={component} dbId={dbId} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'data-table':
        // For now, reuse table-view
        return <TableViewComponent component={component} dbId={dbId} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'metrics':
        return (
          <div className="metrics-component">
            <p>Metrics component - Coming soon</p>
          </div>
        );

      case 'image':
        return <ImageComponent component={component} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'divider':
        return <DividerComponent component={component} isEditing={isEditing} onUpdate={onUpdate} />;

      case 'spacer':
        return <SpacerComponent component={component} />;

      // Legacy component types (for backward compatibility)
      case 'dashboard':
        return (
          <div className="legacy-component dashboard">
            <h4>Dashboard Component</h4>
            <p>This is a legacy dashboard component. Consider updating to the new component system.</p>
          </div>
        );

      case 'data-view':
        return (
          <div className="legacy-component data-view">
            <h4>Data View Component</h4>
            <p>This is a legacy data view component. Consider updating to the new component system.</p>
          </div>
        );

      case 'form-view':
        return (
          <div className="legacy-component form-view">
            <h4>Form View Component</h4>
            <p>This is a legacy form view component. Consider updating to the new component system.</p>
          </div>
        );

      case 'chart-view':
        return (
          <div className="legacy-component chart-view">
            <h4>Chart View Component</h4>
            <p>This is a legacy chart view component. Consider updating to the new component system.</p>
          </div>
        );

      default:
        return (
          <div className="unknown-component">
            <p>Unknown component type: {component.type}</p>
            <small>Component ID: {component.id}</small>
          </div>
        );
    }
  };

  return (
    <div className={`component-wrapper ${component.type}-component ${isEditing ? 'editing' : ''}`}>
      {renderComponent()}
    </div>
  );
};

export default ComponentRenderer;