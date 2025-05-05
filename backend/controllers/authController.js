const { executeQuery, mssql } = require('../services/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('email', mssql.NVarChar, email)
        .query('SELECT * FROM Users WHERE email = @email');
      return result.recordset[0];
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('email', mssql.NVarChar, email)
        .input('password', mssql.NVarChar, hashedPassword)
        .input('name', mssql.NVarChar, name)
        .input('registrationDate', mssql.Date, new Date())
        .query(`
          INSERT INTO Users (email, password, name, registrationDate)
          VALUES (@email, @password, @name, @registrationDate);
          SELECT SCOPE_IDENTITY() AS id;
        `);
      return result.recordset[0];
    });

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      id: newUser.id,
      email,
      name,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('email', mssql.NVarChar, email)
        .query('SELECT * FROM Users WHERE email = @email');
      return result.recordset[0];
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('id', mssql.Int, req.user.id)
        .query('SELECT id, email, name FROM Users WHERE id = @id');
      return result.recordset[0];
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update profile
exports.updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;

    await executeQuery(async (pool) => {
      await pool.request()
        .input('id', mssql.Int, req.user.id)
        .input('name', mssql.NVarChar, name)
        .query('UPDATE Users SET name = @name WHERE id = @id');
    });

    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  res.json({ success: true, message: 'Token is valid' });
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('email', mssql.NVarChar, email)
        .query('SELECT id FROM Users WHERE email = @email');
      return result.recordset[0];
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await executeQuery(async (pool) => {
      await pool.request()
        .input('id', mssql.Int, user.id)
        .input('resetToken', mssql.NVarChar, resetTokenHash)
        .input('resetTokenExpiry', mssql.DateTime, resetTokenExpiry)
        .query(`
          UPDATE Users 
          SET resetToken = @resetToken, resetTokenExpiry = @resetTokenExpiry 
          WHERE id = @id
        `);
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const logicAppUrl = process.env.LOGICAPP_URL;

    await axios.post(logicAppUrl, {
      to: email,
      subject: 'Password Reset Request',
      body: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
    });

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('resetToken', mssql.NVarChar, resetTokenHash)
        .query(`
          SELECT id FROM Users 
          WHERE resetToken = @resetToken AND resetTokenExpiry > GETDATE()
        `);
      return result.recordset[0];
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await executeQuery(async (pool) => {
      await pool.request()
        .input('id', mssql.Int, user.id)
        .input('password', mssql.NVarChar, hashedPassword)
        .query(`
          UPDATE Users 
          SET password = @password, resetToken = NULL, resetTokenExpiry = NULL 
          WHERE id = @id
        `);
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
