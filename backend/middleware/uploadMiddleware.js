// backend/middleware/uploadMiddleware.js
const multer = require('multer');

// Memory storage (buffer) - optimal for direct upload to Blob Storage
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

module.exports = upload;