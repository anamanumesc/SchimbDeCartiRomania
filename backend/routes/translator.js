// backend/routes/translator.js
const express = require('express');
const router = express.Router();
const { translateText } = require('../controllers/translatorController');

// RUTA: POST /api/translate
router.post('/translate', translateText);

module.exports = router;
