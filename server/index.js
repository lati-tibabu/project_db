const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const dotenv = require('dotenv');
const databaseRoutes = require('./routes/database');
const dataRoutes = require('./routes/data');
const appsRoutes = require('./routes/apps');
const authRoutes = require('./routes/auth');
const dynamicApiRoutes = require('./routes/dynamic-api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const { sequelize } = require('./models');

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/databases', databaseRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/apps', appsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dynamic', dynamicApiRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', message: 'Server is running', database: { connected: true } });
  } catch (error) {
    res.json({ status: 'ok', message: 'Server is running', database: { connected: false, error: error.message } });
  }
});

// Error handling middleware
// Sync database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
