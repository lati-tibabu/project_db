const express = require('express');
const router = express.Router();
const storage = require('../utils/storage');

// List apps
router.get('/', (req, res) => {
  try {
    const apps = storage.getApps();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list apps', message: err.message });
  }
});

// Create a new app
router.post('/', (req, res) => {
  try {
    const { name, databaseId, description } = req.body;

    if (!name || !databaseId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'databaseId']
      });
    }

    const newApp = storage.addApp({
      name,
      databaseId,
      description: description || '',
      components: []
    });

    res.status(201).json(newApp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create app', message: error.message });
  }
});

// Update app
router.put('/:id', (req, res) => {
  try {
    const updated = storage.updateApp(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'App not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update app', message: err.message });
  }
});

// Delete app
router.delete('/:id', (req, res) => {
  try {
    const ok = storage.deleteApp(req.params.id);
    if (!ok) return res.status(404).json({ error: 'App not found' });
    res.json({ message: 'App deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete app', message: err.message });
  }
});

module.exports = router;
