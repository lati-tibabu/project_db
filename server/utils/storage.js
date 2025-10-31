const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('./encryption');

const STORAGE_DIR = path.join(__dirname, '../../data');
const DATABASES_FILE = path.join(STORAGE_DIR, 'databases.json');
const APPS_FILE = path.join(STORAGE_DIR, 'apps.json');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Get all database configurations
 * @returns {Array} Array of database configurations
 */
function getDatabases() {
  if (!fs.existsSync(DATABASES_FILE)) {
    return [];
  }
  
  const data = fs.readFileSync(DATABASES_FILE, 'utf8');
  if (!data.trim()) {
    return [];
  }
  
  const databases = JSON.parse(data);
  
  // Decrypt passwords
  return databases.map(db => ({
    ...db,
    password: decrypt(db.password)
  }));
}

/**
 * Save database configurations
 * @param {Array} databases - Array of database configurations
 */
function saveDatabases(databases) {
  // Encrypt passwords before saving
  const encryptedDatabases = databases.map(db => ({
    ...db,
    password: encrypt(db.password)
  }));
  
  fs.writeFileSync(DATABASES_FILE, JSON.stringify(encryptedDatabases, null, 2));
}

/**
 * Add a new database configuration
 * @param {Object} database - Database configuration
 * @returns {Object} Added database with generated ID
 */
function addDatabase(database) {
  const databases = getDatabases();
  const newDatabase = {
    id: Date.now().toString(),
    ...database,
    createdAt: new Date().toISOString()
  };
  
  databases.push(newDatabase);
  saveDatabases(databases);
  
  return newDatabase;
}

/**
 * Update a database configuration
 * @param {string} id - Database ID
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated database or null if not found
 */
function updateDatabase(id, updates) {
  const databases = getDatabases();
  const index = databases.findIndex(db => db.id === id);
  
  if (index === -1) {
    return null;
  }
  
  databases[index] = {
    ...databases[index],
    ...updates,
    id: databases[index].id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  saveDatabases(databases);
  return databases[index];
}

/**
 * Delete a database configuration
 * @param {string} id - Database ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteDatabase(id) {
  const databases = getDatabases();
  const filteredDatabases = databases.filter(db => db.id !== id);
  
  if (filteredDatabases.length === databases.length) {
    return false;
  }
  
  saveDatabases(filteredDatabases);
  return true;
}

/**
 * Get a specific database configuration
 * @param {string} id - Database ID
 * @returns {Object|null} Database configuration or null if not found
 */
function getDatabase(id) {
  const databases = getDatabases();
  return databases.find(db => db.id === id) || null;
}

/**
 * Get all apps
 * @returns {Array} Array of app configurations
 */
function getApps() {
  if (!fs.existsSync(APPS_FILE)) {
    return [];
  }
  
  const data = fs.readFileSync(APPS_FILE, 'utf8');
  if (!data.trim()) {
    return [];
  }
  
  return JSON.parse(data);
}

/**
 * Save app configurations
 * @param {Array} apps - Array of app configurations
 */
function saveApps(apps) {
  fs.writeFileSync(APPS_FILE, JSON.stringify(apps, null, 2));
}

/**
 * Add a new app
 * @param {Object} app - App configuration
 * @returns {Object} Added app with generated ID
 */
function addApp(app) {
  const apps = getApps();
  const newApp = {
    id: Date.now().toString(),
    ...app,
    createdAt: new Date().toISOString()
  };
  
  apps.push(newApp);
  saveApps(apps);
  
  return newApp;
}

/**
 * Update an app
 * @param {string} id - App ID
 * @param {Object} updates - Updates to apply
 * @returns {Object|null} Updated app or null if not found
 */
function updateApp(id, updates) {
  const apps = getApps();
  const index = apps.findIndex(app => app.id === id);
  
  if (index === -1) {
    return null;
  }
  
  apps[index] = {
    ...apps[index],
    ...updates,
    id: apps[index].id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString()
  };
  
  saveApps(apps);
  return apps[index];
}

/**
 * Delete an app
 * @param {string} id - App ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteApp(id) {
  const apps = getApps();
  const filteredApps = apps.filter(app => app.id !== id);
  
  if (filteredApps.length === apps.length) {
    return false;
  }
  
  saveApps(filteredApps);
  return true;
}

/**
 * Get a specific app
 * @param {string} id - App ID
 * @returns {Object|null} App configuration or null if not found
 */
function getApp(id) {
  const apps = getApps();
  return apps.find(app => app.id === id) || null;
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
