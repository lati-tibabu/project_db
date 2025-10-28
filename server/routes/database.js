const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const { testConnection } = require('../utils/database');

// Get all database configurations
router.get('/', (req, res) => {
  try {
    const databases = storage.getDatabases();
    // Don't send passwords to client
    const safeDatabases = databases.map(({ password, ...db }) => db);
    res.json(safeDatabases);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch databases', message: error.message });
  }
});

// Get a specific database configuration
router.get('/:id', (req, res) => {
  try {
    const database = storage.getDatabase(req.params.id);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    // Don't send password to client
    const { password, ...safeDatabase } = database;
    res.json(safeDatabase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch database', message: error.message });
  }
});

// Add a new database configuration
router.post('/', async (req, res) => {
  try {
    const { name, host, port, database, user, password, ssl } = req.body;
    
    // Validate required fields
    if (!name || !host || !database || !user || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'host', 'database', 'user', 'password']
      });
    }
    
    // Test connection before saving
    const connectionTest = await testConnection({
      host,
      port: port || 5432,
      database,
      user,
      password,
      ssl: ssl || false
    });
    
    if (!connectionTest.success) {
      return res.status(400).json({
        error: 'Connection test failed',
        message: connectionTest.message
      });
    }
    
    const newDatabase = storage.addDatabase({
      name,
      host,
      port: port || 5432,
      database,
      user,
      password,
      ssl: ssl || false
    });
    
    // Don't send password to client
    const { password: _, ...safeDatabase } = newDatabase;
    res.status(201).json(safeDatabase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add database', message: error.message });
  }
});

// Update a database configuration
router.put('/:id', async (req, res) => {
  try {
    const { name, host, port, database, user, password, ssl } = req.body;
    
    const existingDb = storage.getDatabase(req.params.id);
    if (!existingDb) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const updates = {
      name: name || existingDb.name,
      host: host || existingDb.host,
      port: port || existingDb.port,
      database: database || existingDb.database,
      user: user || existingDb.user,
      password: password || existingDb.password,
      ssl: ssl !== undefined ? ssl : existingDb.ssl
    };
    
    // Test connection before saving
    const connectionTest = await testConnection(updates);
    
    if (!connectionTest.success) {
      return res.status(400).json({
        error: 'Connection test failed',
        message: connectionTest.message
      });
    }
    
    const updatedDatabase = storage.updateDatabase(req.params.id, updates);
    
    // Don't send password to client
    const { password: _, ...safeDatabase } = updatedDatabase;
    res.json(safeDatabase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update database', message: error.message });
  }
});

// Delete a database configuration
router.delete('/:id', (req, res) => {
  try {
    const deleted = storage.deleteDatabase(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Database not found' });
    }
    res.json({ message: 'Database deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete database', message: error.message });
  }
});

// Test database connection
router.post('/:id/test', async (req, res) => {
  try {
    const database = storage.getDatabase(req.params.id);
    if (!database) {
      return res.status(404).json({ error: 'Database not found' });
    }
    
    const result = await testConnection(database);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to test connection', message: error.message });
  }
});

module.exports = router;
