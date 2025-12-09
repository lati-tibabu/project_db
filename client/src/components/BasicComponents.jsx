import React from 'react';

// Text Component
export const TextComponent = ({ component, isEditing = false, onUpdate }) => {
  const { config } = component;

  const handleContentChange = (content) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, content }
      });
    }
  };

  const fontSizeMap = {
    small: '0.875rem',
    medium: '1rem',
    large: '1.25rem',
    xlarge: '1.5rem'
  };

  const style = {
    fontSize: fontSizeMap[config.fontSize] || '1rem',
    textAlign: config.alignment || 'left',
    color: config.color || '#2c3e50',
    margin: 0
  };

  if (isEditing) {
    return (
      <div className="component-editing">
        <textarea
          value={config.content || ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Enter text content"
          style={{
            ...style,
            width: '100%',
            minHeight: '60px',
            padding: '0.5rem',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            fontFamily: 'inherit'
          }}
        />
      </div>
    );
  }

  return (
    <p style={style}>
      {config.content || 'Enter your text here'}
    </p>
  );
};

// Heading Component
export const HeadingComponent = ({ component, isEditing = false, onUpdate }) => {
  const { config } = component;
  const HeadingTag = config.level || 'h2';

  const handleContentChange = (content) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, content }
      });
    }
  };

  const style = {
    textAlign: config.alignment || 'left',
    margin: 0,
    color: 'var(--text-color)'
  };

  if (isEditing) {
    return (
      <div className="component-editing">
        <input
          type="text"
          value={config.content || ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Enter heading text"
          style={{
            ...style,
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            fontSize: '1.1rem',
            fontWeight: 'bold'
          }}
        />
      </div>
    );
  }

  return (
    <HeadingTag style={style}>
      {config.content || 'Heading Text'}
    </HeadingTag>
  );
};

// Card Component
export const CardComponent = ({ component, children, isEditing = false, onUpdate }) => {
  const { config } = component;

  const handleConfigChange = (field, value) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, [field]: value }
      });
    }
  };

  const paddingMap = {
    small: '0.75rem',
    medium: '1rem',
    large: '1.5rem'
  };

  const style = {
    padding: paddingMap[config.padding] || '1rem',
    boxShadow: config.shadow ? 'var(--shadow)' : 'none',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    background: 'var(--card-bg)',
    marginBottom: '1rem'
  };

  return (
    <div className="component-card" style={style}>
      {config.title && (
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>
          {isEditing ? (
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              placeholder="Card title"
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                color: 'inherit'
              }}
            />
          ) : (
            config.title
          )}
        </h3>
      )}
      {children}
    </div>
  );
};

// Button Component
export const ButtonComponent = ({ component, isEditing = false, onUpdate }) => {
  const { config } = component;

  const handleConfigChange = (field, value) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, [field]: value }
      });
    }
  };

  const handleClick = () => {
    // Handle button actions here
    switch (config.action) {
      case 'navigate':
        if (config.actionConfig?.url) {
          window.open(config.actionConfig.url, config.actionConfig.target || '_self');
        }
        break;
      case 'submit':
        // Handle form submission
        break;
      case 'reset':
        // Handle form reset
        break;
      default:
        break;
    }
  };

  const sizeMap = {
    small: 'btn-sm',
    medium: '',
    large: 'btn-lg'
  };

  const variantMap = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info'
  };

  const className = `btn ${variantMap[config.variant] || 'btn-primary'} ${sizeMap[config.size] || ''}`;

  if (isEditing) {
    return (
      <div className="component-editing">
        <input
          type="text"
          value={config.label || ''}
          onChange={(e) => handleConfigChange('label', e.target.value)}
          placeholder="Button label"
          style={{
            padding: '0.5rem',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            marginRight: '0.5rem'
          }}
        />
        <select
          value={config.variant || 'primary'}
          onChange={(e) => handleConfigChange('variant', e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #e9ecef',
            borderRadius: '4px'
          }}
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="success">Success</option>
          <option value="danger">Danger</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
      </div>
    );
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      {config.label || 'Click me'}
    </button>
  );
};

// Divider Component
export const DividerComponent = ({ component, isEditing = false, onUpdate }) => {
  const { config } = component;

  const style = {
    borderTop: `${config.thickness || '1px'} ${config.style || 'solid'} ${config.color || '#e9ecef'}`,
    margin: '1rem 0'
  };

  return <hr style={style} />;
};

// Spacer Component
export const SpacerComponent = ({ component }) => {
  const { config } = component;

  const style = {
    height: config.height || '20px',
    width: '100%'
  };

  return <div style={style}></div>;
};

// Image Component
export const ImageComponent = ({ component, isEditing = false, onUpdate }) => {
  const { config } = component;

  const handleConfigChange = (field, value) => {
    if (onUpdate) {
      onUpdate({
        ...component,
        config: { ...config, [field]: value }
      });
    }
  };

  const style = {
    width: config.width || 'auto',
    height: config.height || 'auto',
    objectFit: config.fit || 'cover',
    borderRadius: '4px'
  };

  if (isEditing) {
    return (
      <div className="component-editing">
        <input
          type="text"
          value={config.src || ''}
          onChange={(e) => handleConfigChange('src', e.target.value)}
          placeholder="Image URL"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #e9ecef',
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }}
        />
        <input
          type="text"
          value={config.alt || ''}
          onChange={(e) => handleConfigChange('alt', e.target.value)}
          placeholder="Alt text"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #e9ecef',
            borderRadius: '4px'
          }}
        />
      </div>
    );
  }

  if (!config.src) {
    return (
      <div
        style={{
          ...style,
          background: '#f8f9fa',
          border: '2px dashed #e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d',
          minHeight: '100px'
        }}
      >
        🖼️ Image
      </div>
    );
  }

  return (
    <img
      src={config.src}
      alt={config.alt || ''}
      style={style}
    />
  );
};