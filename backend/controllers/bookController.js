// backend/controllers/bookController.js (beginning part)
const { executeQuery, mssql } = require('../services/database');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v1: uuidv1 } = require('uuid');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

// Simple error handler
const handleError = (res, error, message) => {
  console.error(`${message}:`, error);
  res.status(500).json({ error: message });
};

// Get all books
exports.getAllBooks = async (req, res) => {
  try {
    const books = await executeQuery(async (pool) => {
      const result = await pool.request().query(`
        SELECT id, userId, title, author, genre, condition, county, city, imageUrl
        FROM Books 
        ORDER BY id DESC
      `);
      
      // Format data to match frontend expectations
      return result.recordset.map(book => {
        return {
          id: book.id,
          userId: book.userId,
          title: book.title,
          author: book.author,
          genre: book.genre,
          condition: book.condition,
          county: book.county,
          city: book.city,
          imageUrl: book.imageUrl,
          // Convert single imageUrl to array as expected by frontend
          imageUrls: book.imageUrl ? [book.imageUrl] : []
        };
      });
    });
    
    res.json(books);
  } catch (error) {
    handleError(res, error, 'Error fetching books');
  }
};

// Get book by ID
exports.getBookById = async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    
    if (isNaN(bookId)) {
      return res.status(400).json({ error: 'Invalid book ID' });
    }
    
    const book = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('id', mssql.Int, bookId)
        .query(`
          SELECT b.*, u.name as userName, u.email as userEmail
          FROM Books b
          JOIN Users u ON b.userId = u.id
          WHERE b.id = @id
        `);
      
      return result.recordset[0];
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error fetching book details:', error);
    res.status(500).json({ error: 'Error fetching book details' });
  }
};

// Get books with optional filters
exports.getFilteredBooks = async (req, res) => {
  try {
    // Extract filter parameters from query string
    const { county, city, genre, condition } = req.query;
    
    const books = await executeQuery(async (pool) => {
      // Start building the SQL query
      let query = `
        SELECT id, userId, title, author, genre, condition, county, city, imageUrl
        FROM Books 
        WHERE 1=1
      `;
      
      // Create a request object
      const request = pool.request();
      
      // Add filters if provided
      if (county && county !== 'all') {
        query += ` AND county = @county`;
        request.input('county', mssql.NVarChar, county);
      }
      
      if (city && city !== 'all') {
        query += ` AND city = @city`;
        request.input('city', mssql.NVarChar, city);
      }
      
      if (genre && genre !== 'all') {
        query += ` AND genre = @genre`;
        request.input('genre', mssql.NVarChar, genre);
      }
      
      if (condition && condition !== 'all') {
        query += ` AND condition = @condition`;
        request.input('condition', mssql.NVarChar, condition);
      }
      
      // Add ordering
      query += ` ORDER BY id DESC`;
      
      // Execute the query
      const result = await request.query(query);
      
      // Process the results
      return result.recordset.map(book => {
        return {
          id: book.id,
          userId: book.userId,
          title: book.title,
          author: book.author,
          genre: book.genre,
          condition: book.condition,
          county: book.county,
          city: book.city,
          imageUrl: book.imageUrl,
          imageUrls: book.imageUrl ? [book.imageUrl] : []
        };
      });
    });
    
    res.json(books);
  } catch (error) {
    handleError(res, error, 'Error fetching filtered books');
  }
};

