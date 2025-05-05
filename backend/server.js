// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bookRoutes = require('./routes/books');
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables check
console.log('Environment variables check:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_USER:', Boolean(process.env.DB_USER));
console.log('DB_DATABASE:', Boolean(process.env.DB_DATABASE));
console.log('PORT:', process.env.PORT);
console.log('DB_PASSWORD set:', Boolean(process.env.DB_PASSWORD));
console.log('AZURE_STORAGE_CONNECTION_STRING set:', Boolean(process.env.AZURE_STORAGE_CONNECTION_STRING));
console.log('AZURE_STORAGE_CONTAINER_NAME set:', Boolean(process.env.AZURE_STORAGE_CONTAINER_NAME));

// Routes with API prefix
app.use('/api/books', bookRoutes);  // Change this line
app.use('/api/auth', authRoutes);   // Change this line

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// 404 Error handler
app.use((req, res) => {
  res.status(404).send("Sorry, can't find that route!");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});