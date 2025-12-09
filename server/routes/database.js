const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');
const { testConnection, createDatabaseIfNotExists, executeQuery, getTables } = require('../utils/database');
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

// Create database on server without saving configuration
router.post('/create', async (req, res) => {
  try {
    const { host, port, database, user, password, ssl } = req.body;
    const parsedPort = port ? parseInt(port, 10) : NaN;
    const normalizedPort = Number.isFinite(parsedPort) ? parsedPort : 5432;
    const sslEnabled = toBoolean(ssl);
    
    // Validate required fields
    if (!host || !database || !user || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['host', 'database', 'user', 'password']
      });
    }
    
    // Create the database on the server
    const adminCfg = { host, port: normalizedPort, database: 'postgres', user, password, ssl: sslEnabled };
    try {
      await createDatabaseIfNotExists(adminCfg, database);
    } catch (err) {
      return res.status(400).json({ error: 'Failed to create database on server', message: err.message });
    }
    
    res.status(201).json({ message: `Database '${database}' created successfully on ${host}:${normalizedPort}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create database', message: error.message });
  }
});

// Get database summary statistics
router.get('/summary/stats', async (req, res) => {
  try {
    const databases = storage.getDatabases();
    const summary = {
      totalDatabases: databases.length,
      totalTables: 0,
      totalRecords: 0,
      totalSize: 0,
      databases: []
    };

    for (const db of databases) {
      try {
        const tables = await getTables(db);
        let dbRecords = 0;
        let dbSize = 0;

        // Get record counts and size for each table
        for (const table of tables.slice(0, 20)) { // Limit to first 20 tables for performance
          try {
            const countResult = await executeQuery(db, `SELECT COUNT(*)::bigint as count FROM "${table.replace(/"/g, '""')}"`);
            dbRecords += parseInt(countResult.rows[0]?.count || 0);

            // Get table size (approximate)
            const sizeResult = await executeQuery(db, `SELECT pg_total_relation_size('"${table.replace(/"/g, '""')}"') as size`);
            dbSize += parseInt(sizeResult.rows[0]?.size || 0);
          } catch (err) {
            // Skip tables that can't be queried
            console.warn(`Could not query table ${table} in database ${db.name}:`, err.message);
          }
        }

        summary.databases.push({
          id: db.id,
          name: db.name,
          tables: tables.length,
          records: dbRecords,
          size: dbSize
        });

        summary.totalTables += tables.length;
        summary.totalRecords += dbRecords;
        summary.totalSize += dbSize;
      } catch (err) {
        console.warn(`Could not connect to database ${db.name}:`, err.message);
        summary.databases.push({
          id: db.id,
          name: db.name,
          error: 'Connection failed'
        });
      }
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get database summary', message: error.message });
  }
});

// Get database activity trends (mock data for now - would need actual logging)
router.get('/activity/trends', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const databases = storage.getDatabases();

    // Generate mock activity data - in a real app, this would come from logs
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dayData = {
        date: date.toISOString().split('T')[0],
        queries: Math.floor(Math.random() * 100) + 10,
        connections: Math.floor(Math.random() * 20) + 5,
        databases: databases.length
      };

      trends.push(dayData);
    }

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activity trends', message: error.message });
  }
});

// Get recent queries across all databases (mock data - would need actual query logging)
router.get('/queries/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const databases = storage.getDatabases();

    // Generate mock recent queries - in a real app, this would come from query logs
    const mockQueries = [
      'SELECT * FROM users LIMIT 100',
      'SELECT COUNT(*) FROM orders WHERE status = \'completed\'',
      'INSERT INTO products (name, price) VALUES (\'New Product\', 29.99)',
      'UPDATE users SET last_login = NOW() WHERE id = 123',
      'SELECT * FROM analytics WHERE date >= \'2025-01-01\'',
      'DELETE FROM temp_data WHERE created_at < NOW() - INTERVAL \'30 days\'',
      'SELECT AVG(price) FROM products GROUP BY category',
      'CREATE INDEX idx_users_email ON users(email)',
      'SELECT * FROM logs ORDER BY timestamp DESC LIMIT 50',
      'UPDATE settings SET value = \'new_config\' WHERE key = \'theme\''
    ];

    const recentQueries = [];
    for (let i = 0; i < limit; i++) {
      const db = databases[Math.floor(Math.random() * databases.length)];
      const query = mockQueries[Math.floor(Math.random() * mockQueries.length)];
      const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24 hours

      recentQueries.push({
        id: `query_${i + 1}`,
        database: db.name,
        query: query,
        timestamp: timestamp.toISOString(),
        executionTime: Math.floor(Math.random() * 500) + 10, // Random execution time 10-510ms
        success: Math.random() > 0.1 // 90% success rate
      });
    }

    // Sort by timestamp (most recent first)
    recentQueries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(recentQueries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recent queries', message: error.message });
  }
});

module.exports = router;
