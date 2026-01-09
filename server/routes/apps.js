const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const storage = require('../utils/storage');
const { createTable, executeQuery } = require('../utils/database');

// List apps
router.get('/', async (req, res) => {
  try {
    const apps = await storage.getApps();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list apps', message: err.message });
  }
});

// Create a new app
router.post('/', async (req, res) => {
  try {
    const {
      name,
      databaseId,
      description,
      authEnabled,
      icon,
      theme,
      publicAccess
    } = req.body;

    if (!name || !databaseId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'databaseId']
      });
    }

    const newApp = await storage.addApp({
      name,
      databaseId,
      description: description || '',
      authEnabled: authEnabled !== undefined ? authEnabled : false,
      icon: icon || 'dashboard',
      theme: theme || 'default',
      publicAccess: publicAccess !== undefined ? publicAccess : false,
      components: []
    });

    // Only create users table if authentication is enabled
    if (authEnabled) {
      try {
        const dbConfig = await storage.getDatabase(databaseId);
        if (dbConfig) {
          // Create users table
          await createTable(dbConfig, 'users', [
            { name: 'id', type: 'SERIAL', isPrimaryKey: true },
            { name: 'username', type: 'VARCHAR(255)', nullable: false },
            { name: 'password_hash', type: 'VARCHAR(255)', nullable: false },
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'full_name', type: 'VARCHAR(255)' },
            { name: 'role', type: 'VARCHAR(50)', defaultValue: 'viewer' },
            { name: 'is_active', type: 'BOOLEAN', defaultValue: 'true' },
            { name: 'last_login', type: 'TIMESTAMP' },
            { name: 'created_at', type: 'TIMESTAMP', defaultValue: 'raw:NOW()' },
            { name: 'updated_at', type: 'TIMESTAMP', defaultValue: 'raw:NOW()' }
          ]);

          // Create unique index on username
          await executeQuery(dbConfig, 'CREATE UNIQUE INDEX idx_users_username ON users(username)');
          await executeQuery(dbConfig, 'CREATE UNIQUE INDEX idx_users_email ON users(email)');

          // Insert default admin user with more details
          const hashedPassword = await bcrypt.hash('admin', 10);
          await executeQuery(dbConfig, 
            'INSERT INTO users (username, password_hash, email, full_name, role) VALUES ($1, $2, $3, $4, $5)',
            ['admin', hashedPassword, 'admin@example.com', 'System Administrator', 'admin']
          );
        }
      } catch (dbError) {
        console.error('Failed to setup users table:', dbError);
        // Don't fail the app creation if table creation fails
      }
    }

    res.status(201).json(newApp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create app', message: error.message });
  }
});

// Update app
router.put('/:id', async (req, res) => {
  try {
    const updated = await storage.updateApp(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'App not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update app', message: err.message });
  }
});

// Delete app
router.delete('/:id', async (req, res) => {
  try {
    const ok = await storage.deleteApp(req.params.id);
    if (!ok) return res.status(404).json({ error: 'App not found' });
    res.json({ message: 'App deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete app', message: err.message });
  }
});

module.exports = router;
