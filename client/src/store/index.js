import { configureStore } from '@reduxjs/toolkit';
import databasesReducer from './slices/databasesSlice';
import dataReducer from './slices/dataSlice';
import appsReducer from './slices/appsSlice';
import dashboardReducer from './slices/dashboardSlice';

const store = configureStore({
  reducer: {
    databases: databasesReducer,
    data: dataReducer,
    apps: appsReducer,
    dashboard: dashboardReducer
  },
});

export default store;
