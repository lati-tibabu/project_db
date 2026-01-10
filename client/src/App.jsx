import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AppPage from './pages/AppPage';
import { getHealthStatus } from './services/api';

function App() {
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const health = await getHealthStatus();
        setDbStatus(health.database);
      } catch (error) {
        setDbStatus({ connected: false, error: 'Unable to check status' });
      }
    };

    checkDbStatus();
    const interval = setInterval(checkDbStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={
          <>
            <header className="header">
              <div className="header-content">
                <div>
                  <h1>PostaDesk</h1>
                  <p>Configure and manage your PostgreSQL databases with ease</p>
                </div>
                <div className="db-status">
                  {dbStatus ? (
                    dbStatus.connected ? (
                      <span className="status-connected">🟢 Database Connected</span>
                    ) : (
                      <span className="status-disconnected">🔴 Database Disconnected</span>
                    )
                  ) : (
                    <span className="status-checking">⏳ Checking...</span>
                  )}
                </div>
              </div>
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
