import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDatabaseSummary,
  getDatabaseActivityTrends,
  getRecentQueries
} from '../../services/api';

const initialState = {
  summary: null,
  trends: [],
  recentQueries: [],
  status: 'idle',
  error: null,
  lastUpdated: null,
  autoRefreshEnabled: true,
  refreshInterval: 30000 // 30 seconds
};

const extractError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return error?.message || 'Unknown error';
};

// Load dashboard data from localStorage
const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('dashboardData');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if data is not too old (max 1 hour)
      if (parsed.lastUpdated && (Date.now() - new Date(parsed.lastUpdated).getTime()) < 3600000) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load dashboard data from localStorage:', err);
  }
  return null;
};

// Save dashboard data to localStorage
const saveToLocalStorage = (state) => {
  try {
    localStorage.setItem('dashboardData', JSON.stringify({
      summary: state.summary,
      trends: state.trends,
      recentQueries: state.recentQueries,
      lastUpdated: state.lastUpdated
    }));
  } catch (err) {
    console.warn('Failed to save dashboard data to localStorage:', err);
  }
};

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, thunkAPI) => {
    try {
      const [summary, trends, recentQueries] = await Promise.all([
        getDatabaseSummary(),
        getDatabaseActivityTrends(7),
        getRecentQueries(20)
      ]);

      return {
        summary,
        trends,
        recentQueries,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const refreshDashboardData = createAsyncThunk(
  'dashboard/refreshData',
  async (_, thunkAPI) => {
    try {
      const [summary, trends, recentQueries] = await Promise.all([
        getDatabaseSummary(),
        getDatabaseActivityTrends(7),
        getRecentQueries(20)
      ]);

      return {
        summary,
        trends,
        recentQueries,
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: () => {
    // Try to load from localStorage on initialization
    const stored = loadFromLocalStorage();
    if (stored) {
      return {
        ...initialState,
        ...stored,
        status: 'succeeded' // Mark as succeeded since we have cached data
      };
    }
    return initialState;
  },
  reducers: {
    clearDashboardError(state) {
      state.error = null;
    },
    setAutoRefresh(state, action) {
      state.autoRefreshEnabled = action.payload;
    },
    setRefreshInterval(state, action) {
      state.refreshInterval = action.payload;
    },
    clearDashboardData(state) {
      state.summary = null;
      state.trends = [];
      state.recentQueries = [];
      state.lastUpdated = null;
      localStorage.removeItem('dashboardData');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload.summary;
        state.trends = action.payload.trends;
        state.recentQueries = action.payload.recentQueries;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;

        // Save to localStorage
        saveToLocalStorage(state);
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load dashboard data';
      })
      .addCase(refreshDashboardData.pending, (state) => {
        state.status = 'refreshing';
      })
      .addCase(refreshDashboardData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload.summary;
        state.trends = action.payload.trends;
        state.recentQueries = action.payload.recentQueries;
        state.lastUpdated = action.payload.lastUpdated;
        state.error = null;

        // Save to localStorage
        saveToLocalStorage(state);
      })
      .addCase(refreshDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to refresh dashboard data';
      });
  }
});

export const {
  clearDashboardError,
  setAutoRefresh,
  setRefreshInterval,
  clearDashboardData
} = dashboardSlice.actions;

export default dashboardSlice.reducer;