const express = require('express');
const bcrypt = require('bcrypt');
const storage = require('../utils/storage');
const { executeQuery } = require('../utils/database');

const router = express.Router();

// Login to an app
router.post('/login/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get the app's database config
    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }

    const dbConfig = await storage.getDatabase(app.databaseId);
    if (!dbConfig) {
      return res.status(404).json({ error: 'Database not found' });
    }

    // Query the users table
    const query = 'SELECT id, username, password_hash, email, full_name, role, is_active FROM users WHERE username = $1';
    const result = await executeQuery(dbConfig, query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await executeQuery(dbConfig, 'UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Set session
    req.session.authenticatedApps = req.session.authenticatedApps || {};
    req.session.authenticatedApps[appId] = {
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    };

    res.json({ 
      message: 'Login successful', 
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Logout from an app
router.post('/logout/:appId', (req, res) => {
  const { appId } = req.params;
  
  if (req.session.authenticatedApps) {
    delete req.session.authenticatedApps[appId];
  }
  
  res.json({ message: 'Logout successful' });
});

// Check authentication status for an app
router.get('/status/:appId', (req, res) => {
  const { appId } = req.params;
  
  const isAuthenticated = req.session.authenticatedApps && req.session.authenticatedApps[appId];
  
  res.json({
    authenticated: !!isAuthenticated,
    user: isAuthenticated ? { username: req.session.authenticatedApps[appId].username } : null
  });
});

// Change password for current user in an app
router.post('/change-password/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    // Get app and database
    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    const userId = req.session.authenticatedApps[appId].userId;

    // Verify current password
    const query = 'SELECT password_hash FROM users WHERE id = $1';
    const result = await executeQuery(dbConfig, query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const updateQuery = 'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2';
    await executeQuery(dbConfig, updateQuery, [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password', message: error.message });
  }
});

// Get all users for an app (admin only)
router.get('/users/:appId', async (req, res) => {
  try {
    const { appId } = req.params;

    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.session.authenticatedApps[appId].role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get app and database
    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    const query = 'SELECT id, username, email, full_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC';
    const result = await executeQuery(dbConfig, query);

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users', message: error.message });
  }
});

// Create new user (admin only)
router.post('/users/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const { username, password, email, fullName, role } = req.body;

    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.session.authenticatedApps[appId].role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get app and database
    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const insertQuery = `
      INSERT INTO users (username, password_hash, email, full_name, role) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, username, email, full_name, role, is_active, created_at
    `;
    const result = await executeQuery(dbConfig, insertQuery, [username, hashedPassword, email, fullName, role || 'viewer']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // unique constraint violation
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user', message: error.message });
    }
  }
});

// Update user (admin only)
router.put('/users/:appId/:userId', async (req, res) => {
  try {
    const { appId, userId } = req.params;
    const { email, fullName, role, isActive } = req.body;

    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.session.authenticatedApps[appId].role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get app and database
    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    // Update user
    const updateQuery = `
      UPDATE users 
      SET email = $1, full_name = $2, role = $3, is_active = $4, updated_at = NOW() 
      WHERE id = $5 
      RETURNING id, username, email, full_name, role, is_active, updated_at
    `;
    const result = await executeQuery(dbConfig, updateQuery, [email, fullName, role, isActive, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:appId/:userId', async (req, res) => {
  try {
    const { appId, userId } = req.params;

    if (!req.session.authenticatedApps || !req.session.authenticatedApps[appId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = req.session.authenticatedApps[appId].role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Prevent deleting self
    const currentUserId = req.session.authenticatedApps[appId].userId;
    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get app and database
    const apps = await storage.getApps();
    const app = apps.find(a => a.id === appId);
    const dbConfig = await storage.getDatabase(app.databaseId);

    // Delete user
    const deleteQuery = 'DELETE FROM users WHERE id = $1';
    const result = await executeQuery(dbConfig, deleteQuery, [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

module.exports = router;