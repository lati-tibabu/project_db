const fs = require('fs');
const path = require('path');

/**
 * Load a simple key=value .conf file. Lines starting with # are comments.
 * Returns an object with parsed keys. Values are not further typed (all strings).
 * @param {string} filePath - Absolute or relative path to .conf file
 */
function loadConfig(filePath) {
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '..', 'config', filePath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Config file not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, 'utf8');
  const lines = raw.split(/\r?\n/);
  const config = {};

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    config[key] = value;
  }

  return config;
}

module.exports = {
  loadConfig
};