// Get available filter options (for dropdowns)
exports.getFilterOptions = async (req, res) => {
  try {
    const filterOptions = await executeQuery(async (pool) => {
      // Get distinct counties
      const countiesResult = await pool.request().query('SELECT DISTINCT county FROM Books ORDER BY county');
      
      // Get distinct cities
      const citiesResult = await pool.request().query('SELECT DISTINCT city, county FROM Books ORDER BY county, city');
      
      // Get distinct genres
      const genresResult = await pool.request().query('SELECT DISTINCT genre FROM Books ORDER BY genre');
      
      // Get distinct conditions
      const conditionsResult = await pool.request().query('SELECT DISTINCT condition FROM Books ORDER BY condition');
      
      // Build a cities map by county
      const citiesByCounty = {};
      citiesResult.recordset.forEach(item => {
        if (!citiesByCounty[item.county]) {
          citiesByCounty[item.county] = [];
        }
        if (item.city && !citiesByCounty[item.county].includes(item.city)) {
          citiesByCounty[item.county].push(item.city);
        }
      });
      
      // Prepare the response
      return {
        counties: countiesResult.recordset.map(item => item.county),
        cities: citiesByCounty,
        genres: genresResult.recordset.map(item => item.genre),
        conditions: conditionsResult.recordset.map(item => item.condition)
      };
    });
    
    res.json(filterOptions);
  } catch (error) {
    handleError(res, error, 'Error fetching filter options');
  }
};

