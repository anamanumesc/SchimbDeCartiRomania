// backend/routes/books.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const bookController = require('../controllers/bookController');
const { protect } = require('../middleware/authMiddleware');

// IMPORTANT: Ordinea rutelor contează! Rutele specifice trebuie să fie ÎNAINTE de /:id

// Get all books
router.get('/', bookController.getAllBooks);

// Get filtered books
router.get('/filtered', bookController.getFilteredBooks);

// Get filter options for dropdown menus
router.get('/filter-options', bookController.getFilterOptions);

// Get books by authenticated user - KEEPING BOTH ROUTES for backward compatibility
router.get('/user', protect, bookController.getUserBooks);
router.get('/mybooks', protect, bookController.getUserBooks);

// Upload book images
router.post('/upload-images', upload.array('images', 5), bookController.uploadBookImages);

// Add a new book - KEEPING BOTH ROUTES for backward compatibility
router.post('/', protect, bookController.addBook);
router.post('/add', protect, bookController.addBook);

// Get a specific book by ID - această rută trebuie să vină DUPĂ '/user'
router.get('/:id', bookController.getBookById);

router.get('/:id/history', bookController.getBookHistory);

router.post('/:id/review', bookController.addReview);




module.exports = router;