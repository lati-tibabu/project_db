const { Pool } = require('pg');

/**
 * Create a PostgreSQL connection pool
 * @param {Object} config - Database configuration
 * @returns {Pool} PostgreSQL connection pool
 */
function createPool(config) {
  return new Pool({
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });
}

/**
 * Test database connection
 * @param {Object} config - Database configuration
 * @returns {Promise<Object>} Connection test result
 */
async function testConnection(config) {
  const pool = createPool(config);
  
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    await pool.end();
    return { success: false, message: error.message };
  }
}

/**
 * Execute a query on a database
 * @param {Object} config - Database configuration
 * @param {string} query - SQL query to execute
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function executeQuery(config, query, params = []) {
  const pool = createPool(config);
  
  try {
    const result = await pool.query(query, params);
    await pool.end();
    return {
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields
    };
  } catch (error) {
    await pool.end();
    throw error;
  }
}

/**
 * Get all tables in a database
 * @param {Object} config - Database configuration
 * @returns {Promise<Array>} List of tables
 */
async function getTables(config) {
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  const result = await executeQuery(config, query);
  return result.rows.map(row => row.table_name);
}

/**
 * Get table schema
 * @param {Object} config - Database configuration
 * @param {string} tableName - Table name
 * @returns {Promise<Array>} Table schema
 */
async function getTableSchema(config, tableName) {
  const query = `
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = $1
    ORDER BY ordinal_position;
  `;
  
  const result = await executeQuery(config, query, [tableName]);
  return result.rows;
}

/**
 * Get table data with pagination
 * @param {Object} config - Database configuration
 * @param {string} tableName - Table name
 * @param {number} limit - Number of rows to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} Table data
 */
async function getTableData(config, tableName, limit = 100, offset = 0) {
  // Validate table name to prevent SQL injection
  const validTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  
  const query = `SELECT * FROM ${validTableName} LIMIT $1 OFFSET $2`;
  return await executeQuery(config, query, [limit, offset]);
}

module.exports = {
  createPool,
  testConnection,
  executeQuery,
  getTables,
  getTableSchema,
  getTableData
};