// Upload book images
exports.uploadBookImages = async (req, res) => {
  try {
    // Check for AZURE_STORAGE_CONNECTION_STRING
    if (!connectionString) {
      console.error('AZURE_STORAGE_CONNECTION_STRING is not set in environment variables');
      return res.status(500).json({ 
        error: 'Storage configuration missing. Please set AZURE_STORAGE_CONNECTION_STRING in your .env file.' 
      });
    }
    
    // Check for AZURE_STORAGE_CONTAINER_NAME
    if (!containerName) {
      console.error('AZURE_STORAGE_CONTAINER_NAME is not set in environment variables');
      return res.status(500).json({ 
        error: 'Storage container missing. Please set AZURE_STORAGE_CONTAINER_NAME in your .env file.' 
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }
    
    // Limit number of images to 5
    if (req.files.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 images allowed' });
    }
    
    console.log(`Processing ${req.files.length} image(s)...`);
    
    // We'll just keep the first image URL for now since our database only supports one
    let imageUrl = null;
    const imageUrls = [];
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    try {
      await containerClient.createIfNotExists();
      console.log(`Container '${containerName}' created or already exists`);
    } catch (err) {
      console.error(`Error creating container: ${err.message}`);
      return res.status(500).json({ error: 'Storage configuration error' });
    }
    
    // Upload each file
    for (const file of req.files) {
      try {
        if (!file.mimetype.startsWith('image/')) {
          console.warn(`Skipping non-image file: ${file.originalname}`);
          continue;
        }
        
        // Generate unique blob name
        const blobName = `book-image-${uuidv1()}-${file.originalname.replace(/\s+/g, '_')}`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        
        console.log(`Uploading file: ${file.originalname} (${file.size} bytes)`);
        
        // Upload file to Azure Blob Storage
        await blockBlobClient.uploadData(file.buffer, { 
          blobHTTPHeaders: { blobContentType: file.mimetype } 
        });
        
        // Add the URL to our array
        const url = blockBlobClient.url;
        imageUrls.push(url);
        
        // Remember the first image URL for the DB
        if (imageUrl === null) {
          imageUrl = url;
        }
        
        console.log(`Upload successful: ${url}`);
      } catch (fileErr) {
        console.error(`Error uploading file ${file.originalname}:`, fileErr);
        // Continue with other files even if one fails
      }
    }
    
    if (imageUrls.length === 0) {
      return res.status(500).json({ error: 'Failed to upload any images' });
    }
    
    // Return both single imageUrl and array of all imageUrls
    // Frontend will use the array, backend will store just the first one
    res.status(200).json({ 
      imageUrl: imageUrl,
      imageUrls: imageUrls 
    });
  } catch (error) {
    handleError(res, error, 'Error uploading images');
  }
};

// Add a new book
exports.addBook = async (req, res) => {
  try {
    // Validate required fields
    const { title, author, genre, condition, county, city, imageUrls } = req.body;
    
    if (!title || !author || !genre || !condition || !county || !city) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }
    
    // Use the first imageUrl for the database
    const imageUrl = imageUrls[0];
    
    console.log('Adding new book:', { title, author, genre });
    
    // Utilizează ID-ul utilizatorului autentificat 
    const userId = req.user.id;
    
    const newBookId = await executeQuery(async (pool) => {
      const request = pool.request();
      
      // Prepare query parameters
      request.input('userId', mssql.Int, userId);
      request.input('title', mssql.NVarChar(255), title);
      request.input('author', mssql.NVarChar(255), author);
      request.input('genre', mssql.NVarChar(255), genre);
      request.input('condition', mssql.NVarChar(255), condition);
      request.input('county', mssql.NVarChar(255), county);
      request.input('city', mssql.NVarChar(255), city);
      request.input('imageUrl', mssql.NVarChar(255), imageUrl);
      
      // Execute query
      const result = await request.query(`
        INSERT INTO Books (userId, title, author, genre, condition, county, city, imageUrl)
        VALUES (@userId, @title, @author, @genre, @condition, @county, @city, @imageUrl);
        SELECT SCOPE_IDENTITY() AS id;
      `);
      
      return result.recordset[0].id;
    });
    
    console.log(`Book added successfully with ID: ${newBookId}`);
    
    res.status(201).json({ 
      id: newBookId, 
      message: 'Book added successfully!' 
    });
  } catch (error) {
    handleError(res, error, 'Error adding book');
  }
};

// În backend/controllers/bookController.js adaugă funcția getUserBooks
exports.getUserBooks = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching books for user ID:', userId);
    
    const books = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('userId', mssql.Int, userId)
        .query('SELECT * FROM Books WHERE userId = @userId');
      
      console.log(`Found ${result.recordset.length} books for user ID: ${userId}`);
      return result.recordset;
    });
    
    res.status(200).json(books);
  } catch (error) {
    console.error('Error getting user books:', error);
    res.status(500).json({ error: 'Error retrieving user books' });
  }
};
// Get history of a book
exports.getBookHistory = async (req, res) => {
  try {
    const bookId = parseInt(req.params.id);
    if (isNaN(bookId)) {
      return res.status(400).json({ error: 'Invalid book ID' });
    }

    const history = await executeQuery(async (pool) => {
      const result = await pool.request()
        .input('bookId', mssql.Int, bookId)
        .query(`
          SELECT u.name AS username, h.startDate, h.endDate, h.review, h.rating
          FROM BookHistory h
          JOIN Users u ON u.id = h.userId
          WHERE h.bookId = @bookId
          ORDER BY h.startDate DESC
        `);
      return result.recordset;
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching book history:', error);
    res.status(500).json({ error: 'Error fetching book history' });
  }
};
exports.addReview = async (req, res) => {
  const { userId, rating, review } = req.body;
  const bookId = parseInt(req.params.id);

  if (!userId || rating == null || !bookId) {
    return res.status(400).json({ error: 'Date incomplete pentru recenzie.' });
  }

  try {
    await executeQuery(async (pool) => {
      const checkRequest = pool.request();
      checkRequest.input('bookId', mssql.Int, bookId);
      checkRequest.input('userId', mssql.Int, userId);

      const existing = await checkRequest.query(
        `SELECT * FROM BookHistory WHERE bookId = @bookId AND userId = @userId`
      );

      const request = pool.request();
      request.input('bookId', mssql.Int, bookId);
      request.input('userId', mssql.Int, userId);
      request.input('rating', mssql.Int, rating);
      request.input('review', mssql.NVarChar(1000), review);

      if (existing.recordset.length === 0) {
        await request.query(`
          INSERT INTO BookHistory (bookId, userId, startDate, review, rating)
          VALUES (@bookId, @userId, GETDATE(), @review, @rating);
        `);
      } else {
        await request.query(`
          UPDATE BookHistory
          SET review = @review, rating = @rating
          WHERE bookId = @bookId AND userId = @userId;
        `);
      }
    });

    res.status(200).json({ message: 'Recenzie salvată cu succes.' });
  } catch (error) {
    console.error('Eroare la salvarea recenziei:', error);
    res.status(500).json({ error: 'Eroare la salvarea recenziei' });
  }
};


