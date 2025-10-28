const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const { executeQuery, getTables, getTableSchema, getTableData } = require('../utils/database');

// Get all tables for a database
router.get('/:dbId/tables', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const tables = await getTables(database);
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables', message: error.message });
  }
});

// Get table schema
router.get('/:dbId/tables/:tableName/schema', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const schema = await getTableSchema(database, req.params.tableName);
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch table schema', message: error.message });
  }
});

// Get table data
router.get('/:dbId/tables/:tableName/data', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const data = await getTableData(database, req.params.tableName, limit, offset);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch table data', message: error.message });
  }
});

// Execute a custom query
router.post('/:dbId/query', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const { query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Basic SQL injection protection - only allow SELECT, INSERT, UPDATE, DELETE
    const trimmedQuery = query.trim().toUpperCase();
    const allowedCommands = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    const isAllowed = allowedCommands.some(cmd => trimmedQuery.startsWith(cmd));
    
    if (!isAllowed) {
      return res.status(400).json({ 
        error: 'Only SELECT, INSERT, UPDATE, and DELETE queries are allowed' 
      });
    }
    
    const result = await executeQuery(database, query, params || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Query execution failed', message: error.message });
  }
});

// Insert data into a table
router.post('/:dbId/tables/:tableName/rows', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Data object is required' });
    }
    
    const tableName = req.params.tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;
    
    const result = await executeQuery(database, query, values);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to insert data', message: error.message });
  }
});

// Update data in a table
router.put('/:dbId/tables/:tableName/rows', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const { data, where } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Data object is required' });
    }
    
    if (!where || typeof where !== 'object') {
      return res.status(400).json({ error: 'Where condition is required' });
    }
    
    const tableName = req.params.tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const setColumns = Object.keys(data);
    const setValues = Object.values(data);
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);
    
    const setClause = setColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');
    const whereClause = whereColumns.map((col, i) => `${col} = $${setValues.length + i + 1}`).join(' AND ');
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause} 
      WHERE ${whereClause} 
      RETURNING *
    `;
    
    const result = await executeQuery(database, query, [...setValues, ...whereValues]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update data', message: error.message });
  }
});

// Delete data from a table
router.delete('/:dbId/tables/:tableName/rows', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const { where } = req.body;
    
    if (!where || typeof where !== 'object') {
      return res.status(400).json({ error: 'Where condition is required' });
    }
    
    const tableName = req.params.tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);
    
    const whereClause = whereColumns.map((col, i) => `${col} = $${i + 1}`).join(' AND ');
    
    const query = `DELETE FROM ${tableName} WHERE ${whereClause} RETURNING *`;
    
    const result = await executeQuery(database, query, whereValues);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete data', message: error.message });
  }
});

module.exports = router;
