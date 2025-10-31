import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AppPage from './pages/AppPage';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          <>
            <header className="header">
              <h1>PostgreSQL Database Manager</h1>
              <p>Configure and manage your PostgreSQL databases with ease</p>
            </header>
            <div className="container">
              <Home />
            </div>
          </>
        } />
        <Route path="/app/:appId" element={<AppPage />} />
      </Routes>
    </div>
  );
}

export default App;
