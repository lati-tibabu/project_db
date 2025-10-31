const { Pool } = require('pg');
const format = require('pg-format');

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
 * Create database if it does not exist using an admin connection.
 * @param {Object} adminConfig - Connection config to an admin database (e.g., database: 'postgres')
 * @param {string} dbName - Database name to create
 */
async function createDatabaseIfNotExists(adminConfig, dbName) {
  const pool = createPool(adminConfig);
  try {
    const client = await pool.connect();
    // Use pg-format to safely format identifiers
    const safe = format('CREATE DATABASE %I', dbName);
    await client.query(safe);
    client.release();
  } catch (err) {
    // 42P04 = duplicate_database
    if (err.code !== '42P04') {
      throw err;
    }
  } finally {
    await pool.end();
  }
}

/**
 * Execute a query on a database
 * Note: This function uses parameterized queries to prevent SQL injection.
 * The query parameter should always use placeholders ($1, $2, etc.) for user input.
 * @param {Object} config - Database configuration
 * @param {string} query - SQL query to execute (must use parameterized placeholders)
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function executeQuery(config, query, params = []) {
  const pool = createPool(config);
  
  try {
    // Use parameterized queries to prevent SQL injection
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
 * Validate and sanitize table name
 * @param {string} tableName - Table name to validate
 * @returns {string} Sanitized table name
 * @throws {Error} If table name is invalid
 */
function sanitizeTableName(tableName) {
  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error('Invalid table name: must start with a letter or underscore and contain only alphanumeric characters and underscores');
  }
  
  // Prevent SQL keywords from being used as table names
  const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TABLE', 'FROM', 'WHERE'];
  if (sqlKeywords.includes(tableName.toUpperCase())) {
    throw new Error('Invalid table name: cannot use SQL keywords');
  }
  
  return tableName;
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
  // Validate and sanitize table name
  const validTableName = sanitizeTableName(tableName);
  
  // Use parameterized query for limit and offset
  const query = `SELECT * FROM ${validTableName} LIMIT $1 OFFSET $2`;
  return await executeQuery(config, query, [limit, offset]);
}

/**
 * Create a table with specified columns and foreign keys
 * @param {Object} config - Database configuration
 * @param {string} tableName - Name of the table to create
 * @param {Array} columns - Array of column definitions: {name, type, nullable, defaultValue, isPrimaryKey}
 * @param {Array} foreignKeys - Array of FK definitions: {column, referencesTable, referencesColumn, onDelete, onUpdate}
 * @returns {Promise<Object>} Result of the CREATE TABLE query
 */
async function createTable(config, tableName, columns, foreignKeys = []) {
  const safeTable = format.ident(sanitizeTableName(tableName));

  // Build column definitions
  const columnDefs = columns.map(col => {
    const safeName = format.ident(sanitizeTableName(col.name));
    let def = `${safeName} ${col.type}`;
    if (col.isPrimaryKey) def += ' PRIMARY KEY';
    if (col.nullable === false) def += ' NOT NULL';

    const hasDefault = col.defaultValue !== undefined && col.defaultValue !== null && !(typeof col.defaultValue === 'string' && col.defaultValue.trim() === '');
    if (hasDefault) {
      if (typeof col.defaultValue === 'string' && col.defaultValue.startsWith('raw:')) {
        def += ` DEFAULT ${col.defaultValue.slice(4)}`;
      } else if (typeof col.defaultValue === 'string') {
        def += ` DEFAULT ${format.literal(col.defaultValue)}`;
      } else {
        def += ` DEFAULT ${col.defaultValue}`;
      }
    }
    return def;
  }).join(', ');

  // Build foreign key constraints
  const fkDefs = foreignKeys.map(fk => {
    const safeCol = format.ident(sanitizeTableName(fk.column));
    const safeRefTable = format.ident(sanitizeTableName(fk.referencesTable));
    const safeRefCol = format.ident(sanitizeTableName(fk.referencesColumn));
    let def = `FOREIGN KEY (${safeCol}) REFERENCES ${safeRefTable}(${safeRefCol})`;
    if (fk.onDelete) def += ` ON DELETE ${fk.onDelete}`;
    if (fk.onUpdate) def += ` ON UPDATE ${fk.onUpdate}`;
    return def;
  }).join(', ');

  const allDefs = [columnDefs, fkDefs].filter(Boolean).join(', ');
  const query = `CREATE TABLE ${safeTable} (${allDefs})`;

  return await executeQuery(config, query);
}

module.exports = {
  createPool,
  testConnection,
  executeQuery,
  getTables,
  getTableSchema,
  getTableData,
  sanitizeTableName,
  createDatabaseIfNotExists,
  createTable
};
