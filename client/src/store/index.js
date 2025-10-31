import { configureStore } from '@reduxjs/toolkit';
import databasesReducer from './slices/databasesSlice';
import dataReducer from './slices/dataSlice';
import appsReducer from './slices/appsSlice';

const store = configureStore({
  reducer: {
    databases: databasesReducer,
    data: dataReducer,
    apps: appsReducer
  },
});

export default store;
