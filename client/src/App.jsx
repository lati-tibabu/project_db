import React from 'react';
import Home from './pages/Home';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>PostgreSQL Database Manager</h1>
        <p>Configure and manage your PostgreSQL databases with ease</p>
      </header>
      
      <div className="container">
        <Home />
      </div>
    </div>
  );
}

export default App;
