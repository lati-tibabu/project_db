import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApps, createApp, updateApp, deleteApp } from '../../services/api';

// NOTE: import path above will be resolved by bundler; keep concise here.

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  openAppIds: [],
  activeAppId: null
};

const extractError = (err) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.error) return err.response.data.error;
  return err?.message || 'Unknown error';
};

export const fetchApps = createAsyncThunk('apps/fetchAll', async (_, thunkAPI) => {
  try {
    const data = await getApps();
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(extractError(err));
  }
});

export const addApp = createAsyncThunk('apps/add', async (payload, thunkAPI) => {
  try {
    const data = await createApp(payload);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(extractError(err));
  }
});

export const editApp = createAsyncThunk('apps/edit', async ({ id, updates }, thunkAPI) => {
  try {
    const data = await updateApp(id, updates);
    return data;
  } catch (err) {
    return thunkAPI.rejectWithValue(extractError(err));
  }
});

export const removeApp = createAsyncThunk('apps/remove', async (id, thunkAPI) => {
  try {
    await deleteApp(id);
    return id;
  } catch (err) {
    return thunkAPI.rejectWithValue(extractError(err));
  }
});

const appsSlice = createSlice({
  name: 'apps',
  initialState,
  reducers: {
    openAppInTab(state, action) {
      const appId = action.payload;
      if (!state.openAppIds.includes(appId)) {
        state.openAppIds.push(appId);
      }
      state.activeAppId = appId;
    },
    closeAppTab(state, action) {
      const appId = action.payload;
      state.openAppIds = state.openAppIds.filter(id => id !== appId);
      if (state.activeAppId === appId) {
        state.activeAppId = state.openAppIds.length > 0 ? state.openAppIds[state.openAppIds.length - 1] : null;
      }
    },
    setActiveApp(state, action) {
      if (state.openAppIds.includes(action.payload)) {
        state.activeAppId = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApps.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchApps.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchApps.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(addApp.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(editApp.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(removeApp.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i.id !== action.payload);
        state.openAppIds = state.openAppIds.filter(id => id !== action.payload);
        if (state.activeAppId === action.payload) {
          state.activeAppId = state.openAppIds.length > 0 ? state.openAppIds[state.openAppIds.length - 1] : null;
        }
      });
  }
});

export const { openAppInTab, closeAppTab, setActiveApp } = appsSlice.actions;
export default appsSlice.reducer;
