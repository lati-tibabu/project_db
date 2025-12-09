import React from 'react';
import AppEditor from './AppEditor';

function AppView({ standalone = false }) {
  return <AppEditor standalone={standalone} />;
}

export default AppView;