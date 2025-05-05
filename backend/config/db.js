// backend/config/db.js
require('dotenv').config();

// Make sure all required properties are defined and properly typed
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // This is required and must be a string
  database: process.env.DB_DATABASE,
  port: 1433, // Standard port for SQL Server
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: true // For development
  }
};

// Log the configuration (without revealing sensitive values)
console.log('Database config initialized with:');
console.log('- Server:', config.server);
console.log('- Database:', config.database);
console.log('- User:', config.user);
console.log('- Password:', Boolean(config.password) ? '[SET]' : '[MISSING]');

// Verify critical configuration
if (!config.server || typeof config.server !== 'string') {
  console.error('ERROR: Database server is missing or not a string. Check your .env file.');
  // In production, you might want to exit here with process.exit(1)
}

module.exports = config;