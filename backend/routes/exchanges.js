// backend/routes/exchanges.js
const express = require('express');
const router = express.Router();
const exchangeController = require('../controllers/exchangeController');
const { protect } = require('../middleware/authMiddleware');

// Toate rutele necesită autentificare
router.use(protect);

// Creează o cerere de schimb
router.post('/', exchangeController.createExchangeRequest);

// Obține cererile de schimb primite
router.get('/received', exchangeController.getReceivedRequests);

// Obține cererile de schimb trimise
router.get('/sent', exchangeController.getSentRequests);

// Acceptă o cerere de schimb
router.patch('/:id/accept', exchangeController.acceptExchangeRequest);

// Respinge o cerere de schimb
router.patch('/:id/reject', exchangeController.rejectExchangeRequest);

module.exports = router;