const { DatabaseConfig, App } = require('../models');
const { encrypt, decrypt } = require('./encryption');

/**
 * Get all database configurations
 * @returns {Promise<Array>} Array of database configurations
 */
async function getDatabases() {
  const databases = await DatabaseConfig.findAll();
  
  // Decrypt passwords and convert to plain objects
  return databases.map(db => {
    const data = db.toJSON();
    return {
      ...data,
      password: decrypt(data.password)
    };
  });
}

/**
 * Add a new database configuration
 * @param {Object} database - Database configuration
 * @returns {Promise<Object>} Added database
 */
async function addDatabase(database) {
  const encryptedPassword = encrypt(database.password);
  
  const newDb = await DatabaseConfig.create({
    ...database,
    password: encryptedPassword
  });
  
  const data = newDb.toJSON();
  return {
    ...data,
    password: decrypt(data.password)
  };
}

/**
 * Update a database configuration
 * @param {string} id - Database ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object|null>} Updated database or null if not found
 */
async function updateDatabase(id, updates) {
  const db = await DatabaseConfig.findByPk(id);
  if (!db) return null;

  if (updates.password) {
    updates.password = encrypt(updates.password);
  }

  await db.update(updates);
  
  const data = db.toJSON();
  return {
    ...data,
    password: decrypt(data.password)
  };
}

/**
 * Delete a database configuration
 * @param {string} id - Database ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteDatabase(id) {
  const deletedCount = await DatabaseConfig.destroy({ where: { id } });
  return deletedCount > 0;
}

/**
 * Get a specific database configuration
 * @param {string} id - Database ID
 * @returns {Promise<Object|null>} Database configuration or null if not found
 */
async function getDatabase(id) {
  const db = await DatabaseConfig.findByPk(id);
  if (!db) return null;

  const data = db.toJSON();
  return {
    ...data,
    password: decrypt(data.password)
  };
}

/**
 * Get all apps
 * @returns {Promise<Array>} Array of app configurations
 */
async function getApps() {
  const apps = await App.findAll();
  return apps.map(app => app.toJSON());
}

/**
 * Add a new app
 * @param {Object} app - App configuration
 * @returns {Promise<Object>} Added app
 */
async function addApp(app) {
  const newApp = await App.create(app);
  return newApp.toJSON();
}

/**
 * Update an app
 * @param {string} id - App ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object|null>} Updated app or null if not found
 */
async function updateApp(id, updates) {
  const app = await App.findByPk(id);
  if (!app) return null;

  await app.update(updates);
  return app.toJSON();
}

/**
 * Delete an app
 * @param {string} id - App ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteApp(id) {
  const deletedCount = await App.destroy({ where: { id } });
  return deletedCount > 0;
}

/**
 * Get a specific app
 * @param {string} id - App ID
 * @returns {Promise<Object|null>} App configuration or null if not found
 */
async function getApp(id) {
  const app = await App.findByPk(id);
  return app ? app.toJSON() : null;
}

module.exports = {
  getDatabases,
  addDatabase,
  updateDatabase,
  deleteDatabase,
  getDatabase,
  getApps,
  addApp,
  updateApp,
  deleteApp,
  getApp
};
