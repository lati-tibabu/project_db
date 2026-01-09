const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const DatabaseConfig = sequelize.define('DatabaseConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  port: {
    type: DataTypes.INTEGER,
    defaultValue: 5432
  },
  user: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.TEXT, // Using TEXT to store encrypted password
    allowNull: false
  },
  database: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ssl: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  create_on_server: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const App = sequelize.define('App', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  databaseId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  components: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
});

// Relationships
DatabaseConfig.hasMany(App, { foreignKey: 'databaseId', as: 'apps' });
App.belongsTo(DatabaseConfig, { foreignKey: 'databaseId', as: 'dbConfig' });

module.exports = {
  sequelize,
  DatabaseConfig,
  App
};
