const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const { executeQuery, getTables, getTableSchema, getTableData, sanitizeTableName, createTable } = require('../utils/database');

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
  const startTime = process.hrtime.bigint();
  
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const { query, params } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
  // Basic SQL injection protection - limit to safe read/write/DDL commands
    const trimmedQuery = query.trim().toUpperCase();
  const allowedCommands = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'];
    const isAllowed = allowedCommands.some(cmd => trimmedQuery.startsWith(cmd));
    
    if (!isAllowed) {
      return res.status(400).json({ 
        error: 'Only SELECT, INSERT, UPDATE, and DELETE queries are allowed' 
      });
    }
    
    const result = await executeQuery(database, query, params || []);
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    res.json({
      ...result,
      executionTime: Math.round(executionTimeMs)
    });
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000;
    
    res.status(500).json({ 
      error: 'Query execution failed', 
      message: error.message,
      executionTime: Math.round(executionTimeMs)
    });
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
    
    const tableName = sanitizeTableName(req.params.tableName);
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
    
    const tableName = sanitizeTableName(req.params.tableName);
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
    
    const tableName = sanitizeTableName(req.params.tableName);
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

// Create a new table
router.post('/:dbId/tables', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.dbId);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const { tableName, columns, foreignKeys } = req.body;

    if (!tableName || !columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: 'tableName and columns array are required' });
    }

    // Validate table name
    const validTableName = sanitizeTableName(tableName);

    // Validate columns
    for (const col of columns) {
      if (!col.name || !col.type) {
        return res.status(400).json({ error: 'Each column must have name and type' });
      }
      sanitizeTableName(col.name); // Check column name
    }

    // Validate foreign keys if provided
    if (foreignKeys && Array.isArray(foreignKeys)) {
      for (const fk of foreignKeys) {
        if (!fk.column || !fk.referencesTable || !fk.referencesColumn) {
          return res.status(400).json({ error: 'Each foreign key must have column, referencesTable, and referencesColumn' });
        }
      }
    }

    const result = await createTable(database, validTableName, columns, foreignKeys || []);
    res.status(201).json({ message: 'Table created successfully', result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table', message: error.message });
  }
});

module.exports = router;
