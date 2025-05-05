// backend/services/database.js
const mssql = require('mssql');
const config = require('../config/db');

/**
 * Execute a database query with proper connection handling
 * @param {Function} callback - Function that gets a pool and executes queries
 * @returns {Promise} Promise that resolves with the query result
 */
async function executeQuery(callback) {
  let pool;
  try {
    // Centralized error handling for database connection
    if (!config.server || typeof config.server !== 'string') {
      throw new Error('Database server configuration is invalid');
    }
    
    pool = await mssql.connect(config);
    return await callback(pool);
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error closing connection pool:', err.message);
      }
    }
  }
}

module.exports = { executeQuery, mssql };