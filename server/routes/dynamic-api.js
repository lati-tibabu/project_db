const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const { executeQuery, sanitizeTableName } = require('../utils/database');

// Dynamic API endpoints for tables
router.get('/api/:appId/:tableName', async (req, res) => {
  try {
    const { appId, tableName } = req.params;
    const { limit = 100, offset = 0, sort, filter } = req.query;

    // Check authentication
    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const dbConfig = await storage.getDatabase(app.databaseId);
    if (!dbConfig) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const safeTableName = sanitizeTableName(tableName);

    // Build query
    let query = `SELECT * FROM ${safeTableName}`;
    const params = [];
    const conditions = [];

    // Add filters
    if (filter) {
      try {
        const filterObj = JSON.parse(filter);
        Object.entries(filterObj).forEach(([key, value]) => {
          conditions.push(`${sanitizeTableName(key)} = $${params.length + 1}`);
          params.push(value);
        });
      } catch (e) {
        // Invalid filter, ignore
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add sorting
    if (sort) {
      const [column, direction] = sort.split(':');
      const safeColumn = sanitizeTableName(column);
      const safeDirection = direction?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${safeColumn} ${safeDirection}`;
    }

    // Add pagination
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await executeQuery(dbConfig, query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM ${safeTableName}`;
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    const countResult = await executeQuery(dbConfig, countQuery, params.slice(0, -2));

    res.json({
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('API GET error:', error);
    res.status(500).json({ error: 'Failed to fetch data', message: error.message });
  }
});

// Get single record
router.get('/api/:appId/:tableName/:id', async (req, res) => {
  try {
    const { appId, tableName, id } = req.params;

    // Check authentication
    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    const safeTableName = sanitizeTableName(tableName);
    const query = `SELECT * FROM ${safeTableName} WHERE id = $1`;

    const result = await executeQuery(dbConfig, query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('API GET single error:', error);
    res.status(500).json({ error: 'Failed to fetch record', message: error.message });
  }
});

// Create record
router.post('/api/:appId/:tableName', async (req, res) => {
  try {
    const { appId, tableName } = req.params;
    const data = req.body;

    // Check authentication and permissions
    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.session.authenticatedApps[appId].role;
    if (userRole === 'viewer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    const safeTableName = sanitizeTableName(tableName);

    // Get table schema to validate columns
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `;
    const schemaResult = await executeQuery(dbConfig, schemaQuery, [tableName]);

    // Filter data to only include valid columns
    const validColumns = schemaResult.rows.map(col => col.column_name);
    const filteredData = {};
    Object.keys(data).forEach(key => {
      if (validColumns.includes(key)) {
        filteredData[key] = data[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: 'No valid columns provided' });
    }

    // Build INSERT query
    const columns = Object.keys(filteredData);
    const placeholders = columns.map((_, i) => `$${i + 1}`);
    const values = columns.map(col => filteredData[col]);

    const insertQuery = `
      INSERT INTO ${safeTableName} (${columns.map(c => `"${c}"`).join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await executeQuery(dbConfig, insertQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('API POST error:', error);
    res.status(500).json({ error: 'Failed to create record', message: error.message });
  }
});

// Update record
router.put('/api/:appId/:tableName/:id', async (req, res) => {
  try {
    const { appId, tableName, id } = req.params;
    const data = req.body;

    // Check authentication and permissions
    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.session.authenticatedApps[appId].role;
    if (userRole === 'viewer') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    const safeTableName = sanitizeTableName(tableName);

    // Get table schema
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `;
    const schemaResult = await executeQuery(dbConfig, schemaQuery, [tableName]);

    const validColumns = schemaResult.rows.map(col => col.column_name);
    const filteredData = {};
    Object.keys(data).forEach(key => {
      if (validColumns.includes(key) && key !== 'id') {
        filteredData[key] = data[key];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ error: 'No valid columns provided' });
    }

    // Build UPDATE query
    const columns = Object.keys(filteredData);
    const setClause = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
    const values = columns.map(col => filteredData[col]);
    values.push(id);

    const updateQuery = `
      UPDATE ${safeTableName}
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await executeQuery(dbConfig, updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('API PUT error:', error);
    res.status(500).json({ error: 'Failed to update record', message: error.message });
  }
});

// Delete record
router.delete('/api/:appId/:tableName/:id', async (req, res) => {
  try {
    const { appId, tableName, id } = req.params;

    // Check authentication and permissions
    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.session.authenticatedApps[appId].role;
    if (userRole !== 'admin' && userRole !== 'editor') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    const safeTableName = sanitizeTableName(tableName);
    const deleteQuery = `DELETE FROM ${safeTableName} WHERE id = $1 RETURNING *`;

    const result = await executeQuery(dbConfig, deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('API DELETE error:', error);
    res.status(500).json({ error: 'Failed to delete record', message: error.message });
  }
});

// Get API documentation
router.get('/docs/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const dbConfig = await storage.getDatabase(app.databaseId);
    const tables = await require('../utils/database').getTables(dbConfig);

    const documentation = {
      app: app.name,
      baseUrl: `/api/dynamic/api/${appId}`,
      endpoints: []
    };

    for (const table of tables) {
      if (table === 'users') continue; // Skip users table for security

      const schema = await require('../utils/database').getTableSchema(dbConfig, table);

      documentation.endpoints.push({
        table,
        endpoints: [
          {
            method: 'GET',
            path: `/api/${appId}/${table}`,
            description: `Get all ${table} records`,
            query: {
              limit: 'number (default: 100)',
              offset: 'number (default: 0)',
              sort: 'column:asc|desc',
              filter: 'JSON object of column:value pairs'
            }
          },
          {
            method: 'GET',
            path: `/api/${appId}/${table}/:id`,
            description: `Get single ${table} record`
          },
          {
            method: 'POST',
            path: `/api/${appId}/${table}`,
            description: `Create new ${table} record`,
            permissions: 'editor+'
          },
          {
            method: 'PUT',
            path: `/api/${appId}/${table}/:id`,
            description: `Update ${table} record`,
            permissions: 'editor+'
          },
          {
            method: 'DELETE',
            path: `/api/${appId}/${table}/:id`,
            description: `Delete ${table} record`,
            permissions: 'admin/editor'
          }
        ],
        schema: schema.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default
        }))
      });
    }

    res.json(documentation);
  } catch (error) {
    console.error('API docs error:', error);
    res.status(500).json({ error: 'Failed to generate documentation', message: error.message });
  }
});

module.exports = router;