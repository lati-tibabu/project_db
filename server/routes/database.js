const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const { testConnection, createDatabaseIfNotExists } = require('../utils/database');
const { loadConfig } = require('../utils/config');

const toBoolean = (value) => {
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

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
  const parsedPort = port ? parseInt(port, 10) : NaN;
  const normalizedPort = Number.isFinite(parsedPort) ? parsedPort : 5432;
  const sslEnabled = toBoolean(ssl);
  const createFlagInput = req.body.create_on_server ?? req.body.createOnServer ?? false;
  const createOnServer = toBoolean(createFlagInput);
    
    // Validate required fields
    if (!name || !host || !database || !user || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'host', 'database', 'user', 'password']
      });
    }
    
    // If requested, create the database on the server before testing connection
    if (createOnServer) {
      const adminCfg = { host, port: normalizedPort, database: 'postgres', user, password, ssl: sslEnabled };
      try {
        await createDatabaseIfNotExists(adminCfg, database);
      } catch (err) {
        return res.status(400).json({ error: 'Failed to create database on server', message: err.message });
      }
    }

    // Test connection before saving
    const connectionTest = await testConnection({
      host,
      port: normalizedPort,
      database,
      user,
      password,
      ssl: sslEnabled
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
      port: normalizedPort,
      database,
      user,
      password,
      ssl: sslEnabled
    });
    
    // Don't send password to client
    const { password: _, ...safeDatabase } = newDatabase;
    res.status(201).json(safeDatabase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add database', message: error.message });
  }
});

// Add a new database configuration from a .conf file
router.post('/from-conf', async (req, res) => {
  try {
    const { confPath } = req.body;
    if (!confPath) {
      return res.status(400).json({ error: 'Missing confPath in body' });
    }

    // Load .conf file (can be relative to server/config or absolute)
    const cfg = loadConfig(confPath);

    // Map expected keys with defaults
    const name = cfg.name || `conf_${Date.now()}`;
    const host = cfg.host;
    const parsedPort = cfg.port ? parseInt(cfg.port, 10) : NaN;
    const port = Number.isFinite(parsedPort) ? parsedPort : 5432;
    const database = cfg.database;
    const user = cfg.user;
    const password = cfg.password;
    const ssl = toBoolean(cfg.ssl);
    const createOnServer = toBoolean(cfg.create_on_server);

    if (!host || !database || !user || !password) {
      return res.status(400).json({ error: 'Missing required keys in conf file (host, database, user, password)' });
    }

    // Optionally create database on server if requested
    if (createOnServer) {
      try {
        await createDatabaseIfNotExists(
          { host, port, database: 'postgres', user, password, ssl },
          database
        );
      } catch (err) {
        return res.status(400).json({ error: 'Failed to create database on server', message: err.message });
      }
    }

    // Test connection to the target database
    const connectionTest = await testConnection({ host, port, database, user, password, ssl });
    if (!connectionTest.success) {
      return res.status(400).json({ error: 'Connection test failed', message: connectionTest.message });
    }

    const newDatabase = storage.addDatabase({ name, host, port, database, user, password, ssl });
    const { password: _, ...safeDatabase } = newDatabase;
    res.status(201).json(safeDatabase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add database from conf', message: error.message });
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
