import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApps, openAppInTab, setActiveApp } from '../store/slices/appsSlice';
import { fetchDatabases } from '../store/slices/databasesSlice';
import AppView from '../components/AppView';

function AppPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: apps, status } = useSelector(s => s.apps);
  const app = apps.find(a => a.id === appId);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchApps());
    }
    dispatch(fetchDatabases());
  }, [status, dispatch]);

  useEffect(() => {
    if (app) {
      dispatch(openAppInTab(appId));
      dispatch(setActiveApp(appId));
    } else if (status === 'succeeded') {
      // App not found, redirect to home
      navigate('/');
    }
  }, [app, appId, status, navigate, dispatch]);

  if (!app) {
    return <div className="loading">Loading app...</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>{app.name}</h1>
        <p>{app.description}</p>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
          style={{ position: 'absolute', top: '1rem', right: '2rem' }}
        >
          ← Back to Dashboard
        </button>
      </header>

      <div className="container">
        <AppView standalone={true} />
      </div>
    </div>
  );
}

export default AppPage;