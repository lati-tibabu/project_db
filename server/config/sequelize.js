const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const dbHost = process.env.APP_DB_HOST || 'localhost';
const dbPort = process.env.APP_DB_PORT || 5432;
const dbName = process.env.APP_DB_NAME || 'project_db';
const dbUser = process.env.APP_DB_USER || 'postgres';
const dbPassword = process.env.APP_DB_PASSWORD || 'password';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
