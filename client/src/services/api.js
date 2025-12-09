import axios from 'axios';

const API_BASE_URL = '/api';

// Configure axios to send credentials
axios.defaults.withCredentials = true;

// Database Configuration APIs
export const getDatabases = async () => {
  const response = await axios.get(`${API_BASE_URL}/databases`);
  return response.data;
};

export const getDatabase = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/databases/${id}`);
  return response.data;
};

export const createDatabase = async (database) => {
  const response = await axios.post(`${API_BASE_URL}/databases`, database);
  return response.data;
};

export const createDatabaseFromConf = async (confPath) => {
  const response = await axios.post(`${API_BASE_URL}/databases/from-conf`, { confPath });
  return response.data;
};

export const updateDatabase = async (id, database) => {
  const response = await axios.put(`${API_BASE_URL}/databases/${id}`, database);
  return response.data;
};

export const deleteDatabase = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/databases/${id}`);
  return response.data;
};

export const testDatabaseConnection = async (id) => {
  const response = await axios.post(`${API_BASE_URL}/databases/${id}/test`);
  return response.data;
};

// Database Summary APIs
export const getDatabaseSummary = async () => {
  const response = await axios.get(`${API_BASE_URL}/databases/summary/stats`);
  return response.data;
};

export const getDatabaseActivityTrends = async (days = 7) => {
  const response = await axios.get(`${API_BASE_URL}/databases/activity/trends`, {
    params: { days }
  });
  return response.data;
};

export const getRecentQueries = async (limit = 10) => {
  const response = await axios.get(`${API_BASE_URL}/databases/queries/recent`, {
    params: { limit }
  });
  return response.data;
};

// Data APIs
export const getTables = async (dbId) => {
  const response = await axios.get(`${API_BASE_URL}/data/${dbId}/tables`);
  return response.data;
};

export const getTableSchema = async (dbId, tableName) => {
  const response = await axios.get(`${API_BASE_URL}/data/${dbId}/tables/${tableName}/schema`);
  return response.data;
};

export const getTableData = async (dbId, tableName, limit = 100, offset = 0) => {
  const response = await axios.get(`${API_BASE_URL}/data/${dbId}/tables/${tableName}/data`, {
    params: { limit, offset }
  });
  return response.data;
};

export const executeQuery = async (dbId, query, params = []) => {
  const response = await axios.post(`${API_BASE_URL}/data/${dbId}/query`, { query, params });
  return response.data;
};

export const insertRow = async (dbId, tableName, data) => {
  const response = await axios.post(`${API_BASE_URL}/data/${dbId}/tables/${tableName}/rows`, { data });
  return response.data;
};

export const updateRow = async (dbId, tableName, data, where) => {
  const response = await axios.put(`${API_BASE_URL}/data/${dbId}/tables/${tableName}/rows`, { data, where });
  return response.data;
};

export const deleteRow = async (dbId, tableName, where) => {
  const response = await axios.delete(`${API_BASE_URL}/data/${dbId}/tables/${tableName}/rows`, { data: { where } });
  return response.data;
};

export const createTable = async (dbId, tableName, columns, foreignKeys) => {
  const response = await axios.post(`${API_BASE_URL}/data/${dbId}/tables`, { tableName, columns, foreignKeys });
  return response.data;
};

// Apps APIs
export const getApps = async () => {
  const response = await axios.get(`${API_BASE_URL}/apps`);
  return response.data;
};

export const getApp = async (id) => {
  const response = await axios.get(`${API_BASE_URL}/apps/${id}`);
  return response.data;
};

export const createApp = async (app) => {
  const response = await axios.post(`${API_BASE_URL}/apps`, app);
  return response.data;
};

export const updateApp = async (id, app) => {
  const response = await axios.put(`${API_BASE_URL}/apps/${id}`, app);
  return response.data;
};

export const deleteApp = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/apps/${id}`);
  return response.data;
};

// Authentication APIs
export const loginToApp = async (appId, username, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login/${appId}`, { username, password });
  return response.data;
};

export const logoutFromApp = async (appId) => {
  const response = await axios.post(`${API_BASE_URL}/auth/logout/${appId}`);
  return response.data;
};

export const checkAuthStatus = async (appId) => {
  const response = await axios.get(`${API_BASE_URL}/auth/status/${appId}`);
  return response.data;
};

export const changePassword = async (appId, currentPassword, newPassword) => {
  const response = await axios.post(`${API_BASE_URL}/auth/change-password/${appId}`, { currentPassword, newPassword });
  return response.data;
};

// User Management APIs
export const getUsers = async (appId) => {
  const response = await axios.get(`${API_BASE_URL}/auth/users/${appId}`);
  return response.data;
};

export const createUser = async (appId, userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/users/${appId}`, userData);
  return response.data;
};

export const updateUser = async (appId, userId, userData) => {
  const response = await axios.put(`${API_BASE_URL}/auth/users/${appId}/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (appId, userId) => {
  const response = await axios.delete(`${API_BASE_URL}/auth/users/${appId}/${userId}`);
  return response.data;
};

// Dynamic API Documentation
export const getApiDocumentation = async (appId) => {
  const response = await axios.get(`${API_BASE_URL}/dynamic/docs/${appId}`);
  return response.data;
};

// Dynamic API calls
export const callDynamicApi = async (method, appId, tableName, data = null, id = null) => {
  const url = id
    ? `${API_BASE_URL}/dynamic/api/${appId}/${tableName}/${id}`
    : `${API_BASE_URL}/dynamic/api/${appId}/${tableName}`;

  const config = { method, url };
  if (data && (method === 'post' || method === 'put')) {
    config.data = data;
  }

  const response = await axios(config);
  return response.data;
};
