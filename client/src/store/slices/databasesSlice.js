import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDatabases,
  createDatabase,
  updateDatabase,
  deleteDatabase,
  createDatabaseFromConf
} from '../../services/api';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  selectedId: null,
  createStatus: 'idle',
  createError: null
};

const extractError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return error?.message || 'Unknown error';
};

export const fetchDatabases = createAsyncThunk(
  'databases/fetchAll',
  async (_, thunkAPI) => {
    try {
      const data = await getDatabases();
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const addDatabase = createAsyncThunk(
  'databases/add',
  async (payload, thunkAPI) => {
    try {
      const data = await createDatabase(payload);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const addDatabaseFromConf = createAsyncThunk(
  'databases/addFromConf',
  async (confPath, thunkAPI) => {
    try {
      const data = await createDatabaseFromConf(confPath);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const editDatabase = createAsyncThunk(
  'databases/update',
  async ({ id, updates }, thunkAPI) => {
    try {
      const data = await updateDatabase(id, updates);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const removeDatabase = createAsyncThunk(
  'databases/remove',
  async (id, thunkAPI) => {
    try {
      await deleteDatabase(id);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

const databasesSlice = createSlice({
  name: 'databases',
  initialState,
  reducers: {
    setSelectedDatabase(state, action) {
      state.selectedId = action.payload;
    },
    clearDatabaseError(state) {
      state.error = null;
      state.createError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatabases.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDatabases.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchDatabases.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to load databases';
      })
      .addCase(addDatabase.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(addDatabase.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(addDatabase.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload || 'Failed to add database';
      })
      .addCase(addDatabaseFromConf.pending, (state) => {
        state.createStatus = 'loading';
        state.createError = null;
      })
      .addCase(addDatabaseFromConf.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(addDatabaseFromConf.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.createError = action.payload || 'Failed to add database from conf';
      })
      .addCase(editDatabase.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          state.items[index] = updated;
        }
      })
      .addCase(removeDatabase.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((item) => item.id !== id);
        if (state.selectedId === id) {
          state.selectedId = null;
        }
      })
      .addCase(removeDatabase.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete database';
      });
  }
});

export const { setSelectedDatabase, clearDatabaseError } = databasesSlice.actions;
export default databasesSlice.reducer;
