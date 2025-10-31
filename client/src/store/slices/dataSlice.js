import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getTables,
  getTableSchema,
  getTableData,
  createTable,
  insertRow
} from '../../services/api';

const DEFAULT_LIMIT = 100;

const initialState = {
  activeDatabaseId: null,
  tables: [],
  tablesStatus: 'idle',
  tablesError: null,
  selectedTable: null,
  schema: [],
  schemaStatus: 'idle',
  schemaError: null,
  tableResult: null,
  tableDataStatus: 'idle',
  tableDataError: null,
  pagination: { limit: DEFAULT_LIMIT, offset: 0 },
  lastRefreshedAt: null,
  createTableStatus: 'idle',
  createTableError: null,
  insertRowStatus: 'idle',
  insertRowError: null
};

const extractError = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return error?.message || 'Unknown error';
};

export const fetchTables = createAsyncThunk(
  'data/fetchTables',
  async (dbId, thunkAPI) => {
    try {
      const tables = await getTables(dbId);
      return { dbId, tables };
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const fetchSchema = createAsyncThunk(
  'data/fetchSchema',
  async ({ dbId, tableName }, thunkAPI) => {
    try {
      const schema = await getTableSchema(dbId, tableName);
      return { dbId, tableName, schema };
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const fetchTableRows = createAsyncThunk(
  'data/fetchTableRows',
  async ({ dbId, tableName, limit, offset }, thunkAPI) => {
    try {
      const result = await getTableData(dbId, tableName, limit, offset);
      return { dbId, tableName, result, pagination: { limit, offset } };
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const createDatabaseTable = createAsyncThunk(
  'data/createTable',
  async ({ dbId, tableName, columns, foreignKeys }, thunkAPI) => {
    try {
      await createTable(dbId, tableName, columns, foreignKeys);
      await thunkAPI.dispatch(fetchTables(dbId));
      return { tableName };
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

export const insertTableRow = createAsyncThunk(
  'data/insertRow',
  async ({ dbId, tableName, rowData }, thunkAPI) => {
    try {
      const result = await insertRow(dbId, tableName, rowData);
      // After insert, refresh the table data
      await thunkAPI.dispatch(fetchTableRows({
        dbId,
        tableName,
        limit: thunkAPI.getState().data.pagination.limit,
        offset: thunkAPI.getState().data.pagination.offset
      }));
      return result;
    } catch (err) {
      return thunkAPI.rejectWithValue(extractError(err));
    }
  }
);

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setActiveDatabase(state, action) {
      if (state.activeDatabaseId !== action.payload) {
        state.activeDatabaseId = action.payload;
        state.tables = [];
        state.tablesStatus = 'idle';
        state.tablesError = null;
        state.selectedTable = null;
        state.schema = [];
        state.schemaStatus = 'idle';
        state.schemaError = null;
        state.tableResult = null;
        state.tableDataStatus = 'idle';
        state.tableDataError = null;
        state.pagination = { limit: DEFAULT_LIMIT, offset: 0 };
        state.lastRefreshedAt = null;
      }
    },
    setSelectedTable(state, action) {
      state.selectedTable = action.payload;
      state.schema = [];
      state.schemaStatus = 'idle';
      state.schemaError = null;
      state.tableResult = null;
      state.tableDataStatus = 'idle';
      state.tableDataError = null;
      state.pagination = { limit: DEFAULT_LIMIT, offset: 0 };
    },
    setPagination(state, action) {
      const { limit, offset } = action.payload;
      if (typeof limit === 'number' && limit > 0) {
        state.pagination.limit = limit;
      }
      if (typeof offset === 'number' && offset >= 0) {
        state.pagination.offset = offset;
      }
    },
    resetDataState(state) {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTables.pending, (state) => {
        state.tablesStatus = 'loading';
        state.tablesError = null;
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        if (state.activeDatabaseId === action.payload.dbId) {
          state.tablesStatus = 'succeeded';
          state.tables = action.payload.tables;
          state.lastRefreshedAt = Date.now();
        }
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.tablesStatus = 'failed';
        state.tablesError = action.payload || 'Failed to load tables';
      })
      .addCase(fetchSchema.pending, (state) => {
        state.schemaStatus = 'loading';
        state.schemaError = null;
      })
      .addCase(fetchSchema.fulfilled, (state, action) => {
        if (
          state.activeDatabaseId === action.payload.dbId &&
          state.selectedTable === action.payload.tableName
        ) {
          state.schemaStatus = 'succeeded';
          state.schema = action.payload.schema;
        }
      })
      .addCase(fetchSchema.rejected, (state, action) => {
        state.schemaStatus = 'failed';
        state.schemaError = action.payload || 'Failed to load schema';
      })
      .addCase(fetchTableRows.pending, (state) => {
        state.tableDataStatus = 'loading';
        state.tableDataError = null;
      })
      .addCase(fetchTableRows.fulfilled, (state, action) => {
        if (
          state.activeDatabaseId === action.payload.dbId &&
          state.selectedTable === action.payload.tableName
        ) {
          state.tableDataStatus = 'succeeded';
          state.tableResult = action.payload.result;
          state.pagination = action.payload.pagination;
          state.lastRefreshedAt = Date.now();
        }
      })
      .addCase(fetchTableRows.rejected, (state, action) => {
        state.tableDataStatus = 'failed';
        state.tableDataError = action.payload || 'Failed to load table data';
      })
      .addCase(createDatabaseTable.pending, (state) => {
        state.createTableStatus = 'loading';
        state.createTableError = null;
      })
      .addCase(createDatabaseTable.fulfilled, (state) => {
        state.createTableStatus = 'succeeded';
      })
      .addCase(createDatabaseTable.rejected, (state, action) => {
        state.createTableStatus = 'failed';
        state.createTableError = action.payload || 'Failed to create table';
      })
      .addCase(insertTableRow.pending, (state) => {
        state.insertRowStatus = 'loading';
        state.insertRowError = null;
      })
      .addCase(insertTableRow.fulfilled, (state) => {
        state.insertRowStatus = 'succeeded';
      })
      .addCase(insertTableRow.rejected, (state, action) => {
        state.insertRowStatus = 'failed';
        state.insertRowError = action.payload || 'Failed to insert row';
      });
  }
});

export const { setActiveDatabase, setSelectedTable, setPagination, resetDataState } = dataSlice.actions;
export default dataSlice.reducer;
export { DEFAULT_LIMIT };
