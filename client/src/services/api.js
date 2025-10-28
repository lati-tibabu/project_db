import axios from 'axios';

const API_BASE_URL = '/api';

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
