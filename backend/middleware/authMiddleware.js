const jwt = require('jsonwebtoken');
const { executeQuery, mssql } = require('../services/database');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token.substring(0, 15) + '...');
    }

    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully for user ID:', decoded.id);
      
      // Get user from database
      const user = await executeQuery(async (pool) => {
        const result = await pool.request()
          .input('id', mssql.Int, decoded.id)
          .query('SELECT id, name, email FROM Users WHERE id = @id');
        return result.recordset[0];
      });

      if (!user) {
        console.log('User not found in database for ID:', decoded.id);
        return res.status(401).json({ error: 'User not found' });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};